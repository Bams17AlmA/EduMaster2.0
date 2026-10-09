export type Role = 'ADMIN' | 'COMPTABLE' | 'SECRETAIRE' | 'PREFET_ETUDES' | 'ENSEIGNANT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: {
    canManageStudents: boolean;
    canManageFinances: boolean;
    canEnterGrades: boolean;
    canValidateBulletins: boolean;
    canManageConfig: boolean;
    canBackupRestore: boolean;
  };
}

export interface School {
  id: string;
  name: string;
  code: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  poBox: string;
  city: string;
  country: string;
  currency: string;
  ministerialOrder: string; // Ex: Arrêté N° MINEPST/CABMIN/0842/2018
  headmasterName: string;
  headmasterTitle: string; // Ex: Le Préfet des Études
  logoUrl?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // Ex: 2024-2025, 2025-2026
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
}

export type Cycle = 'MATERNELLE' | 'PRIMAIRE' | 'SECONDAIRE';

export interface Level {
  id: string;
  name: string; // Ex: Petite Section, 1ère Primaire, 7ème EB, 1ère Humanités, Terminale
  cycle: Cycle;
  order: number;
}

export interface Section {
  id: string;
  name: string; // Ex: Éducation de Base, Scientifique, Commerciale & Gestion, Littéraire, Pédagogie
  code: string; // Ex: EB, SC, CG, LIT, PED
  cycle: Cycle;
  description?: string;
}

export interface SchoolClass {
  id: string;
  name: string; // Ex: 7ème EB A, 1ère Scientifique B
  levelId: string;
  sectionId?: string;
  academicYearId: string;
  room: string;
  capacity: number;
  mainTeacherId?: string;
}

export interface Teacher {
  id: string;
  matricule: string;
  fullName: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  qualification: string; // Ex: Licencié en Math-Physique, Gradué en Pédagogie
  status: 'ACTIF' | 'CONGE' | 'INACTIF';
  specialties: string[];
  hireDate: string;
}

export interface Subject {
  id: string;
  code: string; // MATH, FRAN, ANGL, PHYS, CHIM, HIST, GEO, INFO, EPS
  name: string;
  category: 'SCIENCES' | 'LETTRES' | 'SCIENCES_HUMAINES' | 'TECHNIQUE' | 'AUTRE';
  defaultMaxPoints: number; // Ex: 20, 40, 50
  defaultCoefficient: number;
}

export interface Assignment {
  id: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  weeklyHours: number;
}

export interface Student {
  id: string;
  matricule: string; // EDG-2025-0012
  lastName: string; // Nom
  middleName?: string; // Postnom
  firstName: string; // Prénom
  gender: 'M' | 'F';
  birthDate: string;
  birthPlace: string;
  nationality: string;
  address: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  parentProfession?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  status: 'ACTIF' | 'TRANSFERE' | 'ABANDONNE';
  photoUrl?: string;
  registrationDate: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  type: 'INSCRIPTION' | 'REINSCRIPTION';
  date: string;
  status: 'CONFIRME' | 'EN_ATTENTE' | 'ANNULE';
  notes?: string;
  previousClass?: string;
}

export type FeeCategory = 'SCOLARITE' | 'INSCRIPTION' | 'REINSCRIPTION' | 'EXAMEN' | 'TRANSPORT' | 'CANTINE' | 'AUTRE';

export interface FeeType {
  id: string;
  name: string; // Ex: Minerval Trimestre 1, Frais d'inscription, Frais Informatiques
  category: FeeCategory;
  amount: number;
  currency: string;
  levelId?: string; // Applicable à un niveau spécifique ou tous si vide
  classId?: string;
  dueDate?: string;
  description?: string;
}

export type PaymentMethod = 'ESPECES' | 'MOBILE_MONEY' | 'BANQUE' | 'CHEQUE';

export interface Payment {
  id: string;
  receiptNumber: string; // Ex: REC-2025-00142
  studentId: string;
  enrollmentId?: string;
  feeTypeId: string;
  academicYearId: string;
  amountPaid: number;
  currency: string;
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string; // N° Bordereau, Transaction ID Mobile Money
  cashierName: string;
  notes?: string;
}

export type GradePeriod = 'P1' | 'P2' | 'EX1' | 'P3' | 'P4' | 'EX2' | 'T1' | 'T2' | 'T3';

export interface Grade {
  id: string;
  academicYearId: string;
  classId: string;
  studentId: string;
  subjectId: string;
  period: GradePeriod;
  score: number;
  maxScore: number;
  isSimulation?: boolean; // Pour le bulletin blanc
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  details: string;
  entityType: 'ELEVE' | 'PAIEMENT' | 'NOTE' | 'CLASSE' | 'INSCRIPTION' | 'ENSEIGNANT' | 'SYSTEME';
  entityId?: string;
}
