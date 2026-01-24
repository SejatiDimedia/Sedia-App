# Sedia Archive - Features List 🚀

Dokumen ini mencatat seluruh fitur yang telah tersedia dan siap digunakan dalam aplikasi **Sedia Archive**.

## 📂 File Management (Manajemen File)
- **Upload File**: Dukungan drag & drop atau tombol upload konvensional.
- **File Preview**: Melihat pratinjau file langsung (Gambar, Video, Audio, PDF) tanpa perlu download.
- **File Grid View**: Tampilan grid yang responsif dan rapi dengan thumbnail.
- **Download**:
    - Download file satuan.
    - **Bulk Download**: Download banyak file sekaligus (file dipilih menggunakan checkbox).
- **Rename File**: Mengubah nama file dengan mudah (klik ikon pensil).
- **Delete File**: Menghapus file (masuk ke status deleted/trash di database).
- **Bulk Actions**: Memilih banyak file sekaligus untuk dihapus, didownload, atau dibagikan.

## 📁 Folder Management (Manajemen Folder)
- **Create Folder**: Membuat folder baru untuk mengorganisir file.
- **Nested Folders**: Mendukung struktur folder bertingkat (folder di dalam folder).
- **Navigation (Breadcrumb)**: Navigasi cepat antar folder menggunakan breadcrumb di bagian atas.
- **Drag & Drop Move**: Memindahkan file ke folder lain atau folder ke folder lain cukup dengan drag & drop.
- **Rename Folder**: Mengubah nama folder.
- **Delete Folder**: Menghapus folder beserta isinya.

## 🗑️ Trash Management (Tempat Sampah)
- **Trash Page**: Halaman khusus menampung file/folder yang dihapus.
- **Soft Delete**: File tidak langsung hilang permanen saat dihapus.
- **Restore**: Mengembalikan file/folder ke lokasi semula.
- **Permanent Delete**: Menghapus file selamanya dari database dan storage.
- **Empty Trash**: Menghapus semua isi sampah sekaligus.

## � Sharing & Collaboration (Berbagi & Kolaborasi)
- **Public Links**: Membuat link publik untuk file/folder.
    - **Expiration**: Bisa set waktu kadaluarsa (1 jam, 24 jam, 7 hari).
    - **Password**: Opsi proteksi password untuk link.
    - **Download Control**: Opsi mengizinkan atau melarang download.
- **Internal Sharing**: Berbagi akses dengan user lain dalam sistem (via email).
    - **Permissions**: Level akses 'Can View' atau 'Can Edit'.
- **Management**: Melihat dan menghapus link/akses yang sudah dibuat.

## �🔍 Advanced Search & Filtering (Pencarian & Filter)
- **Smart Search**: Mencari file/folder berdasarkan nama.
- **Filter-Only Mode**: Bisa mencari hanya dengan filter tanpa perlu mengetik kata kunci.
- **Filter Options**:
    - **Type**: Image, Video, Audio, Document, Folder.
    - **Date**: Modified Today, This Week, This Month, This Year.
    - **Starred**: Menampilkan hanya item berbintang.
- **Layout Terpisah**: Tombol filter terpisah dari kotak pencarian agar tidak saling menimpa.

## ⭐ Starred (Favorit)
- **Star/Unstar**: Menandai file atau folder penting agar mudah diakses.
- **Starred Page**: Halaman khusus untuk melihat semua item berbintang.
- **Starred Stats**: Statistik jumlah item berbintang berdasarkan kategori (Images, Videos, Docs, etc.) di sidebar kanan.
- **Synchronized Layout**: Tampilan thumbnail konsisten dengan halaman utama.

## 📊 System & Dashboard
- **Storage Tracker**: Progress bar indikator penggunaan penyimpanan (Used vs Limit).
- **Activity Logging**: Sistem mencatat aktivitas user (Upload, Delete, Rename, Move) untuk audit trail.
- **Responsive Layout**: Sidebar yang bisa di-collapse dan layout yang menyesuaikan layar mobile/desktop.

---
*Last Updated: 2026-01-24*
