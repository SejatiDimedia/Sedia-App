# Arbitrary Values & Variants: Fleksibilitas Maksimal di Tailwind v3

Salah satu fitur paling powerful di Tailwind v3! Arbitrary values dan arbitrary variants memberikan fleksibilitas maksimal.

---

## Apa itu Arbitrary Values?

Arbitrary values memungkinkan kamu menggunakan custom value langsung di class tanpa perlu define di `tailwind.config.js`.

```html
<!-- Custom font size -->
<div class="text-[22px]">Font size 22px</div>

<!-- Custom color -->
<div class="text-[#bada55]">Custom green color</div>

<!-- Custom padding -->
<div class="p-[17px]">Padding 17px</div>
```

```callout
tip: Format Arbitrary Values
Format: `utility-name-[value]`. Contoh: `text-[22px]`, `bg-[#bada55]`.
```

---

## Arbitrary Values dengan Modifiers

```html
<!-- Hover with arbitrary value -->
<div class="hover:bg-[#50d71e]">Hover custom color</div>

<!-- Dark mode -->
<div class="bg-white dark:bg-[#1a1a1a]">
  Dark mode with custom color
</div>

<!-- Responsive -->
<div class="p-4 md:p-[33px] lg:p-[50px]">
  Responsive padding
</div>
```

---

## Arbitrary Properties

```html
<!-- Custom CSS property -->
<div class="[mask-type:luminance]">Mask type</div>

<!-- CSS variable assignment -->
<div class="[--primary:#3b82f6] [--secondary:#8b5cf6]">
  CSS variables defined
</div>
```

---

## Arbitrary Variants

Arbitrary variants memungkinkan kamu membuat custom selector modifiers.

```html
<ul>
  <!-- Target third child -->
  <li class="[&:nth-child(3)]:underline">Item 3</li>
</ul>

<!-- Target all p elements inside -->
<div class="[&_p]:text-gray-600">
  <p>Paragraph 1</p>
  <p>Paragraph 2</p>
</div>
```

---

## At-Rules in Arbitrary Variants

```html
<!-- Media query -->
<div class="[@media(min-width:768px)]:p-8">
  Padding on min-width 768px
</div>

<!-- Feature detection -->
<div class="flex [@supports(display:grid)]:grid">
  Grid if supported, flex if not
</div>
```

```callout
warning: Performance Considerations
At-rules dalam arbitrary variants powerful tapi hati-hati dengan performance. Terlalu banyak complex queries bisa memperlambat rendering.
```

---

## Best Practices

Gunakan arbitrary values untuk kasus unik, tapi untuk values yang sering dipakai, define di theme config.

```html
<!-- ✅ Good: One-off styling -->
<div class="text-[#e11d48]">Brand color used once</div>

<!-- ❌ Bad: Repeated custom value -->
<div class="text-[#e11d48]">Brand color</div>
<div class="text-[#e11d48]">Brand color again</div>
```

---

## Test Understanding

```quiz
{
  "question": "Apa fungsi dari square bracket [...] di Tailwind?",
  "options": [
    "Untuk membuat comments di HTML",
    "Untuk menggunakan arbitrary values (custom values)",
    "Untuk membuat nested selectors",
    "Untuk define CSS variables"
  ],
  "answer": 1
}
```

---

## Challenge: Build Custom Card

```challenge
{
  "title": "Build Custom Card Component",
  "steps": [
    "Create card dengan custom dimensions (350x450px)",
    "Gunakan arbitrary values untuk custom padding, border-radius",
    "Implement custom shadow dengan arbitrary value",
    "Add hover effect dengan arbitrary color"
  ]
}
```

---

Selanjutnya kita akan belajar advanced features!
