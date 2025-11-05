/* =========================================
   📜 SCROLL 1 (Horizontal - Berdasarkan View ≥ 300)
========================================= */
let dataCache = [];
let indexData = 0;
const batchSize = 10;
let isLoading = false;

// Fungsi format view
function formatView(value) {
    const num = parseInt(value);
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'k';
    return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
}

// Fungsi load data
async function loadData1() {
    const box = document.querySelector('.menuDaftarPopulerScroll');
    if (!box || isLoading) return;
    isLoading = true;

    try {
        // Jika belum ada cache
        if (dataCache.length === 0) {
            const metaRes = await fetch('libs/dataMetaComic.json');
            const metaData = await metaRes.json();

            const comicPromises = Object.values(metaData).map(async (entry) => {
                try {
                    const res = await fetch(entry.data);
                    const comic = await res.json();
                    return comic;
                } catch (err) {
                    console.warn(`Gagal memuat: ${entry.data}`, err);
                    return null;
                }
            });

            const comics = (await Promise.all(comicPromises)).filter(Boolean);

            // Filter & Sort berdasarkan view ≥ 300
            dataCache = comics
                .filter(c => parseInt(c.view) >= 300)
                .sort((a, b) => parseInt(b.view) - parseInt(a.view));
        }

        renderNextBatch(box);

    } catch (error) {
        console.error('Error loading comic data:', error);
    } finally {
        isLoading = false;
    }
}

// Fungsi render batch
function renderNextBatch(box) {
    const nextBatch = dataCache.slice(indexData, indexData + batchSize);
    if (nextBatch.length === 0) return;

    nextBatch.forEach(item => {
        const judul = item.judul.length > 30 ? item.judul.substring(0, 25) + "..." : item.judul;
        const viewFormatted = formatView(item.view);
        const tahun = item.tahun;

        const card = document.createElement('div');
        card.className = 'box-0';
        card.innerHTML = `
        <a href="${item.link}" view="${item.judul}" target="_blank">
            <div class="boxMenuDaftarPopuler">
                <div class="imgBoxMenuDaftarPopuler" style="background-image: url('${item.gambar}');">
                    <div class="imgMenuButtonBoxShadow"></div>
                    <div class="h4"></div> 
                    <div class="viewBoxMenuImgPopuler">
                        <span>${viewFormatted}</span>
                        <span>${tahun}</span>
                    </div>
                </div>
                <div class="teksBoxMenuDaftarPopuler">
                    <h4>${judul}</h4>
                </div>
            </div>
        </a>`;
        box.appendChild(card);
    });

    indexData += batchSize;
}

// Event DOM Loaded + Scroll Listener
document.addEventListener('DOMContentLoaded', () => {
    loadData1();

    const sc = document.querySelector('.menuDaftarPopulerScroll');
    if (sc) {
        sc.addEventListener('scroll', () => {
            if (sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 50) {
                if (!isLoading && indexData < dataCache.length) {
                    renderNextBatch(sc); // ✅ langsung render batch berikutnya
                }
            }
        });
    }
});