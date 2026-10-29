import React, { useState, useRef } from 'react';
import { SchoolProfile } from '../types';
import { X, Building2, Save, Upload, Image as ImageIcon, Calendar } from 'lucide-react';

interface SchoolSettingsModalProps {
  isOpen: boolean;
  school: SchoolProfile;
  onClose: () => void;
  onSave: (updated: SchoolProfile) => void;
}

export const SchoolSettingsModal: React.FC<SchoolSettingsModalProps> = ({
  isOpen,
  school,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>({
    ...school,
    tanggalRapor: school.tanggalRapor || '2024-06-21',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file logo maksimal 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData(prev => ({ ...prev, logoUrl: event.target!.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div 
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">Identitas Sekolah & Kop Surat</h2>
              <p className="text-[11px] text-slate-300">Format legalitas buku induk, rapor cetak, dan sinkronisasi data cloud</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {/* Logo Sekolah */}
          <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-16 h-16 rounded-lg bg-white border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center">
              {formData.logoUrl ? (
                <img 
                  src={formData.logoUrl} 
                  alt="Logo Sekolah" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Logo Sekolah (Kop Surat & Rapor)
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Format PNG/JPG (disarankan latar transparan, maks. 2MB). Otomatis tersimpan ke Google Drive saat sinkronisasi.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Pilih Logo Baru</span>
                </button>
                {formData.logoUrl && formData.logoUrl.startsWith('https://') && (
                  <span className="text-[11px] text-emerald-700 font-medium">
                    Tersimpan di Cloud Google Drive
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-600 mb-1 font-semibold">Nama Resmi Sekolah *</label>
              <input
                type="text"
                required
                value={formData.namaSekolah}
                onChange={e => setFormData({ ...formData, namaSekolah: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">NPSN</label>
              <input
                type="text"
                value={formData.npsn}
                onChange={e => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">NSS</label>
              <input
                type="text"
                value={formData.nss}
                onChange={e => setFormData({ ...formData, nss: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Status Akreditasi</label>
              <input
                type="text"
                value={formData.akreditasi}
                onChange={e => setFormData({ ...formData, akreditasi: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Provinsi</label>
              <input
                type="text"
                value={formData.provinsi}
                onChange={e => setFormData({ ...formData, provinsi: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 mb-1 font-semibold">Alamat Jalan Lengkap</label>
              <input
                type="text"
                value={formData.alamat}
                onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Kecamatan</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={e => setFormData({ ...formData, kecamatan: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Kabupaten / Kota</label>
              <input
                type="text"
                value={formData.kabupatenKota}
                onChange={e => setFormData({ ...formData, kabupatenKota: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">No. Telepon</label>
              <input
                type="text"
                value={formData.telepon}
                onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Email Resmi</label>
              <input
                type="text"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white"
              />
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-3">
              <h3 className="font-bold text-slate-900 text-xs mb-2 text-emerald-800 flex items-center gap-1.5">
                <span>Pengesahan Kepala Sekolah & Rapor</span>
              </h3>
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Nama Kepala Sekolah *</label>
              <input
                type="text"
                required
                value={formData.namaKepalaSekolah}
                onChange={e => setFormData({ ...formData, namaKepalaSekolah: e.target.value })}
                placeholder="Contoh: Drs. H. Bambang Sudarsono, M.Pd."
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">NIP Kepala Sekolah *</label>
              <input
                type="text"
                required
                value={formData.nipKepalaSekolah}
                onChange={e => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                placeholder="19680514 199303 1 004"
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-600 mb-1 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tanggal Pembagian Rapor (Default Cetak)</span>
              </label>
              <input
                type="date"
                value={formData.tanggalRapor || ''}
                onChange={e => setFormData({ ...formData, tanggalRapor: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Identitas Sekolah</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
