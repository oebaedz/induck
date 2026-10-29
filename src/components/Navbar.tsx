import React from 'react';
import { SchoolProfile, SyncState, TeacherUser } from '../types';
import { Users, User, Shield, GraduationCap, BookOpen, Briefcase, RefreshCw, ChevronDown } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'students' | 'grades' | 'print' | 'sheets';

interface NavbarProps {
  school: SchoolProfile;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  syncState: SyncState;
  currentUser: TeacherUser;
  onOpenSheetsModal: () => void;
  onOpenSchoolModal: () => void;
  onOpenTeachersModal: () => void;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  school,
  activeTab,
  onTabChange,
  syncState,
  currentUser,
  onOpenSheetsModal,
  onOpenSchoolModal,
  onOpenTeachersModal,
  onOpenLoginModal,
}) => {
  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin':
        return 'Admin';
      case 'wali_kelas':
        return `Wali ${currentUser.assignedClass || 'Kelas'}`;
      case 'guru_mapel':
        return 'Guru Mapel';
      case 'tata_usaha':
        return 'Tata Usaha';
      default:
        return 'Staf';
    }
  };

  const isConnected = syncState.webhookConnected || syncState.isConnected;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-6">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => onTabChange('dashboard')} 
            className="flex items-center gap-3 text-left group"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              <img 
                src={school.logoUrl || '/src/assets/images/school_crest_emblem_1792639264888.jpg'} 
                alt="Logo Sekolah" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors whitespace-nowrap block">
                Buku Induk Digital
              </span>
              <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap block truncate max-w-[150px] sm:max-w-[190px]">
                {school.namaSekolah}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              activeTab === 'dashboard'
                ? 'text-emerald-800 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => onTabChange('students')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              activeTab === 'students'
                ? 'text-emerald-800 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buku Induk Siswa
          </button>
          <button
            onClick={() => onTabChange('grades')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              activeTab === 'grades'
                ? 'text-emerald-800 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nilai Semester
          </button>
          <button
            onClick={() => onTabChange('print')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              activeTab === 'print'
                ? 'text-emerald-800 font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-emerald-800'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pusat Cetak
          </button>

          {/* Admin-only links */}
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={onOpenTeachersModal}
                className="whitespace-nowrap text-slate-600 hover:text-slate-900 transition-colors py-1 flex items-center gap-1"
              >
                <span>Guru & Staf</span>
              </button>
              <button
                onClick={onOpenSchoolModal}
                className="whitespace-nowrap text-slate-600 hover:text-slate-900 transition-colors py-1"
              >
                Identitas Sekolah
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Sync & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cloud Sync Button */}
          <button
            onClick={onOpenSheetsModal}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-xs ${
              isConnected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
            }`}
            title={isConnected ? 'Cloud Sync Aktif (Google Sheets & Drive)' : 'Hubungkan Cloud Sheets'}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-600' : 'bg-slate-400'}`} />
            <span className="hidden sm:inline">
              {isConnected ? (syncState.webhookConnected ? 'Cloud Webhook Aktif' : 'Sheets Terhubung') : 'Sinkron Cloud'}
            </span>
          </button>

          {/* Active User Switcher Pill */}
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors group text-left"
            title="Klik untuk mengganti akun / masuk"
          >
            <div className="w-7 h-7 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-slate-900 truncate max-w-[130px]">
                {currentUser.fullName.split(' ')[0]}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {getRoleBadge()}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-100 px-2 py-2 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'}`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => onTabChange('students')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'students' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'}`}
        >
          Buku Induk
        </button>
        <button
          onClick={() => onTabChange('grades')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'grades' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'}`}
        >
          Nilai
        </button>
        <button
          onClick={() => onTabChange('print')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap ${activeTab === 'print' ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-slate-600'}`}
        >
          Cetak
        </button>
        {currentUser.role === 'admin' && (
          <button
            onClick={onOpenTeachersModal}
            className="px-2.5 py-1 rounded-md whitespace-nowrap text-indigo-700 font-medium"
          >
            Guru & Staf
          </button>
        )}
      </div>
    </header>
  );
};
