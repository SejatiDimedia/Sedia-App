# Advanced Features: Container Queries, Color Spaces & Plugins

Tailwind CSS v3 hadir dengan banyak advanced features.

---

## Container Queries

Container queries memungkinkan styling berdasarkan parent container size, bukan viewport size.

```bash
npm install -D @tailwindcss/container-queries
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
```

### Basic Usage

```html
<div class="@container">
  <div class="@lg:bg-blue-500 @lg:text-white">
    Changes based on parent container size!
  </div>
</div>
```

```callout
info: Container Queries vs Media Queries
Media queries: styling berdasarkan viewport size. Container queries: styling berdasarkan parent container size.
```

---

## Modern Color Spaces

Tailwind v3 mendukung modern color spaces seperti `oklch`, `hsl`, `lab`.

### OKLCH

```html
<div class="bg-[oklch(0.5_0.2_250)] text-white">
  OKLCH color
</div>
```

### HSL

```html
<div class="bg-[hsl(250_80%_60%)] text-white">
  HSL color
</div>
```

```callout
tip: OKLCH untuk Design Systems
OKLCH perfect untuk design systems karena color palette lebih consistent.
```

---

## Typography Plugin

```bash
npm install -D @tailwindcss/typography
```

```html
<article class="prose prose-lg prose-slate dark:prose-invert">
  <h1>Beautiful Typography</h1>
  <p>Automatic styling for all typography elements!</p>
</article>
```

---

## Forms Plugin

```bash
npm install -D @tailwindcss/forms
```

```html
<form class="space-y-4">
  <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded" />
  <button class="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
</form>
```

---

## Test Understanding

```quiz
{
  "question": "Apa perbedaan utama antara container queries dan media queries?",
  "options": [
    "Tidak ada perbedaan",
    "Container queries berdasarkan viewport size, media queries berdasarkan parent container",
    "Container queries berdasarkan parent container, media queries berdasarkan viewport",
    "Container queries lebih modern, media queries sudah deprecated"
  ],
  "answer": 2
}
```

---

## Challenge: Build Documentation Page

```challenge
{
  "title": "Build Documentation Page",
  "steps": [
    "Create documentation layout dengan sidebar dan main content",
    "Gunakan container queries untuk responsive sidebar",
    "Implement typography plugin untuk prose content",
    "Use modern color space (oklch atau hsl)"
  ]
}
```

---

Selanjutnya kita akan belajar membangun real-world components!
