import React, { useState } from 'react';
import { Student, PerkembanganSiswa, NilaiSemester, SelesaiStudiMutasi } from '../types';
import { X, Printer, Edit2, Award, HeartPulse, GraduationCap, FileText, CheckCircle2 } from 'lucide-react';

interface StudentDetailModalProps {
  student: Student | null;
  perkembangan?: PerkembanganSiswa;
  nilaiList: NilaiSemester[];
  kelulusanMutasi?: SelesaiStudiMutasi;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
  onPrintMasterBook: (studentId: string) => void;
  onPrintGrades: (studentId: string, semester: number) => void;
  onNavigateToGradesInput: (studentId: string, semester: number) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  perkembangan,
  nilaiList,
  kelulusanMutasi,
  isOpen,
  onClose,
  onEdit,
  onPrintMasterBook,
  onPrintGrades,
  onNavigateToGradesInput,
}) => {
  const [activeTab, setActiveTab] = useState<'biodata' | 'perkembangan' | 'nilai' | 'kelulusan'>('biodata');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);

  if (!isOpen || !student) return null;

  const currentNilaiSemester = nilaiList.find(n => n.semester === selectedSemester);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header / Student Identity banner */}
        <div className="bg-slate-900 text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-3 shrink-0">
              {/* Foto Masuk */}
              <div className="text-center">
                <div className="w-16 h-20 sm:w-18 sm:h-24 rounded-lg overflow-hidden bg-slate-800 border-2 border-emerald-400/40 shrink-0 shadow-sm relative">
                  <img
                    src={student.fotoMasukUrl || student.fotoUrl || '/src/assets/images/student_portrait_male_1792639263730.jpg'}
                    alt="Foto Masuk"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-[10px] text-emerald-300 font-semibold block mt-1">Foto Masuk</span>
              </div>

              {/* Foto Keluar */}
              <div className="text-center">
                <div className="w-16 h-20 sm:w-18 sm:h-24 rounded-lg overflow-hidden bg-slate-800 border-2 border-blue-400/40 shrink-0 shadow-sm relative">
                  {student.fotoKeluarUrl ? (
                    <img
                      src={student.fotoKeluarUrl}
                      alt="Foto Keluar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-1 text-[9px] bg-slate-800/80">
                      <span>Belum tamat/lulus</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-blue-300 font-semibold block mt-1">Foto Keluar</span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm ${
                  student.statusSiswa === 'Aktif' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : student.statusSiswa === 'Lulus'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  Status: {student.statusSiswa}
                </span>
                <span className="text-xs text-slate-400">Kelas {student.kelasSekarang}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white truncate">
                {student.namaLengkap}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-mono tabular-nums">
                <span>NISN: {student.nisn}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>NIS: {student.nis}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>NIK: {student.nik}</span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => onPrintMasterBook(student.id)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg transition-colors shadow-xs"
                title="Buka lembar buku induk resmi untuk dicetak atau diunduh sebagai PDF"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Unduh PDF</span>
              </button>
              <button
                onClick={() => onEdit(student)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Ubah Data</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-6 border-b border-slate-800 -mb-6 pb-2 overflow-x-auto text-xs font-medium">
            <button
              onClick={() => setActiveTab('biodata')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'biodata' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>1. Biodata Siswa & Keluarga</span>
            </button>
            <button
              onClick={() => setActiveTab('perkembangan')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'perkembangan' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HeartPulse className="w-4 h-4" />
              <span>2. Perkembangan & Prestasi</span>
            </button>
            <button
              onClick={() => setActiveTab('nilai')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'nilai' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>3. Nilai Rapor Semester</span>
            </button>
            <button
              onClick={() => setActiveTab('kelulusan')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === 'kelulusan' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>4. Selesai Studi / Mutasi</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700 space-y-6">
          {/* TAB 1: BIODATA */}
          {activeTab === 'biodata' && (
            <div className="space-y-6">
              {/* Keterangan Pribadi */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
                  A. Keterangan Pribadi Siswa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Nama Lengkap</span>
                    <span className="font-semibold text-slate-900">{student.namaLengkap}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Nama Panggilan</span>
                    <span className="font-medium text-slate-900">{student.namaPanggilan}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Jenis Kelamin</span>
                    <span className="font-medium text-slate-900">{student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Tempat, Tanggal Lahir</span>
                    <span className="font-medium text-slate-900">{student.tempatLahir}, {student.tanggalLahir}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Agama</span>
                    <span className="font-medium text-slate-900">{student.agama}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Kewarganegaraan</span>
                    <span className="font-medium text-slate-900">{student.kewarganegaraan}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Anak Ke / Jumlah Saudara</span>
                    <span className="font-medium text-slate-900 font-mono">Anak ke-{student.anakKe} dari {student.jumlahSaudara + 1} bersaudara</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Bahasa Sehari-hari</span>
                    <span className="font-medium text-slate-900">{student.bahasaSehariHari}</span>
                  </div>
                </div>
              </div>

              {/* Tempat Tinggal */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
                  B. Keterangan Tempat Tinggal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  <div className="flex justify-between py-1 border-b border-slate-50 md:col-span-2">
                    <span className="text-slate-500">Alamat Lengkap</span>
                    <span className="font-medium text-slate-900 text-right">{student.alamat.jalan}, RT {student.alamat.rt} / RW {student.alamat.rw}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Kelurahan / Kecamatan</span>
                    <span className="font-medium text-slate-900">{student.alamat.kelurahan}, {student.alamat.kecamatan}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Kabupaten/Kota, Provinsi</span>
                    <span className="font-medium text-slate-900">{student.alamat.kabupatenKota}, {student.alamat.provinsi} ({student.alamat.kodePos})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Tinggal Dengan</span>
                    <span className="font-medium text-slate-900">{student.alamat.tinggalDengan}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">No. Telepon / HP Siswa</span>
                    <span className="font-medium font-mono text-slate-900">{student.alamat.noHpSiswa || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Jarak ke Sekolah</span>
                    <span className="font-medium text-slate-900">{student.alamat.jarakKeSekolah}</span>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
                  C. Keterangan Orang Tua Kandung
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ayah */}
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200/80">
                    <h4 className="font-bold text-slate-900 text-xs text-emerald-800">Data Ayah Kandung</h4>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Lengkap</span>
                        <span className="font-semibold text-slate-900">{student.orangTua.ayah.nama}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">NIK Ayah</span>
                        <span className="font-mono text-slate-900">{student.orangTua.ayah.nik || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pendidikan</span>
                        <span className="text-slate-900">{student.orangTua.ayah.pendidikan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pekerjaan</span>
                        <span className="font-medium text-slate-900">{student.orangTua.ayah.pekerjaan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Penghasilan</span>
                        <span className="text-slate-900">{student.orangTua.ayah.penghasilan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kontak HP</span>
                        <span className="font-mono text-slate-900">{student.orangTua.ayah.noHp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ibu */}
                  <div className="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200/80">
                    <h4 className="font-bold text-slate-900 text-xs text-emerald-800">Data Ibu Kandung</h4>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nama Lengkap</span>
                        <span className="font-semibold text-slate-900">{student.orangTua.ibu.nama}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">NIK Ibu</span>
                        <span className="font-mono text-slate-900">{student.orangTua.ibu.nik || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pendidikan</span>
                        <span className="text-slate-900">{student.orangTua.ibu.pendidikan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pekerjaan</span>
                        <span className="font-medium text-slate-900">{student.orangTua.ibu.pekerjaan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Penghasilan</span>
                        <span className="text-slate-900">{student.orangTua.ibu.penghasilan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kontak HP</span>
                        <span className="font-mono text-slate-900">{student.orangTua.ibu.noHp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riwayat Pendidikan Masuk */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 mb-4">
                  D. Riwayat Penerimaan Siswa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-slate-500 block">Asal Sekolah Sebelumnya</span>
                    <span className="font-medium text-slate-900">{student.riwayatPendidikan.asalSekolah}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tanggal Diterima</span>
                    <span className="font-medium font-mono text-slate-900">{student.riwayatPendidikan.tanggalDiterima}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Masuk di Kelas</span>
                    <span className="font-semibold text-slate-900">{student.riwayatPendidikan.masukKelas} ({student.riwayatPendidikan.statusMasuk})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERKEMBANGAN & PRESTASI */}
          {activeTab === 'perkembangan' && (
            <div className="space-y-6">
              {/* Rekam Kesehatan Jasmani */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <span>A. Rekam Perkembangan Fisik & Kesehatan</span>
                  <span className="text-xs text-slate-500 font-normal">Tercatat per semester</span>
                </h3>

                {(!perkembangan || perkembangan.kesehatan.length === 0) ? (
                  <p className="text-xs text-slate-400 py-3">Belum ada catatan kesehatan jasmani.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Semester</th>
                          <th className="py-2.5 px-3">Tahun Ajaran</th>
                          <th className="py-2.5 px-3">Tinggi (cm)</th>
                          <th className="py-2.5 px-3">Berat (kg)</th>
                          <th className="py-2.5 px-3">Gol. Darah</th>
                          <th className="py-2.5 px-3">Kelainan Jasmani</th>
                          <th className="py-2.5 px-3">Riwayat Penyakit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                        {perkembangan.kesehatan.map((k, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 font-semibold text-slate-900">Semester {k.semester}</td>
                            <td className="py-2 px-3 text-slate-600">{k.tahunAjaran}</td>
                            <td className="py-2 px-3 text-slate-800">{k.tinggiBadan} cm</td>
                            <td className="py-2 px-3 text-slate-800">{k.beratBadan} kg</td>
                            <td className="py-2 px-3 text-slate-800 font-sans">{k.golonganDarah}</td>
                            <td className="py-2 px-3 font-sans text-slate-600">{k.kelainanFisik || '-'}</td>
                            <td className="py-2 px-3 font-sans text-slate-600">{k.riwayatPenyakit || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Prestasi yang Pernah Diraih */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <span>B. Prestasi Akademik & Non-Akademik</span>
                  <Award className="w-4 h-4 text-amber-600" />
                </h3>

                {(!perkembangan || perkembangan.prestasi.length === 0) ? (
                  <p className="text-xs text-slate-400 py-3">Belum ada data prestasi yang tercatat.</p>
                ) : (
                  <div className="space-y-3">
                    {perkembangan.prestasi.map((pr) => (
                      <div key={pr.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="font-semibold text-slate-900 text-xs">{pr.namaLomba}</div>
                          <div className="text-[11px] text-emerald-800 font-medium">
                            {pr.peringkat} · Tingkat {pr.tingkat} (Tahun {pr.tahun})
                          </div>
                          {pr.keterangan && (
                            <div className="text-[11px] text-slate-500">{pr.keterangan}</div>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 self-start sm:self-auto">
                          Bidang {pr.bidang}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan Kepribadian & Konseling */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  C. Catatan Karakter & Bimbingan Konseling (BK)
                </h3>

                {(!perkembangan || perkembangan.karakter.length === 0) ? (
                  <p className="text-xs text-slate-400 py-3">Belum ada catatan kepribadian.</p>
                ) : (
                  <div className="space-y-3">
                    {perkembangan.karakter.map((c, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                          <span>Semester {c.semester} ({c.tahunAjaran})</span>
                          <span className="text-slate-500 font-mono">
                            Kehadiran: Sakit {c.kehadiran.sakit} hr, Izin {c.kehadiran.izin} hr, Alpa {c.kehadiran.alpa} hr
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px]">
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">Kelakuan</span>
                            <span className="font-semibold text-slate-900">{c.kelakuan}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">Kerajinan</span>
                            <span className="font-semibold text-slate-900">{c.kerajinan}</span>
                          </div>
                          <div className="bg-white p-2 rounded border border-slate-200">
                            <span className="text-slate-400 block text-[10px]">Kerapian</span>
                            <span className="font-semibold text-slate-900">{c.kerapian}</span>
                          </div>
                        </div>
                        {c.catatanBK && (
                          <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200/80 italic">
                            &quot;{c.catatanBK}&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: NILAI RAPOR */}
          {activeTab === 'nilai' && (
            <div className="space-y-6">
              {/* Semester Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 mr-1">Pilih Semester:</span>
                  {[1, 2, 3, 4, 5, 6].map(sem => {
                    const hasData = nilaiList.some(n => n.semester === sem);
                    return (
                      <button
                        key={sem}
                        onClick={() => setSelectedSemester(sem)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                          selectedSemester === sem
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : hasData
                            ? 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-white/50 text-slate-400 border border-dashed border-slate-200 hover:bg-white'
                        }`}
                      >
                        Sem {sem} {hasData && '✓'}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onPrintGrades(student.id, selectedSemester)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Rapor Sem {selectedSemester}</span>
                  </button>
                  <button
                    onClick={() => onNavigateToGradesInput(student.id, selectedSemester)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Kelola Nilai</span>
                  </button>
                </div>
              </div>

              {!currentNilaiSemester ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <p className="text-xs text-slate-500">
                    Belum ada nilai yang diinput untuk Semester {selectedSemester}.
                  </p>
                  <button
                    onClick={() => onNavigateToGradesInput(student.id, selectedSemester)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors"
                  >
                    Input Nilai Semester {selectedSemester} Sekarang
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table header meta */}
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                    <div>Kelas: <span className="font-semibold text-slate-900">{currentNilaiSemester.kelas}</span></div>
                    <div>Tahun Ajaran: <span className="font-semibold text-slate-900">{currentNilaiSemester.tahunAjaran}</span></div>
                    <div>Status Kenaikan: <span className="font-semibold text-emerald-800">{currentNilaiSemester.statusKenaikan || 'Sedang Berjalan'}</span></div>
                  </div>

                  {/* Grades Table */}
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Mata Pelajaran</th>
                          <th className="py-2.5 px-2 text-center">KKM</th>
                          <th className="py-2.5 px-2 text-center">Pengetahuan</th>
                          <th className="py-2.5 px-2 text-center">Predikat</th>
                          <th className="py-2.5 px-2 text-center">Keterampilan</th>
                          <th className="py-2.5 px-2 text-center">Predikat</th>
                          <th className="py-2.5 px-3">Capaian Kompetensi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentNilaiSemester.mataPelajaran.map((mp, idx) => (
                          <tr key={mp.kode} className="hover:bg-slate-50/70">
                            <td className="py-2 px-3 text-slate-400 font-mono tabular-nums">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-slate-900">
                              <div>{mp.nama}</div>
                              <span className="text-[10px] text-slate-400">{mp.kelompok}</span>
                            </td>
                            <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-600">{mp.kkm}</td>
                            <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-slate-900">{mp.nilaiPengetahuan}</td>
                            <td className="py-2 px-2 text-center font-semibold text-emerald-800">{mp.predikatPengetahuan}</td>
                            <td className="py-2 px-2 text-center font-mono tabular-nums font-semibold text-slate-900">{mp.nilaiKeterampilan}</td>
                            <td className="py-2 px-2 text-center font-semibold text-emerald-800">{mp.predikatKeterampilan}</td>
                            <td className="py-2 px-3 text-[11px] text-slate-600 max-w-xs">{mp.deskripsiCapaian || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Ekstrakurikuler & Catatan */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-2">
                      <h4 className="text-xs font-bold text-slate-900">Ekstrakurikuler</h4>
                      {currentNilaiSemester.ekstrakurikuler.length === 0 ? (
                        <p className="text-xs text-slate-400">Tidak ada catatan ekstrakurikuler.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {currentNilaiSemester.ekstrakurikuler.map((ek, idx) => (
                            <div key={idx} className="flex justify-between text-[11px] p-2 bg-slate-50 rounded">
                              <span className="font-medium text-slate-800">{ek.nama}</span>
                              <span className="font-semibold text-emerald-800">{ek.predikat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-2">
                      <h4 className="text-xs font-bold text-slate-900">Catatan Wali Kelas</h4>
                      <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 italic leading-relaxed">
                        &quot;{currentNilaiSemester.catatanWaliKelas || 'Terus tingkatkan semangat belajar dan prestasi.'}&quot;
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: KELULUSAN & MUTASI */}
          {activeTab === 'kelulusan' && (
            <div className="space-y-6">
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  Catatan Akhir Studi & Status Meninggalkan Sekolah
                </h3>

                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 block">Status Terakhir</span>
                    <span className="text-base font-bold text-slate-900">
                      {kelulusanMutasi?.statusAkhir || student.statusSiswa}
                    </span>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                </div>

                {kelulusanMutasi?.statusAkhir === 'Lulus' && kelulusanMutasi.kelulusan && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Arsip Data Kelulusan Resmi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Tanggal Kelulusan / Ijazah</span>
                        <span className="font-semibold text-slate-900 font-mono">{kelulusanMutasi.kelulusan.tanggalLulus}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Nomor Seri Ijazah</span>
                        <span className="font-semibold text-slate-900 font-mono">{kelulusanMutasi.kelulusan.noIjazah}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Nomor SKHUN</span>
                        <span className="font-semibold text-slate-900 font-mono">{kelulusanMutasi.kelulusan.noSkhun || '-'}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Melanjutkan ke Perguruan Tinggi / Kerja</span>
                        <span className="font-semibold text-slate-900">{kelulusanMutasi.kelulusan.melanjutkanKe}</span>
                      </div>
                    </div>
                  </div>
                )}

                {kelulusanMutasi?.statusAkhir === 'Mutasi Keluar' && kelulusanMutasi.mutasi && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Arsip Mutasi Keluar Siswa
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Tanggal Surat Mutasi</span>
                        <span className="font-semibold text-slate-900 font-mono">{kelulusanMutasi.mutasi.tanggalMutasi}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Nomor Surat Rekomendasi Pindah</span>
                        <span className="font-semibold text-slate-900 font-mono">{kelulusanMutasi.mutasi.noSuratPindah}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg md:col-span-2">
                        <span className="text-slate-400 block text-[10px]">Pindah ke Sekolah Tujuan</span>
                        <span className="font-semibold text-slate-900">{kelulusanMutasi.mutasi.pindahKeSekolah}</span>
                      </div>
                      <div className="p-3 bg-white border border-slate-200 rounded-lg md:col-span-2">
                        <span className="text-slate-400 block text-[10px]">Alasan Pindah</span>
                        <span className="text-slate-700">{kelulusanMutasi.mutasi.alasanPindah}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-mono">ID: {student.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
