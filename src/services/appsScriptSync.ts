import { Student, PerkembanganSiswa, NilaiSemester, SelesaiStudiMutasi, SchoolProfile, TeacherUser } from '../types';

export interface AppsScriptSyncPayload {
  action: 'push' | 'pull';
  school?: SchoolProfile;
  teachers?: TeacherUser[];
  students?: Student[];
  perkembangan?: PerkembanganSiswa[];
  nilaiList?: NilaiSemester[];
  kelulusanMutasi?: SelesaiStudiMutasi[];
}

export interface AppsScriptSyncResult {
  success: boolean;
  message: string;
  data?: {
    school?: SchoolProfile;
    teachers?: TeacherUser[];
    students?: Student[];
    perkembangan?: PerkembanganSiswa[];
    nilaiList?: NilaiSemester[];
    kelulusanMutasi?: SelesaiStudiMutasi[];
  };
  stats?: {
    uploadedPhotosCount: number;
    studentsCount: number;
    teachersCount: number;
  };
}

/**
 * Menghasilkan kode Apps Script yang dipasang di Google Sheets sekolah.
 * Skrip ini menyediakan Web App endpoint untuk menerima data JSON,
 * menyimpan foto dan logo ke Google Drive otomatis, dan menulis ke 4 sheet.
 */
export function generateAppsScriptCode(schoolName: string = 'Sekolah'): string {
  return `/**
 * =======================================================================
 * GOOGLE APPS SCRIPT - BUKU INDUK DIGITAL & CLOUD DRIVE MEDIA SYNC
 * Sekolah: ${schoolName}
 * =======================================================================
 * Panduan Deployment:
 * 1. Di Google Sheets, buka menu: Ekstensi > Apps Script
 * 2. Hapus seluruh kode yang ada, lalu tempel (paste) kode ini.
 * 3. Klik tombol "Simpan" (ikon disket).
 * 4. Klik tombol "Terapkan" (Deploy) di kanan atas > "Deployment Baru" (New Deployment).
 * 5. Klik ikon gerigi (Pilih jenis) > Pilih "Aplikasi Web" (Web App).
 * 6. Setelan:
 *    - Deskripsi: Buku Induk Sync API
 *    - Jalankan sebagai (Execute as): Saya (Me / Email Anda)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 7. Klik "Terapkan" (Deploy) dan berikan izin akses Google Drive & Spreadsheet.
 * 8. Salin URL Aplikasi Web yang dihasilkan dan tempel di Aplikasi Buku Induk.
 * =======================================================================
 */

const FOLDER_MEDIA_NAME = "Buku Induk - Media & Foto";

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'pull';
    if (action === 'test') {
      return createJsonResponse({
        success: true,
        message: "Koneksi Google Apps Script Web App berhasil aktif!",
        timestamp: new Date().toISOString()
      });
    }

    const data = readAllDataFromSpreadsheet();
    return createJsonResponse({
      success: true,
      message: "Data berhasil ditarik dari Google Sheets",
      data: data
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: "Error saat membaca data: " + err.toString()
    });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Tidak ada data POST yang diterima.");
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'push';

    if (action === 'pull') {
      const data = readAllDataFromSpreadsheet();
      return createJsonResponse({
        success: true,
        message: "Data berhasil ditarik dari Google Sheets",
        data: data
      });
    }

    // Aksi PUSH: Simpan foto ke Google Drive & simpan data ke Spreadsheet
    const driveFolder = getOrCreateDriveFolder();
    let uploadedPhotosCount = 0;

    // 1. Simpan Foto Siswa ke Google Drive jika bertipe data:image
    if (payload.students && Array.isArray(payload.students)) {
      payload.students.forEach(function(student, idx) {
        if (student.fotoUrl && student.fotoUrl.indexOf('data:image/') === 0) {
          student.fotoUrl = saveBase64ImageToDrive(driveFolder, student.fotoUrl, "foto_" + (student.nisn || student.id || idx));
          uploadedPhotosCount++;
        }
        if (student.fotoMasukUrl && student.fotoMasukUrl.indexOf('data:image/') === 0) {
          student.fotoMasukUrl = saveBase64ImageToDrive(driveFolder, student.fotoMasukUrl, "masuk_" + (student.nisn || student.id || idx));
          uploadedPhotosCount++;
        }
        if (student.fotoKeluarUrl && student.fotoKeluarUrl.indexOf('data:image/') === 0) {
          student.fotoKeluarUrl = saveBase64ImageToDrive(driveFolder, student.fotoKeluarUrl, "keluar_" + (student.nisn || student.id || idx));
          uploadedPhotosCount++;
        }
      });
    }

    // 2. Simpan Logo Sekolah ke Google Drive jika bertipe data:image
    if (payload.school && payload.school.logoUrl && payload.school.logoUrl.indexOf('data:image/') === 0) {
      payload.school.logoUrl = saveBase64ImageToDrive(driveFolder, payload.school.logoUrl, "logo_sekolah_" + (payload.school.npsn || 'utama'));
      uploadedPhotosCount++;
    }

    // 3. Tulis seluruh data ke Tab Spreadsheet
    writeAllDataToSpreadsheet(payload);

    return createJsonResponse({
      success: true,
      message: "Sinkronisasi berhasil! Data tersimpan di Google Sheets dan Drive.",
      data: {
        school: payload.school,
        teachers: payload.teachers,
        students: payload.students,
        perkembangan: payload.perkembangan,
        nilaiList: payload.nilaiList,
        kelulusanMutasi: payload.kelulusanMutasi
      },
      stats: {
        uploadedPhotosCount: uploadedPhotosCount,
        studentsCount: (payload.students || []).length,
        teachersCount: (payload.teachers || []).length
      }
    });
  } catch (err) {
    return createJsonResponse({
      success: false,
      message: "Gagal menyimpan ke Google Sheets: " + err.toString()
    });
  }
}

/**
 * Mencari atau membuat folder Google Drive untuk foto & media
 */
function getOrCreateDriveFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_MEDIA_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(FOLDER_MEDIA_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

/**
 * Menyimpan gambar base64 ke Google Drive dan mengembalikan direct CDN URL
 */
function saveBase64ImageToDrive(folder, base64Data, baseName) {
  try {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0].replace('data:', '') || 'image/jpeg';
    const decoded = Utilities.base64Decode(parts[1]);
    const ext = contentType.indexOf('png') >= 0 ? '.png' : '.jpg';
    const filename = baseName + "_" + new Date().getTime() + ext;
    
    const blob = Utilities.newBlob(decoded, contentType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Direct CDN URL yang cepat dan permanen
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (e) {
    Logger.log("Error simpan foto: " + e.toString());
    return base64Data; // Fallback jika gagal
  }
}

/**
 * Menulis data ke 4 Tab Google Spreadsheet
 */
function writeAllDataToSpreadsheet(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Tab 1: PROFIL_SEKOLAH
  if (payload.school) {
    const sheetProfil = getOrCreateSheet(ss, "PROFIL_SEKOLAH");
    sheetProfil.clearContents();
    sheetProfil.appendRow([
      "Nama Sekolah", "NPSN", "NSS", "Akreditasi", "Alamat", "Desa/Kelurahan",
      "Kecamatan", "Kabupaten/Kota", "Provinsi", "Kode Pos", "Telepon", "Email",
      "Website", "Kepala Sekolah", "NIP Kepala Sekolah", "Tanggal Rapor", "Logo URL"
    ]);
    const s = payload.school;
    sheetProfil.appendRow([
      s.namaSekolah || "", s.npsn || "", s.nss || "", s.akreditasi || "", s.alamat || "",
      s.desaKelurahan || "", s.kecamatan || "", s.kabupatenKota || "", s.provinsi || "",
      s.kodePos || "", s.telepon || "", s.email || "", s.website || "",
      s.namaKepalaSekolah || "", s.nipKepalaSekolah || "", s.tanggalRapor || "", s.logoUrl || ""
    ]);
    formatHeaderRow(sheetProfil, 17);
  }

  // Tab 2: DATA_GURU_STAF
  if (payload.teachers && Array.isArray(payload.teachers)) {
    const sheetGuru = getOrCreateSheet(ss, "DATA_GURU_STAF");
    sheetGuru.clearContents();
    sheetGuru.appendRow([
      "ID", "Username", "Nama Lengkap", "Gelar", "NIP", "Peran (Role)", "PIN",
      "Mata Pelajaran", "Kelas Binaan", "Status Aktif", "Bisa Edit Biodata",
      "Bisa Edit Nilai", "Bisa Hapus Siswa", "Bisa Sinkron", "Dibuat Pada"
    ]);
    payload.teachers.forEach(function(t) {
      sheetGuru.appendRow([
        t.id || "", t.username || "", t.fullName || "", t.gelar || "", t.nip || "",
        t.role || "guru_mapel", t.pin || "123456", t.mataPelajaran || "",
        t.assignedClass || "", t.isActive ? "Aktif" : "Nonaktif",
        t.canEditBiodata ? "Ya" : "Tidak", t.canEditGrades ? "Ya" : "Tidak",
        t.canDeleteStudent ? "Ya" : "Tidak", t.canSyncSheets ? "Ya" : "Tidak",
        t.createdAt || ""
      ]);
    });
    formatHeaderRow(sheetGuru, 15);
  }

  // Tab 3: SISWA_INDUK
  if (payload.students && Array.isArray(payload.students)) {
    const sheetSiswa = getOrCreateSheet(ss, "SISWA_INDUK");
    sheetSiswa.clearContents();
    sheetSiswa.appendRow([
      "ID", "NIS", "NISN", "NIK", "Nama Lengkap", "Nama Panggilan", "L/P",
      "Tempat Lahir", "Tanggal Lahir", "Agama", "Kelas", "Status Siswa",
      "Foto Profil URL", "Foto Masuk URL", "Foto Keluar URL",
      "Alamat Jalan", "RT", "RW", "Kelurahan", "Kecamatan", "Kab/Kota", "Provinsi", "No HP",
      "Nama Ayah", "NIK Ayah", "Pekerjaan Ayah", "Nama Ibu", "NIK Ibu", "Pekerjaan Ibu",
      "Asal Sekolah", "Tanggal Masuk", "Status Masuk", "Payload JSON Cadangan"
    ]);

    payload.students.forEach(function(st) {
      const alm = st.alamat || {};
      const ortu = st.orangTua || {};
      const ayah = ortu.ayah || {};
      const ibu = ortu.ibu || {};
      const rwt = st.riwayatPendidikan || {};

      sheetSiswa.appendRow([
        st.id || "", st.nis || "", st.nisn || "", st.nik || "", st.namaLengkap || "",
        st.namaPanggilan || "", st.jenisKelamin || "", st.tempatLahir || "",
        st.tanggalLahir || "", st.agama || "", st.kelasSekarang || "", st.statusSiswa || "Aktif",
        st.fotoUrl || "", st.fotoMasukUrl || "", st.fotoKeluarUrl || "",
        alm.jalan || "", alm.rt || "", alm.rw || "", alm.kelurahan || "", alm.kecamatan || "",
        alm.kabupatenKota || "", alm.provinsi || "", alm.noHpSiswa || "",
        ayah.nama || "", ayah.nik || "", ayah.pekerjaan || "",
        ibu.nama || "", ibu.nik || "", ibu.pekerjaan || "",
        rwt.asalSekolah || "", rwt.tanggalDiterima || "", rwt.statusMasuk || "Siswa Baru",
        JSON.stringify(st)
      ]);
    });
    formatHeaderRow(sheetSiswa, 33);
  }

  // Tab 4: NILAI_SEMESTER
  if (payload.nilaiList && Array.isArray(payload.nilaiList)) {
    const sheetNilai = getOrCreateSheet(ss, "NILAI_SEMESTER");
    sheetNilai.clearContents();
    sheetNilai.appendRow([
      "ID", "Student ID", "Semester", "Kelas", "Tahun Ajaran", "Status Kenaikan",
      "Catatan Wali Kelas", "Rincian Nilai Mapel (JSON)", "Rincian Ekskul (JSON)"
    ]);

    payload.nilaiList.forEach(function(n) {
      sheetNilai.appendRow([
        n.id || "", n.studentId || "", n.semester || 1, n.kelas || "", n.tahunAjaran || "",
        n.statusKenaikan || "Sedang Berjalan", n.catatanWaliKelas || "",
        JSON.stringify(n.mataPelajaran || []),
        JSON.stringify(n.ekstrakurikuler || [])
      ]);
    });
    formatHeaderRow(sheetNilai, 9);
  }
}

/**
 * Membaca data dari 4 tab Spreadsheet
 */
function readAllDataFromSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {
    school: null,
    teachers: [],
    students: [],
    nilaiList: [],
    perkembangan: [],
    kelulusanMutasi: []
  };

  // Baca Profil Sekolah
  const sheetProfil = ss.getSheetByName("PROFIL_SEKOLAH");
  if (sheetProfil && sheetProfil.getLastRow() >= 2) {
    const pRow = sheetProfil.getRange(2, 1, 1, 17).getValues()[0];
    result.school = {
      namaSekolah: pRow[0] || "",
      npsn: String(pRow[1] || ""),
      nss: String(pRow[2] || ""),
      akreditasi: pRow[3] || "",
      alamat: pRow[4] || "",
      desaKelurahan: pRow[5] || "",
      kecamatan: pRow[6] || "",
      kabupatenKota: pRow[7] || "",
      provinsi: pRow[8] || "",
      kodePos: String(pRow[9] || ""),
      telepon: String(pRow[10] || ""),
      email: pRow[11] || "",
      website: pRow[12] || "",
      namaKepalaSekolah: pRow[13] || "",
      nipKepalaSekolah: String(pRow[14] || ""),
      tanggalRapor: pRow[15] || "",
      logoUrl: pRow[16] || ""
    };
  }

  // Baca Guru & Staf
  const sheetGuru = ss.getSheetByName("DATA_GURU_STAF");
  if (sheetGuru && sheetGuru.getLastRow() >= 2) {
    const gRows = sheetGuru.getRange(2, 1, sheetGuru.getLastRow() - 1, 15).getValues();
    result.teachers = gRows.map(function(r, idx) {
      return {
        id: r[0] || ("tch-" + idx),
        username: r[1] || ("guru" + idx),
        fullName: r[2] || "",
        gelar: r[3] || "",
        nip: String(r[4] || ""),
        role: r[5] || "guru_mapel",
        pin: String(r[6] || "123456"),
        mataPelajaran: r[7] || "",
        assignedClass: r[8] || "",
        isActive: r[9] === "Aktif",
        canEditBiodata: r[10] === "Ya",
        canEditGrades: r[11] === "Ya",
        canDeleteStudent: r[12] === "Ya",
        canSyncSheets: r[13] === "Ya",
        createdAt: r[14] || ""
      };
    });
  }

  // Baca Siswa
  const sheetSiswa = ss.getSheetByName("SISWA_INDUK");
  if (sheetSiswa && sheetSiswa.getLastRow() >= 2) {
    const sRows = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 33).getValues();
    result.students = sRows.map(function(r) {
      // Coba parse payload JSON jika ada
      if (r[32] && typeof r[32] === 'string' && r[32].indexOf('{') === 0) {
        try {
          const parsed = JSON.parse(r[32]);
          // Pastikan URL foto terupdate jika kolom spreadsheet terisi link drive baru
          if (r[12]) parsed.fotoUrl = r[12];
          if (r[13]) parsed.fotoMasukUrl = r[13];
          if (r[14]) parsed.fotoKeluarUrl = r[14];
          return parsed;
        } catch (e) {}
      }
      return {
        id: r[0],
        nis: String(r[1] || ""),
        nisn: String(r[2] || ""),
        nik: String(r[3] || ""),
        namaLengkap: r[4] || "",
        namaPanggilan: r[5] || "",
        jenisKelamin: r[6] || "L",
        tempatLahir: r[7] || "",
        tanggalLahir: r[8] || "",
        agama: r[9] || "Islam",
        kewarganegaraan: "WNI",
        anakKe: 1,
        jumlahSaudara: 0,
        statusAnak: "Kandung",
        bahasaSehariHari: "Bahasa Indonesia",
        kelasSekarang: r[10] || "X-A",
        statusSiswa: r[11] || "Aktif",
        fotoUrl: r[12] || "",
        fotoMasukUrl: r[13] || "",
        fotoKeluarUrl: r[14] || "",
        alamat: {
          jalan: r[15] || "",
          rt: String(r[16] || ""),
          rw: String(r[17] || ""),
          kelurahan: r[18] || "",
          kecamatan: r[19] || "",
          kabupatenKota: r[20] || "",
          provinsi: r[21] || "",
          kodePos: "",
          tinggalDengan: "Orang Tua",
          noHpSiswa: String(r[22] || ""),
          emailSiswa: "",
          jarakKeSekolah: "1 km"
        },
        orangTua: {
          ayah: {
            nama: r[23] || "",
            nik: String(r[24] || ""),
            tahunLahir: "",
            pendidikan: "",
            pekerjaan: r[25] || "",
            penghasilan: "",
            noHp: "",
            statusHidup: "Masih Hidup"
          },
          ibu: {
            nama: r[26] || "",
            nik: String(r[27] || ""),
            tahunLahir: "",
            pendidikan: "",
            pekerjaan: r[28] || "",
            penghasilan: "",
            noHp: "",
            statusHidup: "Masih Hidup"
          }
        },
        riwayatPendidikan: {
          asalSekolah: r[29] || "",
          noPesertaUjian: "",
          noIjazahSebelumnya: "",
          tanggalDiterima: r[30] || "",
          masukKelas: r[10] || "X-A",
          statusMasuk: r[31] || "Siswa Baru"
        }
      };
    });
  }

  // Baca Nilai
  const sheetNilai = ss.getSheetByName("NILAI_SEMESTER");
  if (sheetNilai && sheetNilai.getLastRow() >= 2) {
    const nRows = sheetNilai.getRange(2, 1, sheetNilai.getLastRow() - 1, 9).getValues();
    result.nilaiList = nRows.map(function(r) {
      let mapel = [];
      let ekskul = [];
      try { if (r[7]) mapel = JSON.parse(r[7]); } catch (e) {}
      try { if (r[8]) ekskul = JSON.parse(r[8]); } catch (e) {}
      return {
        id: r[0],
        studentId: r[1],
        semester: Number(r[2]) || 1,
        kelas: r[3] || "",
        tahunAjaran: r[4] || "",
        statusKenaikan: r[5] || "Sedang Berjalan",
        catatanWaliKelas: r[6] || "",
        mataPelajaran: mapel,
        ekstrakurikuler: ekskul
      };
    });
  }

  return result;
}

function getOrCreateSheet(ss, sheetName) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function formatHeaderRow(sheet, colCount) {
  const headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setBackground("#1E293B");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  sheet.setFrozenRows(1);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}

/**
 * Uji koneksi ke endpoint Google Apps Script Web App
 */
export async function testAppsScriptWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Webhook tidak valid. Pastikan diawali https://script.google.com/macros/s/...');
  }

  try {
    const url = webhookUrl.includes('?') ? `${webhookUrl}&action=test` : `${webhookUrl}?action=test`;
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Koneksi HTTP gagal (${response.status}: ${response.statusText})`);
    }

    const data = await response.json();
    return {
      success: data.success ?? true,
      message: data.message || 'Koneksi ke Google Apps Script berhasil!',
    };
  } catch (err: any) {
    // Jika CORS mode error saat testing direct GET, informasikan cara setting Web App "Anyone"
    if (err.name === 'TypeError' && err.message?.includes('Failed to fetch')) {
      throw new Error('Gagal menghubungi Web App. Pastikan saat Deploy disetel "Siapa saja / Anyone" dan URL berakhiran /exec');
    }
    throw err;
  }
}

/**
 * Mengirim seluruh data & foto ke Google Apps Script (Push Sync)
 */
export async function pushToAppsScript(
  webhookUrl: string,
  payload: {
    school: SchoolProfile;
    teachers: TeacherUser[];
    students: Student[];
    perkembangan: PerkembanganSiswa[];
    nilaiList: NilaiSemester[];
    kelulusanMutasi: SelesaiStudiMutasi[];
  }
): Promise<AppsScriptSyncResult> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Webhook tidak valid. Pastikan format diawali https://script.google.com/macros/s/...');
  }

  const cleanUrl = webhookUrl.endsWith('/exec') ? webhookUrl : webhookUrl.replace(/\/+$/, '') + '/exec';

  try {
    const bodyContent = JSON.stringify({
      action: 'push',
      ...payload,
    });

    // Gunakan text/plain agar browser tidak memicu CORS preflight OPTIONS yang sering gagal di Apps Script
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: bodyContent,
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.error('Error pushToAppsScript:', err);
    throw new Error(err.message || 'Gagal mengirim data ke Google Apps Script.');
  }
}

/**
 * Menarik data dari Google Apps Script (Pull Sync)
 */
export async function pullFromAppsScript(webhookUrl: string): Promise<AppsScriptSyncResult> {
  if (!webhookUrl || !webhookUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Webhook tidak valid. Pastikan format diawali https://script.google.com/macros/s/...');
  }

  const cleanUrl = webhookUrl.endsWith('/exec') ? webhookUrl : webhookUrl.replace(/\/+$/, '') + '/exec';
  const url = `${cleanUrl}?action=pull`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (err: any) {
    console.error('Error pullFromAppsScript:', err);
    throw new Error(err.message || 'Gagal menarik data dari Google Apps Script.');
  }
}
