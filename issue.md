# Issue: Implementasi Data Sekolah dan Dashboard Pemetaan

## Deskripsi Tugas
Tugas ini mencakup penambahan skema database untuk data sekolah, pembuatan API, serta pembuatan antarmuka dashboard untuk memvisualisasikan data tersebut menggunakan diagram dan peta pesebaran.

## 1. Backend: Skema Database & API
Proyek backend ini menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM** (MySQL).

### A. Definisi Skema (Drizzle ORM)
Buat tabel `data_sekolah` di dalam skema Drizzle (misal: `src/db/schema/index.ts` atau file schema baru).

**Spesifikasi kolom:**
1. `npsn`: Integer (Primary Key, Auto Increment)
2. `nama_sekolah`: Varchar (150), Not Null
3. `jenjang`: Enum `('SD / Sederajat', 'SMP / Sederajat', 'SMA / Sederajat')`, Not Null
4. `klasifikasi`: Enum `('Terdaftar', 'Dasar', 'Paripurna')`, Not Null
5. `wilayah`: Varchar (255), Not Null
*(Bila diperlukan untuk akurasi peta, pertimbangkan penambahan kolom opsional `latitude` dan `longitude`)*

*Catatan: Setelah kode skema dibuat, jalankan command `bun run db:generate` dan `bun run db:push` untuk sinkronisasi ke database.*

### B. Pembuatan API Endpoints
Buat modul rute baru (misal: `src/modules/sekolah/index.ts`) dan daftarkan di `src/index.ts`.
- `GET /api/sekolah`: Mengambil list semua data sekolah.
- `GET /api/sekolah/stats`: Mengembalikan data agregasi (jumlah sekolah per jenjang, jumlah per klasifikasi) untuk memudahkan render grafik di frontend.

## 2. Frontend: Dashboard & Visualisasi
Buat tampilan dashboard yang akan mengkonsumsi API di atas.

### A. Visualisasi Diagram (Charts)
Tampilkan diagram yang mudah dibaca menggunakan library pilihan (seperti Chart.js, Recharts, atau ApexCharts).
- **Pie/Donut Chart**: Menampilkan proporsi sekolah berdasarkan **jenjang**.
- **Bar Chart**: Menampilkan jumlah sekolah berdasarkan **klasifikasi**.

### B. Peta Pesebaran Wilayah (Maps)
Tampilkan persebaran sekolah menggunakan library interaktif (seperti Leaflet.js atau Google Maps).
- Tampilkan marker/pin penanda sekolah pada peta.
- Karena kolom yang tersedia adalah nama `wilayah` (string), Anda mungkin perlu mengelompokkan data per wilayah polygon, menggunakan Geocoding API untuk meresolusi titik kordinat, atau menyesuaikan skema backend dengan menambahkan latitude/longitude.
- Tiap marker di peta sebaiknya menampilkan *tooltip/popup* berisi Nama Sekolah, Jenjang, dan Klasifikasinya saat di-klik.

## Kriteria Penerimaan (Acceptance Criteria - DoD)
- [ ] Tabel `data_sekolah` terbuat di database.
- [ ] API endpoint dapat mengembalikan respons JSON data sekolah dan terdaftar di Swagger.
- [ ] Dashboard menampilkan diagram statistik data sekolah.
- [ ] Dashboard menampilkan komponen peta dengan indikator wilayah/sekolah.
- [ ] Kode rapi, di-type dengan TypeScript secara ketat, dan tidak ada error saat build.
