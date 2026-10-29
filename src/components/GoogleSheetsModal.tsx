import React, { useState } from 'react';
import {
  SyncState,
  Student,
  PerkembanganSiswa,
  NilaiSemester,
  SelesaiStudiMutasi,
  SchoolProfile,
  TeacherUser,
} from '../types';
import { googleSignIn, logout } from '../services/googleAuth';
import { createSchoolSpreadsheet, writeAllSheetsData, readAllSheetsData } from '../services/googleSheets';
import { isOnlineUrl, getOrCreateDriveFolder, uploadPhotoToGoogleDrive } from '../services/googleDrive';
import {
  generateAppsScriptCode,
  testAppsScriptWebhook,
  pushToAppsScript,
  pullFromAppsScript,
} from '../services/appsScriptSync';
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Cloud,
  Code2,
  Users,
  ShieldCheck,
  Link,
  Key,
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  syncState: SyncState;
  school: SchoolProfile;
  teachers: TeacherUser[];
  students: Student[];
  perkembangan: PerkembanganSiswa[];
  nilaiList: NilaiSemester[];
  kelulusanMutasi: SelesaiStudiMutasi[];
  onClose: () => void;
  onUpdateSyncState: (state: Partial<SyncState>) => void;
  onImportData: (imported: {
    students: Student[];
    perkembangan: PerkembanganSiswa[];
    nilaiList: NilaiSemester[];
    kelulusanMutasi: SelesaiStudiMutasi[];
    school?: SchoolProfile;
    teachers?: TeacherUser[];
  }) => void;
  onRequestConfirm: (config: { title: string; message: string; onConfirm: () => void }) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  syncState,
  school,
  teachers,
  students,
  perkembangan,
  nilaiList,
  kelulusanMutasi,
  onClose,
  onUpdateSyncState,
  onImportData,
  onRequestConfirm,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'webhook' | 'oauth'>('webhook');
  const [webhookInput, setWebhookInput] = useState<string>(() => {
    return syncState.webhookUrl || localStorage.getItem('appscript_webhook_url') || '';
  });
  const [existingIdInput, setExistingIdInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const onlinePhotosCount = students.filter(
    (s) => isOnlineUrl(s.fotoMasukUrl) || isOnlineUrl(s.fotoUrl)
  ).length;
  const localPhotosCount = students.filter(
    (s) =>
      (s.fotoMasukUrl && s.fotoMasukUrl.startsWith('data:image/')) ||
      (s.fotoKeluarUrl && s.fotoKeluarUrl.startsWith('data:image/')) ||
      (s.fotoUrl && s.fotoUrl.startsWith('data:image/'))
  ).length;

  const handleCopyAppsScript = () => {
    const code = generateAppsScriptCode(school.namaSekolah);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // --- Handlers for Webhook (Google Apps Script) ---
  const handleTestWebhook = async () => {
    if (!webhookInput.trim()) {
      setErrorMessage('Masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.');
      return;
    }
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage('Menguji sambungan ke Google Apps Script...');
      const res = await testAppsScriptWebhook(webhookInput.trim());
      localStorage.setItem('appscript_webhook_url', webhookInput.trim());
      onUpdateSyncState({
        syncMethod: 'webhook',
        webhookUrl: webhookInput.trim(),
        webhookConnected: true,
      });
      setSuccessMessage(res.message || 'Koneksi ke Google Apps Script berhasil terhubung!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke Google Apps Script.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePushToWebhook = async () => {
    const url = webhookInput.trim() || syncState.webhookUrl;
    if (!url) {
      setErrorMessage('Masukkan URL Webhook Google Apps Script terlebih dahulu.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage('Sedang mengunggah foto ke Google Drive dan memperbarui 4 sheet...');

      const result = await pushToAppsScript(url, {
        school,
        teachers,
        students,
        perkembangan,
        nilaiList,
        kelulusanMutasi,
      });

      if (!result.success) {
        throw new Error(result.message || 'Gagal menyimpan ke Google Sheets');
      }

      localStorage.setItem('appscript_webhook_url', url);
      const nowStr = new Date().toLocaleString('id-ID');

      onUpdateSyncState({
        syncMethod: 'webhook',
        webhookUrl: url,
        webhookConnected: true,
        webhookLastSync: nowStr,
        lastSyncedAt: nowStr,
      });

      // Update local state if drive URLs were returned for students or school
      if (result.data) {
        onImportData({
          students: result.data.students || students,
          perkembangan: result.data.perkembangan || perkembangan,
          nilaiList: result.data.nilaiList || nilaiList,
          kelulusanMutasi: result.data.kelulusanMutasi || kelulusanMutasi,
          school: result.data.school || school,
          teachers: result.data.teachers || teachers,
        });
      }

      setSuccessMessage(
        result.message ||
          `Berhasil disinkronkan! ${result.stats?.uploadedPhotosCount || 0} foto tersimpan ke Google Drive.`
      );
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal melakukan sinkronisasi ke Google Apps Script.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePullFromWebhook = async () => {
    const url = webhookInput.trim() || syncState.webhookUrl;
    if (!url) {
      setErrorMessage('Masukkan URL Webhook Google Apps Script terlebih dahulu.');
      return;
    }

    onRequestConfirm({
      title: 'Tarik Data dari Google Sheets',
      message:
        'Data lokal di aplikasi akan diperbarui dengan data terbaru dari Google Sheets pusat (termasuk profil sekolah dan daftar guru). Lanjutkan?',
      onConfirm: async () => {
        try {
          setIsProcessing(true);
          setErrorMessage(null);
          setSuccessMessage('Sedang mengambil data terbaru dari Google Sheets...');

          const result = await pullFromAppsScript(url);

          if (!result.success || !result.data) {
            throw new Error(result.message || 'Gagal mengambil data dari Google Sheets.');
          }

          const nowStr = new Date().toLocaleString('id-ID');
          onUpdateSyncState({
            syncMethod: 'webhook',
            webhookUrl: url,
            webhookConnected: true,
            webhookLastSync: nowStr,
            lastSyncedAt: nowStr,
          });

          onImportData({
            students: result.data.students || students,
            perkembangan: result.data.perkembangan || perkembangan,
            nilaiList: result.data.nilaiList || nilaiList,
            kelulusanMutasi: result.data.kelulusanMutasi || kelulusanMutasi,
            school: result.data.school || school,
            teachers: result.data.teachers || teachers,
          });

          setSuccessMessage(
            `Berhasil memuat data dari cloud! (${(result.data.students || []).length} siswa, ${(result.data.teachers || []).length} staf).`
          );
        } catch (err: any) {
          console.error(err);
          setErrorMessage(err.message || 'Gagal menarik data dari Google Apps Script.');
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // --- Handlers for OAuth Method (Fallback / Alternatif) ---
  const handleSignIn = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      const res = await googleSignIn();
      if (res) {
        onUpdateSyncState({
          isConnected: true,
          syncMethod: 'oauth',
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
      const title = `Buku Induk - ${school.namaSekolah}`;
      const { updatedStudents } = await writeAllSheetsData(
        token,
        result.spreadsheetId,
        {
          students,
          perkembangan,
          nilaiList,
          kelulusanMutasi,
        }
      );

      onUpdateSyncState({
        isConnected: true,
        spreadsheetId: result.spreadsheetId,
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetTitle: title,
        lastSyncedAt: new Date().toLocaleString('id-ID'),
      });

      if (updatedStudents) {
        onImportData({ students: updatedStudents, perkembangan, nilaiList, kelulusanMutasi });
      }

      setSuccessMessage(`Spreadsheet "${title}" berhasil dibuat dan dihubungkan!`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal membuat spreadsheet baru.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectExisting = async () => {
    let cleanId = existingIdInput.trim();
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) cleanId = match[1];

    if (!cleanId) {
      setErrorMessage('Masukkan URL atau Spreadsheet ID yang valid.');
      return;
    }

    const { getAccessToken } = await import('../services/googleAuth');
    const token = await getAccessToken();
    if (!token) {
      setErrorMessage('Sesi Google Auth Anda telah berakhir. Silakan masuk kembali.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setSuccessMessage('Sedang memeriksa dan menghubungkan spreadsheet...');

      const data = await readAllSheetsData(token, cleanId);

      onUpdateSyncState({
        isConnected: true,
        spreadsheetId: cleanId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        spreadsheetTitle: `Buku Induk - ${school.namaSekolah}`,
        lastSyncedAt: new Date().toLocaleString('id-ID'),
      });

      if (data.students && data.students.length > 0) {
        onImportData(data);
        setSuccessMessage(`Berhasil terhubung! Mengimpor ${data.students.length} data siswa dari spreadsheet.`);
      } else {
        await writeAllSheetsData(token, cleanId, {
          students,
          perkembangan,
          nilaiList,
          kelulusanMutasi,
        });
        setSuccessMessage('Berhasil terhubung! Data aplikasi telah diunggah ke spreadsheet.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal menghubungkan spreadsheet.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Sinkronisasi Cloud & Google Sheets</h2>
              <p className="text-[11px] text-slate-300">
                Kolaborasi multi-perangkat tanpa perlu login akun Google per guru
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveSubTab('webhook')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeSubTab === 'webhook'
                ? 'bg-white border-slate-200 text-emerald-800 shadow-xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Google Apps Script Web App (Rekomendasi Utama)
          </button>
          <button
            onClick={() => setActiveSubTab('oauth')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-t border-x ${
              activeSubTab === 'oauth'
                ? 'bg-white border-slate-200 text-indigo-700 shadow-xs'
                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Direct Google OAuth (Metode Alternatif)
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start gap-2 shrink-0 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* Tab 1 Content: Google Apps Script Web App */}
        {activeSubTab === 'webhook' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
            {/* Keunggulan Fitur */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Bebas Hambatan Login Google Tiap Guru & Otomatis Simpan Foto ke Drive</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Dengan menghubungkan ke Apps Script Web App, seluruh staf (Wali Kelas, Guru Mapel, TU) dapat
                menarik dan mengirim data siswa langsung dari browser manapun tanpa popup Google Login. Foto
                siswa dan logo sekolah secara otomatis tersimpan rapi ke folder <strong>Google Drive</strong>{' '}
                sekolah.
              </p>
              <div className="flex items-center gap-4 pt-1 text-[11px] text-emerald-900">
                <span>· 4 Sheet Terintegrasi (Siswa, Nilai, Profil, Guru)</span>
                <span>· Direct CDN Link Foto Cepat</span>
                <span>· Anti Error 50.000 Karakter</span>
              </div>
            </div>

            {/* Input URL Webhook */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Link className="w-4 h-4 text-slate-500" />
                  <span>URL Web App Google Apps Script</span>
                </label>
                {syncState.webhookConnected && (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terhubung
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 p-2.5 text-xs border border-slate-300 rounded-lg bg-slate-50 focus:bg-white font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <button
                  onClick={handleTestWebhook}
                  disabled={isProcessing}
                  className="px-4 py-2 text-xs font-semibold bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors shrink-0 shadow-xs"
                >
                  {isProcessing ? 'Menguji...' : 'Test Sambungan'}
                </button>
              </div>

              {syncState.webhookLastSync && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
                  <span>Sinkronisasi Terakhir: {syncState.webhookLastSync}</span>
                  <span>{students.length} Siswa · {teachers.length} Staf/Guru</span>
                </div>
              )}

              {/* Sync Actions */}
              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={handlePushToWebhook}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Kirim Semua Data & Foto ke Cloud (Push)</span>
                </button>
                <button
                  onClick={handlePullFromWebhook}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-xs"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Tarik Data Terbaru dari Cloud (Pull)</span>
                </button>
              </div>
            </div>

            {/* Panduan Pemasangan Skrip (1-Click Setup) */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">Panduan Pemasangan Apps Script (Hanya 1 Menit)</h3>
                  <p className="text-[11px] text-slate-500">
                    Cukup salin kode berikut ke Google Sheet sekolah Anda sekali saja:
                  </p>
                </div>
                <button
                  onClick={handleCopyAppsScript}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg transition-colors shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode Apps Script'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1 text-slate-600">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">1. Buka Apps Script</div>
                  <div className="text-[11px]">Buka Google Sheet, pilih menu <strong>Ekstensi &gt; Apps Script</strong>.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">2. Tempel Kode</div>
                  <div className="text-[11px]">Hapus isi lama, lalu klik tombol <strong>Salin Kode</strong> di atas dan tempel.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">3. Terapkan Web App</div>
                  <div className="text-[11px]">Klik <strong>Terapkan &gt; Deployment Baru &gt; Aplikasi Web</strong>.</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900 mb-1">4. Setel Siapa Saja</div>
                  <div className="text-[11px]">Pilih <strong>Akses: Siapa saja (Anyone)</strong>, lalu salin URL Web App ke kolom di atas.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Direct Google OAuth (Metode Alternatif) */}
        {activeSubTab === 'oauth' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs">Akun Google Terautentikasi</h3>
                  <p className="text-[11px] text-slate-500">
                    Masuk langsung menggunakan otentikasi Google OAuth browser
                  </p>
                </div>
                {syncState.isConnected ? (
                  <button
                    onClick={handleLogout}
                    disabled={isProcessing}
                    className="px-3 py-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                  >
                    Keluar Akun Google
                  </button>
                ) : (
                  <button
                    onClick={handleSignIn}
                    disabled={isProcessing}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    Masuk dengan Google
                  </button>
                )}
              </div>

              {syncState.isConnected && (
                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                  Terhubung sebagai: <strong>{syncState.userEmail}</strong>
                </div>
              )}
            </div>

            {/* Spreadsheet Connection OAuth */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
              <h3 className="font-bold text-slate-900 text-xs">Spreadsheet Google OAuth</h3>
              {syncState.spreadsheetId ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
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
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        <span>Buka Spreadsheet</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleCreateNewSheet}
                    disabled={isProcessing || !syncState.isConnected}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors"
                  >
                    Buat Spreadsheet Buku Induk Baru
                  </button>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={existingIdInput}
                      onChange={(e) => setExistingIdInput(e.target.value)}
                      placeholder="Masukkan Spreadsheet ID atau URL Google Sheets..."
                      className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={handleConnectExisting}
                      disabled={isProcessing || !syncState.isConnected}
                      className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Hubungkan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
