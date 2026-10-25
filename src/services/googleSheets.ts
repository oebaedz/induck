import { Student, PerkembanganSiswa, NilaiSemester, SelesaiStudiMutasi } from '../types';

export interface SheetExportPayload {
  students: Student[];
  perkembangan: PerkembanganSiswa[];
  nilaiList: NilaiSemester[];
  kelulusanMutasi: SelesaiStudiMutasi[];
}

export interface SheetImportResult {
  students: Student[];
  perkembangan: PerkembanganSiswa[];
  nilaiList: NilaiSemester[];
  kelulusanMutasi: SelesaiStudiMutasi[];
}

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Creates a brand new Google Spreadsheet for Buku Induk Sekolah
 */
export async function createSchoolSpreadsheet(
  accessToken: string,
  schoolName: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const title = `Buku Induk Siswa Digital - ${schoolName || 'Sekolah'}`;
  
  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Data_Siswa',
          gridProperties: { rowCount: 100, columnCount: 35, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Data_Perkembangan',
          gridProperties: { rowCount: 100, columnCount: 20, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Data_Nilai',
          gridProperties: { rowCount: 200, columnCount: 20, frozenRowCount: 1 },
        },
      },
      {
        properties: {
          title: 'Data_Kelulusan_Mutasi',
          gridProperties: { rowCount: 100, columnCount: 15, frozenRowCount: 1 },
        },
      },
    ],
  };

  const response = await fetch(SHEETS_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membuat Spreadsheet (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Sanitizes any value to ensure it never breaches Google Sheets' strict
 * 50,000 characters per cell limit.
 */
export function safeCellString(val: any, maxLen = 45000): string | number {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  const str = String(val);
  if (str.length <= maxLen) return str;

  // If this is a base64 image data URL exceeding safe cell limits, store a clean reference marker
  if (str.startsWith('data:image/')) {
    return '[Foto Siswa Base64 Tersimpan di Browser]';
  }
  // Otherwise truncate cleanly
  return str.slice(0, maxLen - 3) + '...';
}

/**
 * Writes or updates all data sheets in the given spreadsheet
 */
export async function writeAllSheetsData(
  accessToken: string,
  spreadsheetId: string,
  payload: SheetExportPayload
): Promise<void> {
  // 1. Data Siswa Rows
  const studentHeaders = [
    'ID', 'NIS', 'NISN', 'NIK', 'Nama Lengkap', 'Nama Panggilan', 'Jenis Kelamin', 
    'Tempat Lahir', 'Tanggal Lahir', 'Agama', 'Kewarganegaraan', 'Anak Ke', 'Jumlah Saudara', 
    'Status Anak', 'Bahasa', 'Kelas Sekarang', 'Status Siswa', 'Jalan', 'RT', 'RW', 
    'Kelurahan', 'Kecamatan', 'Kab/Kota', 'Provinsi', 'No HP Siswa', 'Nama Ayah', 
    'Pekerjaan Ayah', 'Nama Ibu', 'Pekerjaan Ibu', 'Foto URL', 'Foto Masuk URL', 'Foto Keluar URL'
  ];

  const studentRows = payload.students.map(s => [
    s.id,
    s.nis,
    s.nisn,
    s.nik,
    s.namaLengkap,
    s.namaPanggilan,
    s.jenisKelamin,
    s.tempatLahir,
    s.tanggalLahir,
    s.agama,
    s.kewarganegaraan,
    s.anakKe,
    s.jumlahSaudara,
    s.statusAnak,
    s.bahasaSehariHari,
    s.kelasSekarang,
    s.statusSiswa,
    s.alamat.jalan,
    s.alamat.rt,
    s.alamat.rw,
    s.alamat.kelurahan,
    s.alamat.kecamatan,
    s.alamat.kabupatenKota,
    s.alamat.provinsi,
    s.alamat.noHpSiswa,
    s.orangTua.ayah.nama,
    s.orangTua.ayah.pekerjaan,
    s.orangTua.ibu.nama,
    s.orangTua.ibu.pekerjaan,
    s.fotoUrl,
    s.fotoMasukUrl || s.fotoUrl || '',
    s.fotoKeluarUrl || '',
  ]);

  // 2. Data Perkembangan Rows (flattened records)
  const perkembanganHeaders = [
    'Student ID', 'Semester', 'Tahun Ajaran', 'Tinggi Badan (cm)', 'Berat Badan (kg)', 
    'Golongan Darah', 'Kelainan Fisik', 'Riwayat Penyakit', 'Kelakuan', 'Kerajinan', 
    'Kerapian', 'Sakit', 'Izin', 'Alpa', 'Daftar Prestasi (Ringkasan)'
  ];

  const perkembanganRows: (string | number)[][] = [];
  payload.perkembangan.forEach(p => {
    const prestasiSummary = p.prestasi.map(pr => `${pr.namaLomba} (${pr.peringkat} - ${pr.tingkat})`).join('; ');
    if (p.kesehatan.length === 0) {
      perkembanganRows.push([p.studentId, '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', 0, 0, 0, prestasiSummary]);
    } else {
      p.kesehatan.forEach((k, idx) => {
        const c = p.karakter[idx] || p.karakter[0];
        perkembanganRows.push([
          p.studentId,
          k.semester,
          k.tahunAjaran,
          k.tinggiBadan,
          k.beratBadan,
          k.golonganDarah,
          k.kelainanFisik || '-',
          k.riwayatPenyakit || '-',
          c?.kelakuan || 'Baik',
          c?.kerajinan || 'Baik',
          c?.kerapian || 'Baik',
          c?.kehadiran?.sakit ?? 0,
          c?.kehadiran?.izin ?? 0,
          c?.kehadiran?.alpa ?? 0,
          prestasiSummary
        ]);
      });
    }
  });

  // 3. Data Nilai Rows
  const nilaiHeaders = [
    'ID Nilai', 'Student ID', 'Semester', 'Kelas', 'Tahun Ajaran', 'Kode Mapel', 
    'Nama Mata Pelajaran', 'Kelompok', 'KKM', 'Nilai Pengetahuan', 'Predikat Pengetahuan', 
    'Nilai Keterampilan', 'Predikat Keterampilan', 'Catatan Guru'
  ];

  const nilaiRows: (string | number)[][] = [];
  payload.nilaiList.forEach(nl => {
    nl.mataPelajaran.forEach(mp => {
      nilaiRows.push([
        nl.id,
        nl.studentId,
        nl.semester,
        nl.kelas,
        nl.tahunAjaran,
        mp.kode,
        mp.nama,
        mp.kelompok,
        mp.kkm,
        mp.nilaiPengetahuan,
        mp.predikatPengetahuan,
        mp.nilaiKeterampilan,
        mp.predikatKeterampilan,
        mp.deskripsiCapaian || '-'
      ]);
    });
  });

  // 4. Data Kelulusan & Mutasi Rows
  const kelulusanHeaders = [
    'Student ID', 'Status Akhir', 'Tanggal Kelulusan', 'No Ijazah', 'No SKHUN', 
    'Melanjutkan Ke', 'Tanggal Mutasi', 'Pindah Ke Sekolah', 'Alasan Pindah', 'No Surat Pindah'
  ];

  const kelulusanRows = payload.kelulusanMutasi.map(km => [
    km.studentId,
    km.statusAkhir,
    km.kelulusan?.tanggalLulus || '-',
    km.kelulusan?.noIjazah || '-',
    km.kelulusan?.noSkhun || '-',
    km.kelulusan?.melanjutkanKe || '-',
    km.mutasi?.tanggalMutasi || '-',
    km.mutasi?.pindahKeSekolah || '-',
    km.mutasi?.alasanPindah || '-',
    km.mutasi?.noSuratPindah || '-'
  ]);

  // Sanitize all cell contents to strictly guarantee no cell exceeds 45,000 chars
  const sanitizedStudentRows = studentRows.map(row => row.map(c => safeCellString(c)));
  const sanitizedPerkembanganRows = perkembanganRows.map(row => row.map(c => safeCellString(c)));
  const sanitizedNilaiRows = nilaiRows.map(row => row.map(c => safeCellString(c)));
  const sanitizedKelulusanRows = kelulusanRows.map(row => row.map(c => safeCellString(c)));

  const valueRanges = [
    {
      range: 'Data_Siswa!A1:AF',
      values: [studentHeaders, ...sanitizedStudentRows],
    },
    {
      range: 'Data_Perkembangan!A1:O',
      values: [perkembanganHeaders, ...sanitizedPerkembanganRows],
    },
    {
      range: 'Data_Nilai!A1:N',
      values: [nilaiHeaders, ...sanitizedNilaiRows],
    },
    {
      range: 'Data_Kelulusan_Mutasi!A1:J',
      values: [kelulusanHeaders, ...sanitizedKelulusanRows],
    },
  ];

  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchUpdate`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueRanges,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal memperbarui data sheet (${response.status})`);
  }
}

/**
 * Reads all data from the spreadsheet
 */
export async function readAllSheetsData(
  accessToken: string,
  spreadsheetId: string
): Promise<SheetImportResult> {
  const ranges = ['Data_Siswa!A1:AF', 'Data_Perkembangan!A1:O', 'Data_Nilai!A1:N', 'Data_Kelulusan_Mutasi!A1:J'];
  const params = ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&');
  const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values:batchGet?${params}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gagal membaca spreadsheet (${response.status})`);
  }

  const data = await response.json();
  const valueRanges = data.valueRanges || [];

  // Parse Data_Siswa
  const siswaData = valueRanges[0]?.values || [];
  const parsedStudents: Student[] = [];
  if (siswaData.length > 1) {
    for (let i = 1; i < siswaData.length; i++) {
      const row = siswaData[i];
      if (!row || !row[0]) continue;
      const rawFotoUrl = String(row[29] || '');
      const rawFotoMasukUrl = String(row[30] || '');
      const rawFotoKeluarUrl = String(row[31] || '');

      parsedStudents.push({
        id: String(row[0]),
        nis: String(row[1] || ''),
        nisn: String(row[2] || ''),
        nik: String(row[3] || ''),
        namaLengkap: String(row[4] || ''),
        namaPanggilan: String(row[5] || ''),
        jenisKelamin: (row[6] === 'P' ? 'P' : 'L'),
        tempatLahir: String(row[7] || ''),
        tanggalLahir: String(row[8] || ''),
        agama: (row[9] || 'Islam') as Student['agama'],
        kewarganegaraan: String(row[10] || 'Indonesia'),
        anakKe: Number(row[11]) || 1,
        jumlahSaudara: Number(row[12]) || 0,
        statusAnak: 'Kandung',
        bahasaSehariHari: String(row[14] || 'Bahasa Indonesia'),
        kelasSekarang: String(row[15] || 'X-A'),
        statusSiswa: (row[16] || 'Aktif') as Student['statusSiswa'],
        alamat: {
          jalan: String(row[17] || ''),
          rt: String(row[18] || '01'),
          rw: String(row[19] || '01'),
          kelurahan: String(row[20] || ''),
          kecamatan: String(row[21] || ''),
          kabupatenKota: String(row[22] || ''),
          provinsi: String(row[23] || ''),
          kodePos: '12345',
          tinggalDengan: 'Orang Tua',
          noHpSiswa: String(row[24] || ''),
          emailSiswa: '',
          jarakKeSekolah: '1.5 km',
        },
        orangTua: {
          ayah: {
            nama: String(row[25] || ''),
            nik: '',
            tahunLahir: '1975',
            pendidikan: 'S1',
            pekerjaan: String(row[26] || ''),
            penghasilan: 'Rp 5.000.000 - Rp 10.000.000',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          ibu: {
            nama: String(row[27] || ''),
            nik: '',
            tahunLahir: '1980',
            pendidikan: 'SMA',
            pekerjaan: String(row[28] || ''),
            penghasilan: 'Ibu Rumah Tangga',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
        },
        riwayatPendidikan: {
          asalSekolah: 'SMP Negeri 1',
          noPesertaUjian: '',
          noIjazahSebelumnya: '',
          tanggalDiterima: '2023-07-15',
          masukKelas: 'X-1',
          statusMasuk: 'Siswa Baru',
        },
        fotoUrl: rawFotoUrl.startsWith('[Foto') ? '' : rawFotoUrl,
        fotoMasukUrl: rawFotoMasukUrl.startsWith('[Foto') ? '' : rawFotoMasukUrl,
        fotoKeluarUrl: rawFotoKeluarUrl.startsWith('[Foto') ? '' : rawFotoKeluarUrl,
      });
    }
  }

  return {
    students: parsedStudents,
    perkembangan: [],
    nilaiList: [],
    kelulusanMutasi: [],
  };
}
