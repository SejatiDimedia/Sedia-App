# PRD: Jangji (Jejak Ngaji) - PWA Al-Quran Offline-First

**Brand Name:** Jangji (Jejak Ngaji)
**Tagline:** "Janji Istiqomah, Jejak Tak Terputus."
**Tech Stack:** Next.js 14+ (App Router), Drizzle ORM, Tailwind CSS, Dexie.js (IndexedDB), NextAuth.js.

---

## 1. Overview
**Jangji** adalah aplikasi PWA Al-Quran modern dengan fitur utama **Hybrid Sync**. Aplikasi dirancang dengan prinsip **Ultra-Lean Storage** untuk menghindari pembengkakan ukuran file aplikasi (Deployment size) dan cache server.

---

## 2. Storage Efficiency Strategy (Anti-Bloat)
Untuk mencegah ukuran aplikasi membengkak (seperti masalah 1.5GB sebelumnya), kita akan menerapkan aturan berikut:

### A. Output Tracing (Docker/Server Size)
- **Standalone Mode:** Mengaktifkan `output: 'standalone'` di `next.config.js`. Ini hanya akan menyertakan file yang benar-benar dibutuhkan untuk menjalankan aplikasi, memangkas ukuran `node_modules` hingga 80%.
- **Minimize Dependencies:** Menghindari penggunaan library berat. Prioritas menggunakan native web API.

### B. Asset & Cache Management
- **External Image Hosting:** Tidak menyimpan aset gambar berat di dalam folder `/public`. Gunakan URL CDN untuk audio murottal.
- **Image Optimization Disable:** Jika tidak dibutuhkan, matikan *built-in cache* Next.js Image atau gunakan `unoptimized: true` untuk gambar kecil guna mencegah folder `.next/cache/images` membengkak.
- **Font Optimization:** Hanya menggunakan 1 atau 2 subset font Arab (Woff2) untuk menghemat ruang disk dan memori browser.

### C. Data Handling (Client-Side Heavy)
- **JSON Thinning:** Tidak memuat data 114 surat ke dalam file JavaScript utama. Data surat diambil via API dan langsung disimpan di **IndexedDB (Browser)**, bukan di file system server.

---

## 3. Visual & Brand Identity (Light & Dark Mode)
| Element | Hex Code (Light) | Hex Code (Dark) |
| :--- | :--- | :--- |
| **Primary (Deep Green)** | `#1B5E20` | `#81C784` |
| **Secondary (Soft Green)** | `#E8F5E9` | `#2E7D32` |
| **Background** | `#F5F7F5` | `#121212` |

---

## 4. Schema Database (shared-db/src/schema/jangji.ts)
```typescript
import { pgSchema, uuid, integer, timestamp, jsonb, text } from "drizzle-orm/pg-core";

export const jangjiSchema = pgSchema("jangji_db");

export const userProgress = jangjiSchema.table("user_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  appId: text("app_id").default("jangji-app"),
  lastSurah: integer("last_surah").default(1),
  lastAyah: integer("last_ayah").default(1),
  lastReadAt: timestamp("last_read_at").defaultNow().notNull(),
  bookmarks: jsonb("bookmarks").default([]),
});


# Roadmap Pengembangan: Jangji (Jejak Ngaji)

Dokumen ini berisi tahapan pengembangan aplikasi Jangji dengan fokus pada **Next.js Lean Storage** dan **Offline-First Sync**.

---

## 🟢 Phase 1: Inisialisasi & Arsitektur Lean (Minggu 1)
*Fokus: Setup dasar yang ringan dan performa maksimal.*

- [ ] **Project Setup:** Inisialisasi Next.js 14+ (App Router) dengan konfigurasi `output: 'standalone'`.
- [ ] **Design System:** Implementasi Tailwind CSS dengan variabel warna `primary-green` (Light/Dark mode).
- [ ] **Database Schema:** Setup Drizzle ORM dengan schema `jangji_db` dan migrasi tabel `user_progress`.
- [ ] **PWA Foundation:** Setup `manifest.json` dan ikon aplikasi agar bisa di-install (Web App Manifest).

---

## 🟡 Phase 2: Core Reader & Local Storage (Minggu 2)
*Fokus: Menampilkan data Al-Quran secara instan tanpa membebani server.*

- [ ] **Data Fetching:** Integrasi API Al-Quran eksternal (menggunakan SSG untuk daftar surat).
- [ ] **IndexedDB Setup:** Implementasi Dexie.js di sisi client untuk menyimpan cache surat dan progres bacaan.
- [ ] **Reader UI:** Halaman baca Al-Quran yang responsif dengan font Arab yang dioptimalkan (`woff2`).
- [ ] **Service Worker:** Implementasi caching agar halaman reader bisa dibuka 100% offline.

---

## 🔵 Phase 3: Autentikasi & Logika Sinkronisasi (Minggu 3)
*Fokus: Menghubungkan user dan menyelaraskan data antar gadget.*

- [ ] **NextAuth Integration:** Setup login (Google/Email) yang terintegrasi dengan ekosistem Sedia.
- [ ] **Last Read Logic:** Fitur otomatis mencatat surat dan ayat terakhir ke IndexedDB setiap user melakukan scroll/baca.
- [ ] **Hybrid Sync Engine:** - Listener untuk mendeteksi status internet (`navigator.onLine`).
    - Mekanisme rekonsiliasi data berdasarkan `lastReadAt` (timestamp terbaru menang).
- [ ] **Server Actions:** Membuat fungsi aman untuk kirim data dari client ke PostgreSQL.

---

## 🟠 Phase 4: Fitur Pendukung & Optimasi Storage (Minggu 4)
*Fokus: Menambah fitur kenyamanan dan memastikan aplikasi tetap "kecil".*

- [ ] **Audio Murottal:** Player streaming (tanpa menyimpan file audio di server lokal).
- [ ] **Bookmark System:** Fitur simpan ayat favorit (simpan di JSONB field).
- [ ] **Storage Audit:** - Memastikan `next/image` tidak membengkakkan cache server.
    - Menghapus folder `.next/cache` yang tidak diperlukan sebelum deployment.
- [ ] **Global Search:** Pencarian surat dan ayat secara offline melalui data di IndexedDB.

---

## 🔴 Phase 5: Testing, QA & Launch (Minggu 5)
*Fokus: Stabilitas dan peluncuran.*

- [ ] **End-to-End Testing:** Uji coba skenario (Baca di HP Offline -> Connect Online -> Buka di Laptop).
- [ ] **Performance Audit:** Skor Lighthouse untuk PWA, Accessibility, dan Best Practices wajib > 90.
- [ ] **Deployment:** Deploy ke production dengan environment variable yang benar.
- [ ] **Final Clean-up:** Memastikan ukuran docker image atau folder standalone di bawah 200MB.

---

## 🛠 Panduan Maintenance Storage (Anti-Bloat)
Agar storage tidak membengkak ke 1.5GB lagi seperti pengalaman sebelumnya:
1. **Jangan Simpan Cache di Server:** Pastikan folder `cache` tidak ikut masuk ke dalam image production.
2. **Streaming, Don't Store:** Semua aset besar (Audio/Video) harus berasal dari link eksternal (CDN).
3. **Prune Dependencies:** Gunakan `npm prune --production` saat proses build untuk membuang `devDependencies`.


// next.config.js
const nextConfig = {
  output: 'standalone', // Sangat penting untuk memangkas ukuran storage server
  images: {
    unoptimized: true, // Mencegah pembengkakan folder cache/images
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'shadcn-ui'],
  },
}
```

---

## 🚀 Phase 6: Future Expansions (Upcoming Ideations)
*Fitur tambahan yang akan dikembangkan selanjutnya untuk menjadikan Jangji sebagai aplikasi daily-driver bagi umat Muslim.*

### 1. 🤲 Kumpulan Doa Harian & Dzikir Pagi Petang
*   **Menu Dzikir**: Dzikir Pagi, Dzikir Petang, dan Dzikir setelah Sholat fardhu.
*   **Doa Harian**: Kumpulan doa pendek (Doa mau tidur, doa makan, doa keluar rumah, dll) dengan teks Arab, Latin, dan terjemahan.

### 2. 📖 Bookmark & Penanda Ayat Favorit
*   **Koleksi Ayat**: Fitur untuk menyimpan ayat ke dalam kategori buatan sendiri (misal: "Ayat Motivasi", "Doa Nabi").
*   **Share Ayat**: Fitur membagikan ayat ke sosial media dengan desain *card* gambar cantik (mengandung teks Arab & arti).

### 3. 📅 Kalender Hijriah & Pengingat Puasa Sunnah
*   **Widget Kalender**: Menampilkan penanggalan Hijriah hari ini secara prominent di Dashboard.
*   **Pengingat Puasa**: Notifikasi/label khusus di dashboard untuk Puasa Senin-Kamis, Ayyamul Bidh, dll.

### 4. 📿 Tasbih Digital (Interaktif)
*   **Layar Tasbih**: Layar khusus yang merespon sentuhan penuh (*full screen tap*) disertai getaran (Haptic Feedback).
*   **Target Harian**: Pengaturan target kuantitas dzikir harian.

### 5. 🕌 Notifikasi Adzan (Push Notifications)
*   **Pengingat Audio**: Notifikasi lokal (Service Worker Push) yang berbunyi ketika waktu sholat tiba.

### 6. ✨ Mode Pembaca Tanpa Terjemahan (Mushaf Mode)
*   **Toggle Mushaf**: Tombol di reader untuk menghilangkan teks terjemahan dan latin, sehingga layar 100% fokus menampilkan teks Arab secara penuh.