import { Enrollment, FeeType, Grade, Payment, SchoolClass, Student, Subject } from '../types';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(amount);
  }
  if (currency === 'EUR') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  }
  return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function getMention(percentage: number): { label: string; color: string; bg: string } {
  if (percentage >= 80) return { label: 'Très Bien (Élite)', color: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (percentage >= 70) return { label: 'Bien', color: 'text-blue-700', bg: 'bg-blue-50' };
  if (percentage >= 60) return { label: 'Assez Bien', color: 'text-cyan-700', bg: 'bg-cyan-50' };
  if (percentage >= 50) return { label: 'Passable (Satisfaisant)', color: 'text-amber-700', bg: 'bg-amber-50' };
  if (percentage >= 40) return { label: 'Médiocre (Insuffisant)', color: 'text-orange-700', bg: 'bg-orange-50' };
  return { label: 'Mauvais (Échec)', color: 'text-rose-700', bg: 'bg-rose-50' };
}

export interface StudentFinancialSummary {
  studentId: string;
  totalDue: number;
  totalPaid: number;
  balanceRemaining: number;
  status: 'SOLDE' | 'PARTIEL' | 'IMPAYE';
  paymentsCount: number;
}

export function calculateStudentFinances(
  studentId: string,
  academicYearId: string,
  feeTypes: FeeType[],
  payments: Payment[],
  enrollments: Enrollment[],
  classes: SchoolClass[]
): StudentFinancialSummary {
  // Find student's class for this academic year
  const enrollment = enrollments.find(
    (e) => e.studentId === studentId && e.academicYearId === academicYearId
  );
  const studentClass = enrollment ? classes.find((c) => c.id === enrollment.classId) : null;

  // Applicable fees: general or specific to this level/class
  const applicableFees = feeTypes.filter((f) => {
    if (!studentClass) return true;
    if (f.classId && f.classId !== studentClass.id) return false;
    if (f.levelId && f.levelId !== studentClass.levelId) return false;
    return true;
  });

  const totalDue = applicableFees.reduce((sum, f) => sum + f.amount, 0);

  const studentPayments = payments.filter(
    (p) => p.studentId === studentId && p.academicYearId === academicYearId
  );
  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amountPaid, 0);

  const balanceRemaining = Math.max(0, totalDue - totalPaid);

  let status: 'SOLDE' | 'PARTIEL' | 'IMPAYE' = 'IMPAYE';
  if (totalPaid >= totalDue && totalDue > 0) {
    status = 'SOLDE';
  } else if (totalPaid > 0) {
    status = 'PARTIEL';
  }

  return {
    studentId,
    totalDue,
    totalPaid,
    balanceRemaining,
    status,
    paymentsCount: studentPayments.length,
  };
}

export interface SubjectReportRow {
  subject: Subject;
  scoreP1?: number;
  maxP1: number;
  scoreP2?: number;
  maxP2: number;
  scoreEX1?: number;
  maxEX1: number;
  totalSem1: number;
  maxSem1: number;
  percentageSem1: number;
  coefficient: number;
  appreciation: string;
}

export interface StudentReportSummary {
  student: Student;
  studentClass?: SchoolClass;
  rows: SubjectReportRow[];
  totalScore: number;
  totalMaxScore: number;
  generalPercentage: number;
  rank: number;
  totalStudentsInClass: number;
  classAveragePercentage: number;
  mention: { label: string; color: string; bg: string };
  isSimulation: boolean;
}

export function computeClassReports(
  classId: string,
  academicYearId: string,
  students: Student[],
  enrollments: Enrollment[],
  classes: SchoolClass[],
  subjects: Subject[],
  grades: Grade[],
  isSimulation: boolean = false
): StudentReportSummary[] {
  const currentClass = classes.find((c) => c.id === classId);
  const classEnrollments = enrollments.filter(
    (e) => e.classId === classId && e.academicYearId === academicYearId && e.status === 'CONFIRME'
  );

  const classStudents = students.filter((s) =>
    classEnrollments.some((e) => e.studentId === s.id)
  );

  if (classStudents.length === 0) return [];

  // Compute stats for each student
  const studentReportsRaw = classStudents.map((student) => {
    const studentGrades = grades.filter(
      (g) =>
        g.studentId === student.id &&
        g.classId === classId &&
        g.academicYearId === academicYearId &&
        (isSimulation ? true : !g.isSimulation)
    );

    const rows: SubjectReportRow[] = subjects.map((subject) => {
      const gP1 = studentGrades.find((g) => g.subjectId === subject.id && g.period === 'P1');
      const gP2 = studentGrades.find((g) => g.subjectId === subject.id && g.period === 'P2');
      const gEX1 = studentGrades.find((g) => g.subjectId === subject.id && g.period === 'EX1');

      const maxP1 = subject.defaultMaxPoints;
      const maxP2 = subject.defaultMaxPoints;
      const maxEX1 = subject.defaultMaxPoints;

      let total = 0;
      let totalMax = 0;

      if (gP1) {
        total += gP1.score;
        totalMax += gP1.maxScore;
      }
      if (gP2) {
        total += gP2.score;
        totalMax += gP2.maxScore;
      }
      if (gEX1) {
        total += gEX1.score;
        totalMax += gEX1.maxScore;
      }

      if (totalMax === 0) totalMax = maxP1 + maxP2 + maxEX1;

      const pct = totalMax > 0 ? (total / totalMax) * 100 : 0;

      let app = 'En cours';
      if (totalMax > 0 && (gP1 || gP2 || gEX1)) {
        if (pct >= 80) app = 'Excellent travail';
        else if (pct >= 70) app = 'Très satisfaisant';
        else if (pct >= 60) app = 'Bon travail';
        else if (pct >= 50) app = 'Travail passable';
        else app = 'Efforts requis';
      }

      return {
        subject,
        scoreP1: gP1?.score,
        maxP1,
        scoreP2: gP2?.score,
        maxP2,
        scoreEX1: gEX1?.score,
        maxEX1,
        totalSem1: total,
        maxSem1: totalMax,
        percentageSem1: Math.round(pct * 10) / 10,
        coefficient: subject.defaultCoefficient,
        appreciation: app,
      };
    });

    const totalScore = rows.reduce((acc, r) => acc + r.totalSem1, 0);
    const totalMaxScore = rows.reduce((acc, r) => acc + r.maxSem1, 0);
    const generalPercentage =
      totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 1000) / 10 : 0;

    return {
      student,
      studentClass: currentClass,
      rows,
      totalScore,
      totalMaxScore,
      generalPercentage,
      mention: getMention(generalPercentage),
      isSimulation,
    };
  });

  // Sort descending by percentage to determine ranks
  studentReportsRaw.sort((a, b) => b.generalPercentage - a.generalPercentage);

  const totalClassPct = studentReportsRaw.reduce((sum, s) => sum + s.generalPercentage, 0);
  const classAvg =
    studentReportsRaw.length > 0
      ? Math.round((totalClassPct / studentReportsRaw.length) * 10) / 10
      : 0;

  return studentReportsRaw.map((report, index) => ({
    ...report,
    rank: index + 1,
    totalStudentsInClass: studentReportsRaw.length,
    classAveragePercentage: classAvg,
  }));
}
