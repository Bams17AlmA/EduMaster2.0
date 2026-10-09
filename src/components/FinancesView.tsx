import React, { useState } from 'react';
import {
  Wallet,
  CreditCard,
  Plus,
  AlertTriangle,
  Receipt,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Printer,
  Calendar,
  Layers,
  ArrowDownRight,
  User,
  X,
  FileText,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { FeeType, Payment, PaymentMethod, Student } from '../types';
import { formatCurrency, formatDate, calculateStudentFinances } from '../utils/helpers';

interface FinancesViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
  onPrintReceipt: (payment: Payment) => void;
}

export const FinancesView: React.FC<FinancesViewProps> = ({
  db,
  onUpdateDb,
  onPrintReceipt,
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];
  const [activeTab, setActiveTab] = useState<'PAYMENTS' | 'DEBTS' | 'FEE_TYPES'>('PAYMENTS');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');

  // Cashier Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{
    studentId: string;
    feeTypeId: string;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    reference: string;
    notes: string;
  }>({
    studentId: db.students[0]?.id || '',
    feeTypeId: db.feeTypes[0]?.id || '',
    amountPaid: 50,
    paymentMethod: 'ESPECES',
    reference: '',
    notes: '',
  });

  // Fee Type Modal
  const [isFeeTypeModalOpen, setIsFeeTypeModalOpen] = useState(false);
  const [feeTypeForm, setFeeTypeForm] = useState<Partial<FeeType>>({
    category: 'SCOLARITE',
    amount: 100,
    currency: db.school.currency,
  });

  // Compute student financial states
  const studentFinancesList = db.students.map((student) => {
    const fin = calculateStudentFinances(
      student.id,
      currentYear.id,
      db.feeTypes,
      db.payments,
      db.enrollments,
      db.classes
    );
    const enrollment = db.enrollments.find(
      (e) => e.studentId === student.id && e.academicYearId === currentYear.id
    );
    const cls = enrollment ? db.classes.find((c) => c.id === enrollment.classId) : null;
    return {
      student,
      cls,
      ...fin,
    };
  });

  // Debtors list (only those with unpaid or partial status)
  const debtorsList = studentFinancesList.filter(
    (item) => item.status === 'IMPAYE' || item.status === 'PARTIEL'
  );

  const filteredDebtors = debtorsList.filter((item) => {
    if (selectedClassFilter !== 'ALL' && item.cls?.id !== selectedClassFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        item.student.lastName.toLowerCase().includes(q) ||
        item.student.firstName.toLowerCase().includes(q) ||
        item.student.matricule.toLowerCase().includes(q) ||
        (item.student.parentPhone && item.student.parentPhone.includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Payments list filtered
  const currentPayments = db.payments.filter((p) => p.academicYearId === currentYear.id);
  const filteredPayments = currentPayments.filter((p) => {
    const student = db.students.find((s) => s.id === p.studentId);
    if (!student) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        student.lastName.toLowerCase().includes(q) ||
        student.firstName.toLowerCase().includes(q) ||
        p.receiptNumber.toLowerCase().includes(q) ||
        (p.reference && p.reference.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  // Handle Record Payment
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.studentId || !paymentForm.feeTypeId || paymentForm.amountPaid <= 0) return;

    const student = db.students.find((s) => s.id === paymentForm.studentId);
    const feeType = db.feeTypes.find((f) => f.id === paymentForm.feeTypeId);
    if (!student || !feeType) return;

    const nextReceiptNum = `REC-${currentYear.name.split('-')[0]}-${String(db.payments.length + 101).padStart(5, '0')}`;

    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      receiptNumber: nextReceiptNum,
      studentId: student.id,
      feeTypeId: feeType.id,
      academicYearId: currentYear.id,
      amountPaid: Number(paymentForm.amountPaid),
      currency: feeType.currency || db.school.currency,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentForm.paymentMethod,
      reference: paymentForm.reference || undefined,
      cashierName: db.currentUser.name,
      notes: paymentForm.notes || undefined,
    };

    const log = createAuditLog(
      db.currentUser,
      'ENCAISSEMENT_FRAIS',
      `Encaissement de ${formatCurrency(newPayment.amountPaid, newPayment.currency)} pour ${student.lastName} ${student.firstName} (${feeType.name}) - Reçu ${nextReceiptNum}`,
      'PAIEMENT',
      newPayment.id
    );

    onUpdateDb({
      ...db,
      payments: [newPayment, ...db.payments],
      auditLogs: [log, ...db.auditLogs],
    });

    setIsPaymentModalOpen(false);
    // Optionally trigger receipt printing automatically!
    onPrintReceipt(newPayment);
  };

  // Handle Save Fee Type
  const handleSaveFeeType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeTypeForm.name || !feeTypeForm.amount) return;

    const newFee: FeeType = {
      id: 'fee-' + Date.now(),
      name: feeTypeForm.name,
      category: feeTypeForm.category || 'SCOLARITE',
      amount: Number(feeTypeForm.amount),
      currency: feeTypeForm.currency || db.school.currency,
      dueDate: feeTypeForm.dueDate,
      description: feeTypeForm.description,
    };

    onUpdateDb({
      ...db,
      feeTypes: [...db.feeTypes, newFee],
      auditLogs: [
        createAuditLog(db.currentUser, 'AJOUT_FRAIS', `Configuration du frais : ${newFee.name} (${newFee.amount} ${newFee.currency})`, 'SYSTEME'),
        ...db.auditLogs,
      ],
    });

    setIsFeeTypeModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Gestion Financière & Recouvrement des Frais
          </h2>
          <p className="text-xs text-slate-500">
            Encaissements de scolarité, gestion des tranches, relance des impayés et reçus officiels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFeeTypeModalOpen(true)}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Paramétrer les Frais
          </button>
          <button
            onClick={() => {
              setPaymentForm({
                studentId: db.students[0]?.id || '',
                feeTypeId: db.feeTypes[0]?.id || '',
                amountPaid: 50,
                paymentMethod: 'ESPECES',
                reference: '',
                notes: '',
              });
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
          >
            <CreditCard className="h-4 w-4" />
            <span>Encaisser un Paiement</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Header */}
      {(() => {
        const totalCollected = currentPayments.reduce((s, p) => s + p.amountPaid, 0);
        const totalDebts = debtorsList.reduce((s, d) => s + d.balanceRemaining, 0);
        const totalExpected = studentFinancesList.reduce((s, d) => s + d.totalDue, 0);
        const rate = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;

        return (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Total Encaissé ({currentYear.name})</span>
              <span className="text-2xl font-black text-emerald-900 mt-1 block">
                {formatCurrency(totalCollected, db.school.currency)}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold">{currentPayments.length} transactions validées</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Dettes & Reste à Recouvrer</span>
              <span className="text-2xl font-black text-amber-900 mt-1 block">
                {formatCurrency(totalDebts, db.school.currency)}
              </span>
              <span className="text-[11px] text-amber-700 font-semibold">{debtorsList.length} élèves débiteurs</span>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">Taux de Recouvrement</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-blue-900">{rate}%</span>
                <span className="text-xs text-blue-700 font-medium">du budget prévisionnel</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-blue-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-700 rounded-full" style={{ width: `${rate}%` }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PAYMENTS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="h-3.5 w-3.5" />
          <span>Journal des Paiements & Reçus ({currentPayments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('DEBTS')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'DEBTS' ? 'bg-amber-500 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Élèves Débiteurs & Relances ({debtorsList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('FEE_TYPES')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'FEE_TYPES' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Grille Tarifaire ({db.feeTypes.length})</span>
        </button>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher élève, n° de reçu, bordereau..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden"
          />
        </div>

        {activeTab === 'DEBTS' && (
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
        )}
      </div>

      {/* TAB 1: PAYMENTS JOURNAL */}
      {activeTab === 'PAYMENTS' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">N° Reçu</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Élève Bénéficiaire</th>
                  <th className="py-3 px-4">Frais Concerné</th>
                  <th className="py-3 px-4">Montant Versé</th>
                  <th className="py-3 px-4">Mode / Référence</th>
                  <th className="py-3 px-4">Caissier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Aucun encaissement trouvé.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => {
                    const student = db.students.find((s) => s.id === pay.studentId);
                    const fee = db.feeTypes.find((f) => f.id === pay.feeTypeId);

                    return (
                      <tr key={pay.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">
                          {pay.receiptNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(pay.date)}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {student ? `${student.lastName} ${student.firstName}` : 'Inconnu'}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{student?.matricule}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {fee ? fee.name : 'Frais divers'}
                        </td>
                        <td className="py-3 px-4 font-black text-sm text-emerald-700">
                          +{formatCurrency(pay.amountPaid, pay.currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block rounded-sm bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            {pay.paymentMethod}
                          </span>
                          {pay.reference && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{pay.reference}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{pay.cashierName}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onPrintReceipt(pay)}
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 text-xs font-bold transition cursor-pointer"
                            title="Imprimer le reçu officiel"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Imprimer Reçu</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEBTS & UNPAID */}
      {activeTab === 'DEBTS' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Liste des Élèves Débiteurs (Impayés & Acomptes Partiels)
                </h3>
                <p className="text-xs text-slate-500">
                  Suivi des créances de l'établissement pour relance des parents d'élèves
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Élève & Matricule</th>
                    <th className="py-3 px-4">Classe</th>
                    <th className="py-3 px-4">Contact Tuteur</th>
                    <th className="py-3 px-4">Total Exigible</th>
                    <th className="py-3 px-4">Déjà Versé</th>
                    <th className="py-3 px-4">Solde Restant Dû</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDebtors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-emerald-600 font-bold">
                        Tous les élèves sont actuellement en règle avec leurs frais de scolarité !
                      </td>
                    </tr>
                  ) : (
                    filteredDebtors.map((item) => (
                      <tr key={item.student.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {item.student.lastName} {item.student.firstName}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{item.student.matricule}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          {item.cls ? item.cls.name : 'Non assigné'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{item.student.parentName}</div>
                          <div className="text-[10px] text-slate-500">{item.student.parentPhone}</div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {formatCurrency(item.totalDue, db.school.currency)}
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          {formatCurrency(item.totalPaid, db.school.currency)}
                        </td>
                        <td className="py-3 px-4 font-black text-sm text-rose-700">
                          {formatCurrency(item.balanceRemaining, db.school.currency)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setPaymentForm({
                                studentId: item.student.id,
                                feeTypeId: db.feeTypes[0]?.id || '',
                                amountPaid: item.balanceRemaining,
                                paymentMethod: 'ESPECES',
                                reference: '',
                                notes: 'Règlement solde débiteur',
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>Régler Solde</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEE TYPES */}
      {activeTab === 'FEE_TYPES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {db.feeTypes.map((fee) => (
            <div key={fee.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">
                  {fee.category}
                </span>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {fee.dueDate ? `Échéance : ${formatDate(fee.dueDate)}` : 'Annuel'}
                </span>
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900">{fee.name}</h3>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {fee.description || 'Frais de scolarité approuvé par l\'école.'}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Montant exigible :</span>
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(fee.amount, fee.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment Cashier Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Enregistrer un Encaissement</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Élève concerné *</label>
                <select
                  required
                  value={paymentForm.studentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {db.students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.lastName} {st.firstName} ({st.matricule})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type de Frais scolaire *</label>
                <select
                  required
                  value={paymentForm.feeTypeId}
                  onChange={(e) => {
                    const selected = db.feeTypes.find((f) => f.id === e.target.value);
                    setPaymentForm({
                      ...paymentForm,
                      feeTypeId: e.target.value,
                      amountPaid: selected ? selected.amount : paymentForm.amountPaid,
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  {db.feeTypes.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} - {formatCurrency(f.amount, f.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant à encaisser *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden text-base"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Accepte les acomptes partiels</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mode de Paiement *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden cursor-pointer"
                  >
                    <option value="ESPECES">Espèces (Cash)</option>
                    <option value="MOBILE_MONEY">Mobile Money (M-Pesa / Orange / Airtel)</option>
                    <option value="BANQUE">Virement Bancaire</option>
                    <option value="CHEQUE">Chèque Bancaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Référence Transaction / Bordereau</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Ex: MPESA-ID-449102 / BORD-RAW-102"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes / Mentions sur le reçu</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Ex: Acompte 1ère tranche"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="h-4 w-4" />
                  <span>Encaisser & Émettre le Reçu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fee Type Modal */}
      {isFeeTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Ajouter une Ligne de Frais Scolaires
            </h3>
            <form onSubmit={handleSaveFeeType} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Intitulé du Frais *</label>
                <input
                  type="text"
                  required
                  value={feeTypeForm.name || ''}
                  onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
                  placeholder="Ex: Frais de Cantine Scolaire"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={feeTypeForm.category || 'SCOLARITE'}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, category: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  >
                    <option value="SCOLARITE">Scolarité (Minerval)</option>
                    <option value="INSCRIPTION">Inscription</option>
                    <option value="REINSCRIPTION">Réinscription</option>
                    <option value="EXAMEN">Frais d'Examens</option>
                    <option value="TRANSPORT">Transport Scolaire</option>
                    <option value="CANTINE">Restauration / Cantine</option>
                    <option value="AUTRE">Autre frais</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Montant *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={feeTypeForm.amount || 100}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, amount: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date d'échéance recommandée</label>
                <input
                  type="date"
                  value={feeTypeForm.dueDate || ''}
                  onChange={(e) => setFeeTypeForm({ ...feeTypeForm, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFeeTypeModalOpen(false)}
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
    </div>
  );
};
