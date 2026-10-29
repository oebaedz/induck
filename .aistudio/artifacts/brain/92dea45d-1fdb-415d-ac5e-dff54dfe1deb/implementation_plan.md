# Sistem Kolaborasi Multi-Pengguna, Sinkronisasi Cloud Drive, & Hak Akses Berjenjang (RBAC)

Solusi menyeluruh untuk mengelola Buku Induk Siswa secara kolaboratif antar staf sekolah (Kepala Sekolah/Admin, Wali Kelas, Guru Mapel, dan Tata Usaha) tanpa kewajiban login Google perorangan, dilengkapi penyimpanan foto dan logo otomatis ke Google Drive via Apps Script, sinkronisasi profil sekolah ke database, serta integrasi direktori guru dengan akun login berjenjang.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Keputusan & Preferensi Pengguna yang Telah Dikonfirmasi**:
> 1. **Sinkronisasi Tanpa Wajib Login Akun Google Tiap Pengguna**: Menggunakan arsitektur **Google Apps Script Web App (Webhook Endpoint)** yang dipasang pada Google Spreadsheet sekolah. Seluruh guru dan staf dapat menyinkronkan data dua arah (Tarik & Kirim Data) hanya dengan URL Webhook rahasia sekolah yang disimpan oleh Admin, tanpa popup login akun Google untuk masing-masing guru. Opsi direct OAuth tetap dipertahankan sebagai opsi alternatif.
> 2. **Penyimpanan Foto Siswa & Logo Sekolah ke Google Drive via Apps Script**: Foto siswa (foto profil, foto masuk, foto keluar) dan logo sekolah diunggah langsung ke folder Google Drive (*"Buku Induk - Media & Foto"*) milik pemilik spreadsheet menggunakan native `DriveApp`. URL permanen direct CDN (`https://lh3.googleusercontent.com/d/{fileId}`) disimpan ke sheet dan dapat diakses dari perangkat manapun dengan cepat tanpa membebani ukuran spreadsheet.
> 3. **Data Profil Sekolah & Kepala Sekolah Tersimpan ke Database**: Tab khusus `PROFIL_SEKOLAH` di Google Sheets menyimpan data identitas sekolah (NPSN, Nama Sekolah, Alamat, Logo URL, Data Kepala Sekolah, NIP) sehingga otomatis tersinkron ke semua perangkat dan lembar cetak rapor/buku induk.
> 4. **Integrasi Terpadu Antara Data Guru/Staf dan Akun Login Aplikasi**: Data guru (Nama, NIP, Mata Pelajaran yang diampu, Kelas Binaan) menyatu secara otomatis dengan Akun Pengguna (Username, Role, PIN login, Hak Akses). Admin cukup menginput data guru sekali untuk langsung membuatkan akun login mereka.

---

## 1. Overview & Core Concept

- **Apa yang Dibangun**:
  1. **Google Apps Script Web App with Drive Media Pipeline**:
     - Endpoint Web App untuk membaca dan menulis 4 tab inti: `SISWA_INDUK`, `NILAI_SEMESTER`, `PROFIL_SEKOLAH`, dan `DATA_GURU_STAF`.
     - Penanganan otomatis file media (foto siswa dan logo sekolah) melalui Google Drive `DriveApp`, menghasilkan URL direct CDN publik yang ringan dan permanen.
     - Generator kode Apps Script otomatis di dalam aplikasi yang siap disalin (*1-click copy*) ke Google Spreadsheet sekolah.
  2. **Integrasi Data Guru & Staf dengan Sistem Hak Akses (RBAC)**:
     - Direktori Guru & Tenaga Kependidikan terpadu. Setiap guru memiliki profil biodata, NIP, jabatan, kelas binaan, serta akun login berbasis PIN.
     - Matriks izin berjenjang:
       - **Admin (Kepala Sekolah / Admin Sistem)**: Hak penuh (Kelola Guru & Akun, Ubah Profil Sekolah, Hapus Siswa, Konfigurasi Sinkronisasi).
       - **Wali Kelas**: Mengelola siswa di kelas binaan, menginput nilai rapor & absensi, mencetak rapor siswa kelasnya.
       - **Guru Mata Pelajaran**: Menginput dan mengubah nilai mata pelajaran yang diampunya untuk kelas terkait.
       - **Tata Usaha (TU)**: Mengelola biodata siswa, mutasi masuk/keluar, unggah foto siswa, cetak buku induk, tanpa izin mengubah konfigurasi akun dan nilai akademik.
  3. **Pengaturan Profil Sekolah & Kepala Sekolah**:
     - Form pengaturan lengkap identitas sekolah (Nama Sekolah, NPSN, NSS, Alamat, Kontak, Logo Sekolah, Nama & NIP Kepala Sekolah, Tanggal Pembagian Rapor).
     - Data tersimpan lokal dan otomatis disinkronkan ke tab `PROFIL_SEKOLAH` di Google Sheets.

- **Nilai Utama**:
  - Nol hambatan otentikasi Google bagi guru dan staf.
  - Foto dan logo tidak hilang saat berganti perangkat karena tersimpan di Google Drive pusat.
  - Data guru dan akun login tidak ganda (sekali input guru langsung siap dipakai untuk akun login dan tanda tangan rapor).
  - Keamanan data terjamin dengan pembatasan hak hapus dan edit sesuai peran.

---

## 2. User Experience & Visual Design

Sesuai pedoman desain *SaaS & Dashboard* dan *Universal Frontend Constitution*:
- **Aesthetic Direction**: Desain administratif modern, terstruktur rapi, utilitarian, dan padat informasi (*high-density data display*).
- **Warna & Palet (60-30-10 Rule)**:
  - Kanvas Dominan (60%): `#FFFFFF` / `bg-slate-50` (Mode gelap: `#0F172A`).
  - Permukaan Struktural (30%): Border hairline halus 1px (`border-slate-200 dark:border-slate-800`), baris tabel berketinggian kompak ($38\text{px}$–$42\text{px}$).
  - Aksen Aksi (10%): Biru Klasik Edukasi (`#2563EB`) untuk tombol aksi utama, Emerald (`#059669`) untuk status cloud aktif, Amber (`#D97706`) untuk verifikasi peringatan.
  - *No-Pill Discipline*: Label peran (Admin, Wali Kelas, Guru Mapel, TU) dan metadata ditampilkan dengan teks tipografi bersih disertai separator titik tengah (`·`), tanpa kotak kapsul permen berwarna-warni.
- **Tipografi**:
  - Judul & Navigasi: `Plus Jakarta Sans` / `Manrope`.
  - Konten & Formulir: `DM Sans` / `Public Sans` untuk keterbacaan teks panjang.
  - Angka, Nilai, NISN, NIK, dan NIP: `font-mono tabular-nums` agar sejajar vertikal secara presisi.

### Alur Antarmuka Pengguna (Key User Flows)

```
[Layar Pilih Profil / Login Guru]
        │
        ├── Masukkan Username/Pilih Nama Guru & Ketik PIN 6-Digit
        │
        ├── Terverifikasi Sesuai Role (Admin / Wali Kelas / Guru Mapel / TU)
        │
        ├── Navigasi & Aksi Disesuaikan:
        │       ├── [Admin]        : Akses semua menu + Tab "Guru & Staf" + "Profil Sekolah" + "Sinkronisasi"
        │       ├── [Wali Kelas]   : Siswa Kelas Binaan + Nilai Rapor + Catatan Wali + Cetak Rapor
        │       ├── [Guru Mapel]   : Input Nilai Mapel Khusus + Rekap Nilai
        │       └── [Tata Usaha]   : Biodata Siswa + Mutasi Siswa + Foto Masuk/Keluar + Cetak Buku Induk
        │
        └── Tombol "Sinkronisasi Cloud" di Top Bar:
                ├── Otomatis Kirim / Tarik Data Siswa, Nilai, Profil Sekolah, & Akun Guru
                └── Upload Foto Baru ke Folder Google Drive via Apps Script Web App
```

1. **Top Bar Header**:
   - Menampilkan identitas sekolah, nama pengguna aktif & perannya (misal: `"Siti Rahma, S.Pd · Wali Kelas 8B"`).
   - Tombol ganti akun instan (*Switch User*) dan tombol status sinkronisasi.
2. **Tab Manajemen Profil Sekolah (Khusus Admin)**:
   - Form identitas sekolah lengkap dengan pratinjau logo dan tombol unggah logo langsung ke Google Drive.
   - Form data Kepala Sekolah (Nama lengkap dengan gelar, NIP) untuk tanda tangan otomatis pada Rapor & Buku Induk.
3. **Tab Direktori Guru & Akun Pengguna (Khusus Admin)**:
   - Daftar guru dalam format tabel densitas tinggi: Nama Guru, NIP, Mata Pelajaran, Kelas Binaan, Peran Sistem, Status Akun, dan Aksi (Ubah PIN / Edit Peran).
   - Modal tambah/edit guru terintegrasi: satu formulir untuk data kepegawaian sekaligus aktivasi akun login.
4. **Modal Konfigurasi Sinkronisasi (Google Apps Script Web App)**:
   - Input URL Webhook Apps Script (`https://script.google.com/macros/s/.../exec`).
   - Panduan praktis 3 langkah dengan tombol salin kode skrip lengkap (*1-Click Copy Apps Script Code*).
   - Indikator status koneksi Google Sheets & status Google Drive Media Folder.
   - Tombol "Tarik Data dari Cloud" dan "Kirim Data ke Cloud".

---

## 3. Key Product Decisions & Trade-Offs

- **Keputusan 1: Google Apps Script sebagai Single Endpoint untuk Spreadsheet & Google Drive**
  - *Pendekatan*: Script Web App menangani request `doPost` bertipe JSON. Jika ada data foto baru bertipe Base64 (foto siswa atau logo), skrip menyimpannya ke folder Google Drive menggunakan `DriveApp.getFoldersByName()` / `createFolder()`, membuat file, menyetel izin publik (`Access.ANYONE_WITH_LINK`), dan mencatat link URL `https://lh3.googleusercontent.com/d/{id}` ke baris spreadsheet.
  - *Alasan*: Menghilangkan batas ukuran sel spreadsheet (50.000 karakter), foto tersimpan permanen di cloud tanpa perlu izin OAuth di masing-masing perangkat pengguna, dan tidak ada biaya langganan cloud hosting tambahan.

- **Keputusan 2: Penyatuan Direktori Guru dan Akun Pengguna (Unified Data Model)**
  - *Pendekatan*: Entitas `TeacherUser` menggabungkan profil pendidik (Nama, Gelar, NIP, Mapel, Kelas Binaan) dengan kredensial sistem (Username, PIN Hash, Role, Permissions).
  - *Alasan*: Mencegah duplikasi data, memastikan nama guru di rapor selalu sinkron dengan akun yang mengisi nilai, dan mempermudah admin dalam mengelola satu daftar saja.

- **Keputusan 3: Struktur Tab Google Sheets 4-Pilar**
  - `SISWA_INDUK`: Biodata lengkap siswa, NISN, NIK, URL foto profil, foto masuk, foto keluar, mutasi.
  - `NILAI_SEMESTER`: Seluruh rekaman nilai mata pelajaran, semester, capaian kompetensi, dan absensi.
  - `PROFIL_SEKOLAH`: 1 baris berisi konfigurasi sekolah, URL logo sekolah, data Kepala Sekolah.
  - `DATA_GURU_STAF`: Data guru, NIP, mapel, kelas binaan, dan akun akses terenkripsi.

---

## 4. Technical Architecture & Data Strategy

### Diagram Arsitektur Komponen & Alur Data

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                          Aplikasi Buku Induk Digital                          │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────┐               ┌───────────────────────────────┐  │
│  │   Auth & RBAC Context   │               │     School Profile Context    │  │
│  │ (Active User, Role, PIN)│               │ (School Info, Logo, Principal)│  │
│  └────────────┬────────────┘               └───────────────┬───────────────┘  │
│               │                                            │                  │
│               ▼                                            ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │ View Layer:                                                             │  │
│  │  - DashboardView (Statistik Siswa & Status Sinkronisasi)                │  │
│  │  - StudentListView (Biodata, Foto Masuk/Keluar, Filter Kelas)           │  │
│  │  - GradesManagerView (Input Nilai Mata Pelajaran & Rapor)               │  │
│  │  - PrintCenterView (Cetak Buku Induk & Rapor dengan Logo & TTD Kepsek)  │  │
│  │  - TeachersAndUsersView (Kelola Guru & Akun Pengguna - Khusus Admin)    │  │
│  │  - SchoolProfileModal (Edit Profil Sekolah & Logo - Khusus Admin)       │  │
│  │  - GoogleSyncModal (URL Apps Script Web App & Generator Skrip)          │  │
│  └────────────────────────────────────┬────────────────────────────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│                    ┌─────────────────────────────────────┐                    │
│                    │     AppsScriptSyncService (HTTP)    │                    │
│                    │   - JSON Payload Packager           │                    │
│                    │   - Auto Base64 Image Extractor     │                    │
│                    │   - Two-Way Diff & Batch Update     │                    │
│                    └──────────────────┬──────────────────┘                    │
└───────────────────────────────────────┼───────────────────────────────────────┘
                                        │ (HTTP POST / GET)
                                        ▼
      ┌──────────────────────────────────────────────────────────────────┐
      │         Google Apps Script Web App (Dipasang di Google Sheet)    │
      │                                                                  │
      │   ┌──────────────────────────────────────────────────────────┐   │
      │   │  doPost(e) / doGet(e) Handler                            │   │
      │   └───────────────┬──────────────────────────┬───────────────┘   │
      │                   │                          │                   │
      │                   ▼                          ▼                   │
      │      ┌─────────────────────────┐  ┌─────────────────────────┐    │
      │      │     SpreadsheetApp      │  │        DriveApp         │    │
      │      │ (Baca / Tulis 4 Tab):   │  │ Simpan Foto Siswa & Logo│    │
      │      │  - SISWA_INDUK          │  │ ke Folder:              │    │
      │      │  - NILAI_SEMESTER       │  │ "Buku Induk - Media"    │    │
      │      │  - PROFIL_SEKOLAH       │  │ & Buat Link Direct CDN  │    │
      │      │  - DATA_GURU_STAF       │  │                         │    │
      │      └─────────────────────────┘  └─────────────────────────┘    │
      └──────────────────────────────────────────────────────────────────┘
```

### Model Data Inti (TypeScript)

```typescript
// 1. Profil Sekolah & Kepala Sekolah
export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  nss?: string;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website?: string;
  logoUrl?: string; // Direct Drive CDN URL
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  tanggalRapor?: string;
}

// 2. Data Guru & Akun Login (Terpadu)
export type UserRole = 'admin' | 'wali_kelas' | 'guru_mapel' | 'tata_usaha';

export interface TeacherUser {
  id: string;
  username: string;
  fullName: string;
  gelar?: string;
  nip: string;
  role: UserRole;
  pinHash: string;
  mataPelajaran?: string; // e.g. "Matematika", "Bahasa Indonesia"
  assignedClass?: string;  // e.g. "7A", "8B", atau undefined jika mengajar lintas kelas
  isActive: boolean;
  canEditBiodata: boolean;
  canEditGrades: boolean;
  canDeleteStudent: boolean;
  canSyncSheets: boolean;
  createdAt: string;
  lastLogin?: string;
}
```

### Logika Eksekusi Google Apps Script Web App
1. **Penerimaan Payload**:
   - Menerima POST data berisi `{ action: "sync_all", schoolProfile, teachers, students, grades }`.
2. **Penyimpanan Gambar ke Google Drive**:
   - Mendeteksi gambar baru berawalan `data:image/...`.
   - Menggunakan `DriveApp.getFoldersByName("Buku Induk - Media & Foto")` (dibuat otomatis jika belum ada).
   - Menyimpan blob gambar dengan nama file unik, menyetel akses `setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)`.
   - Menghasilkan URL direct CDN `https://lh3.googleusercontent.com/d/${file.getId()}`.
3. **Penyimpanan Lembar Spreadsheet**:
   - Membersihkan dan menulis baris baru secara bersih pada tab `SISWA_INDUK`, `NILAI_SEMESTER`, `PROFIL_SEKOLAH`, dan `DATA_GURU_STAF`.
4. **Respons JSON**: Mengembalikan status sukses dan data yang sudah diperbarui dengan link Google Drive baru.
