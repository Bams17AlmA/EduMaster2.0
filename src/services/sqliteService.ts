import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import { AppDatabase, getInitialDatabase } from './storage';
import {
  AcademicYear,
  Assignment,
  AuditLog,
  Enrollment,
  FeeType,
  Grade,
  Level,
  Payment,
  School,
  SchoolClass,
  Section,
  Student,
  Subject,
  Teacher,
  User,
} from '../types';

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

const INDEXED_DB_NAME = 'EduGestLocalDB';
const INDEXED_DB_STORE = 'sqlite_file';
const INDEXED_DB_KEY = 'edugest_sqlite_binary';

export async function getSqliteEngine(): Promise<SqlJsStatic> {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => `/${file}`,
    });
  }
  return SQL;
}

// Open IndexedDB database for persistent local storage on Android and PC
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(INDEXED_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
        db.createObjectStore(INDEXED_DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSqliteToIndexedDB(binary: Uint8Array): Promise<void> {
  try {
    const idb = await openIndexedDB();
    const tx = idb.transaction(INDEXED_DB_STORE, 'readwrite');
    const store = tx.objectStore(INDEXED_DB_STORE);
    store.put(binary, INDEXED_DB_KEY);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not save SQLite to IndexedDB:', err);
  }
}

export async function loadSqliteFromIndexedDB(): Promise<Uint8Array | null> {
  try {
    const idb = await openIndexedDB();
    const tx = idb.transaction(INDEXED_DB_STORE, 'readonly');
    const store = tx.objectStore(INDEXED_DB_STORE);
    const request = store.get(INDEXED_DB_KEY);
    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result instanceof Uint8Array) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    return null;
  }
}

export async function initSqliteDatabase(initialData?: AppDatabase): Promise<Database> {
  const engine = await getSqliteEngine();

  // Check if we have an existing SQLite file in IndexedDB
  const cachedBinary = await loadSqliteFromIndexedDB();
  if (cachedBinary && cachedBinary.length > 0) {
    try {
      dbInstance = new engine.Database(cachedBinary);
      return dbInstance;
    } catch (e) {
      console.warn('Cached SQLite binary corrupted, creating new:', e);
    }
  }

  // Otherwise create new memory database
  dbInstance = new engine.Database();
  createSqliteTables(dbInstance);

  if (initialData) {
    populateSqliteFromAppDatabase(dbInstance, initialData);
    const binary = dbInstance.export();
    await saveSqliteToIndexedDB(binary);
  }

  return dbInstance;
}

export function createSqliteTables(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS etablissement (
      id TEXT PRIMARY KEY,
      nom TEXT,
      code TEXT,
      slogan TEXT,
      adresse TEXT,
      telephone TEXT,
      email TEXT,
      bp TEXT,
      ville TEXT,
      pays TEXT,
      devise TEXT,
      arrete_ministeriel TEXT,
      signataire_nom TEXT,
      signataire_titre TEXT
    );

    CREATE TABLE IF NOT EXISTS annees_scolaires (
      id TEXT PRIMARY KEY,
      nom TEXT,
      date_debut TEXT,
      date_fin TEXT,
      est_actuelle INTEGER,
      statut TEXT
    );

    CREATE TABLE IF NOT EXISTS niveaux (
      id TEXT PRIMARY KEY,
      nom TEXT,
      cycle TEXT,
      ordre INTEGER
    );

    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY,
      nom TEXT,
      code TEXT,
      cycle TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      nom TEXT,
      niveau_id TEXT,
      section_id TEXT,
      annee_id TEXT,
      salle TEXT,
      capacite INTEGER,
      titulaire_id TEXT
    );

    CREATE TABLE IF NOT EXISTS enseignants (
      id TEXT PRIMARY KEY,
      matricule TEXT,
      nom_complet TEXT,
      sexe TEXT,
      telephone TEXT,
      email TEXT,
      qualification TEXT,
      statut TEXT,
      specialites TEXT,
      date_embauche TEXT
    );

    CREATE TABLE IF NOT EXISTS matieres (
      id TEXT PRIMARY KEY,
      code TEXT,
      nom TEXT,
      categorie TEXT,
      max_points INTEGER,
      coefficient INTEGER
    );

    CREATE TABLE IF NOT EXISTS affectations (
      id TEXT PRIMARY KEY,
      annee_id TEXT,
      enseignant_id TEXT,
      classe_id TEXT,
      matiere_id TEXT,
      heures_semaine INTEGER
    );

    CREATE TABLE IF NOT EXISTS eleves (
      id TEXT PRIMARY KEY,
      matricule TEXT UNIQUE,
      nom TEXT,
      postnom TEXT,
      prenom TEXT,
      sexe TEXT,
      date_naissance TEXT,
      lieu_naissance TEXT,
      nationalite TEXT,
      adresse TEXT,
      nom_parent TEXT,
      telephone_parent TEXT,
      email_parent TEXT,
      profession_parent TEXT,
      groupe_sanguin TEXT,
      notes_medicales TEXT,
      statut TEXT,
      date_inscription TEXT
    );

    CREATE TABLE IF NOT EXISTS inscriptions (
      id TEXT PRIMARY KEY,
      eleve_id TEXT,
      classe_id TEXT,
      annee_id TEXT,
      type TEXT,
      date_inscription TEXT,
      statut TEXT,
      notes TEXT,
      classe_precedente TEXT
    );

    CREATE TABLE IF NOT EXISTS frais_scolaires (
      id TEXT PRIMARY KEY,
      nom TEXT,
      categorie TEXT,
      montant REAL,
      devise TEXT,
      echeance TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS paiements (
      id TEXT PRIMARY KEY,
      recu_numero TEXT UNIQUE,
      eleve_id TEXT,
      frais_id TEXT,
      annee_id TEXT,
      montant_paye REAL,
      devise TEXT,
      date_paiement TEXT,
      mode_paiement TEXT,
      reference TEXT,
      caissier TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      annee_id TEXT,
      classe_id TEXT,
      eleve_id TEXT,
      matiere_id TEXT,
      periode TEXT,
      note REAL,
      max_note REAL,
      est_simulation INTEGER,
      mis_a_jour TEXT
    );

    CREATE TABLE IF NOT EXISTS utilisateurs (
      id TEXT PRIMARY KEY,
      nom TEXT,
      email TEXT,
      role TEXT,
      permissions TEXT
    );

    CREATE TABLE IF NOT EXISTS journal_audit (
      id TEXT PRIMARY KEY,
      horodatage TEXT,
      utilisateur_id TEXT,
      utilisateur_nom TEXT,
      role TEXT,
      action TEXT,
      details TEXT,
      type_entite TEXT,
      entite_id TEXT
    );
  `);
}

export function populateSqliteFromAppDatabase(db: Database, appDb: AppDatabase): void {
  db.run('BEGIN TRANSACTION;');

  // Clear tables
  db.run(`
    DELETE FROM etablissement;
    DELETE FROM annees_scolaires;
    DELETE FROM niveaux;
    DELETE FROM sections;
    DELETE FROM classes;
    DELETE FROM enseignants;
    DELETE FROM matieres;
    DELETE FROM affectations;
    DELETE FROM eleves;
    DELETE FROM inscriptions;
    DELETE FROM frais_scolaires;
    DELETE FROM paiements;
    DELETE FROM notes;
    DELETE FROM utilisateurs;
    DELETE FROM journal_audit;
  `);

  // Etablissement
  const s = appDb.school;
  db.run(
    `INSERT INTO etablissement VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      s.id, s.name, s.code, s.slogan, s.address, s.phone, s.email,
      s.poBox, s.city, s.country, s.currency, s.ministerialOrder,
      s.headmasterName, s.headmasterTitle
    ]
  );

  // Annees scolaires
  appDb.academicYears.forEach((ay) => {
    db.run(`INSERT INTO annees_scolaires VALUES (?, ?, ?, ?, ?, ?)`, [
      ay.id, ay.name, ay.startDate, ay.endDate, ay.isCurrent ? 1 : 0, ay.status
    ]);
  });

  // Niveaux
  appDb.levels.forEach((l) => {
    db.run(`INSERT INTO niveaux VALUES (?, ?, ?, ?)`, [l.id, l.name, l.cycle, l.order]);
  });

  // Sections
  appDb.sections.forEach((sec) => {
    db.run(`INSERT INTO sections VALUES (?, ?, ?, ?, ?)`, [
      sec.id, sec.name, sec.code, sec.cycle, sec.description || ''
    ]);
  });

  // Classes
  appDb.classes.forEach((c) => {
    db.run(`INSERT INTO classes VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      c.id, c.name, c.levelId, c.sectionId || '', c.academicYearId, c.room, c.capacity, c.mainTeacherId || ''
    ]);
  });

  // Enseignants
  appDb.teachers.forEach((t) => {
    db.run(`INSERT INTO enseignants VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      t.id, t.matricule, t.fullName, t.gender, t.phone, t.email,
      t.qualification, t.status, JSON.stringify(t.specialties), t.hireDate
    ]);
  });

  // Matieres
  appDb.subjects.forEach((sub) => {
    db.run(`INSERT INTO matieres VALUES (?, ?, ?, ?, ?, ?)`, [
      sub.id, sub.code, sub.name, sub.category, sub.defaultMaxPoints, sub.defaultCoefficient
    ]);
  });

  // Affectations
  appDb.assignments.forEach((asg) => {
    db.run(`INSERT INTO affectations VALUES (?, ?, ?, ?, ?, ?)`, [
      asg.id, asg.academicYearId, asg.teacherId, asg.classId, asg.subjectId, asg.weeklyHours
    ]);
  });

  // Eleves
  appDb.students.forEach((st) => {
    db.run(`INSERT INTO eleves VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      st.id, st.matricule, st.lastName, st.middleName || '', st.firstName, st.gender,
      st.birthDate, st.birthPlace, st.nationality, st.address, st.parentName,
      st.parentPhone, st.parentEmail || '', st.parentProfession || '',
      st.bloodGroup || '', st.medicalNotes || '', st.status, st.registrationDate
    ]);
  });

  // Inscriptions
  appDb.enrollments.forEach((en) => {
    db.run(`INSERT INTO inscriptions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      en.id, en.studentId, en.classId, en.academicYearId, en.type,
      en.date, en.status, en.notes || '', en.previousClass || ''
    ]);
  });

  // Frais scolaires
  appDb.feeTypes.forEach((f) => {
    db.run(`INSERT INTO frais_scolaires VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      f.id, f.name, f.category, f.amount, f.currency, f.dueDate || '', f.description || ''
    ]);
  });

  // Paiements
  appDb.payments.forEach((p) => {
    db.run(`INSERT INTO paiements VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      p.id, p.receiptNumber, p.studentId, p.feeTypeId, p.academicYearId,
      p.amountPaid, p.currency, p.date, p.paymentMethod, p.reference || '',
      p.cashierName, p.notes || ''
    ]);
  });

  // Notes
  appDb.grades.forEach((g) => {
    db.run(`INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      g.id, g.academicYearId, g.classId, g.studentId, g.subjectId,
      g.period, g.score, g.maxScore, g.isSimulation ? 1 : 0, g.updatedAt
    ]);
  });

  // Utilisateurs
  appDb.users.forEach((u) => {
    db.run(`INSERT INTO utilisateurs VALUES (?, ?, ?, ?, ?)`, [
      u.id, u.name, u.email, u.role, JSON.stringify(u.permissions)
    ]);
  });

  // Journal Audit
  appDb.auditLogs.forEach((l) => {
    db.run(`INSERT INTO journal_audit VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      l.id, l.timestamp, l.userId, l.userName, l.role, l.action, l.details, l.entityType, l.entityId || ''
    ]);
  });

  db.run('COMMIT;');
}

export function exportSqliteFromDatabase(db: Database): Uint8Array {
  return db.export();
}

export function generateSqlDumpScript(db: Database): string {
  let dump = `-- ==========================================================\n`;
  dump += `-- EDUGEST - EXPORT DE LA BASE DE DONNÉES SQLITE\n`;
  dump += `-- Date d'exportation : ${new Date().toISOString()}\n`;
  dump += `-- Compatible avec DB Browser for SQLite, SQLite3, MySQL, etc.\n`;
  dump += `-- ==========================================================\n\n`;

  const tables = [
    'etablissement', 'annees_scolaires', 'niveaux', 'sections', 'classes',
    'enseignants', 'matieres', 'affectations', 'eleves', 'inscriptions',
    'frais_scolaires', 'paiements', 'notes', 'utilisateurs', 'journal_audit'
  ];

  tables.forEach((tableName) => {
    try {
      const res = db.exec(`SELECT * FROM ${tableName}`);
      if (res.length > 0) {
        const { columns, values } = res[0];
        dump += `\n-- Table: ${tableName} (${values.length} enregistrements)\n`;
        values.forEach((row) => {
          const formattedValues = row.map((val) => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'number') return val;
            return `'${String(val).replace(/'/g, "''")}'`;
          });
          dump += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${formattedValues.join(', ')});\n`;
        });
      }
    } catch (e) {
      // Ignore
    }
  });

  return dump;
}

export interface QueryResult {
  columns: string[];
  values: (string | number | null)[][];
  rowCount: number;
  executionTimeMs: number;
}

export function executeSqliteQuery(db: Database, query: string): QueryResult {
  const start = performance.now();
  const res = db.exec(query);
  const time = Math.round((performance.now() - start) * 100) / 100;

  if (res.length === 0) {
    return {
      columns: [],
      values: [],
      rowCount: 0,
      executionTimeMs: time,
    };
  }

  return {
    columns: res[0].columns,
    values: res[0].values as (string | number | null)[][],
    rowCount: res[0].values.length,
    executionTimeMs: time,
  };
}

// Convert SQLite rows back to AppDatabase struct
export function readAppDatabaseFromSqlite(db: Database): AppDatabase {
  const fallback = getInitialDatabase();

  try {
    // School
    const schoolRes = db.exec('SELECT * FROM etablissement LIMIT 1');
    let school: School = fallback.school;
    if (schoolRes.length > 0 && schoolRes[0].values.length > 0) {
      const row = schoolRes[0].values[0];
      school = {
        id: String(row[0]),
        name: String(row[1]),
        code: String(row[2]),
        slogan: String(row[3]),
        address: String(row[4]),
        phone: String(row[5]),
        email: String(row[6]),
        poBox: String(row[7]),
        city: String(row[8]),
        country: String(row[9]),
        currency: String(row[10]),
        ministerialOrder: String(row[11]),
        headmasterName: String(row[12]),
        headmasterTitle: String(row[13]),
      };
    }

    // Academic Years
    const yearsRes = db.exec('SELECT * FROM annees_scolaires');
    const academicYears: AcademicYear[] =
      yearsRes.length > 0
        ? yearsRes[0].values.map((r) => ({
            id: String(r[0]),
            name: String(r[1]),
            startDate: String(r[2]),
            endDate: String(r[3]),
            isCurrent: Number(r[4]) === 1,
            status: r[5] as any,
          }))
        : fallback.academicYears;

    // Levels
    const levelsRes = db.exec('SELECT * FROM niveaux ORDER BY ordre ASC');
    const levels: Level[] =
      levelsRes.length > 0
        ? levelsRes[0].values.map((r) => ({
            id: String(r[0]),
            name: String(r[1]),
            cycle: r[2] as any,
            order: Number(r[3]),
          }))
        : fallback.levels;

    // Sections
    const secRes = db.exec('SELECT * FROM sections');
    const sections: Section[] =
      secRes.length > 0
        ? secRes[0].values.map((r) => ({
            id: String(r[0]),
            name: String(r[1]),
            code: String(r[2]),
            cycle: r[3] as any,
            description: String(r[4]),
          }))
        : fallback.sections;

    // Classes
    const clsRes = db.exec('SELECT * FROM classes');
    const classes: SchoolClass[] =
      clsRes.length > 0
        ? clsRes[0].values.map((r) => ({
            id: String(r[0]),
            name: String(r[1]),
            levelId: String(r[2]),
            sectionId: r[3] ? String(r[3]) : undefined,
            academicYearId: String(r[4]),
            room: String(r[5]),
            capacity: Number(r[6]),
            mainTeacherId: r[7] ? String(r[7]) : undefined,
          }))
        : fallback.classes;

    // Teachers
    const tchRes = db.exec('SELECT * FROM enseignants');
    const teachers: Teacher[] =
      tchRes.length > 0
        ? tchRes[0].values.map((r) => {
            let specialties: string[] = [];
            try {
              specialties = JSON.parse(String(r[8]));
            } catch {
              specialties = [];
            }
            return {
              id: String(r[0]),
              matricule: String(r[1]),
              fullName: String(r[2]),
              gender: r[3] as any,
              phone: String(r[4]),
              email: String(r[5]),
              qualification: String(r[6]),
              status: r[7] as any,
              specialties,
              hireDate: String(r[9]),
            };
          })
        : fallback.teachers;

    // Subjects
    const subRes = db.exec('SELECT * FROM matieres');
    const subjects: Subject[] =
      subRes.length > 0
        ? subRes[0].values.map((r) => ({
            id: String(r[0]),
            code: String(r[1]),
            name: String(r[2]),
            category: r[3] as any,
            defaultMaxPoints: Number(r[4]),
            defaultCoefficient: Number(r[5]),
          }))
        : fallback.subjects;

    // Assignments
    const asgRes = db.exec('SELECT * FROM affectations');
    const assignments: Assignment[] =
      asgRes.length > 0
        ? asgRes[0].values.map((r) => ({
            id: String(r[0]),
            academicYearId: String(r[1]),
            teacherId: String(r[2]),
            classId: String(r[3]),
            subjectId: String(r[4]),
            weeklyHours: Number(r[5]),
          }))
        : fallback.assignments;

    // Students
    const stRes = db.exec('SELECT * FROM eleves');
    const students: Student[] =
      stRes.length > 0
        ? stRes[0].values.map((r) => ({
            id: String(r[0]),
            matricule: String(r[1]),
            lastName: String(r[2]),
            middleName: r[3] ? String(r[3]) : undefined,
            firstName: String(r[4]),
            gender: r[5] as any,
            birthDate: String(r[6]),
            birthPlace: String(r[7]),
            nationality: String(r[8]),
            address: String(r[9]),
            parentName: String(r[10]),
            parentPhone: String(r[11]),
            parentEmail: r[12] ? String(r[12]) : undefined,
            parentProfession: r[13] ? String(r[13]) : undefined,
            bloodGroup: r[14] ? String(r[14]) : undefined,
            medicalNotes: r[15] ? String(r[15]) : undefined,
            status: r[16] as any,
            registrationDate: String(r[17]),
          }))
        : fallback.students;

    // Enrollments
    const enRes = db.exec('SELECT * FROM inscriptions');
    const enrollments: Enrollment[] =
      enRes.length > 0
        ? enRes[0].values.map((r) => ({
            id: String(r[0]),
            studentId: String(r[1]),
            classId: String(r[2]),
            academicYearId: String(r[3]),
            type: r[4] as any,
            date: String(r[5]),
            status: r[6] as any,
            notes: r[7] ? String(r[7]) : undefined,
            previousClass: r[8] ? String(r[8]) : undefined,
          }))
        : fallback.enrollments;

    // Fee Types
    const feeRes = db.exec('SELECT * FROM frais_scolaires');
    const feeTypes: FeeType[] =
      feeRes.length > 0
        ? feeRes[0].values.map((r) => ({
            id: String(r[0]),
            name: String(r[1]),
            category: r[2] as any,
            amount: Number(r[3]),
            currency: String(r[4]),
            dueDate: r[5] ? String(r[5]) : undefined,
            description: r[6] ? String(r[6]) : undefined,
          }))
        : fallback.feeTypes;

    // Payments
    const payRes = db.exec('SELECT * FROM paiements');
    const payments: Payment[] =
      payRes.length > 0
        ? payRes[0].values.map((r) => ({
            id: String(r[0]),
            receiptNumber: String(r[1]),
            studentId: String(r[2]),
            feeTypeId: String(r[3]),
            academicYearId: String(r[4]),
            amountPaid: Number(r[5]),
            currency: String(r[6]),
            date: String(r[7]),
            paymentMethod: r[8] as any,
            reference: r[9] ? String(r[9]) : undefined,
            cashierName: String(r[10]),
            notes: r[11] ? String(r[11]) : undefined,
          }))
        : fallback.payments;

    // Grades
    const grdRes = db.exec('SELECT * FROM notes');
    const grades: Grade[] =
      grdRes.length > 0
        ? grdRes[0].values.map((r) => ({
            id: String(r[0]),
            academicYearId: String(r[1]),
            classId: String(r[2]),
            studentId: String(r[3]),
            subjectId: String(r[4]),
            period: r[5] as any,
            score: Number(r[6]),
            maxScore: Number(r[7]),
            isSimulation: Number(r[8]) === 1,
            updatedAt: String(r[9]),
          }))
        : fallback.grades;

    // Users
    const usrRes = db.exec('SELECT * FROM utilisateurs');
    const users: User[] =
      usrRes.length > 0
        ? usrRes[0].values.map((r) => {
            let permissions = fallback.users[0].permissions;
            try {
              permissions = JSON.parse(String(r[4]));
            } catch {
              // fallback
            }
            return {
              id: String(r[0]),
              name: String(r[1]),
              email: String(r[2]),
              role: r[3] as any,
              permissions,
            };
          })
        : fallback.users;

    // Audit logs
    const logRes = db.exec('SELECT * FROM journal_audit ORDER BY horodatage DESC');
    const auditLogs: AuditLog[] =
      logRes.length > 0
        ? logRes[0].values.map((r) => ({
            id: String(r[0]),
            timestamp: String(r[1]),
            userId: String(r[2]),
            userName: String(r[3]),
            role: r[4] as any,
            action: String(r[5]),
            details: String(r[6]),
            entityType: r[7] as any,
            entityId: r[8] ? String(r[8]) : undefined,
          }))
        : fallback.auditLogs;

    return {
      school,
      academicYears,
      levels,
      sections,
      classes,
      teachers,
      subjects,
      assignments,
      students,
      enrollments,
      feeTypes,
      payments,
      grades,
      users,
      currentUser: users[0] || fallback.currentUser,
      auditLogs,
    };
  } catch (err) {
    console.error('Error parsing SQLite to AppDatabase:', err);
    return fallback;
  }
}
