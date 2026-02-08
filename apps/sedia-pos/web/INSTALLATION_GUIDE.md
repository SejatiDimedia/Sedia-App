# Panduan Instalasi Baru (Fresh Install)

Dokumen ini menjelaskan cara men-deploy aplikasi Sedia POS untuk klien baru dengan database bersih dan akun Super Admin baru.

## 1. Persiapan Lingkungan (Environment)

Saat Anda memberikan source code atau men-deploy ke server klien, hal pertama yang harus disetup adalah file konfigurasi `.env`.

1.  Copy file `.env.example` (jika ada) atau buat file `.env` baru.
2.  Isi variabel berikut untuk menentukan siapa Super Admin-nya:

```env
# Database
DATABASE_URL="postgresql://..."

# Konfigurasi Super Admin Baru
ADMIN_EMAIL="email_klien@domain.com"
ADMIN_NAME="Nama Klien"
ADMIN_PASSWORD="PasswordAwal123"
```

**Penting:** Jangan gunakan email Anda (`sejatidimedia`) di sini agar aplikasi benar-benar menjadi milik klien dari awal.

## 2. Setup Database

Jalankan perintah berikut untuk membuat struktur database (tabel) yang masih kosong:

```bash
# Push schema ke database
npm run db:push
```

## 3. Membuat Super Admin & Data Awal

Setelah database siap, jalankan perintah "Seed" untuk mengisi data awal (Role, Permission, dan Super Admin yang Anda set di `.env`).

```bash
# Jalankan Seeding
npm run seed
```

**Apa yang terjadi saat seeding?**
- Sistem akan membaca `ADMIN_EMAIL` dari `.env`.
- Membuat User baru dengan email tersebut.
- Memberikan hak akses **Super Admin** penuh.
- Membuatkan 1 **Outlet Utama** otomatis sebagai modal awal toko.
- **Tidak ada data sampah** (transaksi, produk, karyawan lain kosong).

## 4. Serah Terima

Setelah proses di atas selesai:
1.  Berikan URL aplikasi ke klien.
2.  Berikan kredensial login sesuai yang Anda set di `.env`.
3.  Aplikasi siap digunakan 100% atas nama klien.

---

## Catatan: Membersihkan Data Lama (Reset)
Jika Anda menggunakan database bekas/lama dan ingin membersihkannya menjadi seperti baru, Anda harus menghapus (drop) semua tabel di database terlebih dahulu sebelum melakukan langkah nomor 2.

**Hati-hati:** Langkah ini akan menghapus permanen semua data transaksi dan user yang ada!
