import React, { useState, useEffect } from 'react';
import { Student, NilaiSemester, MataPelajaranNilai, TeacherUser } from '../types';
import { STANDARD_MAPEL_LIST } from '../data/initialData';
import { Save, Printer, Plus, Trash2, Check, Award, Lock } from 'lucide-react';

interface GradesManagerViewProps {
  students: Student[];
  nilaiList: NilaiSemester[];
  currentUser?: TeacherUser;
  selectedStudentId?: string;
  initialSemester?: number;
  onSaveNilai: (nilai: NilaiSemester) => void;
  onPrintGrades: (studentId: string, semester: number) => void;
}

export const GradesManagerView: React.FC<GradesManagerViewProps> = ({
  students,
  nilaiList,
  currentUser,
  selectedStudentId,
  initialSemester = 1,
  onSaveNilai,
  onPrintGrades,
}) => {
  const [currentStudentId, setCurrentStudentId] = useState<string>(
    selectedStudentId || (students[0]?.id || '')
  );
  const [currentSemester, setCurrentSemester] = useState<number>(initialSemester);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  // Form state
  const [kelas, setKelas] = useState('X MIPA 1');
  const [tahunAjaran, setTahunAjaran] = useState('2023/2024');
  const [statusKenaikan, setStatusKenaikan] = useState<'Naik Kelas' | 'Tinggal Kelas' | 'Lulus' | 'Sedang Berjalan'>('Sedang Berjalan');
  const [catatanWaliKelas, setCatatanWaliKelas] = useState('');
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaranNilai[]>([]);
  const [ekskulList, setEkskulList] = useState<Array<{ nama: string; predikat: 'Sangat Baik' | 'Baik' | 'Cukup'; keterangan: string }>>([]);

  const currentStudent = students.find(s => s.id === currentStudentId);

  // Sync selected student ID if prop changes
  useEffect(() => {
    if (selectedStudentId) {
      setCurrentStudentId(selectedStudentId);
    }
  }, [selectedStudentId]);

  // Load existing grade record or generate defaults
  useEffect(() => {
    if (!currentStudentId) return;

    const existing = nilaiList.find(
      n => n.studentId === currentStudentId && n.semester === currentSemester
    );

    if (existing) {
      setKelas(existing.kelas);
      setTahunAjaran(existing.tahunAjaran);
      setStatusKenaikan(existing.statusKenaikan || 'Sedang Berjalan');
      setCatatanWaliKelas(existing.catatanWaliKelas || '');
      setMataPelajaran(existing.mataPelajaran);
      setEkskulList(existing.ekstrakurikuler || []);
    } else {
      // Create template from standard subjects
      const student = students.find(s => s.id === currentStudentId);
      setKelas(student?.kelasSekarang || 'X MIPA 1');
      setTahunAjaran('2023/2024');
      setStatusKenaikan(currentSemester === 6 ? 'Lulus' : currentSemester % 2 === 0 ? 'Naik Kelas' : 'Sedang Berjalan');
      setCatatanWaliKelas('Pertahankan ketekunan belajar dan terus kembangkan bakat kepemimpinan.');
      
      const defaultMapel: MataPelajaranNilai[] = STANDARD_MAPEL_LIST.map(sm => ({
        kode: sm.kode,
        nama: sm.nama,
        kelompok: sm.kelompok,
        kkm: sm.kkm,
        nilaiPengetahuan: 85,
        predikatPengetahuan: 'B',
        nilaiKeterampilan: 87,
        predikatKeterampilan: 'B',
        deskripsiCapaian: 'Memahami kompetensi dasar dengan baik dan tuntas.',
      }));

      setMataPelajaran(defaultMapel);
      setEkskulList([
        { nama: 'Pramuka Wajib', predikat: 'Sangat Baik', keterangan: 'Aktif mengikuti kegiatan regu penegak.' },
        { nama: 'Klub Akademik / Minat Bakat', predikat: 'Baik', keterangan: 'Menunjukkan partisipasi yang konsisten.' },
      ]);
    }
  }, [currentStudentId, currentSemester, nilaiList, students]);

  const calculatePredikat = (nilai: number): 'A' | 'B' | 'C' | 'D' => {
    if (nilai >= 90) return 'A';
    if (nilai >= 80) return 'B';
    if (nilai >= 70) return 'C';
    return 'D';
  };

  const handleUpdateScore = (
    index: number,
    field: 'nilaiPengetahuan' | 'nilaiKeterampilan' | 'kkm' | 'deskripsiCapaian',
    value: string | number
  ) => {
    setMataPelajaran(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      if (field === 'nilaiPengetahuan') {
        const num = Math.min(100, Math.max(0, Number(value) || 0));
        item.nilaiPengetahuan = num;
        item.predikatPengetahuan = calculatePredikat(num);
      } else if (field === 'nilaiKeterampilan') {
        const num = Math.min(100, Math.max(0, Number(value) || 0));
        item.nilaiKeterampilan = num;
        item.predikatKeterampilan = calculatePredikat(num);
      } else if (field === 'kkm') {
        item.kkm = Number(value) || 75;
      } else if (field === 'deskripsiCapaian') {
        item.deskripsiCapaian = String(value);
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleAddEkskul = () => {
    setEkskulList([
      ...ekskulList,
      { nama: 'Ekstrakurikuler Pilihan', predikat: 'Baik', keterangan: 'Berpartisipasi aktif dalam latihan rutin.' },
    ]);
  };

  const handleRemoveEkskul = (index: number) => {
    setEkskulList(ekskulList.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (!currentStudentId) return;

    const payload: NilaiSemester = {
      id: `nil-${currentStudentId}-${currentSemester}`,
      studentId: currentStudentId,
      semester: currentSemester,
      kelas,
      tahunAjaran,
      statusKenaikan,
      catatanWaliKelas,
      mataPelajaran,
      ekstrakurikuler: ekskulList,
    };

    onSaveNilai(payload);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 3000);
  };

  // Average grades calculation
  const avgPengetahuan = mataPelajaran.length
    ? (mataPelajaran.reduce((acc, m) => acc + m.nilaiPengetahuan, 0) / mataPelajaran.length).toFixed(1)
    : '0';

  const avgKeterampilan = mataPelajaran.length
    ? (mataPelajaran.reduce((acc, m) => acc + m.nilaiKeterampilan, 0) / mataPelajaran.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Kelola & Input Nilai Rapor Semester
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencatatan nilai terintegrasi per semester dengan perhitungan predikat otomatis
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onPrintGrades(currentStudentId, currentSemester)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor Semester Ini</span>
          </button>
          {(!currentUser || currentUser.canEditGrades) ? (
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors shadow-xs"
            >
              {isSavedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSavedFeedback ? 'Tersimpan!' : 'Simpan Nilai'}</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Hanya Lihat (Mode Baca)</span>
            </div>
          )}
        </div>
      </div>

      {/* Selector Strip: Student & Semester */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Student Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Siswa</label>
            <select
              value={currentStudentId}
              onChange={(e) => setCurrentStudentId(e.target.value)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:ring-1 focus:ring-emerald-800 focus:outline-none"
            >
              {students.map((s, idx) => (
                <option key={`${s.id}-${idx}`} value={s.id}>
                  {s.namaLengkap} ({s.kelasSekarang}) - NISN: {s.nisn}
                </option>
              ))}
            </select>
          </div>

          {/* Kelas & Tahun Ajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kelas & Tahun Ajaran</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={kelas}
                onChange={(e) => setKelas(e.target.value)}
                placeholder="Kelas"
                className="w-1/2 p-2.5 text-xs border border-slate-200 rounded-lg bg-white font-medium"
              />
              <input
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2023/2024"
                className="w-1/2 p-2.5 text-xs border border-slate-200 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          {/* Status Kenaikan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Kenaikan / Akhir</label>
            <select
              value={statusKenaikan}
              onChange={(e) => setStatusKenaikan(e.target.value as any)}
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white font-medium focus:ring-1 focus:ring-emerald-800 focus:outline-none"
            >
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Naik Kelas">Naik Kelas</option>
              <option value="Lulus">Lulus / Tamat Belajar</option>
              <option value="Tinggal Kelas">Tinggal Kelas</option>
            </select>
          </div>
        </div>

        {/* Semester Buttons Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600 mr-2">Semester:</span>
            {[1, 2, 3, 4, 5, 6].map(sem => (
              <button
                key={sem}
                onClick={() => setCurrentSemester(sem)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  currentSemester === sem
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Semester {sem}
              </button>
            ))}
          </div>

          {currentStudent && (
            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-600">
              <div>Rata-rata Pengetahuan: <span className="font-bold text-slate-900">{avgPengetahuan}</span></div>
              <span aria-hidden="true">·</span>
              <div>Rata-rata Keterampilan: <span className="font-bold text-slate-900">{avgKeterampilan}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Main Subjects Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Daftar Capaian Nilai Mata Pelajaran
          </h2>
          <span className="text-[11px] text-slate-500">
            Predikat: A (≥90), B (≥80), C (≥70), D (&lt;70)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">No</th>
                <th className="py-2.5 px-3">Mata Pelajaran</th>
                <th className="py-2.5 px-2 text-center w-20">KKM</th>
                <th className="py-2.5 px-2 text-center w-28">Pengetahuan</th>
                <th className="py-2.5 px-2 text-center w-16">Predikat</th>
                <th className="py-2.5 px-2 text-center w-28">Keterampilan</th>
                <th className="py-2.5 px-2 text-center w-16">Predikat</th>
                <th className="py-2.5 px-3">Capaian Kompetensi / Catatan Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {mataPelajaran.map((mp, idx) => (
                <tr key={mp.kode} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{mp.nama}</div>
                    <span className="text-[10px] text-slate-400">{mp.kelompok}</span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="number"
                      value={mp.kkm}
                      onChange={(e) => handleUpdateScore(idx, 'kkm', e.target.value)}
                      className="w-14 p-1.5 text-center font-mono text-xs border border-slate-200 rounded bg-white"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={mp.nilaiPengetahuan}
                      onChange={(e) => handleUpdateScore(idx, 'nilaiPengetahuan', e.target.value)}
                      className="w-16 p-1.5 text-center font-mono font-bold text-xs border border-slate-200 rounded bg-white text-slate-900"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-emerald-800">
                    {mp.predikatPengetahuan}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={mp.nilaiKeterampilan}
                      onChange={(e) => handleUpdateScore(idx, 'nilaiKeterampilan', e.target.value)}
                      className="w-16 p-1.5 text-center font-mono font-bold text-xs border border-slate-200 rounded bg-white text-slate-900"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-emerald-800">
                    {mp.predikatKeterampilan}
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      value={mp.deskripsiCapaian || ''}
                      onChange={(e) => handleUpdateScore(idx, 'deskripsiCapaian', e.target.value)}
                      placeholder="Deskripsi pencapaian materi..."
                      className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white text-slate-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ekstrakurikuler & Catatan Wali Kelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ekstrakurikuler Panel */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-800" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kegiatan Ekstrakurikuler
              </h3>
            </div>
            <button
              onClick={handleAddEkskul}
              className="px-2.5 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Ekskul</span>
            </button>
          </div>

          <div className="space-y-3">
            {ekskulList.map((ek, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ek.nama}
                    onChange={(e) => {
                      const updated = [...ekskulList];
                      updated[idx].nama = e.target.value;
                      setEkskulList(updated);
                    }}
                    placeholder="Nama Ekstrakurikuler"
                    className="flex-1 p-1.5 text-xs font-semibold border border-slate-200 rounded bg-white"
                  />
                  <select
                    value={ek.predikat}
                    onChange={(e) => {
                      const updated = [...ekskulList];
                      updated[idx].predikat = e.target.value as any;
                      setEkskulList(updated);
                    }}
                    className="p-1.5 text-xs border border-slate-200 rounded bg-white font-medium text-emerald-800"
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                  </select>
                  <button
                    onClick={() => handleRemoveEkskul(idx)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={ek.keterangan}
                  onChange={(e) => {
                    const updated = [...ekskulList];
                    updated[idx].keterangan = e.target.value;
                    setEkskulList(updated);
                  }}
                  placeholder="Keterangan partisipasi..."
                  className="w-full p-1.5 text-xs border border-slate-200 rounded bg-white text-slate-600"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Catatan Wali Kelas */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Catatan & Rekomendasi Wali Kelas
          </h3>
          <textarea
            rows={5}
            value={catatanWaliKelas}
            onChange={(e) => setCatatanWaliKelas(e.target.value)}
            placeholder="Tuliskan motivasi, perkembangan sikap, atau rekomendasi untuk siswa..."
            className="w-full p-3 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800 leading-relaxed"
          />
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan Nilai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
