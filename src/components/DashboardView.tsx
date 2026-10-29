import React from 'react';
import { Student, PerkembanganSiswa, NilaiSemester, SchoolProfile, SyncState } from '../types';
import { Plus, Printer, Award, FileSpreadsheet, ArrowRight, UserCheck, Upload } from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  perkembangan: PerkembanganSiswa[];
  nilaiList: NilaiSemester[];
  school: SchoolProfile;
  syncState: SyncState;
  onNavigateTab: (tab: 'dashboard' | 'students' | 'grades' | 'print' | 'sheets') => void;
  onOpenAddModal: () => void;
  onOpenUploadModal: () => void;
  onSelectStudentDetail: (studentId: string) => void;
  onOpenPrintMasterBook: (studentId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  perkembangan,
  nilaiList,
  school,
  syncState,
  onNavigateTab,
  onOpenAddModal,
  onOpenUploadModal,
  onSelectStudentDetail,
  onOpenPrintMasterBook,
}) => {
  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.statusSiswa === 'Aktif').length;
  const graduatedStudents = students.filter(s => s.statusSiswa === 'Lulus').length;
  const transferStudents = students.filter(s => s.statusSiswa === 'Mutasi Keluar').length;
  
  // Aggregate all achievements
  const allPrestasi = perkembangan.flatMap(p => {
    const student = students.find(s => s.id === p.studentId);
    return p.prestasi.map(pr => ({
      ...pr,
      studentName: student?.namaLengkap || 'Siswa',
      studentNisn: student?.nisn || '',
      studentId: p.studentId,
    }));
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome & Institutional Identity */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>{school.namaSekolah}</span>
              <span aria-hidden="true">·</span>
              <span>NPSN {school.npsn}</span>
              <span aria-hidden="true">·</span>
              <span>Akreditasi {school.akreditasi}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
              Sistem Buku Induk Sekolah Terintegrasi
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Pencatatan resmi data riwayat siswa, data perkembangan fisik dan karakter, catatan mutasi/kelulusan, serta rekapitulasi nilai rapor semester yang tersinkronisasi dengan Google Sheets.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Siswa (CSV)</span>
            </button>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors shadow-xs whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa</span>
            </button>
            <button
              onClick={() => onNavigateTab('print')}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Pusat Cetak</span>
            </button>
          </div>
        </div>

        {/* Database Sync Information Strip */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Basis Data:</span>
            {syncState.webhookConnected ? (
              <span className="font-medium text-emerald-800">
                Terhubung Cloud Apps Script (Multi-Perangkat & Google Drive Aktif)
              </span>
            ) : syncState.isConnected ? (
              <span className="font-medium text-emerald-800">
                Terhubung dengan Google Sheets ({syncState.spreadsheetTitle || 'Buku Induk Spreadsheet'})
              </span>
            ) : (
              <span className="font-medium text-slate-600">
                Penyimpanan Lokal Aktif (Dapat disinkronkan ke Cloud kapan saja)
              </span>
            )}
          </div>
          <button
            onClick={() => onNavigateTab('sheets')}
            className="text-emerald-800 font-semibold hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Pengaturan Sinkronisasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4-Column Metric Strip (Anti-slop, clean single-elevation) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Total Registrasi Buku Induk</div>
          <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">{totalStudents}</div>
          <div className="text-xs text-slate-500 mt-2">Seluruh angkatan & arsip</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Siswa Aktif Belajar</div>
          <div className="text-3xl font-bold text-emerald-800 font-mono tabular-nums">{activeStudents}</div>
          <div className="text-xs text-slate-500 mt-2">Tercatat aktif di kelas</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Siswa Lulus / Tamat</div>
          <div className="text-3xl font-bold text-blue-800 font-mono tabular-nums">{graduatedStudents}</div>
          <div className="text-xs text-slate-500 mt-2">Memiliki ijazah & arsip studi</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Mutasi / Pindah</div>
          <div className="text-3xl font-bold text-amber-700 font-mono tabular-nums">{transferStudents}</div>
          <div className="text-xs text-slate-500 mt-2">Disertai surat pindah resmi</div>
        </div>
      </div>

      {/* Two Column Layout: Student Directory Preview + Achievements Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recent Master Book Records */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Arsip Buku Induk Terbaru</h2>
              <p className="text-xs text-slate-500">Daftar siswa terbaru yang tercatat dalam register sekolah</p>
            </div>
            <button
              onClick={() => onNavigateTab('students')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 inline-flex items-center gap-1"
            >
              <span>Lihat Semua Siswa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {students.slice(0, 5).map((student, idx) => (
              <div 
                key={`${student.id}-${idx}`} 
                className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img 
                      src={student.fotoUrl || '/src/assets/images/student_portrait_male_1792639263730.jpg'} 
                      alt={student.namaLengkap} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {student.namaLengkap}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      <span>NISN {student.nisn}</span>
                      <span aria-hidden="true">·</span>
                      <span>NIS {student.nis}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-sans font-medium text-slate-600">{student.kelasSekarang}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-sm ${
                    student.statusSiswa === 'Aktif' 
                      ? 'bg-emerald-50 text-emerald-800' 
                      : student.statusSiswa === 'Lulus'
                      ? 'bg-blue-50 text-blue-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}>
                    {student.statusSiswa}
                  </span>
                  <button
                    onClick={() => onSelectStudentDetail(student.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Lihat Detail Buku Induk"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenPrintMasterBook(student.id)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    title="Cetak Lembar Buku Induk"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Column: Prestasi & Perkembangan Unggulan */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Prestasi Terkini</h2>
              <p className="text-xs text-slate-500">Catatan perkembangan & kejuaraan</p>
            </div>
            <Award className="w-5 h-5 text-amber-600" />
          </div>

          {allPrestasi.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Belum ada catatan prestasi yang diinput.</p>
          ) : (
            <div className="space-y-3.5">
              {allPrestasi.slice(0, 4).map((pr) => (
                <div key={pr.id} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg">
                  <div className="text-xs font-semibold text-slate-900 line-clamp-1">{pr.namaLomba}</div>
                  <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                    {pr.peringkat} · Tingkat {pr.tingkat} ({pr.tahun})
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                    <span>{pr.studentName}</span>
                    <button
                      onClick={() => onSelectStudentDetail(pr.studentId)}
                      className="text-slate-700 hover:text-emerald-800 font-medium"
                    >
                      Buka Profil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('grades')}
              className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Buka Pengelolaan Nilai Semester ({nilaiList.length} Rapor)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
