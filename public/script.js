const logoMenuBar = document.querySelector('.logoMenuBar');
const menuDisplay = document.querySelector('.menuDisplay');
const menuBarPage = document.querySelector('.menuBarPage');
logoMenuBar.addEventListener('click', () => {
    menuDisplay.style.display = 'block';
    menuBarPage.style.transform = 'translateX(0)';
});
menuDisplay.addEventListener('click', () => {
    menuDisplay.style.display = 'none';
    menuBarPage.style.transform = 'translateX(-200vh)';
});
const logo = document.querySelector('.logo');
const exploreLogo = document.querySelector('.exploreLogo');

window.addEventListener('scroll', () => {
  const y = window.scrollY;

  // Reset posisi & bayangan dulu biar bersih
  logo.style.position = "absolute";
  logo.style.top = "";
  logo.style.boxShadow = "";
  exploreLogo.style.position = "absolute";
  exploreLogo.style.top = "";
  exploreLogo.style.boxShadow = "";

  if (y <= 102) {
    // Tahap awal — hanya logo biasa
    logo.style.position = "absolute";
  } 
  else if (y > 102 && y <= 1920) {
    // Saat scroll di antara 102 dan 1920
    logo.style.position = "fixed";
    logo.style.top = "0";
    logo.style.boxShadow = "0 0.2vh 0.4vh rgba(0,0,0,0.5)";
  } 
  else if (y > 1920) {
    // Setelah posisi 1920 — exploreLogo aktif
    logo.style.position = "absolute";
    exploreLogo.style.position = "fixed";
    exploreLogo.style.top = "0";
    exploreLogo.style.boxShadow = "0 0.2vh 0.4vh rgba(0,0,0,0.5)";
  }
});