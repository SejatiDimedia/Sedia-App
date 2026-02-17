# Core Concepts & Utilities: Dasar-Dasar Styling dengan Tailwind

Setelah setup Tailwind, sekarang waktunya memahami core concepts dan utilities yang sering dipakai.

---

## Utility-First Approach Deep Dive

Utility-first berarti kamu styling dengan menggabungkan class-class kecil yang masing-masing punya satu fungsi spesifik.

**Traditional CSS:**
```html
<div class="card">...</div>
```

**Tailwind CSS:**
```html
<div class="bg-white p-6 rounded-lg shadow-lg">
  ...
</div>
```

```callout
info: Trade-offs
Utility-first: Development lebih cepat, CSS output lebih kecil. Traditional CSS: HTML lebih bersih, tapi bisa menyebabkan specificity issues.
```

---

## Spacing & Sizing

### Padding
```html
<div class="p-4">1rem (16px)</div>
<div class="px-4 py-2">horizontal 1rem, vertical 0.5rem</div>
```

### Width & Height
```html
<div class="w-full">100% width</div>
<div class="w-1/2">50% width</div>
<div class="h-screen">100vh</div>
```

---

## Typography

### Font Size
```html
<p class="text-sm">small (14px)</p>
<p class="text-base">base (16px)</p>
<p class="text-xl">extra large (20px)</p>
```

### Text Alignment
```html
<p class="text-center">center aligned</p>
```

---

## Colors

```html
<div class="bg-blue-500 text-white">
  Background blue, text white
</div>

<div class="bg-gradient-to-r from-purple-500 to-pink-500">
  Gradient
</div>
```

```callout
warning: Accessibility Matters
Pastikan contrast ratio memenuhi standar WCAG AA (4.5:1 untuk teks normal).
```

---

## Layout: Flexbox

```html
<div class="flex justify-between items-center">
  Space between, vertically centered
</div>
```

---

## Test Understanding

```quiz
{
  "question": "Apa fungsi dari 'mx-auto'?",
  "options": [
    "Margin left dan right auto (center horizontally)",
    "Margin x-axis fixed",
    "Padding horizontal auto",
    "Flexbox center"
  ],
  "answer": 0
}
```

---

## Challenge: Build Navbar Component

```challenge
{
  "title": "Build Responsive Navbar",
  "steps": [
    "Create navbar dengan logo di kiri dan links di kanan",
    "Gunakan flexbox untuk layout horizontal",
    "Make responsive: links stacked di mobile",
    "Add hover effect pada links"
  ]
}
```

---

Selanjutnya kita akan belajar arbitrary values dan arbitrary variants!
