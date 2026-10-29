/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Student,
  PerkembanganSiswa,
  NilaiSemester,
  SelesaiStudiMutasi,
  SchoolProfile,
  SyncState,
  TeacherUser,
} from './types';
import {
  INITIAL_SCHOOL_PROFILE,
  INITIAL_STUDENTS,
  INITIAL_PERKEMBANGAN,
  INITIAL_NILAI,
  INITIAL_SELESAI_STUDI,
  INITIAL_TEACHERS,
} from './data/initialData';
import { initAuth } from './services/googleAuth';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StudentListView } from './components/StudentListView';
import { StudentDetailModal } from './components/StudentDetailModal';
import { StudentFormModal } from './components/StudentFormModal';
import { GradesManagerView } from './components/GradesManagerView';
import { PrintCenterView } from './components/PrintCenterView';
import { PrintMasterBook } from './components/PrintMasterBook';
import { PrintGradesSheet } from './components/PrintGradesSheet';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { StudentUploadModal } from './components/StudentUploadModal';
import { TeachersManagementModal } from './components/TeachersManagementModal';
import { UserLoginModal } from './components/UserLoginModal';

function deduplicateStudents(studentList: Student[]): Student[] {
  const seenIds = new Set<string>();
  return studentList.map((s, idx) => {
    if (!s.id || seenIds.has(s.id)) {
      const uniqueId = s.id ? `${s.id}-dup-${idx}-${Date.now().toString().slice(-4)}` : `std-${Date.now()}-${idx}`;
      seenIds.add(uniqueId);
      return { ...s, id: uniqueId };
    }
    seenIds.add(s.id);
    return s;
  });
}

export default function App() {
  // Primary datasets
  const [school, setSchool] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem('buku_induk_school');
    return saved ? JSON.parse(saved) : INITIAL_SCHOOL_PROFILE;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('buku_induk_students');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateStudents(parsed);
        }
      } catch (e) {
        console.error('Error loading saved students:', e);
      }
    }
    return INITIAL_STUDENTS;
  });

  const [perkembangan, setPerkembangan] = useState<PerkembanganSiswa[]>(() => {
    const saved = localStorage.getItem('buku_induk_perkembangan');
    return saved ? JSON.parse(saved) : INITIAL_PERKEMBANGAN;
  });

  const [nilaiList, setNilaiList] = useState<NilaiSemester[]>(() => {
    const saved = localStorage.getItem('buku_induk_nilai');
    return saved ? JSON.parse(saved) : INITIAL_NILAI;
  });

  const [kelulusanMutasi, setKelulusanMutasi] = useState<SelesaiStudiMutasi[]>(() => {
    const saved = localStorage.getItem('buku_induk_kelulusan');
    return saved ? JSON.parse(saved) : INITIAL_SELESAI_STUDI;
  });

  // Guru & Staf (Terintegrasi Akun Login & RBAC)
  const [teachers, setTeachers] = useState<TeacherUser[]>(() => {
    const saved = localStorage.getItem('buku_induk_teachers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return INITIAL_TEACHERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('buku_induk_current_user_id') || 'tch-001';
  });

  const currentUser = teachers.find(t => t.id === currentUserId) || teachers[0] || INITIAL_TEACHERS[0];

  // Google Sheets state
  const [syncState, setSyncState] = useState<SyncState>(() => {
    const saved = localStorage.getItem('buku_induk_sync');
    const savedWebhook = localStorage.getItem('appscript_webhook_url');
    return saved ? JSON.parse(saved) : {
      isConnected: false,
      syncMethod: 'webhook',
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetTitle: null,
      lastSyncedAt: null,
      isSyncing: false,
      userEmail: null,
      webhookUrl: savedWebhook || null,
      webhookConnected: Boolean(savedWebhook),
      webhookLastSync: null,
    };
  });

  // Navigation & View states
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [printMasterBookStudentId, setPrintMasterBookStudentId] = useState<string | null>(null);
  const [printGradesConfig, setPrintGradesConfig] = useState<{ studentId: string; semester: number } | null>(null);

  // Modals
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [isTeachersModalOpen, setIsTeachersModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);
  const [selectedStudentDetailId, setSelectedStudentDetailId] = useState<string | null>(null);
  const [gradesTarget, setGradesTarget] = useState<{ studentId: string; semester: number } | null>(null);

  // Confirmation Modal state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    affectedCount?: number;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('buku_induk_school', JSON.stringify(school));
  }, [school]);

  useEffect(() => {
    localStorage.setItem('buku_induk_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('buku_induk_perkembangan', JSON.stringify(perkembangan));
  }, [perkembangan]);

  useEffect(() => {
    localStorage.setItem('buku_induk_nilai', JSON.stringify(nilaiList));
  }, [nilaiList]);

  useEffect(() => {
    localStorage.setItem('buku_induk_kelulusan', JSON.stringify(kelulusanMutasi));
  }, [kelulusanMutasi]);

  useEffect(() => {
    localStorage.setItem('buku_induk_sync', JSON.stringify(syncState));
  }, [syncState]);

  useEffect(() => {
    localStorage.setItem('buku_induk_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('buku_induk_current_user_id', currentUserId);
  }, [currentUserId]);

  // Handlers for Teachers & RBAC
  const handleSaveTeacher = (teacherData: TeacherUser) => {
    setTeachers(prev => {
      const idx = prev.findIndex(t => t.id === teacherData.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = teacherData;
        return updated;
      }
      return [...prev, teacherData];
    });
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleSwitchUser = (teacher: TeacherUser) => {
    setCurrentUserId(teacher.id);
  };

  // Google OAuth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setSyncState(prev => ({
          ...prev,
          isConnected: true,
          userEmail: user.email,
        }));
      },
      () => {
        setSyncState(prev => ({
          ...prev,
          isConnected: false,
          userEmail: null,
        }));
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // Handlers for Students
  const handleOpenAddStudent = () => {
    setStudentToEdit(null);
    setIsStudentFormOpen(true);
  };

  const handleOpenEditStudent = (student: Student) => {
    setStudentToEdit(student);
    setIsStudentFormOpen(true);
  };

  const handleSaveStudent = (studentData: Student) => {
    setStudents(prev => {
      const idx = prev.findIndex(s => s.id === studentData.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = studentData;
        return updated;
      } else {
        return [studentData, ...prev];
      }
    });

    // Ensure perkembangan entry exists
    setPerkembangan(prev => {
      if (!prev.some(p => p.studentId === studentData.id)) {
        return [
          ...prev,
          {
            studentId: studentData.id,
            kesehatan: [
              {
                semester: 1,
                tahunAjaran: '2023/2024',
                tinggiBadan: 165,
                beratBadan: 55,
                golonganDarah: 'O',
                kelainanFisik: 'Tidak Ada',
                riwayatPenyakit: 'Sehat',
              },
            ],
            prestasi: [],
            karakter: [
              {
                semester: 1,
                tahunAjaran: '2023/2024',
                kelakuan: 'Baik',
                kerajinan: 'Baik',
                kerapian: 'Baik',
                kehadiran: { sakit: 0, izin: 0, alpa: 0 },
                catatanBK: 'Siswa baru beradaptasi dengan baik di lingkungan sekolah.',
              },
            ],
          },
        ];
      }
      return prev;
    });

    // Ensure kelulusan entry exists
    setKelulusanMutasi(prev => {
      if (!prev.some(k => k.studentId === studentData.id)) {
        return [
          ...prev,
          {
            studentId: studentData.id,
            statusAkhir: studentData.statusSiswa === 'Aktif' ? 'Belum Selesai' : studentData.statusSiswa as any,
          },
        ];
      }
      return prev;
    });

    setIsStudentFormOpen(false);
  };

  const handleDeleteStudent = (student: Student) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Hapus Siswa dari Buku Induk?',
      message: `Apakah Anda yakin ingin menghapus arsip siswa "${student.namaLengkap}" (NISN: ${student.nisn})? Seluruh data nilai, rekam perkembangan, dan riwayat studi terkait akan ikut dihapus.`,
      isDestructive: true,
      onConfirm: async () => {
        const remainingStudents = students.filter(s => s.id !== student.id);
        const remainingPerkembangan = perkembangan.filter(p => p.studentId !== student.id);
        const remainingNilai = nilaiList.filter(n => n.studentId !== student.id);
        const remainingKelulusan = kelulusanMutasi.filter(k => k.studentId !== student.id);

        setStudents(remainingStudents);
        setPerkembangan(remainingPerkembangan);
        setNilaiList(remainingNilai);
        setKelulusanMutasi(remainingKelulusan);
        setConfirmConfig(c => ({ ...c, isOpen: false }));

        // Auto-sync deletion to Google Sheets if connected
        if (syncState.isConnected && syncState.spreadsheetId) {
          try {
            const { getAccessToken } = await import('./services/googleAuth');
            const token = await getAccessToken();
            if (token) {
              const { writeAllSheetsData } = await import('./services/googleSheets');
              await writeAllSheetsData(token, syncState.spreadsheetId, {
                students: remainingStudents,
                perkembangan: remainingPerkembangan,
                nilaiList: remainingNilai,
                kelulusanMutasi: remainingKelulusan,
              });
              setSyncState(s => ({
                ...s,
                lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
              }));
            }
          } catch (syncErr) {
            console.error('Gagal menyinkronkan penghapusan siswa ke Google Sheets:', syncErr);
          }
        }
      },
    });
  };

  const handleImportStudents = (newStudents: Student[], mode: 'append' | 'replace') => {
    const newPerkembangan: PerkembanganSiswa[] = newStudents.map(s => ({
      studentId: s.id,
      kesehatan: [
        {
          semester: 1,
          tahunAjaran: '2024/2025',
          tinggiBadan: s.jenisKelamin === 'L' ? 168 : 160,
          beratBadan: s.jenisKelamin === 'L' ? 58 : 48,
          golonganDarah: 'O',
          kelainanFisik: 'Tidak Ada',
          riwayatPenyakit: 'Sehat',
        },
      ],
      prestasi: [],
      karakter: [
        {
          semester: 1,
          tahunAjaran: '2024/2025',
          kelakuan: 'Baik',
          kerajinan: 'Baik',
          kerapian: 'Baik',
          kehadiran: { sakit: 0, izin: 0, alpa: 0 },
          catatanBK: 'Data siswa baru diimpor ke buku induk.',
        },
      ],
    }));

    const newKelulusan: SelesaiStudiMutasi[] = newStudents.map(s => ({
      studentId: s.id,
      statusAkhir: s.statusSiswa === 'Aktif' ? 'Belum Selesai' : (s.statusSiswa as any),
      kelulusan: s.statusSiswa === 'Lulus' ? {
        tanggalLulus: '2025-05-15',
        noIjazah: `DN-01/M-SMA/K13/25/${Math.floor(1000000 + Math.random() * 9000000)}`,
        melanjutkanKe: 'Perguruan Tinggi',
      } : undefined,
    }));

    if (mode === 'replace') {
      setStudents(deduplicateStudents(newStudents));
      setPerkembangan(newPerkembangan);
      setKelulusanMutasi(newKelulusan);
    } else {
      setStudents(prev => deduplicateStudents([...newStudents, ...prev]));
      setPerkembangan(prev => [...newPerkembangan, ...prev]);
      setKelulusanMutasi(prev => [...newKelulusan, ...prev]);
    }
  };

  // Handlers for Grades
  const handleSaveNilai = (updatedNilai: NilaiSemester) => {
    setNilaiList(prev => {
      const idx = prev.findIndex(n => n.id === updatedNilai.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedNilai;
        return copy;
      }
      return [...prev, updatedNilai];
    });
  };

  // Handlers for Print Views
  const handleOpenPrintMasterBook = (studentId: string) => {
    setPrintMasterBookStudentId(studentId);
    setSelectedStudentDetailId(null);
  };

  const handleOpenPrintGrades = (studentId: string, semester: number) => {
    setPrintGradesConfig({ studentId, semester });
    setSelectedStudentDetailId(null);
  };

  const handleNavigateToGradesInput = (studentId: string, semester: number) => {
    setGradesTarget({ studentId, semester });
    setSelectedStudentDetailId(null);
    setActiveTab('grades');
  };

  // If in Print Master Book mode
  if (printMasterBookStudentId) {
    const student = students.find(s => s.id === printMasterBookStudentId);
    if (!student) {
      setPrintMasterBookStudentId(null);
      return null;
    }
    const studentPerkembangan = perkembangan.find(p => p.studentId === student.id);
    const studentKelulusan = kelulusanMutasi.find(k => k.studentId === student.id);

    return (
      <PrintMasterBook
        student={student}
        perkembangan={studentPerkembangan}
        kelulusanMutasi={studentKelulusan}
        school={school}
        onBack={() => setPrintMasterBookStudentId(null)}
      />
    );
  }

  // If in Print Grades Report mode
  if (printGradesConfig) {
    const student = students.find(s => s.id === printGradesConfig.studentId);
    const grade = nilaiList.find(
      n => n.studentId === printGradesConfig.studentId && n.semester === printGradesConfig.semester
    );

    if (!student) {
      setPrintGradesConfig(null);
      return null;
    }

    // If grade does not exist yet, generate standard template for preview
    const fallbackGrade: NilaiSemester = grade || {
      id: `nil-${student.id}-${printGradesConfig.semester}`,
      studentId: student.id,
      semester: printGradesConfig.semester,
      kelas: student.kelasSekarang,
      tahunAjaran: '2023/2024',
      mataPelajaran: [
        { kode: 'PAI', nama: 'Pendidikan Agama dan Budi Pekerti', kelompok: 'Kelompok A (Umum)', kkm: 75, nilaiPengetahuan: 88, predikatPengetahuan: 'A', nilaiKeterampilan: 90, predikatKeterampilan: 'A', deskripsiCapaian: 'Memahami akidah dan akhlak mulia dengan baik.' },
        { kode: 'PPKN', nama: 'Pendidikan Pancasila dan Kewarganegaraan', kelompok: 'Kelompok A (Umum)', kkm: 75, nilaiPengetahuan: 87, predikatPengetahuan: 'B', nilaiKeterampilan: 89, predikatKeterampilan: 'A', deskripsiCapaian: 'Memahami hak dan kewajiban warga negara.' },
        { kode: 'BIND', nama: 'Bahasa Indonesia', kelompok: 'Kelompok A (Umum)', kkm: 75, nilaiPengetahuan: 91, predikatPengetahuan: 'A', nilaiKeterampilan: 92, predikatKeterampilan: 'A', deskripsiCapaian: 'Sangat mahir dalam menyusun teks eksposisi dan ulasan buku.' },
        { kode: 'MAT', nama: 'Matematika (Wajib)', kelompok: 'Kelompok A (Umum)', kkm: 75, nilaiPengetahuan: 92, predikatPengetahuan: 'A', nilaiKeterampilan: 94, predikatKeterampilan: 'A', deskripsiCapaian: 'Unggul dalam penyelesaian sistem aljabar dan geometri.' },
        { kode: 'BING', nama: 'Bahasa Inggris', kelompok: 'Kelompok A (Umum)', kkm: 75, nilaiPengetahuan: 93, predikatPengetahuan: 'A', nilaiKeterampilan: 95, predikatKeterampilan: 'A', deskripsiCapaian: 'Articulate conversational expression and reading comprehension.' },
      ],
      ekstrakurikuler: [
        { nama: 'Pramuka Wajib', predikat: 'Sangat Baik', keterangan: 'Aktif dalam giat perkemahan.' },
      ],
      catatanWaliKelas: 'Tingkatkan terus prestasi belajar dan pertahankan akhlak mulia.',
      statusKenaikan: 'Sedang Berjalan',
    };

    const studentPerkembangan = perkembangan.find(p => p.studentId === student.id);

    return (
      <PrintGradesSheet
        student={student}
        nilaiSemester={fallbackGrade}
        school={school}
        perkembangan={studentPerkembangan}
        onBack={() => setPrintGradesConfig(null)}
      />
    );
  }

  const selectedStudentForDetail = students.find(s => s.id === selectedStudentDetailId);
  const selectedStudentPerkembangan = perkembangan.find(p => p.studentId === selectedStudentDetailId);
  const selectedStudentNilai = nilaiList.filter(n => n.studentId === selectedStudentDetailId);
  const selectedStudentKelulusan = kelulusanMutasi.find(k => k.studentId === selectedStudentDetailId);

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        school={school}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        syncState={syncState}
        currentUser={currentUser}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenSchoolModal={() => setIsSchoolModalOpen(true)}
        onOpenTeachersModal={() => setIsTeachersModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            perkembangan={perkembangan}
            nilaiList={nilaiList}
            school={school}
            syncState={syncState}
            onNavigateTab={setActiveTab}
            onOpenAddModal={handleOpenAddStudent}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onSelectStudentDetail={setSelectedStudentDetailId}
            onOpenPrintMasterBook={handleOpenPrintMasterBook}
          />
        )}

        {activeTab === 'students' && (
          <StudentListView
            students={students}
            currentUser={currentUser}
            onOpenAddModal={handleOpenAddStudent}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onOpenEditModal={handleOpenEditStudent}
            onSelectStudentDetail={setSelectedStudentDetailId}
            onOpenPrintMasterBook={handleOpenPrintMasterBook}
            onDeleteStudent={handleDeleteStudent}
          />
        )}

        {activeTab === 'grades' && (
          <GradesManagerView
            students={students}
            nilaiList={nilaiList}
            currentUser={currentUser}
            selectedStudentId={gradesTarget?.studentId}
            initialSemester={gradesTarget?.semester || 1}
            onSaveNilai={handleSaveNilai}
            onPrintGrades={handleOpenPrintGrades}
          />
        )}

        {activeTab === 'print' && (
          <PrintCenterView
            students={students}
            nilaiList={nilaiList}
            school={school}
            onOpenPrintMasterBook={handleOpenPrintMasterBook}
            onOpenPrintGrades={handleOpenPrintGrades}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Buku Induk Siswa Digital © {new Date().getFullYear()} · {school.namaSekolah}
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>NPSN: {school.npsn}</span>
            <span aria-hidden="true">·</span>
            <button 
              onClick={() => setIsSheetsModalOpen(true)} 
              className="text-emerald-800 hover:underline font-semibold"
            >
              Sinkronisasi Cloud & Sheets
            </button>
            <span aria-hidden="true">·</span>
            {currentUser.role === 'admin' && (
              <>
                <button 
                  onClick={() => setIsTeachersModalOpen(true)} 
                  className="text-indigo-700 hover:underline font-semibold"
                >
                  Kelola Guru & Staf
                </button>
                <span aria-hidden="true">·</span>
                <button 
                  onClick={() => setIsSchoolModalOpen(true)} 
                  className="text-slate-600 hover:underline"
                >
                  Ubah Identitas Sekolah
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <StudentDetailModal
        isOpen={Boolean(selectedStudentDetailId)}
        student={selectedStudentForDetail || null}
        perkembangan={selectedStudentPerkembangan}
        nilaiList={selectedStudentNilai}
        kelulusanMutasi={selectedStudentKelulusan}
        onClose={() => setSelectedStudentDetailId(null)}
        onEdit={(s) => {
          setSelectedStudentDetailId(null);
          handleOpenEditStudent(s);
        }}
        onPrintMasterBook={handleOpenPrintMasterBook}
        onPrintGrades={handleOpenPrintGrades}
        onNavigateToGradesInput={handleNavigateToGradesInput}
      />

      <StudentFormModal
        isOpen={isStudentFormOpen}
        studentToEdit={studentToEdit}
        onClose={() => setIsStudentFormOpen(false)}
        onSave={handleSaveStudent}
      />

      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        syncState={syncState}
        school={school}
        teachers={teachers}
        students={students}
        perkembangan={perkembangan}
        nilaiList={nilaiList}
        kelulusanMutasi={kelulusanMutasi}
        onClose={() => setIsSheetsModalOpen(false)}
        onUpdateSyncState={(partial) => setSyncState(prev => ({ ...prev, ...partial }))}
        onImportData={(imported) => {
          if (imported.students?.length) setStudents(deduplicateStudents(imported.students));
          if (imported.perkembangan?.length) setPerkembangan(imported.perkembangan);
          if (imported.nilaiList?.length) setNilaiList(imported.nilaiList);
          if (imported.kelulusanMutasi?.length) setKelulusanMutasi(imported.kelulusanMutasi);
          if (imported.school) setSchool(imported.school);
          if (imported.teachers?.length) setTeachers(imported.teachers);
        }}
        onRequestConfirm={({ title, message, onConfirm }) => {
          setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
              onConfirm();
              setConfirmConfig(c => ({ ...c, isOpen: false }));
            },
          });
        }}
      />

      <SchoolSettingsModal
        isOpen={isSchoolModalOpen}
        school={school}
        onClose={() => setIsSchoolModalOpen(false)}
        onSave={setSchool}
      />

      <TeachersManagementModal
        isOpen={isTeachersModalOpen}
        currentUser={currentUser}
        teachers={teachers}
        onClose={() => setIsTeachersModalOpen(false)}
        onSaveTeacher={handleSaveTeacher}
        onDeleteTeacher={handleDeleteTeacher}
        onRequestConfirm={({ title, message, onConfirm }) => {
          setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
              onConfirm();
              setConfirmConfig(c => ({ ...c, isOpen: false }));
            },
          });
        }}
      />

      <UserLoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        teachers={teachers}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchUser={handleSwitchUser}
      />

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isDestructive={confirmConfig.isDestructive}
        affectedCount={confirmConfig.affectedCount}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
      />

      <StudentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportStudents={handleImportStudents}
      />
    </div>
  );
}
