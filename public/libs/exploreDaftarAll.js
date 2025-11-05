/* =========================================
   SCROLL_Y - VERTIKAL (ALL COMIC RANDOM)
   FORMAT BARU: dataMetaComic.json + dataComic.json
   BEHAVIOR:
   - Tampilkan semua data secara acak
   - Load awal 25
   - Saat scroll bawah, tambah 10 lagi
========================================= */

const ALLC_JSON_PATH = 'libs/dataMetaComic.json';
const ALLC_INITIAL_BATCH = 15; // batch awal
const ALLC_SCROLL_BATCH = 7;  // batch tambahan

let ALLC_MAIN_LIST = [];
let ALLC_INDEX_PTR = 0;
let ALLC_IS_LOADING = false;

// === GEN_UID - buat ID unik ===
function ALLC_GEN_UID(prefix = "ALLC") {
  const RAND = Math.random().toString(36).substring(2, 8);
  const TIME = Date.now().toString(36);
  return `${prefix}-${TIME}-${RAND}`;
}

// === TRUNC_TEXT - potong teks panjang ===
function ALLC_TRUNC_TEXT(text, maxLen) {
  if (!text) return "";
  return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
}

// === FETCH_JSON_SAFE - ambil JSON aman ===
async function ALLC_FETCH_JSON(path) {
  try {
    const R = await fetch(path);
    if (!R.ok) throw new Error(`HTTP ${R.status}`);
    return await R.json();
  } catch (E) {
    console.warn("⚠️ ALLC_FETCH_JSON FAIL:", path, E.message);
    return null;
  }
}

// === BUILD_MAIN_LIST - ambil semua path dari dataMetaComic.json ===
function ALLC_BUILD_MAIN_LIST(raw) {
  return Object.keys(raw).map(k => {
    const IT = raw[k];
    if (!IT.data) return null;
    return {
      path: IT.data,
      id: ALLC_GEN_UID("MAIN")
    };
  }).filter(Boolean);
}

// === PREPARE_MAIN - load file utama ===
async function ALLC_PREPARE_MAIN() {
  const RES = await ALLC_FETCH_JSON(ALLC_JSON_PATH);
  if (!RES) return [];
  return ALLC_BUILD_MAIN_LIST(RES);
}

// === FETCH_BATCH_DETAIL - ambil tiap dataComic.json (SEMUA STATUS) ===
async function ALLC_FETCH_BATCH_DETAIL(start, end) {
  const SLICE = ALLC_MAIN_LIST.slice(start, end);
  const DETAILS = await Promise.all(
    SLICE.map(async IT => {
      const D = await ALLC_FETCH_JSON(IT.path);
      if (!D) return null;

      return {
        id: ALLC_GEN_UID("ITEM"),
        jd: D.judul || "Tanpa Judul",
        sinopsis: D.sinopsis || "",
        lk: D.link || "#",
        gm: D.gambar || "res/raw/default.png",
        tahun: parseInt(D.tahun || 0),
        bulan: D.bulan?.toLowerCase() || "",
        status: (D.status || "unknown").toLowerCase()
      };
    })
  );

  // === filter null ===
  const VALID = DETAILS.filter(Boolean);
  return VALID;
}

// === RENDER_BATCH - render ke DOM ===
function ALLC_RENDER_BATCH(box, batch) {
  batch.forEach(ITEM => {
    const JUDUL = ALLC_TRUNC_TEXT(ITEM.jd, 30);
    const STATUS = ITEM.status || "unknown";
    const STATUS_COLOR = STATUS === "ongoing"
      ? "rgba(59, 130, 246, 1)"
      : STATUS === "completed"
        ? "rgba(34, 197, 94, 1)"
        : "gray";

    const EL = document.createElement("div");
    EL.className = "box-0";
    EL.dataset.type = STATUS;
    EL.id = ITEM.id;

    EL.innerHTML = `
      <a href="${ITEM.lk}" view="${ITEM.jd.replace(/["'&<>]/g, '')}" target="_blank">
        <div class="exploreBoxDaftarAll">
        <div class="iconDaftarShadow"></div>
          <div class="imgBoxDaftarAll" style="background-image: url('${ITEM.gm}');">
            <div class="playBoxDaftarAll"></div>
            <div class="statusBoxDaftarAll" style="background:${STATUS_COLOR};">
              ${STATUS}
            </div>
          </div>
          <div class="judulBoxDaftarAll">
            <p>${JUDUL}</p>
          </div>
        </div>
      </a>`;
    box.appendChild(EL);
  });
}

// === RENDER_NEXT_BATCH - muat batch berikut ===
async function ALLC_RENDER_NEXT_BATCH(box, batchSize) {
  if (ALLC_IS_LOADING) return;
  ALLC_IS_LOADING = true;

  const NEXT_START = ALLC_INDEX_PTR;
  const NEXT_END = NEXT_START + batchSize;
  const BATCH = await ALLC_FETCH_BATCH_DETAIL(NEXT_START, NEXT_END);

  if (BATCH.length > 0) ALLC_RENDER_BATCH(box, BATCH);
  ALLC_INDEX_PTR += batchSize;
  ALLC_IS_LOADING = false;
}

// === RANDOMIZE ARRAY ===
function ALLC_SHUFFLE(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// === ENTRY POINT ===
document.addEventListener("DOMContentLoaded", async () => {
  const BOX = document.querySelector(".daftarAll");
  if (!BOX) return;

  // load main list & acak
  ALLC_MAIN_LIST = await ALLC_PREPARE_MAIN();
  ALLC_SHUFFLE(ALLC_MAIN_LIST);

  // render awal 25
  await ALLC_RENDER_NEXT_BATCH(BOX, ALLC_INITIAL_BATCH);

  // listener scroll: load 10 tambahan tiap mendekati bawah
  window.addEventListener("scroll", async () => {
    if (ALLC_IS_LOADING) return;

    const nearBottom =
      window.innerHeight + window.scrollY >= document.body.offsetHeight - 300;

    if (nearBottom && ALLC_INDEX_PTR < ALLC_MAIN_LIST.length) {
      await ALLC_RENDER_NEXT_BATCH(BOX, ALLC_SCROLL_BATCH);
    }
  });
});