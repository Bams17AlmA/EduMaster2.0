/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { loadDatabase, saveDatabase, AppDatabase } from './services/storage';
import { Header } from './components/Header';
import { Sidebar, NavView } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentsView } from './components/StudentsView';
import { EnrollmentsView } from './components/EnrollmentsView';
import { ClassesView } from './components/ClassesView';
import { TeachersView } from './components/TeachersView';
import { GradesBulletinsView } from './components/GradesBulletinsView';
import { FinancesView } from './components/FinancesView';
import { DocumentsView } from './components/DocumentsView';
import { UsersAuditView } from './components/UsersAuditView';
import { SettingsBackupView } from './components/SettingsBackupView';
import { SqliteStudioView } from './components/SqliteStudioView';
import { PrintTemplates, PrintMode } from './components/PrintTemplates';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Payment, Student, SchoolClass } from './types';
import { StudentReportSummary } from './utils/helpers';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => loadDatabase());
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [printMode, setPrintMode] = useState<PrintMode | null>(null);

  useEffect(() => {
    const handleNavToSqlite = () => setCurrentView('sqlite');
    window.addEventListener('nav-to-sqlite', handleNavToSqlite);
    return () => window.removeEventListener('nav-to-sqlite', handleNavToSqlite);
  }, []);

  // Sync to localStorage on update
  const handleUpdateDb = (updated: AppDatabase) => {
    setDb(updated);
    saveDatabase(updated);
  };

  // Quick print handlers
  const handlePrintReceipt = (payment: Payment) => {
    setPrintMode({ type: 'RECEIPT', payment });
  };

  const handlePrintReportCard = (summary: StudentReportSummary, isBlanc: boolean) => {
    setPrintMode({ type: 'REPORT_CARD', summary, isBlanc });
  };

  const handlePrintStudentCard = (student: Student) => {
    setPrintMode({ type: 'STUDENT_CARD', student });
  };

  const handlePrintAttestation = (student: Student) => {
    setPrintMode({ type: 'ATTESTATION', student });
  };

  const handlePrintClassRoster = (schoolClass: SchoolClass) => {
    setPrintMode({ type: 'CLASS_ROSTER', schoolClass });
  };

  return (
    <div className="flex min-h-screen bg-slate-100/60 font-sans text-slate-800 antialiased">
      {/* Offline Status Badge */}
      <OfflineIndicator />

      {/* Printable Sheet Overlay (when active) */}
      <PrintTemplates
        db={db}
        mode={printMode}
        onClose={() => setPrintMode(null)}
      />

      {/* Main Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(v) => {
          setCurrentView(v);
          setSearchQuery('');
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        userRole={db.currentUser.role}
        schoolName={db.school.name}
      />

      {/* Right Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header
          db={db}
          onUpdateDb={handleUpdateDb}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q && currentView !== 'students' && currentView !== 'finances') {
              setCurrentView('students');
            }
          }}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {currentView === 'dashboard' && (
              <Dashboard
                db={db}
                onNavigate={(v) => setCurrentView(v)}
                onSelectStudent={() => setCurrentView('students')}
              />
            )}

            {currentView === 'students' && (
              <StudentsView
                db={db}
                onUpdateDb={handleUpdateDb}
                onPrintStudentCard={handlePrintStudentCard}
                onPrintAttestation={handlePrintAttestation}
                initialSearch={searchQuery}
              />
            )}

            {currentView === 'enrollments' && (
              <EnrollmentsView
                db={db}
                onUpdateDb={handleUpdateDb}
                onNavigateToStudents={() => setCurrentView('students')}
              />
            )}

            {currentView === 'classes' && (
              <ClassesView
                db={db}
                onUpdateDb={handleUpdateDb}
                onPrintClassRoster={handlePrintClassRoster}
              />
            )}

            {currentView === 'teachers' && (
              <TeachersView
                db={db}
                onUpdateDb={handleUpdateDb}
              />
            )}

            {currentView === 'grades' && (
              <GradesBulletinsView
                db={db}
                onUpdateDb={handleUpdateDb}
                onPrintReportCard={handlePrintReportCard}
              />
            )}

            {currentView === 'finances' && (
              <FinancesView
                db={db}
                onUpdateDb={handleUpdateDb}
                onPrintReceipt={handlePrintReceipt}
              />
            )}

            {currentView === 'documents' && (
              <DocumentsView
                db={db}
                onPrintReceipt={handlePrintReceipt}
                onPrintStudentCard={handlePrintStudentCard}
                onPrintAttestation={handlePrintAttestation}
                onPrintClassRoster={handlePrintClassRoster}
              />
            )}

            {currentView === 'users' && (
              <UsersAuditView
                db={db}
                onUpdateDb={handleUpdateDb}
              />
            )}

            {currentView === 'settings' && (
              <SettingsBackupView
                db={db}
                onUpdateDb={handleUpdateDb}
              />
            )}

            {currentView === 'sqlite' && (
              <SqliteStudioView
                db={db}
                onUpdateDb={handleUpdateDb}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
