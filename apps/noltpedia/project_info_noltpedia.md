# 📘 Project Information: NoltPedia

> **Motto:** "Master the Core, Own the Future."
> **Core Mission:** Menjadi standar referensi tertinggi untuk pembelajaran fundamental pemrograman di Indonesia.

---

## 🏛️ 1. Brand Identity & Manifesto
**NoltPedia** bukan sekadar situs tutorial. Kami adalah sebuah **arsip logika**. 

Di era di mana AI bisa menuliskan kode dalam sekejap, kemampuan manusia untuk memahami *mengapa* kode itu bekerja menjadi sangat langka dan berharga. NoltPedia hadir untuk mengembalikan kendali tersebut ke tangan developer dengan membedah teknologi hingga ke titik nolnya.

**The "Nolt" Philosophy:**
* **N** - No shortcuts (Tidak ada jalan pintas dalam pemahaman).
* **O** - Objective (Konten yang baku dan terstandarisasi).
* **L** - Logic-driven (Mengutamakan nalar daripada sekadar sintaks).
* **T** - Total Clarity (Kejelasan mutlak dari titik dasar).

---

## 🛠️ 2. Technical Stack (The Nolt-Stack)
Arsitektur yang dipilih dirancang untuk kecepatan akses (Lighthouse Score 100) dan kemudahan manajemen konten.

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Engine** | **Astro 4.x/5.x** | Mengirimkan HTML murni untuk konten edukasi (SEO God Mode). |
| **Interactive** | **React** | Menangani dashboard admin dan fitur interaktif di sisi client. |
| **Data Source** | **Neon PostgreSQL** | Database serverless yang tangguh dengan fitur branching. |
| **Data Layer** | **Drizzle ORM** | Mapping database yang tipis, cepat, dan type-safe. |
| **Auth** | **BetterAuth** | Manajemen akses kontributor dan admin. |
| **Media** | **Cloudflare R2** | CDN untuk gambar tutorial dan aset statis. |

---

## 🗄️ 3. Database Structure Overview
Organisasi data menggunakan schema PostgreSQL untuk skalabilitas jangka panjang.

* **Schema:** `noltpedia_v1`
* **Core Modules:**
    * `topics`: Indeks utama (e.g., PHP, JavaScript, Database, Networking).
    * `articles`: Entri ensiklopedia (mendukung MDX untuk komponen interaktif).
    * `glossary`: Kamus istilah teknis singkat.
    * `paths`: Kurikulum terpandu (e.g., "Jalur Menjadi Fullstack dari Nol").

---

## 📏 4. Content Standards (The Pedia Rules)
Setiap konten yang dipublikasikan di NoltPedia harus mengikuti aturan:
1. **Aturan 80/20:** 80% penjelasan logika/konsep, 20% implementasi kode.
2. **Standardized Snippets:** Kode harus menggunakan standar industri terbaru (e.g., PHP 8.x+, React Server Components).
3. **No Magic:** Jangan pernah menggunakan library pihak ketiga untuk menjelaskan konsep dasar.
4. **Visual Mapping:** Setiap artikel harus memiliki ilustrasi atau diagram alur logika.

---

## 🎨 5. Design System (Neobrutalism)
NoltPedia menggunakan estetika **Neobrutalism** untuk mencerminkan kejujuran teknis dan kejelasan.

* **Border & Shadow:** Border hitam tebal `2px` pada semua kartu dan tombol. Shadow kaku (`4px 4px 0px 0px #000`).
* **Palette:**
    * `Yellow (#FACC15)` - Highlight & Perhatian.
    * `Blue (#2563EB)` - Action & Link.
    * `Zinc (#18181B)` - Dark Mode & Typography.
    * `White (#FFFFFF)` - Background Utama (Pure & Clean).
* **Typography:** 
    * Sans-serif (Inter/Outfit) untuk pembacaan konten.
    * Monospace (JetBrains Mono) untuk ID, Slug, dan Snippet Kode.
* **UX Highlights:** Command Palette (`Cmd+K`) untuk navigasi instan dan pencarian global.

---

## 🗺️ 6. Development Roadmap
- [x] **Phase 1:** Core Engine (Astro Setup & Drizzle Integration).
- [x] **Phase 2:** The Curator (CMS untuk manajemen artikel & topik).
- [x] **Phase 3:** Global Search (Implementasi Cmd+K & Search API).
- [x] **Phase 4:** Community Core (Auth via Google & Discussion System).
- [x] **Phase 5:** Encyclopedia & Glossary (Public Library, Topics Grid, Technical Glossary).
- [ ] **Phase 6:** Guided Learning Paths (Curriculum/Roadmap System).
- [ ] **Phase 7:** Interactive Learning (Lab interaktif di dalam artikel via MDX).

---

**"Di NoltPedia, kami tidak hanya mengajarimu cara menulis kode. Kami mengajarimu cara memahami bahasa mesin."**

*Last Updated: 16 Februari 2026*