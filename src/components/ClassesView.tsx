import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Users,
  DoorOpen,
  UserCheck,
  Edit2,
  Trash2,
  Printer,
  Layers,
  BookOpen,
  X,
  Check,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { SchoolClass, Level, Section } from '../types';

interface ClassesViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
  onPrintClassRoster: (schoolClass: SchoolClass) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  db,
  onUpdateDb,
  onPrintClassRoster,
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [activeSubTab, setActiveSubTab] = useState<'CLASSES' | 'NIVEAUX' | 'SECTIONS'>('CLASSES');

  // Modals
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState<SchoolClass | null>(null);
  const [classForm, setClassForm] = useState<Partial<SchoolClass>>({
    capacity: 40,
    room: 'Salle 101',
  });

  // Level & Section Modal
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [levelForm, setLevelForm] = useState<Partial<Level>>({ cycle: 'SECONDAIRE', order: 1 });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState<Partial<Section>>({ cycle: 'SECONDAIRE' });

  // Class Management Handlers
  const handleOpenAddClass = () => {
    setClassToEdit(null);
    setClassForm({
      capacity: 40,
      room: 'Salle ' + (db.classes.length + 101),
      levelId: db.levels[0]?.id || '',
      sectionId: db.sections[0]?.id || '',
      mainTeacherId: db.teachers[0]?.id || '',
    });
    setIsClassModalOpen(true);
  };

  const handleOpenEditClass = (c: SchoolClass) => {
    setClassToEdit(c);
    setClassForm(c);
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.name || !classForm.levelId) return;

    if (classToEdit) {
      const updatedClasses = db.classes.map((c) =>
        c.id === classToEdit.id ? ({ ...c, ...classForm } as SchoolClass) : c
      );
      const log = createAuditLog(
        db.currentUser,
        'MODIFICATION_CLASSE',
        `Modification de la classe ${classForm.name}`,
        'CLASSE',
        classToEdit.id
      );
      onUpdateDb({
        ...db,
        classes: updatedClasses,
        auditLogs: [log, ...db.auditLogs],
      });
    } else {
      const newClass: SchoolClass = {
        id: 'cls-' + Date.now(),
        name: classForm.name,
        levelId: classForm.levelId,
        sectionId: classForm.sectionId,
        academicYearId: currentYear.id,
        room: classForm.room || 'Salle Principale',
        capacity: Number(classForm.capacity) || 40,
        mainTeacherId: classForm.mainTeacherId,
      };
      const log = createAuditLog(
        db.currentUser,
        'CREATION_CLASSE',
        `Création de la classe ${newClass.name} (Capacité: ${newClass.capacity})`,
        'CLASSE',
        newClass.id
      );
      onUpdateDb({
        ...db,
        classes: [...db.classes, newClass],
        auditLogs: [log, ...db.auditLogs],
      });
    }

    setIsClassModalOpen(false);
  };

  const handleDeleteClass = (classId: string) => {
    const c = db.classes.find((cl) => cl.id === classId);
    if (!c) return;
    if (confirm(`Voulez-vous supprimer la classe ${c.name} ?`)) {
      onUpdateDb({
        ...db,
        classes: db.classes.filter((cl) => cl.id !== classId),
        auditLogs: [
          createAuditLog(db.currentUser, 'SUPPRESSION_CLASSE', `Suppression de ${c.name}`, 'CLASSE', classId),
          ...db.auditLogs,
        ],
      });
    }
  };

  // Level Management Handlers
  const handleSaveLevel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!levelForm.name) return;
    const newLevel: Level = {
      id: 'lvl-' + Date.now(),
      name: levelForm.name,
      cycle: levelForm.cycle || 'SECONDAIRE',
      order: db.levels.length + 1,
    };
    onUpdateDb({
      ...db,
      levels: [...db.levels, newLevel],
    });
    setIsLevelModalOpen(false);
    setLevelForm({ cycle: 'SECONDAIRE', order: 1 });
  };

  // Section Management Handlers
  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionForm.name || !sectionForm.code) return;
    const newSection: Section = {
      id: 'sec-' + Date.now(),
      name: sectionForm.name,
      code: sectionForm.code.toUpperCase(),
      cycle: sectionForm.cycle || 'SECONDAIRE',
      description: sectionForm.description || '',
    };
    onUpdateDb({
      ...db,
      sections: [...db.sections, newSection],
    });
    setIsSectionModalOpen(false);
    setSectionForm({ cycle: 'SECONDAIRE' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Organisation des Classes, Niveaux & Sections
          </h2>
          <p className="text-xs text-slate-500">
            Structure pédagogique de l'établissement : salles de classe, cycles d'études et filières
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveSubTab('CLASSES')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'CLASSES' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Classes ({db.classes.length})
          </button>
          <button
            onClick={() => setActiveSubTab('NIVEAUX')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'NIVEAUX' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Niveaux & Cycles ({db.levels.length})
          </button>
          <button
            onClick={() => setActiveSubTab('SECTIONS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'SECTIONS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sections & Options ({db.sections.length})
          </button>
        </div>
      </div>

      {/* Subtab 1: Classes */}
      {activeSubTab === 'CLASSES' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleOpenAddClass}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Créer une Nouvelle Classe</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.classes.map((cls) => {
              const enrolledCount = db.enrollments.filter(
                (e) => e.classId === cls.id && e.academicYearId === currentYear.id && e.status === 'CONFIRME'
              ).length;
              const level = db.levels.find((l) => l.id === cls.levelId);
              const section = db.sections.find((s) => s.id === cls.sectionId);
              const teacher = db.teachers.find((t) => t.id === cls.mainTeacherId);
              const occupancy = cls.capacity > 0 ? Math.round((enrolledCount / cls.capacity) * 100) : 0;

              return (
                <div
                  key={cls.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                          {level ? level.name : 'Niveau'}
                        </span>
                        <h3 className="mt-1.5 text-base font-black text-slate-900">{cls.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditClass(cls)}
                          title="Modifier"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id)}
                          title="Supprimer"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>{cls.room || 'Salle de cours'}</span>
                      </div>
                      {section && (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                          <span>Option : <strong>{section.name}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>Titulaire : <strong>{teacher ? teacher.fullName : 'Non désigné'}</strong></span>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Effectif actuel</span>
                        <span className="font-bold text-slate-900">
                          {enrolledCount} / {cls.capacity} ({occupancy}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            occupancy > 90 ? 'bg-rose-500' : occupancy > 70 ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, occupancy)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Print roster button */}
                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => onPrintClassRoster(cls)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-blue-700" />
                      <span>Imprimer Liste de Classe (Émargement)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subtab 2: Niveaux & Cycles */}
      {activeSubTab === 'NIVEAUX' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsLevelModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un Niveau</span>
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Ordre</th>
                  <th className="py-3 px-4">Nom du Niveau</th>
                  <th className="py-3 px-4">Cycle Scolaire</th>
                  <th className="py-3 px-4">Classes Associées</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {db.levels.map((lvl) => {
                  const associatedClasses = db.classes.filter((c) => c.levelId === lvl.id);
                  return (
                    <tr key={lvl.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-400">#{lvl.order}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{lvl.name}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-sm bg-blue-50 text-blue-800 font-bold px-2 py-0.5 text-[10px]">
                          {lvl.cycle}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {associatedClasses.length > 0
                          ? associatedClasses.map((c) => c.name).join(', ')
                          : 'Aucune classe'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Sections & Options */}
      {activeSubTab === 'SECTIONS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsSectionModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter une Section / Option</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {db.sections.map((sec) => (
              <div key={sec.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-sm">
                    {sec.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">{sec.cycle}</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-900">{sec.name}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {sec.description || 'Filière d\'enseignement accréditée.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add / Edit Class */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {classToEdit ? `Modifier la classe ${classToEdit.name}` : 'Créer une Nouvelle Classe'}
              </h3>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé de la classe *</label>
                <input
                  type="text"
                  required
                  value={classForm.name || ''}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="Ex: 1ère Humanités Scientifiques B"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Niveau d'études *</label>
                  <select
                    required
                    value={classForm.levelId || ''}
                    onChange={(e) => setClassForm({ ...classForm, levelId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                  >
                    {db.levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.name} ({lvl.cycle})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section / Option</label>
                  <select
                    value={classForm.sectionId || ''}
                    onChange={(e) => setClassForm({ ...classForm, sectionId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">-- Sans option particulière --</option>
                    {db.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Salle de cours *</label>
                  <input
                    type="text"
                    required
                    value={classForm.room || ''}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    placeholder="Ex: Pavillon A - Salle 204"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacité maximale (Élèves) *</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    required
                    value={classForm.capacity || 40}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Enseignant Titulaire (Responsable)</label>
                <select
                  value={classForm.mainTeacherId || ''}
                  onChange={(e) => setClassForm({ ...classForm, mainTeacherId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="">-- Aucun titulaire assigné --</option>
                  {db.teachers.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.fullName} ({tch.matricule})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs cursor-pointer"
                >
                  {classToEdit ? 'Enregistrer' : 'Créer la classe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Level */}
      {isLevelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Ajouter un Niveau d'Études
            </h3>
            <form onSubmit={handleSaveLevel} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom du Niveau *</label>
                <input
                  type="text"
                  required
                  value={levelForm.name || ''}
                  onChange={(e) => setLevelForm({ ...levelForm, name: e.target.value })}
                  placeholder="Ex: 2ème Humanités Littéraires"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cycle *</label>
                <select
                  value={levelForm.cycle}
                  onChange={(e) => setLevelForm({ ...levelForm, cycle: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="MATERNELLE">Maternelle</option>
                  <option value="PRIMAIRE">Primaire</option>
                  <option value="SECONDAIRE">Secondaire / Humanités</option>
                </select>
              </div>
              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLevelModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                >
                  Ajouter le Niveau
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Section */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Ajouter une Section / Option
            </h3>
            <form onSubmit={handleSaveSection} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom de la Section *</label>
                <input
                  type="text"
                  required
                  value={sectionForm.name || ''}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  placeholder="Ex: Électronique & Télécoms"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code / Sigle *</label>
                <input
                  type="text"
                  required
                  value={sectionForm.code || ''}
                  onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: ELEC"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={sectionForm.description || ''}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  placeholder="Ex: Filière technique industrielle"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>
              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                >
                  Créer la Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
