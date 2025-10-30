// === KONFIGURASI FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyD20Efj4YUjq5yqsP1oLRo8apdYmJxDwJ0",
  authDomain: "mangawebapp-43750.firebaseapp.com",
  projectId: "mangawebapp-43750",
  storageBucket: "mangawebapp-43750.firebasestorage.app",
  messagingSenderId: "883744625809",
  appId: "1:883744625809:web:647003fe305e780b185b30",
  measurementId: "G-RNJSSC22QQ"
};

// === INISIALISASI FIREBASE ===
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// === UPDATE UI AKUN ===
const img = document.getElementById("iconAkun");
const nama = document.getElementById("namaAkun");
const uid = document.getElementById("uidAkun");
const tombol = document.getElementById("logout");

tombol.addEventListener("click", () => {
  if (auth.currentUser) {
    auth.signOut()
      .then(() => alert("Berhasil logout"))
      .catch(err => alert(err.message));
  } else {
    auth.signInWithPopup(provider)
      .then(result => alert("Login sebagai " + result.user.displayName))
      .catch(err => alert("Error: " + err.message));
  }
});
auth.onAuthStateChanged(user => {
  if (user) {
    img.style.backgroundImage = `url(${user.photoURL || 'res/raw/user.png'})`;
    nama.textContent = user.displayName || "Tanpa Nama";
    uid.textContent = user.uid;
    tombol.textContent = "Logout";
  } else {
    img.style.backgroundImage = "url('res/raw/user.png')";
    nama.textContent = "Guest";
    uid.textContent = "-";
    tombol.textContent = "Login";
  }
});
