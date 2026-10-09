import React from 'react';
import {
  Users,
  Wallet,
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  UserPlus,
  CreditCard,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  PieChart,
} from 'lucide-react';
import { AppDatabase } from '../services/storage';
import { NavView } from './Sidebar';
import { formatCurrency, formatDate, calculateStudentFinances } from '../utils/helpers';

interface DashboardProps {
  db: AppDatabase;
  onNavigate: (view: NavView) => void;
  onSelectStudent?: (studentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ db, onNavigate, onSelectStudent }) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];

  // Active Enrollments
  const activeEnrollments = db.enrollments.filter(
    (e) => e.academicYearId === currentYear.id && e.status === 'CONFIRME'
  );
  const enrolledStudentIds = new Set(activeEnrollments.map((e) => e.studentId));
  const activeStudents = db.students.filter((s) => enrolledStudentIds.has(s.id));

  const boysCount = activeStudents.filter((s) => s.gender === 'M').length;
  const girlsCount = activeStudents.filter((s) => s.gender === 'F').length;
  const boysPct = activeStudents.length > 0 ? Math.round((boysCount / activeStudents.length) * 100) : 0;
  const girlsPct = activeStudents.length > 0 ? 100 - boysPct : 0;

  // Financial statistics
  const currentPayments = db.payments.filter((p) => p.academicYearId === currentYear.id);
  const totalCollected = currentPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  // Compute student balances
  const studentFinances = activeStudents.map((s) =>
    calculateStudentFinances(s.id, currentYear.id, db.feeTypes, db.payments, db.enrollments, db.classes)
  );
  const totalExpected = studentFinances.reduce((sum, f) => sum + f.totalDue, 0);
  const totalDebts = studentFinances.reduce((sum, f) => sum + f.balanceRemaining, 0);
  const recoveryRate = totalExpected > 0 ? Math.min(100, Math.round((totalCollected / totalExpected) * 100)) : 0;

  const paidInFullCount = studentFinances.filter((f) => f.status === 'SOLDE').length;
  const partialCount = studentFinances.filter((f) => f.status === 'PARTIEL').length;
  const unpaidCount = studentFinances.filter((f) => f.status === 'IMPAYE').length;

  // Payment methods breakdown
  const cashTotal = currentPayments.filter((p) => p.paymentMethod === 'ESPECES').reduce((s, p) => s + p.amountPaid, 0);
  const mobileMoneyTotal = currentPayments.filter((p) => p.paymentMethod === 'MOBILE_MONEY').reduce((s, p) => s + p.amountPaid, 0);
  const bankTotal = currentPayments.filter((p) => p.paymentMethod === 'BANQUE' || p.paymentMethod === 'CHEQUE').reduce((s, p) => s + p.amountPaid, 0);

  // Class enrollment distribution
  const classStats = db.classes.map((cls) => {
    const count = activeEnrollments.filter((e) => e.classId === cls.id).length;
    const occupancy = cls.capacity > 0 ? Math.round((count / cls.capacity) * 100) : 0;
    return {
      class: cls,
      count,
      occupancy,
    };
  });

  return (
    <div className="space-y-6">
      {/* Top Welcome / Academic Year banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-700/80 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-200">
                Année Scolaire {currentYear.name}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Session Active
              </span>
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Tableau de Bord Administratif & Financier
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-blue-200 max-w-2xl">
              Supervision centrale de l'établissement : gestion pédagogique, trésorerie scolaire, inscriptions et délibérations périodiques.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('enrollments')}
              className="flex items-center gap-1.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              <span>Inscrire un élève</span>
            </button>
            <button
              onClick={() => onNavigate('finances')}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 px-3.5 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              <span>Encaisser Frais</span>
            </button>
            <button
              onClick={() => onNavigate('grades')}
              className="flex items-center gap-1.5 rounded-xl bg-blue-700/90 text-white hover:bg-blue-700 px-3.5 py-2 text-xs font-bold transition cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Bulletin Blanc</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Students */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Effectif Total</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeStudents.length}</span>
            <span className="text-xs font-semibold text-slate-500">élèves inscrits</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2.5">
            <span>👦 {boysCount} Garçons ({boysPct}%)</span>
            <span>👧 {girlsCount} Filles ({girlsPct}%)</span>
          </div>
        </div>

        {/* Financial Collection */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Recouvrement Frais</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">
              {formatCurrency(totalCollected, db.school.currency)}
            </span>
          </div>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Taux de recouvrement</span>
              <span className="font-bold text-slate-800">{recoveryRate}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${recoveryRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Debts / Impayés */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dettes & Impayés</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">
              {formatCurrency(totalDebts, db.school.currency)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2.5">
            <span className="text-amber-800 font-semibold">{unpaidCount + partialCount} élèves redevables</span>
            <button
              onClick={() => onNavigate('finances')}
              className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              Relancer &rarr;
            </button>
          </div>
        </div>

        {/* Classes & Teachers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Structure Pédagogique</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{db.classes.length}</span>
            <span className="text-xs font-semibold text-slate-500">classes ouvertes</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2.5">
            <span>{db.teachers.length} Enseignants actifs</span>
            <span>{db.subjects.length} Matières</span>
          </div>
        </div>
      </div>

      {/* Main Charts / Distributions Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Class Enrollment Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Effectifs par Classe & Taux d'Occupation</h3>
              <p className="text-xs text-slate-500">Capacités des salles et inscriptions validées</p>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Gérer les classes <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 space-y-3.5">
            {classStats.map((item) => (
              <div key={item.class.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.class.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">
                      {item.count} / {item.class.capacity} places
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-sm">
                      {item.occupancy}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.occupancy > 90
                        ? 'bg-rose-500'
                        : item.occupancy > 70
                        ? 'bg-blue-600'
                        : 'bg-indigo-400'
                    }`}
                    style={{ width: `${Math.min(100, item.occupancy)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Distribution & Modes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Statut des Frais & Caisse</h3>
              <p className="text-xs text-slate-500">Répartition des encaissements par canal</p>
            </div>

            {/* Status breakdown */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-800">{paidInFullCount}</span>
                <p className="text-[10px] text-emerald-700 font-medium">Soldés</p>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100">
                <span className="text-xs font-bold text-blue-800">{partialCount}</span>
                <p className="text-[10px] text-blue-700 font-medium">Partiels (Acompte)</p>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <span className="text-xs font-bold text-rose-800">{unpaidCount}</span>
                <p className="text-[10px] text-rose-700 font-medium">Impayés</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">💵 Espèces (Cash) :</span>
                <span className="font-bold text-slate-900">{formatCurrency(cashTotal, db.school.currency)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">📱 Mobile Money (M-Pesa / Airtel) :</span>
                <span className="font-bold text-slate-900">{formatCurrency(mobileMoneyTotal, db.school.currency)}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                <span className="text-slate-600 font-medium">🏦 Virement Bancaire & Chèques :</span>
                <span className="font-bold text-slate-900">{formatCurrency(bankTotal, db.school.currency)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigate('finances')}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Wallet className="h-3.5 w-3.5" />
              <span>Consulter le journal de caisse</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Payments & Audit Logs */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Derniers Encaissements & Reçus</h3>
              <p className="text-xs text-slate-500">Paiements récents enregistrés à la caisse</p>
            </div>
            <button
              onClick={() => onNavigate('finances')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Tous les reçus &rarr;
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 overflow-hidden">
            {currentPayments.slice(-4).reverse().map((pay) => {
              const student = db.students.find((s) => s.id === pay.studentId);
              const fee = db.feeTypes.find((f) => f.id === pay.feeTypeId);
              return (
                <div key={pay.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {student ? `${student.lastName} ${student.firstName}` : 'Élève'}
                      </span>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 rounded-sm">
                        {pay.receiptNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {fee ? fee.name : 'Frais scolaire'} • {formatDate(pay.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-xs text-emerald-700">
                      +{formatCurrency(pay.amountPaid, pay.currency)}
                    </span>
                    <span className="block text-[10px] text-slate-400 capitalize">
                      {pay.paymentMethod.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Trail / Recent System Operations */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Journal de Traçabilité & Audit</h3>
              <p className="text-xs text-slate-500">Opérations et modifications d'utilisateurs</p>
            </div>
            <button
              onClick={() => onNavigate('users')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              Consulter l'audit &rarr;
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {db.auditLogs.slice(-4).reverse().map((log) => (
              <div key={log.id} className="py-2.5 flex items-start gap-2.5">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {log.details}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Par {log.userName} ({log.role}) • {formatDate(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
