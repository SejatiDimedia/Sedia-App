# INSTRUKSI IMPLEMENTASI: ROLE PER-APP & MANAJEMEN STORAGE (SEDIA ECOSYSTEM)

Halo Gemini, saya ingin melakukan refactoring pada sistem Autentikasi dan Manajemen File untuk project **SediaArcive** sebagai bagian dari ekosistem **Sedia (SejatiDimedia)**.

Tolong implementasikan perubahan berikut dengan standar kode yang clean, modern (Tailwind), dan modular (Drizzle Multi-schema).

## 1. Schema Database (shared-db/src/schema/auth.ts)
Ubah struktur tabel di dalam schema `sedia_auth` untuk memisahkan data User pusat dengan Izin Spesifik Aplikasi.

- **Tabel `users`**: Simpan data profil dasar (id, name, email, image).
- **Tabel Baru `app_permissions`**:
    - `id`: serial/uuid (Primary Key).
    - `userId`: reference ke `users.id`.
    - `appId`: text (Gunakan value 'sedia-arcive' untuk project ini).
    - `role`: text (default: 'user').
    - `uploadEnabled`: boolean (default: false). // Pengganti isApproved, lebih spesifik untuk akses fitur.
    - `storageLimit`: bigint (default: 524288000). // Batas 500 MB dalam bytes.
    - `storageUsed`: bigint (default: 0).
    - **Constraint**: Gabungan (userId + appId) harus unik.

## 2. Logika Akses & Fitur (apps/sedia-arcive)
Terapkan logika akses yang fleksibel agar user tetap bisa menjelajahi dashboard:

- **Dashboard Access (Middleware)**: 
    - Izinkan semua user yang sudah login untuk masuk ke halaman `/dashboard`.
    - JANGAN memblokir user meskipun `uploadEnabled` masih `false`.
- **Fitur View-Only**:
    - Jika user memiliki `uploadEnabled: false` di tabel `app_permissions`, tampilkan UI Dashboard dalam mode "View-Only".
    - Sembunyikan atau nonaktifkan (disable) tombol **Upload**. 
    - Tampilkan banner/notifikasi informatif: *"Mode Lihat Saja: Anda belum memiliki akses untuk mengunggah file. Silakan hubungi admin untuk aktivasi fitur upload."*
- **Fitur Admin**:
    - Buat route `/admin` yang hanya bisa diakses oleh user dengan `role: 'admin'` pada `appId: 'sedia-arcive'`.
    - Admin dapat melihat daftar user dan memiliki tombol untuk mengubah `uploadEnabled` menjadi `true`.

## 3. Validasi & Batasan Upload (Server-Side)
Pada API Route atau Server Action untuk upload ke Cloudflare R2, lakukan pengecekan berurutan:

1. **Cek Hak Akses**: Pastikan user memiliki `uploadEnabled: true` untuk `appId: 'sedia-arcive'`.
2. **Cek Ukuran Per File**: Batas maksimal **100 MB** per file. Jika lebih, tolak dengan pesan error.
3. **Cek Kuota Total (500 MB)**: Jika (`storageUsed` saat ini + `fileSize` baru) > `storageLimit`, batalkan upload.
4. **Update Counter**: Jika upload ke R2 berhasil, tambahkan ukuran file tersebut ke kolom `storageUsed` di tabel `app_permissions` milik user tersebut.

## 4. UI Dashboard (Clean SaaS Style)
- Tambahkan widget **Storage Tracker** yang menunjukkan penggunaan storage user.
- Tampilkan teks: *"Penyimpanan: [X] MB / 500 MB"* lengkap dengan progress bar Tailwind yang minimalis.
- Berikan keterangan tambahan di area upload: *"Maksimal 100 MB per file"*.

Tolong berikan kode untuk schema Drizzle yang diperbarui, lalu contoh logika fungsi upload yang sudah diproteksi dengan aturan di atas.