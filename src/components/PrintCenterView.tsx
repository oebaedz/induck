import React, { useState } from 'react';
import { Student, NilaiSemester, SchoolProfile } from '../types';
import { Printer, FileText, Award, UserCheck, ArrowRight, Download } from 'lucide-react';

interface PrintCenterViewProps {
  students: Student[];
  nilaiList: NilaiSemester[];
  school: SchoolProfile;
  onOpenPrintMasterBook: (studentId: string) => void;
  onOpenPrintGrades: (studentId: string, semester: number) => void;
}

export const PrintCenterView: React.FC<PrintCenterViewProps> = ({
  students,
  nilaiList,
  onOpenPrintMasterBook,
  onOpenPrintGrades,
}) => {
  const [selectedStudentForBook, setSelectedStudentForBook] = useState<string>(students[0]?.id || '');
  const [selectedStudentForGrades, setSelectedStudentForGrades] = useState<string>(students[0]?.id || '');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  const studentForBook = students.find(s => s.id === selectedStudentForBook);
  const studentForGrades = students.find(s => s.id === selectedStudentForGrades);
  const gradesForSelected = nilaiList.find(
    n => n.studentId === selectedStudentForGrades && n.semester === selectedSemester
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          Pusat Cetak Dokumen Resmi Sekolah
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Cetak langsung ke printer atau ekspor file PDF berkualitas tinggi sesuai standar resmi kementerian
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Cetak Lembar Buku Induk Siswa */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100">
              <FileText className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">1. Cetak Lembar Buku Induk per Siswa</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dokumen komprehensif memuat biodata lengkap, riwayat masuk, data orang tua/wali, rekam kesehatan jasmani, prestasi, dan catatan mutasi/kelulusan. Dilengkapi foto siswa dan legalisasi kepala sekolah.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Pilih Siswa yang Akan Dicetak</label>
              <select
                value={selectedStudentForBook}
                onChange={(e) => setSelectedStudentForBook(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-medium"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.namaLengkap} - Kelas {s.kelasSekarang} (NISN: {s.nisn})
                  </option>
                ))}
              </select>

              {studentForBook && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                    <img
                      src={studentForBook.fotoUrl || '/src/assets/images/student_portrait_male_1792639263730.jpg'}
                      alt={studentForBook.namaLengkap}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold text-slate-900">{studentForBook.namaLengkap}</div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      NIS: {studentForBook.nis} · Status: {studentForBook.statusSiswa}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => studentForBook && onOpenPrintMasterBook(studentForBook.id)}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Buka Lembar Buku Induk & Unduh PDF / Cetak</span>
          </button>
        </div>

        {/* Card 2: Cetak Nilai Rapor per Semester */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center border border-blue-100">
              <Award className="w-5 h-5" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">2. Cetak & Unduh Nilai Rapor per Semester</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Transkrip capaian kompetensi semester memuat nilai pengetahuan, keterampilan, predikat, KKM, ekstrakurikuler, presensi, catatan wali kelas, dan 3 kolom pengesahan resmi.
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Siswa</label>
                  <select
                    value={selectedStudentForGrades}
                    onChange={(e) => setSelectedStudentForGrades(e.target.value)}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-medium"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.namaLengkap} ({s.kelasSekarang})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Semester</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6].map(sem => (
                      <option key={sem} value={sem}>
                        Semester {sem} {sem % 2 === 1 ? '(Ganjil)' : '(Genap)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {studentForGrades && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Siswa Terpilih:</span>
                    <span className="font-semibold text-slate-900">{studentForGrades.namaLengkap}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Data Nilai:</span>
                    <span className={gradesForSelected ? 'font-semibold text-emerald-800' : 'text-slate-500'}>
                      {gradesForSelected 
                        ? `${gradesForSelected.mataPelajaran.length} Mata Pelajaran Siap Dicetak` 
                        : 'Belum diinput (template standar akan digunakan)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => studentForGrades && onOpenPrintGrades(studentForGrades.id, selectedSemester)}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Buka Lembar Rapor & Unduh PDF / Cetak (Semester {selectedSemester})</span>
          </button>
        </div>
      </div>

      {/* Quick Print Table of All Students */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Aksi Cetak Cepat Seluruh Siswa</h2>
        <div className="divide-y divide-slate-100">
          {students.map(s => (
            <div key={s.id} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <img
                    src={s.fotoUrl || '/src/assets/images/student_portrait_male_1792639263730.jpg'}
                    alt={s.namaLengkap}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-xs">{s.namaLengkap}</div>
                  <div className="text-[11px] text-slate-500 font-mono">NISN: {s.nisn} · Kelas {s.kelasSekarang}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenPrintMasterBook(s.id)}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Cetak Buku Induk</span>
                </button>
                <button
                  onClick={() => onOpenPrintGrades(s.id, 1)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Cetak Nilai</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
