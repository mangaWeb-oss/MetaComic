/* =========================================
   📜 SCROLL COMPLETED (Fixed & Cached Loader)
   🔹 Ambil data via dataMetaComic.json -> entry.data
   🔹 Cache hasil (dataCacheMX) biar gak fetch double
   🔹 Tampilkan hanya status: "completed"
   🔹 Urut: terbaru (tahun → bulan → tanggal)
   🔹 Judul (h4) dibatasi 20 karakter + tooltip judul penuh
   🔹 Namespace MX supaya aman dari bentrok
========================================= */

const PATH_DATA_MX = 'libs/dataMetaComic.json';
const BATCH_MX = 10;

// cache & state
let dataCacheMX = [];        // berisi seluruh item yang valid (completed) sudah diproses
let indexMX = 0;
let loadingMX = false;       // untuk mencegah multi-load
let fetchingMetaMX = false;  // untuk mencegah duplicate meta fetch

const bulanRefMX = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
};

// helper fetch JSON
async function fetchJSONMX(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (err) {
    console.warn("⚠️ Gagal fetch JSON:", path, err.message);
    return null;
  }
}

// potong teks dengan ellipsis
function potongMX(teks, max) {
  if (!teks) return "";
  return teks.length > max ? teks.substring(0, max) + "..." : teks;
}

// hitung key tanggal untuk sorting
function dateKeyMX(item) {
  const th = parseInt(item.tahun || 0) || 0;
  const bl = (item.bulan || "").toLowerCase();
  const bm = bulanRefMX[bl] || 0;
  const tg = parseInt(item.tanggal || 0) || 0;
  return (th * 10000) + (bm * 100) + tg;
}

// load & cache semua data (sekarang mengikuti contoh loadData1)
async function loadAllDataMX() {
  if (fetchingMetaMX) return; // already loading
  fetchingMetaMX = true;

  try {
    const meta = await fetchJSONMX(PATH_DATA_MX);
    if (!meta) {
      fetchingMetaMX = false;
      return;
    }

    // ambil semua paths dari meta
    const entries = Object.values(meta)
      .map(e => e && e.data)
      .filter(Boolean);

    // fetch tiap file dataComic.json
    const promises = entries.map(async path => {
      const comic = await fetchJSONMX(path);
      if (!comic) return null;

      // apabila struktur file memakai lokal bahasa (mis. d.id atau langsung), ambil langsung
      const d = (typeof comic === 'object' && comic) ? comic : null;
      if (!d) return null;

      // normalisasi fields
      const item = {
        jd: d.judul || d.title || "Tanpa Judul",
        lk: d.link || "#",
        gm: d.gambar || d.cover || "res/raw/default.jpg",
        st: (d.status || "").toLowerCase(),
        tahun: parseInt(d.tahun || 0) || 0,
        bulan: (d.bulan || "").toLowerCase() || "",
        tanggal: parseInt(d.tanggal || 0) || 0,
        view: parseInt(d.view || 0) || 0
      };
      return item;
    });

    const results = (await Promise.all(promises)).filter(Boolean);

    // filter only completed
    const completedOnly = results.filter(r => r.st === 'completed');

    // sort by dateKey desc (terbaru dulu)
    completedOnly.sort((a, b) => dateKeyMX(b) - dateKeyMX(a));

    // simpan ke cache
    dataCacheMX = completedOnly;

  } catch (err) {
    console.error("Error saat loadAllDataMX:", err);
  } finally {
    fetchingMetaMX = false;
  }
}

// mengambil batch dari cache dan render
function renderBatchMX(container, batch) {
  batch.forEach(item => {
    const judulPendek = potongMX(item.jd, 20); // batasi 20 karakter
    const el = document.createElement("div");
    el.className = "box-0";
    el.innerHTML = `
      <a href="${item.lk}" view="${item.judul}" target="_blank" rel="noopener">
        <div class="boxDaftarCompleted">
            <div class="shadowBoxDaftarCompleted"></div>
            <div class="imgBoxDaftarCompleted" style="background-image: url('${item.gm}');">
                <div class="playBoxDaftarCompleted"></div>
                <div class="statusDaftarCompleted" style="background:rgba(34,197,94,1);">
                    completed
                </div>
            </div>
            <div class="judulDaftarCompleted">
                <h4 title="${escapeHtml(item.jd)}">${judulPendek}</h4>
            </div>
        </div>
      </a>`;
    container.appendChild(el);
  });
}

// escape sederhana untuk attribute title
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

// muat batch berikutnya dari cache
function renderNextFromCacheMX(container) {
  if (!dataCacheMX || dataCacheMX.length === 0) return;

  const start = indexMX;
  const end = Math.min(start + BATCH_MX, dataCacheMX.length);
  const batch = dataCacheMX.slice(start, end);
  if (batch.length > 0) renderBatchMX(container, batch);
  indexMX = end;
}

// public function yang dipanggil untuk inisialisasi + load pertama
async function initCompletedScrollMX(selector = '.daftarCompleted') {
  const container = document.querySelector(selector);
  if (!container) return;

  // bila cache kosong → load semua data
  if (dataCacheMX.length === 0 && !fetchingMetaMX) {
    await loadAllDataMX();
  }

  // reset index & render batch pertama
  indexMX = 0;
  container.innerHTML = ""; // bersihkan dulu
  renderNextFromCacheMX(container);

  // pasang listener scroll (horizontal)
  container.addEventListener('scroll', () => {
    if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 50) {
      // bila sudah ke ujung → render batch berikutnya
      renderNextFromCacheMX(container);
    }
  });
}

// jalankan saat DOM siap
document.addEventListener("DOMContentLoaded", () => {
  initCompletedScrollMX('.daftarCompleted');
});