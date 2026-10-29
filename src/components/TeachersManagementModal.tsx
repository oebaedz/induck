import React, { useState } from 'react';
import { TeacherUser, UserRole } from '../types';
import {
  X,
  Plus,
  Users,
  Shield,
  GraduationCap,
  BookOpen,
  Briefcase,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface TeachersManagementModalProps {
  isOpen: boolean;
  currentUser: TeacherUser;
  teachers: TeacherUser[];
  onClose: () => void;
  onSaveTeacher: (teacher: TeacherUser) => void;
  onDeleteTeacher: (id: string) => void;
  onRequestConfirm: (config: { title: string; message: string; onConfirm: () => void }) => void;
}

export const TeachersManagementModal: React.FC<TeachersManagementModalProps> = ({
  isOpen,
  currentUser,
  teachers,
  onClose,
  onSaveTeacher,
  onDeleteTeacher,
  onRequestConfirm,
}) => {
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredTeachers = teachers.filter(t =>
    t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.nip && t.nip.includes(searchTerm)) ||
    (t.assignedClass && t.assignedClass.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleStartAdd = () => {
    const newId = `tch-${Date.now().toString().slice(-4)}`;
    setEditingTeacher({
      id: newId,
      username: `guru_${newId}`,
      fullName: '',
      gelar: 'S.Pd.',
      nip: '',
      role: 'guru_mapel',
      pin: '123456',
      mataPelajaran: '',
      assignedClass: '',
      isActive: true,
      canEditBiodata: false,
      canEditGrades: true,
      canDeleteStudent: false,
      canSyncSheets: true,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setIsFormOpen(true);
  };

  const handleStartEdit = (teacher: TeacherUser) => {
    setEditingTeacher({ ...teacher });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher || !editingTeacher.fullName.trim() || !editingTeacher.username.trim()) {
      return;
    }
    onSaveTeacher(editingTeacher);
    setIsFormOpen(false);
    setEditingTeacher(null);
  };

  const handleResetPin = (teacher: TeacherUser) => {
    onRequestConfirm({
      title: 'Reset PIN Pengguna',
      message: `Reset PIN untuk "${teacher.fullName}" kembali ke PIN bawaan "123456"?`,
      onConfirm: () => {
        onSaveTeacher({ ...teacher, pin: '123456' });
      },
    });
  };

  const handleDelete = (teacher: TeacherUser) => {
    if (teacher.id === currentUser.id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      return;
    }
    onRequestConfirm({
      title: 'Hapus Guru / Staf',
      message: `Apakah Anda yakin ingin menghapus "${teacher.fullName}" (@${teacher.username}) dari sistem?`,
      onConfirm: () => {
        onDeleteTeacher(teacher.id);
      },
    });
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="text-xs font-semibold text-indigo-700">Administrator</span>;
      case 'wali_kelas':
        return <span className="text-xs font-semibold text-emerald-700">Wali Kelas</span>;
      case 'guru_mapel':
        return <span className="text-xs font-semibold text-blue-700">Guru Mapel</span>;
      case 'tata_usaha':
        return <span className="text-xs font-semibold text-amber-700">Tata Usaha</span>;
      default:
        return <span className="text-xs text-slate-600">Staf</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manajemen Guru, Staf & Akun Pengguna</h2>
              <p className="text-xs text-slate-500">Kelola daftar pendidik, wali kelas, serta peran dan hak akses sistem (RBAC)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
          <input
            type="text"
            placeholder="Cari guru berdasarkan nama, NIP, atau kelas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 w-full sm:w-72"
          />

          <button
            onClick={handleStartAdd}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru / Staf</span>
          </button>
        </div>

        {/* Teachers Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Nama & NIP</th>
                  <th className="py-2.5 px-3">Username & PIN</th>
                  <th className="py-2.5 px-3">Peran (Role)</th>
                  <th className="py-2.5 px-3">Tugas / Kelas</th>
                  <th className="py-2.5 px-3">Hak Akses</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => {
                  const isCurrent = teacher.id === currentUser.id;
                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">
                          {teacher.fullName}{teacher.gelar ? `, ${teacher.gelar}` : ''}
                          {isCurrent && (
                            <span className="ml-1.5 text-[10px] bg-indigo-100 text-indigo-700 font-medium px-1.5 py-0.5 rounded">
                              Anda
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {teacher.nip ? `NIP. ${teacher.nip}` : 'Non-NIP'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-mono text-slate-700 font-medium">@{teacher.username}</div>
                        <div className="text-[10px] text-slate-400 font-mono">PIN: ••••••</div>
                      </td>

                      <td className="py-2.5 px-3">
                        {getRoleLabel(teacher.role)}
                      </td>

                      <td className="py-2.5 px-3 text-slate-600">
                        {teacher.role === 'wali_kelas' && (
                          <span className="font-medium text-emerald-800">Wali Kelas {teacher.assignedClass || '-'}</span>
                        )}
                        {teacher.role === 'guru_mapel' && (
                          <span>{teacher.mataPelajaran || 'Guru Mata Pelajaran'}</span>
                        )}
                        {teacher.role === 'admin' && (
                          <span className="text-slate-500">Pimpinan / Kepala Sekolah</span>
                        )}
                        {teacher.role === 'tata_usaha' && (
                          <span className="text-slate-500">Administrasi & Biodata</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          {teacher.canEditBiodata && <span title="Bisa Edit Biodata">Biodata</span>}
                          {teacher.canEditBiodata && teacher.canEditGrades && <span>·</span>}
                          {teacher.canEditGrades && <span title="Bisa Edit Nilai">Nilai</span>}
                          {teacher.canDeleteStudent && <span>·</span>}
                          {teacher.canDeleteStudent && <span className="text-rose-600 font-medium" title="Bisa Hapus Siswa">Hapus</span>}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${teacher.isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${teacher.isActive ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                          {teacher.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => handleResetPin(teacher)}
                            title="Reset PIN ke 123456"
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(teacher)}
                            title="Edit Guru & Hak Akses"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isCurrent && (
                            <button
                              onClick={() => handleDelete(teacher)}
                              title="Hapus Akun"
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Total {teachers.length} akun terdaftar · Data ini otomatis tersinkron ke Google Sheets</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Edit / Add Sub-Modal */}
      {isFormOpen && editingTeacher && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTeacher.id.startsWith('tch-') ? 'Tambah Guru & Akun Pengguna' : 'Edit Guru & Hak Akses'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.fullName}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, fullName: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gelar</label>
                  <input
                    type="text"
                    value={editingTeacher.gelar || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, gelar: e.target.value })}
                    placeholder="S.Pd. / M.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP (Opsional)</label>
                  <input
                    type="text"
                    value={editingTeacher.nip}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, nip: e.target.value })}
                    placeholder="19800101 200501 1 001"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={editingTeacher.username}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="budi_santoso"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran Sistem (Role)</label>
                  <select
                    value={editingTeacher.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      let updatedPerms = { ...editingTeacher, role: newRole };
                      if (newRole === 'admin') {
                        updatedPerms.canEditBiodata = true;
                        updatedPerms.canEditGrades = true;
                        updatedPerms.canDeleteStudent = true;
                        updatedPerms.canSyncSheets = true;
                      } else if (newRole === 'wali_kelas') {
                        updatedPerms.canEditBiodata = true;
                        updatedPerms.canEditGrades = true;
                        updatedPerms.canDeleteStudent = false;
                        updatedPerms.canSyncSheets = true;
                      } else if (newRole === 'guru_mapel') {
                        updatedPerms.canEditBiodata = false;
                        updatedPerms.canEditGrades = true;
                        updatedPerms.canDeleteStudent = false;
                        updatedPerms.canSyncSheets = true;
                      } else if (newRole === 'tata_usaha') {
                        updatedPerms.canEditBiodata = true;
                        updatedPerms.canEditGrades = false;
                        updatedPerms.canDeleteStudent = false;
                        updatedPerms.canSyncSheets = true;
                      }
                      setEditingTeacher(updatedPerms);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  >
                    <option value="admin">Administrator (Kepala Sekolah / Admin)</option>
                    <option value="wali_kelas">Wali Kelas</option>
                    <option value="guru_mapel">Guru Mata Pelajaran</option>
                    <option value="tata_usaha">Tata Usaha (Staf Administrasi)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Login (6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={editingTeacher.pin}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="123456"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {editingTeacher.role === 'wali_kelas' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kelas Binaan</label>
                  <input
                    type="text"
                    value={editingTeacher.assignedClass || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, assignedClass: e.target.value })}
                    placeholder="Contoh: X-A, XI-IPA-1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              {editingTeacher.role === 'guru_mapel' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran yang Diampu</label>
                  <input
                    type="text"
                    value={editingTeacher.mataPelajaran || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, mataPelajaran: e.target.value })}
                    placeholder="Contoh: Matematika (Umum)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                  />
                </div>
              )}

              {/* Permissions Checkboxes */}
              <div className="pt-2 border-t border-slate-100">
                <span className="block font-semibold text-slate-700 mb-2">Izin Hak Akses Spesifik:</span>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.canEditBiodata}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, canEditBiodata: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>Bisa Edit Biodata Siswa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.canEditGrades}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, canEditGrades: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>Bisa Input & Edit Nilai</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.canDeleteStudent}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, canDeleteStudent: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-600"
                    />
                    <span className="text-rose-700 font-medium">Bisa Hapus Siswa</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingTeacher.canSyncSheets}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, canSyncSheets: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-600"
                    />
                    <span>Bisa Sinkron Cloud Sheets</span>
                  </label>
                </div>
              </div>

              {/* Status Aktif */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTeacher.isActive}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-600"
                  />
                  <span className="font-semibold text-slate-800">Akun Aktif (Dapat Login)</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3.5 py-1.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
