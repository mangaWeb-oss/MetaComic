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
    const box = document.querySelector('.daftarPopuler');
    if (!box || isLoading) return;

    if (dataCache.length === 0) {
        isLoading = true;
        try {
            // Ambil daftar komik dari dataMetaComic.json
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

            // Filter & Sort berdasarkan view ≥ 300, urutkan descending
            dataCache = comics
                .filter(comic => parseInt(comic.view) >= 300)
                .sort((a, b) => parseInt(b.view) - parseInt(a.view));

        } catch (error) {
            console.error('Error loading comic data:', error);
        } finally {
            isLoading = false;
        }
    }

    renderNextBatch(box);
}

// Fungsi render batch
function renderNextBatch(box) {
    const nextBatch = dataCache.slice(indexData, indexData + batchSize);
    if (nextBatch.length === 0) return;

    nextBatch.forEach(item => {
        // Potong judul jika lebih dari 30 karakter
        const judul = item.judul.length > 30 ? item.judul.substring(0, 25) + "..." : item.judul;
        const viewFormatted = formatView(item.view);

        const card = document.createElement('div');
        card.className = 'box-0';
        card.innerHTML = `
        <a href="${item.link}" view="${item.judul}" target="_blank">
            <div class="boxDaftarPopuler">
            <div class="shadowBoxDaftarPopuler"></div>
                <div class="imgBoxDaftarPopuler" style="background-image: url('${item.gambar}');">
                    <p class="viewBoxImgPopuler"> ${viewFormatted}</p>
                    <div class="imgButtonBoxShadow"></div>
                    
                </div>
                <div class="teksBoxDaftarPopuler">
                    <h4>${judul}</h4>
                </div>
            </div>
        </a>`;
        box.appendChild(card);
    });

    indexData += batchSize;
}

// Event: Load saat halaman selesai & scroll horizontal
document.addEventListener('DOMContentLoaded', () => {
    loadData1();

    const sc = document.querySelector('.daftarPopuler');
    if (sc) {
        sc.addEventListener('scroll', () => {
            if (sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 50) {
                if (!isLoading && indexData < dataCache.length) {
                    loadData1();
                }
            }
        });
    }
});