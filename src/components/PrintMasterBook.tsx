import React from 'react';
import { Student, PerkembanganSiswa, SelesaiStudiMutasi, SchoolProfile } from '../types';
import { Printer, ArrowLeft, Download } from 'lucide-react';

interface PrintMasterBookProps {
  student: Student;
  perkembangan?: PerkembanganSiswa;
  kelulusanMutasi?: SelesaiStudiMutasi;
  school: SchoolProfile;
  onBack: () => void;
}

export const PrintMasterBook: React.FC<PrintMasterBookProps> = ({
  student,
  perkembangan,
  kelulusanMutasi,
  school,
  onBack,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const latestKesehatan = perkembangan?.kesehatan[perkembangan.kesehatan.length - 1];

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6">
      {/* Floating Action Bar (Hidden on print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-md flex items-center justify-between gap-4 no-print sticky top-4 z-50">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <div className="text-xs text-slate-600 hidden sm:block">
          Lembar Buku Induk: <span className="font-bold text-slate-900">{student.namaLengkap}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Dokumen Resmi / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Official Master Book Sheet (Formatted strictly for A4 print) */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 border border-slate-300 shadow-lg print:shadow-none print:border-none print:p-0 print-sheet text-slate-900 text-xs leading-normal">
        {/* Kop Surat Resmi Sekolah */}
        <div className="border-b-4 border-double border-slate-900 pb-3 mb-6">
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
              <div className="text-[10px] text-slate-600">
                Telp: {school.telepon} · Pos-el: {school.email} · Website: {school.website}
              </div>
              <div className="text-[10px] font-semibold text-slate-700 mt-0.5">
                NPSN: {school.npsn} · NSS: {school.nss} · Terakreditasi: {school.akreditasi}
              </div>
            </div>
          </div>
        </div>

        {/* Title & Dual Photo Container */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
          <div className="text-left py-2 flex-1">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline underline-offset-4 font-serif">
              LEMBAR BUKU INDUK SISWA
            </h2>
            <div className="text-[11px] font-mono mt-1.5 font-semibold text-slate-700">
              NOMOR INDUK SISWA (NIS): {student.nis} / NISN: {student.nisn}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Status Siswa: <span className="font-semibold text-slate-900 uppercase">{student.statusSiswa}</span> (Kelas {student.kelasSekarang})
            </div>
          </div>

          {/* Pas Foto Resmi: Foto Masuk & Foto Keluar */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Foto Masuk */}
            <div className="w-20 h-28 border-2 border-slate-800 p-0.5 bg-white text-center flex flex-col justify-between">
              <div className="w-full h-full overflow-hidden bg-slate-100 flex items-center justify-center">
                {student.fotoMasukUrl || student.fotoUrl ? (
                  <img
                    src={student.fotoMasukUrl || student.fotoUrl}
                    alt="Foto Masuk"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[9px] text-slate-400 p-1 text-center">Foto 3x4 Masuk</span>
                )}
              </div>
              <span className="text-[8px] font-bold text-slate-800 uppercase block pt-0.5">Waktu Masuk</span>
            </div>

            {/* Foto Keluar */}
            <div className="w-20 h-28 border-2 border-slate-800 p-0.5 bg-white text-center flex flex-col justify-between">
              <div className="w-full h-full overflow-hidden bg-slate-100 flex items-center justify-center">
                {student.fotoKeluarUrl ? (
                  <img
                    src={student.fotoKeluarUrl}
                    alt="Foto Keluar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[9px] text-slate-400 p-1 text-center">Foto 3x4 Tamat</span>
                )}
              </div>
              <span className="text-[8px] font-bold text-slate-800 uppercase block pt-0.5">Waktu Tamat</span>
            </div>
          </div>
        </div>

        {/* Bagian A: Keterangan Pribadi Siswa */}
        <div className="space-y-4">
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px]">
            A. KETERANGAN TENTANG DIRI SISWA
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-6 py-1 text-slate-500 font-mono">1.</td>
                <td className="w-56 py-1 text-slate-700">Nama Siswa Lengkap</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 font-bold text-slate-900 uppercase">{student.namaLengkap}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">2.</td>
                <td className="py-1 text-slate-700">Nama Panggilan</td>
                <td className="py-1">:</td>
                <td className="py-1 font-medium text-slate-900">{student.namaPanggilan}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">3.</td>
                <td className="py-1 text-slate-700">Jenis Kelamin</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.jenisKelamin === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">4.</td>
                <td className="py-1 text-slate-700">Tempat dan Tanggal Lahir</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900 font-mono">{student.tempatLahir}, {student.tanggalLahir}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">5.</td>
                <td className="py-1 text-slate-700">Agama</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.agama}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">6.</td>
                <td className="py-1 text-slate-700">Kewarganegaraan</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.kewarganegaraan}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">7.</td>
                <td className="py-1 text-slate-700">Nomor Induk Kependudukan (NIK)</td>
                <td className="py-1">:</td>
                <td className="py-1 font-mono text-slate-900">{student.nik}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">8.</td>
                <td className="py-1 text-slate-700">Anak Ke- / Jumlah Saudara</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">Anak ke-{student.anakKe} dari {student.jumlahSaudara + 1} bersaudara ({student.statusAnak})</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">9.</td>
                <td className="py-1 text-slate-700">Bahasa Sehari-hari di Rumah</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.bahasaSehariHari}</td>
              </tr>
            </tbody>
          </table>

          {/* Bagian B: Keterangan Tempat Tinggal */}
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px] mt-4">
            B. KETERANGAN TEMPAT TINGGAL
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-6 py-1 text-slate-500 font-mono">10.</td>
                <td className="w-56 py-1 text-slate-700">Alamat Tempat Tinggal</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 text-slate-900">{student.alamat.jalan}, RT {student.alamat.rt} / RW {student.alamat.rw}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">11.</td>
                <td className="py-1 text-slate-700">Kelurahan / Kecamatan</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.alamat.kelurahan}, Kec. {student.alamat.kecamatan}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">12.</td>
                <td className="py-1 text-slate-700">Kabupaten/Kota & Provinsi</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.alamat.kabupatenKota}, {student.alamat.provinsi} ({student.alamat.kodePos})</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">13.</td>
                <td className="py-1 text-slate-700">Tinggal Bersama</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.alamat.tinggalDengan}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">14.</td>
                <td className="py-1 text-slate-700">No. Telepon / HP Siswa</td>
                <td className="py-1">:</td>
                <td className="py-1 font-mono text-slate-900">{student.alamat.noHpSiswa || '-'}</td>
              </tr>
            </tbody>
          </table>

          {/* Bagian C: Keterangan Jasmani & Kesehatan */}
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px] mt-4">
            C. KETERANGAN JASMANI DAN KESEHATAN
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-6 py-1 text-slate-500 font-mono">15.</td>
                <td className="w-56 py-1 text-slate-700">Tinggi Badan / Berat Badan</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 font-mono text-slate-900">
                  {latestKesehatan?.tinggiBadan || 165} cm / {latestKesehatan?.beratBadan || 55} kg
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">16.</td>
                <td className="py-1 text-slate-700">Golongan Darah</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{latestKesehatan?.golonganDarah || '-'}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">17.</td>
                <td className="py-1 text-slate-700">Penyakit yang Pernah Diderita</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{latestKesehatan?.riwayatPenyakit || 'Tidak ada riwayat penyakit berat'}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">18.</td>
                <td className="py-1 text-slate-700">Kelainan Jasmani</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{latestKesehatan?.kelainanFisik || 'Tidak ada'}</td>
              </tr>
            </tbody>
          </table>

          {/* Bagian D: Keterangan Pendidikan Sebelumnya */}
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px] mt-4">
            D. KETERANGAN PENDIDIKAN SEBELUMNYA & PENERIMAAN
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-6 py-1 text-slate-500 font-mono">19.</td>
                <td className="w-56 py-1 text-slate-700">Diterima dari Sekolah Asal</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 text-slate-900 font-medium">{student.riwayatPendidikan.asalSekolah}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">20.</td>
                <td className="py-1 text-slate-700">Nomor Ijazah Jenjang Sebelumnya</td>
                <td className="py-1">:</td>
                <td className="py-1 font-mono text-slate-900">{student.riwayatPendidikan.noIjazahSebelumnya || '-'}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">21.</td>
                <td className="py-1 text-slate-700">Diterima di Sekolah ini Tanggal</td>
                <td className="py-1">:</td>
                <td className="py-1 font-mono text-slate-900">{student.riwayatPendidikan.tanggalDiterima}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">22.</td>
                <td className="py-1 text-slate-700">Masuk di Kelas / Status</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900 font-medium">{student.riwayatPendidikan.masukKelas} ({student.riwayatPendidikan.statusMasuk})</td>
              </tr>
            </tbody>
          </table>

          {/* Bagian E: Keterangan Orang Tua Kandung */}
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px] mt-4">
            E. KETERANGAN ORANG TUA KANDUNG
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-6 py-1 text-slate-500 font-mono">23.</td>
                <td className="w-56 py-1 text-slate-700">Nama Ayah Kandung</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 font-bold text-slate-900">{student.orangTua.ayah.nama}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">24.</td>
                <td className="py-1 text-slate-700">Pekerjaan / Penghasilan Ayah</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.orangTua.ayah.pekerjaan} ({student.orangTua.ayah.penghasilan})</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">25.</td>
                <td className="py-1 text-slate-700">Nama Ibu Kandung</td>
                <td className="py-1">:</td>
                <td className="py-1 font-bold text-slate-900">{student.orangTua.ibu.nama}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1 text-slate-500 font-mono">26.</td>
                <td className="py-1 text-slate-700">Pekerjaan / Penghasilan Ibu</td>
                <td className="py-1">:</td>
                <td className="py-1 text-slate-900">{student.orangTua.ibu.pekerjaan} ({student.orangTua.ibu.penghasilan})</td>
              </tr>
            </tbody>
          </table>

          {/* Bagian F: Keterangan Prestasi & Karakter */}
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px] mt-4">
            F. CATATAN PRESTASI & PERKEMBANGAN SISWA
          </div>
          <div className="py-1">
            {(!perkembangan || perkembangan.prestasi.length === 0) ? (
              <p className="text-slate-500 italic">Belum ada catatan kejuaraan / prestasi resmi.</p>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-slate-800">
                {perkembangan.prestasi.map(pr => (
                  <li key={pr.id}>
                    <span className="font-semibold">{pr.namaLomba}</span> — {pr.peringkat} Tingkat {pr.tingkat} ({pr.tahun})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Bagian G: Keterangan Meninggalkan Sekolah */}
          <div className="bg-slate-100/80 px-3 py-1 font-bold text-slate-900 border-y border-slate-300 uppercase tracking-wide text-[11px] mt-4">
            G. KETERANGAN MENINGGALKAN SEKOLAH / KELULUSAN
          </div>
          <table className="w-full text-left text-xs">
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="w-6 py-1 text-slate-500 font-mono">27.</td>
                <td className="w-56 py-1 text-slate-700">Status Akhir Siswa</td>
                <td className="w-3 py-1">:</td>
                <td className="py-1 font-bold text-slate-900">{kelulusanMutasi?.statusAkhir || student.statusSiswa}</td>
              </tr>
              {kelulusanMutasi?.kelulusan && (
                <>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-500 font-mono">28.</td>
                    <td className="py-1 text-slate-700">Tanggal Tamat Belajar / Lulus</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-mono text-slate-900">{kelulusanMutasi.kelulusan.tanggalLulus}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-500 font-mono">29.</td>
                    <td className="py-1 text-slate-700">Nomor Seri Ijazah</td>
                    <td className="py-1">:</td>
                    <td className="py-1 font-mono text-slate-900 font-bold">{kelulusanMutasi.kelulusan.noIjazah}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-500 font-mono">30.</td>
                    <td className="py-1 text-slate-700">Melanjutkan Pendidikan Ke</td>
                    <td className="py-1">:</td>
                    <td className="py-1 text-slate-900 font-medium">{kelulusanMutasi.kelulusan.melanjutkanKe}</td>
                  </tr>
                </>
              )}
              {kelulusanMutasi?.mutasi && (
                <>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-500 font-mono">28.</td>
                    <td className="py-1 text-slate-700">Pindah Ke Sekolah</td>
                    <td className="py-1">:</td>
                    <td className="py-1 text-slate-900 font-bold">{kelulusanMutasi.mutasi.pindahKeSekolah}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-slate-500 font-mono">29.</td>
                    <td className="py-1 text-slate-700">Alasan Mutasi</td>
                    <td className="py-1">:</td>
                    <td className="py-1 text-slate-900">{kelulusanMutasi.mutasi.alasanPindah}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Kolom Tanda Tangan Resmi Pengesahan Kepala Sekolah */}
        <div className="mt-12 pt-6 flex justify-end">
          <div className="w-72 text-center text-xs">
            <div>{school.kabupatenKota}, {todayFormatted}</div>
            <div className="font-semibold text-slate-800">Kepala Sekolah,</div>
            
            {/* Space for stamp and signature */}
            <div className="h-24 flex items-center justify-center text-slate-300 font-serif italic text-[11px]">
              (Tanda Tangan & Cap Stempel Resmi)
            </div>

            <div className="font-bold underline text-slate-900 uppercase">
              {school.namaKepalaSekolah}
            </div>
            <div className="font-mono text-slate-600 text-[11px]">
              NIP. {school.nipKepalaSekolah}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
