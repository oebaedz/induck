import React, { useState } from 'react';
import { SyncState, Student, PerkembanganSiswa, NilaiSemester, SelesaiStudiMutasi, SchoolProfile } from '../types';
import { googleSignIn, logout } from '../services/googleAuth';
import { createSchoolSpreadsheet, writeAllSheetsData, readAllSheetsData } from '../services/googleSheets';
import { X, FileSpreadsheet, ExternalLink, RefreshCw, Plus, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  syncState: SyncState;
  school: SchoolProfile;
  students: Student[];
  perkembangan: PerkembanganSiswa[];
  nilaiList: NilaiSemester[];
  kelulusanMutasi: SelesaiStudiMutasi[];
  onClose: () => void;
  onUpdateSyncState: (state: Partial<SyncState>) => void;
  onImportData: (imported: { students: Student[]; perkembangan: PerkembanganSiswa[]; nilaiList: NilaiSemester[]; kelulusanMutasi: SelesaiStudiMutasi[] }) => void;
  onRequestConfirm: (config: { title: string; message: string; onConfirm: () => void }) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  syncState,
  school,
  students,
  perkembangan,
  nilaiList,
  kelulusanMutasi,
  onClose,
  onUpdateSyncState,
  onImportData,
  onRequestConfirm,
}) => {
  const [existingIdInput, setExistingIdInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        onUpdateSyncState({
          isConnected: true,
          userEmail: res.user.email,
        });
        setSuccessMessage('Berhasil masuk dengan akun Google!');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onUpdateSyncState({
        isConnected: false,
        userEmail: null,
      });
      setSuccessMessage('Berhasil keluar dari akun Google.');
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleCreateNewSheet = async () => {
    // Get access token
    const { getAccessToken } = await import('../services/googleAuth');
    const token = await getAccessToken();
    if (!token) {
      setErrorMessage('Sesi Google Auth Anda telah berakhir. Silakan masuk kembali.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage('Sedang membuat spreadsheet baru di Google Drive Anda...');

      const result = await createSchoolSpreadsheet(token, school.namaSekolah);
      
      // Auto-populate spreadsheet with current data
      await writeAllSheetsData(token, result.spreadsheetId, {
        students,
        perkembangan,
        nilaiList,
        kelulusanMutasi,
      });

      onUpdateSyncState({
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetTitle: `Buku Induk Siswa Digital - ${school.namaSekolah}`,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      });

      setSuccessMessage('Spreadsheet Buku Induk baru berhasil dibuat di Google Drive Anda dan data telah disinkronkan!');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat spreadsheet baru.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectExisting = async () => {
    let cleanId = existingIdInput.trim();
    if (!cleanId) {
      setErrorMessage('Masukkan Spreadsheet ID atau URL Google Sheet');
      return;
    }

    // If full URL was pasted, extract the ID
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    const { getAccessToken } = await import('../services/googleAuth');
    const token = await getAccessToken();
    if (!token) {
      setErrorMessage('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Test read to check access
      const data = await readAllSheetsData(token, cleanId);
      
      onUpdateSyncState({
        spreadsheetId: cleanId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        spreadsheetTitle: `Buku Induk (${cleanId.slice(0, 8)}...)`,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      });

      if (data.students.length > 0) {
        onRequestConfirm({
          title: 'Impor Data dari Spreadsheet?',
          message: `Ditemukan ${data.students.length} data siswa di spreadsheet. Apakah Anda ingin memuatnya ke aplikasi?`,
          onConfirm: () => {
            onImportData(data);
            setSuccessMessage(`Berhasil memuat ${data.students.length} data siswa dari spreadsheet.`);
          },
        });
      } else {
        setSuccessMessage('Spreadsheet berhasil terhubung!');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal terhubung ke spreadsheet. Pastikan Anda memiliki akses edit ke file tersebut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportToSheets = () => {
    if (!syncState.spreadsheetId) return;

    onRequestConfirm({
      title: 'Kirim Data ke Google Sheets?',
      message: `Tindakan ini akan memperbarui isi spreadsheet "${syncState.spreadsheetTitle || 'Buku Induk'}" dengan seluruh data siswa (${students.length} siswa), nilai rapor, dan catatan perkembangan saat ini. Lanjutkan?`,
      onConfirm: async () => {
        const { getAccessToken } = await import('../services/googleAuth');
        const token = await getAccessToken();
        if (!token) {
          setErrorMessage('Token otentikasi Google kedaluwarsa. Silakan masuk kembali.');
          return;
        }

        try {
          setIsProcessing(true);
          setErrorMessage(null);
          await writeAllSheetsData(token, syncState.spreadsheetId!, {
            students,
            perkembangan,
            nilaiList,
            kelulusanMutasi,
          });

          onUpdateSyncState({
            lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
          });
          setSuccessMessage('Seluruh data berhasil disinkronkan ke Google Sheets!');
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal mengirim data ke Google Sheets.');
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  const handleImportFromSheets = () => {
    if (!syncState.spreadsheetId) return;

    onRequestConfirm({
      title: 'Tarik Data dari Google Sheets?',
      message: 'Tindakan ini akan membaca baris dari spreadsheet Google Anda dan menggantikan data saat ini di aplikasi. Pastikan Anda telah menyimpan perubahan penting terlebih dahulu.',
      onConfirm: async () => {
        const { getAccessToken } = await import('../services/googleAuth');
        const token = await getAccessToken();
        if (!token) {
          setErrorMessage('Token otentikasi Google kedaluwarsa. Silakan masuk kembali.');
          return;
        }

        try {
          setIsProcessing(true);
          setErrorMessage(null);
          const result = await readAllSheetsData(token, syncState.spreadsheetId!);
          onImportData(result);
          onUpdateSyncState({
            lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
          });
          setSuccessMessage(`Berhasil menarik ${result.students.length} data siswa dari Google Sheets!`);
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal menarik data dari Google Sheets.');
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sinkronisasi Database Google Sheets</h2>
              <p className="text-[11px] text-slate-300">Penyimpanan basis data cloud terintegrasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Account Status / Sign In */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              1. Status Akun Google Workspace
            </h3>

            {syncState.isConnected ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">{syncState.userEmail}</span>
                    <span className="text-[11px] text-slate-500">Izin Google Sheets & Google Drive Aktif</span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-red-700 bg-slate-50 hover:bg-red-50 border border-slate-200 rounded-lg transition-colors self-start sm:self-auto"
                >
                  Keluar Akun
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-slate-600 text-xs leading-relaxed">
                  Masuk dengan akun Google Anda untuk mengizinkan aplikasi membaca dan menyimpan spreadsheet Buku Induk secara otomatis ke Google Drive Anda.
                </p>
                {/* Official Material Google Sign-In Button format */}
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.02h3.88c2.27-2.09 3.66-5.17 3.66-9.11z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.02c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.12C3.25 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.3c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.12z"/>
                    <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.12c.95-2.83 3.6-4.93 6.72-4.93z"/>
                  </svg>
                  <span>{isProcessing ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Spreadsheet Connection */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              2. Spreadsheet Buku Induk Terhubung
            </h3>

            {syncState.spreadsheetId ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{syncState.spreadsheetTitle}</h4>
                    <span className="font-mono text-[11px] text-slate-400">ID: {syncState.spreadsheetId}</span>
                  </div>
                  {syncState.spreadsheetUrl && (
                    <a
                      href={syncState.spreadsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                    >
                      <span>Buka di Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Sinkronisasi Terakhir: {syncState.lastSyncedAt || 'Belum pernah'}</span>
                  <span>4 Lembar (Data_Siswa, Perkembangan, Nilai, Mutasi)</span>
                </div>

                {/* Sync Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    onClick={handleExportToSheets}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>Kirim & Simpan ke Google Sheets</span>
                  </button>
                  <button
                    onClick={handleImportFromSheets}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Tarik Data dari Google Sheets</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-900">Opsi A: Buat Otomatis Spreadsheet Baru</div>
                  <p className="text-slate-500 text-xs">
                    Sistem akan membuat file spreadsheet baru berjudul &quot;Buku Induk Siswa Digital - {school.namaSekolah}&quot; di Google Drive Anda dengan 4 lembar sheet yang terformat rapi.
                  </p>
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isProcessing || !syncState.isConnected}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      syncState.isConnected
                        ? 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buat Spreadsheet Buku Induk Baru</span>
                  </button>
                  {!syncState.isConnected && (
                    <span className="text-[11px] text-amber-700 block">* Silakan masuk dengan Google terlebih dahulu</span>
                  )}
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                  <div className="font-semibold text-slate-900">Opsi B: Hubungkan Spreadsheet yang Sudah Ada</div>
                  <p className="text-slate-500 text-xs">
                    Jika Anda sudah memiliki Google Sheets, tempelkan link URL atau Spreadsheet ID-nya di sini:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={existingIdInput}
                      onChange={(e) => setExistingIdInput(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit atau ID"
                      className="flex-1 p-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white font-mono"
                    />
                    <button
                      onClick={handleConnectExisting}
                      disabled={isProcessing || !syncState.isConnected}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        syncState.isConnected
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Hubungkan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
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
