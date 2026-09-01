# Dashboard Dalduk Backend

Backend service untuk **Dashboard Dalduk** yang dibangun menggunakan **Bun**, **ElysiaJS**, **Drizzle ORM**, dan **MySQL**.

---

## 🛠️ Tech Stack
- **Runtime:** [Bun](https://bun.sh)
- **Web Framework:** [ElysiaJS](https://elysiajs.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database:** MySQL
- **Documentation:** Swagger / OpenAPI (`/swagger`)

---

## 📁 Struktur Direktori
```text
src/
├── config/             # Konfigurasi environment & variables
│   └── env.ts
├── db/                 # Database pool & Drizzle ORM instance
│   ├── index.ts
│   └── schema/         # Definisi tabel schema Drizzle
│       └── index.ts
├── modules/            # Feature modules / domain routes
│   └── health/         # Healthcheck endpoints
│       └── index.ts
└── index.ts            # Entry point aplikasi Elysia
drizzle.config.ts       # Konfigurasi Drizzle Kit
tsconfig.json           # Konfigurasi TypeScript untuk Bun
.env.example            # Template environment variables
```

---

## 🚀 Memulai (Getting Started)

### 1. Prasyarat
- [Bun](https://bun.sh) (v1.0+)
- MySQL Server (Lokal atau Cloud)

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Konfigurasi Environment
Salin file template `.env.example` ke `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi kredensial MySQL (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

### 4. Menjalankan Server
Mode Development (Hot-reload):
```bash
bun run dev
```

Mode Production:
```bash
bun run start
```

Server akan berjalan pada:
- **API Base:** `http://localhost:3000`
- **Health Check:** `http://localhost:3000/health`
- **Swagger Docs:** `http://localhost:3000/swagger`

---

## 🗄️ Database & Migrasi (Drizzle Kit)

- **Generate Migration Files:**
  ```bash
  bun run db:generate
  ```
- **Push Schema Langsung ke Database:**
  ```bash
  bun run db:push
  ```
- **Jalankan Drizzle Studio (Visual DB Viewer):**
  ```bash
  bun run db:studio
  ```
