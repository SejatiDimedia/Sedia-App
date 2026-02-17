# 📝 NoltPedia Content Creation Guide

Panduan lengkap untuk membuat konten artikel NoltPedia yang interaktif. Gunakan prompt-prompt di bawah ini untuk generate content via AI.

---

## 📋 Format Konten yang Didukung

NoltPedia menggunakan **Markdown** sebagai format konten, dengan beberapa custom syntax untuk komponen interaktif:

| Komponen | Syntax | Fungsi |
|----------|--------|--------|
| **Code Block** | ` ```javascript ` | Kode dengan syntax highlighting + copy button |
| **Callout** | ` ```callout ` | Info box (info, warning, tip, success) |
| **Quiz** | ` ```quiz ` | Multiple choice interaktif |
| **Challenge** | ` ```challenge ` | Checklist latihan |
| **Table** | `\| col \| col \|` | Tabel GFM (GitHub Flavored Markdown) |
| **Inline Code** | `` `kode` `` | Kode inline dengan border |

---

## 🧩 Syntax Reference

### 1. Callout

```
` ` `callout
TYPE: Judul Callout
Isi pesan callout di sini. Bisa multi-line.
Baris kedua juga bisa.
` ` `
```

**Type yang tersedia:**
- `info` — Informasi umum (biru)
- `tip` — Tips & best practice (ungu)
- `warning` — Peringatan (kuning)
- `success` — Poin positif / best practice (hijau)

**Contoh:**
```
` ` `callout
tip: Gunakan Const
Selalu gunakan `const` secara default. Gunakan `let` hanya jika value memang perlu berubah.
` ` `
```

---

### 2. Quiz (Multiple Choice)

```
` ` `quiz
{
  "question": "Tulis pertanyaan di sini?",
  "options": ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
  "answer": 1
}
` ` `
```

> **Catatan:** `answer` adalah index dari jawaban yang benar (dimulai dari 0).
> Jadi `"answer": 1` berarti jawaban benar = "Opsi B".

---

### 3. Challenge (Checklist Latihan)

```
` ` `challenge
{
  "title": "Judul Challenge",
  "steps": [
    "Langkah pertama yang harus dikerjakan",
    "Langkah kedua yang harus dikerjakan",
    "Langkah ketiga yang harus dikerjakan"
  ]
}
` ` `
```

---

### 4. Code Block (Syntax Highlighted)

Bahasa yang didukung: `javascript`, `typescript`, `jsx`, `tsx`, `html`, `css`, `json`, `bash`, `sql`, `python`, `yaml`, `diff`, `markdown`, dan lainnya.

```
` ` `javascript
const greeting = "Hello, NoltPedia!";
console.log(greeting);
` ` `
```

> Code block otomatis mendapat: language badge, line numbers (4+ baris), dan tombol copy.

---

## 🚀 PROMPT TEMPLATES

### ──────────────────────────────
### PROMPT 1: Artikel Tutorial Lengkap
### ──────────────────────────────

```
Buatkan artikel tutorial untuk NoltPedia dengan topik: [TOPIK]

Format yang digunakan adalah Markdown dengan komponen interaktif khusus. Ikuti aturan berikut:

**STRUKTUR ARTIKEL:**
1. Judul utama (# heading)
2. Pengantar singkat (2-3 paragraf)
3. Beberapa section dengan sub-heading (## dan ###)
4. Setiap section memiliki penjelasan + contoh kode
5. Penutup dengan kalimat transisi ke topik berikutnya

**KOMPONEN INTERAKTIF YANG WAJIB ADA:**
- Minimal 3 callout (gunakan variasi: info, tip, warning, success)
- Minimal 2 quiz (multiple choice, 4 opsi, format JSON)
- 1 challenge di akhir (checklist latihan, 4-6 langkah)
- Contoh kode yang relevan dengan syntax highlighting

**FORMAT CALLOUT:**
` ` `callout
TYPE: Judul
Isi penjelasan
` ` `
Type: info, tip, warning, success

**FORMAT QUIZ:**
` ` `quiz
{
  "question": "Pertanyaan?",
  "options": ["A", "B", "C", "D"],
  "answer": INDEX_JAWABAN_BENAR
}
` ` `
answer = index (mulai dari 0)

**FORMAT CHALLENGE:**
` ` `challenge
{
  "title": "Judul Challenge",
  "steps": ["Langkah 1", "Langkah 2", "Langkah 3"]
}
` ` `

**FORMAT CODE BLOCK:**
Gunakan ` ` `javascript, ` ` `bash, ` ` `html, dll.

**GAYA PENULISAN:**
- Bahasa Indonesia, kasual tapi edukatif
- Gunakan analogi untuk konsep abstrak
- Sertakan contoh kode yang bisa langsung dicoba
- Jangan terlalu akademis, targetnya pemula sampai intermediate

**METADATA YANG DIBUTUHKAN (berikan di awal):**
- title: [judul artikel]
- slug: [url-friendly-slug]
- excerpt: [ringkasan 1-2 kalimat]
- difficulty: [beginner / intermediate / advanced]
- topicId: [id topik terkait]

Topik yang ingin dibahas: [TOPIK]
```

---

### ──────────────────────────────
### PROMPT 2: Seri Artikel (Learning Path)
### ──────────────────────────────

```
Buatkan SERI ARTIKEL untuk NoltPedia tentang: [TOPIK UTAMA]

Aku butuh [JUMLAH] artikel yang saling bersambung, membentuk learning path dari dasar sampai advanced.

Untuk SETIAP artikel, berikan:
1. **Metadata:**
   - title, slug, excerpt, difficulty (beginner/intermediate/advanced)

2. **Konten Markdown** dengan komponen interaktif:
   - Callout (info/tip/warning/success) — minimal 3 per artikel
   - Quiz (JSON format, 4 opsi) — minimal 2 per artikel  
   - Challenge (JSON format, checklist) — 1 di akhir tiap artikel
   - Contoh kode dengan syntax highlighting

**Format komponen interaktif:**

Callout:
` ` `callout
TYPE: Judul
Isi penjelasan
` ` `

Quiz:
` ` `quiz
{"question":"...", "options":["A","B","C","D"], "answer": INDEX}
` ` `

Challenge:
` ` `challenge
{"title":"...", "steps":["langkah 1","langkah 2"]}
` ` `

**Panduan tambahan:**
- Setiap artikel diakhiri kalimat transisi ke artikel berikutnya
- Gunakan Bahasa Indonesia kasual dan edukatif
- Berikan contoh kode yang praktis dan bisa langsung dicoba
- Kesulitan meningkat bertahap dari artikel 1 ke terakhir

**Selain konten, berikan juga metadata Learning Path:**
- path_title: [Judul Learning Path]
- path_slug: [slug-path]
- path_description: [Deskripsi 1-2 kalimat]
- article_order: [urutan slug artikel dari pertama sampai terakhir]

Topik: [TOPIK UTAMA]
```

---

### ──────────────────────────────
### PROMPT 3: Artikel Singkat / Cheatsheet
### ──────────────────────────────

```
Buatkan artikel ringkas / cheatsheet untuk NoltPedia tentang: [TOPIK]

Format: Markdown dengan komponen interaktif.

**Aturan:**
- Langsung ke inti, tanpa pengantar panjang
- Banyak contoh kode pendek
- Gunakan tabel untuk perbandingan
- Minimal 2 callout (tip/warning), 1 quiz, 1 challenge
- Panjang: sekitar 800-1200 kata

**Komponen interaktif yang tersedia:**

` ` `callout
TYPE: Judul
Isi
` ` `
(type: info, tip, warning, success)

` ` `quiz
{"question":"...", "options":["A","B","C","D"], "answer": 0}
` ` `

` ` `challenge
{"title":"...", "steps":["1","2","3"]}
` ` `

**Metadata:**
- title, slug, excerpt, difficulty
```

---

### ──────────────────────────────
### PROMPT 4: Konversi Ulang Konten Existing
### ──────────────────────────────

Gunakan prompt ini untuk menambahkan komponen interaktif ke konten yang sudah ada:

```
Aku punya artikel Markdown berikut. Tolong tambahkan komponen interaktif ke dalamnya:

[PASTE KONTEN MARKDOWN DI SINI]

**Yang perlu ditambahkan:**
1. Callout di setiap konsep penting (info/tip/warning/success)
2. Quiz setelah setiap section utama (format JSON, 4 opsi)
3. Challenge di akhir artikel (format JSON, checklist langkah)

**Format komponen:**

Callout: ` ` `callout
TYPE: Judul
Isi
` ` `

Quiz: ` ` `quiz
{"question":"...", "options":["A","B","C","D"], "answer": INDEX}
` ` `

Challenge: ` ` `challenge
{"title":"...", "steps":["1","2","3"]}
` ` `

Jangan ubah konten aslinya, hanya tambahkan komponen interaktif di posisi yang tepat.
```

---

### ──────────────────────────────
### PROMPT 5: Generate Seed Script
### ──────────────────────────────

Gunakan prompt ini untuk langsung generate TypeScript seed script:

```
Buatkan TypeScript seed script untuk NoltPedia yang menambahkan konten tentang: [TOPIK]

Referensi file seed yang sudah ada: scripts/seed-javascript.ts

Script harus:
1. Import db, schema, nanoid, eq dari dependency yang sama
2. Membuat 1 topic (jika belum ada)
3. Membuat [JUMLAH] artikel dengan konten Markdown interaktif
4. Membuat 1 learning path yang menghubungkan semua artikel
5. Menggunakan format content yang sama (callout, quiz, challenge, code blocks)

**Template kode:**
```typescript
import 'dotenv/config';
import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

const TOPIC_ID = "[topic-id]";

const articles = [
  {
    id: nanoid(),
    slug: "[slug]",
    title: "[Judul]",
    excerpt: "[Ringkasan]",
    difficulty: "beginner",
    content: `
# Judul

Konten markdown di sini...

\` \` \`callout
info: Judul
Isi callout
\` \` \`

\` \` \`javascript
// contoh kode
\` \` \`

\` \` \`quiz
{"question":"...","options":["A","B","C","D"],"answer":0}
\` \` \`

\` \` \`challenge
{"title":"...","steps":["1","2"]}
\` \` \`
`
  },
  // ... lebih banyak artikel
];

async function seed() {
  console.log("🚀 Starting seed...");
  
  // Create topic
  await db.insert(schema.topics).values({
    id: TOPIC_ID,
    name: "[Topic Name]",
    description: "[Deskripsi]",
    slug: TOPIC_ID,
  }).onConflictDoNothing();

  // Create articles
  for (const article of articles) {
    await db.insert(schema.articles).values({
      ...article,
      topicId: TOPIC_ID,
      authorId: "system",
      isPublished: true,
    });
    console.log(`   ✅ "${article.title}"`);
  }

  // Create path
  const pathId = nanoid();
  await db.insert(schema.paths).values({
    id: pathId,
    title: "[Path Title]",
    description: "[Path Description]",
    slug: "[path-slug]",
    isPublished: true,
  });

  // Add steps
  for (let i = 0; i < articles.length; i++) {
    await db.insert(schema.pathSteps).values({
      id: nanoid(),
      pathId,
      articleId: articles[i].id,
      stepOrder: i + 1,
    });
  }

  console.log("🎉 Seed completed!");
}

seed().catch(console.error).then(() => process.exit(0));
` ` `

Buat kontennya dalam Bahasa Indonesia, kasual tapi edukatif.

Topik: [TOPIK]
```

---

## ⚠️ Hal Penting

1. **Escape backticks** — Dalam template literal TypeScript, backtick (`` ` ``) harus di-escape: `\` + backtick.
   Contoh: `` \`\`\`javascript `` di dalam template literal.

2. **JSON harus valid** — Quiz dan Challenge menggunakan format JSON. Pastikan:
   - Gunakan double quotes (`"`)
   - Tidak ada trailing comma
   - `answer` di Quiz adalah index angka (mulai dari 0)

3. **Hindari karakter khusus** — Dalam template literal, escape juga `${}` menjadi `\${}` agar tidak diinterpretasi sebagai template expression.

4. **Panjang ideal per artikel**: 1500-3000 kata termasuk kode.

5. **Bahasa code block yang didukung syntax highlighting:**
   `javascript`, `typescript`, `jsx`, `tsx`, `html`, `css`, `json`, `bash`, `sh`, `sql`, `python`, `yaml`, `diff`, `markdown`

---

## 🎯 Tips Membuat Konten Berkualitas

- **Mulai dengan analogi** — Jelaskan konsep abstrak dengan perbandingan ke kehidupan nyata
- **Kode yang bisa langsung dicoba** — Setiap contoh kode harus bisa di-copy dan langsung berjalan
- **Progressive difficulty** — Mulai dari yang sederhana, naik bertahap
- **Quiz setelah section penting** — Bantu reader mengecek pemahaman
- **Challenge yang actionable** — Langkah-langkah yang jelas dan bisa dikerjakan

---

## 📁 Cara Memasukkan Konten ke Database

### Opsi 1: Via Seed Script (Recommended for Developers)
Jika Anda memiliki akses ke repository, Anda bisa menjalankan script seed untuk memasukkan banyak data sekaligus.

1. Simpan script yang dihasilkan AI ke folder `scripts/`, misalnya `scripts/seed-javascript.ts`.
2. Jalankan perintah berikut di root folder `apps/noltpedia`:
   ```bash
   npx tsx scripts/seed-javascript.ts
   ```
bash
npx tsx scripts/seed-[nama-topik].ts
```

### Opsi 2: Via Admin Dashboard
Gunakan antarmuka visual untuk menulis dan edit konten.
1. Jalankan aplikasi secara lokal (`npm run dev`).
2. Buka browser ke: `http://localhost:4321/dashboard/articles/new`
3. Masukkan metadata dan konten Markdown.
4. Klik **Publish** atau **Save**.

### Opsi 3: Via API
Cocok untuk otomatisasi atau integrasi dengan sistem lain.
```bash
curl -X POST http://localhost:4321/api/articles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Judul Artikel",
    "slug": "judul-artikel", 
    "content": "# Markdown content...",
    "topicId": "javascript",
    "difficulty": "beginner",
    "authorId": "system", // ID user sistem atau admin
    "isPublished": true
  }'
```
