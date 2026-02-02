# User Requirement Specification (URS) & Instruksi Pengembangan: Sedia POS

Dokumen ini berisi spesifikasi kebutuhan pengguna dan instruksi teknis untuk pembangunan aplikasi **Sedia POS (Point of Sales)** sebagai bagian dari ekosistem Sedia.

---

## 1. Identitas Proyek
* **Nama Proyek:** Sedia POS
* **Tujuan:** Menyediakan sistem kasir (POS) yang handal, lintas platform, dan terintegrasi penuh dengan ekosistem Sedia.
* **Target Pengguna:** UMKM, Retail, dan F&B (Cafe/Resto).

---

## 2. Tech Stack Ecosystem
Sesuai dengan standarisasi platform Sedia, berikut adalah teknologi yang digunakan:

### A. Web Application (Dashboard / Cashier Web)
*Digunakan untuk manajemen back-office (stok, laporan, karyawan) dan kasir berbasis desktop/tablet.*

### A. Web Application (Dashboard / Cashier Web)
*Digunakan untuk manajemen back-office (stok, laporan, karyawan) dan kasir berbasis desktop/tablet.*

* **Framework:** **Next.js 15 (App Router)** - Dipilih untuk menangani interaksi kompleks dan routing dashboard.
* **Styling:** Tailwind CSS.
* **Build Tool:** Turbopack (Bawaan Next.js).
* **State Management:** React Hooks / Zustand.
* **Optimisasi Storage:** Menggunakan **PNPM** untuk menghemat disk space (Content-addressable storage).

### B. Mobile Application (Cashier Mobile / Owner App)
*Digunakan untuk kasir portable dan pemantauan real-time oleh pemilik.*

* **Framework:** React Native (Expo).
* **Styling:** NativeWind (Tailwind CSS untuk React Native).
* **Local Database:** SQLite atau WatermelonDB (Offline-first approach).

### C. Backend & Infrastructure (Shared)
* **Database:** Neon (PostgreSQL).
* **ORM:** Drizzle ORM (Multi-schema architecture).
* **Auth:** BetterAuth (Unified Authentication).
* **Storage:** Cloudflare R2 (Image produk, struk digital, dll).

---

## 3. Fitur Unggulan (Key Features)

### 🌟 Core Experience
* **Multi-Platform Sync Real-time:** Sinkronisasi instan antara aplikasi mobile dan web dashboard.
* **Offline-First Capabilities:** Transaksi tetap berjalan tanpa internet; sinkronisasi otomatis saat kembali online.
* **Agnostic Device:** Tampilan responsif di Desktop, Tablet, dan Smartphone.

### 🏪 Transaksi & Penjualan
* **Smart Cart:** Pencarian produk cepat, support barcode scanner, dan fitur *hold order*.
* **Multi-Payment:** Dukungan Tunai, QRIS (Statis/Dinamis), Transfer, dan Split Payment.
* **Digital Receipt:** Pengiriman struk via WhatsApp/Email dan dukungan print Thermal Bluetooth.

### 📦 Manajemen Toko
* **Multi-Outlet:** Satu akun owner untuk mengelola banyak cabang dengan stok terpisah.
* **Inventory Management:** Pelacakan stok real-time, alert stok menipis, dan Stock Opname.
* **Product Variants:** Support varian (Size, Color) dan modifiers (Topping, Sugar Level).

### 📊 Laporan & Analitik
* **Laba Rugi Otomatis:** Kalkulasi HPP vs Harga Jual secara otomatis.
* **Analitik Penjualan:** Laporan produk terlaris dan jam sibuk (*Peak Hours*).
* **Staff Shift:** Manajemen shift pegawai dan rekonsiliasi kas (*Cash Drawer*).

### 🤝 Customer Loyalty (CRM)
* **Member Management:** Database pelanggan terpusat.
* **Point & Diskon:** Sistem reward poin dan diskon khusus member.

### 🔒 Security & Compliance
* **Audit Trail:** Log aktivitas lengkap untuk security dan accountability.
* **Tax Management:** Konfigurasi pajak otomatis (PPN/PPH) sesuai regulasi.

### 📦 Supply Chain
* **Supplier Management:** Database supplier terpusat dengan kontak dan rating.
* **Purchase Orders:** Manajemen PO dari supplier hingga receipt barang.
* **Returns & Refunds:** Sistem retur produk dengan approval workflow.

### 🎯 Marketing & Growth
* **Promotion Engine:** Diskon otomatis, Buy X Get Y, Time-based promos.
* **Voucher System:** Generate dan manage voucher codes.
* **Advanced Analytics:** Prediksi penjualan, analisis tren, dan customer insights.

### 👤 Manajemen Pengguna & Hak Akses (User Roles)
Sistem membedakan hak akses berdasarkan 3 role utama untuk keamanan operasional:

#### 1. Owner (Pemilik Toko) 👑
*   **Akses:** Full Access (Web Dashboard & Mobile App).
*   **Login:** Email & Password.
*   **Tanggung Jawab:**
    *   Melihat Laporan Keuangan (Laba/Rugi, Omset).
    *   Mengelola Master Data (Produk, Karyawan, Cabang).
    *   Mengatur Konfigurasi Sistem.

#### 2. Store Manager (Kepala Toko) 👔
*   **Akses:** Terbatas pada Outlet yang ditugaskan.
*   **Login:** PIN (di Mobile App) atau Email (di Web khusus Manager).
*   **Tanggung Jawab:**
    *   **Approval Void/Refund:** Melakukan pembatalan transaksi.
    *   **Stock Adjustment:** Melakukan penyesuaian stok (barang rusak/hilang).
    *   **Closing Shift:** Melakukan rekonsiliasi kas harian.
    *   **Diskon Manual:** Memberikan diskon khusus.

#### 3. Cashier (Kasir) 🛒
*   **Akses:** Hanya POS (Point of Sales).
*   **Login:** PIN (di Mobile App).
*   **Tanggung Jawab:**
    *   Membuat Transaksi Penjualan.
    *   Input Member/Pelanggan.
    *   Cek Stok (View Only).
    *   Cetak Struk.
    *   **Batasan:** Tidak bisa hapus item yang sudah dipesan (perlu approval), tidak bisa lihat laporan profit.

---

## 4. Struktur Database & Arsitektur
Sesuai aturan `context.md`, semua data disimpan dalam satu database Neon namun dipisahkan melalui schema.

* **Database:** Single Neon Database
* **Schema Isolation:** `sedia_pos`

### Tabel Utama (Schema: `sedia_pos`)
| Nama Tabel | Deskripsi |
| :--- | :--- |
| `outlets` | Data cabang toko |
| `products` | Master data produk |
| `categories` | Kategori produk |
| `inventory_logs` | Riwayat keluar-masuk barang |
| `transactions` | Header/Ringkasan transaksi |
| `transaction_items` | Detail item dalam transaksi |
| `customers` | Data pelanggan/member |
| `employees` | Data pegawai dan role akses |

### Tabel Tambahan (Fitur Baru)
| Nama Tabel | Deskripsi |
| :--- | :--- |
| `suppliers` | Data supplier dan kontak |
| `purchase_orders` | Header Purchase Order dari supplier |
| `purchase_order_items` | Detail item dalam PO |
| `returns` | Header transaksi retur |
| `return_items` | Detail item yang di-retur |
| `refunds` | Data refund dan store credit |
| `vouchers` | Kode voucher dan konfigurasi diskon |
| `promotions` | Aturan promosi otomatis |
| `tax_settings` | Konfigurasi pajak per outlet |
| `activity_logs` | Audit trail aktivitas user |

---

## 5. Instruksi Pengembangan (Step-by-Step)

### Tahap 1: Setup Backend & Database
1. Buka folder `shared-db`.
2. Buat schema baru di Drizzle: `pgSchema("sedia_pos")`.
3. Definisikan tabel-tabel inti sesuai rancangan di atas.
4. Jalankan migrasi Drizzle untuk push schema ke Neon.

### Tahap 2: Setup Web App (Admin/Cashier)
1. **PENTING: Gunakan PNPM** untuk instalasi agar hemat space (Global Store).
   ```bash
   npm install -g pnpm
   ```
2. Inisialisasi project di `apps/sedia-pos/web`:
   ```bash
   npx create-next-app@latest apps/sedia-pos/web --use-pnpm
   ```
   *Settings: TypeScript (Yes), ESLint (Yes), Tailwind (Yes), src directory (Yes), App Router (Yes), Turbopack (Yes).*
3. Instalasi dependencies inti: `drizzle-orm`, `@neondatabase/serverless`, `better-auth`.
4. Hapus file boilerplate default Next.js agar bersih sisa 200MB+.

### Tahap 3: Setup Mobile App (React Native)
1. Inisialisasi project di `apps/sedia-pos/mobile` menggunakan Expo (TypeScript).
2. Konfigurasi NativeWind untuk styling.
3. **Arsitektur API:** Gunakan **Next.js API Routes** (`/app/api/...`) di Web App sebagai Backend Mobile App.

### Tahap 4: Sinkronisasi & Offline Mode
1. Implementasi logika Pull/Push data antara Local DB (SQLite) dan Central DB (Neon).
2. Optimasi *conflict resolution* jika terdapat perbedaan data saat sinkronisasi.

---

## 6. Roadmap Implementasi (Phases)

### ✅ Phases Completed

| Phase | Fokus Pengembangan | Status |
| :--- | :--- | :--- |
| **Phase 1** | **Backend & Database** - Schema `sedia_pos`, Tables (Outlets, Products, Transactions), Auth Setup | ✅ Done |
| **Phase 2** | **Web App (Next.js)** - Dashboard, Login/Register, Products CRUD | ✅ Done |
| **Phase 2.5** | **Products Management** - Categories, Transactions, Customers, Reports pages | ✅ Done |
| **Phase 3** | **Mobile App (React Native)** - Expo, NativeWind, Brand Colors | ✅ Done |
| **Phase 4** | **Offline Sync** - SQLite, useSync hook, Connectivity indicator | ✅ Done |
| **Phase 5** | **POS Transaction Flow** - Product Grid, Cart, Checkout, Zustand | ✅ Done |
| **Phase 5.5** | **UI Refinement** - Icons, Premium styling, Color corrections | ✅ Done |
| **Phase 6** | **Mobile Authentication** - Login, Register, SecureStore, Session | ✅ Done |
| **Phase 7** | **API Integration** - Products/Transactions API, Mobile-Backend sync | ✅ Done |
| **Phase 8** | **Multi-Outlet Management** - Outlets CRUD, Outlet Picker, Filter by outlet | ✅ Done |
| **Phase 9** | **Employee/PIN Access** - Employees CRUD, PIN login for cashiers | ✅ Done |
| **Phase 10** | **Reports & Analytics** - Summary cards, Charts, Top products | ✅ Done |
| **Phase 11** | **Inventory Management** - Stock tracking, Low stock alerts, Adjustments | ✅ Done |
| **Phase 12** | **Customer Loyalty (CRM)** - Member management, Points system, Member discounts | ✅ Done |
| **Phase 13** | **Receipt & Export** - Digital receipt (PDF), WhatsApp/Email share, Thermal print | ✅ Done |
| **Phase 15** | **Multi-Payment** - QRIS integration, Split payment, Payment methods | ✅ Done |
| **Phase 16** | **Staff Shift & Rekonsiliasi** - Shift management, Cash drawer reconciliation | ✅ Done |
| **Phase 17** | **Stock Opname** - Physical stock counting, Adjustment wizard | ✅ Done |
| **Phase 18** | **Profit/Loss Reports** - HPP calculation, Margin analysis, Export Excel | ✅ Done |
| **Phase 19** | **Hold Order** - Save incomplete transactions, Resume later | ✅ Done |
| **Phase 20** | **Deployment & Production** - Vercel deploy, Environment configs, Final testing | ✅ Done |
| **Phase 21** | **Audit Trail & Activity Log** - User activity tracking, Security logs, Change history | ✅ Done |
| **Phase 24** | **Tax Management** - Tax configuration (PPN/PPH), Auto-calculation, Tax reports | ✅ Done |

---

### � Upcoming Phases

| Phase | Fokus Pengembangan | Prioritas |
| :--- | :--- | :--- |
| **Phase 22** | **Supplier & Purchase Order Management** - Supplier database, PO creation, Stock receipt | 🔥 High |
| **Phase 23** | **Return & Refund Management** - Product returns, Refund processing, Store credit | 🔥 High |
| **Phase 25** | **Promotion & Campaign** - Automatic discounts, Buy X Get Y, Voucher system | Medium |
| **Phase 26** | **Backup & Restore** - Data backup, Restore wizard, Export/Import data | Medium |
| **Phase 27** | **Advanced Analytics** - Sales prediction, Trend analysis, Customer insights | Low |
| **Phase 28** | **Integration APIs** - Third-party integrations (Accounting, E-commerce, Marketplace) | Low |

---

## 7. Desain & Branding (UI/UX)

### Referensi Visual (Sedia Brand Colors)
Menggunakan referensi warna dari **Sedia Ecosystem** (Deep Teal Palette - sesuai `sedia_pos_referensi_color.png`).

| Color Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Primary 500** | `#377f7e` | Main Brand Color, Active States, Buttons |
| **Primary 600** | `#2e6a69` | Hover States, Links |
| **Primary 50** | `#edf7f7` | Subtle Backgrounds |
| **Zinc 950** | `#09090b` | Main Text, Dark Mode Background |
| **Zinc 50** | `#fafafa` | Light Background, Cards |

*   **Style:** Modern, Clean, Professional.
*   **Palette:** Deep Teal (Hijau Tua Kebiruan) + Gold Accents (implied).

### Fitur Kustomisasi Tema (Dynamic Theming)
Aplikasi harus mendukung **Theme Configuration** agar pemilik toko bisa menyesuaikan tampilan dengan brand mereka sendiri.
*   **Configurable Colors:** User bisa mengganti *Primary Color*, *Secondary Color*, dan *Accent Color*.
*   **Dark/Light Mode:** Dukungan penuh untuk mode gelap dan terang.
*   **Teknis:** Implementasi menggunakan CSS Variables di Tailwind (`globals.css`) yang bisa di-update via database/settings.