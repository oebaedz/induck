import React, { useState, useEffect, useRef } from 'react';
import { Student } from '../types';
import { X, Save, UserPlus, Upload, Image, Trash2, Check, Loader2, Cloud } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';
import { isOnlineUrl } from '../services/googleDrive';

interface StudentFormModalProps {
  isOpen: boolean;
  studentToEdit?: Student | null;
  onClose: () => void;
  onSave: (student: Student) => void;
}

export const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  studentToEdit,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Student>({
    id: '',
    nis: '',
    nisn: '',
    nik: '',
    namaLengkap: '',
    namaPanggilan: '',
    jenisKelamin: 'L',
    tempatLahir: '',
    tanggalLahir: '2007-01-01',
    agama: 'Islam',
    kewarganegaraan: 'WNI',
    anakKe: 1,
    jumlahSaudara: 0,
    statusAnak: 'Kandung',
    bahasaSehariHari: 'Bahasa Indonesia',
    kelasSekarang: 'X MIPA 1',
    statusSiswa: 'Aktif',
    fotoUrl: '/src/assets/images/student_portrait_male_1792639263730.jpg',
    fotoMasukUrl: '/src/assets/images/student_portrait_male_1792639263730.jpg',
    fotoKeluarUrl: '',
    alamat: {
      jalan: '',
      rt: '01',
      rw: '01',
      kelurahan: '',
      kecamatan: '',
      kabupatenKota: '',
      provinsi: '',
      kodePos: '',
      tinggalDengan: 'Orang Tua',
      noHpSiswa: '',
      emailSiswa: '',
      jarakKeSekolah: '1 km',
    },
    orangTua: {
      ayah: {
        nama: '',
        nik: '',
        tahunLahir: '1975',
        pendidikan: 'S1',
        pekerjaan: '',
        penghasilan: 'Rp 5.000.000 - Rp 10.000.000',
        noHp: '',
        statusHidup: 'Masih Hidup',
      },
      ibu: {
        nama: '',
        nik: '',
        tahunLahir: '1978',
        pendidikan: 'S1',
        pekerjaan: '',
        penghasilan: 'Rp 5.000.000 - Rp 10.000.000',
        noHp: '',
        statusHidup: 'Masih Hidup',
      },
    },
    riwayatPendidikan: {
      asalSekolah: '',
      noPesertaUjian: '',
      noIjazahSebelumnya: '',
      tanggalDiterima: new Date().toISOString().split('T')[0],
      masukKelas: 'X MIPA 1',
      statusMasuk: 'Siswa Baru',
    },
  });

  const fileInputMasukRef = useRef<HTMLInputElement>(null);
  const fileInputKeluarRef = useRef<HTMLInputElement>(null);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState<boolean>(false);

  useEffect(() => {
    if (studentToEdit) {
      setFormData({
        ...studentToEdit,
        fotoMasukUrl: studentToEdit.fotoMasukUrl || studentToEdit.fotoUrl || '',
        fotoKeluarUrl: studentToEdit.fotoKeluarUrl || '',
      });
    } else {
      const generatedId = `std-${Date.now().toString().slice(-5)}`;
      const randomNis = `2425${Math.floor(1000 + Math.random() * 9000)}`;
      const randomNisn = `008${Math.floor(1000000 + Math.random() * 9000000)}`;
      const defaultMasuk = '/src/assets/images/student_portrait_male_1792639263730.jpg';

      setFormData({
        id: generatedId,
        nis: randomNis,
        nisn: randomNisn,
        nik: `3174${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        namaLengkap: '',
        namaPanggilan: '',
        jenisKelamin: 'L',
        tempatLahir: 'Jakarta',
        tanggalLahir: '2008-05-10',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        anakKe: 1,
        jumlahSaudara: 1,
        statusAnak: 'Kandung',
        bahasaSehariHari: 'Bahasa Indonesia',
        kelasSekarang: 'X MIPA 1',
        statusSiswa: 'Aktif',
        fotoUrl: defaultMasuk,
        fotoMasukUrl: defaultMasuk,
        fotoKeluarUrl: '',
        alamat: {
          jalan: 'Jl. Merdeka No. 10',
          rt: '002',
          rw: '004',
          kelurahan: 'Kebayoran Baru',
          kecamatan: 'Kebayoran Baru',
          kabupatenKota: 'Jakarta Selatan',
          provinsi: 'DKI Jakarta',
          kodePos: '12130',
          tinggalDengan: 'Orang Tua',
          noHpSiswa: '081298765432',
          emailSiswa: '',
          jarakKeSekolah: '1.5 km',
        },
        orangTua: {
          ayah: {
            nama: '',
            nik: '',
            tahunLahir: '1975',
            pendidikan: 'S1',
            pekerjaan: 'Karyawan Swasta',
            penghasilan: 'Rp 5.000.000 - Rp 10.000.000',
            noHp: '081234567890',
            statusHidup: 'Masih Hidup',
          },
          ibu: {
            nama: '',
            nik: '',
            tahunLahir: '1978',
            pendidikan: 'S1',
            pekerjaan: 'Ibu Rumah Tangga',
            penghasilan: 'Tidak Berpenghasilan',
            noHp: '081234567891',
            statusHidup: 'Masih Hidup',
          },
        },
        riwayatPendidikan: {
          asalSekolah: 'SMP Negeri 1 Jakarta',
          noPesertaUjian: '',
          noIjazahSebelumnya: '',
          tanggalDiterima: new Date().toISOString().split('T')[0],
          masukKelas: 'X MIPA 1',
          statusMasuk: 'Siswa Baru',
        },
      });
    }
  }, [studentToEdit, isOpen]);

  if (!isOpen) return null;

  // Handle local file uploads with automatic resizing and cloud Google Drive sync
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'fotoMasukUrl' | 'fotoKeluarUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingPhoto(true);
      // Automatically resize to 3x4 pas foto standard (360x480 max) and compress as JPEG
      const compressedBase64 = await compressImageFile(file, 360, 480, 0.78);
      
      let finalUrl = compressedBase64;
      // If Google token is active, directly store online to Google Drive
      try {
        const { getAccessToken } = await import('../services/googleAuth');
        const token = await getAccessToken();
        if (token) {
          const { uploadPhotoToGoogleDrive, getOrCreateDriveFolder } = await import('../services/googleDrive');
          const folderId = await getOrCreateDriveFolder(token);
          const studentTag = formData.nisn || formData.nis || formData.id || 'siswa';
          const { directUrl } = await uploadPhotoToGoogleDrive(
            token,
            compressedBase64,
            `${field}_${studentTag}_${Date.now()}`,
            folderId
          );
          finalUrl = directUrl;
        }
      } catch (cloudErr) {
        console.warn('Google Drive direct upload skipped, retaining local compressed copy:', cloudErr);
      }

      setFormData(prev => ({
        ...prev,
        [field]: finalUrl,
        ...(field === 'fotoMasukUrl' ? { fotoUrl: finalUrl } : {}),
      }));
    } catch (err: any) {
      console.error('Gagal mengompresi foto:', err);
      alert('Gagal memproses gambar: ' + (err?.message || 'Format tidak didukung'));
    } finally {
      setIsCompressingPhoto(false);
      // Reset input element so re-selecting the same file triggers change
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaLengkap.trim()) {
      alert('Nama lengkap siswa wajib diisi');
      return;
    }
    // Ensure primary fotoUrl matches fotoMasukUrl or fotoKeluarUrl
    const updated = {
      ...formData,
      fotoUrl: formData.fotoMasukUrl || formData.fotoKeluarUrl || formData.fotoUrl,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold">
              {studentToEdit ? 'Ubah Data Siswa Buku Induk' : 'Tambah Siswa Baru ke Buku Induk'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* SECTION FOTO: FOTO MASUK DAN FOTO KELUAR */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2.5">
              <div>
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-700" />
                  <span>Pas Foto Siswa Buku Induk (Ukuran 3x4)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Arsip resmi memuat foto siswa saat baru diterima (masuk) dan foto saat tamat belajar/keluar
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Slot 1: Foto Waktu Diterima (Masuk) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs text-emerald-800">
                    A. Foto Saat Masuk / Diterima
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Pas Foto 3x4</span>
                </div>

                <div className="flex gap-4 items-start">
                  {/* Photo Preview Box (3x4 aspect ratio) */}
                  <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-slate-300 bg-slate-100 shrink-0 relative group">
                    {formData.fotoMasukUrl ? (
                      <img
                        src={formData.fotoMasukUrl}
                        alt="Foto Masuk"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-2 text-[10px]">
                        <span>Belum ada foto masuk</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <input
                        ref={fileInputMasukRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'fotoMasukUrl')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputMasukRef.current?.click()}
                        className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Foto dari Komputer</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Atau Pilih Contoh Pas Foto:</label>
                      <select
                        value={formData.fotoMasukUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData({ ...formData, fotoMasukUrl: val, fotoUrl: val });
                        }}
                        className="w-full p-1.5 border border-slate-200 rounded-lg bg-white text-[11px]"
                      >
                        <option value="/src/assets/images/student_portrait_male_1792639263730.jpg">Siswa Laki-laki (Seragam Putih)</option>
                        <option value="/src/assets/images/student_portrait_female_1792639265920.jpg">Siswi Berhijab (Seragam Putih)</option>
                      </select>
                    </div>

                    {formData.fotoMasukUrl && (
                      <div className="pt-0.5">
                        {isOnlineUrl(formData.fotoMasukUrl) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
                            <Cloud className="w-3 h-3 text-emerald-600" />
                            Tersimpan Online (Google Drive)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                            Tersimpan Lokal (Diunggah ke Drive saat sync)
                          </span>
                        )}
                      </div>
                    )}

                    {formData.fotoMasukUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, fotoMasukUrl: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-medium pt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Foto Masuk</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Slot 2: Foto Waktu Meninggalkan Sekolah (Keluar / Lulus) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs text-blue-800">
                    B. Foto Saat Keluar / Tamat Belajar
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Pas Foto 3x4</span>
                </div>

                <div className="flex gap-4 items-start">
                  {/* Photo Preview Box (3x4 aspect ratio) */}
                  <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-slate-300 bg-slate-100 shrink-0 relative group">
                    {formData.fotoKeluarUrl ? (
                      <img
                        src={formData.fotoKeluarUrl}
                        alt="Foto Keluar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-center p-2 text-[10px]">
                        <span>Belum diunggah (biasanya saat lulus/mutasi)</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div>
                      <input
                        ref={fileInputKeluarRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageFileUpload(e, 'fotoKeluarUrl')}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputKeluarRef.current?.click()}
                        className="w-full py-2 px-3 text-xs font-semibold text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Pilih Foto dari Komputer</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 mb-0.5">Atau Pilih Contoh Pas Foto Tamat:</label>
                      <select
                        value={formData.fotoKeluarUrl || ''}
                        onChange={(e) => setFormData({ ...formData, fotoKeluarUrl: e.target.value })}
                        className="w-full p-1.5 border border-slate-200 rounded-lg bg-white text-[11px]"
                      >
                        <option value="">-- Belum ada / Kosongkan --</option>
                        <option value="/src/assets/images/student_grad_male_1792829508541.jpg">Siswa Laki-laki (Jas Formal Kelulusan)</option>
                        <option value="/src/assets/images/student_grad_female_1792829508677.jpg">Siswi Berhijab (Blazer Formal Kelulusan)</option>
                      </select>
                    </div>

                    {formData.fotoKeluarUrl && (
                      <div className="pt-0.5">
                        {isOnlineUrl(formData.fotoKeluarUrl) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 font-medium">
                            <Cloud className="w-3 h-3 text-emerald-600" />
                            Tersimpan Online (Google Drive)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                            Tersimpan Lokal (Diunggah ke Drive saat sync)
                          </span>
                        )}
                      </div>
                    )}

                    {formData.fotoKeluarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, fotoKeluarUrl: '' })}
                        className="text-[11px] text-red-600 hover:text-red-700 flex items-center gap-1 font-medium pt-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Foto Keluar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: IDENTITAS UTAMA SISWA */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              1. Identitas Pribadi Siswa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.namaLengkap}
                  onChange={e => setFormData({ ...formData, namaLengkap: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Nama Panggilan</label>
                <input
                  type="text"
                  value={formData.namaPanggilan}
                  onChange={e => setFormData({ ...formData, namaPanggilan: e.target.value })}
                  placeholder="Contoh: Rizky"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Jenis Kelamin</label>
                <select
                  value={formData.jenisKelamin}
                  onChange={e => {
                    const jk = e.target.value as 'L' | 'P';
                    const defaultMasuk = jk === 'P'
                      ? '/src/assets/images/student_portrait_female_1792639265920.jpg'
                      : '/src/assets/images/student_portrait_male_1792639263730.jpg';
                    const defaultKeluar = jk === 'P'
                      ? '/src/assets/images/student_grad_female_1792829508677.jpg'
                      : '/src/assets/images/student_grad_male_1792829508541.jpg';

                    setFormData({
                      ...formData,
                      jenisKelamin: jk,
                      fotoUrl: defaultMasuk,
                      fotoMasukUrl: defaultMasuk,
                      fotoKeluarUrl: formData.statusSiswa === 'Lulus' ? defaultKeluar : formData.fotoKeluarUrl,
                    });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">NIS (Nomor Induk)</label>
                <input
                  type="text"
                  required
                  value={formData.nis}
                  onChange={e => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">NISN</label>
                <input
                  type="text"
                  required
                  value={formData.nisn}
                  onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">NIK Siswa</label>
                <input
                  type="text"
                  value={formData.nik}
                  onChange={e => setFormData({ ...formData, nik: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Tempat Lahir</label>
                <input
                  type="text"
                  value={formData.tempatLahir}
                  onChange={e => setFormData({ ...formData, tempatLahir: e.target.value })}
                  placeholder="Kota kelahiran"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Tanggal Lahir</label>
                <input
                  type="date"
                  value={formData.tanggalLahir}
                  onChange={e => setFormData({ ...formData, tanggalLahir: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Agama</label>
                <select
                  value={formData.agama}
                  onChange={e => setFormData({ ...formData, agama: e.target.value as Student['agama'] })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Kelas Sekarang</label>
                <input
                  type="text"
                  value={formData.kelasSekarang}
                  onChange={e => setFormData({ ...formData, kelasSekarang: e.target.value })}
                  placeholder="Contoh: X MIPA 1"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Status Siswa</label>
                <select
                  value={formData.statusSiswa}
                  onChange={e => {
                    const st = e.target.value as Student['statusSiswa'];
                    let keluar = formData.fotoKeluarUrl;
                    if (st === 'Lulus' && !keluar) {
                      keluar = formData.jenisKelamin === 'P'
                        ? '/src/assets/images/student_grad_female_1792829508677.jpg'
                        : '/src/assets/images/student_grad_male_1792829508541.jpg';
                    }
                    setFormData({ ...formData, statusSiswa: st, fotoKeluarUrl: keluar });
                  }}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Lulus">Lulus / Tamat</option>
                  <option value="Mutasi Keluar">Mutasi Keluar</option>
                  <option value="Drop Out">Drop Out</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Anak Ke-</label>
                <input
                  type="number"
                  min={1}
                  value={formData.anakKe}
                  onChange={e => setFormData({ ...formData, anakKe: Number(e.target.value) || 1 })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ALAMAT & TEMPAT TINGGAL */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              2. Keterangan Tempat Tinggal & Kontak
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 mb-1 font-medium">Jalan / Alamat Rumah</label>
                <input
                  type="text"
                  value={formData.alamat.jalan}
                  onChange={e => setFormData({
                    ...formData,
                    alamat: { ...formData.alamat, jalan: e.target.value }
                  })}
                  placeholder="Contoh: Jl. Panglima Polim No. 12"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">RT / RW</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.alamat.rt}
                    onChange={e => setFormData({
                      ...formData,
                      alamat: { ...formData.alamat, rt: e.target.value }
                    })}
                    placeholder="RT"
                    className="w-1/2 p-2 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                  <input
                    type="text"
                    value={formData.alamat.rw}
                    onChange={e => setFormData({
                      ...formData,
                      alamat: { ...formData.alamat, rw: e.target.value }
                    })}
                    placeholder="RW"
                    className="w-1/2 p-2 border border-slate-200 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Kelurahan</label>
                <input
                  type="text"
                  value={formData.alamat.kelurahan}
                  onChange={e => setFormData({
                    ...formData,
                    alamat: { ...formData.alamat, kelurahan: e.target.value }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Kecamatan</label>
                <input
                  type="text"
                  value={formData.alamat.kecamatan}
                  onChange={e => setFormData({
                    ...formData,
                    alamat: { ...formData.alamat, kecamatan: e.target.value }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Kabupaten / Kota</label>
                <input
                  type="text"
                  value={formData.alamat.kabupatenKota}
                  onChange={e => setFormData({
                    ...formData,
                    alamat: { ...formData.alamat, kabupatenKota: e.target.value }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">No. HP Siswa</label>
                <input
                  type="text"
                  value={formData.alamat.noHpSiswa}
                  onChange={e => setFormData({
                    ...formData,
                    alamat: { ...formData.alamat, noHpSiswa: e.target.value }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Tinggal Bersama</label>
                <select
                  value={formData.alamat.tinggalDengan}
                  onChange={e => setFormData({
                    ...formData,
                    alamat: { ...formData.alamat, tinggalDengan: e.target.value as Student['alamat']['tinggalDengan'] }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Orang Tua">Orang Tua</option>
                  <option value="Wali">Wali</option>
                  <option value="Kost">Kost</option>
                  <option value="Asrama">Asrama</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: DATA ORANG TUA */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              3. Keterangan Orang Tua Kandung
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ayah */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs">Ayah Kandung</h4>
                <div>
                  <label className="block text-slate-500 mb-1">Nama Ayah</label>
                  <input
                    type="text"
                    value={formData.orangTua.ayah.nama}
                    onChange={e => setFormData({
                      ...formData,
                      orangTua: {
                        ...formData.orangTua,
                        ayah: { ...formData.orangTua.ayah, nama: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Pekerjaan Ayah</label>
                  <input
                    type="text"
                    value={formData.orangTua.ayah.pekerjaan}
                    onChange={e => setFormData({
                      ...formData,
                      orangTua: {
                        ...formData.orangTua,
                        ayah: { ...formData.orangTua.ayah, pekerjaan: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">No HP Ayah</label>
                  <input
                    type="text"
                    value={formData.orangTua.ayah.noHp}
                    onChange={e => setFormData({
                      ...formData,
                      orangTua: {
                        ...formData.orangTua,
                        ayah: { ...formData.orangTua.ayah, noHp: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Ibu */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs">Ibu Kandung</h4>
                <div>
                  <label className="block text-slate-500 mb-1">Nama Ibu</label>
                  <input
                    type="text"
                    value={formData.orangTua.ibu.nama}
                    onChange={e => setFormData({
                      ...formData,
                      orangTua: {
                        ...formData.orangTua,
                        ibu: { ...formData.orangTua.ibu, nama: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Pekerjaan Ibu</label>
                  <input
                    type="text"
                    value={formData.orangTua.ibu.pekerjaan}
                    onChange={e => setFormData({
                      ...formData,
                      orangTua: {
                        ...formData.orangTua,
                        ibu: { ...formData.orangTua.ibu, pekerjaan: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">No HP Ibu</label>
                  <input
                    type="text"
                    value={formData.orangTua.ibu.noHp}
                    onChange={e => setFormData({
                      ...formData,
                      orangTua: {
                        ...formData.orangTua,
                        ibu: { ...formData.orangTua.ibu, noHp: e.target.value }
                      }
                    })}
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: SEKOLAH ASAL & PENERIMAAN */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              4. Riwayat Masuk Sekolah
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Asal Sekolah Sebelumnya</label>
                <input
                  type="text"
                  value={formData.riwayatPendidikan.asalSekolah}
                  onChange={e => setFormData({
                    ...formData,
                    riwayatPendidikan: { ...formData.riwayatPendidikan, asalSekolah: e.target.value }
                  })}
                  placeholder="Contoh: SMP Negeri 1 Jakarta"
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Tanggal Diterima</label>
                <input
                  type="date"
                  value={formData.riwayatPendidikan.tanggalDiterima}
                  onChange={e => setFormData({
                    ...formData,
                    riwayatPendidikan: { ...formData.riwayatPendidikan, tanggalDiterima: e.target.value }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Status Masuk</label>
                <select
                  value={formData.riwayatPendidikan.statusMasuk}
                  onChange={e => setFormData({
                    ...formData,
                    riwayatPendidikan: {
                      ...formData.riwayatPendidikan,
                      statusMasuk: e.target.value as Student['riwayatPendidikan']['statusMasuk']
                    }
                  })}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="Siswa Baru">Siswa Baru</option>
                  <option value="Pindahan">Pindahan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan ke Buku Induk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
