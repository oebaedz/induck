import React, { useState } from 'react';
import { SyncState, Student, PerkembanganSiswa, NilaiSemester, SelesaiStudiMutasi, SchoolProfile } from '../types';
import { googleSignIn, logout } from '../services/googleAuth';
import { createSchoolSpreadsheet, writeAllSheetsData, readAllSheetsData } from '../services/googleSheets';
import { isOnlineUrl, getOrCreateDriveFolder, uploadPhotoToGoogleDrive } from '../services/googleDrive';
import { X, FileSpreadsheet, ExternalLink, RefreshCw, Plus, ArrowUpRight, CheckCircle2, AlertCircle, Copy, Check, Cloud, Trash2, Image } from 'lucide-react';

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
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isUnauthorizedDomain = errorMessage?.includes('unauthorized-domain');

  if (!isOpen) return null;

  const onlinePhotosCount = students.filter(s => isOnlineUrl(s.fotoMasukUrl) || isOnlineUrl(s.fotoUrl)).length;
  const localPhotosCount = students.filter(s => (s.fotoMasukUrl && s.fotoMasukUrl.startsWith('data:image/')) || (s.fotoKeluarUrl && s.fotoKeluarUrl.startsWith('data:image/'))).length;

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
      
      // Auto-populate spreadsheet with current data and upload local photos to Google Drive
      const { updatedStudents } = await writeAllSheetsData(
        token,
        result.spreadsheetId,
        {
          students,
          perkembangan,
          nilaiList,
          kelulusanMutasi,
        },
        (msg) => setSuccessMessage(msg)
      );

      if (updatedStudents?.length) {
        onImportData({
          students: updatedStudents,
          perkembangan,
          nilaiList,
          kelulusanMutasi,
        });
      }

      onUpdateSyncState({
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetTitle: `Buku Induk Siswa Digital - ${school.namaSekolah}`,
        lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      });

      setSuccessMessage('Spreadsheet Buku Induk baru berhasil dibuat di Google Drive Anda dan seluruh foto siswa telah tersimpan online!');
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
          message: `Ditemukan ${data.students.length} data siswa di spreadsheet (termasuk foto online). Apakah Anda ingin memuatnya ke aplikasi?`,
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
      title: 'Sinkronkan Data ke Google Sheets?',
      message: `Tindakan ini akan:
1. Menghapus data siswa yang telah dihapus di aplikasi dari spreadsheet.
2. Mengunggah foto siswa lokal ke Google Drive agar dapat diakses dari device manapun.
3. Memperbarui seluruh lembar nilai dan perkembangan siswa (${students.length} siswa). Lanjutkan?`,
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
          const { updatedStudents } = await writeAllSheetsData(
            token,
            syncState.spreadsheetId!,
            {
              students,
              perkembangan,
              nilaiList,
              kelulusanMutasi,
            },
            (msg) => setSuccessMessage(msg)
          );

          if (updatedStudents?.length) {
            onImportData({
              students: updatedStudents,
              perkembangan,
              nilaiList,
              kelulusanMutasi,
            });
          }

          onUpdateSyncState({
            lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
          });
          setSuccessMessage('Seluruh data berhasil disinkronkan ke Google Sheets! Siswa terhapus telah dibersihkan dan foto tersimpan online.');
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
      message: 'Tindakan ini akan membaca baris dari spreadsheet Google Anda dan menggantikan data saat ini di aplikasi. Foto siswa online akan langsung dimuat di perangkat ini.',
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
          const data = await readAllSheetsData(token, syncState.spreadsheetId!);
          onImportData(data);
          onUpdateSyncState({
            lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
          });
          setSuccessMessage(`Berhasil memuat ${data.students.length} data siswa dari spreadsheet.`);
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal membaca data dari Google Sheets.');
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // Upload all local photos to Google Drive
  const handleUploadAllPhotosToDrive = async () => {
    const { getAccessToken } = await import('../services/googleAuth');
    const token = await getAccessToken();
    if (!token) {
      setErrorMessage('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage('Membuat / memeriksa folder "Buku Induk - Foto Siswa" di Google Drive...');

      const folderId = await getOrCreateDriveFolder(token);
      let count = 0;
      const updatedList = students.map(s => ({ ...s }));

      for (let i = 0; i < updatedList.length; i++) {
        const s = updatedList[i];
        const studentTag = s.nisn || s.nis || s.id || `siswa_${i + 1}`;

        if (s.fotoMasukUrl && s.fotoMasukUrl.startsWith('data:image/')) {
          setSuccessMessage(`Mengunggah foto (${i + 1}/${updatedList.length}): ${s.namaLengkap}...`);
          const { directUrl } = await uploadPhotoToGoogleDrive(
            token,
            s.fotoMasukUrl,
            `foto_masuk_${studentTag}_${Date.now()}`,
            folderId
          );
          s.fotoMasukUrl = directUrl;
          if (!s.fotoUrl || s.fotoUrl.startsWith('data:image/')) {
            s.fotoUrl = directUrl;
          }
          count++;
        }

        if (s.fotoKeluarUrl && s.fotoKeluarUrl.startsWith('data:image/')) {
          setSuccessMessage(`Mengunggah foto tamat (${i + 1}/${updatedList.length}): ${s.namaLengkap}...`);
          const { directUrl } = await uploadPhotoToGoogleDrive(
            token,
            s.fotoKeluarUrl,
            `foto_keluar_${studentTag}_${Date.now()}`,
            folderId
          );
          s.fotoKeluarUrl = directUrl;
          count++;
        }
      }

      onImportData({
        students: updatedList,
        perkembangan,
        nilaiList,
        kelulusanMutasi,
      });

      // Also sync to sheets if sheet is connected
      if (syncState.spreadsheetId) {
        setSuccessMessage('Memperbarui tautan foto online ke spreadsheet...');
        await writeAllSheetsData(token, syncState.spreadsheetId, {
          students: updatedList,
          perkembangan,
          nilaiList,
          kelulusanMutasi,
        });
      }

      setSuccessMessage(`Berhasil mengunggah ${count} foto siswa ke Google Drive! Sekarang foto dapat diakses dan dilihat di device manapun.`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal mengunggah foto ke Google Drive.');
    } finally {
      setIsProcessing(false);
    }
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
              <h2 className="text-base font-bold">Sinkronisasi Cloud & Foto Siswa Online</h2>
              <p className="text-[11px] text-slate-300">Google Sheets & Google Drive Terintegrasi</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Notifications */}
          {errorMessage && (
            isUnauthorizedDomain ? (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 space-y-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs text-amber-950">Domain Deployment Belum Diizinkan di Firebase (auth/unauthorized-domain)</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Firebase Authentication memblokir login Google dari domain baru (<strong>{currentHostname || 'Netlify'}</strong>) demi keamanan. Anda hanya perlu menambahkan domain ini satu kali ke daftar <strong>Authorized Domains</strong> di Firebase Console.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-amber-200/80 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-800">Domain yang harus ditambahkan:</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-slate-100 font-mono text-xs rounded border border-slate-200 text-slate-900 select-all">
                      {currentHostname || 'domain-anda.netlify.app'}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        if (currentHostname) {
                          navigator.clipboard.writeText(currentHostname);
                          setCopiedDomain(true);
                          setTimeout(() => setCopiedDomain(false), 2000);
                        }
                      }}
                      className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDomain ? 'Tersalin!' : 'Salin Domain'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-amber-900 leading-relaxed pt-1">
                  <div className="font-bold">Langkah cepat mengaktifkan:</div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-slate-700">
                    <li>
                      Buka{' '}
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0123836276/authentication/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-amber-900 hover:text-amber-950 inline-flex items-center gap-0.5"
                      >
                        Firebase Console Settings
                        <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </li>
                    <li>Gulir ke bagian <strong>Authorized domains</strong> (Domain yang diotorisasi).</li>
                    <li>Klik <strong>Add domain</strong>, tempel <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">{currentHostname || 'domain-anda.netlify.app'}</code>, lalu klik <strong>Add / Save</strong>.</li>
                    <li>Kembali ke tab ini dan klik tombol <em>Sign in with Google</em> lagi.</li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Account Status / Sign In */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
              1. Status Akun Google Workspace & Drive
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
                  Masuk dengan akun Google Anda untuk mengizinkan aplikasi membaca, menghapus, dan menyimpan spreadsheet Buku Induk serta mengunggah foto siswa online ke Google Drive Anda.
                </p>
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

          {/* Section 2: Photo Online Cloud Storage */}
          <div className="border border-slate-200 rounded-xl p-4 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-700" />
                <span>2. Penyimpanan Foto Siswa Online (Google Drive)</span>
              </h3>
              <span className="text-[11px] font-mono font-semibold text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded">
                Folder: Buku Induk - Foto Siswa
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Foto siswa disimpan secara online di Google Drive Anda dengan tautan publik berkecepatan tinggi sehingga foto langsung muncul di komputer lain, HP, atau tablet saat membuka aplikasi.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Foto Tersimpan Online:</div>
                <div className="text-base font-bold text-emerald-700">{onlinePhotosCount} Siswa</div>
                <div className="text-[10px] text-slate-400">Dapat dibuka dari device manapun</div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 font-medium">Foto Tersimpan Lokal:</div>
                <div className="text-base font-bold text-amber-700">{localPhotosCount} Siswa</div>
                <div className="text-[10px] text-slate-400">Perlu diunggah ke Google Drive</div>
              </div>
            </div>

            {localPhotosCount > 0 && syncState.isConnected && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUploadAllPhotosToDrive}
                  disabled={isProcessing}
                  className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unggah {localPhotosCount} Foto Lokal ke Google Drive Sekarang</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Spreadsheet Connection */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
                3. Spreadsheet Buku Induk Terhubung
              </h3>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Auto-Delete Bersih Aktif
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Setiap kali data disinkronkan, sistem menjalankan <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono">batchClear</code> sehingga siswa yang dihapus di aplikasi akan <strong>100% terhapus bersih dari Google Sheets</strong>.
            </p>

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
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                    <span>Kirim & Bersihkan Google Sheets</span>
                  </button>
                  <button
                    onClick={handleImportFromSheets}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs cursor-pointer"
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
                    Sistem akan membuat file spreadsheet baru berjudul &quot;Buku Induk Siswa Digital - {school.namaSekolah}&quot; di Google Drive Anda dan otomatis mengunggah foto siswa ke cloud.
                  </p>
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isProcessing || !syncState.isConnected}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                      syncState.isConnected
                        ? 'bg-emerald-800 text-white hover:bg-emerald-900 shadow-xs cursor-pointer'
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
                          ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
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
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
