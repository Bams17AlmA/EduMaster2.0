import {
  AcademicYear,
  Assignment,
  AuditLog,
  Enrollment,
  FeeType,
  Grade,
  Level,
  Payment,
  Role,
  School,
  SchoolClass,
  Section,
  Student,
  Subject,
  Teacher,
  User,
} from '../types';

export interface AppDatabase {
  school: School;
  academicYears: AcademicYear[];
  levels: Level[];
  sections: Section[];
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  assignments: Assignment[];
  students: Student[];
  enrollments: Enrollment[];
  feeTypes: FeeType[];
  payments: Payment[];
  grades: Grade[];
  users: User[];
  currentUser: User;
  auditLogs: AuditLog[];
}

const STORAGE_KEY = 'EDUGEST_DATABASE_V1';

export const initialSchool: School = {
  id: 'sch-1',
  name: 'Complexe Scolaire Moderne Le Flambeau',
  code: 'CSM-FLAMBEAU',
  slogan: 'Discipline - Travail - Excellence',
  address: '142, Avenue de la Libération, Commune de Gombe',
  phone: '+243 81 234 5678 / +243 99 876 5432',
  email: 'direction@cs-leflambeau.edu',
  poBox: 'B.P. 4812 Kinshasa 1',
  city: 'Kinshasa',
  country: 'RDC',
  currency: 'USD',
  ministerialOrder: 'Arrêté Ministériel N° MINEPST/CABMIN/0842/2018',
  headmasterName: 'Prof. Jean-Marc Kalombo',
  headmasterTitle: 'Le Préfet des Études',
};

export const initialAcademicYears: AcademicYear[] = [
  {
    id: 'ay-2024',
    name: '2024-2025',
    startDate: '2024-09-02',
    endDate: '2025-07-02',
    isCurrent: false,
    status: 'ARCHIVED',
  },
  {
    id: 'ay-2025',
    name: '2025-2026',
    startDate: '2025-09-01',
    endDate: '2026-07-04',
    isCurrent: true,
    status: 'ACTIVE',
  },
];

export const initialLevels: Level[] = [
  { id: 'lvl-mat', name: 'Maternelle (Grande Section)', cycle: 'MATERNELLE', order: 1 },
  { id: 'lvl-p1', name: '1ère Éducation de Base (EB)', cycle: 'PRIMAIRE', order: 2 },
  { id: 'lvl-7eb', name: '7ème Éducation de Base (7e EB)', cycle: 'SECONDAIRE', order: 3 },
  { id: 'lvl-8eb', name: '8ème Éducation de Base (8e EB)', cycle: 'SECONDAIRE', order: 4 },
  { id: 'lvl-1sc', name: '1ère Humanités Scientifiques', cycle: 'SECONDAIRE', order: 5 },
  { id: 'lvl-2sc', name: '2ème Humanités Scientifiques', cycle: 'SECONDAIRE', order: 6 },
  { id: 'lvl-1cg', name: '1ère Commerciale & Gestion', cycle: 'SECONDAIRE', order: 7 },
  { id: 'lvl-3lit', name: '3ème Humanités Littéraires', cycle: 'SECONDAIRE', order: 8 },
];

export const initialSections: Section[] = [
  { id: 'sec-eb', name: 'Éducation de Base', code: 'EB', cycle: 'SECONDAIRE', description: 'Tronc commun 7e et 8e' },
  { id: 'sec-sc', name: 'Sciences (Math-Physique & Bio-Chimie)', code: 'SC', cycle: 'SECONDAIRE', description: 'Filière scientifique' },
  { id: 'sec-cg', name: 'Commerciale & Gestion', code: 'CG', cycle: 'SECONDAIRE', description: 'Filière gestion & comptabilité' },
  { id: 'sec-lit', name: 'Littéraire (Latin-Philo)', code: 'LIT', cycle: 'SECONDAIRE', description: 'Langues et humanités' },
  { id: 'sec-ped', name: 'Pédagogie Générale', code: 'PED', cycle: 'SECONDAIRE', description: 'Formation des maîtres' },
];

export const initialTeachers: Teacher[] = [
  {
    id: 'tch-1',
    matricule: 'ENS-001',
    fullName: 'M. Dieudonné Ilunga Mutombo',
    gender: 'M',
    phone: '+243 82 111 2233',
    email: 'd.ilunga@cs-leflambeau.edu',
    qualification: 'Licencié en Mathématiques & Informatique (UNIKIN)',
    status: 'ACTIF',
    specialties: ['Mathématiques', 'Informatique'],
    hireDate: '2020-09-01',
  },
  {
    id: 'tch-2',
    matricule: 'ENS-002',
    fullName: 'Mme Marie-Claire Mwamba',
    gender: 'F',
    phone: '+243 89 222 3344',
    email: 'mc.mwamba@cs-leflambeau.edu',
    qualification: 'Licenciée en Lettres Françaises (UPN)',
    status: 'ACTIF',
    specialties: ['Français', 'Littérature'],
    hireDate: '2019-10-15',
  },
  {
    id: 'tch-3',
    matricule: 'ENS-003',
    fullName: 'M. Fabrice Mbokolo Lema',
    gender: 'M',
    phone: '+243 81 333 4455',
    email: 'f.mbokolo@cs-leflambeau.edu',
    qualification: 'Licencié en Sciences Physiques (ISP Gombe)',
    status: 'ACTIF',
    specialties: ['Physique', 'Chimie'],
    hireDate: '2021-02-01',
  },
  {
    id: 'tch-4',
    matricule: 'ENS-004',
    fullName: 'Mme Chantal Kapinga Bilonda',
    gender: 'F',
    phone: '+243 97 444 5566',
    email: 'c.kapinga@cs-leflambeau.edu',
    qualification: 'Licenciée en Sciences Commerciales & Financières',
    status: 'ACTIF',
    specialties: ['Comptabilité', 'Économie'],
    hireDate: '2022-09-05',
  },
  {
    id: 'tch-5',
    matricule: 'ENS-005',
    fullName: 'M. Alain Nsimba Vangu',
    gender: 'M',
    phone: '+243 85 555 6677',
    email: 'a.nsimba@cs-leflambeau.edu',
    qualification: 'Gradué en Histoire & Géographie',
    status: 'ACTIF',
    specialties: ['Histoire', 'Géographie', 'Civisme'],
    hireDate: '2023-01-10',
  },
];

export const initialClasses: SchoolClass[] = [
  {
    id: 'cls-7eb-a',
    name: '7ème Éducation de Base A',
    levelId: 'lvl-7eb',
    sectionId: 'sec-eb',
    academicYearId: 'ay-2025',
    room: 'Pavillon A - Salle 101',
    capacity: 45,
    mainTeacherId: 'tch-1',
  },
  {
    id: 'cls-8eb-b',
    name: '8ème Éducation de Base B',
    levelId: 'lvl-8eb',
    sectionId: 'sec-eb',
    academicYearId: 'ay-2025',
    room: 'Pavillon A - Salle 102',
    capacity: 42,
    mainTeacherId: 'tch-2',
  },
  {
    id: 'cls-1sc-a',
    name: '1ère Humanités Scientifiques A',
    levelId: 'lvl-1sc',
    sectionId: 'sec-sc',
    academicYearId: 'ay-2025',
    room: 'Bâtiment Principal - Salle 201',
    capacity: 35,
    mainTeacherId: 'tch-3',
  },
  {
    id: 'cls-1cg-a',
    name: '1ère Commerciale & Gestion',
    levelId: 'lvl-1cg',
    sectionId: 'sec-cg',
    academicYearId: 'ay-2025',
    room: 'Bâtiment Principal - Salle 202',
    capacity: 36,
    mainTeacherId: 'tch-4',
  },
];

export const initialSubjects: Subject[] = [
  { id: 'sub-math', code: 'MATH', name: 'Mathématiques Générales', category: 'SCIENCES', defaultMaxPoints: 40, defaultCoefficient: 4 },
  { id: 'sub-fran', code: 'FRAN', name: 'Français (Langue & Littérature)', category: 'LETTRES', defaultMaxPoints: 40, defaultCoefficient: 4 },
  { id: 'sub-phys', code: 'PHYS', name: 'Physique Fondamentale', category: 'SCIENCES', defaultMaxPoints: 30, defaultCoefficient: 3 },
  { id: 'sub-chim', code: 'CHIM', name: 'Chimie Générale & Organique', category: 'SCIENCES', defaultMaxPoints: 30, defaultCoefficient: 3 },
  { id: 'sub-angl', code: 'ANGL', name: 'Anglais Moderne', category: 'LETTRES', defaultMaxPoints: 20, defaultCoefficient: 2 },
  { id: 'sub-hist', code: 'HIST', name: 'Histoire & Éducation Civique', category: 'SCIENCES_HUMAINES', defaultMaxPoints: 20, defaultCoefficient: 2 },
  { id: 'sub-geo', code: 'GEO', name: 'Géographie Physique & Économique', category: 'SCIENCES_HUMAINES', defaultMaxPoints: 20, defaultCoefficient: 2 },
  { id: 'sub-info', code: 'INFO', name: 'Informatique & Bureautique', category: 'TECHNIQUE', defaultMaxPoints: 20, defaultCoefficient: 2 },
  { id: 'sub-cpt', code: 'CPT', name: 'Comptabilité Générale', category: 'TECHNIQUE', defaultMaxPoints: 40, defaultCoefficient: 4 },
];

export const initialAssignments: Assignment[] = [
  { id: 'asg-1', academicYearId: 'ay-2025', teacherId: 'tch-1', classId: 'cls-1sc-a', subjectId: 'sub-math', weeklyHours: 6 },
  { id: 'asg-2', academicYearId: 'ay-2025', teacherId: 'tch-2', classId: 'cls-1sc-a', subjectId: 'sub-fran', weeklyHours: 5 },
  { id: 'asg-3', academicYearId: 'ay-2025', teacherId: 'tch-3', classId: 'cls-1sc-a', subjectId: 'sub-phys', weeklyHours: 4 },
  { id: 'asg-4', academicYearId: 'ay-2025', teacherId: 'tch-3', classId: 'cls-1sc-a', subjectId: 'sub-chim', weeklyHours: 4 },
  { id: 'asg-5', academicYearId: 'ay-2025', teacherId: 'tch-1', classId: 'cls-1sc-a', subjectId: 'sub-info', weeklyHours: 2 },
  { id: 'asg-6', academicYearId: 'ay-2025', teacherId: 'tch-1', classId: 'cls-7eb-a', subjectId: 'sub-math', weeklyHours: 6 },
  { id: 'asg-7', academicYearId: 'ay-2025', teacherId: 'tch-2', classId: 'cls-7eb-a', subjectId: 'sub-fran', weeklyHours: 6 },
  { id: 'asg-8', academicYearId: 'ay-2025', teacherId: 'tch-5', classId: 'cls-7eb-a', subjectId: 'sub-hist', weeklyHours: 3 },
  { id: 'asg-9', academicYearId: 'ay-2025', teacherId: 'tch-4', classId: 'cls-1cg-a', subjectId: 'sub-cpt', weeklyHours: 6 },
];

export const initialStudents: Student[] = [
  {
    id: 'std-1',
    matricule: 'EDG-2025-001',
    lastName: 'KASONGO',
    middleName: 'TSHILOMBO',
    firstName: 'Daniel',
    gender: 'M',
    birthDate: '2008-04-12',
    birthPlace: 'Kinshasa',
    nationality: 'Congolaise',
    address: 'Q/ Macampagne, C/ Ngaliema, N° 45',
    parentName: 'M. Gilbert Kasongo',
    parentPhone: '+243 81 999 1100',
    parentEmail: 'kasongo.g@gmail.com',
    parentProfession: 'Ingénieur en Télécoms',
    bloodGroup: 'O+',
    status: 'ACTIF',
    registrationDate: '2025-08-20',
  },
  {
    id: 'std-2',
    matricule: 'EDG-2025-002',
    lastName: 'BAHATI',
    middleName: 'KAVIRA',
    firstName: 'Esther',
    gender: 'F',
    birthDate: '2008-11-23',
    birthPlace: 'Goma',
    nationality: 'Congolaise',
    address: 'Avenue de la Paix, C/ Kintambo, N° 12',
    parentName: 'Mme Jeanne Bahati',
    parentPhone: '+243 82 888 2211',
    parentEmail: 'j.bahati@yahoo.fr',
    parentProfession: 'Médecin Pédiatre',
    bloodGroup: 'A+',
    status: 'ACTIF',
    registrationDate: '2025-08-22',
  },
  {
    id: 'std-3',
    matricule: 'EDG-2025-003',
    lastName: 'MBUYI',
    middleName: 'KALALA',
    firstName: 'Jonathan',
    gender: 'M',
    birthDate: '2009-02-17',
    birthPlace: 'Mbuji-Mayi',
    nationality: 'Congolaise',
    address: 'Av. Sendwe, C/ Kalamu, N° 78',
    parentName: 'M. François Mbuyi',
    parentPhone: '+243 89 777 3322',
    parentProfession: 'Commerçant Grossiste',
    bloodGroup: 'B+',
    status: 'ACTIF',
    registrationDate: '2025-08-25',
  },
  {
    id: 'std-4',
    matricule: 'EDG-2025-004',
    lastName: 'LUMUMBA',
    middleName: 'TOLENGA',
    firstName: 'Grace',
    gender: 'F',
    birthDate: '2008-07-09',
    birthPlace: 'Kisangani',
    nationality: 'Congolaise',
    address: 'Boulevard du 30 Juin, C/ Gombe, N° 102',
    parentName: 'M. Roland Lumumba',
    parentPhone: '+243 81 666 4433',
    parentEmail: 'r.lumumba@societe.cd',
    parentProfession: 'Directeur Financier',
    bloodGroup: 'AB+',
    status: 'ACTIF',
    registrationDate: '2025-08-28',
  },
  {
    id: 'std-5',
    matricule: 'EDG-2025-005',
    lastName: 'KABEYA',
    middleName: 'KASONGA',
    firstName: 'Samuel',
    gender: 'M',
    birthDate: '2011-05-14',
    birthPlace: 'Lubumbashi',
    nationality: 'Congolaise',
    address: 'Avenue Haut-Commandement, C/ Gombe, N° 19',
    parentName: 'Mme Christine Kabeya',
    parentPhone: '+243 84 555 6677',
    parentProfession: 'Avocate au Barreau',
    bloodGroup: 'O-',
    status: 'ACTIF',
    registrationDate: '2025-08-30',
  },
  {
    id: 'std-6',
    matricule: 'EDG-2025-006',
    lastName: 'NZUZI',
    middleName: 'MAKIESE',
    firstName: 'Priscille',
    gender: 'F',
    birthDate: '2011-09-03',
    birthPlace: 'Matadi',
    nationality: 'Congolaise',
    address: 'Avenue Victoire, C/ Kasa-Vubu, N° 84',
    parentName: 'M. David Nzuzi',
    parentPhone: '+243 99 444 7788',
    parentProfession: 'Cadre Bancaire',
    bloodGroup: 'O+',
    status: 'ACTIF',
    registrationDate: '2025-09-01',
  },
  {
    id: 'std-7',
    matricule: 'EDG-2025-007',
    lastName: 'ILUNGA',
    middleName: 'KAZADI',
    firstName: 'Ephraim',
    gender: 'M',
    birthDate: '2008-01-19',
    birthPlace: 'Kolwezi',
    nationality: 'Congolaise',
    address: 'Av. Triomphal, C/ Lingwala, N° 33',
    parentName: 'M. Marcel Ilunga',
    parentPhone: '+243 82 333 9900',
    parentProfession: 'Pharmacien',
    bloodGroup: 'A+',
    status: 'ACTIF',
    registrationDate: '2025-09-02',
  },
  {
    id: 'std-8',
    matricule: 'EDG-2025-008',
    lastName: 'PEMBE',
    middleName: 'BOKETSHU',
    firstName: 'Naomie',
    gender: 'F',
    birthDate: '2008-08-15',
    birthPlace: 'Mbandaka',
    nationality: 'Congolaise',
    address: 'Quartier GB, C/ Ngaliema, N° 6',
    parentName: 'M. Didier Pembe',
    parentPhone: '+243 85 222 1144',
    parentProfession: 'Chef d\'Entreprise',
    bloodGroup: 'B+',
    status: 'ACTIF',
    registrationDate: '2025-09-03',
  },
];

export const initialEnrollments: Enrollment[] = [
  { id: 'enr-1', studentId: 'std-1', classId: 'cls-1sc-a', academicYearId: 'ay-2025', type: 'REINSCRIPTION', date: '2025-08-20', status: 'CONFIRME', previousClass: '8ème EB B' },
  { id: 'enr-2', studentId: 'std-2', classId: 'cls-1sc-a', academicYearId: 'ay-2025', type: 'INSCRIPTION', date: '2025-08-22', status: 'CONFIRME', notes: 'Dossier complet transféré de Goma' },
  { id: 'enr-3', studentId: 'std-3', classId: 'cls-1sc-a', academicYearId: 'ay-2025', type: 'REINSCRIPTION', date: '2025-08-25', status: 'CONFIRME', previousClass: '8ème EB B' },
  { id: 'enr-4', studentId: 'std-4', classId: 'cls-1sc-a', academicYearId: 'ay-2025', type: 'INSCRIPTION', date: '2025-08-28', status: 'CONFIRME' },
  { id: 'enr-5', studentId: 'std-5', classId: 'cls-7eb-a', academicYearId: 'ay-2025', type: 'INSCRIPTION', date: '2025-08-30', status: 'CONFIRME' },
  { id: 'enr-6', studentId: 'std-6', classId: 'cls-7eb-a', academicYearId: 'ay-2025', type: 'INSCRIPTION', date: '2025-09-01', status: 'CONFIRME' },
  { id: 'enr-7', studentId: 'std-7', classId: 'cls-1sc-a', academicYearId: 'ay-2025', type: 'REINSCRIPTION', date: '2025-09-02', status: 'CONFIRME' },
  { id: 'enr-8', studentId: 'std-8', classId: 'cls-1cg-a', academicYearId: 'ay-2025', type: 'INSCRIPTION', date: '2025-09-03', status: 'CONFIRME' },
];

export const initialFeeTypes: FeeType[] = [
  { id: 'fee-insc', name: 'Frais d\'Inscription Administrative', category: 'INSCRIPTION', amount: 50, currency: 'USD', description: 'Ouverture de dossier & carnet scolaire' },
  { id: 'fee-reins', name: 'Frais de Réinscription Annuelle', category: 'REINSCRIPTION', amount: 35, currency: 'USD', description: 'Actualisation de dossier' },
  { id: 'fee-min-t1', name: 'Minerval - 1er Trimestre (Scolarité)', category: 'SCOLARITE', amount: 180, currency: 'USD', dueDate: '2025-10-15', description: 'Septembre à Décembre' },
  { id: 'fee-min-t2', name: 'Minerval - 2ème Trimestre (Scolarité)', category: 'SCOLARITE', amount: 180, currency: 'USD', dueDate: '2026-01-20', description: 'Janvier à Mars' },
  { id: 'fee-min-t3', name: 'Minerval - 3ème Trimestre (Scolarité)', category: 'SCOLARITE', amount: 180, currency: 'USD', dueDate: '2026-04-15', description: 'Avril à Juillet' },
  { id: 'fee-labo', name: 'Frais Informatique & Laboratoire', category: 'AUTRE', amount: 30, currency: 'USD', description: 'Accès salle machine et réactifs de labo' },
  { id: 'fee-exam-s1', name: 'Frais d\'Examens du 1er Semestre', category: 'EXAMEN', amount: 25, currency: 'USD', dueDate: '2026-01-10', description: 'Fiches et carnets d\'examen' },
];

export const initialPayments: Payment[] = [
  {
    id: 'pay-1',
    receiptNumber: 'REC-2025-00101',
    studentId: 'std-1',
    enrollmentId: 'enr-1',
    feeTypeId: 'fee-reins',
    academicYearId: 'ay-2025',
    amountPaid: 35,
    currency: 'USD',
    date: '2025-08-20',
    paymentMethod: 'ESPECES',
    reference: 'CASH-0820-01',
    cashierName: 'Mme Thérèse Mukendi',
    notes: 'Paiement intégral réinscription',
  },
  {
    id: 'pay-2',
    receiptNumber: 'REC-2025-00102',
    studentId: 'std-1',
    enrollmentId: 'enr-1',
    feeTypeId: 'fee-min-t1',
    academicYearId: 'ay-2025',
    amountPaid: 180,
    currency: 'USD',
    date: '2025-09-05',
    paymentMethod: 'MOBILE_MONEY',
    reference: 'MPESA-CD-998812',
    cashierName: 'Mme Thérèse Mukendi',
    notes: 'Minerval T1 payé en totalité',
  },
  {
    id: 'pay-3',
    receiptNumber: 'REC-2025-00103',
    studentId: 'std-2',
    enrollmentId: 'enr-2',
    feeTypeId: 'fee-insc',
    academicYearId: 'ay-2025',
    amountPaid: 50,
    currency: 'USD',
    date: '2025-08-22',
    paymentMethod: 'ESPECES',
    reference: 'CASH-0822-04',
    cashierName: 'Mme Thérèse Mukendi',
  },
  {
    id: 'pay-4',
    receiptNumber: 'REC-2025-00104',
    studentId: 'std-2',
    enrollmentId: 'enr-2',
    feeTypeId: 'fee-min-t1',
    academicYearId: 'ay-2025',
    amountPaid: 100, // Paiement PARTIEL : 100/180
    currency: 'USD',
    date: '2025-09-10',
    paymentMethod: 'BANQUE',
    reference: 'RAW-BORD-449102',
    cashierName: 'Mme Thérèse Mukendi',
    notes: '1ère tranche Minerval T1 (Solde restant: 80 USD)',
  },
  {
    id: 'pay-5',
    receiptNumber: 'REC-2025-00105',
    studentId: 'std-3',
    enrollmentId: 'enr-3',
    feeTypeId: 'fee-reins',
    academicYearId: 'ay-2025',
    amountPaid: 35,
    currency: 'USD',
    date: '2025-08-25',
    paymentMethod: 'ESPECES',
    cashierName: 'Mme Thérèse Mukendi',
  },
  {
    id: 'pay-6',
    receiptNumber: 'REC-2025-00106',
    studentId: 'std-4',
    enrollmentId: 'enr-4',
    feeTypeId: 'fee-insc',
    academicYearId: 'ay-2025',
    amountPaid: 50,
    currency: 'USD',
    date: '2025-08-28',
    paymentMethod: 'MOBILE_MONEY',
    reference: 'AIRTEL-MONEY-77112',
    cashierName: 'Mme Thérèse Mukendi',
  },
  {
    id: 'pay-7',
    receiptNumber: 'REC-2025-00107',
    studentId: 'std-4',
    enrollmentId: 'enr-4',
    feeTypeId: 'fee-min-t1',
    academicYearId: 'ay-2025',
    amountPaid: 180,
    currency: 'USD',
    date: '2025-09-12',
    paymentMethod: 'BANQUE',
    reference: 'ECOBANK-CHQ-10492',
    cashierName: 'Mme Thérèse Mukendi',
  },
];

export const initialGrades: Grade[] = [
  // Notes pour std-1 (Daniel Kasongo) - 1ère Scientifique A
  { id: 'grd-1', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-math', period: 'P1', score: 36, maxScore: 40, updatedAt: '2025-10-30' },
  { id: 'grd-2', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-fran', period: 'P1', score: 32, maxScore: 40, updatedAt: '2025-10-30' },
  { id: 'grd-3', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-phys', period: 'P1', score: 27, maxScore: 30, updatedAt: '2025-10-30' },
  { id: 'grd-4', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-chim', period: 'P1', score: 26, maxScore: 30, updatedAt: '2025-10-30' },
  { id: 'grd-5', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-info', period: 'P1', score: 19, maxScore: 20, updatedAt: '2025-10-30' },
  
  { id: 'grd-6', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-math', period: 'P2', score: 38, maxScore: 40, updatedAt: '2025-12-15' },
  { id: 'grd-7', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-fran', period: 'P2', score: 34, maxScore: 40, updatedAt: '2025-12-15' },
  { id: 'grd-8', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-phys', period: 'P2', score: 28, maxScore: 30, updatedAt: '2025-12-15' },
  { id: 'grd-9', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-chim', period: 'P2', score: 27, maxScore: 30, updatedAt: '2025-12-15' },
  { id: 'grd-10', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-info', period: 'P2', score: 20, maxScore: 20, updatedAt: '2025-12-15' },

  // Examen Semestre 1 pour std-1
  { id: 'grd-11', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-math', period: 'EX1', score: 37, maxScore: 40, updatedAt: '2026-01-20' },
  { id: 'grd-12', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-fran', period: 'EX1', score: 33, maxScore: 40, updatedAt: '2026-01-20' },
  { id: 'grd-13', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-1', subjectId: 'sub-phys', period: 'EX1', score: 28, maxScore: 30, updatedAt: '2026-01-20' },

  // Notes pour std-2 (Esther Bahati)
  { id: 'grd-20', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-2', subjectId: 'sub-math', period: 'P1', score: 39, maxScore: 40, updatedAt: '2025-10-30' },
  { id: 'grd-21', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-2', subjectId: 'sub-fran', period: 'P1', score: 38, maxScore: 40, updatedAt: '2025-10-30' },
  { id: 'grd-22', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-2', subjectId: 'sub-phys', period: 'P1', score: 29, maxScore: 30, updatedAt: '2025-10-30' },
  { id: 'grd-23', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-2', subjectId: 'sub-chim', period: 'P1', score: 29, maxScore: 30, updatedAt: '2025-10-30' },
  { id: 'grd-24', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-2', subjectId: 'sub-info', period: 'P1', score: 20, maxScore: 20, updatedAt: '2025-10-30' },

  // Notes de Simulation / Bulletin Blanc pour std-3 (Jonathan Mbuyi)
  { id: 'grd-30', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-3', subjectId: 'sub-math', period: 'P1', score: 21, maxScore: 40, updatedAt: '2025-10-30' },
  { id: 'grd-31', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-3', subjectId: 'sub-fran', period: 'P1', score: 24, maxScore: 40, updatedAt: '2025-10-30' },
  { id: 'grd-32', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-3', subjectId: 'sub-phys', period: 'P1', score: 14, maxScore: 30, updatedAt: '2025-10-30' },
  { id: 'grd-33', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-3', subjectId: 'sub-chim', period: 'P1', score: 15, maxScore: 30, updatedAt: '2025-10-30' },
  { id: 'grd-34', academicYearId: 'ay-2025', classId: 'cls-1sc-a', studentId: 'std-3', subjectId: 'sub-info', period: 'P1', score: 11, maxScore: 20, updatedAt: '2025-10-30' },
];

export const initialUsers: User[] = [
  {
    id: 'usr-admin',
    name: 'Prof. Jean-Marc Kalombo',
    email: 'direction@cs-leflambeau.edu',
    role: 'ADMIN',
    permissions: {
      canManageStudents: true,
      canManageFinances: true,
      canEnterGrades: true,
      canValidateBulletins: true,
      canManageConfig: true,
      canBackupRestore: true,
    },
  },
  {
    id: 'usr-comptable',
    name: 'Mme Thérèse Mukendi',
    email: 'finance@cs-leflambeau.edu',
    role: 'COMPTABLE',
    permissions: {
      canManageStudents: true,
      canManageFinances: true,
      canEnterGrades: false,
      canValidateBulletins: false,
      canManageConfig: false,
      canBackupRestore: false,
    },
  },
  {
    id: 'usr-secretaire',
    name: 'M. Paulin Bamba',
    email: 'secretariat@cs-leflambeau.edu',
    role: 'SECRETAIRE',
    permissions: {
      canManageStudents: true,
      canManageFinances: false,
      canEnterGrades: false,
      canValidateBulletins: false,
      canManageConfig: false,
      canBackupRestore: false,
    },
  },
  {
    id: 'usr-prefet',
    name: 'Prof. Dieudonné Ilunga',
    email: 'pedagogie@cs-leflambeau.edu',
    role: 'PREFET_ETUDES',
    permissions: {
      canManageStudents: true,
      canManageFinances: false,
      canEnterGrades: true,
      canValidateBulletins: true,
      canManageConfig: false,
      canBackupRestore: false,
    },
  },
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    userId: 'usr-admin',
    userName: 'Prof. Jean-Marc Kalombo',
    role: 'ADMIN',
    action: 'OUVERTURE_ANNEE_SCOLAIRE',
    details: 'Initialisation de l\'année scolaire 2025-2026',
    entityType: 'SYSTEME',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    userId: 'usr-secretaire',
    userName: 'M. Paulin Bamba',
    role: 'SECRETAIRE',
    action: 'INSCRIPTION_ELEVE',
    details: 'Inscription de l\'élève Esther BAHATI en 1ère Scientifique A',
    entityType: 'ELEVE',
    entityId: 'std-2',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    userId: 'usr-comptable',
    userName: 'Mme Thérèse Mukendi',
    role: 'COMPTABLE',
    action: 'PAIEMENT_ENCAISSE',
    details: 'Encaissement 100 USD (Acompte Minerval T1) - Reçu REC-2025-00104 pour Esther BAHATI',
    entityType: 'PAIEMENT',
    entityId: 'pay-4',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString(),
    userId: 'usr-prefet',
    userName: 'Prof. Dieudonné Ilunga',
    role: 'PREFET_ETUDES',
    action: 'SAISIE_NOTES_P1',
    details: 'Enregistrement des notes de Mathématiques P1 pour la 1ère Scientifique A',
    entityType: 'NOTE',
  },
];

export function getInitialDatabase(): AppDatabase {
  return {
    school: initialSchool,
    academicYears: initialAcademicYears,
    levels: initialLevels,
    sections: initialSections,
    classes: initialClasses,
    teachers: initialTeachers,
    subjects: initialSubjects,
    assignments: initialAssignments,
    students: initialStudents,
    enrollments: initialEnrollments,
    feeTypes: initialFeeTypes,
    payments: initialPayments,
    grades: initialGrades,
    users: initialUsers,
    currentUser: initialUsers[0],
    auditLogs: initialAuditLogs,
  };
}

export function loadDatabase(): AppDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialDatabase();
      saveDatabase(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    // Ensure vital keys exist
    const base = getInitialDatabase();
    return {
      ...base,
      ...parsed,
      school: { ...base.school, ...(parsed.school || {}) },
      currentUser: parsed.currentUser || base.currentUser,
    };
  } catch (err) {
    console.error('Failed to parse database from localStorage:', err);
    const initial = getInitialDatabase();
    saveDatabase(initial);
    return initial;
  }
}

export function saveDatabase(data: AppDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save database to localStorage:', err);
  }
}

export function createAuditLog(
  user: User,
  action: string,
  details: string,
  entityType: AuditLog['entityType'],
  entityId?: string
): AuditLog {
  return {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    role: user.role,
    action,
    details,
    entityType,
    entityId,
  };
}
