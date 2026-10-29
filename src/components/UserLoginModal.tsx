import React, { useState } from 'react';
import { TeacherUser, UserRole } from '../types';
import { X, Lock, KeyRound, UserCheck, Shield, GraduationCap, BookOpen, Briefcase, LogOut } from 'lucide-react';

interface UserLoginModalProps {
  isOpen: boolean;
  currentUser: TeacherUser;
  teachers: TeacherUser[];
  onClose: () => void;
  onSwitchUser: (teacher: TeacherUser) => void;
}

export const UserLoginModal: React.FC<UserLoginModalProps> = ({
  isOpen,
  currentUser,
  teachers,
  onClose,
  onSwitchUser,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetTeacher = teachers.find(t => t.id === selectedUserId) || teachers[0];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!targetTeacher) {
      setErrorMsg('Pilih pengguna terlebih dahulu.');
      return;
    }

    if (pinInput.trim() !== targetTeacher.pin) {
      setErrorMsg('PIN salah. Silakan periksa kembali (Default: 123456).');
      return;
    }

    onSwitchUser(targetTeacher);
    setSuccessMsg(`Berhasil login sebagai ${targetTeacher.fullName}!`);
    setTimeout(() => {
      setSuccessMsg(null);
      setPinInput('');
      onClose();
    }, 600);
  };

  const getRoleBadge = (role: UserRole) => {
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

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-5 h-5 text-indigo-600" />;
      case 'wali_kelas':
        return <GraduationCap className="w-5 h-5 text-emerald-600" />;
      case 'guru_mapel':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'tata_usaha':
        return <Briefcase className="w-5 h-5 text-amber-600" />;
      default:
        return <UserCheck className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Ganti Akun Pengguna</h2>
              <p className="text-xs text-slate-500">Pilih profil guru atau staf untuk masuk</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleLoginSubmit} className="p-6 space-y-5">
          {/* Current Active User Status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-500">Akun Aktif Saat Ini:</span>
            <span className="font-semibold text-slate-900">
              {currentUser.fullName} ({currentUser.role.replace('_', ' ').toUpperCase()})
            </span>
          </div>

          {/* User Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Profil Guru / Staf
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 border border-slate-200 rounded-lg p-1.5 bg-slate-50/50">
              {teachers.filter(t => t.isActive).map(teacher => {
                const isSelected = teacher.id === selectedUserId;
                return (
                  <button
                    key={teacher.id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(teacher.id);
                      setPinInput('');
                      setErrorMsg(null);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-white border-indigo-600 shadow-xs'
                        : 'bg-white/80 border-slate-200 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0">
                        {getRoleIcon(teacher.role)}
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {teacher.fullName}{teacher.gelar ? `, ${teacher.gelar}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {teacher.nip ? `NIP: ${teacher.nip}` : `@${teacher.username}`}
                          {teacher.assignedClass ? ` · Kelas ${teacher.assignedClass}` : ''}
                          {teacher.mataPelajaran ? ` · ${teacher.mataPelajaran}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {getRoleBadge(teacher.role)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                Masukkan PIN Akun (6 Digit)
              </label>
              <span className="text-[11px] text-slate-400">PIN bawaan: 123456</span>
            </div>
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-center tracking-widest text-lg font-mono font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
            />
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold text-center">
              {successMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>Masuk Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
