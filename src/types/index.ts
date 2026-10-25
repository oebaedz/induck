export interface OrangTuaDetail {
  nama: string;
  nik: string;
  tahunLahir: string;
  pendidikan: string;
  pekerjaan: string;
  penghasilan: string;
  noHp: string;
  statusHidup: 'Masih Hidup' | 'Meninggal Dunia';
}

export interface WaliDetail {
  nama: string;
  nik: string;
  tahunLahir: string;
  pendidikan: string;
  pekerjaan: string;
  penghasilan: string;
  noHp: string;
  hubungan: string;
}

export interface AlamatSiswa {
  jalan: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  tinggalDengan: 'Orang Tua' | 'Wali' | 'Kost' | 'Asrama' | 'Lainnya';
  noHpSiswa: string;
  emailSiswa: string;
  jarakKeSekolah: string;
}

export interface RiwayatPendidikan {
  asalSekolah: string;
  noPesertaUjian: string;
  noIjazahSebelumnya: string;
  tanggalDiterima: string;
  masukKelas: string;
  statusMasuk: 'Siswa Baru' | 'Pindahan';
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  nik: string;
  namaLengkap: string;
  namaPanggilan: string;
  jenisKelamin: 'L' | 'P';
  tempatLahir: string;
  tanggalLahir: string;
  agama: 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu' | 'Lainnya';
  kewarganegaraan: string;
  anakKe: number;
  jumlahSaudara: number;
  statusAnak: 'Kandung' | 'Tiri' | 'Angkat';
  bahasaSehariHari: string;
  alamat: AlamatSiswa;
  orangTua: {
    ayah: OrangTuaDetail;
    ibu: OrangTuaDetail;
    wali?: WaliDetail;
  };
  riwayatPendidikan: RiwayatPendidikan;
  statusSiswa: 'Aktif' | 'Lulus' | 'Mutasi Keluar' | 'Drop Out';
  kelasSekarang: string;
  fotoUrl: string;
  fotoMasukUrl?: string;
  fotoKeluarUrl?: string;
}

export interface CatatanKesehatan {
  semester: number;
  tahunAjaran: string;
  tinggiBadan: number; // cm
  beratBadan: number; // kg
  golonganDarah: 'A' | 'B' | 'AB' | 'O' | '-';
  kelainanFisik?: string;
  riwayatPenyakit?: string;
}

export interface Prestasi {
  id: string;
  namaLomba: string;
  bidang: 'Akademik' | 'Olahraga' | 'Seni' | 'Keagamaan' | 'Lainnya';
  tingkat: 'Sekolah' | 'Kecamatan' | 'Kabupaten/Kota' | 'Provinsi' | 'Nasional' | 'Internasional';
  tahun: string;
  peringkat: string;
  keterangan?: string;
}

export interface CatatanKarakter {
  semester: number;
  tahunAjaran: string;
  kelakuan: 'Sangat Baik' | 'Baik' | 'Cukup';
  kerajinan: 'Sangat Baik' | 'Baik' | 'Cukup';
  kerapian: 'Sangat Baik' | 'Baik' | 'Cukup';
  kehadiran: {
    sakit: number;
    izin: number;
    alpa: number;
  };
  catatanBK?: string;
}

export interface PerkembanganSiswa {
  studentId: string;
  kesehatan: CatatanKesehatan[];
  prestasi: Prestasi[];
  karakter: CatatanKarakter[];
}

export interface SelesaiStudiMutasi {
  studentId: string;
  statusAkhir: 'Lulus' | 'Mutasi Keluar' | 'Putus Sekolah' | 'Belum Selesai';
  kelulusan?: {
    tanggalLulus: string;
    noIjazah: string;
    noSkhun?: string;
    melanjutkanKe: string;
    keterangan?: string;
  };
  mutasi?: {
    tanggalMutasi: string;
    pindahKeSekolah: string;
    alasanPindah: string;
    noSuratPindah: string;
  };
}

export interface MataPelajaranNilai {
  kode: string;
  nama: string;
  kelompok: 'Kelompok A (Umum)' | 'Kelompok B (Umum)' | 'Kelompok C (Peminatan / Mulok)';
  kkm: number;
  nilaiPengetahuan: number;
  predikatPengetahuan: 'A' | 'B' | 'C' | 'D';
  nilaiKeterampilan: number;
  predikatKeterampilan: 'A' | 'B' | 'C' | 'D';
  deskripsiCapaian?: string;
}

export interface EkstrakurikulerNilai {
  nama: string;
  predikat: 'Sangat Baik' | 'Baik' | 'Cukup';
  keterangan: string;
}

export interface NilaiSemester {
  id: string;
  studentId: string;
  semester: number; // 1 to 6
  kelas: string;
  tahunAjaran: string;
  mataPelajaran: MataPelajaranNilai[];
  ekstrakurikuler: EkstrakurikulerNilai[];
  catatanWaliKelas?: string;
  statusKenaikan?: 'Naik Kelas' | 'Tinggal Kelas' | 'Lulus' | 'Sedang Berjalan';
}

export interface SchoolProfile {
  namaSekolah: string;
  npsn: string;
  nss: string;
  akreditasi: string;
  alamat: string;
  desaKelurahan: string;
  kecamatan: string;
  kabupatenKota: string;
  provinsi: string;
  kodePos: string;
  telepon: string;
  email: string;
  website: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  logoUrl?: string;
}

export interface SyncState {
  isConnected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetTitle: string | null;
  lastSyncedAt: string | null;
  isSyncing: boolean;
  userEmail: string | null;
}
