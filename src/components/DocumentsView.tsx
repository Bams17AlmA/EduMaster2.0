import React, { useState } from 'react';
import {
  Printer,
  Receipt,
  Award,
  FileText,
  Users,
  Wallet,
  Download,
  Calendar,
  Eye,
  CheckCircle,
  QrCode,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { AppDatabase } from '../services/storage';
import { Payment, Student, SchoolClass } from '../types';
import { formatCurrency, formatDate, computeClassReports } from '../utils/helpers';

interface DocumentsViewProps {
  db: AppDatabase;
  onPrintReceipt: (payment: Payment) => void;
  onPrintStudentCard: (student: Student) => void;
  onPrintAttestation: (student: Student) => void;
  onPrintClassRoster: (cls: SchoolClass) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  db,
  onPrintReceipt,
  onPrintStudentCard,
  onPrintAttestation,
  onPrintClassRoster,
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [selectedDocType, setSelectedDocType] = useState<
    'RECEIPT' | 'STUDENT_CARD' | 'ATTESTATION' | 'CLASS_ROSTER' | 'FINANCIAL_JOURNAL'
  >('RECEIPT');

  // Selectors for specific instances
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(db.payments[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(db.students[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(db.classes[0]?.id || '');

  const selectedPayment = db.payments.find((p) => p.id === selectedPaymentId) || db.payments[0];
  const selectedStudent = db.students.find((s) => s.id === selectedStudentId) || db.students[0];
  const selectedClass = db.classes.find((c) => c.id === selectedClassId) || db.classes[0];

  const handlePrintFinancialJournal = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Centre de Génération & Impression de Documents
          </h2>
          <p className="text-xs text-slate-500">
            Émission certifiée des reçus officiels, cartes d'élèves, attestations, registres d'appel et états de caisse
          </p>
        </div>
      </div>

      {/* Document Types Selector Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setSelectedDocType('RECEIPT')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedDocType === 'RECEIPT'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Receipt className="h-5 w-5 text-blue-600 mb-2" />
          <div>
            <span className="font-bold text-xs block">Reçu de Caisse</span>
            <span className="text-[10px] text-slate-500">Quittance officielle</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedDocType('STUDENT_CARD')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedDocType === 'STUDENT_CARD'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Award className="h-5 w-5 text-indigo-600 mb-2" />
          <div>
            <span className="font-bold text-xs block">Carte d'Élève</span>
            <span className="text-[10px] text-slate-500">Badge avec QR Code</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedDocType('ATTESTATION')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedDocType === 'ATTESTATION'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <FileText className="h-5 w-5 text-emerald-600 mb-2" />
          <div>
            <span className="font-bold text-xs block">Attestation</span>
            <span className="text-[10px] text-slate-500">Certificat de scolarité</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedDocType('CLASS_ROSTER')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedDocType === 'CLASS_ROSTER'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Users className="h-5 w-5 text-purple-600 mb-2" />
          <div>
            <span className="font-bold text-xs block">Liste de Classe</span>
            <span className="text-[10px] text-slate-500">Registre d'émargement</span>
          </div>
        </button>

        <button
          onClick={() => setSelectedDocType('FINANCIAL_JOURNAL')}
          className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
            selectedDocType === 'FINANCIAL_JOURNAL'
              ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Wallet className="h-5 w-5 text-amber-600 mb-2" />
          <div>
            <span className="font-bold text-xs block">Journal de Caisse</span>
            <span className="text-[10px] text-slate-500">Bilan récapitulatif</span>
          </div>
        </button>
      </div>

      {/* Main Document Preview & Customization View */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        {/* DOCUMENT 1: RECEIPT PREVIEW */}
        {selectedDocType === 'RECEIPT' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Choisir le reçu :</label>
                <select
                  value={selectedPayment?.id}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {db.payments.map((p) => {
                    const st = db.students.find((s) => s.id === p.studentId);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.receiptNumber} - {st ? `${st.lastName} ${st.firstName}` : ''} ({formatCurrency(p.amountPaid, p.currency)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedPayment && (
                <button
                  onClick={() => onPrintReceipt(selectedPayment)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer / Exporter le Reçu PDF</span>
                </button>
              )}
            </div>

            {/* Visual Receipt Card representation */}
            {selectedPayment && (() => {
              const student = db.students.find((s) => s.id === selectedPayment.studentId);
              const fee = db.feeTypes.find((f) => f.id === selectedPayment.feeTypeId);
              const enrollment = db.enrollments.find((e) => e.studentId === student?.id && e.academicYearId === currentYear.id);
              const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;

              return (
                <div className="max-w-xl mx-auto rounded-2xl border-2 border-slate-300 bg-slate-50/50 p-6 shadow-sm font-sans space-y-4">
                  {/* Header School */}
                  <div className="text-center border-b border-slate-200 pb-3">
                    <h3 className="font-black text-sm uppercase tracking-wider text-blue-900">
                      {db.school.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">{db.school.slogan} • {db.school.city}, {db.school.country}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{db.school.phone} • {db.school.email}</p>
                    <div className="mt-2 inline-block rounded-md bg-blue-900 px-3 py-0.5 text-xs font-bold text-white uppercase tracking-widest">
                      REÇU DE PAIEMENT SCOLAIRE
                    </div>
                  </div>

                  {/* Receipt Meta */}
                  <div className="flex justify-between text-xs border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-slate-500">N° Reçu : <strong className="text-slate-900 font-mono">{selectedPayment.receiptNumber}</strong></p>
                      <p className="text-slate-500">Date : <strong>{formatDate(selectedPayment.date)}</strong></p>
                      <p className="text-slate-500">Année Scolaire : <strong>{currentYear.name}</strong></p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-500">Mode : <strong className="capitalize">{selectedPayment.paymentMethod.toLowerCase()}</strong></p>
                      {selectedPayment.reference && (
                        <p className="text-slate-500 font-mono text-[10px]">Réf: {selectedPayment.reference}</p>
                      )}
                      <p className="text-slate-500 text-[10px]">Caissier: {selectedPayment.cashierName}</p>
                    </div>
                  </div>

                  {/* Student & Fee info */}
                  <div className="space-y-1 text-xs">
                    <p>Reçu de : <strong className="text-sm text-slate-900">{student?.lastName} {student?.firstName}</strong></p>
                    <p className="text-slate-600">Matricule : <strong className="font-mono text-blue-700">{student?.matricule}</strong> • Classe : <strong>{cls?.name || '-'}</strong></p>
                    <p className="text-slate-600">Motif : <strong>{fee?.name || 'Frais de scolarité'}</strong></p>
                    {selectedPayment.notes && <p className="text-slate-500 italic text-[11px]">Note : {selectedPayment.notes}</p>}
                  </div>

                  {/* Amount highlighted */}
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-900 uppercase">Somme Payée :</span>
                    <span className="font-black text-xl text-emerald-800">
                      {formatCurrency(selectedPayment.amountPaid, selectedPayment.currency)}
                    </span>
                  </div>

                  {/* Footer & Stamps */}
                  <div className="flex items-center justify-between pt-4 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-8 w-8 text-slate-600" />
                      <div>
                        <p className="font-mono font-bold text-slate-700">AUTHENTIFIÉ EDUGEST</p>
                        <p>Document officiel faisant foi</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-700">Cachet & Signature Caisse</p>
                      <div className="mt-1 h-8 w-24 border border-dashed border-slate-300 rounded-sm flex items-center justify-center text-[9px] text-emerald-600 font-black">
                        [ PAYÉ ]
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* DOCUMENT 2: STUDENT CARD PREVIEW */}
        {selectedDocType === 'STUDENT_CARD' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Choisir l'élève :</label>
                <select
                  value={selectedStudent?.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {db.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.lastName} {st.firstName} ({st.matricule})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <button
                  onClick={() => onPrintStudentCard(selectedStudent)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer la Carte Scolaire (Format Badge)</span>
                </button>
              )}
            </div>

            {/* Visual Badge Card */}
            {selectedStudent && (() => {
              const enrollment = db.enrollments.find((e) => e.studentId === selectedStudent.id && e.academicYearId === currentYear.id);
              const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;

              return (
                <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-5 text-white shadow-xl border border-blue-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />

                  <div className="flex items-center justify-between border-b border-white/20 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">{db.school.name}</h4>
                      <p className="text-[9px] text-blue-200">{db.school.city} • CARTE D'ÉLÈVE {currentYear.name}</p>
                    </div>
                    <span className="text-[10px] font-bold bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-sm">
                      VALIDE
                    </span>
                  </div>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="h-20 w-20 rounded-xl bg-white/20 border-2 border-white/40 flex items-center justify-center font-black text-2xl text-white shrink-0">
                      {selectedStudent.lastName.charAt(0)}{selectedStudent.firstName.charAt(0)}
                    </div>
                    <div className="space-y-1 text-xs">
                      <h3 className="font-black text-sm text-white">
                        {selectedStudent.lastName} {selectedStudent.middleName} {selectedStudent.firstName}
                      </h3>
                      <p className="text-[11px] text-blue-200">
                        Matricule : <strong className="text-amber-300 font-mono">{selectedStudent.matricule}</strong>
                      </p>
                      <p className="text-[11px] text-blue-200">
                        Classe : <strong>{cls?.name || 'Inscrit'}</strong>
                      </p>
                      <p className="text-[10px] text-slate-300">
                        Né(e) le : {formatDate(selectedStudent.birthDate)} ({selectedStudent.gender})
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-white/20 flex items-center justify-between text-[10px] text-slate-300">
                    <div>
                      <p>Tuteur : {selectedStudent.parentName}</p>
                      <p>Urgences : {selectedStudent.parentPhone}</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-md text-slate-900">
                      <QrCode className="h-7 w-7" />
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* DOCUMENT 3: ATTESTATION / CERTIFICAT */}
        {selectedDocType === 'ATTESTATION' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Choisir l'élève :</label>
                <select
                  value={selectedStudent?.id}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {db.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.lastName} {st.firstName} ({st.matricule})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <button
                  onClick={() => onPrintAttestation(selectedStudent)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer le Certificat de Scolarité</span>
                </button>
              )}
            </div>

            {selectedStudent && (() => {
              const enrollment = db.enrollments.find((e) => e.studentId === selectedStudent.id && e.academicYearId === currentYear.id);
              const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;

              return (
                <div className="max-w-xl mx-auto rounded-xl border border-slate-200 bg-white p-8 shadow-xs space-y-5 text-slate-800 text-xs">
                  <div className="text-center border-b border-slate-200 pb-4">
                    <p className="font-bold text-slate-500 uppercase text-[10px]">RÉPUBLIQUE DÉMOCRATIQUE DU CONGO</p>
                    <p className="font-bold text-slate-500 uppercase text-[10px]">MINISTÈRE DE L'ÉDUCATION NATIONALE</p>
                    <h3 className="font-black text-base text-blue-900 mt-1 uppercase">{db.school.name}</h3>
                    <p className="text-[10px] text-slate-400">{db.school.ministerialOrder}</p>
                    <h4 className="mt-4 font-black text-sm uppercase tracking-widest text-slate-900 underline underline-offset-4">
                      ATTESTATION DE FRÉQUENTATION SCOLAIRE
                    </h4>
                  </div>

                  <p className="leading-relaxed text-justify">
                    Je soussigné, <strong>{db.school.headmasterName}</strong>, {db.school.headmasterTitle} du {db.school.name}, atteste par la présente que l'élève :
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p>Nom, Postnom & Prénom : <strong className="text-slate-900">{selectedStudent.lastName} {selectedStudent.middleName} {selectedStudent.firstName}</strong></p>
                    <p>Matricule Scolaire : <strong className="font-mono text-blue-700">{selectedStudent.matricule}</strong></p>
                    <p>Né(e) à : <strong>{selectedStudent.birthPlace}</strong>, le <strong>{formatDate(selectedStudent.birthDate)}</strong></p>
                    <p>Classe fréquentée : <strong className="text-blue-900">{cls?.name || 'Élève régulier'}</strong></p>
                  </div>

                  <p className="leading-relaxed text-justify">
                    Est régulièrement inscrit(e) et poursuit assidûment ses études au sein de notre établissement pour le compte de l'année scolaire <strong>{currentYear.name}</strong>.
                  </p>

                  <p className="leading-relaxed">
                    En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.
                  </p>

                  <div className="pt-6 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] text-slate-400 font-mono">Code d'authentification : SEC-{selectedStudent.id.substring(4, 9)}</p>
                    </div>
                    <div className="text-center space-y-8">
                      <p>Fait à {db.school.city}, le {formatDate(new Date().toISOString())}</p>
                      <p className="font-bold uppercase text-[11px]">{db.school.headmasterTitle}<br /><br /><strong>{db.school.headmasterName}</strong></p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* DOCUMENT 4: CLASS ROSTER */}
        {selectedDocType === 'CLASS_ROSTER' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Choisir la classe :</label>
                <select
                  value={selectedClass?.id}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {db.classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.room})
                    </option>
                  ))}
                </select>
              </div>

              {selectedClass && (
                <button
                  onClick={() => onPrintClassRoster(selectedClass)}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimer la Liste de Présence / Appel</span>
                </button>
              )}
            </div>

            {selectedClass && (() => {
              const enrolled = db.students.filter((s) =>
                db.enrollments.some(
                  (e) => e.studentId === s.id && e.classId === selectedClass.id && e.academicYearId === currentYear.id && e.status === 'CONFIRME'
                )
              );
              const teacher = db.teachers.find((t) => t.id === selectedClass.mainTeacherId);

              return (
                <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{selectedClass.name}</h4>
                      <p className="text-xs text-slate-500">
                        Titulaire : {teacher?.fullName || 'Non désigné'} • Salle : {selectedClass.room}
                      </p>
                    </div>
                    <span className="font-bold text-xs bg-blue-50 text-blue-900 px-2.5 py-1 rounded-lg">
                      Effectif : {enrolled.length} élèves
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold text-slate-500">
                      <tr>
                        <th className="py-2 px-3">N°</th>
                        <th className="py-2 px-3">Matricule</th>
                        <th className="py-2 px-3">Nom, Postnom & Prénom</th>
                        <th className="py-2 px-3">Sexe</th>
                        <th className="py-2 px-3">Tuteur / Téléphone</th>
                        <th className="py-2 px-3 text-right">Émargement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrolled.map((st, idx) => (
                        <tr key={st.id}>
                          <td className="py-2 px-3 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono text-blue-700">{st.matricule}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{st.lastName} {st.middleName} {st.firstName}</td>
                          <td className="py-2 px-3">{st.gender}</td>
                          <td className="py-2 px-3 text-slate-500">{st.parentName} ({st.parentPhone})</td>
                          <td className="py-2 px-3 text-right">
                            <span className="inline-block w-20 border-b border-dashed border-slate-300" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* DOCUMENT 5: FINANCIAL JOURNAL */}
        {selectedDocType === 'FINANCIAL_JOURNAL' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Grand Livre de Caisse & Journal des Recettes ({currentYear.name})
              </h3>
              <button
                onClick={handlePrintFinancialJournal}
                className="flex items-center gap-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimer l'État de Caisse</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-500">
                  <tr>
                    <th className="py-2.5 px-3">Reçu N°</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Élève</th>
                    <th className="py-2.5 px-3">Frais</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3">Montant Encaissé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {db.payments.map((p) => {
                    const st = db.students.find((s) => s.id === p.studentId);
                    const fee = db.feeTypes.find((f) => f.id === p.feeTypeId);
                    return (
                      <tr key={p.id}>
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{p.receiptNumber}</td>
                        <td className="py-2 px-3 text-slate-500">{formatDate(p.date)}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{st ? `${st.lastName} ${st.firstName}` : '-'}</td>
                        <td className="py-2 px-3 text-slate-700">{fee?.name}</td>
                        <td className="py-2 px-3">{p.paymentMethod}</td>
                        <td className="py-2 px-3 font-black text-emerald-700">+{formatCurrency(p.amountPaid, p.currency)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
