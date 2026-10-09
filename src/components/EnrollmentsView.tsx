import React, { useState } from 'react';
import {
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  GraduationCap,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { Enrollment, Student, SchoolClass } from '../types';
import { formatDate } from '../utils/helpers';

interface EnrollmentsViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
  onNavigateToStudents: () => void;
}

export const EnrollmentsView: React.FC<EnrollmentsViewProps> = ({
  db,
  onUpdateDb,
  onNavigateToStudents,
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [activeTab, setActiveTab] = useState<'ALL' | 'INSCRIPTION' | 'REINSCRIPTION'>('ALL');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Re-enrollment modal
  const [isReenrollModalOpen, setIsReenrollModalOpen] = useState(false);
  const [selectedStudentForReenroll, setSelectedStudentForReenroll] = useState<string>('');
  const [targetClassForReenroll, setTargetClassForReenroll] = useState<string>(db.classes[0]?.id || '');
  const [reenrollNotes, setReenrollNotes] = useState<string>('Passage de classe régulier');

  // Active enrollments for current academic year
  const currentYearEnrollments = db.enrollments.filter(
    (e) => e.academicYearId === currentYear.id
  );

  // Filtered list
  const filteredEnrollments = currentYearEnrollments.filter((en) => {
    if (activeTab !== 'ALL' && en.type !== activeTab) return false;
    if (selectedClassFilter !== 'ALL' && en.classId !== selectedClassFilter) return false;

    const student = db.students.find((s) => s.id === en.studentId);
    if (!student) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        student.lastName.toLowerCase().includes(q) ||
        student.firstName.toLowerCase().includes(q) ||
        student.matricule.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Students eligible for re-enrollment (not yet enrolled in current year)
  const unenrolledStudents = db.students.filter(
    (s) => !currentYearEnrollments.some((e) => e.studentId === s.id)
  );

  const handleExecuteReenroll = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForReenroll || !targetClassForReenroll) return;

    const student = db.students.find((s) => s.id === selectedStudentForReenroll);
    const targetClass = db.classes.find((c) => c.id === targetClassForReenroll);
    if (!student || !targetClass) return;

    // Previous enrollment if any
    const prevEnrollment = db.enrollments.find((e) => e.studentId === student.id);
    const prevClass = prevEnrollment ? db.classes.find((c) => c.id === prevEnrollment.classId)?.name : 'Année précédente';

    const newEnrollment: Enrollment = {
      id: 'enr-' + Date.now(),
      studentId: student.id,
      classId: targetClass.id,
      academicYearId: currentYear.id,
      type: 'REINSCRIPTION',
      date: new Date().toISOString().split('T')[0],
      status: 'CONFIRME',
      notes: reenrollNotes,
      previousClass: prevClass,
    };

    const log = createAuditLog(
      db.currentUser,
      'REINSCRIPTION_ELEVE',
      `Réinscription de l'élève ${student.lastName} ${student.firstName} en ${targetClass.name} pour ${currentYear.name}`,
      'INSCRIPTION',
      newEnrollment.id
    );

    onUpdateDb({
      ...db,
      enrollments: [newEnrollment, ...db.enrollments],
      auditLogs: [log, ...db.auditLogs],
    });

    setIsReenrollModalOpen(false);
    setSelectedStudentForReenroll('');
    setReenrollNotes('Passage de classe régulier');
  };

  const handleUpdateStatus = (enrollmentId: string, newStatus: Enrollment['status']) => {
    const updated = db.enrollments.map((e) =>
      e.id === enrollmentId ? { ...e, status: newStatus } : e
    );
    const en = db.enrollments.find((e) => e.id === enrollmentId);
    const st = en ? db.students.find((s) => s.id === en.studentId) : null;

    const log = createAuditLog(
      db.currentUser,
      'STATUT_INSCRIPTION',
      `Changement de statut (${newStatus}) pour l'inscription de ${st ? st.lastName + ' ' + st.firstName : 'l\'élève'}`,
      'INSCRIPTION',
      enrollmentId
    );

    onUpdateDb({
      ...db,
      enrollments: updated,
      auditLogs: [log, ...db.auditLogs],
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Gestion des Inscriptions & Réinscriptions
          </h2>
          <p className="text-xs text-slate-500">
            Enrôlement des nouveaux élèves et renouvellement d'inscription pour l'année scolaire{' '}
            <span className="font-bold text-blue-700">{currentYear.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReenrollModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 px-3.5 py-2.5 text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <span>Réinscrire un Ancien Élève</span>
          </button>
          <button
            onClick={onNavigateToStudents}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Nouvelle Inscription</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'ALL' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tous ({currentYearEnrollments.length})
            </button>
            <button
              onClick={() => setActiveTab('INSCRIPTION')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'INSCRIPTION' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nouvelles Inscriptions ({currentYearEnrollments.filter((e) => e.type === 'INSCRIPTION').length})
            </button>
            <button
              onClick={() => setActiveTab('REINSCRIPTION')}
              className={`flex-1 sm:flex-none rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'REINSCRIPTION' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Réinscriptions ({currentYearEnrollments.filter((e) => e.type === 'REINSCRIPTION').length})
            </button>
          </div>

          {/* Search & Class Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer élève..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden"
              />
            </div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Toutes les classes</option>
              {db.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Classe Attribuée</th>
                <th className="py-3 px-4">Provenance / Notes</th>
                <th className="py-3 px-4">Date d'enregistrement</th>
                <th className="py-3 px-4">Validation</th>
                <th className="py-3 px-4 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucune inscription trouvée.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => {
                  const student = db.students.find((s) => s.id === enr.studentId);
                  const cls = db.classes.find((c) => c.id === enr.classId);
                  if (!student) return null;

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {student.lastName} {student.middleName} {student.firstName}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded-sm">
                          {student.matricule}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                            enr.type === 'INSCRIPTION'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {enr.type === 'INSCRIPTION' ? (
                            <>
                              <UserPlus className="h-3 w-3" /> Nouvelle Inscription
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" /> Réinscription
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {cls ? cls.name : 'Classe non définie'}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {enr.previousClass ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            {enr.previousClass} <ArrowRight className="h-3 w-3 text-slate-400" /> {cls?.name}
                          </span>
                        ) : (
                          enr.notes || 'Dossier conforme'
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500">{formatDate(enr.date)}</td>

                      <td className="py-3 px-4">
                        <select
                          value={enr.status}
                          onChange={(e) => handleUpdateStatus(enr.id, e.target.value as any)}
                          className={`rounded-lg px-2 py-1 text-[11px] font-bold outline-hidden cursor-pointer ${
                            enr.status === 'CONFIRME'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : enr.status === 'EN_ATTENTE'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <option value="CONFIRME">Confirmé (Validé)</option>
                          <option value="EN_ATTENTE">En attente de pièces</option>
                          <option value="ANNULE">Annulé</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {enr.status === 'CONFIRME' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                            <CheckCircle className="h-3.5 w-3.5" /> En règle
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px]">
                            <Clock className="h-3.5 w-3.5" /> En cours
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Re-enrollment */}
      {isReenrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Réinscrire un Ancien Élève ({currentYear.name})
                </h3>
              </div>
              <button
                onClick={() => setIsReenrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteReenroll} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sélectionner l'élève à réinscrire *
                </label>
                <select
                  required
                  value={selectedStudentForReenroll}
                  onChange={(e) => setSelectedStudentForReenroll(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- Choisir parmi les élèves éligibles ({unenrolledStudents.length}) --</option>
                  {unenrolledStudents.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.lastName} {st.firstName} ({st.matricule})
                    </option>
                  ))}
                  {/* Allow selecting all students if desired */}
                  {db.students.map((st) => (
                    <option key={st.id + '-all'} value={st.id}>
                      {st.lastName} {st.firstName} ({st.matricule})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  L'historique antérieur, matricule et coordonnées de l'élève seront intégralement préservés.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nouvelle classe d'affectation pour {currentYear.name} *
                </label>
                <select
                  required
                  value={targetClassForReenroll}
                  onChange={(e) => setTargetClassForReenroll(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-blue-900 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {db.classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.room}) - Capacité : {cls.capacity} élèves
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motif / Décision du Conseil
                </label>
                <input
                  type="text"
                  value={reenrollNotes}
                  onChange={(e) => setReenrollNotes(e.target.value)}
                  placeholder="Ex: Admis en classe supérieure / Redoublement"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReenrollModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white hover:bg-purple-800 shadow-xs cursor-pointer"
                >
                  Valider la Réinscription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
