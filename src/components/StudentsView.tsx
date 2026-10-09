import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Printer,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  Eye,
  Award,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { Student, SchoolClass } from '../types';
import { formatCurrency, formatDate, calculateStudentFinances } from '../utils/helpers';

interface StudentsViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
  onPrintStudentCard: (student: Student) => void;
  onPrintAttestation: (student: Student) => void;
  initialSearch?: string;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  db,
  onUpdateDb,
  onPrintStudentCard,
  onPrintAttestation,
  initialSearch = '',
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<Student | null>(null);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student & { targetClassId: string }>>({
    gender: 'M',
    status: 'ACTIF',
    nationality: 'Congolaise',
  });

  // Filter students
  const filteredStudents = db.students.filter((student) => {
    // Search
    const searchMatch =
      !searchTerm ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.middleName && student.middleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.parentPhone && student.parentPhone.includes(searchTerm));

    if (!searchMatch) return false;

    // Gender
    if (selectedGender !== 'ALL' && student.gender !== selectedGender) return false;

    // Status
    if (selectedStatus !== 'ALL' && student.status !== selectedStatus) return false;

    // Class
    if (selectedClassId !== 'ALL') {
      const enrollment = db.enrollments.find(
        (e) => e.studentId === student.id && e.academicYearId === currentYear.id && e.status === 'CONFIRME'
      );
      if (!enrollment || enrollment.classId !== selectedClassId) return false;
    }

    return true;
  });

  // Helper to get student's class name
  const getStudentClass = (studentId: string): SchoolClass | undefined => {
    const enrollment = db.enrollments.find(
      (e) => e.studentId === studentId && e.academicYearId === currentYear.id && e.status === 'CONFIRME'
    );
    if (!enrollment) return undefined;
    return db.classes.find((c) => c.id === enrollment.classId);
  };

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setFormData({
      gender: 'M',
      status: 'ACTIF',
      nationality: 'Congolaise',
      registrationDate: new Date().toISOString().split('T')[0],
      targetClassId: db.classes[0]?.id || '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setStudentToEdit(student);
    const existingEnrollment = db.enrollments.find(
      (e) => e.studentId === student.id && e.academicYearId === currentYear.id
    );
    setFormData({
      ...student,
      targetClassId: existingEnrollment?.classId || db.classes[0]?.id || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lastName || !formData.firstName) return;

    if (studentToEdit) {
      // UPDATE
      const updatedStudent: Student = {
        ...studentToEdit,
        ...formData,
        lastName: (formData.lastName || '').toUpperCase(),
        firstName: formData.firstName || '',
        middleName: (formData.middleName || '').toUpperCase(),
      } as Student;

      const updatedStudents = db.students.map((s) => (s.id === studentToEdit.id ? updatedStudent : s));

      // Update or create enrollment if class changed
      let updatedEnrollments = [...db.enrollments];
      if (formData.targetClassId) {
        const existingEnrollment = updatedEnrollments.find(
          (en) => en.studentId === studentToEdit.id && en.academicYearId === currentYear.id
        );
        if (existingEnrollment) {
          updatedEnrollments = updatedEnrollments.map((en) =>
            en.id === existingEnrollment.id ? { ...en, classId: formData.targetClassId! } : en
          );
        } else {
          updatedEnrollments.push({
            id: 'enr-' + Date.now(),
            studentId: studentToEdit.id,
            classId: formData.targetClassId!,
            academicYearId: currentYear.id,
            type: 'REINSCRIPTION',
            date: new Date().toISOString().split('T')[0],
            status: 'CONFIRME',
          });
        }
      }

      const log = createAuditLog(
        db.currentUser,
        'MODIFICATION_ELEVE',
        `Mise à jour du dossier de l'élève ${updatedStudent.lastName} ${updatedStudent.firstName} (${updatedStudent.matricule})`,
        'ELEVE',
        updatedStudent.id
      );

      onUpdateDb({
        ...db,
        students: updatedStudents,
        enrollments: updatedEnrollments,
        auditLogs: [log, ...db.auditLogs],
      });
    } else {
      // CREATE
      const nextMatriculeNum = String(db.students.length + 1).padStart(3, '0');
      const matricule = `EDG-${currentYear.name.split('-')[0]}-${nextMatriculeNum}`;

      const newStudent: Student = {
        id: 'std-' + Date.now(),
        matricule,
        lastName: (formData.lastName || '').toUpperCase(),
        middleName: (formData.middleName || '').toUpperCase(),
        firstName: formData.firstName || '',
        gender: formData.gender || 'M',
        birthDate: formData.birthDate || '2010-01-01',
        birthPlace: formData.birthPlace || 'Kinshasa',
        nationality: formData.nationality || 'Congolaise',
        address: formData.address || '',
        parentName: formData.parentName || '',
        parentPhone: formData.parentPhone || '',
        parentEmail: formData.parentEmail || '',
        parentProfession: formData.parentProfession || '',
        bloodGroup: formData.bloodGroup || '',
        medicalNotes: formData.medicalNotes || '',
        status: formData.status || 'ACTIF',
        registrationDate: formData.registrationDate || new Date().toISOString().split('T')[0],
      };

      const newEnrollment = {
        id: 'enr-' + Date.now(),
        studentId: newStudent.id,
        classId: formData.targetClassId || db.classes[0]?.id || '',
        academicYearId: currentYear.id,
        type: 'INSCRIPTION' as const,
        date: newStudent.registrationDate,
        status: 'CONFIRME' as const,
      };

      const log = createAuditLog(
        db.currentUser,
        'NOUVELLE_INSCRIPTION',
        `Inscription de l'élève ${newStudent.lastName} ${newStudent.firstName} (Matricule: ${matricule})`,
        'ELEVE',
        newStudent.id
      );

      onUpdateDb({
        ...db,
        students: [newStudent, ...db.students],
        enrollments: [newEnrollment, ...db.enrollments],
        auditLogs: [log, ...db.auditLogs],
      });
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = db.students.find((s) => s.id === studentId);
    if (!student) return;
    if (confirm(`Confirmez-vous la suppression définitive du dossier de ${student.lastName} ${student.firstName} ?`)) {
      const updatedStudents = db.students.filter((s) => s.id !== studentId);
      const updatedEnrollments = db.enrollments.filter((e) => e.studentId !== studentId);
      const log = createAuditLog(
        db.currentUser,
        'SUPPRESSION_ELEVE',
        `Suppression de l'élève ${student.lastName} ${student.firstName} (${student.matricule})`,
        'ELEVE',
        studentId
      );

      onUpdateDb({
        ...db,
        students: updatedStudents,
        enrollments: updatedEnrollments,
        auditLogs: [log, ...db.auditLogs],
      });
      setSelectedStudentForDetail(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Répertoire Général des Élèves
          </h2>
          <p className="text-xs text-slate-500">
            Fiches signalétiques, matricules scolaires, dossiers médicaux et suivi individuel
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Nouveau Dossier Élève</span>
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, postnom, prénom, matricule, parent..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Toutes les classes ({db.classes.length})</option>
              {db.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tous les genres</option>
              <option value="M">Garçons (M)</option>
              <option value="F">Filles (F)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Tous statuts</option>
              <option value="ACTIF">Actif</option>
              <option value="TRANSFERE">Transféré</option>
              <option value="ABANDONNE">Abandonné</option>
            </select>
          </div>
        </div>

        {/* Counter summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Affichage de <strong>{filteredStudents.length}</strong> élève(s) sur {db.students.length}
          </span>
          {(searchTerm || selectedClassId !== 'ALL' || selectedGender !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedClassId('ALL');
                setSelectedGender('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3 px-4">Élève & Matricule</th>
                <th className="py-3 px-4">Classe Attribuée</th>
                <th className="py-3 px-4">Sexe / Âge</th>
                <th className="py-3 px-4">Parent / Tuteur</th>
                <th className="py-3 px-4">Situation Frais</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun élève trouvé selon les critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const sClass = getStudentClass(student.id);
                  const finances = calculateStudentFinances(
                    student.id,
                    currentYear.id,
                    db.feeTypes,
                    db.payments,
                    db.enrollments,
                    db.classes
                  );

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Matricule */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-black text-xs">
                            {student.lastName.charAt(0)}
                            {student.firstName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {student.lastName} {student.middleName} {student.firstName}
                            </div>
                            <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded-sm">
                              {student.matricule}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-3 px-4">
                        {sClass ? (
                          <span className="inline-block rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                            {sClass.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non assigné</span>
                        )}
                      </td>

                      {/* Sexe */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                            student.gender === 'F'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-indigo-50 text-indigo-700'
                          }`}
                        >
                          {student.gender === 'M' ? 'Garçon (M)' : 'Fille (F)'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Né(e) le {formatDate(student.birthDate)}
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="py-3 px-4">
                        <div className="text-slate-900 font-semibold">{student.parentName || '-'}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{student.parentPhone || 'Non renseigné'}</span>
                        </div>
                      </td>

                      {/* Finances */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            finances.status === 'SOLDE'
                              ? 'bg-emerald-50 text-emerald-800'
                              : finances.status === 'PARTIEL'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {finances.status === 'SOLDE' && '✓ En ordre'}
                          {finances.status === 'PARTIEL' && `Reste: ${formatCurrency(finances.balanceRemaining, db.school.currency)}`}
                          {finances.status === 'IMPAYE' && `Dû: ${formatCurrency(finances.totalDue, db.school.currency)}`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                            student.status === 'ACTIF'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.status === 'TRANSFERE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentForDetail(student)}
                            title="Consulter le dossier complet"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            title="Modifier les informations"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onPrintStudentCard(student)}
                            title="Imprimer Carte Scolaire"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 transition cursor-pointer"
                          >
                            <Award className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            title="Supprimer l'élève"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal / Drawer */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white font-extrabold text-lg">
                  {selectedStudentForDetail.lastName.charAt(0)}
                  {selectedStudentForDetail.firstName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {selectedStudentForDetail.lastName} {selectedStudentForDetail.middleName} {selectedStudentForDetail.firstName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Matricule : <span className="font-mono font-bold text-blue-700">{selectedStudentForDetail.matricule}</span> • Classe :{' '}
                    <strong>{getStudentClass(selectedStudentForDetail.id)?.name || 'Non assigné'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Identity & Birth */}
              <div className="p-3.5 rounded-xl bg-slate-50 space-y-2 border border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-blue-900">
                  État Civil & Coordonnées
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p><strong>Sexe :</strong> {selectedStudentForDetail.gender === 'M' ? 'Masculin' : 'Féminin'}</p>
                  <p><strong>Né(e) le :</strong> {formatDate(selectedStudentForDetail.birthDate)} à {selectedStudentForDetail.birthPlace}</p>
                  <p><strong>Nationalité :</strong> {selectedStudentForDetail.nationality}</p>
                  <p><strong>Adresse de résidence :</strong> {selectedStudentForDetail.address || '-'}</p>
                  <p><strong>Date d'inscription :</strong> {formatDate(selectedStudentForDetail.registrationDate)}</p>
                </div>
              </div>

              {/* Tuteur & Parents */}
              <div className="p-3.5 rounded-xl bg-slate-50 space-y-2 border border-slate-100">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] text-blue-900">
                  Parent / Responsable Légal
                </h4>
                <div className="space-y-1 text-slate-600">
                  <p><strong>Nom du tuteur :</strong> {selectedStudentForDetail.parentName || '-'}</p>
                  <p><strong>Profession :</strong> {selectedStudentForDetail.parentProfession || '-'}</p>
                  <p><strong>Téléphone :</strong> {selectedStudentForDetail.parentPhone || '-'}</p>
                  <p><strong>Email :</strong> {selectedStudentForDetail.parentEmail || '-'}</p>
                  <p><strong>Groupe sanguin :</strong> {selectedStudentForDetail.bloodGroup || 'Non renseigné'}</p>
                </div>
              </div>
            </div>

            {/* Financial Overview for this student */}
            {(() => {
              const fin = calculateStudentFinances(
                selectedStudentForDetail.id,
                currentYear.id,
                db.feeTypes,
                db.payments,
                db.enrollments,
                db.classes
              );
              return (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Situation Financière (Année {currentYear.name})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-sm text-[10px] font-extrabold ${
                        fin.status === 'SOLDE'
                          ? 'bg-emerald-600 text-white'
                          : fin.status === 'PARTIEL'
                          ? 'bg-amber-500 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {fin.status === 'SOLDE' ? 'TOTALEMENT RÉGLÉ' : fin.status === 'PARTIEL' ? 'ACOMPTE VERSÉ' : 'EN RETARD'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px]">Total à Payer</span>
                      <span className="font-bold text-slate-800">{formatCurrency(fin.totalDue, db.school.currency)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px]">Déjà Versé</span>
                      <span className="font-bold text-emerald-700">{formatCurrency(fin.totalPaid, db.school.currency)}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block text-[10px]">Solde Débiteur</span>
                      <span className="font-black text-rose-700">{formatCurrency(fin.balanceRemaining, db.school.currency)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Print & Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  onPrintStudentCard(selectedStudentForDetail);
                  setSelectedStudentForDetail(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 px-3.5 py-2 text-xs font-bold transition cursor-pointer"
              >
                <Award className="h-4 w-4" />
                <span>Imprimer Carte Scolaire</span>
              </button>
              <button
                onClick={() => {
                  onPrintAttestation(selectedStudentForDetail);
                  setSelectedStudentForDetail(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 text-white hover:bg-blue-800 px-3.5 py-2 text-xs font-bold transition cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>Attestation de Fréquentation</span>
              </button>
              <button
                onClick={() => {
                  handleOpenEdit(selectedStudentForDetail);
                  setSelectedStudentForDetail(null);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Modifier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                {studentToEdit ? `Modifier l'élève : ${studentToEdit.lastName} ${studentToEdit.firstName}` : 'Nouveau Dossier d\'Inscription Élève'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-4 text-xs">
              {/* Nom, Postnom, Prénom */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Ex: KASONGO"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Postnom</label>
                  <input
                    type="text"
                    value={formData.middleName || ''}
                    onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                    placeholder="Ex: TSHILOMBO"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Ex: Daniel"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Sexe, Date de naissance, Lieu */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sexe *</label>
                  <select
                    value={formData.gender || 'M'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="M">Masculin (Garçon)</option>
                    <option value="F">Féminin (Fille)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date de naissance *</label>
                  <input
                    type="date"
                    required
                    value={formData.birthDate || ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lieu de naissance</label>
                  <input
                    type="text"
                    value={formData.birthPlace || ''}
                    onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                    placeholder="Ex: Kinshasa"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Classe d'attribution & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Classe Attribuée *</label>
                  <select
                    value={formData.targetClassId || ''}
                    onChange={(e) => setFormData({ ...formData, targetClassId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-blue-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    {db.classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.room})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut de scolarité</label>
                  <select
                    value={formData.status || 'ACTIF'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="ACTIF">Actif (Régulier)</option>
                    <option value="TRANSFERE">Transféré dans une autre école</option>
                    <option value="ABANDONNE">Abandonné</option>
                  </select>
                </div>
              </div>

              {/* Parent & Contact */}
              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-bold text-slate-800 mb-2">Informations Tuteur / Responsable légal</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nom du tuteur *</label>
                    <input
                      type="text"
                      required
                      value={formData.parentName || ''}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      placeholder="Ex: M. Gilbert Kasongo"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Téléphone de contact *</label>
                    <input
                      type="tel"
                      required
                      value={formData.parentPhone || ''}
                      onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                      placeholder="Ex: +243 81 000 0000"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Profession</label>
                    <input
                      type="text"
                      value={formData.parentProfession || ''}
                      onChange={(e) => setFormData({ ...formData, parentProfession: e.target.value })}
                      placeholder="Ex: Fonctionnaire / Médecin"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Adresse de domicile</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ex: N° 45, Av. Libération, Gombe"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Groupe Sanguin / Santé</label>
                    <input
                      type="text"
                      value={formData.bloodGroup || ''}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                      placeholder="Ex: O+ / Asthmatique"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs transition cursor-pointer"
                >
                  {studentToEdit ? 'Enregistrer les modifications' : 'Créer le dossier élève'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
