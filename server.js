import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 5500;

app.use(express.json());
app.use(express.static("public"));

// File penyimpan riwayat view per user
const viewHistoryFile = "./viewHistory.json";
if (!fs.existsSync(viewHistoryFile)) fs.writeFileSync(viewHistoryFile, "{}");

// Fungsi bantu baca/tulis JSON
function readJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}
function writeJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
}

// 🔹 Endpoint penambah view
app.post("/add-view", async (req, res) => {
    const { key, uid } = req.body; // key adalah judul
    if (!key || !uid) {
        return res.json({ success: false, message: "Data tidak lengkap" });
    }

    try {
        // 🔍 Baca dataMetaComic.json
        const dataMeta = readJSON("./public/libs/dataMetaComic.json");

        // Cari dataPath berdasarkan judul
        let dataPath = null;
        for (const itemKey in dataMeta) {
            const comicData = readJSON(path.join("public", dataMeta[itemKey].data));
            if (comicData.judul === key) {
                dataPath = dataMeta[itemKey].data;
                break;
            }
        }

        if (!dataPath) {
            return res.json({ success: false, message: `Data untuk judul '${key}' tidak ditemukan di dataMetaComic.json` });
        }

        // Pastikan file target ada
        const absPath = path.join("public", dataPath);
        if (!fs.existsSync(absPath)) {
            return res.json({ success: false, message: `File target '${dataPath}' tidak ditemukan` });
        }

        const dataView = readJSON(absPath);
        const history = readJSON(viewHistoryFile);

        // Inisialisasi properti view jika tidak ada
        if (!dataView.hasOwnProperty("view")) {
            dataView.view = 0;
        }

        // Inisialisasi history user
        if (!history[uid]) history[uid] = {};
        if (!history[uid][key]) history[uid][key] = 0;

        // 🔒 Maksimum 5x per akun per item
        if (history[uid][key] >= 5) {
            return res.json({ success: false, message: "Sudah mencapai batas 5x untuk item ini" });
        }

        // ✅ Tambah view
        history[uid][key]++;
        dataView.view++;

        // Simpan perubahan
        writeJSON(absPath, dataView);
        writeJSON(viewHistoryFile, history);

        res.json({ success: true, total: dataView.view });
    } catch (err) {
        console.error("❌ Error server:", err);
        res.json({ success: false, message: "Terjadi kesalahan server" });
    }
});

app.listen(PORT, () => console.log(`🚀 Server berjalan di http://localhost:${PORT}`));