import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Award,
  Sparkles,
  Printer,
  Search,
  Filter,
  Save,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  UserCheck,
  Eye,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { GradePeriod, SchoolClass, Student, Subject, Grade } from '../types';
import { computeClassReports, StudentReportSummary, formatDate, getMention } from '../utils/helpers';

interface GradesBulletinsViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
  onPrintReportCard: (summary: StudentReportSummary, isBlanc: boolean) => void;
}

export const GradesBulletinsView: React.FC<GradesBulletinsViewProps> = ({
  db,
  onUpdateDb,
  onPrintReportCard,
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [selectedClassId, setSelectedClassId] = useState<string>(db.classes[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<GradePeriod>('P1');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(db.subjects[0]?.id || '');

  // Sub-tabs: 'GRADE_ENTRY' | 'BULLETIN_BLANC' | 'BULLETINS_OFFICIELS'
  const [activeTab, setActiveTab] = useState<'GRADE_ENTRY' | 'BULLETIN_BLANC' | 'BULLETINS_OFFICIELS'>('BULLETIN_BLANC');

  // Bulletin Blanc simulation parameters
  const [passThreshold, setPassThreshold] = useState<number>(50); // Seuil de passage en % (ex: 50% ou 60%)
  const [simulationNotesBonus, setSimulationNotesBonus] = useState<number>(0); // Bonus expérimental de simulation

  // Grade entry local state
  const [gradeInputs, setGradeInputs] = useState<Record<string, number>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Selected student for detailed report preview
  const [selectedReportSummary, setSelectedReportSummary] = useState<StudentReportSummary | null>(null);

  // Computed reports for selected class
  const classReports = computeClassReports(
    selectedClassId,
    currentYear.id,
    db.students,
    db.enrollments,
    db.classes,
    db.subjects,
    db.grades,
    activeTab === 'BULLETIN_BLANC'
  );

  const selectedClass = db.classes.find((c) => c.id === selectedClassId);
  const selectedSubject = db.subjects.find((s) => s.id === selectedSubjectId);

  // Students enrolled in selected class
  const enrolledStudents = db.students.filter((s) =>
    db.enrollments.some(
      (e) => e.studentId === s.id && e.classId === selectedClassId && e.academicYearId === currentYear.id && e.status === 'CONFIRME'
    )
  );

  // Load existing grades into gradeInputs when class/subject/period changes
  React.useEffect(() => {
    const inputs: Record<string, number> = {};
    enrolledStudents.forEach((student) => {
      const g = db.grades.find(
        (grade) =>
          grade.classId === selectedClassId &&
          grade.academicYearId === currentYear.id &&
          grade.subjectId === selectedSubjectId &&
          grade.period === selectedPeriod &&
          grade.studentId === student.id
      );
      if (g) {
        inputs[student.id] = g.score;
      }
    });
    setGradeInputs(inputs);
  }, [selectedClassId, selectedSubjectId, selectedPeriod, db.grades]);

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedSubject) return;

    let updatedGrades = [...db.grades];
    const maxScore = selectedSubject.defaultMaxPoints;

    Object.entries(gradeInputs).forEach(([studentId, score]) => {
      const existingIndex = updatedGrades.findIndex(
        (g) =>
          g.classId === selectedClassId &&
          g.academicYearId === currentYear.id &&
          g.subjectId === selectedSubjectId &&
          g.period === selectedPeriod &&
          g.studentId === studentId
      );

      const validScore = Math.max(0, Math.min(maxScore, Number(score) || 0));

      if (existingIndex >= 0) {
        updatedGrades[existingIndex] = {
          ...updatedGrades[existingIndex],
          score: validScore,
          maxScore,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updatedGrades.push({
          id: 'grd-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          academicYearId: currentYear.id,
          classId: selectedClassId,
          studentId,
          subjectId: selectedSubjectId,
          period: selectedPeriod,
          score: validScore,
          maxScore,
          updatedAt: new Date().toISOString(),
        });
      }
    });

    const log = createAuditLog(
      db.currentUser,
      'SAISIE_NOTES',
      `Saisie des notes de ${selectedSubject.name} (${selectedPeriod}) pour la classe ${selectedClass.name}`,
      'NOTE'
    );

    onUpdateDb({
      ...db,
      grades: updatedGrades,
      auditLogs: [log, ...db.auditLogs],
    });

    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Évaluations, Bulletins & Simulations (Bulletins Blancs)
          </h2>
          <p className="text-xs text-slate-500">
            Gestion des cotes périodiques, délibération académique et projection pré-délibération
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('BULLETIN_BLANC')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BULLETIN_BLANC' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Bulletin Blanc (Simulation)</span>
          </button>
          <button
            onClick={() => setActiveTab('BULLETINS_OFFICIELS')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BULLETINS_OFFICIELS' ? 'bg-blue-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Bulletins Officiels</span>
          </button>
          <button
            onClick={() => setActiveTab('GRADE_ENTRY')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'GRADE_ENTRY' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Saisie des Notes</span>
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Classe sélectionnée</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-blue-900 focus:bg-white focus:outline-hidden cursor-pointer"
            >
              {db.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.room})
                </option>
              ))}
            </select>
          </div>

          {activeTab === 'GRADE_ENTRY' && (
            <>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Matière</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden cursor-pointer"
                >
                  {db.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} (Max {sub.defaultMaxPoints} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Période / Examen</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as GradePeriod)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden cursor-pointer"
                >
                  <option value="P1">1ère Période (P1)</option>
                  <option value="P2">2ème Période (P2)</option>
                  <option value="EX1">Examen Semestre 1 (EX1)</option>
                  <option value="P3">3ème Période (P3)</option>
                  <option value="P4">4ème Période (P4)</option>
                  <option value="EX2">Examen Semestre 2 (EX2)</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            Effectif : <strong>{enrolledStudents.length} élèves</strong>
          </span>
        </div>
      </div>

      {/* TAB 1: BULLETIN BLANC (SIMULATION) */}
      {activeTab === 'BULLETIN_BLANC' && (
        <div className="space-y-4">
          {/* Simulation Controls Card */}
          <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/60 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-white tracking-wider">
                    Mode Simulation
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    Outil d'Aide à la Décision & Délibération Préalable
                  </span>
                </div>
                <p className="text-xs text-slate-600 max-w-xl">
                  Le Bulletin Blanc permet d'évaluer les résultats des élèves avant la validation définitive, de simuler différents seuils d'admission et de repérer les élèves à risque de redoublement.
                </p>
              </div>

              {/* Interactive Sliders */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-amber-200">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                    <span>Seuil d'Admission :</span>
                    <span className="text-amber-700 font-black">{passThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="70"
                    step="1"
                    value={passThreshold}
                    onChange={(e) => setPassThreshold(Number(e.target.value))}
                    className="w-36 accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400">
                    <span>40% (Tolérance)</span>
                    <span>50% (Standard)</span>
                    <span>60% (Excellence)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulation KPI Bar */}
            {(() => {
              const admittedCount = classReports.filter((r) => r.generalPercentage >= passThreshold).length;
              const failedCount = classReports.length - admittedCount;
              const admittedPct = classReports.length > 0 ? Math.round((admittedCount / classReports.length) * 100) : 0;
              const classAverage =
                classReports.length > 0
                  ? Math.round((classReports.reduce((s, r) => s + r.generalPercentage, 0) / classReports.length) * 10) / 10
                  : 0;

              return (
                <div className="mt-4 pt-3 border-t border-amber-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-amber-100">
                    <span className="text-slate-500 text-[10px] block">Moyenne de Classe</span>
                    <span className="text-lg font-black text-slate-900">{classAverage}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-amber-100">
                    <span className="text-slate-500 text-[10px] block">Taux Réussite Simulé</span>
                    <span className="text-lg font-black text-emerald-700">{admittedPct}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-amber-100">
                    <span className="text-slate-500 text-[10px] block">Admis (≥ {passThreshold}%)</span>
                    <span className="text-lg font-black text-blue-800">{admittedCount} élèves</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-amber-100">
                    <span className="text-slate-500 text-[10px] block">En Difficulté (&lt; {passThreshold}%)</span>
                    <span className="text-lg font-black text-rose-700">{failedCount} élèves</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Simulation Table with Rank & Decision */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Palmarès Simulé de la Classe : {selectedClass?.name}
              </h3>
              <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Mode Bulletin Blanc (Sans impact sur les procès-verbaux officiels)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Rang</th>
                    <th className="py-3 px-4">Élève & Matricule</th>
                    <th className="py-3 px-4">Total Obtenu / Max</th>
                    <th className="py-3 px-4">Pourcentage (%)</th>
                    <th className="py-3 px-4">Mention</th>
                    <th className="py-3 px-4">Pronostic Conseil</th>
                    <th className="py-3 px-4 text-right">Bulletin Blanc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classReports.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun élève ou aucune cote enregistrée pour cette classe.
                      </td>
                    </tr>
                  ) : (
                    classReports.map((report) => {
                      const isPassed = report.generalPercentage >= passThreshold;
                      return (
                        <tr key={report.student.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-4 font-black text-sm">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                report.rank === 1
                                  ? 'bg-amber-400 text-amber-950 font-black'
                                  : report.rank === 2
                                  ? 'bg-slate-200 text-slate-800'
                                  : report.rank === 3
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'text-slate-600'
                              }`}
                            >
                              {report.rank}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {report.student.lastName} {report.student.firstName}
                            </div>
                            <span className="font-mono text-[10px] text-slate-500">
                              {report.student.matricule}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-700">
                            {report.totalScore} / {report.totalMaxScore} pts
                          </td>

                          <td className="py-3 px-4 font-black text-sm">
                            <span
                              className={isPassed ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}
                            >
                              {report.generalPercentage}%
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`rounded-sm px-2 py-0.5 text-[10px] font-extrabold ${report.mention.bg} ${report.mention.color}`}
                            >
                              {report.mention.label}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ${
                                isPassed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isPassed ? '✓ ADMISSIBLE' : '✕ RISQUE D\'ÉCHEC'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedReportSummary(report)}
                                className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                                title="Aperçu du bulletin"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onPrintReportCard(report, true)}
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 hover:bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white transition cursor-pointer"
                                title="Imprimer Bulletin Blanc"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Imprimer Blanc</span>
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
        </div>
      )}

      {/* TAB 2: BULLETINS OFFICIELS */}
      {activeTab === 'BULLETINS_OFFICIELS' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Bulletins Périodiques & Semestriels Officiels : {selectedClass?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Documents officiels avec relevé des cotes par discipline, coefficients et visas
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Rang</th>
                    <th className="py-3 px-4">Élève</th>
                    <th className="py-3 px-4">Total Points</th>
                    <th className="py-3 px-4">Pourcentage</th>
                    <th className="py-3 px-4">Mention Officielle</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classReports.map((report) => (
                    <tr key={report.student.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-black">#{report.rank}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {report.student.lastName} {report.student.firstName}
                        </div>
                        <span className="font-mono text-[10px] text-slate-500">{report.student.matricule}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {report.totalScore} / {report.totalMaxScore}
                      </td>
                      <td className="py-3 px-4 font-black text-sm text-blue-900">
                        {report.generalPercentage}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`rounded-sm px-2 py-0.5 text-[10px] font-extrabold ${report.mention.bg} ${report.mention.color}`}>
                          {report.mention.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReportSummary(report)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                            title="Aperçu"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onPrintReportCard(report, false)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 px-3 py-1.5 text-xs font-bold text-white transition cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Imprimer Bulletin Officiel</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GRADE ENTRY */}
      {activeTab === 'GRADE_ENTRY' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Saisie des Cotes : {selectedSubject?.name} • {selectedPeriod}
              </h3>
              <p className="text-xs text-slate-500">
                Barème maximal : <strong>{selectedSubject?.defaultMaxPoints} points</strong> • Classe : {selectedClass?.name}
              </p>
            </div>
            {saveSuccessMsg && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 animate-bounce">
                <CheckCircle className="h-4 w-4" />
                Notes enregistrées avec succès !
              </span>
            )}
          </div>

          <form onSubmit={handleSaveGrades} className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Élève & Matricule</th>
                    <th className="py-3 px-4">Note Obtenue (sur {selectedSubject?.defaultMaxPoints})</th>
                    <th className="py-3 px-4">Appréciation Instantanée</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {enrolledStudents.map((student) => {
                    const currentScore = gradeInputs[student.id];
                    const maxScore = selectedSubject?.defaultMaxPoints || 40;
                    const pct = currentScore !== undefined ? (Number(currentScore) / maxScore) * 100 : 0;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900">
                            {student.lastName} {student.firstName}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{student.matricule}</span>
                        </td>

                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            min="0"
                            max={maxScore}
                            step="0.5"
                            value={currentScore !== undefined ? currentScore : ''}
                            onChange={(e) =>
                              setGradeInputs({
                                ...gradeInputs,
                                [student.id]: Number(e.target.value),
                              })
                            }
                            placeholder={`0 - ${maxScore}`}
                            className="w-24 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                          />
                        </td>

                        <td className="py-2.5 px-4">
                          {currentScore !== undefined && (
                            <span
                              className={`rounded-sm px-2 py-0.5 text-[10px] font-bold ${
                                pct >= 80
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : pct >= 50
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-rose-50 text-rose-800'
                              }`}
                            >
                              {pct >= 80 ? 'Excellent' : pct >= 50 ? 'Satisfaisant' : 'Insuffisant'} ({Math.round(pct)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer la grille de notes</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal for Report Card */}
      {selectedReportSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Aperçu du Relevé : {selectedReportSummary.student.lastName} {selectedReportSummary.student.firstName}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedReportSummary.studentClass?.name} • Rang : #{selectedReportSummary.rank} / {selectedReportSummary.totalStudentsInClass}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportSummary(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Disciplines table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                    <tr>
                      <th className="py-2.5 px-3">Discipline</th>
                      <th className="py-2.5 px-3">Coef</th>
                      <th className="py-2.5 px-3">P1</th>
                      <th className="py-2.5 px-3">P2</th>
                      <th className="py-2.5 px-3">EX1</th>
                      <th className="py-2.5 px-3">Total Sem. 1</th>
                      <th className="py-2.5 px-3">%</th>
                      <th className="py-2.5 px-3">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {selectedReportSummary.rows.map((row) => (
                      <tr key={row.subject.id}>
                        <td className="py-2 px-3 font-bold text-slate-900">{row.subject.name}</td>
                        <td className="py-2 px-3 font-mono">{row.coefficient}</td>
                        <td className="py-2 px-3">{row.scoreP1 !== undefined ? `${row.scoreP1}/${row.maxP1}` : '-'}</td>
                        <td className="py-2 px-3">{row.scoreP2 !== undefined ? `${row.scoreP2}/${row.maxP2}` : '-'}</td>
                        <td className="py-2 px-3">{row.scoreEX1 !== undefined ? `${row.scoreEX1}/${row.maxEX1}` : '-'}</td>
                        <td className="py-2 px-3 font-bold">{row.totalSem1} / {row.maxSem1}</td>
                        <td className="py-2 px-3 font-black text-blue-900">{row.percentageSem1}%</td>
                        <td className="py-2 px-3 text-[11px] text-slate-500">{row.appreciation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Summary box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Total Points</span>
                  <span className="font-bold text-slate-900">{selectedReportSummary.totalScore} / {selectedReportSummary.totalMaxScore}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Pourcentage Global</span>
                  <span className="font-black text-blue-900 text-sm">{selectedReportSummary.generalPercentage}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Rang dans la classe</span>
                  <span className="font-bold text-purple-900">#{selectedReportSummary.rank} / {selectedReportSummary.totalStudentsInClass}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Mention Générale</span>
                  <span className={`font-black ${selectedReportSummary.mention.color}`}>{selectedReportSummary.mention.label}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedReportSummary(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  onPrintReportCard(selectedReportSummary, true);
                  setSelectedReportSummary(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer Bulletin Blanc</span>
              </button>
              <button
                onClick={() => {
                  onPrintReportCard(selectedReportSummary, false);
                  setSelectedReportSummary(null);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-blue-800 text-white hover:bg-blue-900 px-4 py-2 text-xs font-bold transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer Bulletin Officiel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
