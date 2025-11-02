import express from "express";
import dayjs from "dayjs";
import fs from "fs";
import path from "path";
import timezone from "dayjs/plugin/timezone.js";
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import localizedFormat from "dayjs/plugin/localizedFormat.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.tz.setDefault("Asia/Jakarta");

const app = express();
const DATA_PATH = "./public/dataMetaComic.json";
const PUBLIC_DIR = "./public/"; // Direktori publik untuk path relatif

const bulanMap = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
};

function parseTanggal(tanggal, bulan, tahun) {
  const d = parseInt(tanggal) || 1;
  const m = bulanMap[bulan?.toLowerCase()] || parseInt(bulan) || 1;
  const y = parseInt(tahun) || dayjs().year();
  return dayjs.tz(`${y}-${m}-${d}`, "Asia/Jakarta");
}

/**
 * Fungsi pembantu untuk membaca data komik dari jalur file yang diberikan.
 * @param {string} relativePath Jalur relatif ke zDataID.json dari root public.
 * @returns {object|null} Data komik atau null jika gagal.
 */
function readComicData(relativePath) {
    // Pastikan path ada di dalam direktori publik
    const fullPath = path.join(PUBLIC_DIR, relativePath);
    if (!fs.existsSync(fullPath)) {
        console.error("❌ File tidak ditemukan:", fullPath);
        return null;
    }
    try {
        const rawData = fs.readFileSync(fullPath, "utf-8");
        return JSON.parse(rawData);
    } catch (err) {
        console.error("❌ Gagal baca/parse:", fullPath, err.message);
        return null;
    }
}

// === API POPULER ===
app.get("/api/populer", async (req, res) => {
  try {
    const metaRaw = fs.readFileSync(DATA_PATH, "utf-8");
    const metaData = JSON.parse(metaRaw);
    const now = dayjs().tz("Asia/Jakarta");

    const results = [];

    for (const key in metaData) {
      const entry = metaData[key];
      // Menggunakan field 'judul' dari metaData untuk menemukan jalur ke zDataID.json
      const zData = readComicData(entry.judul); 

      if (zData) {
        const date = parseTanggal(zData.tanggal, zData.bulan, zData.tahun);
        const sameWeek = date.week() === now.week() && date.year() === now.year();
        const sameMonth = date.month() === now.month() && date.year() === now.year();

        results.push({
          id: key,
          judul: zData.judul,
          sinopsis: zData.sinopsis,
          tanggal_penuh: date.format("dddd, D MMMM YYYY"),
          gambar: zData.gambar, // Ini sudah path relatif dari public dir
          status: zData.status,
          populer_minggu_ini: sameWeek,
          populer_bulan_ini: sameMonth,
          link: zData.link
        });
      }
    }

    res.json({
      zona_waktu: "Asia/Jakarta",
      sekarang: now.format("dddd, D MMMM YYYY HH:mm"),
      total_komik: results.length,
      populer_minggu_ini: results.filter((r) => r.populer_minggu_ini),
      populer_bulan_ini: results.filter((r) => r.populer_bulan_ini),
      semua_data: results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memproses dataMetaComic.json" });
  }
});

// === API SCROLL 1 ===
app.get("/api/scroll1", (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const batchSize = parseInt(req.query.batchSize) || 10;

    const metaRaw = fs.readFileSync(DATA_PATH, "utf-8");
    const metaData = JSON.parse(metaRaw);

    const keys = Object.keys(metaData);
    const totalPages = Math.ceil(keys.length / batchSize);

    const start = (page - 1) * batchSize;
    const end = start + batchSize;
    const slicedKeys = keys.slice(start, end);

    // Ambil data lengkap untuk setiap item dalam batch
    const batch = slicedKeys.map((key) => {
        const metaItem = metaData[key];
        const zData = readComicData(metaItem.judul); // Baca file JSON target
        if (zData) {
            // Gabungkan ID dan deskripsi tambahan
            return {
                id: key,
                deskripsi: metaItem.deskripsi, // Ambil deskripsi dari meta json (jika ada)
                ...zData // Timpa dengan data lengkap dari zDataID.json
            };
        }
        return null;
    }).filter(item => item !== null); // Hapus item yang gagal dimuat

    res.json({
      halaman: page,
      total_halaman: totalPages,
      data: batch
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal memuat data scroll" });
  }
});

app.use(express.static("public"));

app.listen(3000, () => console.log("🚀 Server berjalan di http://localhost:3000"));
