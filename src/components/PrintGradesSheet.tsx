import React, { useRef, useState } from 'react';
import { Student, NilaiSemester, SchoolProfile, PerkembanganSiswa } from '../types';
import { Printer, ArrowLeft, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { downloadElementAsPdf } from '../services/pdfExport';

interface PrintGradesSheetProps {
  student: Student;
  nilaiSemester: NilaiSemester;
  school: SchoolProfile;
  perkembangan?: PerkembanganSiswa;
  onBack: () => void;
}

export const PrintGradesSheet: React.FC<PrintGradesSheetProps> = ({
  student,
  nilaiSemester,
  school,
  perkembangan,
  onBack,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!sheetRef.current) return;
    try {
      setIsDownloadingPdf(true);
      setDownloadSuccess(false);
      const fileName = `Rapor_Semester_${nilaiSemester.semester}_${student.nisn || student.nis}_${student.namaLengkap}`;
      await downloadElementAsPdf(sheetRef.current, {
        fileName,
        onProgress: (msg) => setPdfProgress(msg),
      });
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err: any) {
      console.error('Gagal mengunduh PDF rapor:', err);
      alert('Gagal menghasilkan file PDF rapor: ' + (err?.message || 'Terjadi kesalahan'));
    } finally {
      setIsDownloadingPdf(false);
      setPdfProgress('');
    }
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const raporDateFormatted = school.tanggalRapor
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(school.tanggalRapor))
    : todayFormatted;

  const matchingKarakter = perkembangan?.karakter.find(
    k => k.semester === nilaiSemester.semester
  );

  const kelompokA = nilaiSemester.mataPelajaran.filter(m => m.kelompok === 'Kelompok A (Umum)');
  const kelompokB = nilaiSemester.mataPelajaran.filter(m => m.kelompok === 'Kelompok B (Umum)');
  const kelompokC = nilaiSemester.mataPelajaran.filter(m => m.kelompok === 'Kelompok C (Peminatan / Mulok)');

  // Calculate totals and averages
  const totalPengetahuan = nilaiSemester.mataPelajaran.reduce((acc, m) => acc + m.nilaiPengetahuan, 0);
  const avgPengetahuan = (totalPengetahuan / (nilaiSemester.mataPelajaran.length || 1)).toFixed(1);

  const totalKeterampilan = nilaiSemester.mataPelajaran.reduce((acc, m) => acc + m.nilaiKeterampilan, 0);
  const avgKeterampilan = (totalKeterampilan / (nilaiSemester.mataPelajaran.length || 1)).toFixed(1);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      {/* Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-md flex flex-wrap items-center justify-between gap-4 no-print sticky top-4 z-50">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="text-xs text-slate-600 hidden md:block">
          Cetak Rapor: <span className="font-bold text-slate-900">{student.namaLengkap}</span> (Semester {nilaiSemester.semester})
        </div>

        <div className="flex items-center gap-2.5">
          {/* Tombol Unduh File PDF Langsung */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all shadow-xs ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-800 text-white hover:bg-emerald-900 disabled:bg-emerald-700/70'
            }`}
            title="Unduh rapor langsung dalam format file PDF A4 resmi"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{pdfProgress || 'Memproses PDF...'}</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>PDF Rapor Berhasil Diunduh!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh File PDF</span>
              </>
            )}
          </button>

          {/* Tombol Cetak Fisik / Print Browser */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors shadow-xs"
            title="Buka dialog cetak browser (Ctrl+P)"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Cetak (Printer)</span>
          </button>
        </div>
      </div>

      {/* Official Printable Grade Sheet Container (Contains discrete .pdf-page sections) */}
      <div 
        ref={sheetRef}
        id="grades-printable-sheet"
        className="max-w-4xl mx-auto space-y-8 print:space-y-0"
      >
        {/* ==============================================================
            HALAMAN 1: IDENTITAS SISWA & TABEL CAPAIAN KOMPETENSI MAPEL
            ============================================================== */}
        <div className="pdf-page bg-white p-8 sm:p-10 shadow-lg print:shadow-none text-slate-900 text-xs leading-normal">
          {/* Kop Surat Sekolah */}
          <div className="border-b-4 border-double border-slate-900 pb-3 mb-5">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 shrink-0">
                <img
                  src={school.logoUrl || '/src/assets/images/school_crest_emblem_1792639264888.jpg'}
                  alt="Logo Sekolah"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-center flex-1 pr-4">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                  Pemerintah Provinsi {school.provinsi}
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                  Dinas Pendidikan
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-serif py-0.5">
                  {school.namaSekolah}
                </h1>
                <div className="text-[10px] text-slate-600">
                  {school.alamat}, Kec. {school.kecamatan}, {school.kabupatenKota} {school.kodePos}
                </div>
                <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                  NPSN: {school.npsn} · NSS: {school.nss} · Terakreditasi: {school.akreditasi}
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-5">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline underline-offset-4 font-serif">
              LAPORAN CAPAIAN KOMPETENSI PESERTA DIDIK
            </h2>
            <div className="text-xs font-semibold text-slate-700 mt-1 uppercase">
              SEMESTER {nilaiSemester.semester % 2 === 1 ? 'GANJIL' : 'GENAP'} (SEMESTER {nilaiSemester.semester})
            </div>
          </div>

          {/* Student Metadata Box */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 p-3.5 border border-slate-300 rounded-md bg-slate-50/50 mb-5 text-xs">
            <div className="flex">
              <span className="w-32 text-slate-600">Nama Peserta Didik</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900 uppercase">{student.namaLengkap}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Kelas / Fase</span>
              <span className="w-3">:</span>
              <span className="font-bold text-slate-900">{nilaiSemester.kelas}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Nomor Induk / NISN</span>
              <span className="w-3">:</span>
              <span className="font-mono text-slate-900">{student.nis} / {student.nisn}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-600">Tahun Pelajaran</span>
              <span className="w-3">:</span>
              <span className="font-mono text-slate-900">{nilaiSemester.tahunAjaran}</span>
            </div>
          </div>

          {/* Table of Grades */}
          <div className="mb-4">
            <table className="w-full border-collapse border border-slate-400 text-xs text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[11px] font-bold text-center border-b border-slate-400">
                  <th rowSpan={2} className="border border-slate-400 py-1.5 px-1.5 w-8">No</th>
                  <th rowSpan={2} className="border border-slate-400 py-1.5 px-3 text-left">Mata Pelajaran</th>
                  <th rowSpan={2} className="border border-slate-400 py-1.5 px-1 w-12">KKM</th>
                  <th colSpan={2} className="border border-slate-400 py-1 px-1">Pengetahuan</th>
                  <th colSpan={2} className="border border-slate-400 py-1 px-1">Keterampilan</th>
                  <th rowSpan={2} className="border border-slate-400 py-1.5 px-3 text-left">Capaian Kompetensi</th>
                </tr>
                <tr className="bg-slate-100 text-slate-800 text-[10px] font-bold text-center border-b border-slate-400">
                  <th className="border border-slate-400 py-1 px-1 w-14">Nilai</th>
                  <th className="border border-slate-400 py-1 px-1 w-10">Pred</th>
                  <th className="border border-slate-400 py-1 px-1 w-14">Nilai</th>
                  <th className="border border-slate-400 py-1 px-1 w-10">Pred</th>
                </tr>
              </thead>
              <tbody>
                {/* Kelompok A */}
                <tr className="bg-slate-50 font-bold border-y border-slate-400 text-[11px]">
                  <td colSpan={8} className="py-1 px-2 text-slate-900">Kelompok A (Umum / Muatan Nasional)</td>
                </tr>
                {kelompokA.map((mp, idx) => (
                  <tr key={mp.kode} className="border-b border-slate-300">
                    <td className="border-x border-slate-300 py-1 px-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border-x border-slate-300 py-1 px-3 font-medium">{mp.nama}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-mono">{mp.kkm}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-mono font-semibold">{mp.nilaiPengetahuan}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-bold">{mp.predikatPengetahuan}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-mono font-semibold">{mp.nilaiKeterampilan}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-bold">{mp.predikatKeterampilan}</td>
                    <td className="border-x border-slate-300 py-1 px-3 text-[11px] leading-tight text-slate-700">{mp.deskripsiCapaian || '-'}</td>
                  </tr>
                ))}

                {/* Kelompok B */}
                <tr className="bg-slate-50 font-bold border-y border-slate-400 text-[11px]">
                  <td colSpan={8} className="py-1 px-2 text-slate-900">Kelompok B (Umum / Muatan Kewilayahan)</td>
                </tr>
                {kelompokB.map((mp, idx) => (
                  <tr key={mp.kode} className="border-b border-slate-300">
                    <td className="border-x border-slate-300 py-1 px-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border-x border-slate-300 py-1 px-3 font-medium">{mp.nama}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-mono">{mp.kkm}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-mono font-semibold">{mp.nilaiPengetahuan}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-bold">{mp.predikatPengetahuan}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-mono font-semibold">{mp.nilaiKeterampilan}</td>
                    <td className="border-x border-slate-300 py-1 px-1 text-center font-bold">{mp.predikatKeterampilan}</td>
                    <td className="border-x border-slate-300 py-1 px-3 text-[11px] leading-tight text-slate-700">{mp.deskripsiCapaian || '-'}</td>
                  </tr>
                ))}

                {/* Kelompok C */}
                {kelompokC.length > 0 && (
                  <>
                    <tr className="bg-slate-50 font-bold border-y border-slate-400 text-[11px]">
                      <td colSpan={8} className="py-1 px-2 text-slate-900">Kelompok C (Peminatan & Muatan Lokal)</td>
                    </tr>
                    {kelompokC.map((mp, idx) => (
                      <tr key={mp.kode} className="border-b border-slate-300">
                        <td className="border-x border-slate-300 py-1 px-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border-x border-slate-300 py-1 px-3 font-medium">{mp.nama}</td>
                        <td className="border-x border-slate-300 py-1 px-1 text-center font-mono">{mp.kkm}</td>
                        <td className="border-x border-slate-300 py-1 px-1 text-center font-mono font-semibold">{mp.nilaiPengetahuan}</td>
                        <td className="border-x border-slate-300 py-1 px-1 text-center font-bold">{mp.predikatPengetahuan}</td>
                        <td className="border-x border-slate-300 py-1 px-1 text-center font-mono font-semibold">{mp.nilaiKeterampilan}</td>
                        <td className="border-x border-slate-300 py-1 px-1 text-center font-bold">{mp.predikatKeterampilan}</td>
                        <td className="border-x border-slate-300 py-1 px-3 text-[11px] leading-tight text-slate-700">{mp.deskripsiCapaian || '-'}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Rata-rata Footer */}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={3} className="py-1.5 px-3 text-right">Rata-rata Nilai Semester :</td>
                  <td className="py-1.5 px-1 text-center font-mono text-slate-900">{avgPengetahuan}</td>
                  <td className="py-1.5 px-1 text-center">-</td>
                  <td className="py-1.5 px-1 text-center font-mono text-slate-900">{avgKeterampilan}</td>
                  <td className="py-1.5 px-1 text-center">-</td>
                  <td className="py-1.5 px-3 text-[11px] text-slate-600">Total Mapel: {nilaiSemester.mataPelajaran.length}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page 1 Footer */}
          <div className="mt-8 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <span>Laporan Capaian Kompetensi — {school.namaSekolah}</span>
            <span className="font-semibold text-slate-700">Halaman 1 dari 2</span>
          </div>
        </div>

        {/* =========================================================================
            HALAMAN 2: EKSTRAKURIKULER, PRESENSI, CATATAN WALI & 3 PENGESAHAN
            ========================================================================= */}
        <div className="pdf-page bg-white p-8 sm:p-10 shadow-lg print:shadow-none text-slate-900 text-xs leading-normal">
          {/* Header Lembar Lanjutan Halaman 2 */}
          <div className="border-b-2 border-slate-800 pb-2 mb-6 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                LAPORAN CAPAIAN KOMPETENSI PESERTA DIDIK (LEMBAR LANJUTAN)
              </div>
              <div className="text-sm font-black text-slate-900 font-serif">
                {school.namaSekolah} — SEMESTER {nilaiSemester.semester % 2 === 1 ? 'GANJIL' : 'GENAP'} ({nilaiSemester.tahunAjaran})
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-700">
              <div>Nama: <span className="font-bold text-slate-900 uppercase">{student.namaLengkap}</span></div>
              <div className="font-mono">NIS: {student.nis} / NISN: {student.nisn} | Kelas: {nilaiSemester.kelas}</div>
            </div>
          </div>

          {/* Ekstrakurikuler & Kehadiran side-by-side */}
          <div className="grid grid-cols-2 gap-5 mb-6">
            {/* Ekstrakurikuler */}
            <div className="border border-slate-300 rounded-md p-3.5 bg-slate-50/30">
              <h3 className="font-bold text-[11px] uppercase border-b border-slate-300 pb-1.5 mb-2.5 text-slate-900">
                Kegiatan Ekstrakurikuler
              </h3>
              {nilaiSemester.ekstrakurikuler.length === 0 ? (
                <p className="text-slate-400 italic text-[11px] py-4 text-center">Tidak ada kegiatan yang diikuti.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-200">
                      <th className="py-1 text-left">Nama Kegiatan</th>
                      <th className="py-1 text-center w-24">Predikat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nilaiSemester.ekstrakurikuler.map((ek, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        <td className="py-1.5 font-medium">{ek.nama}</td>
                        <td className="py-1.5 text-center font-semibold text-slate-900">{ek.predikat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Ketidakhadiran */}
            <div className="border border-slate-300 rounded-md p-3.5 bg-slate-50/30">
              <h3 className="font-bold text-[11px] uppercase border-b border-slate-300 pb-1.5 mb-2.5 text-slate-900">
                Ketidakhadiran (Presensi)
              </h3>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700">Sakit</td>
                    <td className="py-1.5 w-4">:</td>
                    <td className="py-1.5 font-mono font-medium">{matchingKarakter?.kehadiran?.sakit ?? 0} hari</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700">Izin</td>
                    <td className="py-1.5 w-4">:</td>
                    <td className="py-1.5 font-mono font-medium">{matchingKarakter?.kehadiran?.izin ?? 0} hari</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-700">Tanpa Keterangan (Alpa)</td>
                    <td className="py-1.5 w-4">:</td>
                    <td className="py-1.5 font-mono font-medium">{matchingKarakter?.kehadiran?.alpa ?? 0} hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan & Keputusan Wali Kelas */}
          <div className="border border-slate-300 rounded-md p-4 mb-8 bg-slate-50/40">
            <div className="font-bold text-[11px] uppercase mb-1.5 text-slate-900">Catatan Wali Kelas:</div>
            <div className="italic text-slate-800 text-xs pl-3 border-l-2 border-emerald-600 py-1">
              &quot;{nilaiSemester.catatanWaliKelas || 'Tingkatkan terus semangat belajar, pertahankan prestasi akademik dan kembangkan bakat serta karakter diri.'}&quot;
            </div>
            {nilaiSemester.statusKenaikan && nilaiSemester.statusKenaikan !== 'Sedang Berjalan' && (
              <div className="mt-3.5 pt-2.5 border-t border-slate-200 font-bold text-slate-900 text-xs">
                Keputusan: Dinyatakan <span className="uppercase underline text-emerald-800">{nilaiSemester.statusKenaikan}</span>
              </div>
            )}
          </div>

          {/* 3 Kolom Tanda Tangan Pengesahan */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs pt-4">
            <div>
              <div>Mengetahui,</div>
              <div className="font-medium text-slate-800">Orang Tua / Wali Siswa,</div>
              <div className="h-24 flex items-end justify-center">
                <div className="border-b border-slate-800 w-36 pb-1">
                  {student.orangTua.ayah.nama || '( ........................................ )'}
                </div>
              </div>
            </div>

            <div>
              <div>{school.kabupatenKota}, {raporDateFormatted}</div>
              <div className="font-medium text-slate-800">Wali Kelas,</div>
              <div className="h-24 flex items-end justify-center">
                <div className="border-b border-slate-800 w-36 pb-1 font-bold">
                  Dra. Hj. Nurjanah, M.Pd.
                </div>
              </div>
              <div className="font-mono text-[10px] text-slate-600 mt-1">NIP. 19750812 200501 2 003</div>
            </div>

            <div>
              <div>Mengetahui,</div>
              <div className="font-medium text-slate-800">Kepala Sekolah,</div>
              <div className="h-24 flex items-end justify-center">
                <div className="border-b border-slate-800 w-44 pb-1 font-bold">
                  {school.namaKepalaSekolah}
                </div>
              </div>
              <div className="font-mono text-[10px] text-slate-600 mt-1">NIP. {school.nipKepalaSekolah}</div>
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="mt-12 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <span>Laporan Capaian Kompetensi — {school.namaSekolah}</span>
            <span className="font-semibold text-slate-700">Halaman 2 dari 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};
