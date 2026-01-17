# 📦 Lendify - Campus Inventory Management System

**Lendify** adalah aplikasi manajemen peminjaman barang berbasis web yang dibangun menggunakan **Angular 17** dan **Google Firebase**. Aplikasi ini dirancang untuk memudahkan admin mengelola aset kampus dan mahasiswa dalam melakukan pengajuan peminjaman barang.

---

## 🚀 Fitur Utama

### 👨‍💼 Admin Features
- **Dashboard Inventaris:** Melihat daftar barang dengan status *real-time*.
- **CRUD Barang:** Menambah, Mengedit, dan Menghapus data barang.
- **Search & Filter:** Pencarian barang berdasarkan nama dan kategori.
- **Manajemen Status:** Mengubah status barang (*Available, Maintenance, Damaged, Lost*).

### 🎓 Student Features
- **Katalog Barang:** Melihat daftar barang yang tersedia untuk dipinjam.
- **Request Peminjaman:** Mengajukan peminjaman barang (bisa banyak barang sekaligus).
- **Cek Ketersediaan:** Sistem otomatis mencegah peminjaman jika stok habis.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend:** Angular 17 (Standalone Components)
- **Backend/Database:** Google Firebase (Firestore)
- **Styling:** SCSS (Custom CSS)
- **Language:** TypeScript

---

## 📋 Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan komputer Anda telah terinstal:

1.  **Node.js** (Versi LTS direkomendasikan): [Download Node.js](https://nodejs.org/)
2.  **Angular CLI**: Install via terminal dengan perintah:
    ```bash
    npm install -g @angular/cli
    ```

---

## ⚙️ Cara Instalasi (Installation)

1.  **Clone Repository**
    Buka terminal dan clone project ini ke komputer lokal Anda:
    ```bash
    git clone [https://github.com/blaz12/lendify-app.git](https://github.com/blaz12/lendify-app.git)
    cd lendify-app
    ```

2.  **Install Dependencies**
    Install semua library yang dibutuhkan (node_modules):
    ```bash
    npm install
    ```

---

## 🔥 Konfigurasi Firebase

Agar aplikasi dapat terhubung ke database, Anda perlu mengatur konfigurasi Firebase:

1.  Buka file `src/environments/environment.ts` (atau buat jika belum ada).
2.  Pastikan konfigurasi Firebase Anda sudah benar seperti format di bawah ini:

    ```typescript
    export const environment = {
      production: false,
      firebase: {
        apiKey: "AIzaSyD...",
        authDomain: "your-project.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project.appspot.com",
        messagingSenderId: "...",
        appId: "..."
      }
    };
    ```
---

## ▶️ Cara Menjalankan Aplikasi (How to Run)

1.  **Jalankan Development Server**
    Ketik perintah berikut di terminal:
    ```bash
    ng serve
    ```

2.  **Buka di Browser**
    Buka browser (Chrome/Edge) dan akses alamat:
    ```
    http://localhost:4200/
    ```

---

## 🧪 Cara Pengujian (Testing Roles)

Aplikasi ini menggunakan simulasi Role sederhana via `localStorage`. Berikut cara berpindah akun:

### 1. Masuk sebagai ADMIN
Secara default aplikasi mungkin berjalan sebagai Student atau Admin. Untuk memaksa masuk sebagai **Admin**:
1. Buka **Inspect Element** (F12) -> Tab **Application** -> **Local Storage**.
2. Tambahkan Key: `demoRole` dengan Value: `admin`.
3. Refresh halaman.
4. Anda akan melihat tombol **Add New Item** dan tombol **Edit/Delete** di tabel.

### 2. Masuk sebagai STUDENT
Untuk masuk sebagai **Mahasiswa**:
1. Ubah Value `demoRole` menjadi `student` di Local Storage.
2. Refresh halaman.
3. Anda akan melihat tombol **Create Borrow Request** dan checkbox pada tabel.

---

## 👤 Author
**Nama:** Fadhil Aulia Haraba  
**NPM:** 092023090411
**Mata Kuliah:** Framework Based Programming
