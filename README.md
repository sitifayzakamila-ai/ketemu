# 🔍 KETEMU - Campus Lost & Found Management Platform

> **"Kembalikan yang Hilang, Bangun Budaya Kejujuran!"**

**KETEMU** adalah platform *Lost & Found* hiper-lokal berbasis *web* yang dirancang khusus untuk lingkungan kampus. Proyek ini merupakan wujud *Minimum Viable Product* (MVP) untuk mengatasi masalah informasi barang hilang yang sering tenggelam di grup *chat* dan mencegah penipuan klaim barang.

---

## ✨ Fitur Utama

- **Experimental AI Moderation:**
  Pendekatan *Lean* yang memanfaatkan model siap pakai dan logika dasar untuk membantu memoderasi laporan secara otomatis (masih dalam tahap eksperimen & penyempurnaan):
  - **Image Recognition (Pre-trained):** Menggunakan model `MobileNet` dari TensorFlow.js untuk mendeteksi objek foto. *(Catatan: Masih bersifat eksperimental, akurasi belum 100% sempurna).*
  - **NSFW Filter (Pre-trained):** Menggunakan `NSFW.js` untuk memblokir indikasi konten tidak senonoh secara instan di sisi *client*.
  - **Rule-Based NLP Algorithm:** Sistem penyaringan teks sederhana menggunakan pencocokan kamus kata (*dictionary-based rules*) dengan Vanilla JS Regex untuk mencegah penggunaan kata kasar pada input *form*.
- **Smart Claim System:** Verifikasi dua arah yang mewajibkan penemu dan pemilik untuk mencocokkan "ciri khusus" barang secara rahasia sebelum status diubah menjadi Serah Terima.
- **Honesty Points (Sistem Gamifikasi):** Memberikan *reward* berupa poin kejujuran kepada pengguna yang berhasil mengembalikan barang.
- **Geolocation (GPS):** Pelapor dapat menyematkan titik koordinat lokasi jatuhnya/ditemukannya barang secara presisi dengan satu klik.
- **Direktori & Filter Dinamis:** Pencarian barang yang mudah berdasarkan Kategori (Elektronik, Dokumen, dll) dan Jenis Kejadian (Hilang/Temuan).
- **Personal Dashboard:** Manajemen status laporan secara *real-time* (Aktif -> Menunggu Serah Terima -> Selesai).
- **100% Mobile-First Responsive:** Antarmuka yang rapi dan fungsional di berbagai ukuran layar (Laptop, Tablet, maupun HP).

---

## 🛠️ Tech Stack (Teknologi yang Digunakan)

**Frontend:**
- HTML5 & CSS3 (Custom Mobile-First Architecture)
- Vanilla JavaScript (Ringan, tanpa framework berat)

**Backend & Database (BaaS):**
- [Supabase](https://supabase.com/) (PostgreSQL & Authentication)

**Artificial Intelligence (Client-Side / Pre-trained):**
- [TensorFlow.js](https://www.tensorflow.org/js) (MobileNet Model)
- [NSFW.js](https://github.com/infinitered/nsfwjs)
- Vanilla JS Regular Expression (Rule-Based NLP)

**Deployment:**
- [Vercel](https://vercel.com/) (Serverless Web Hosting)

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

Karena proyek ini dibangun menggunakan Vanilla JS (Client-Side) dan Supabase (BaaS), proyek dapat dijalankan dengan sangat mudah tanpa perlu instalasi *node modules* atau *server* lokal yang rumit.

1. **Clone repository ini:**
```bash
   git clone [https://github.com/sitifayzakamila-ai/ketemu]

2. **Buka folder proyek di Text Editor (contoh: VS Code)**
3. **Jalankan menggunakan ekstensi Live Server di VS Code, atau buka langsung file index.html di browsermu**

(Catatan): Pastikan perangkat terhubung ke internet agar script TensorFlow, NSFWjs, dan Supabase client dapat dimuat dari CDN dengan baik.
