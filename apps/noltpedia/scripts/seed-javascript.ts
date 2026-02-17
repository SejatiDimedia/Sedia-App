import 'dotenv/config';
import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// =============================================
// JavaScript Learning Content Seed
// 6 Articles + 1 Topic + 1 Learning Path
// =============================================

const TOPIC_ID = "javascript";

const articles = [
    // ─────────────────────────────────────────
    // Article 1: Pengenalan JavaScript
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "pengenalan-javascript",
        title: "Pengenalan JavaScript: Bahasa yang Menghidupkan Web",
        excerpt: "Pelajari dasar-dasar JavaScript, sejarahnya, dan mengapa bahasa ini menjadi fondasi utama web modern.",
        difficulty: "beginner",
        content: `# Pengenalan JavaScript

JavaScript adalah bahasa pemrograman yang awalnya dibuat untuk menambahkan interaktivitas pada halaman web. Saat ini, JavaScript telah berkembang menjadi salah satu bahasa pemrograman **paling populer di dunia**, digunakan di frontend, backend, mobile, hingga IoT.

## Sejarah Singkat

JavaScript diciptakan oleh **Brendan Eich** pada tahun 1995 dalam waktu hanya **10 hari** saat bekerja di Netscape. Awalnya bernama *Mocha*, lalu *LiveScript*, dan akhirnya menjadi JavaScript.

\`\`\`callout
info: Fakta Menarik
JavaScript tidak ada hubungannya dengan Java! Nama "JavaScript" dipilih karena strategi marketing — Java sedang populer saat itu.
\`\`\`

## Mengapa Belajar JavaScript?

1. **Satu-satunya bahasa native di browser** — Semua browser modern menjalankan JavaScript
2. **Full-stack capability** — Dengan Node.js, bisa dipakai di server juga
3. **Ekosistem terbesar** — npm memiliki jutaan package
4. **Komunitas besar** — Mudah mencari bantuan dan resource

\`\`\`callout
tip: Tips Belajar
Jangan coba menghafal semua syntax. Fokus pada **konsep** dulu, syntax bisa dicari kapan saja. Yang penting adalah memahami *cara berpikir* dalam programming.
\`\`\`

## Cara Menjalankan JavaScript

JavaScript bisa dijalankan di beberapa tempat:

### 1. Browser Console
Buka browser → klik kanan → Inspect → Console. Ketik kode langsung!

\`\`\`javascript
console.log("Hello, NoltPedia!");
\`\`\`

### 2. Node.js
Install Node.js, lalu jalankan file dengan terminal:
\`\`\`bash
node script.js
\`\`\`

### 3. Online Editor
Gunakan tools seperti CodePen, CodeSandbox, atau StackBlitz.

\`\`\`callout
warning: Perhatian
Pastikan kamu sudah install Node.js versi LTS terbaru sebelum mulai belajar. Cek di [nodejs.org](https://nodejs.org).
\`\`\`

## JavaScript vs ECMAScript

ECMAScript (ES) adalah **spesifikasi standar** yang menjadi dasar JavaScript. Versi-versi penting:

| Versi | Tahun | Fitur Utama |
|-------|-------|-------------|
| ES5 | 2009 | strict mode, JSON, Array methods |
| ES6/ES2015 | 2015 | let/const, arrow functions, classes, modules |
| ES2020 | 2020 | Optional chaining, nullish coalescing |
| ES2023 | 2023 | Array grouping, toSorted/toReversed |

\`\`\`quiz
{
  "question": "Siapa yang menciptakan JavaScript?",
  "options": ["James Gosling", "Brendan Eich", "Guido van Rossum", "Dennis Ritchie"],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Di mana JavaScript awalnya dirancang untuk berjalan?",
  "options": ["Server", "Browser", "Mobile", "Desktop"],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Setup Lingkungan JavaScript",
  "steps": [
    "Install Node.js versi LTS dari nodejs.org",
    "Buka terminal dan ketik: node --version",
    "Buat file hello.js dengan isi: console.log('Hello World!')",
    "Jalankan dengan: node hello.js",
    "Buka browser console dan coba ketik 2 + 2"
  ]
}
\`\`\`

---
Selamat! Kamu sudah mengenal JavaScript. Mari lanjut ke artikel berikutnya untuk mempelajari variabel dan tipe data.
`
    },

    // ─────────────────────────────────────────
    // Article 2: Variabel & Tipe Data
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "variabel-dan-tipe-data-javascript",
        title: "Variabel & Tipe Data: Fondasi Setiap Program",
        excerpt: "Pahami perbedaan var, let, const, serta 8 tipe data JavaScript dan kapan menggunakan masing-masing.",
        difficulty: "beginner",
        content: `# Variabel & Tipe Data JavaScript

Variabel adalah **wadah untuk menyimpan data**. Tipe data menentukan **jenis nilai** yang disimpan. Memahami keduanya adalah langkah pertama yang wajib dikuasai.

## Deklarasi Variabel

JavaScript punya 3 cara mendeklarasikan variabel:

### \`var\` — The Old Way
\`\`\`javascript
var nama = "Nolt";
var nama = "Pedia"; // Bisa re-deklarasi (berbahaya!)
\`\`\`

### \`let\` — The Modern Way
\`\`\`javascript
let umur = 25;
umur = 26; // Bisa di-reassign
// let umur = 30; // ERROR: tidak bisa re-deklarasi
\`\`\`

### \`const\` — The Immutable Way
\`\`\`javascript
const PI = 3.14159;
// PI = 3.14; // ERROR: tidak bisa di-reassign
\`\`\`

\`\`\`callout
tip: Golden Rule
Selalu gunakan \`const\` secara default. Gunakan \`let\` hanya jika value memang perlu berubah. **Jangan pernah** gunakan \`var\` di kode modern.
\`\`\`

## Tipe Data Primitif

JavaScript memiliki **7 tipe data primitif**:

### 1. String
\`\`\`javascript
const greeting = "Hello";
const name = 'World';
const template = \\\`Hello, \\\${name}!\\\`; // Template literal (ES6)
\`\`\`

### 2. Number
\`\`\`javascript
const integer = 42;
const float = 3.14;
const infinity = Infinity;
const notANumber = NaN; // Not a Number
\`\`\`

### 3. Boolean
\`\`\`javascript
const isActive = true;
const isDeleted = false;
\`\`\`

### 4. Undefined
\`\`\`javascript
let x; // undefined — variabel dideklarasi tapi belum diberi nilai
\`\`\`

### 5. Null
\`\`\`javascript
const data = null; // Sengaja dikosongkan
\`\`\`

### 6. BigInt (ES2020)
\`\`\`javascript
const bigNumber = 9007199254740991n;
\`\`\`

### 7. Symbol (ES6)
\`\`\`javascript
const id = Symbol("unique");
\`\`\`

\`\`\`callout
warning: typeof null Bug
\`typeof null\` menghasilkan \`"object"\` — ini adalah **bug legendaris** di JavaScript sejak awal. Seharusnya menghasilkan \`"null"\`, tapi tidak pernah diperbaiki karena akan merusak banyak kode yang sudah ada.
\`\`\`

## Tipe Data Non-Primitif

### Object
\`\`\`javascript
const user = {
  nama: "Timur",
  umur: 25,
  hobi: ["coding", "gaming"]
};
\`\`\`

### Array
\`\`\`javascript
const colors = ["red", "green", "blue"];
console.log(colors[0]); // "red"
console.log(colors.length); // 3
\`\`\`

\`\`\`callout
info: Array adalah Object
Di JavaScript, Array sebenarnya adalah tipe khusus dari Object. Itulah kenapa \`typeof []\` menghasilkan \`"object"\`.
\`\`\`

## Type Checking

\`\`\`javascript
typeof "hello"    // "string"
typeof 42         // "number"
typeof true       // "boolean"
typeof undefined  // "undefined"
typeof null       // "object" (bug!)
typeof {}         // "object"
typeof []         // "object" (karena array = object)
Array.isArray([]) // true (cara yang benar cek array)
\`\`\`

## Type Coercion (Konversi Otomatis)

JavaScript akan **otomatis mengkonversi** tipe data saat diperlukan. Ini sering bikin bingung:

\`\`\`javascript
"5" + 3    // "53" (number jadi string!)
"5" - 3    // 2 (string jadi number!)
"5" == 5   // true (loose equality, ada coercion)
"5" === 5  // false (strict equality, tanpa coercion)
\`\`\`

\`\`\`callout
tip: Selalu Gunakan ===
Gunakan \`===\` (strict equality) daripada \`==\` (loose equality). Ini mencegah bug yang sulit dilacak akibat type coercion otomatis.
\`\`\`

\`\`\`quiz
{
  "question": "Apa hasil dari: typeof null?",
  "options": ["null", "undefined", "object", "boolean"],
  "answer": 2
}
\`\`\`

\`\`\`quiz
{
  "question": "Keyword mana yang sebaiknya digunakan secara default untuk mendeklarasikan variabel?",
  "options": ["var", "let", "const", "function"],
  "answer": 2
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa hasil dari: '5' + 3?",
  "options": ["8", "53", "NaN", "Error"],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Variabel & Tipe Data",
  "steps": [
    "Buat variabel const untuk menyimpan nama kamu",
    "Buat variabel let untuk menyimpan umur kamu",
    "Cek tipe data keduanya dengan typeof",
    "Buat sebuah object 'profil' yang berisi nama, umur, dan hobi (array)",
    "Coba lakukan '10' + 5 dan '10' - 5, bandingkan hasilnya"
  ]
}
\`\`\`

---
Selanjutnya kita akan belajar tentang Functions — konsep paling penting dalam JavaScript!
`
    },

    // ─────────────────────────────────────────
    // Article 3: Functions & Scope
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "functions-dan-scope-javascript",
        title: "Functions & Scope: Membangun Blok Logika",
        excerpt: "Kuasai function declaration, expression, arrow functions, dan pahami cara kerja scope & closure di JavaScript.",
        difficulty: "beginner",
        content: `# Functions & Scope JavaScript

Function adalah **blok kode yang bisa dipakai ulang**. Ini adalah konsep terpenting dalam JavaScript — hampir semua hal di JS dibangun di atas functions.

## Jenis-jenis Function

### 1. Function Declaration
\`\`\`javascript
function greet(name) {
  return "Hello, " + name + "!";
}
greet("Nolt"); // "Hello, Nolt!"
\`\`\`

### 2. Function Expression
\`\`\`javascript
const greet = function(name) {
  return "Hello, " + name + "!";
};
\`\`\`

### 3. Arrow Function (ES6) ⭐
\`\`\`javascript
const greet = (name) => {
  return "Hello, " + name + "!";
};

// Short syntax (satu ekspresi)
const greet = (name) => \\\`Hello, \\\${name}!\\\`;
\`\`\`

\`\`\`callout
tip: Kapan Pakai Arrow Function?
Gunakan arrow function untuk callback dan function pendek. Gunakan function declaration untuk function utama yang perlu di-hoist (bisa dipanggil sebelum dideklarasi).
\`\`\`

## Parameters & Arguments

### Default Parameters
\`\`\`javascript
function createUser(name, role = "member") {
  return { name, role };
}
createUser("Timur");               // { name: "Timur", role: "member" }
createUser("Timur", "admin");      // { name: "Timur", role: "admin" }
\`\`\`

### Rest Parameters
\`\`\`javascript
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4, 5); // 15
\`\`\`

### Destructuring Parameters
\`\`\`javascript
function displayUser({ name, age, role = "member" }) {
  console.log(\\\`\\\${name} (\\\${age}) - \\\${role}\\\`);
}
displayUser({ name: "Nolt", age: 25 });
\`\`\`

## Scope — Jangkauan Variabel

Scope menentukan **di mana** variabel bisa diakses.

### Global Scope
\`\`\`javascript
const appName = "NoltPedia"; // Bisa diakses di mana saja
\`\`\`

### Function Scope
\`\`\`javascript
function doSomething() {
  const secret = "hidden";    // Hanya bisa diakses di dalam function ini
}
// console.log(secret); // ERROR: secret is not defined
\`\`\`

### Block Scope (let & const)
\`\`\`javascript
if (true) {
  let x = 10;   // Hanya ada di dalam block {}
  const y = 20; // Sama, hanya di dalam block
}
// x dan y tidak bisa diakses di sini
\`\`\`

\`\`\`callout
warning: var Tidak Punya Block Scope!
\`var\` hanya punya function scope, bukan block scope. Ini salah satu alasan utama kenapa \`var\` sebaiknya tidak digunakan lagi.
\`\`\`

\`\`\`javascript
if (true) {
  var leaked = "I'm visible outside!";
}
console.log(leaked); // "I'm visible outside!" — BERBAHAYA!
\`\`\`

## Closure — Konsep Power User

Closure terjadi ketika function **mengingat** variabel dari scope tempat ia dibuat, bahkan setelah scope tersebut selesai dieksekusi.

\`\`\`javascript
function createCounter() {
  let count = 0;  // Variabel private
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}

const counter = createCounter();
counter.increment(); // 1
counter.increment(); // 2
counter.decrement(); // 1
counter.getCount();  // 1
// count tidak bisa diakses langsung dari luar!
\`\`\`

\`\`\`callout
info: Closure di Dunia Nyata
Closure digunakan di mana-mana: React hooks (useState, useEffect), event handlers, module pattern, dan data privacy.
\`\`\`

## Higher-Order Functions

Function yang **menerima function lain** sebagai argumen atau **mengembalikan function**.

\`\`\`javascript
// Menerima function sebagai argumen
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);     // [2, 4, 6, 8, 10]
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]
const total = numbers.reduce((sum, n) => sum + n, 0); // 15
\`\`\`

\`\`\`callout
tip: Tiga Musketeer Array
\`map()\`, \`filter()\`, dan \`reduce()\` adalah tiga method array yang **paling sering dipakai** di JavaScript modern. Kuasai ketiganya dan kamu sudah menguasai 80% manipulasi data.
\`\`\`

\`\`\`quiz
{
  "question": "Apa itu Closure?",
  "options": [
    "Function yang menutup program",
    "Function yang mengingat variabel dari scope tempatnya dibuat",
    "Function yang tidak mengembalikan nilai",
    "Function yang hanya berjalan sekali"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Method array mana yang digunakan untuk mengubah setiap elemen array?",
  "options": ["filter()", "reduce()", "map()", "forEach()"],
  "answer": 2
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Functions & Scope",
  "steps": [
    "Buat function declaration yang menghitung luas persegi panjang",
    "Ubah function tersebut menjadi arrow function",
    "Buat function createGreeter(greeting) yang return function(name)",
    "Gunakan .map() untuk mengubah array angka menjadi kuadratnya",
    "Gunakan .filter() untuk menyaring angka genap saja",
    "Gunakan .reduce() untuk menjumlahkan seluruh angka"
  ]
}
\`\`\`

---
Selanjutnya kita akan masuk ke dunia Asynchronous JavaScript — bagaimana JS menangani operasi yang memakan waktu.
`
    },

    // ─────────────────────────────────────────
    // Article 4: Async JavaScript
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "asynchronous-javascript",
        title: "Async JavaScript: Callback, Promise & Async/Await",
        excerpt: "Pahami cara JavaScript menangani operasi asynchronous — dari callback hell hingga elegasi async/await.",
        difficulty: "intermediate",
        content: `# Asynchronous JavaScript

JavaScript adalah bahasa **single-threaded**, artinya hanya bisa menjalankan satu hal dalam satu waktu. Lalu bagaimana cara menangani operasi yang memakan waktu seperti API call atau file reading? Jawabannya: **asynchronous programming**.

## Mengapa Perlu Async?

Bayangkan kamu memesan makanan di restoran:
- **Synchronous**: Kamu menunggu di tempat sampai makanan jadi, baru bisa melakukan hal lain
- **Asynchronous**: Kamu memesan, lalu bisa melakukan hal lain sambil menunggu

\`\`\`callout
info: Event Loop
JavaScript menggunakan Event Loop untuk menangani operasi async. Ia meletakkan operasi yang memakan waktu ke "antrian" dan melanjutkan kode berikutnya.
\`\`\`

## 1. Callback (Era Awal)

Callback adalah function yang dikirim sebagai argumen ke function lain, untuk dijalankan **setelah** operasi selesai.

\`\`\`javascript
function fetchData(callback) {
  setTimeout(() => {
    const data = { name: "Nolt", role: "admin" };
    callback(data);
  }, 1000);
}

fetchData((result) => {
  console.log(result); // { name: "Nolt", role: "admin" }
});
\`\`\`

### Callback Hell 😱

Ketika callback bersarang terlalu dalam:

\`\`\`javascript
getUser(userId, (user) => {
  getOrders(user.id, (orders) => {
    getProducts(orders[0].id, (products) => {
      getReviews(products[0].id, (reviews) => {
        // Ini sangat sulit dibaca dan di-maintain!
      });
    });
  });
});
\`\`\`

\`\`\`callout
warning: Hindari Callback Hell
Callback hell membuat kode sulit dibaca, sulit di-debug, dan sulit di-maintain. Gunakan Promise atau async/await sebagai gantinya.
\`\`\`

## 2. Promise (ES6) ⭐

Promise adalah objek yang merepresentasikan **hasil (atau kegagalan) dari operasi async** di masa depan.

Promise memiliki 3 state:
- **Pending**: Masih menunggu
- **Fulfilled**: Berhasil (resolve)
- **Rejected**: Gagal (reject)

\`\`\`javascript
function fetchData() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const success = true;
      if (success) {
        resolve({ name: "Nolt", role: "admin" });
      } else {
        reject(new Error("Failed to fetch data"));
      }
    }, 1000);
  });
}

fetchData()
  .then(data => console.log("Success:", data))
  .catch(error => console.error("Error:", error))
  .finally(() => console.log("Selesai"));
\`\`\`

### Promise Chaining (Mengatasi Callback Hell)

\`\`\`javascript
getUser(userId)
  .then(user => getOrders(user.id))
  .then(orders => getProducts(orders[0].id))
  .then(products => getReviews(products[0].id))
  .then(reviews => console.log(reviews))
  .catch(error => console.error("Something went wrong:", error));
\`\`\`

\`\`\`callout
tip: Promise.all vs Promise.race
Gunakan \`Promise.all()\` untuk menjalankan beberapa Promise secara paralel dan menunggu semuanya selesai. Gunakan \`Promise.race()\` untuk menunggu yang tercepat selesai saja.
\`\`\`

\`\`\`javascript
// Jalankan secara paralel
const [users, products] = await Promise.all([
  fetchUsers(),
  fetchProducts(),
]);
\`\`\`

## 3. Async/Await (ES2017) ⭐⭐

Async/await adalah **syntax sugar** di atas Promise yang membuat kode async terlihat seperti kode synchronous.

\`\`\`javascript
async function loadDashboard() {
  try {
    const user = await getUser(userId);
    const orders = await getOrders(user.id);
    const products = await getProducts(orders[0].id);
    console.log(products);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    console.log("Loading complete");
  }
}
\`\`\`

\`\`\`callout
success: Async/Await = Best Practice
Async/await adalah cara yang paling direkomendasikan untuk menulis kode asynchronous di JavaScript modern. Kodenya bersih, mudah dibaca, dan mudah di-debug.
\`\`\`

## Fetch API — Contoh Dunia Nyata

\`\`\`javascript
async function getArticles() {
  try {
    const response = await fetch("/api/articles");
    
    if (!response.ok) {
      throw new Error(\\\`HTTP error! status: \\\${response.status}\\\`);
    }
    
    const articles = await response.json();
    return articles;
  } catch (error) {
    console.error("Gagal mengambil artikel:", error);
    return [];
  }
}
\`\`\`

## Error Handling Pattern

\`\`\`javascript
// Pattern 1: Try-catch (paling umum)
async function safeFetch(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.error("Fetch failed:", err);
    return null;
  }
}

// Pattern 2: Wrapper function (untuk reusability)
async function tryCatch(promise) {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    return [null, error];
  }
}

const [data, error] = await tryCatch(fetchUsers());
if (error) console.error(error);
\`\`\`

\`\`\`quiz
{
  "question": "Apa state awal dari sebuah Promise?",
  "options": ["Fulfilled", "Rejected", "Pending", "Completed"],
  "answer": 2
}
\`\`\`

\`\`\`quiz
{
  "question": "Async/await adalah syntax sugar di atas apa?",
  "options": ["Callback", "Promise", "Event Loop", "Generator"],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Async JavaScript",
  "steps": [
    "Buat function yang me-return Promise berisi data user setelah 2 detik",
    "Panggil function tersebut dengan .then() dan .catch()",
    "Ubah pemanggilan menjadi async/await dengan try-catch",
    "Gunakan fetch() untuk mengambil data dari https://jsonplaceholder.typicode.com/posts/1",
    "Buat 3 Promise dan jalankan secara paralel dengan Promise.all()"
  ]
}
\`\`\`

---
Selanjutnya kita akan belajar tentang manipulasi DOM — bagaimana JavaScript mengontrol halaman web.
`
    },

    // ─────────────────────────────────────────
    // Article 5: DOM Manipulation & Events
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "dom-manipulation-dan-events",
        title: "DOM Manipulation & Events: Menghidupkan Halaman Web",
        excerpt: "Pelajari cara JavaScript berinteraksi dengan halaman web — memanipulasi elemen, menangani event, dan membuat UI dinamis.",
        difficulty: "intermediate",
        content: `# DOM Manipulation & Events

DOM (Document Object Model) adalah **representasi terstruktur** dari halaman HTML yang memungkinkan JavaScript membaca dan mengubah konten, struktur, dan style halaman web secara dinamis.

## Apa itu DOM?

Bayangkan HTML sebagai pohon keluarga. Setiap elemen HTML adalah "anggota keluarga" yang saling terhubung:

\`\`\`
document
  └── html
      ├── head
      │   └── title
      └── body
          ├── h1
          ├── p
          └── div
              ├── button
              └── input
\`\`\`

\`\`\`callout
info: DOM ≠ HTML
DOM adalah representasi _live_ dari HTML. Perubahan di DOM langsung terlihat di halaman, tapi tidak mengubah file HTML aslinya.
\`\`\`

## Memilih Elemen

### Method Modern (Recommended)
\`\`\`javascript
// Pilih satu elemen (yang pertama ditemukan)
const title = document.querySelector("h1");
const btn = document.querySelector("#submit-btn");
const card = document.querySelector(".card");

// Pilih semua elemen yang cocok
const items = document.querySelectorAll(".list-item");
items.forEach(item => console.log(item.textContent));
\`\`\`

### Method Klasik
\`\`\`javascript
const el = document.getElementById("app");
const els = document.getElementsByClassName("card"); // HTMLCollection
const tags = document.getElementsByTagName("p");      // HTMLCollection
\`\`\`

\`\`\`callout
tip: querySelector > getElementById
\`querySelector\` dan \`querySelectorAll\` lebih versatile karena bisa menggunakan CSS selector. Gunakan ini sebagai default.
\`\`\`

## Mengubah Konten & Atribut

\`\`\`javascript
const title = document.querySelector("h1");

// Ubah teks
title.textContent = "Hello, NoltPedia!";

// Ubah HTML
title.innerHTML = "Hello, <strong>NoltPedia</strong>!";

// Ubah atribut
const link = document.querySelector("a");
link.setAttribute("href", "https://noltpedia.com");
link.getAttribute("href"); // "https://noltpedia.com"

// Data attributes
const card = document.querySelector("[data-id='123']");
card.dataset.id;      // "123"
card.dataset.active = "true"; // Menambah data-active="true"
\`\`\`

\`\`\`callout
warning: innerHTML vs textContent
Gunakan \`textContent\` jika hanya perlu mengubah teks. \`innerHTML\` bisa menyebabkan XSS (Cross-Site Scripting) jika menerima input dari user tanpa sanitasi.
\`\`\`

## Mengubah Style

\`\`\`javascript
const box = document.querySelector(".box");

// Inline style
box.style.backgroundColor = "red";
box.style.padding = "20px";
box.style.border = "3px solid black";

// Lebih baik: gunakan CSS classes
box.classList.add("active");
box.classList.remove("hidden");
box.classList.toggle("dark-mode");
box.classList.contains("active"); // true/false
\`\`\`

\`\`\`callout
tip: classList > style
Selalu gunakan \`classList\` untuk mengubah tampilan daripada mengubah style secara langsung. Ini memisahkan concern antara JavaScript dan CSS.
\`\`\`

## Membuat & Menghapus Elemen

\`\`\`javascript
// Membuat elemen baru
const newCard = document.createElement("div");
newCard.className = "card";
newCard.textContent = "Artikel baru!";

// Menambahkan ke DOM
document.querySelector(".container").appendChild(newCard);

// Modern: insertAdjacentHTML
const container = document.querySelector(".container");
container.insertAdjacentHTML("beforeend", \\\`
  <div class="card">
    <h3>Judul</h3>
    <p>Deskripsi</p>
  </div>
\\\`);

// Menghapus elemen
newCard.remove();
\`\`\`

## Event Handling

Event adalah **aksi** yang terjadi di halaman web (klik, ketik, scroll, dll).

### addEventListener (Recommended)
\`\`\`javascript
const button = document.querySelector("#submit");

button.addEventListener("click", (event) => {
  console.log("Button clicked!");
  console.log("Target:", event.target);
  event.preventDefault(); // Mencegah behavior default
});
\`\`\`

### Common Events

| Event | Deskripsi |
|-------|-----------|
| click | Elemen diklik |
| input | Nilai input berubah (real-time) |
| change | Nilai input berubah (setelah blur) |
| submit | Form di-submit |
| keydown | Tombol keyboard ditekan |
| mouseenter | Mouse masuk ke elemen |
| mouseleave | Mouse keluar dari elemen |
| scroll | Halaman di-scroll |
| load | Halaman selesai dimuat |

### Event Delegation

Daripada menambahkan event ke setiap elemen, tambahkan ke parent dan filter berdasarkan target.

\`\`\`javascript
// ❌ Bad: Event listener di setiap button
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("click", handleClick);
});

// ✅ Good: Event delegation
document.querySelector(".btn-container").addEventListener("click", (e) => {
  if (e.target.matches(".btn")) {
    handleClick(e);
  }
});
\`\`\`

\`\`\`callout
success: Event Delegation = Performance
Event delegation lebih efisien karena hanya satu event listener, bukan ratusan. Ini juga otomatis bekerja untuk elemen yang ditambahkan secara dinamis.
\`\`\`

## Contoh: Simple Todo App

\`\`\`javascript
const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const list = document.querySelector("#todo-list");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  if (!input.value.trim()) return;
  
  const li = document.createElement("li");
  li.textContent = input.value;
  li.addEventListener("click", () => li.classList.toggle("done"));
  
  list.appendChild(li);
  input.value = "";
  input.focus();
});
\`\`\`

\`\`\`quiz
{
  "question": "Method mana yang direkomendasikan untuk memilih elemen DOM?",
  "options": ["getElementById", "getElementsByClassName", "querySelector", "getElementsByTagName"],
  "answer": 2
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa keuntungan utama event delegation?",
  "options": [
    "Membuat kode lebih panjang",
    "Menggunakan lebih sedikit memory dan bekerja untuk elemen dinamis",
    "Membuat animasi lebih cepat",
    "Menghilangkan kebutuhan CSS"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan DOM Manipulation",
  "steps": [
    "Buat halaman HTML sederhana dengan sebuah h1, input, dan button",
    "Gunakan querySelector untuk memilih ketiga elemen tersebut",
    "Tambahkan event click pada button yang mengubah teks h1 sesuai value input",
    "Gunakan classList.toggle untuk menambahkan/menghapus class 'dark' pada body",
    "Buat simple todo list yang bisa menambahkan item baru"
  ]
}
\`\`\`

---
Artikel terakhir! Kita akan membahas ES6+ Modern JavaScript — fitur-fitur terbaru yang wajib dikuasai.
`
    },

    // ─────────────────────────────────────────
    // Article 6: ES6+ Modern JavaScript
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "es6-modern-javascript",
        title: "ES6+ Modern JavaScript: Fitur Wajib yang Harus Dikuasai",
        excerpt: "Destructuring, spread/rest, modules, optional chaining, dan fitur ES6+ lainnya yang membuat kode lebih bersih dan powerful.",
        difficulty: "intermediate",
        content: `# ES6+ Modern JavaScript

ES6 (ECMAScript 2015) adalah pembaruan terbesar dalam sejarah JavaScript. Berikut adalah fitur-fitur terpenting yang **wajib** kamu kuasai untuk menulis kode modern.

## 1. Destructuring

Mengekstrak nilai dari object atau array ke dalam variabel terpisah.

### Object Destructuring
\`\`\`javascript
const user = { name: "Nolt", age: 25, role: "admin" };

// Tanpa destructuring
const name = user.name;
const age = user.age;

// Dengan destructuring ⭐
const { name, age, role } = user;

// Rename
const { name: userName, role: userRole } = user;

// Default value
const { name, theme = "dark" } = user;
\`\`\`

### Array Destructuring
\`\`\`javascript
const colors = ["red", "green", "blue"];

const [first, second, third] = colors;
// first = "red", second = "green", third = "blue"

// Skip elemen
const [, , last] = colors; // last = "blue"

// Swap variabel tanpa temp!
let a = 1, b = 2;
[a, b] = [b, a]; // a = 2, b = 1
\`\`\`

\`\`\`callout
tip: Destructuring di Function Parameters
Destructuring sangat berguna di function parameters — membuat kode lebih jelas dan self-documenting.
\`\`\`

\`\`\`javascript
// ❌ Sulit dibaca
function createUser(name, age, role, theme, lang) { ... }

// ✅ Jelas dan fleksibel
function createUser({ name, age, role = "member", theme = "dark" }) { ... }
createUser({ name: "Nolt", age: 25 });
\`\`\`

## 2. Spread & Rest Operator (...)

Tiga titik (...) dengan dua kegunaan berbeda:

### Spread — "Menyebarkan" elemen
\`\`\`javascript
// Array
const arr1 = [1, 2, 3];
const arr2 = [...arr1, 4, 5]; // [1, 2, 3, 4, 5]

// Object
const base = { theme: "dark", lang: "id" };
const config = { ...base, lang: "en", debug: true };
// { theme: "dark", lang: "en", debug: true }
\`\`\`

### Rest — "Mengumpulkan" sisa elemen
\`\`\`javascript
const [first, ...rest] = [1, 2, 3, 4, 5];
// first = 1, rest = [2, 3, 4, 5]

const { name, ...otherInfo } = { name: "Nolt", age: 25, role: "admin" };
// name = "Nolt", otherInfo = { age: 25, role: "admin" }
\`\`\`

\`\`\`callout
info: Immutable Update Pattern
Spread operator adalah kunci untuk membuat **immutable updates** yang sangat penting di React dan Redux.
\`\`\`

\`\`\`javascript
// Update state tanpa mutasi (React pattern)
const [user, setUser] = useState({ name: "Nolt", age: 25 });
setUser({ ...user, age: 26 }); // Membuat object baru, bukan mengubah yang lama
\`\`\`

## 3. Template Literals

\`\`\`javascript
const name = "NoltPedia";
const version = 7;

// String interpolation
const msg = \\\`Welcome to \\\${name} v\\\${version}!\\\`;

// Multi-line strings
const html = \\\`
  <div class="card">
    <h2>\\\${name}</h2>
    <p>Phase \\\${version}</p>
  </div>
\\\`;

// Tagged templates (advanced)
function highlight(strings, ...values) {
  return strings.reduce((result, str, i) =>
    result + str + (values[i] ? \\\`<mark>\\\${values[i]}</mark>\\\` : ""), "");
}
const output = highlight\\\`Hello \\\${name}, you are on phase \\\${version}\\\`;
\`\`\`

## 4. Optional Chaining (?.) & Nullish Coalescing (??)

### Optional Chaining
\`\`\`javascript
const user = { profile: { address: { city: "Jakarta" } } };

// Tanpa optional chaining (verbose)
const city = user && user.profile && user.profile.address && user.profile.address.city;

// Dengan optional chaining ⭐
const city = user?.profile?.address?.city; // "Jakarta"
const zip = user?.profile?.address?.zipCode; // undefined (tanpa error!)
\`\`\`

### Nullish Coalescing
\`\`\`javascript
// || mengganggap 0, "", false sebagai falsy
const count = 0;
const result = count || 10; // 10 (SALAH! 0 adalah nilai valid)

// ?? hanya mengganggap null/undefined
const result = count ?? 10; // 0 (BENAR!)
const name = null ?? "Anonymous"; // "Anonymous"
\`\`\`

\`\`\`callout
tip: Combo Power — ?. dan ?? Bersama
Kombinasi optional chaining dan nullish coalescing sangat powerful untuk mengakses nested data dengan default value.
\`\`\`

\`\`\`javascript
const theme = user?.settings?.theme ?? "dark";
const lang = config?.localization?.language ?? "id";
\`\`\`

## 5. Array Methods Modern

\`\`\`javascript
const products = [
  { name: "Laptop", price: 15000000, category: "tech" },
  { name: "Buku JS", price: 150000, category: "book" },
  { name: "Mouse", price: 500000, category: "tech" },
  { name: "Buku React", price: 200000, category: "book" },
];

// find — cari satu elemen
const laptop = products.find(p => p.name === "Laptop");

// some — apakah ada yang memenuhi kondisi?
const hasExpensive = products.some(p => p.price > 10000000); // true

// every — apakah semua memenuhi kondisi?
const allCheap = products.every(p => p.price < 1000000); // false

// flatMap — map + flatten
const tags = [["js", "react"], ["node", "express"]];
const flat = tags.flatMap(t => t); // ["js", "react", "node", "express"]

// Object.entries & Object.fromEntries
const obj = { a: 1, b: 2, c: 3 };
const doubled = Object.fromEntries(
  Object.entries(obj).map(([key, val]) => [key, val * 2])
);
// { a: 2, b: 4, c: 6 }
\`\`\`

## 6. Modules (Import/Export)

\`\`\`javascript
// utils.js — Named exports
export const formatDate = (date) => date.toLocaleDateString("id-ID");
export const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

// app.js — Named imports
import { formatDate, capitalize } from "./utils.js";

// Default export
export default function App() { ... }
import App from "./App.js";

// Re-export
export { formatDate } from "./utils.js";
export * from "./helpers.js";
\`\`\`

\`\`\`callout
success: Modules = Clean Architecture
Modules memungkinkan kamu mengorganisir kode ke dalam file-file kecil yang focused. Ini adalah fondasi dari modern JavaScript development.
\`\`\`

## 7. Short-circuit & Logical Assignment

\`\`\`javascript
// Short-circuit evaluation
const isAdmin = user.role === "admin" && <AdminPanel />;   // React pattern
const displayName = user.name || "Anonymous";

// Logical assignment (ES2021)
let config = {};
config.theme ??= "dark";   // Set default jika null/undefined
config.debug ||= false;    // Set default jika falsy
config.count &&= config.count + 1; // Update jika truthy
\`\`\`

\`\`\`quiz
{
  "question": "Apa hasil dari: const [a, ...b] = [1, 2, 3, 4]? Nilai b adalah:",
  "options": ["[2, 3, 4]", "[1, 2, 3, 4]", "4", "[2]"],
  "answer": 0
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa perbedaan utama antara || dan ?? (nullish coalescing)?",
  "options": [
    "Tidak ada perbedaan",
    "?? hanya mengecek null/undefined, || mengecek semua falsy values",
    "|| lebih cepat dari ??",
    "?? hanya bisa dipakai dengan string"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa output dari: const { x = 10 } = { x: 0 }?",
  "options": ["x = 10", "x = 0", "x = undefined", "Error"],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan ES6+ Modern JavaScript",
  "steps": [
    "Gunakan destructuring untuk mengekstrak name dan age dari object user",
    "Gunakan spread operator untuk menggabungkan dua array",
    "Gunakan optional chaining untuk mengakses nested property yang mungkin undefined",
    "Buat module utils.js dengan 3 exported functions",
    "Gunakan Array.find() dan Array.some() pada array of objects",
    "Implementasikan immutable state update menggunakan spread operator"
  ]
}
\`\`\`

---

🎉 **Selamat!** Kamu telah menyelesaikan semua materi JavaScript fundamental! Dengan menguasai konsep-konsep ini, kamu sudah siap untuk belajar framework seperti React, Vue, atau Angular.

\`\`\`callout
success: Next Steps
Materi ini mencakup 80% dari apa yang kamu butuhkan dalam daily JavaScript development. Terus latihan, baca dokumentasi, dan bangun project nyata untuk mengasah skill kamu!
\`\`\`
`
    },
];

async function main() {
    console.log("🚀 Starting JavaScript content seed...\n");

    // 1. Create JavaScript topic
    console.log("📂 Creating JavaScript topic...");
    try {
        // Check if topic already exists
        const existingTopic = await db.query.topics.findFirst({
            where: eq(schema.topics.id, TOPIC_ID),
        });

        if (!existingTopic) {
            await db.insert(schema.topics).values({
                id: TOPIC_ID,
                name: "JavaScript",
                description: "Materi lengkap tentang bahasa pemrograman JavaScript — dari dasar hingga fitur modern ES6+",
                icon: "⚡",
                sortOrder: 1,
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log("   ✅ Topic 'JavaScript' created");
        } else {
            console.log("   ⏭️ Topic 'JavaScript' already exists, skipping");
        }
    } catch (e: any) {
        console.error("   ❌ Error creating topic:", e.message);
    }

    // 2. Insert articles
    console.log("\n📝 Creating articles...");
    const createdArticleIds: string[] = [];

    for (const article of articles) {
        try {
            // Check if slug already exists
            const existing = await db.query.articles.findFirst({
                where: eq(schema.articles.slug, article.slug),
            });

            if (existing) {
                console.log(`   ⏭️ "${article.title}" already exists, skipping`);
                createdArticleIds.push(existing.id);
                continue;
            }

            await db.insert(schema.articles).values({
                id: article.id,
                title: article.title,
                slug: article.slug,
                content: article.content,
                excerpt: article.excerpt,
                topicId: TOPIC_ID,
                difficulty: article.difficulty,
                isPublished: true,
                authorId: "system",
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            createdArticleIds.push(article.id);
            console.log(`   ✅ "${article.title}"`);
        } catch (e: any) {
            console.error(`   ❌ Error creating "${article.title}":`, e.message);
        }
    }

    // 3. Create Learning Path
    console.log("\n🗺️ Creating Learning Path...");
    const pathId = nanoid();
    const PATH_SLUG = "javascript-fundamentals";

    try {
        const existingPath = await db.query.paths.findFirst({
            where: eq(schema.paths.slug, PATH_SLUG),
        });

        if (existingPath) {
            console.log("   ⏭️ Path 'JavaScript Fundamentals' already exists, skipping");
        } else {
            await db.insert(schema.paths).values({
                id: pathId,
                title: "JavaScript Fundamentals: Dari Nol Sampai Mahir",
                description: "Learning path lengkap untuk menguasai JavaScript — mulai dari pengenalan, variabel, functions, async programming, DOM manipulation, hingga fitur modern ES6+.",
                slug: PATH_SLUG,
                isPublished: true,
                createdAt: new Date(),
            });
            console.log("   ✅ Path 'JavaScript Fundamentals' created");

            // 4. Add steps to the path
            console.log("\n📋 Adding path steps...");
            for (let i = 0; i < createdArticleIds.length; i++) {
                await db.insert(schema.pathSteps).values({
                    id: nanoid(),
                    pathId: pathId,
                    articleId: createdArticleIds[i],
                    stepOrder: i + 1,
                });
                console.log(`   ✅ Step ${i + 1}: ${articles[i].title.substring(0, 50)}...`);
            }
        }
    } catch (e: any) {
        console.error("   ❌ Error creating path:", e.message);
    }

    console.log("\n🎉 JavaScript content seed completed!");
    console.log(`   📝 ${createdArticleIds.length} articles`);
    console.log(`   🗺️ 1 learning path with ${createdArticleIds.length} steps`);
    process.exit(0);
}

main().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
