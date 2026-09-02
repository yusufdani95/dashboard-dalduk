# Perencanaan Modul Autentikasi dan Manajemen Admin (RBAC)

Dokumen ini berisi perencanaan untuk pembuatan sistem autentikasi, manajemen pengguna (users), dan hak akses (Role-Based Access Control) yang akan diimplementasikan selanjutnya.

## 1. Struktur Database: Tabel `users`

Buat tabel `users` untuk menyimpan data pengguna dengan spesifikasi skema sebagai berikut:

- `id_user`: `INT AUTO_INCREMENT` (Primary Key)
- `username`: `VARCHAR(50)` (Unique)
- `email`: `VARCHAR(150)` (Unique)
- `password`: `VARCHAR(255)` (Harus disimpan dalam bentuk hash menggunakan **Bcrypt**)
- `nama_lengkap`: `VARCHAR(150)`
- `role_id` / `level_akses`: `ENUM('admin', 'operator_sekolah', 'viewer')`
- `is_active`: `TINYINT(1)` atau `BOOLEAN` (Default: `true` / `1`)

*Catatan untuk implementasi:*
Gunakan Drizzle ORM untuk membuat skema tabel ini di konfigurasi database proyek.

## 2. Modul Autentikasi (Login & Logout)

- Buat endpoint API untuk proses autentikasi/Login.
- Lakukan verifikasi password menggunakan Bcrypt.
- Gunakan JWT (JSON Web Token) atau Cookie Session yang aman untuk menyimpan sesi pengguna yang sedang login.
- Buat middleware untuk memproteksi endpoint (Route Protection) dan pengecekan hak akses (Role-Based Authorization).

## 3. Modul Manajemen Pengguna (CRUD Users)

Buatkan antarmuka (halaman/menu Admin) dan endpoint API untuk mengelola data pengguna. 
Fitur yang harus ada:
- **Create**: Menambahkan pengguna baru (termasuk melakukan proses hash pada password sebelum disimpan).
- **Read**: Menampilkan daftar pengguna dalam bentuk tabel (dilengkapi fitur pencarian dan paginasi).
- **Update**: Mengedit profil pengguna, mereset password, mengubah `role_id`, atau mengaktifkan/menonaktifkan akun pengguna (`is_active`).
- **Delete**: Menghapus data pengguna (bisa menggunakan metode Soft Delete atau Hard Delete).

*Hak Akses:* Modul CRUD Pengguna ini **hanya boleh diakses** oleh pengguna dengan `role_id = 'admin'`.

## 4. Modul Manajemen Data Sekolah (CRUD Sekolah)

Buatkan halaman/menu Admin khusus untuk mengelola master data sekolah yang nantinya akan ditampilkan secara publik di halaman depan (Dashboard Peta).
Fitur yang harus ada:
- **Create**: Form untuk menambah data sekolah baru, mencakup pengisian letak koordinat (latitude & longitude) dan profil detail sekolah.
- **Read**: Tabel daftar sekolah di panel admin.
- **Update**: Mengedit detail data sekolah yang sudah ada.
- **Delete**: Menghapus data sekolah.

*Ketentuan Hak Akses:* 
- `admin`: Memiliki hak penuh (CRUD) terhadap seluruh data sekolah.
- `operator_sekolah`: Dapat menambahkan, mengubah, atau menghapus data sekolah (atau dibatasi hanya untuk sekolah wilayah tertentu sesuai pengembangan lebih lanjut).
- `viewer`: Hanya memiliki hak untuk melihat data pada Dashboard publik atau Admin Panel tanpa akses memodifikasi data.

## 5. Integrasi Antarmuka (Admin Panel)

- Buat layout halaman khusus Admin Panel yang terpisah atau berbeda akses dari halaman dashboard publik (`public/index.html`).
- Tambahkan menu navigasi (sidebar/header) yang rapi, meliputi:
  - Dashboard Admin
  - Kelola Pengguna (Users)
  - Kelola Data Sekolah
  - Logout
- Pastikan seluruh form input (tambah/edit) menggunakan validasi yang ketat dan memberikan *feedback* (pesan sukses/error) yang jelas kepada pengguna.

---
**Instruksi Tambahan untuk Junior Programmer / AI Model:**
Silakan gunakan teknologi yang sudah ada di proyek ini, yaitu **ElysiaJS** untuk backend API dan **Drizzle ORM** untuk pengelolaan database MySQL/MariaDB. Pastikan untuk selalu mementingkan keamanan, validasi input, dan memisahkan dengan jelas antara akses publik dan otentikasi admin.
