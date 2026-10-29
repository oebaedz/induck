import React, { useState, useMemo } from 'react';
import { Student, TeacherUser } from '../types';
import { Search, Plus, Printer, Edit2, Trash2, Eye, UserX, Upload } from 'lucide-react';

interface StudentListViewProps {
  students: Student[];
  currentUser?: TeacherUser;
  onOpenAddModal: () => void;
  onOpenUploadModal: () => void;
  onOpenEditModal: (student: Student) => void;
  onSelectStudentDetail: (studentId: string) => void;
  onOpenPrintMasterBook: (studentId: string) => void;
  onDeleteStudent: (student: Student) => void;
}

export const StudentListView: React.FC<StudentListViewProps> = ({
  students,
  currentUser,
  onOpenAddModal,
  onOpenUploadModal,
  onOpenEditModal,
  onSelectStudentDetail,
  onOpenPrintMasterBook,
  onDeleteStudent,
}) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [kelasFilter, setKelasFilter] = useState<string>('Semua');
  const [genderFilter, setGenderFilter] = useState<string>('Semua');

  // Extract unique classes
  const uniqueClasses = useMemo(() => {
    const set = new Set(students.map(s => s.kelasSekarang).filter(Boolean));
    return Array.from(set).sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        !q ||
        student.namaLengkap.toLowerCase().includes(q) ||
        student.namaPanggilan.toLowerCase().includes(q) ||
        student.nis.toLowerCase().includes(q) ||
        student.nisn.toLowerCase().includes(q) ||
        student.nik.toLowerCase().includes(q) ||
        student.alamat.kabupatenKota.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'Semua' || student.statusSiswa === statusFilter;
      const matchesKelas = kelasFilter === 'Semua' || student.kelasSekarang === kelasFilter;
      const matchesGender = genderFilter === 'Semua' || student.jenisKelamin === genderFilter;

      return matchesSearch && matchesStatus && matchesKelas && matchesGender;
    });
  }, [students, searchQuery, statusFilter, kelasFilter, genderFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Daftar Buku Induk Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan {filteredStudents.length} dari total {students.length} siswa terdaftar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {(!currentUser || currentUser.canEditBiodata) && (
            <>
              <button
                onClick={onOpenUploadModal}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Siswa (CSV / TSV)</span>
              </button>
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 rounded-lg hover:bg-emerald-900 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa Baru</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama, NIS, NISN, NIK..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 bg-slate-50/50"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 bg-white"
            >
              <option value="Semua">Semua Status Siswa</option>
              <option value="Aktif">Aktif</option>
              <option value="Lulus">Lulus / Tamat</option>
              <option value="Mutasi Keluar">Mutasi Keluar</option>
              <option value="Drop Out">Drop Out</option>
            </select>
          </div>

          {/* Kelas Filter */}
          <div>
            <select
              value={kelasFilter}
              onChange={(e) => setKelasFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 bg-white"
            >
              <option value="Semua">Semua Kelas</option>
              {uniqueClasses.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div>
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-800 focus:border-emerald-800 bg-white"
            >
              <option value="Semua">Semua Jenis Kelamin</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <UserX className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-700">Tidak ada data siswa ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cobalah ubah kata kunci pencarian atau bersihkan filter di atas.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('Semua');
                setKelasFilter('Semua');
                setGenderFilter('Semua');
              }}
              className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Siswa</th>
                  <th className="py-3 px-4">NISN / NIS</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">TTL</th>
                  <th className="py-3 px-4">Orang Tua (Ayah / Ibu)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => (
                  <tr 
                    key={`${student.id}-${idx}`} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                            <img
                              src={student.fotoMasukUrl || student.fotoUrl || '/src/assets/images/student_portrait_male_1792639263730.jpg'}
                              alt={student.namaLengkap}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          {student.fotoKeluarUrl && (
                            <span 
                              title="Foto Masuk & Foto Keluar Tersedia" 
                              className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-700 text-white rounded-full text-[9px] font-bold flex items-center justify-center border border-white"
                            >
                              2
                            </span>
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => onSelectStudentDetail(student.id)}
                            className="font-semibold text-slate-900 group-hover:text-emerald-800 text-left hover:underline truncate max-w-[200px] block"
                          >
                            {student.namaLengkap}
                          </button>
                          <span className="text-[11px] text-slate-500 block">
                            Panggilan: {student.namaPanggilan}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      <div>NISN: {student.nisn}</div>
                      <div className="text-[11px] text-slate-400">NIS: {student.nis}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {student.kelasSekarang}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{student.tempatLahir}</div>
                      <div className="text-[11px] text-slate-400 font-mono tabular-nums">{student.tanggalLahir}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>{student.orangTua.ayah.nama}</div>
                      <div className="text-[11px] text-slate-400">{student.orangTua.ibu.nama}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-sm inline-block ${
                        student.statusSiswa === 'Aktif' 
                          ? 'bg-emerald-50 text-emerald-800' 
                          : student.statusSiswa === 'Lulus'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-amber-50 text-amber-800'
                      }`}>
                        {student.statusSiswa}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onSelectStudentDetail(student.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Lihat Rincian Buku Induk"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenPrintMasterBook(student.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Cetak Lembar Buku Induk Siswa Ini"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {(!currentUser || currentUser.canEditBiodata) && (
                          <button
                            onClick={() => onOpenEditModal(student)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            title="Ubah Data Siswa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {(!currentUser || currentUser.canDeleteStudent) && (
                          <button
                            onClick={() => onDeleteStudent(student)}
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            title="Hapus Dari Buku Induk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
