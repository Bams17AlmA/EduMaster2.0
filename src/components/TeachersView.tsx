import React, { useState } from 'react';
import {
  Briefcase,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Phone,
  Mail,
  UserCheck,
  Edit2,
  Trash2,
  Sparkles,
  Award,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { Teacher, Subject, Assignment } from '../types';

interface TeachersViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
}

export const TeachersView: React.FC<TeachersViewProps> = ({ db, onUpdateDb }) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [activeTab, setActiveTab] = useState<'TEACHERS' | 'SUBJECTS' | 'ASSIGNMENTS'>('TEACHERS');

  // Teacher Modal
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    gender: 'M',
    status: 'ACTIF',
    specialties: [],
  });

  // Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState<Partial<Subject>>({
    category: 'SCIENCES',
    defaultMaxPoints: 40,
    defaultCoefficient: 4,
  });

  // Assignment Modal
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState<Partial<Assignment>>({
    weeklyHours: 4,
    classId: db.classes[0]?.id || '',
    subjectId: db.subjects[0]?.id || '',
    teacherId: db.teachers[0]?.id || '',
  });

  // Save Teacher
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherForm.fullName) return;

    if (teacherToEdit) {
      const updated = db.teachers.map((t) =>
        t.id === teacherToEdit.id ? ({ ...teacherToEdit, ...teacherForm } as Teacher) : t
      );
      const log = createAuditLog(
        db.currentUser,
        'MODIFICATION_ENSEIGNANT',
        `Modification de l'enseignant ${teacherForm.fullName}`,
        'ENSEIGNANT',
        teacherToEdit.id
      );
      onUpdateDb({
        ...db,
        teachers: updated,
        auditLogs: [log, ...db.auditLogs],
      });
    } else {
      const nextMatricule = `ENS-${String(db.teachers.length + 1).padStart(3, '0')}`;
      const newTeacher: Teacher = {
        id: 'tch-' + Date.now(),
        matricule: nextMatricule,
        fullName: teacherForm.fullName,
        gender: teacherForm.gender || 'M',
        phone: teacherForm.phone || '',
        email: teacherForm.email || '',
        qualification: teacherForm.qualification || 'Licencié d\'Enseignement',
        status: teacherForm.status || 'ACTIF',
        specialties: typeof teacherForm.specialties === 'string' ? (teacherForm.specialties as string).split(',').map((s) => s.trim()) : (teacherForm.specialties || []),
        hireDate: new Date().toISOString().split('T')[0],
      };
      const log = createAuditLog(
        db.currentUser,
        'AJOUT_ENSEIGNANT',
        `Ajout de l'enseignant ${newTeacher.fullName} (${newTeacher.matricule})`,
        'ENSEIGNANT',
        newTeacher.id
      );
      onUpdateDb({
        ...db,
        teachers: [...db.teachers, newTeacher],
        auditLogs: [log, ...db.auditLogs],
      });
    }

    setIsTeacherModalOpen(false);
  };

  // Save Subject
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.name || !subjectForm.code) return;

    const newSub: Subject = {
      id: 'sub-' + Date.now(),
      code: subjectForm.code.toUpperCase(),
      name: subjectForm.name,
      category: subjectForm.category || 'SCIENCES',
      defaultMaxPoints: Number(subjectForm.defaultMaxPoints) || 40,
      defaultCoefficient: Number(subjectForm.defaultCoefficient) || 4,
    };

    onUpdateDb({
      ...db,
      subjects: [...db.subjects, newSub],
      auditLogs: [
        createAuditLog(db.currentUser, 'AJOUT_MATIERE', `Ajout de la matière ${newSub.name} (${newSub.code})`, 'SYSTEME'),
        ...db.auditLogs,
      ],
    });

    setIsSubjectModalOpen(false);
  };

  // Save Assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentForm.teacherId || !assignmentForm.classId || !assignmentForm.subjectId) return;

    const newAssignment: Assignment = {
      id: 'asg-' + Date.now(),
      academicYearId: currentYear.id,
      teacherId: assignmentForm.teacherId,
      classId: assignmentForm.classId,
      subjectId: assignmentForm.subjectId,
      weeklyHours: Number(assignmentForm.weeklyHours) || 4,
    };

    const tch = db.teachers.find((t) => t.id === newAssignment.teacherId);
    const cls = db.classes.find((c) => c.id === newAssignment.classId);
    const sub = db.subjects.find((s) => s.id === newAssignment.subjectId);

    onUpdateDb({
      ...db,
      assignments: [...db.assignments, newAssignment],
      auditLogs: [
        createAuditLog(
          db.currentUser,
          'AFFECTATION_PEDAGOGIQUE',
          `Affectation de ${tch?.fullName} pour ${sub?.name} en ${cls?.name} (${newAssignment.weeklyHours}h/sem)`,
          'ENSEIGNANT',
          newAssignment.id
        ),
        ...db.auditLogs,
      ],
    });

    setIsAssignmentModalOpen(false);
  };

  const handleDeleteAssignment = (id: string) => {
    onUpdateDb({
      ...db,
      assignments: db.assignments.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Corps Enseignant, Matières & Affectations
          </h2>
          <p className="text-xs text-slate-500">
            Gestion du personnel enseignant, programme des cours et répartition des charges horaires
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('TEACHERS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'TEACHERS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enseignants ({db.teachers.length})
          </button>
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'SUBJECTS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Matières ({db.subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('ASSIGNMENTS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'ASSIGNMENTS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Affectations ({db.assignments.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Teachers */}
      {activeTab === 'TEACHERS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setTeacherToEdit(null);
                setTeacherForm({ gender: 'M', status: 'ACTIF', specialties: [] });
                setIsTeacherModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau Professeur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.teachers.map((teacher) => {
              const teacherAssignments = db.assignments.filter((a) => a.teacherId === teacher.id);
              const totalHours = teacherAssignments.reduce((sum, a) => sum + a.weeklyHours, 0);

              return (
                <div
                  key={teacher.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-900 font-extrabold text-sm">
                          {teacher.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{teacher.fullName}</h3>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded-sm">
                            {teacher.matricule}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                          teacher.status === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {teacher.status}
                      </span>
                    </div>

                    <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                      <p className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="line-clamp-1">{teacher.qualification}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{teacher.phone || 'Non renseigné'}</span>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{teacher.email || 'Non renseigné'}</span>
                      </p>
                    </div>

                    {/* Specialties pills */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {teacher.specialties.map((sp, idx) => (
                        <span key={idx} className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Charge : <strong>{totalHours}h / semaine</strong>
                    </span>
                    <button
                      onClick={() => {
                        setTeacherToEdit(teacher);
                        setTeacherForm({
                          ...teacher,
                          specialties: teacher.specialties,
                        });
                        setIsTeacherModalOpen(true);
                      }}
                      className="text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                    >
                      Modifier &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Subjects */}
      {activeTab === 'SUBJECTS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsSubjectModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle Discipline / Matière</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Intitulé de la Discipline</th>
                  <th className="py-3 px-4">Domaine d'Apprentissage</th>
                  <th className="py-3 px-4">Max Points Standard</th>
                  <th className="py-3 px-4">Coefficient</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {db.subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{sub.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sub.name}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-sm bg-slate-100 text-slate-700 font-bold px-2 py-0.5 text-[10px]">
                        {sub.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">{sub.defaultMaxPoints} pts</td>
                    <td className="py-3 px-4">
                      <span className="font-extrabold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-sm">
                        x{sub.defaultCoefficient}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Assignments */}
      {activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsAssignmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle Affectation Pédagogique</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Enseignant Responsable</th>
                  <th className="py-3 px-4">Matière Enseignée</th>
                  <th className="py-3 px-4">Classe Attribuée</th>
                  <th className="py-3 px-4">Volume Horaire</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {db.assignments.map((asg) => {
                  const teacher = db.teachers.find((t) => t.id === asg.teacherId);
                  const sub = db.subjects.find((s) => s.id === asg.subjectId);
                  const cls = db.classes.find((c) => c.id === asg.classId);

                  return (
                    <tr key={asg.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{teacher ? teacher.fullName : 'Inconnu'}</div>
                        <span className="font-mono text-[10px] text-slate-500">{teacher?.matricule}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-900">
                        {sub ? `${sub.name} (${sub.code})` : 'Discipline'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {cls ? cls.name : 'Classe'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-sm">
                          <Clock className="h-3 w-3" /> {asg.weeklyHours}h / semaine
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteAssignment(asg.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Teacher */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              {teacherToEdit ? 'Modifier l\'Enseignant' : 'Ajouter un Enseignant'}
            </h3>
            <form onSubmit={handleSaveTeacher} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={teacherForm.fullName || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, fullName: e.target.value })}
                  placeholder="Ex: M. Jean-Paul Mbayo"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Genre</label>
                  <select
                    value={teacherForm.gender || 'M'}
                    onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Statut</label>
                  <select
                    value={teacherForm.status || 'ACTIF'}
                    onChange={(e) => setTeacherForm({ ...teacherForm, status: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="ACTIF">Actif (En poste)</option>
                    <option value="CONGE">En congé</option>
                    <option value="INACTIF">Inactif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diplôme / Qualification</label>
                <input
                  type="text"
                  value={teacherForm.qualification || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                  placeholder="Ex: Licencié en Sciences Physiques (ISP)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={teacherForm.phone || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                    placeholder="+243 ..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={teacherForm.email || ''}
                    onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                    placeholder="nom@ecole.edu"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Spécialités (séparées par des virgules)</label>
                <input
                  type="text"
                  value={Array.isArray(teacherForm.specialties) ? teacherForm.specialties.join(', ') : teacherForm.specialties || ''}
                  onChange={(e) => setTeacherForm({ ...teacherForm, specialties: e.target.value.split(',').map((s) => s.trim()) })}
                  placeholder="Ex: Mathématiques, Physique, Algèbre"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Subject */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Ajouter une Nouvelle Matière
            </h3>
            <form onSubmit={handleSaveSubject} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="BIO"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Intitulé *</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name || ''}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="Biologie Générale"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Domaine</label>
                <select
                  value={subjectForm.category || 'SCIENCES'}
                  onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="SCIENCES">Sciences Exactes (Math, Phys, Chim, Bio)</option>
                  <option value="LETTRES">Lettres & Langues (Français, Anglais)</option>
                  <option value="SCIENCES_HUMAINES">Sciences Humaines (Histoire, Géo, Civisme)</option>
                  <option value="TECHNIQUE">Technique & Professionnel (Info, Compta)</option>
                  <option value="AUTRE">Éducation Physique & Autres</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Points</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={subjectForm.defaultMaxPoints || 40}
                    onChange={(e) => setSubjectForm({ ...subjectForm, defaultMaxPoints: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Coefficient</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={subjectForm.defaultCoefficient || 4}
                    onChange={(e) => setSubjectForm({ ...subjectForm, defaultCoefficient: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                >
                  Ajouter la Matière
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Assignment */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Nouvelle Affectation de Cours
            </h3>
            <form onSubmit={handleSaveAssignment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enseignant Titulaire du Cours *</label>
                <select
                  required
                  value={assignmentForm.teacherId || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, teacherId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {db.teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.matricule})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Classe Attribuée *</label>
                <select
                  required
                  value={assignmentForm.classId || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, classId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.room})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Matière Enseignée *</label>
                <select
                  required
                  value={assignmentForm.subjectId || ''}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subjectId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {db.subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code} - Coef {s.defaultCoefficient})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Volume Horaire Hebdomadaire</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={assignmentForm.weeklyHours || 4}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, weeklyHours: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                >
                  Enregistrer l'Affectation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
