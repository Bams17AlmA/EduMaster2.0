import React from 'react';
import { Printer, X, Download, QrCode } from 'lucide-react';
import { AppDatabase } from '../services/storage';
import { Payment, Student, SchoolClass } from '../types';
import { StudentReportSummary, formatCurrency, formatDate } from '../utils/helpers';

export type PrintMode =
  | { type: 'RECEIPT'; payment: Payment }
  | { type: 'REPORT_CARD'; summary: StudentReportSummary; isBlanc: boolean }
  | { type: 'STUDENT_CARD'; student: Student }
  | { type: 'ATTESTATION'; student: Student }
  | { type: 'CLASS_ROSTER'; schoolClass: SchoolClass };

interface PrintTemplatesProps {
  db: AppDatabase;
  mode: PrintMode | null;
  onClose: () => void;
}

export const PrintTemplates: React.FC<PrintTemplatesProps> = ({ db, mode, onClose }) => {
  if (!mode) return null;

  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex flex-col items-center p-4 sm:p-8">
      {/* Floating Action Bar (hidden when printing) */}
      <div className="no-print sticky top-4 z-50 mb-6 flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3 shadow-2xl border border-slate-200 w-full max-w-3xl">
        <div className="flex items-center gap-2">
          <Printer className="h-5 w-5 text-blue-700" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Aperçu Avant Impression & Export PDF</h4>
            <p className="text-[10px] text-slate-500">Format A4 Haute Définition certifié</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Lancer l'Impression / PDF</span>
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 p-2 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="print-container w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 border border-slate-200 my-auto text-xs leading-relaxed">
        {/* 1. REÇU DE PAIEMENT */}
        {mode.type === 'RECEIPT' && (() => {
          const payment = mode.payment;
          const student = db.students.find((s) => s.id === payment.studentId);
          const fee = db.feeTypes.find((f) => f.id === payment.feeTypeId);
          const enrollment = db.enrollments.find((e) => e.studentId === student?.id && e.academicYearId === currentYear.id);
          const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-lg font-black uppercase text-slate-900">{db.school.name}</h1>
                  <p className="text-[11px] font-semibold text-slate-600">{db.school.slogan}</p>
                  <p className="text-[10px] text-slate-500">{db.school.address} • {db.school.city}, {db.school.country}</p>
                  <p className="text-[10px] text-slate-500 font-mono">Tél: {db.school.phone} • Email: {db.school.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-md bg-slate-900 text-white font-black text-xs px-3 py-1 uppercase tracking-wider">
                    QUITTANCE OFFICIELLE
                  </span>
                  <p className="mt-2 text-xs font-mono font-bold text-slate-800">N° {payment.receiptNumber}</p>
                  <p className="text-[11px] text-slate-500">Date : {formatDate(payment.date)}</p>
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Élève & Classe</span>
                  <p className="text-sm font-black text-slate-900">{student?.lastName} {student?.firstName}</p>
                  <p className="font-mono text-xs text-blue-700">Matricule : {student?.matricule}</p>
                  <p className="text-xs font-semibold text-slate-700">Classe : {cls?.name || 'Inscrit'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Détails Règlement</span>
                  <p className="text-xs font-bold text-slate-800">Motif : {fee?.name}</p>
                  <p className="text-xs text-slate-600">Mode : {payment.paymentMethod}</p>
                  {payment.reference && <p className="text-[10px] font-mono text-slate-500">Réf : {payment.reference}</p>}
                </div>
              </div>

              {/* Amount Box */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-slate-600 block">Montant Encaissé</span>
                  <span className="text-xs italic text-slate-500">En toutes lettres et chiffres certifiés</span>
                </div>
                <span className="text-2xl font-black text-slate-900">
                  {formatCurrency(payment.amountPaid, payment.currency)}
                </span>
              </div>

              {payment.notes && (
                <p className="text-xs text-slate-500 italic bg-white p-2 border border-slate-100 rounded-md">
                  Observations : {payment.notes}
                </p>
              )}

              {/* Signatures */}
              <div className="pt-8 flex justify-between items-end border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <QrCode className="h-12 w-12 text-slate-800" />
                  <div>
                    <p className="font-mono text-[10px] font-bold text-slate-800">EDUGEST VERIFIED</p>
                    <p className="text-[9px] text-slate-400">Authentification numérique unique</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-xs font-bold uppercase text-slate-700">Le Caissier / L'Économe</p>
                  <p className="text-[10px] text-slate-500 mt-1">{payment.cashierName}</p>
                  <div className="mt-4 border-2 border-emerald-600 text-emerald-700 font-black text-[10px] px-3 py-1 rounded-sm uppercase tracking-widest inline-block">
                    [ PAYÉ & VALIDÉ ]
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 2. BULLETIN SCOLAIRE (OFFICIEL OU BLANC) */}
        {mode.type === 'REPORT_CARD' && (() => {
          const report = mode.summary;
          const isBlanc = mode.isBlanc;

          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="text-center border-b-2 border-slate-900 pb-3">
                <p className="text-[10px] font-bold uppercase text-slate-500">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
                <h1 className="text-lg font-black uppercase text-slate-900">{db.school.name}</h1>
                <p className="text-[11px] text-slate-600 font-semibold">{db.school.slogan} • {db.school.city}</p>
                <p className="text-[10px] text-slate-400">{db.school.ministerialOrder}</p>

                <div className="mt-3">
                  <span
                    className={`inline-block font-black text-xs uppercase tracking-widest px-4 py-1 rounded-sm ${
                      isBlanc
                        ? 'bg-amber-400 text-amber-950 border-2 border-amber-600'
                        : 'bg-blue-900 text-white'
                    }`}
                  >
                    {isBlanc ? 'SIMULATION - BULLETIN BLANC' : 'BULLETIN SCOLAIRE PÉRIODIQUE & SEMESTRIEL'}
                  </span>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <p>Élève : <strong className="text-sm font-black text-slate-900">{report.student.lastName} {report.student.middleName} {report.student.firstName}</strong></p>
                  <p>Matricule : <strong className="font-mono text-blue-700">{report.student.matricule}</strong></p>
                  <p>Né(e) le : {formatDate(report.student.birthDate)} ({report.student.gender})</p>
                </div>
                <div className="text-right">
                  <p>Classe : <strong className="text-sm font-bold text-slate-900">{report.studentClass?.name}</strong></p>
                  <p>Année Scolaire : <strong>{currentYear.name}</strong></p>
                  <p>Effectif de la classe : <strong>{report.totalStudentsInClass} élèves</strong></p>
                </div>
              </div>

              {/* Disciplines Matrix */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-black text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3">Disciplines Enseignées</th>
                      <th className="py-2 px-2 text-center">Coef</th>
                      <th className="py-2 px-2 text-center">1ère Période</th>
                      <th className="py-2 px-2 text-center">2ème Période</th>
                      <th className="py-2 px-2 text-center">Examen Sem. 1</th>
                      <th className="py-2 px-2 text-center">Total Semestre</th>
                      <th className="py-2 px-2 text-center">%</th>
                      <th className="py-2 px-3 text-right">Appréciation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {report.rows.map((row) => (
                      <tr key={row.subject.id}>
                        <td className="py-1.5 px-3 font-bold text-slate-900">{row.subject.name}</td>
                        <td className="py-1.5 px-2 text-center font-mono">{row.coefficient}</td>
                        <td className="py-1.5 px-2 text-center">{row.scoreP1 !== undefined ? `${row.scoreP1}/${row.maxP1}` : '-'}</td>
                        <td className="py-1.5 px-2 text-center">{row.scoreP2 !== undefined ? `${row.scoreP2}/${row.maxP2}` : '-'}</td>
                        <td className="py-1.5 px-2 text-center">{row.scoreEX1 !== undefined ? `${row.scoreEX1}/${row.maxEX1}` : '-'}</td>
                        <td className="py-1.5 px-2 text-center font-bold text-slate-900">{row.totalSem1} / {row.maxSem1}</td>
                        <td className="py-1.5 px-2 text-center font-black text-blue-900">{row.percentageSem1}%</td>
                        <td className="py-1.5 px-3 text-right text-[11px] text-slate-600">{row.appreciation}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-black text-slate-900 border-t border-slate-300">
                    <tr>
                      <td className="py-2 px-3 uppercase">Total Général</td>
                      <td className="py-2 px-2 text-center">-</td>
                      <td colSpan={3} className="py-2 px-2 text-center">Points Obtenus : {report.totalScore} / {report.totalMaxScore}</td>
                      <td className="py-2 px-2 text-center text-sm">{report.generalPercentage}%</td>
                      <td colSpan={2} className="py-2 px-3 text-right uppercase text-blue-900">
                        Rang : #{report.rank} / {report.totalStudentsInClass}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Deliberation Decision Summary */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] block">Moyenne de la Classe</span>
                  <span className="font-bold text-slate-800">{report.classAveragePercentage}%</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Mention du Jury</span>
                  <span className={`font-black ${report.mention.color}`}>{report.mention.label}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Décision du Conseil</span>
                  <span className={`font-black ${report.generalPercentage >= 50 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {report.generalPercentage >= 50 ? 'ADMIS(E) / SATISFAISANT' : 'AJOURNÉ(E) / EN RISQUE'}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="font-bold uppercase text-slate-700">Le Titulaire de Classe</p>
                  <div className="mt-8 border-b border-slate-300" />
                </div>
                <div>
                  <p className="font-bold uppercase text-slate-700">Le Tuteur / Parent</p>
                  <div className="mt-8 border-b border-slate-300" />
                </div>
                <div>
                  <p className="font-bold uppercase text-slate-700">{db.school.headmasterTitle}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{db.school.headmasterName}</p>
                  <div className="mt-6 border-b border-slate-300" />
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. CARTE D'ÉLÈVE */}
        {mode.type === 'STUDENT_CARD' && (() => {
          const student = mode.student;
          const enrollment = db.enrollments.find((e) => e.studentId === student.id && e.academicYearId === currentYear.id);
          const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;

          return (
            <div className="max-w-md mx-auto p-6 rounded-2xl border-2 border-blue-900 bg-white text-slate-900 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-blue-900 pb-2">
                <div>
                  <h3 className="font-black text-sm uppercase text-blue-900">{db.school.name}</h3>
                  <p className="text-[10px] text-slate-500">{db.school.city} • CARTE D'IDENTITÉ SCOLAIRE</p>
                </div>
                <span className="font-black text-xs text-blue-900">{currentYear.name}</span>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-24 w-24 rounded-xl bg-slate-100 border-2 border-slate-300 flex items-center justify-center font-black text-2xl text-slate-600 shrink-0">
                  {student.lastName.charAt(0)}{student.firstName.charAt(0)}
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-black text-sm text-slate-900">{student.lastName} {student.middleName} {student.firstName}</h4>
                  <p className="text-slate-600">Matricule : <strong className="font-mono text-blue-700">{student.matricule}</strong></p>
                  <p className="text-slate-600">Classe : <strong>{cls?.name || 'Inscrit'}</strong></p>
                  <p className="text-slate-600">Né(e) le : {formatDate(student.birthDate)} à {student.birthPlace}</p>
                  <p className="text-slate-600">Sexe : <strong>{student.gender}</strong> • Sang : <strong>{student.bloodGroup || 'O+'}</strong></p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                <div>
                  <p>Parent : {student.parentName}</p>
                  <p>Tél : {student.parentPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-10 w-10 text-slate-800" />
                  <div className="text-right">
                    <p className="font-bold text-slate-800">LE CHEF D'ÉTABLISSEMENT</p>
                    <p className="text-[9px]">[ CACHET OFFICIEL ]</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 4. ATTESTATION */}
        {mode.type === 'ATTESTATION' && (() => {
          const student = mode.student;
          const enrollment = db.enrollments.find((e) => e.studentId === student.id && e.academicYearId === currentYear.id);
          const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;

          return (
            <div className="space-y-6 text-slate-800 leading-relaxed text-justify">
              <div className="text-center border-b-2 border-slate-900 pb-4">
                <p className="font-bold text-slate-500 uppercase text-[10px]">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
                <p className="font-bold text-slate-500 uppercase text-[10px]">MINISTÈRE DE L'ÉDUCATION NATIONALE</p>
                <h2 className="font-black text-lg text-blue-900 uppercase mt-1">{db.school.name}</h2>
                <p className="text-xs text-slate-500">{db.school.ministerialOrder}</p>

                <h3 className="mt-4 font-black text-base uppercase underline underline-offset-4 tracking-wider text-slate-900">
                  ATTESTATION DE FRÉQUENTATION SCOLAIRE
                </h3>
              </div>

              <p>
                Je soussigné, <strong>{db.school.headmasterName}</strong>, {db.school.headmasterTitle} du {db.school.name}, atteste par la présente que l'élève :
              </p>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <p>Nom, Postnom & Prénom : <strong className="text-sm text-slate-900">{student.lastName} {student.middleName} {student.firstName}</strong></p>
                <p>Matricule Unique : <strong className="font-mono text-blue-700">{student.matricule}</strong></p>
                <p>Né(e) à : <strong>{student.birthPlace}</strong>, le <strong>{formatDate(student.birthDate)}</strong></p>
                <p>Classe fréquentée : <strong className="text-blue-900">{cls?.name || 'Classe régulière'}</strong></p>
              </div>

              <p>
                Est régulièrement inscrit(e) et poursuit assidûment ses études pour le compte de l'année scolaire <strong>{currentYear.name}</strong>.
              </p>

              <p>
                En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.
              </p>

              <div className="pt-8 flex justify-between items-end">
                <div className="flex items-center gap-3">
                  <QrCode className="h-10 w-10 text-slate-800" />
                  <p className="text-[10px] text-slate-400 font-mono">CERT-SEC-{student.id.substring(4, 9)}</p>
                </div>
                <div className="text-center space-y-8">
                  <p className="text-xs">Fait à {db.school.city}, le {formatDate(new Date().toISOString())}</p>
                  <p className="font-bold uppercase text-xs">{db.school.headmasterTitle}<br /><br /><strong>{db.school.headmasterName}</strong></p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 5. CLASS ROSTER */}
        {mode.type === 'CLASS_ROSTER' && (() => {
          const cls = mode.schoolClass;
          const enrolled = db.students.filter((s) =>
            db.enrollments.some(
              (e) => e.studentId === s.id && e.classId === cls.id && e.academicYearId === currentYear.id && e.status === 'CONFIRME'
            )
          );
          const teacher = db.teachers.find((t) => t.id === cls.mainTeacherId);

          return (
            <div className="space-y-4">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
                <div>
                  <h2 className="font-black text-base uppercase text-slate-900">{db.school.name}</h2>
                  <p className="text-xs text-slate-600">Registre d'Appel & Liste Officielle de Classe</p>
                </div>
                <div className="text-right">
                  <h3 className="font-black text-sm text-blue-900">{cls.name}</h3>
                  <p className="text-[11px] text-slate-500">Année : {currentYear.name} • Salle : {cls.room}</p>
                  <p className="text-[11px] text-slate-500">Titulaire : {teacher?.fullName || 'Non assigné'}</p>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">N°</th>
                    <th className="py-2 px-3">Matricule</th>
                    <th className="py-2 px-3">Nom, Postnom & Prénom</th>
                    <th className="py-2 px-2 text-center">Sexe</th>
                    <th className="py-2 px-3">Contact Parent</th>
                    <th className="py-2 px-3 text-center w-28">Signature / Émargement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {enrolled.map((st, i) => (
                    <tr key={st.id}>
                      <td className="py-2 px-2 text-center font-bold">{i + 1}</td>
                      <td className="py-2 px-3 font-mono text-blue-700">{st.matricule}</td>
                      <td className="py-2 px-3 font-bold">{st.lastName} {st.middleName} {st.firstName}</td>
                      <td className="py-2 px-2 text-center">{st.gender}</td>
                      <td className="py-2 px-3 text-slate-600">{st.parentName} ({st.parentPhone})</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-block w-20 border-b border-dashed border-slate-400" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-4 flex justify-between items-center text-xs text-slate-500">
                <span>Total inscrits : <strong>{enrolled.length} élèves</strong></span>
                <span>Visa de la Direction : ___________________________</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
