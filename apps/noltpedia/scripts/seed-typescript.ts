import 'dotenv/config';
import { db } from "../src/lib/db";
import { schema } from "../src/lib/db";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// =============================================
// TypeScript Learning Content Seed
// 6 Articles + 1 Topic + 1 Learning Path
// =============================================

const TOPIC_ID = "typescript-dasar";

const articles = [
    // ─────────────────────────────────────────
    // Article 1: Pengenalan TypeScript
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "pengenalan-typescript",
        title: "Pengenalan TypeScript: JavaScript dengan Superpowers",
        excerpt: "Kenali TypeScript — bahasa yang membawa type safety ke JavaScript, membantu kamu menulis kode lebih handal dan scalable.",
        difficulty: "beginner",
        content: `# Pengenalan TypeScript

TypeScript adalah **superset** dari JavaScript yang ditambahkan dengan **static typing**. Artinya: semua kode JavaScript yang valid adalah juga valid TypeScript, tapi TypeScript menambahkan fitur type checking yang powerful untuk mencegah bug sejak development time.

## Apa itu TypeScript?

TypeScript dikembangkan oleh **Microsoft** dan pertama kali dirilis pada 2012. Tujuannya sederhana: membawa benefits dari static typing ke JavaScript ecosystem.

\`\`\`callout
tip: TypeScript = JavaScript + Types
Bayangkan TypeScript adalah JavaScript yang "pintar". Ia bisa mendeteksi error sebelum kode kamu dijalankan, memberikan autocomplete yang lebih baik, dan membuat kode lebih mudah di-maintain.
\`\`\`

## Mengapa Belajar TypeScript?

1. **Type Safety** — Mencegah bug sejak development, bukan di production
2. **Better Tooling** — Autocomplete, refactoring, dan navigation yang superior
3. **Self-Documenting** — Types berfungsi sebagai dokumentasi yang selalu up-to-date
4. **Industry Standard** — Dipakai oleh Angular, Vue, React, dan perusahaan besar seperti Microsoft, Google, Uber
5. **Refactoring Confidence** — Ubah kode tanpa takut break yang lain

## TypeScript vs JavaScript

| Fitur | JavaScript | TypeScript |
|-------|-----------|------------|
| Type System | Dynamic (runtime errors) | Static (compile-time errors) |
| Browser Support | Native | Perlu kompilasi ke JS |
| Tooling | Basic | Advanced (IntelliSense, refactoring) |
| Learning Curve | Rendah | Sedang (perlu belajar types) |

\`\`\`callout
info: TypeScript is NOT untuk Runtime
TypeScript type checking terjadi saat compile time, bukan runtime. Setelah dikompilasi, hasilnya adalah JavaScript murni yang bisa dijalankan di browser manapun.
\`\`\`

## Instalasi TypeScript

### Global Installation
\`\`\`bash
# Install TypeScript compiler globally
npm install -g typescript

# Cek versi
tsc --version
\`\`\`

### Project-based Installation (Recommended)
\`\`\`bash
# Initialize new project
npm init -y

# Install TypeScript as dev dependency
npm install --save-dev typescript

# Initialize tsconfig.json
npx tsc --init
\`\`\`

## Konfigurasi tsconfig.json

\`tsconfig.json\` adalah file konfigurasi untuk TypeScript compiler:

\`\`\`json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
\`\`\`

\`\`\`callout
warning: strict Mode adalah Best Practice
Gunakan \`"strict": true\` untuk mengaktifkan semua type checking strict. Ini akan membuat kode kamu lebih aman dari bug, walau awalnya mungkin terasa sedikit lebih strict.
\`\`\`

## Hello TypeScript

Buat file \`hello.ts\`:

\`\`\`typescript
// hello.ts
function greet(name: string): string {
  return \`Hello, \\\${name}!\`;
}

const message = greet("NoltPedia");
console.log(message); // "Hello, NoltPedia!"
\`\`\`

Compile ke JavaScript:

\`\`\`bash
# Compile file TypeScript
tsc hello.ts

# Hasil: hello.js (JavaScript murni)
node hello.js
\`\`\`

\`\`\`callout
success: Auto-Compilation dengan ts-node
Untuk development, gunakan \`ts-node\` untuk menjalankan TypeScript langsung tanpa kompilasi manual:
\`\`npm install -g ts-node\`\`
\`\`ts-node hello.ts\`\`
\`\`\`

## TypeScript Playground

Coba TypeScript tanpa install apa-apa:
- **Official Playground**: https://www.typescriptlang.org/play
- **CodeSandbox**: Search "TypeScript" template
- **StackBlitz**: Support TypeScript out-of-the-box

\`\`\`quiz
{
  "question": "Apa itu TypeScript?",
  "options": [
    "Bahasa pemrograman yang menggantikan JavaScript",
    "Superset dari JavaScript dengan static typing",
    "Framework JavaScript untuk frontend",
    "Library untuk animasi JavaScript"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Kapan type checking terjadi di TypeScript?",
  "options": [
    "Saat runtime (saat kode dijalankan)",
    "Saat compile time (sebelum kode dijalankan)",
    "Saat code review",
    "Saat deployment"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Setup TypeScript Pertama Kamu",
  "steps": [
    "Install TypeScript secara global: npm install -g typescript",
    "Buat file bernama hello.ts",
    "Tulis function greet(name: string) yang return string",
    "Compile file tersebut dengan: tsc hello.ts",
    "Jalankan hasilnya dengan: node hello.js",
    "Coba TypeScript Playground di typescriptlang.org/play"
  ]
}
\`\`\`

---

Selamat! Kamu sudah mengenal TypeScript. Mari lanjut ke artikel berikutnya untuk mempelajari type system yang powerful.
`
    },

    // ─────────────────────────────────────────
    // Article 2: Type Annotations & Basic Types
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "type-annotations-dan-basic-types",
        title: "Type Annotations & Basic Types",
        excerpt: "Pelajari cara mendefinisikan types di TypeScript — dari primitive types hingga special types seperti any, unknown, dan never.",
        difficulty: "beginner",
        content: `# Type Annotations & Basic Types

Type annotations adalah cara memberi tahu TypeScript tipe data apa yang diharapkan untuk sebuah variable, parameter, atau return value. Ini adalah fondasi dari type system TypeScript.

## Sintaks Dasar

\`\`\`typescript
let variableName: type = value;
\`\`\`

### Example
\`\`\`typescript
let age: number = 25;
let name: string = "Nolt";
let isActive: boolean = true;
\`\`\`

\`\`\`callout
info: TypeScript Bisa Infer Types
TypeScript bisa otomatis mendeteksi tipe dari nilai yang diberikan (type inference). Jadi \`let age = 25\` otomatis dianggap \`number\`. Type annotation berguna saat inference tidak cukup atau untuk dokumentasi.
\`\`\`

## Primitive Types

### 1. String
\`\`\`typescript
let firstName: string = "Timur";
let lastName: string = 'Dian';
let fullName: string = \`\\\${firstName} \\\${lastName}\\\`;

// Type inference juga bekerja
let greeting = "Hello"; // otomatis string
\`\`\`

### 2. Number
\`\`\`typescript
let integer: number = 42;
let float: number = 3.14;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;
let big: bigint = 100n;
\`\`\`

### 3. Boolean
\`\`\`typescript
let isDone: boolean = false;
let isActive: boolean = true;
\`\`\`

### 4. Special Types

#### void
\`\`\`typescript
// Function yang tidak return apa-apa
function log(message: string): void {
  console.log(message);
}

let nothing: void = undefined; // void hanya bisa di-assign undefined
\`\`\`

#### any
\`\`\`typescript
// any mematikan type checking (use sparingly!)
let anything: any = 42;
anything = "hello";
anything = { name: "Nolt" };

\`\`\`callout
warning: Hindari any Menggunakan any sama seperti kembali ke JavaScript dinamis. Gunakan hanya jika benar-benar perlu atau saat migration dari JavaScript.
\`\`\`

#### unknown
\`\`\`typescript
// unknown lebih aman dari any — butuh type checking sebelum digunakan
let value: unknown = "Hello";

// Error: Object is of type 'unknown'
// console.log(value.toUpperCase());

// Benar: harus check type dulu
if (typeof value === "string") {
  console.log(value.toUpperCase()); // OK
}
\`\`\`

#### never
\`\`\`typescript
// never berarti function tidak pernah return (always throw atau infinite loop)
function fail(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
\`\`\`

#### null & undefined
\`\`\`typescript
// strict mode: null dan undefined adalah types terpisah
let nothing: null = null;
let notDefined: undefined = undefined;
\`\`\`

## Array Types

### Array Syntax 1 (Primitif)
\`\`\`typescript
let numbers: number[] = [1, 2, 3, 4, 5];
let strings: string[] = ["a", "b", "c"];
\`\`\`

### Array Syntax 2 (Generic) ⭐
\`\`\`typescript
let numbers: Array<number> = [1, 2, 3];
let strings: Array<string> = ["a", "b", "c"];
\`\`\`

### Readonly Array
\`\`\`typescript
let readOnlyNumbers: ReadonlyArray<number> = [1, 2, 3];
// readOnlyNumbers.push(4); // Error: read-only
\`\`\`

## Tuple

Tuple adalah array dengan **fixed number of elements** dan **specific types** untuk setiap elemen.

\`\`\`typescript
let coordinate: [number, number] = [10, 20];
let person: [string, number] = ["Timur", 25];
let rgb: [number, number, number] = [255, 0, 0];

// Accessing
let x = coordinate[0]; // 10
let name = person[0];  // "Timur"
let age = person[1];   // 25
\`\`\`

\`\`\`callout
info: Tuple vs Array Biasa
Tuple berguna untuk data yang terstruktur dan posisi penting. Contoh: coordinates, date/time, response dari API dengan fixed structure.
\`\`\`

## Object Type

\`\`\`typescript
// Object type annotation
let user: {
  name: string;
  age: number;
  isActive: boolean;
} = {
  name: "Timur",
  age: 25,
  isActive: true
};
\`\`\`

### Optional Properties
\`\`\`typescript
let user: {
  name: string;
  age?: number; // Optional — bisa undefined
  email?: string;
} = {
  name: "Timur"
  // age dan email opsional
};
\`\`\`

### Readonly Properties
\`\`\`typescript
let config: {
  readonly apiKey: string;
  readonly endpoint: string;
} = {
  apiKey: "secret",
  endpoint: "https://api.example.com"
};

// config.apiKey = "new-key"; // Error: readonly
\`\`\`

## Enum

Enum adalah set named constants.

\`\`\`typescript
// Numeric Enum
enum Direction {
  Up,    // 0
  Down,  // 1
  Left,  // 2
  Right  // 3
}

let move: Direction = Direction.Up;

// String Enum
enum Status {
  Active = "ACTIVE",
  Inactive = "INACTIVE",
  Pending = "PENDING"
}

let currentStatus: Status = Status.Active;
\`\`\`

\`\`\`callout
tip: Enum vs Union Types
Enum berguna untuk runtime values, tapi union types sering lebih simple dan type-safe. Pertimbangkan:
\`\`\`typescript
type Status = "ACTIVE" | "INACTIVE" | "PENDING";
\`\`\`
\`\`\`

## Union & Intersection Types

### Union Types (OR)
\`\`\`typescript
// Variable bisa salah satu dari beberapa types
let id: number | string = 123;
id = "abc"; // OK

function printId(id: number | string) {
  if (typeof id === "number") {
    console.log("ID:", id.toFixed(2));
  } else {
    console.log("ID:", id.toUpperCase());
  }
}
\`\`\`

### Intersection Types (AND)
\`\`\`typescript
type Person = {
  name: string;
  age: number;
};

type Employee = {
  employeeId: string;
  department: string;
};

type EmployeePerson = Person & Employee;

let emp: EmployeePerson = {
  name: "Timur",
  age: 25,
  employeeId: "E123",
  department: "Engineering"
};
\`\`\`

## Type Aliases

Type alias adalah cara memberi nama pada sebuah type.

\`\`\`typescript
type ID = string | number;
type User = {
  id: ID;
  name: string;
  email: string;
};

let user: User = {
  id: "123",
  name: "Timur",
  email: "timur@example.com"
};
\`\`\`

\`\`\`callout
success: Type Aliases = Reusability
Type aliases membuat kode lebih readable dan reusable. Gunakan untuk complex types yang dipakai di beberapa tempat.
\`\`\`

## Literal Types

Literal types adalah types yang mewakili **exact values**.

\`\`\`typescript
// String literal type
let theme: "light" | "dark" = "dark";
theme = "light"; // OK
// theme = "blue"; // Error

// Number literal type
let dice: 1 | 2 | 3 | 4 | 5 | 6 = 4;

// Boolean literal type
let success: true = true;
\`\`\`

\`\`\`quiz
{
  "question": "Apa perbedaan utama antara any dan unknown?",
  "options": [
    "Tidak ada perbedaan",
    "unknown butuh type checking sebelum digunakan, any tidak",
    "any lebih type-safe",
    "unknown hanya bisa berupa string"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Tuple dalam TypeScript adalah:",
  "options": [
    "Array biasa",
    "Array dengan fixed number dan specific types per posisi",
    "Object dengan beberapa properties",
    "Function yang mengembalikan array"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Type Annotations",
  "steps": [
    "Buat variable dengan type annotation untuk: name (string), age (number), isActive (boolean)",
    "Buat array numbers dengan type number[]",
    "Buat tuple [string, number] untuk merepresentasikan product",
    "Buat type User dengan name, email (opsional), dan age",
    "Buat union type ID yang bisa string atau number",
    "Coba gunakan unknown type dan implement type checking sebelum menggunakan nilainya"
  ]
}
\`\`\`

---

Selanjutnya kita akan belajar tentang Interfaces dan Type Aliases lebih dalam.
`
    },

    // ─────────────────────────────────────────
    // Article 3: Interfaces & Type Aliases
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "interfaces-dan-type-aliases",
        title: "Interfaces & Type Aliases: Definisi Shape Data",
        excerpt: "Kuasai interfaces dan type aliases untuk mendefinisikan struktur data yang reusable dan type-safe.",
        difficulty: "beginner",
        content: `# Interfaces & Type Aliases

Interfaces dan type aliases adalah dua cara untuk mendefinisikan custom types di TypeScript. Meskipun terlihat mirip, keduanya punya use cases berbeda.

## Interfaces

Interface adalah cara untuk mendefinisikan **shape** atau struktur sebuah object.

### Basic Interface

\`\`\`typescript
interface User {
  id: string;
  name: string;
  age: number;
  email?: string; // Optional property
}

const user1: User = {
  id: "1",
  name: "Timur",
  age: 25,
  email: "timur@example.com"
};

const user2: User = {
  id: "2",
  name: "Nolt",
  age: 30
  // email opsional, jadi tidak perlu didefinisikan
};
\`\`\`

### Readonly Properties

\`\`\`typescript
interface Config {
  readonly apiKey: string;
  readonly endpoint: string;
}

const config: Config = {
  apiKey: "secret",
  endpoint: "https://api.example.com"
};

// config.apiKey = "new"; // Error: Cannot assign to 'apiKey' because it is read-only
\`\`\`

### Methods in Interface

\`\`\`typescript
interface User {
  name: string;
  greet(): string;           // Method tanpa parameter
  updateName(newName: string): void;  // Method dengan parameter
}

const user: User = {
  name: "Timur",
  greet() {
    return \`Hello, I'm \\\${this.name}\\\`;
  },
  updateName(newName: string) {
    this.name = newName;
  }
};

console.log(user.greet()); // "Hello, I'm Timur"
\`\`\`

\`\`\`callout
tip: Shorthand Method Syntax
Gunakan shorthand \`method()\` daripada \`method: () => {}\` di interfaces untuk lebih readability.
\`\`\`

### Extending Interfaces

Interface bisa meng-extend interface lain.

\`\`\`typescript
interface Animal {
  name: string;
  age: number;
}

interface Dog extends Animal {
  breed: string;
  bark(): void;
}

interface Cat extends Animal {
  color: string;
  meow(): void;
}

const dog: Dog = {
  name: "Buddy",
  age: 3,
  breed: "Golden Retriever",
  bark() {
    console.log("Woof!");
  }
};
\`\`\`

### Multiple Inheritance

\`\`\`typescript
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

interface Duck extends Flyable, Swimmable {
  quack(): void;
}

const duck: Duck = {
  fly() { console.log("Flying!"); },
  swim() { console.log("Swimming!"); },
  quack() { console.log("Quack!"); }
};
\`\`\`

### Interface for Functions

\`\`\`typescript
interface Greeter {
  (name: string): string;
}

const greet: Greeter = (name: string) => {
  return \`Hello, \\\${name}!\`;
};

console.log(greet("Nolt")); // "Hello, Nolt!"
\`\`\`

\`\`\`callout
info: Interface for Functions
Interface juga bisa mendefinisikan signature function. Ini berguna untuk callback, event handlers, atau function yang diteruskan sebagai parameter.
\`\`\`

## Type Aliases

Type alias adalah cara memberi nama pada sebuah type. Bisa dipakai untuk primitives, unions, tuples, objects, dan lainnya.

### Basic Type Alias

\`\`\`typescript
type ID = string | number;
type Status = "active" | "inactive" | "pending";
type Coordinates = [number, number];
\`\`\`

### Type Alias for Objects

\`\`\`typescript
type User = {
  id: ID;
  name: string;
  email?: string;
  createdAt: Date;
};

const user: User = {
  id: "123",
  name: "Timur",
  createdAt: new Date()
};
\`\`\`

### Intersection with Type Aliases

\`\`\`typescript
type Person = {
  name: string;
  age: number;
};

type Employee = {
  employeeId: string;
  department: string;
};

type EmployeePerson = Person & Employee;

const emp: EmployeePerson = {
  name: "Timur",
  age: 25,
  employeeId: "E123",
  department: "Engineering"
};
\`\`\`

\`\`\`callout
success: Intersection vs Extending
Intersection (&) dengan type aliases bisa menggabungkan multiple types. Extending (extends) dengan interfaces lebih OOP-style. Gunakan sesuai kebutuhan.
\`\`\`

### Union Types with Type Aliases

\`\`\`typescript
type SuccessResponse = {
  success: true;
  data: any;
};

type ErrorResponse = {
  success: false;
  error: string;
};

type APIResponse = SuccessResponse | ErrorResponse;

function handleResponse(response: APIResponse) {
  if (response.success) {
    console.log("Data:", response.data);
  } else {
    console.log("Error:", response.error);
  }
}
\`\`\`

### Generics in Type Aliases

\`\`\`typescript
type Box<T> = {
  value: T;
};

let numberBox: Box<number> = { value: 42 };
let stringBox: Box<string> = { value: "Hello" };
let userBox: Box<User> = { value: { id: "1", name: "Timur", createdAt: new Date() } };
\`\`\`

## Interface vs Type Aliases

Kapan pakai interface, kapan pakai type alias?

| Fitur | Interface | Type Alias |
|-------|-----------|------------|
| Extends | Bisa dengan \`extends\` | Bisa dengan \`&\` (intersection) |
| Implements | Bisa di-implementasi oleh class | Tidak bisa |
| Declaration Merging | Ya | Tidak |
| Primitives | Tidak bisa | Bisa |
| Unions/Tuples | Tidak bisa | Bisa |

\`\`\`callout
tip: Rule of Thumb
Gunakan **interface** untuk object shapes yang perlu extends/implements. Gunakan **type alias** untuk unions, tuples, primitives, dan complex types yang kombinasi dari berbagai types.
\`\`\`

## Declaration Merging (Interface Only)

Interface bisa di-declare multiple times dan TypeScript akan menggabungkannya.

\`\`\`typescript
interface User {
  id: string;
  name: string;
}

interface User {
  email: string;
  age: number;
}

// User sekarang punya semua 4 properties
const user: User = {
  id: "1",
  name: "Timur",
  email: "timur@example.com",
  age: 25
};
\`\`\`

\`\`\`callout
warning: Declaration Merging Tidak di Type Alias
Type alias tidak bisa declaration merging. Jika kamu declare type alias dengan nama sama, akan error: "Duplicate identifier".
\`\`\`

## Real-world Examples

### API Response Types

\`\`\`typescript
// With Interface
interface User {
  id: string;
  name: string;
  email: string;
}

interface CreateUserResponse {
  success: boolean;
  user?: User;
  error?: string;
}

// With Type Alias
type Response<T, E = string> = {
  success: boolean;
  data?: T;
  error?: E;
};

type UserResponse = Response<User>;
\`\`\`

### Component Props (React)

\`\`\`typescript
// Interface pattern
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}

// Type alias pattern
type InputProps = {
  type: "text" | "email" | "password";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};
\`\`\`

## Index Signatures

Kadang kita tidak tahu semua key names sebelumnya.

\`\`\`typescript
// With Interface
interface StringDictionary {
  [key: string]: string;
}

const headers: StringDictionary = {
  "Content-Type": "application/json",
  "Authorization": "Bearer token"
};

// With Type Alias
type NumberDictionary = {
  [key: string]: number;
};

const scores: NumberDictionary = {
  math: 90,
  english: 85
};
\`\`\`

\`\`\`callout
info: Index Signature vs Record
\`\`Record<string, string>\`\` adalah shorthand untuk object dengan string keys dan values. Equivalent dengan \`{ [key: string]: string }\`\`.
\`\`\`

\`\`\`quiz
{
  "question": "Apa yang bisa dilakukan interface tapi tidak bisa oleh type alias?",
  "options": [
    "Mendefinisikan object types",
    "Declaration merging (declare multiple times dengan nama sama)",
    "Mendefinisikan union types",
    "Mendefinisikan generic types"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Kapan sebaiknya menggunakan type alias?",
  "options": [
    "Untuk object shapes yang perlu di-extends",
    "Untuk unions, tuples, primitives, dan complex types",
    "Untuk semua jenis types",
    "Tidak pernah, selalu gunakan interface"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Interfaces & Type Aliases",
  "steps": [
    "Buat interface Person dengan name, age, dan address (opsional)",
    "Buat interface Employee yang extends Person dan tambahkan employeeId, department",
    "Buat type alias Response yang generic dengan T (data) dan E (error)",
    "Buat union type Color yang adalah 'red' | 'green' | 'blue'",
    "Buat interface Dictionary dengan index signature [key: string]: string",
    "Buat complex type yang menggabungkan interface, union, dan intersection"
  ]
}
\`\`\`

---

Selanjutnya kita akan belajar tentang Functions dengan types dan Generics.
`
    },

    // ─────────────────────────────────────────
    // Article 4: Functions & Generics
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "functions-dan-generics",
        title: "Functions & Generics: Reusable Type-Safe Code",
        excerpt: "Pelajari cara mendefinisikan function types, parameter types, dan menggunakan generics untuk membuat kode reusable dan type-safe.",
        difficulty: "intermediate",
        content: `# Functions & Generics

Functions adalah building block utama di JavaScript. TypeScript membawa type safety ke functions, membuatnya lebih predictable dan self-documenting.

## Function Type Annotations

### Parameter Types

\`\`\`typescript
// Basic parameter types
function greet(name: string): string {
  return \`Hello, \\\${name}!\`;
}

// Multiple parameters
function createUser(name: string, age: number, email: string): object {
  return { name, age, email };
}

// Default values
function greetWithDefault(name: string = "Guest"): string {
  return \`Hello, \\\${name}!\`;
}
\`\`\`

### Return Type Annotations

\`\`\`typescript
// Explicit return type
function add(a: number, b: number): number {
  return a + b;
}

// Void (no return)
function log(message: string): void {
  console.log(message);
}

// Never (never returns - always throws or infinite loop)
function fail(message: string): never {
  throw new Error(message);
}
\`\`\`

\`\`\`callout
tip: Return Type Inference
TypeScript bisa infer return type dari function body. Tapi untuk public APIs, sebaiknya explicit untuk dokumentasi dan type checking yang lebih strict.
\`\`\`

## Function Types

### Type Alias for Functions

\`\`\`typescript
// Function type alias
type MathOperation = (a: number, b: number) => number;

const add: MathOperation = (a, b) => a + b;
const subtract: MathOperation = (a, b) => a - b;
const multiply: MathOperation = (a, b) => a * b;
\`\`\`

### Interface for Functions

\`\`\`typescript
interface Calculator {
  (operation: string, a: number, b: number): number;
}

const calculate: Calculator = (operation, a, b) => {
  switch (operation) {
    case "add": return a + b;
    case "subtract": return a - b;
    case "multiply": return a * b;
    default: throw new Error("Unknown operation");
  }
};

console.log(calculate("add", 5, 3)); // 8
\`\`\`

## Optional Parameters

\`\`\`typescript
function buildName(firstName: string, lastName?: string): string {
  if (lastName) {
    return \`\\\${firstName} \\\${lastName}\\\`;
  }
  return firstName;
}

console.log(buildName("Timur"));        // "Timur"
console.log(buildName("Timur", "Dian")); // "Timur Dian"
\`\`\`

\`\`\`callout
warning: Optional Parameters Harus Di Akhir
Optional parameters harus didefinisikan setelah required parameters. Tidak bisa: (optional?, required: string)
\`\`\`

## Rest Parameters

\`\`\`typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(sum(1, 2, 3));         // 6
console.log(sum(1, 2, 3, 4, 5));  // 15
\`\`\`

## Destructuring Parameters

\`\`\`typescript
// Destructuring object parameter
function greetUser({ name, age }: { name: string; age: number }): string {
  return \`Hello \\\${name}, you are \\\${age} years old!\`;
}

// With default values
function displayUser({ name, age = 0, role = "member" }: {
  name: string;
  age?: number;
  role?: string;
}): string {
  return \`\\\${name} (\\\${age}) - \\\${role}\\\`;
}

displayUser({ name: "Timur" });            // "Timur (0) - member"
displayUser({ name: "Timur", age: 25 });   // "Timur (25) - member"
displayUser({ name: "Timur", age: 25, role: "admin" }); // "Timur (25) - admin"
\`\`\`

\`\`\`callout
success: Destructuring = Readable Functions
Destructuring parameters membuat function signatures lebih readable dan self-documenting. Parameter yang relevan langsung terlihat dari deklarasi.
\`\`\`

## Overloaded Functions

TypeScript mendukung function overloads — multiple signatures untuk satu function.

\`\`\`typescript
function combine(a: string, b: string): string;
function combine(a: number, b: number): number;
function combine(a: string | number, b: string | number): string | number {
  if (typeof a === "string" && typeof b === "string") {
    return a + b;
  }
  if (typeof a === "number" && typeof b === "number") {
    return a + b;
  }
  throw new Error("Invalid arguments");
}

combine("Hello", "World");  // returns string
combine(1, 2);              // returns number
// combine("Hello", 2);     // Error: No overload matches
\`\`\`

## Generics

Generics adalah cara membuat function, interface, atau class yang bekerja dengan **multiple types** sambil tetap type-safe.

### Basic Generic Function

\`\`\`typescript
// Generic function dengan type parameter T
function identity<T>(arg: T): T {
  return arg;
}

// TypeScript menginfer T dari argument
const num = identity<number>(42);        // T = number
const str = identity<string>("Hello");   // T = string
const bool = identity<boolean>(true);    // T = boolean

// Type inference juga bekerja tanpa explicit type parameter
const inferredNum = identity(42);      // otomatis T = number
const inferredStr = identity("Hello"); // otomatis T = string
\`\`\`

\`\`\`callout
tip: Generic Naming Convention
Gunakan \`T\` untuk single type parameter, \`T, U\` untuk dua, \`T, U, V\` untuk tiga. Nama descriptive \`TInput, TOutput\` juga umum dipakai.
\`\`\`

### Multiple Type Parameters

\`\`\`typescript
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const result1 = pair(1, "one");        // [number, string]
const result2 = pair("hello", true);   // [string, boolean]
\`\`\`

### Generic Constraints

Kadang kita ingin membatasi type parameter agar hanya bisa certain types.

\`\`\`typescript
// Constraint: T harus punya property 'length'
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

getLength("hello");     // OK - string punya 'length'
getLength([1, 2, 3]);   // OK - array punya 'length'
getLength({ length: 5 }); // OK - object dengan 'length'
// getLength(42);         // Error - number tidak punya 'length'
\`\`\`

### Generic with Interface

\`\`\`typescript
interface Box<T> {
  value: T;
  getValue(): T;
  setValue(newValue: T): void;
}

class StringBox implements Box<string> {
  constructor(private value: string) {}

  getValue(): string {
    return this.value;
  }

  setValue(newValue: string): void {
    this.value = newValue;
  }
}

const box = new StringBox("Hello");
console.log(box.getValue()); // "Hello"
\`\`\`

### Generic in Real-world APIs

\`\`\`typescript
// Generic API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage dengan berbagai data types
type User = { id: string; name: string };
type Product = { id: string; name: string; price: number };

async function fetchUser(): Promise<ApiResponse<User>> {
  return { success: true, data: { id: "1", name: "Timur" } };
}

async function fetchProduct(): Promise<ApiResponse<Product>> {
  return { success: true, data: { id: "1", name: "Laptop", price: 15000000 } };
}

// Generic wrapper untuk async operations
async function safeFetch<T>(url: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Fetch failed" };
  }
}
\`\`\`

\`\`\`callout
success: Generics = Reusable Code
Generics membuat kode kamu reusable tanpa mengorbankan type safety. Ini sangat powerful untuk utilities, API clients, dan data transformation functions.
\`\`\`

## Utility Types

TypeScript punya built-in utility types yang sering dipakai dengan generics.

### Partial — Buat semua properties jadi optional

\`\`\`typescript
interface User {
  id: string;
  name: string;
  age: number;
  email: string;
}

// Partial<User> = semua properties jadi optional
function updateUser(id: string, updates: Partial<User>): void {
  // ... update logic
}

updateUser("1", { name: "New Name" });     // OK - hanya name
updateUser("1", { age: 26, email: "..." }); // OK - multiple properties
\`\`\`

### Required — Buat semua properties jadi required

\`\`\`typescript
interface OptionalUser {
  id?: string;
  name?: string;
  age?: number;
}

// Required<OptionalUser> = semua properties jadi required
const completeUser: Required<OptionalUser> = {
  id: "1",
  name: "Timur",
  age: 25
};
\`\`\`

### Readonly — Buat semua properties jadi read-only

\`\`\`typescript
interface Config {
  apiKey: string;
  endpoint: string;
}

const frozenConfig: Readonly<Config> = {
  apiKey: "secret",
  endpoint: "https://api.example.com"
};

// frozenConfig.apiKey = "new"; // Error - read-only
\`\`\`

### Pick — Pilih subset dari properties

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// Hanya ambil 'id' dan 'name'
type UserPreview = Pick<User, "id" | "name">;
// { id: string; name: string; }

const preview: UserPreview = {
  id: "1",
  name: "Timur"
};
\`\`\`

### Omit — Hapus subset dari properties

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

// Hapus 'password'
type SafeUser = Omit<User, "password">;
// { id: string; name: string; email: string; }

const safeUser: SafeUser = {
  id: "1",
  name: "Timur",
  email: "timur@example.com"
};
\`\`\`

\`\`\`quiz
{
  "question": "Apa itu Generics di TypeScript?",
  "options": [
    "Function yang hanya bekerja dengan satu type",
    "Cara membuat reusable components/functions yang bisa work dengan multiple types",
    "Interface khusus untuk numbers",
    "Type system untuk JavaScript saja"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa yang dilakukan Partial<T> utility type?",
  "options": [
    "Membuat semua properties jadi required",
    "Membuat semua properties jadi optional",
    "Membuat semua properties jadi read-only",
    "Menghapus beberapa properties"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Functions & Generics",
  "steps": [
    "Buat function identity<T>(arg: T): T yang return argumen tanpa perubahan",
    "Buat function firstElement<T>(arr: T[]): T | undefined yang return elemen pertama",
    "Buat generic interface Box<T> dengan value: T dan method getValue()",
    "Gunakan Partial utility type untuk membuat function update",
    "Buat function yang menggunakan Pick untuk mengambil subset dari interface",
    "Implement generic constraint: function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]"
  ]
}
\`\`\`

---

Selanjutnya kita akan belajar tentang Classes dan Access Modifiers di TypeScript.
`
    },

    // ─────────────────────────────────────────
    // Article 5: Classes & Modifiers
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "classes-dan-access-modifiers",
        title: "Classes & Access Modifiers: OOP di TypeScript",
        excerpt: "Pelajari cara menggunakan classes, constructors, access modifiers, inheritance, dan abstract classes di TypeScript.",
        difficulty: "intermediate",
        content: `# Classes & Access Modifiers

TypeScript membawa full OOP (Object-Oriented Programming) support ke JavaScript — classes, inheritance, interfaces, access modifiers, dan lainnya.

## Basic Classes

\`\`\`typescript
class Person {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  greet(): string {
    return \`Hello, I'm \\\${this.name}\\\`;
  }

  getAge(): number {
    return this.age;
  }
}

const person = new Person("Timur", 25);
console.log(person.greet()); // "Hello, I'm Timur"
console.log(person.getAge()); // 25
\`\`\`

\`\`\`callout
info: Classes di ES6 vs TypeScript
TypeScript classes adalah syntactic sugar di atas ES6 classes. Tambahan utama adalah type annotations, access modifiers, dan lainnya yang tidak ada di plain JavaScript.
\`\`\`

## Access Modifiers

TypeScript punya 3 access modifiers: \`public\`, \`private\`, dan \`protected\`.

### Public (Default)

\`\`\`typescript
class User {
  public name: string;  // public adalah default
  public age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

const user = new User("Timur", 25);
console.log(user.name); // Bisa diakses
\`\`\`

### Private

\`\`\`typescript
class BankAccount {
  private balance: number;

  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }

  deposit(amount: number): void {
    this.balance += amount;
  }

  getBalance(): number {
    return this.balance;
  }
}

const account = new BankAccount(1000);
account.deposit(500);
console.log(account.getBalance()); // 1500

// account.balance = 0; // Error: Property 'balance' is private
\`\`\`

### Protected

\`\`\`typescript
class Animal {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  protected makeSound(): void {
    console.log("Some sound");
  }
}

class Dog extends Animal {
  breed: string;

  constructor(name: string, breed: string) {
    super(name);
    this.breed = breed;
  }

  bark(): void {
    // Bisa akses protected member dari parent
    console.log(\`\\\${this.name} says: Woof!\\\`);
    this.makeSound(); // OK - protected
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
dog.bark(); // "Buddy says: Woof!"
// dog.makeSound(); // Error: Method 'makeSound' is protected
\`\`\`

\`\`\`callout
tip: Access Modifier Rules
- **public**: Bisa diakses dari mana saja
- **private**: Hanya bisa diakses di dalam class yang sama
- **protected**: Bisa diakses di dalam class dan class turunannya
\`\`\`

## Parameter Properties

Shorthand untuk mendeklarasikan dan menginisialisasi properties dalam constructor.

\`\`\`typescript
// Tanpa parameter properties (verbose)
class User {
  name: string;
  age: number;
  private id: string;

  constructor(name: string, age: number, id: string) {
    this.name = name;
    this.age = age;
    this.id = id;
  }
}

// Dengan parameter properties (concise)
class User {
  constructor(
    public name: string,
    public age: number,
    private id: string
  ) {}
}

const user = new User("Timur", 25, "123");
console.log(user.name); // OK
// console.log(user.id); // Error - private
\`\`\`

\`\`\`callout
success: Parameter Properties = Less Boilerplate
Parameter properties mengurangi boilerplate code. Ini sangat berguna untuk data class dan DTOs (Data Transfer Objects).
\`\`\`

## Readonly Properties

\`\`\`typescript
class Config {
  readonly apiKey: string;
  readonly endpoint: string;
  private debug: boolean;

  constructor(apiKey: string, endpoint: string) {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
    this.debug = false;
  }

  enableDebug(): void {
    this.debug = true;  // OK - debug bukan readonly
  }

  // config.apiKey = "new"; // Error - cannot assign to readonly
}
\`\`\`

## Getters & Setters

\`\`\`typescript
class Employee {
  private _salary: number;

  constructor(salary: number) {
    this._salary = salary;
  }

  get salary(): number {
    return this._salary;
  }

  set salary(value: number) {
    if (value < 0) {
      throw new Error("Salary cannot be negative");
    }
    this._salary = value;
  }
}

const emp = new Employee(50000);
console.log(emp.salary); // 50000 - getter dipanggil
emp.salary = 60000;       // setter dipanggil
// emp.salary = -1000;    // Error - throws
\`\`\`

## Inheritance (Extends)

\`\`\`typescript
class Vehicle {
  protected brand: string;
  protected year: number;

  constructor(brand: string, year: number) {
    this.brand = brand;
    this.year = year;
  }

  start(): void {
    console.log("Vehicle started");
  }
}

class Car extends Vehicle {
  private doors: number;

  constructor(brand: string, year: number, doors: number) {
    super(brand, year);  // Call parent constructor
    this.doors = doors;
  }

  start(): void {
    super.start();  // Call parent method
    console.log(\`\\\${this.brand} car started!\\\`);
  }

  honk(): void {
    console.log("Beep beep!");
  }
}

const car = new Car("Toyota", 2023, 4);
car.start();  // "Vehicle started" -> "Toyota car started!"
car.honk();   // "Beep beep!"
\`\`\`

\`\`\`callout
info: super Keyword
\`\`super()\`\` memanggil constructor parent. \`super.method()\`\` memanggil method dari parent class.
\`\`\`

## Method Overriding

\`\`\`typescript
class Shape {
  getArea(): number {
    return 0;
  }
}

class Circle extends Shape {
  constructor(private radius: number) {
    super();
  }

  getArea(): number {
    return Math.PI * this.radius * this.radius;
  }
}

class Rectangle extends Shape {
  constructor(private width: number, private height: number) {
    super();
  }

  getArea(): number {
    return this.width * this.height;
  }
}

const circle = new Circle(5);
const rect = new Rectangle(4, 3);

console.log(circle.getArea());  // ~78.54
console.log(rect.getArea());   // 12
\`\`\`

## Abstract Classes

Abstract classes adalah classes yang tidak bisa di-instantiate langsung, hanya bisa di-extends.

\`\`\`typescript
abstract class Animal {
  abstract makeSound(): void;  // Abstract method - wajib diimplementasikan

  move(): void {
    console.log("Moving...");
  }
}

class Dog extends Animal {
  makeSound(): void {
    console.log("Woof!");
  }
}

class Cat extends Animal {
  makeSound(): void {
    console.log("Meow!");
  }
}

const dog = new Dog();
dog.makeSound(); // "Woof!"
dog.move();      // "Moving..."

// const animal = new Animal(); // Error - Cannot create instance of abstract class
\`\`\`

\`\`\`callout
tip: Abstract Class vs Interface
- **Abstract Class**: Punya implementation (methods), bisa punya fields, inheritance tunggal
- **Interface**: Hanya structure, tidak punya implementation, bisa multiple inheritance
Gunakan abstract class jika ingin shared implementation, gunakan interface untuk pure structure.
\`\`\`

## Implementing Interfaces

Class bisa implement multiple interfaces.

\`\`\`typescript
interface Drawable {
  draw(): void;
}

interface Resizeable {
  resize(width: number, height: number): void;
}

class Rectangle implements Drawable, Resizeable {
  constructor(private width: number, private height: number) {}

  draw(): void {
    console.log(\`Drawing rectangle \\\${this.width}x\\\${this.height}\\\`);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

const rect = new Rectangle(10, 20);
rect.draw();           // "Drawing rectangle 10x20"
rect.resize(15, 25);   // Update dimensions
\`\`\`

## Static Members

Static members adalah properties/methods yang milik class, bukan instance.

\`\`\`typescript
class MathUtils {
  static PI: number = 3.14159;

  static circleArea(radius: number): number {
    return this.PI * radius * radius;
  }

  // Instance method
  multiply(a: number, b: number): number {
    return a * b;
  }
}

console.log(MathUtils.PI);           // 3.14159
console.log(MathUtils.circleArea(5)); // 78.54

const utils = new MathUtils();
console.log(utils.multiply(3, 4));    // 12
// utils.circleArea(5); // Error - static method tidak bisa diakses via instance
\`\`\`

\`\`\`callout
info: Static Members Use Cases
Gunakan static untuk utilities, constants, factory methods, atau singletons. Contoh: \`Math.random()\`, \`Array.isArray()\`.
\`\`\`

## Class Generics

\`\`\`typescript
class Repository<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  getAll(): T[] {
    return [...this.items];
  }

  findById(id: string): T | undefined {
    return this.items.find(item => (item as any).id === id);
  }
}

interface User {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

const userRepo = new Repository<User>();
const productRepo = new Repository<Product>();

userRepo.add({ id: "1", name: "Timur" });
productRepo.add({ id: "1", name: "Laptop", price: 15000000 });
\`\`\`

## Singleton Pattern

\`\`\`typescript
class Database {
  private static instance: Database;
  private constructor() {
    // Private constructor mencegah direct instantiation
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  query(sql: string): void {
    console.log(\`Executing: \\\${sql}\\\`);
  }
}

const db1 = Database.getInstance();
const db2 = Database.getInstance();

console.log(db1 === db2); // true - same instance
db1.query("SELECT * FROM users");
\`\`\`

\`\`\`quiz
{
  "question": "Access modifier apa yang memungkinkan property diakses dari class turunan tapi tidak dari luar class?",
  "options": [
    "public",
    "private",
    "protected",
    "readonly"
  ],
  "answer": 2
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa perbedaan antara abstract class dan interface?",
  "options": [
    "Tidak ada perbedaan",
    "Abstract class punya implementation, interface tidak",
    "Interface punya implementation, abstract class tidak",
    "Abstract class tidak bisa di-extends"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Classes & OOP",
  "steps": [
    "Buat abstract class Shape dengan method abstract getArea()",
    "Buat class Circle dan Rectangle yang extends Shape",
    "Implement interface Printable di class-class tersebut",
    "Gunakan parameter properties di constructor",
    "Buat class dengan private dan protected members",
    "Implement Singleton pattern untuk Database class"
  ]
}
\`\`\`

---

Artikel terakhir! Kita akan membahas Advanced Types & Utility Types.
`
    },

    // ─────────────────────────────────────────
    // Article 6: Advanced Types & Utilities
    // ─────────────────────────────────────────
    {
        id: nanoid(),
        slug: "advanced-types-dan-utilities",
        title: "Advanced Types & Utility Types: Type System yang Powerful",
        excerpt: "Pelajari advanced type system TypeScript — type guards, discriminated unions, conditional types, dan utility types bawaan.",
        difficulty: "advanced",
        content: `# Advanced Types & Utility Types

TypeScript type system sangat powerful. Di artikel ini, kita akan pelajari advanced features yang membuat type checking lebih flexible dan expressive.

## Type Guards

Type guards adalah expressions yang mempersempit type dalam conditional block.

### typeof Type Guard

\`\`\`typescript
function printId(id: number | string) {
  if (typeof id === "string") {
    // Di sini TypeScript tahu id adalah string
    console.log(id.toUpperCase()); // OK
  } else {
    // Di sini TypeScript tahu id adalah number
    console.log(id.toFixed(2)); // OK
  }
}
\`\`\`

### instanceof Type Guard

\`\`\`typescript
class Dog {
  bark() { console.log("Woof!"); }
}

class Cat {
  meow() { console.log("Meow!"); }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark(); // OK
  } else {
    animal.meow(); // OK
  }
}
\`\`\`

### Custom Type Guards

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function isUser(value: any): value is User {
  return (
    typeof value === "object" &&
    "id" in value &&
    "name" in value &&
    "email" in value
  );
}

function processData(data: unknown) {
  if (isUser(data)) {
    // TypeScript tahu data adalah User
    console.log(data.name); // OK
  }
}
\`\`\`

\`\`\`callout
info: Type Guard Predicate
\`value is User\` adalah type predicate. Memberi tahu TypeScript bahwa jika function returns true, maka value adalah User.
\`\`\`

## Discriminated Unions

Discriminated union adalah pattern yang menggunakan literal property (discriminant) untuk narrow type.

\`\`\`typescript
interface Circle {
  kind: "circle";  // Discriminant
  radius: number;
}

interface Rectangle {
  kind: "rectangle";  // Discriminant
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";  // Discriminant
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // TypeScript tahu shape adalah Circle
      return Math.PI * shape.radius * shape.radius;
    case "rectangle":
      // TypeScript tahu shape adalah Rectangle
      return shape.width * shape.height;
    case "triangle":
      // TypeScript tahu shape adalah Triangle
      return 0.5 * shape.base * shape.height;
  }
}
\`\`\`

\`\`\`callout
success: Discriminated Unions = Exhaustive Checking
TypeScript bisa check apakah semua cases sudah ditangani. Tambahkan \`--strictNullChecks\` untuk memastikan exhaustive switch.
\`\`\`

### Exhaustive Checking with never

\`\`\`typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius * shape.radius;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return 0.5 * shape.base * shape.height;
    default:
      const _exhaustiveCheck: never = shape; // Error jika ada case baru ditambah
      return _exhaustiveCheck;
  }
}
\`\`\`

## Conditional Types

Conditional types memilih type berdasarkan condition — mirip dengan ternary operator di JavaScript.

\`\`\`typescript
// T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type Test1 = IsString<string>;  // true
type Test2 = IsString<number>;  // false
type Test3 = IsString<"hello">; // true
\`\`\`

### NonNullable

\`\`\`typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type T1 = NonNullable<string | null>;      // string
type T2 = NonNullable<number | undefined>; // number
type T3 = NonNullable<string | null | undefined>; // string
\`\`\`

### Extract

\`\`\`typescript
// Extract types dari T yang assignable ke U
type Extract<T, U> = T extends U ? T : never;

type T1 = Extract<string | number | boolean, string>;  // string
type T2 = Extract<string | number, string | number>;    // string | number
\`\`\`

### Exclude

\`\`\`typescript
// Exclude types dari T yang assignable ke U
type Exclude<T, U> = T extends U ? never : T;

type T1 = Exclude<string | number | boolean, string>;  // number | boolean
type T2 = Exclude<string | number, string | number>;    // never
\`\`\`

\`\`\`callout
tip: Built-in Utility Types
TypeScript sudah menyediakan Extract dan Exclude sebagai built-in utility types. Tidak perlu define manual.
\`\`\`

## Mapped Types

Mapped types mengubah properties dari object type berdasarkan rule tertentu.

### Basic Mapped Type

\`\`\`typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

interface User {
  name: string;
  age: number;
  email: string;
}

const user: Readonly<User> = {
  name: "Timur",
  age: 25,
  email: "timur@example.com"
};

// user.name = "New"; // Error - readonly
\`\`\`

### Partial (Mapped Type Implementation)

\`\`\`typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

interface User {
  name: string;
  age: number;
  email: string;
}

// Semua properties jadi optional
function updateUser(id: string, updates: Partial<User>) {
  // Update logic
}

updateUser("1", { name: "New Name" });
\`\`\`

### Required

\`\`\`typescript
type Required<T> = {
  [P in keyof T]-?: T[P];  // -? remove optional modifier
};
\`\`\`

## Template Literal Types

\`\`\`typescript
type Color = "red" | "green" | "blue";
type Quantity = "light" | "medium" | "dark";

// Combine dengan template literal
type Theme = \`\${Color}-\\\${Quantity}\`;
// "red-light" | "red-medium" | "red-dark" | "green-light" | ...
\`\`\`

### Event Handler Names

\`\`\`typescript
type EventName = \`on\\\${Capitalize<string>}\`;

// Pattern untuk DOM event handlers
type EventType = "click" | "change" | "submit";
type EventHandler = \`on\\\${EventType}\`;
// "onClick" | "onChange" | "onSubmit"
\`\`\`

## Key Remapping via as

\`\`\`typescript
// Get getters dari T
type Getters<T> = {
  [P in keyof T as \`get\\\${Capitalize<string & P>}\\\`]: () => T[P];
};

interface User {
  name: string;
  age: number;
  email: string;
}

type UserGetters = Getters<User>;
// {
//   getName: () => string;
//   getAge: () => number;
//   getEmail: () => string;
// }
\`\`\`

## More Utility Types

### ReturnType — Mendapat return type dari function

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \\\${name}!\`;
}

function getUser(): { id: string; name: string } {
  return { id: "1", name: "Timur" };
}

type GreetReturn = ReturnType<typeof greet>; // string
type UserReturn = ReturnType<typeof getUser>; // { id: string; name: string }
\`\`\`

### Parameters — Mendapat parameter types dari function

\`\`\`typescript
function createUser(name: string, age: number, email: string): void {
  // ...
}

type CreateUserParams = Parameters<typeof createUser>;
// [name: string, age: number, email: string]
\`\`\`

### InstanceType — Mendapat instance type dari class

\`\`\`typescript
class User {
  constructor(public name: string, public age: number) {}
}

type UserInstance = InstanceType<typeof User>;
// User

const user: UserInstance = new User("Timur", 25);
\`\`\`

### Record — Membuat object type dengan specific key and value types

\`\`\`typescript
type UserRoles = Record<string, "admin" | "user" | "guest">;

const roles: UserRoles = {
  timur: "admin",
  jane: "user",
  bob: "guest"
};

// Record dengan literal keys
type WeekDays = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type Schedule = Record<WeekDays, boolean>;

const workDays: Schedule = {
  mon: true,
  tue: true,
  wed: true,
  thu: true,
  fri: true,
  sat: false,
  sun: false
};
\`\`\`

\`\`\`callout
success: Record = Shorthand Object Type
\`Record<K, V>\` adalah shorthand untuk \`{ [key: K]: V }\`\`. Sangat berguna untuk dictionaries dan maps.
\`\`\`

## Type Assertions

Kadang kita tahu lebih baik dari TypeScript dan ingin override inferred type.

### as Syntax

\`\`\`typescript
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;  // Non-null assertion

// Function type assertion
const mySum = ((a: number, b: number) => a + b) as (x: number, y: number) => number;
\`\`\`

### Angle-bracket Syntax

\`\`\`typescript
const canvas = <HTMLCanvasElement>document.getElementById("canvas");
\`\`\`

\`\`\`callout
warning: Type Assertions are Dangerous
Type assertions bypass type checking. Gunakan hanya jika benar-benar yakin dan tidak ada cara lain. Hindari seminimal mungkin.
\`\`\`

## Non-null Assertion Operator

\`\`\`typescript
const element = document.getElementById("my-element")!;
// ! artinya "pasti tidak null/undefined"

// Contoh di DOM manipulation
const button = document.querySelector("#submit")!;
button.addEventListener("click", () => {
  // ...
});
\`\`\`

## Type Inference with const

\`\`\`typescript
// Tanpa const
let color = "red";  // type: string

// Dengan const
const color = "red"; // type: "red" (literal type)

// const assertions
const colors = ["red", "green", "blue"] as const;
// type: readonly ["red", "green", "blue"]

function getColors() {
  return ["red", "green", "blue"] as const;
}

const palette = getColors();
// type: readonly ["red", "green", "blue"]
\`\`\`

\`\`\`callout
tip: const Assertions = Most Specific Types
\`as const\` membuat TypeScript infer most specific literal types. Sangat berguna untuk configuration dan constants.
\`\`\`

## Practical Examples

### API Error Handling

\`\`\`typescript
type ApiError = {
  success: false;
  error: {
    code: number;
    message: string;
  };
};

type ApiSuccess<T> = {
  success: true;
  data: T;
};

type ApiResponse<T> = ApiError | ApiSuccess<T>;

function isSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success;
}

async function fetchData<T>(): Promise<ApiResponse<T>> {
  try {
    const data = await fetch("/api/data").then(r => r.json());
    return { success: true, data };
  } catch (error) {
    return { success: false, error: { code: 500, message: "Failed" } };
  }
}

const response = await fetchData<User>();
if (isSuccess(response)) {
  console.log(response.data.name); // TypeScript tahu ini ApiSuccess
} else {
  console.log(response.error.message); // TypeScript tahu ini ApiError
}
\`\`\`

### Deep Readonly

\`\`\`typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  api: {
    key: string;
    endpoint: string;
  };
}

const frozenConfig: DeepReadonly<Config> = {
  database: {
    host: "localhost",
    port: 5432,
    credentials: {
      username: "admin",
      password: "secret"
    }
  },
  api: {
    key: "12345",
    endpoint: "https://api.example.com"
  }
};

// frozenConfig.database.host = "new"; // Error - deep readonly
\`\`\`

\`\`\`quiz
{
  "question": "Apa fungsi dari discriminated union?",
  "options": [
    "Membuat semua properties jadi optional",
    "Menggunakan literal property untuk narrow type dalam conditional block",
    "Menghapus properties dari object type",
    "Membuat function generic"
  ],
  "answer": 1
}
\`\`\`

\`\`\`quiz
{
  "question": "Apa output dari type Extract<string | number, string>?",
  "options": [
    "string | number",
    "string",
    "number",
    "never"
  ],
  "answer": 1
}
\`\`\`

\`\`\`challenge
{
  "title": "Latihan Advanced Types",
  "steps": [
    "Buat discriminated union untuk API response (Success/Error)",
    "Implement type guard untuk narrow type",
    "Gunakan ReturnType utility type untuk mendapat return type dari function",
    "Buat mapped type yang membuat semua properties jadi readonly",
    "Implement DeepPartial type yang membuat semua nested properties jadi optional",
    "Gunakan template literal types untuk membuat CSS class names pattern"
  ]
}
\`\`\`

---

🎉 **Selamat!** Kamu telah menyelesaikan semua materi TypeScript fundamental dan advanced! Dengan menguasai konsep-konsep ini, kamu sudah siap untuk membangun aplikasi TypeScript yang type-safe, scalable, dan maintainable.

\`\`\`callout
success: Next Steps
Materi ini mencakup 90% dari apa yang kamu butuhkan dalam daily TypeScript development. Terus latihan, baca dokumentasi TypeScript, dan bangun project nyata untuk mengasah skill kamu!
\`\`\`
`
    },
];

async function main() {
    console.log("🚀 Starting TypeScript content seed...\n");

    // 1. Create TypeScript topic
    console.log("📂 Creating TypeScript topic...");
    try {
        // Check if topic already exists
        const existingTopic = await db.query.topics.findFirst({
            where: eq(schema.topics.id, TOPIC_ID),
        });

        if (!existingTopic) {
            await db.insert(schema.topics).values({
                id: TOPIC_ID,
                name: "TypeScript Dasar",
                description: "Materi lengkap tentang TypeScript — dari pengenalan, type annotations, interfaces, generics, hingga advanced types dan utility types.",
                icon: "📘",
                sortOrder: 2,
                isPublished: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log("   ✅ Topic 'TypeScript Dasar' created");
        } else {
            console.log("   ⏭️ Topic 'TypeScript Dasar' already exists, skipping");
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
                sortOrder: 0, // Default, akan di-update setelah semua artikel dibuat
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

    // 2.5. Update sortOrder for all articles (based on array order)
    console.log("\n🔄 Updating article sort order...");
    for (let i = 0; i < createdArticleIds.length; i++) {
        try {
            await db.update(schema.articles)
                .set({ sortOrder: i + 1 })
                .where(eq(schema.articles.id, createdArticleIds[i]));
            console.log(`   ✅ ${articles[i].title.substring(0, 50)}... → order: ${i + 1}`);
        } catch (e: any) {
            console.error(`   ❌ Error updating sortOrder:`, e.message);
        }
    }

    // 3. Create Learning Path
    console.log("\n🗺️ Creating Learning Path...");
    const pathId = nanoid();
    const PATH_SLUG = "typescript-fundamentals";

    try {
        const existingPath = await db.query.paths.findFirst({
            where: eq(schema.paths.slug, PATH_SLUG),
        });

        if (existingPath) {
            console.log("   ⏭️ Path 'TypeScript Fundamentals' already exists, updating steps...");
            // Delete existing steps for this path
            await db.delete(schema.pathSteps).where(eq(schema.pathSteps.pathId, existingPath.id));

            // Add new steps in correct order (article pertama = step 1)
            console.log("\n📋 Adding path steps...");
            for (let i = 0; i < createdArticleIds.length; i++) {
                await db.insert(schema.pathSteps).values({
                    id: nanoid(),
                    pathId: existingPath.id,
                    articleId: createdArticleIds[i],
                    stepOrder: i + 1,
                });
                console.log(`   ✅ Step ${i + 1}: ${articles[i].title.substring(0, 50)}...`);
            }
        } else {
            await db.insert(schema.paths).values({
                id: pathId,
                title: "TypeScript Fundamentals: Dari Nol Sampai Mahir",
                description: "Learning path lengkap untuk menguasai TypeScript — mulai dari pengenalan, type annotations, interfaces, generics, classes, hingga advanced types dan utility types.",
                slug: PATH_SLUG,
                isPublished: true,
                createdAt: new Date(),
            });
            console.log("   ✅ Path 'TypeScript Fundamentals' created");

            // 4. Add steps to the path (correct order - article pertama = step 1)
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

    console.log("\n🎉 TypeScript content seed completed!");
    console.log(`   📝 ${createdArticleIds.length} articles`);
    console.log(`   🗺️ 1 learning path with ${createdArticleIds.length} steps`);
    process.exit(0);
}

main().catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
});
