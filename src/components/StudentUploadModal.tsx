import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { X, Upload, FileText, Download, CheckCircle2, AlertTriangle, Copy, Check, Table } from 'lucide-react';

interface StudentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportStudents: (newStudents: Student[], mode: 'append' | 'replace') => void;
}

const CSV_HEADER_COLUMNS = [
  'NIS',
  'NISN',
  'NIK',
  'Nama Lengkap',
  'Nama Panggilan',
  'Jenis Kelamin (L/P)',
  'Tempat Lahir',
  'Tanggal Lahir (YYYY-MM-DD)',
  'Agama',
  'Kelas Sekarang',
  'Alamat Jalan',
  'Kelurahan',
  'Kecamatan',
  'Kabupaten/Kota',
  'No HP Siswa',
  'Nama Ayah',
  'Pekerjaan Ayah',
  'Nama Ibu',
  'Pekerjaan Ibu',
  'Asal Sekolah',
  'Status Siswa (Aktif/Lulus/Mutasi Keluar)',
];

const CSV_SAMPLE_ROWS = [
  '24251010,0081234567,3174091204080001,Ahmad Fauzan Nugraha,Fauzan,L,Jakarta,2008-04-12,Islam,X MIPA 1,Jl. Fatmawati No. 15,Cilandak Barat,Cilandak,Jakarta Selatan,081234567890,H. Nugraha Pratama,Wiraswasta,Hj. Maryam,Guru,SMP Negeri 41 Jakarta,Aktif',
  '24251011,0087654321,3174095508080002,Siti Nurhaliza Putri,Liza,P,Bogor,2008-08-15,Islam,X MIPA 1,Jl. Kemang Raya No. 24,Bangka,Mampang Prapatan,Jakarta Selatan,081298765432,Drs. Suryadi,PNS,Dewi Sartika,Ibu Rumah Tangga,SMP Negeri 19 Jakarta,Aktif',
  '24251012,0089988776,3174092101080003,Jonathan Christian Lee,Nathan,L,Surabaya,2008-01-21,Kristen,X MIPA 2,Jl. TB Simatupang No. 8,Ragunan,Pasar Minggu,Jakarta Selatan,081388990011,David Lee,Karyawan Swasta,Jessica Tan,Akuntan,SMP Kanisius Jakarta,Aktif',
];

export const StudentUploadModal: React.FC<StudentUploadModalProps> = ({
  isOpen,
  onClose,
  onImportStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('paste');
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedRows, setParsedRows] = useState<Student[]>([]);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);
  const [copiedSample, setCopiedSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Detect delimiter: tab, semicolon, or comma
  const detectDelimiter = (sampleLine: string): string => {
    const tabs = (sampleLine.match(/\t/g) || []).length;
    const semicolons = (sampleLine.match(/;/g) || []).length;
    const commas = (sampleLine.match(/,/g) || []).length;

    if (tabs >= semicolons && tabs >= commas && tabs > 0) return '\t';
    if (semicolons > commas && semicolons > 0) return ';';
    return ',';
  };

  // Parse CSV/TSV row handling quoted strings
  const parseRowValues = (rowText: string, delimiter: string): string[] => {
    const values: string[] = [];
    let curVal = '';
    let inQuotes = false;

    for (let i = 0; i < rowText.length; i++) {
      const char = rowText[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        values.push(curVal.trim());
        curVal = '';
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim());
    return values;
  };

  const handleProcessText = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedRows([]);
      setParsingErrors([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedRows([]);
      return;
    }

    const firstLine = lines[0];
    const delimiter = detectDelimiter(firstLine);
    
    // Check if first line is a header
    const lowerFirst = firstLine.toLowerCase();
    const isHeader = lowerFirst.includes('nama') || lowerFirst.includes('nis') || lowerFirst.includes('nisn');
    const dataLines = isHeader ? lines.slice(1) : lines;

    const students: Student[] = [];
    const errors: string[] = [];

    dataLines.forEach((line, index) => {
      const cols = parseRowValues(line, delimiter);
      if (cols.length < 2) return; // Skip empty / corrupt line

      // Expected columns:
      // 0: NIS, 1: NISN, 2: NIK, 3: Nama Lengkap, 4: Nama Panggilan, 5: Jenis Kelamin,
      // 6: Tempat Lahir, 7: Tanggal Lahir, 8: Agama, 9: Kelas, 10: Jalan, 11: Kelurahan,
      // 12: Kecamatan, 13: Kab/Kota, 14: No HP Siswa, 15: Nama Ayah, 16: Pekerjaan Ayah,
      // 17: Nama Ibu, 18: Pekerjaan Ibu, 19: Asal Sekolah, 20: Status Siswa
      const nis = cols[0] || `2425${Math.floor(1000 + Math.random() * 9000)}`;
      const nisn = cols[1] || `008${Math.floor(1000000 + Math.random() * 9000000)}`;
      const nik = cols[2] || `3174${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const namaLengkap = cols[3] || cols[0] || '';
      
      if (!namaLengkap) {
        errors.push(`Baris ${index + (isHeader ? 2 : 1)}: Nama Lengkap kosong.`);
        return;
      }

      const namaPanggilan = cols[4] || namaLengkap.split(' ')[0] || '';
      const rawGender = (cols[5] || 'L').toUpperCase().trim();
      const jenisKelamin: 'L' | 'P' = rawGender.startsWith('P') ? 'P' : 'L';
      const tempatLahir = cols[6] || 'Jakarta';
      const tanggalLahir = cols[7] || '2008-01-01';
      const rawAgama = cols[8] || 'Islam';
      const kelasSekarang = cols[9] || 'X MIPA 1';
      const jalan = cols[10] || 'Jl. Pendidikan No. 1';
      const kelurahan = cols[11] || 'Kebayoran';
      const kecamatan = cols[12] || 'Kebayoran Baru';
      const kabupatenKota = cols[13] || 'Jakarta Selatan';
      const noHpSiswa = cols[14] || '';
      const namaAyah = cols[15] || 'Orang Tua Siswa';
      const pekerjaanAyah = cols[16] || 'Wiraswasta';
      const namaIbu = cols[17] || 'Ibu Siswa';
      const pekerjaanIbu = cols[18] || 'Ibu Rumah Tangga';
      const asalSekolah = cols[19] || 'SMP Negeri';
      const rawStatus = (cols[20] || 'Aktif').trim();
      const statusSiswa: Student['statusSiswa'] = 
        rawStatus.toLowerCase().includes('lulus') ? 'Lulus' :
        rawStatus.toLowerCase().includes('mutasi') ? 'Mutasi Keluar' :
        rawStatus.toLowerCase().includes('drop') ? 'Drop Out' : 'Aktif';

      const defaultFotoMasuk = jenisKelamin === 'P'
        ? '/src/assets/images/student_portrait_female_1792639265920.jpg'
        : '/src/assets/images/student_portrait_male_1792639263730.jpg';

      const defaultFotoKeluar = jenisKelamin === 'P'
        ? '/src/assets/images/student_grad_female_1792829508677.jpg'
        : '/src/assets/images/student_grad_male_1792829508541.jpg';

      students.push({
        id: `std-imp-${Date.now()}-${index}`,
        nis,
        nisn,
        nik,
        namaLengkap,
        namaPanggilan,
        jenisKelamin,
        tempatLahir,
        tanggalLahir,
        agama: (['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'].includes(rawAgama) ? rawAgama : 'Islam') as any,
        kewarganegaraan: 'WNI',
        anakKe: 1,
        jumlahSaudara: 1,
        statusAnak: 'Kandung',
        bahasaSehariHari: 'Bahasa Indonesia',
        kelasSekarang,
        statusSiswa,
        fotoUrl: defaultFotoMasuk,
        fotoMasukUrl: defaultFotoMasuk,
        fotoKeluarUrl: statusSiswa === 'Lulus' ? defaultFotoKeluar : undefined,
        alamat: {
          jalan,
          rt: '01',
          rw: '01',
          kelurahan,
          kecamatan,
          kabupatenKota,
          provinsi: 'DKI Jakarta',
          kodePos: '12130',
          tinggalDengan: 'Orang Tua',
          noHpSiswa,
          emailSiswa: '',
          jarakKeSekolah: '1 km',
        },
        orangTua: {
          ayah: {
            nama: namaAyah,
            nik: '',
            tahunLahir: '1975',
            pendidikan: 'S1',
            pekerjaan: pekerjaanAyah,
            penghasilan: 'Rp 5.000.000 - Rp 10.000.000',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
          ibu: {
            nama: namaIbu,
            nik: '',
            tahunLahir: '1978',
            pendidikan: 'S1',
            pekerjaan: pekerjaanIbu,
            penghasilan: 'Rp 5.000.000 - Rp 10.000.000',
            noHp: '',
            statusHidup: 'Masih Hidup',
          },
        },
        riwayatPendidikan: {
          asalSekolah,
          noPesertaUjian: '',
          noIjazahSebelumnya: '',
          tanggalDiterima: new Date().toISOString().split('T')[0],
          masukKelas: kelasSekarang,
          statusMasuk: 'Siswa Baru',
        },
      });
    });

    setParsedRows(students);
    setParsingErrors(errors);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      handleProcessText(content);
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      CSV_HEADER_COLUMNS.join(','),
      ...CSV_SAMPLE_ROWS,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Template_Buku_Induk_Siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopySample = () => {
    const sample = [
      CSV_HEADER_COLUMNS.join('\t'),
      CSV_SAMPLE_ROWS[0].replace(/,/g, '\t'),
      CSV_SAMPLE_ROWS[1].replace(/,/g, '\t'),
      CSV_SAMPLE_ROWS[2].replace(/,/g, '\t'),
    ].join('\n');

    navigator.clipboard.writeText(sample);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleLoadSampleToBox = () => {
    const sample = [
      CSV_HEADER_COLUMNS.join(','),
      ...CSV_SAMPLE_ROWS,
    ].join('\n');
    handleProcessText(sample);
  };

  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;
    onImportStudents(parsedRows, importMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-emerald-700 rounded-lg text-white">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Unggah & Impor Siswa Masal (CSV / TSV)</h2>
              <p className="text-[11px] text-slate-300">
                Impor data siswa dari berkas CSV atau tempel teks dari Excel / Google Sheets
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* Action Row: Template & Samples */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 block text-xs">Belum memiliki format kolom?</span>
              <span className="text-[11px] text-slate-500">
                Gunakan template resmi agar seluruh kolom biodata, orang tua, dan kelas terisi akurat.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Template CSV</span>
              </button>
              <button
                type="button"
                onClick={handleCopySample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                title="Salin contoh baris TSV ke clipboard untuk dicoba paste di Excel"
              >
                {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSample ? 'Tersalin!' : 'Salin Contoh Tab'}</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleToBox}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
              >
                Muat Contoh Demo
              </button>
            </div>
          </div>

          {/* Mode Selector Tabs: Paste text vs Upload file */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Tempel Teks (Paste CSV / TSV / Excel)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Berkas File (.csv / .tsv / .txt)</span>
            </button>
          </div>

          {/* Tab 1: Paste Teks */}
          {activeTab === 'paste' && (
            <div className="space-y-2">
              <label className="block text-slate-700 font-semibold text-xs">
                Tempel Data CSV atau Hasil Copy-Paste dari Spreadsheet / Excel:
              </label>
              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => handleProcessText(e.target.value)}
                placeholder="Tempel baris CSV atau baris dari Excel di sini (dipisahkan koma, titik koma, atau tab)..."
                className="w-full p-3 font-mono text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800 leading-relaxed"
              />
              <span className="text-[11px] text-slate-400 block">
                * Sistem otomatis mendeteksi pemisah koma (,), titik koma (;), maupun tab (\t) dari Excel.
              </span>
            </div>
          )}

          {/* Tab 2: Upload File */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-700 rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <div className="font-semibold text-slate-800 text-xs">
                  {fileName ? `Berkas terpilih: ${fileName}` : 'Klik untuk memilih berkas CSV atau TSV'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Mendukung format .csv, .tsv, atau berkas ekspor teks dari Excel / Google Sheets
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Parsing Errors Warning */}
          {parsingErrors.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>Peringatan Pembacaan Data:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] space-y-0.5">
                {parsingErrors.slice(0, 3).map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Live Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs space-y-3 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-800" />
                  <span className="font-bold text-slate-900 text-xs">
                    Pratinjau Data yang Terdeteksi: <span className="text-emerald-800 font-mono tabular-nums">{parsedRows.length} Siswa</span>
                  </span>
                </div>

                {/* Import Mode Options */}
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-emerald-800 focus:ring-emerald-800"
                    />
                    <span>Tambahkan ke data yang ada (Append)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-900">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-amber-800 focus:ring-amber-800"
                    />
                    <span>Gantikan data lama (Replace)</span>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto max-h-52">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2.5">No</th>
                      <th className="py-2 px-2.5">Nama Lengkap</th>
                      <th className="py-2 px-2.5">NISN / NIS</th>
                      <th className="py-2 px-2.5">L/P</th>
                      <th className="py-2 px-2.5">Kelas</th>
                      <th className="py-2 px-2.5">TTL</th>
                      <th className="py-2 px-2.5">Orang Tua</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {parsedRows.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-1.5 px-2.5 font-mono text-slate-400 tabular-nums">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">{row.namaLengkap}</td>
                        <td className="py-1.5 px-2.5 font-mono text-slate-600">{row.nisn} / {row.nis}</td>
                        <td className="py-1.5 px-2.5">{row.jenisKelamin}</td>
                        <td className="py-1.5 px-2.5 font-medium text-slate-800">{row.kelasSekarang}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{row.tempatLahir}, {row.tanggalLahir}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">{row.orangTua.ayah.nama}</td>
                        <td className="py-1.5 px-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 font-medium">
                            {row.statusSiswa}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 10 && (
                <div className="text-[11px] text-slate-400 text-center pt-1">
                  ... dan {parsedRows.length - 10} baris siswa lainnya siap dimasukkan ke buku induk.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {parsedRows.length > 0 ? (
              <span className="font-medium text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Siap mengimpor {parsedRows.length} siswa baru</span>
              </span>
            ) : (
              <span>Pilih file atau tempel teks untuk memulai</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={parsedRows.length === 0}
              onClick={handleCommitImport}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                parsedRows.length > 0
                  ? 'bg-emerald-800 text-white hover:bg-emerald-900 cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Impor {parsedRows.length} Siswa ke Buku Induk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
