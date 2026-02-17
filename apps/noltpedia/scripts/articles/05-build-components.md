# Build Real-World Components: Praktek Membangun UI Modern

Sekarang waktunya praktek! Di artikel ini, kita akan membangun beberapa real-world components.

---

## Component 1: Card Component

### Basic Card

```html
<div class="bg-white rounded-lg shadow-md overflow-hidden">
  <img src="https://via.placeholder.com/400x200" alt="Card image" class="w-full h-48 object-cover" />
  
  <div class="p-6">
    <h3 class="text-xl font-bold text-gray-900 mb-2">Card Title</h3>
    <p class="text-gray-600 mb-4">
      This is a card component with image, title, description, and button.
    </p>
    <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
      Learn More
    </button>
  </div>
</div>
```

### Card Grid (Responsive)

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <!-- Cards di sini -->
</div>
```

```callout
success: Grid Layout
Gunakan `grid` untuk card layout. `grid-cols-1` untuk mobile, `md:grid-cols-2` untuk tablet, `lg:grid-cols-3` untuk desktop.
```

---

## Component 2: Navigation Bar

### Simple Navigation

```html
<nav class="bg-white shadow-md">
  <div class="container mx-auto px-4">
    <div class="flex justify-between items-center h-16">
      <a href="#" class="text-2xl font-bold text-gray-900">
        Logo
      </a>
      
      <div class="hidden md:flex space-x-8 items-center">
        <a href="#" class="text-gray-700 hover:text-blue-500">Home</a>
        <a href="#" class="text-gray-700 hover:text-blue-500">About</a>
        <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Get Started
        </button>
      </div>
    </div>
  </div>
</nav>
```

---

## Component 3: Form Components

### Contact Form

```html
<form class="max-w-md mx-auto space-y-6">
  <div>
    <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name</label>
    <input type="text" id="name" class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
  </div>
  
  <div>
    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
    <input type="email" id="email" class="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
  </div>
  
  <button type="submit" class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
    Send Message
  </button>
</form>
```

---

## Component 4: Hero Section

```html
<section class="bg-gradient-to-r from-blue-500 to-purple-600 py-20">
  <div class="container mx-auto px-4 text-center">
    <h1 class="text-4xl md:text-6xl font-bold text-white mb-6">
      Welcome to Our Platform
    </h1>
    <p class="text-xl text-white mb-8">
      Build amazing things with our powerful tools
    </p>
    <button class="bg-white text-blue-500 px-8 py-3 rounded font-semibold hover:bg-gray-100">
      Get Started
    </button>
  </div>
</section>
```

```callout
warning: Text Readability
Selalu gunakan overlay (misal `bg-black/50`) pada background image untuk memastikan text tetap readable.
```

---

## Component 5: Footer Component

```html
<footer class="bg-gray-900 text-gray-300 py-12">
  <div class="container mx-auto px-4">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <h3 class="text-white font-bold mb-4">Company</h3>
        <p class="text-sm">Build amazing things</p>
      </div>
      
      <div>
        <h3 class="text-white font-bold mb-4">Links</h3>
        <ul class="space-y-2">
          <li><a href="#" class="hover:text-white">Home</a></li>
          <li><a href="#" class="hover:text-white">About</a></li>
        </ul>
      </div>
    </div>
  </div>
</footer>
```

---

## Test Understanding

```quiz
{
  "question": "Apa yang harus dilakukan untuk memastikan text readable di atas background image?",
  "options": [
    "Tidak perlu apa-apa",
    "Gunakan overlay (misal bg-black/50) pada background image",
    "Ganti warna text ke putih saja",
    "Hapus background image"
  ],
  "answer": 1
}
```

---

## Final Challenge: Build Complete Landing Page

```challenge
{
  "title": "Build Complete Landing Page",
  "steps": [
    "Create navigation bar dengan logo dan links",
    "Build hero section dengan gradient background",
    "Create features section dengan card grid layout",
    "Build pricing section dengan cards",
    "Create contact form section",
    "Add footer component",
    "Make fully responsive (mobile, tablet, desktop)",
    "Implement dark mode"
  ]
}
```

---

Selanjutnya kita akan membahas best practices dan optimization!
