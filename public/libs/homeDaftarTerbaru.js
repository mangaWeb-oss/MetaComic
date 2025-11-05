/* =========================================
   SCROLL_Y - VERTIKAL (ONGOING ONLY)
   FORMAT BARU: dataMetaComic.json + dataComic.json
   BEHAVIOR: hanya tampilkan status "ongoing", urut terbaru (tahun & bulan)
========================================= */

const ASM_JSON_PATH_SCROLL1 = 'libs/dataMetaComic.json';
const ASM_BATCH_SIZE = 16;

let ASM_MAIN_LIST = [];
let ASM_INDEX_PTR = 0;
let ASM_IS_LOADING = false;

const ASM_BULAN_MAP = {
  januari: 1, februari: 2, maret: 3, april: 4, mei: 5, juni: 6,
  juli: 7, agustus: 8, september: 9, oktober: 10, november: 11, desember: 12
};

// === GEN_UID - buat ID unik ===
function GEN_UID(prefix = "ITEM") {
  const RAND = Math.random().toString(36).substring(2, 8);
  const TIME = Date.now().toString(36);
  return `${prefix}-${TIME}-${RAND}`;
}

// === TRUNC_TEXT - potong teks panjang ===
function TRUNC_TEXT(text, maxLen) {
  if (!text) return "";
  return text.length > maxLen ? text.substring(0, maxLen) + "..." : text;
}

// === MOV_FETCH_JSON - fetch JSON aman ===
async function MOV_FETCH_JSON(path) {
  try {
    const R = await fetch(path);
    if (!R.ok) throw new Error(`HTTP ${R.status}`);
    return await R.json();
  } catch (E) {
    console.warn("⚠️ MOV_FETCH_JSON FAIL:", path, E.message);
    return null;
  }
}

// === BUILD_LIST_FROM_MAIN - ambil semua path dari dataMetaComic.json ===
function BUILD_LIST_FROM_MAIN(raw) {
  return Object.keys(raw).map(k => {
    const IT = raw[k];
    if (!IT.data) return null;
    return {
      path: IT.data, // path ke dataComic.json
      id: GEN_UID("MAIN")
    };
  }).filter(Boolean);
}

// === PROC_PREPARE_MAIN - load file utama ===
async function PROC_PREPARE_MAIN() {
  const RES = await MOV_FETCH_JSON(ASM_JSON_PATH_SCROLL1);
  if (!RES) return [];
  return BUILD_LIST_FROM_MAIN(RES);
}

// === FETCH_BATCH_DETAIL - ambil tiap dataComic.json & filter ongoing ===
async function FETCH_BATCH_DETAIL(start, end) {
  const SLICE = ASM_MAIN_LIST.slice(start, end);
  const DETAILS = await Promise.all(
    SLICE.map(async IT => {
      const D = await MOV_FETCH_JSON(IT.path);
      if (!D) return null;

      return {
        id: GEN_UID((D.status || "DATA").toUpperCase()),
        jd: D.judul || "Tanpa Judul",
        sinopsis: D.sinopsis || "",
        lk: D.link || "#",
        gm: D.gambar || "res/raw/default.png",
        tahun: parseInt(D.tahun || 0),
        bulan: D.bulan?.toLowerCase() || "",
        status: (D.status || "").toLowerCase()
      };
    })
  );

  // === filter ongoing ===
  const VALID = DETAILS.filter(x => x && x.status === "ongoing");

  // === urut berdasarkan tahun & bulan terbaru ===
  VALID.sort((a, b) => {
    const aM = ASM_BULAN_MAP[a.bulan] || 0;
    const bM = ASM_BULAN_MAP[b.bulan] || 0;
    return (b.tahun * 100 + bM) - (a.tahun * 100 + aM);
  });

  return VALID;
}

// === RENDER_BATCH - render ke DOM ===
function RENDER_BATCH(box, batch) {
  batch.forEach(ITEM => {
    const JUDUL = TRUNC_TEXT(ITEM.jd, 30);
    const STATUS = ITEM.status || "unknown";
    const STATUS_COLOR = STATUS === "ongoing" ? "rgba(59, 130, 246, 1)" : "gray";

    const EL = document.createElement("div");
    EL.className = "box-0";
    EL.dataset.type = STATUS;
    EL.id = ITEM.id;

    EL.innerHTML = `
      <a href="${ITEM.lk}" view="${ITEM.jd.replace(/["'&<>]/g, '')}" target="_blank">
        <div class="mangaBoxDaftar">
          <div class="imgDaftar" style="background-image: url('${ITEM.gm}');">
            <div class="iconDaftarShadow"><div class="iconDaftar"></div></div>
            <div class="statusBoxDaftar" style="background:${STATUS_COLOR};">
              ${STATUS}
            </div>
          </div>
          <div class="judulBoxDaftar">
            <p>${JUDUL}</p>
          </div>
        </div>
      </a>`;
    box.appendChild(EL);
  });
}

// === PROC_RENDER_NEXT_BATCH - muat batch berikut ===
async function PROC_RENDER_NEXT_BATCH(box) {
  if (ASM_IS_LOADING) return;
  ASM_IS_LOADING = true;

  const NEXT_START = ASM_INDEX_PTR;
  const NEXT_END = NEXT_START + ASM_BATCH_SIZE;
  const BATCH = await FETCH_BATCH_DETAIL(NEXT_START, NEXT_END);

  if (BATCH.length > 0) RENDER_BATCH(box, BATCH);

  ASM_INDEX_PTR += ASM_BATCH_SIZE;
  ASM_IS_LOADING = false;
}

// === ENTRY POINT ===
document.addEventListener("DOMContentLoaded", async () => {
  const BOX = document.querySelector(".daftarTerbaru");
  if (!BOX) return;

  ASM_MAIN_LIST = await PROC_PREPARE_MAIN();
  await PROC_RENDER_NEXT_BATCH(BOX);
});