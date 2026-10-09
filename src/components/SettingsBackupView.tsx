import React, { useState, useRef } from 'react';
import {
  Settings,
  Building,
  Calendar,
  Database,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Smartphone,
  Terminal,
  Save,
  Laptop,
} from 'lucide-react';
import { AppDatabase, getInitialDatabase, createAuditLog } from '../services/storage';
import { AcademicYear, School } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsBackupViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({ db, onUpdateDb }) => {
  const [activeTab, setActiveTab] = useState<'SCHOOL' | 'YEARS' | 'BACKUP' | 'DESKTOP_EXE'>('DESKTOP_EXE');

  // School form
  const [schoolForm, setSchoolForm] = useState<School>(db.school);
  const [schoolSuccess, setSchoolSuccess] = useState(false);

  // Year modal / form
  const [newYearName, setNewYearName] = useState('');
  const [newYearStart, setNewYearStart] = useState('2026-09-01');
  const [newYearEnd, setNewYearEnd] = useState('2027-07-03');

  // Backup / Restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save School Info
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const log = createAuditLog(
      db.currentUser,
      'MODIFICATION_ETABLISSEMENT',
      `Mise à jour des coordonnées et paramètres de l'établissement (${schoolForm.name})`,
      'SYSTEME'
    );
    onUpdateDb({
      ...db,
      school: schoolForm,
      auditLogs: [log, ...db.auditLogs],
    });
    setSchoolSuccess(true);
    setTimeout(() => setSchoolSuccess(false), 3000);
  };

  // Add Academic Year
  const handleAddAcademicYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName) return;

    const newYear: AcademicYear = {
      id: 'ay-' + Date.now(),
      name: newYearName,
      startDate: newYearStart,
      endDate: newYearEnd,
      isCurrent: false,
      status: 'ACTIVE',
    };

    onUpdateDb({
      ...db,
      academicYears: [...db.academicYears, newYear],
      auditLogs: [
        createAuditLog(db.currentUser, 'AJOUT_ANNEE_SCOLAIRE', `Création de l'année scolaire ${newYear.name}`, 'SYSTEME'),
        ...db.auditLogs,
      ],
    });

    setNewYearName('');
  };

  const handleSetCurrentYear = (yearId: string) => {
    const updated = db.academicYears.map((y) => ({
      ...y,
      isCurrent: y.id === yearId,
    }));
    const yName = db.academicYears.find((y) => y.id === yearId)?.name;
    onUpdateDb({
      ...db,
      academicYears: updated,
      auditLogs: [
        createAuditLog(db.currentUser, 'CHANGEMENT_ANNEE_COURANTE', `Activation de l'année scolaire courante : ${yName}`, 'SYSTEME'),
        ...db.auditLogs,
      ],
    });
  };

  // Export JSON Backup
  const handleExportJSON = () => {
    const exportData = {
      version: '2.5.0',
      exportedAt: new Date().toISOString(),
      schoolName: db.school.name,
      database: db,
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `EDUGEST_SAUVEGARDE_${db.school.code || 'ECOLE'}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupMsg({
      type: 'success',
      text: 'Sauvegarde complète JSON téléchargée avec succès sur votre ordinateur !',
    });
  };

  // Import JSON Restore
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const importedDb: AppDatabase = parsed.database || parsed;

        if (!importedDb.students || !importedDb.classes || !importedDb.school) {
          throw new Error('Format de fichier invalide');
        }

        const log = createAuditLog(
          db.currentUser,
          'RESTAURATION_BASE',
          'Restauration complète de la base de données depuis un fichier de sauvegarde JSON',
          'SYSTEME'
        );

        onUpdateDb({
          ...importedDb,
          auditLogs: [log, ...(importedDb.auditLogs || [])],
        });

        setBackupMsg({
          type: 'success',
          text: 'Base de données restaurée avec succès ! Toutes les données sont à jour.',
        });
      } catch (err) {
        setBackupMsg({
          type: 'error',
          text: 'Erreur lors de la lecture du fichier. Assurez-vous qu\'il s\'agit d\'un fichier de sauvegarde EduGest valide.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Reset to initial demo data
  const handleResetToDemo = () => {
    if (confirm('Attention : Cette action va réinitialiser les données aux paramètres de démonstration. Confirmez-vous ?')) {
      const demo = getInitialDatabase();
      onUpdateDb(demo);
      setBackupMsg({
        type: 'success',
        text: 'Données réinitialisées aux valeurs de démonstration d\'origine.',
      });
    }
  };

  // Download Windows Portable Standalone Launcher (.bat)
  const handleDownloadWindowsLauncher = () => {
    const currentUrl = window.location.href;
    const batContent = `@echo off
title EduGest - Gestion Scolaire Intégrale
color 1F
echo ==========================================================
echo         EDUGEST - GESTION SCOLAIRE INTEGRALE
echo         Lancement en mode application Windows native
echo ==========================================================
echo.
echo Lancement de l'application locale...
echo URL : ${currentUrl}
echo.

:: Vérifie la présence de Microsoft Edge ou Chrome pour lancer en mode app autonome sans barre d'adresse
start msedge --app="${currentUrl}" || start chrome --app="${currentUrl}" || start "" "${currentUrl}"

exit
`;

    const blob = new Blob([batContent], { type: 'application/x-bat' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Lancer-EduGest-Windows.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Paramètres, Sauvegarde & Déploiement (.EXE / APK / PWA)
          </h2>
          <p className="text-xs text-slate-500">
            Identité de l'établissement, années scolaires, export local et installateur Windows / Mobile
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('DESKTOP_EXE')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DESKTOP_EXE' ? 'bg-blue-800 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span>Installation .EXE & Mobile</span>
          </button>
          <button
            onClick={() => setActiveTab('SCHOOL')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SCHOOL' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Établissement</span>
          </button>
          <button
            onClick={() => setActiveTab('YEARS')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'YEARS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Années Scolaires</span>
          </button>
          <button
            onClick={() => setActiveTab('BACKUP')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'BACKUP' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            <span>Sauvegarde & Restauration</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DESKTOP .EXE & APK / PWA INSTALLATION */}
      {activeTab === 'DESKTOP_EXE' && (
        <div className="space-y-6">
          {/* Main Hero Card for Desktop & PWA */}
          <div className="rounded-2xl border-2 border-blue-600 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-500/30 px-2.5 py-0.5 text-xs font-bold text-blue-200 uppercase tracking-wider border border-blue-400/30">
                    Spécification Point 25 & 27
                  </span>
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Mode Hors-ligne / 100% Local Prêt
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Installation Bureau (.EXE / Windows) & Mobile (APK / PWA)
                </h3>
                <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                  L'application fonctionne complètement hors-ligne sans connexion Internet. Vos données sont persistées localement. Installez-la directement comme application de bureau sous Windows ou sur smartphone Android/iOS.
                </p>
              </div>

              {/* Install triggers */}
              <div className="flex flex-col gap-2.5 shrink-0">
                <PWAInstallButton variant="hero" />

                <button
                  onClick={handleDownloadWindowsLauncher}
                  className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer"
                >
                  <Download className="h-4 w-4 text-amber-300" />
                  <span>Télécharger Lanceur Windows (.BAT)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Deployment options grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Windows Desktop .EXE */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Application PC Windows (.exe)</h4>
                    <span className="text-[10px] text-slate-400">Windows 10, 11 & Serveur</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Pour obtenir un exécutable <strong>.EXE autonome</strong> ou installable avec Inno Setup / Electron :
                </p>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2 text-[11px] text-slate-700 font-mono">
                  <p>1. Cliquez sur <strong>« Installer l'application »</strong> dans votre navigateur (Chrome / Edge crée automatiquement un raccourci .exe natif dans Windows).</p>
                  <p>2. Ou compilez en binaire natif via <strong>Nativefier</strong> :</p>
                  <div className="bg-slate-900 text-slate-200 p-2 rounded-md text-[10px] select-all">
                    npx nativefier --name "EduGest" "{window.location.href}"
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleDownloadWindowsLauncher}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 text-xs font-bold transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Obtenir le script d'exécution Windows</span>
                </button>
              </div>
            </div>

            {/* 2. Android APK / PWA Mobile */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Application Android (APK)</h4>
                    <span className="text-[10px] text-slate-400">PWA & Trusted Web Activity (TWA)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  EduGest est conforme à 100% aux normes <strong>PWA & Google Play</strong> avec Service Worker et Manifest actif.
                </p>

                <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-2 text-[11px] text-slate-700">
                  <p>• <strong>Sur mobile :</strong> Menu Chrome (3 points) &gt; <em>« Ajouter à l'écran d'accueil »</em>.</p>
                  <p>• <strong>Générer un fichier .APK :</strong> Utilisez l'outil officiel <strong>PWABuilder</strong> ou Bubblewrap CLI pour générer un fichier APK Android prêt à installer :</p>
                  <div className="bg-slate-900 text-slate-200 p-2 rounded-md font-mono text-[10px] select-all">
                    npx @bubblewrap/cli build
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg block text-center">
                  ✓ Manifest PWA & Service Worker Intégrés
                </span>
              </div>
            </div>

            {/* 3. Sécurité & Mode Hors-ligne */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Indépendance & Résilience</h4>
                    <span className="text-[10px] text-slate-400">Zéro dépendance réseau</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  L'application ne requiert aucun serveur distant obligatoire. Même en cas de coupure d'électricité ou d'absence de connexion Internet, toutes vos saisies de frais, élèves et notes sont préservées en local.
                </p>

                <div className="mt-3 p-3 bg-purple-50/50 rounded-xl space-y-1.5 text-xs text-purple-900">
                  <p className="font-semibold">Fonctionnalités de continuité :</p>
                  <p className="text-[11px]">• Sauvegarde synchrone dans le navigateur</p>
                  <p className="text-[11px]">• Exportation de sécurité JSON en 1-clic</p>
                  <p className="text-[11px]">• Restauration instantanée sur n'importe quel PC</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={handleExportJSON}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-700 text-white hover:bg-purple-800 py-2 text-xs font-bold transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exporter une Sauvegarde Complète</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOL INFO */}
      {activeTab === 'SCHOOL' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Coordonnées de l'Établissement</h3>
              <p className="text-xs text-slate-500">
                Ces informations figurent sur les reçus, bulletins de notes et documents certifiés
              </p>
            </div>
            {schoolSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl">
                <CheckCircle className="h-4 w-4" />
                Modifications enregistrées !
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSchool} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom Officiel de l'École *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Code / Sigle de l'École *</label>
                <input
                  type="text"
                  required
                  value={schoolForm.code}
                  onChange={(e) => setSchoolForm({ ...schoolForm, code: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Devise / Slogan</label>
                <input
                  type="text"
                  value={schoolForm.slogan}
                  onChange={(e) => setSchoolForm({ ...schoolForm, slogan: e.target.value })}
                  placeholder="Discipline - Travail - Succès"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Devise Monétaire *</label>
                <select
                  value={schoolForm.currency}
                  onChange={(e) => setSchoolForm({ ...schoolForm, currency: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                >
                  <option value="USD">Dollar Américain (USD - $)</option>
                  <option value="CDF">Franc Congolais (CDF - FC)</option>
                  <option value="EUR">Euro (EUR - €)</option>
                  <option value="XOF">Franc CFA (XOF / FCFA)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Téléphone de Direction</label>
                <input
                  type="text"
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Officiel</label>
                <input
                  type="email"
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({ ...schoolForm, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Boîte Postale (B.P.)</label>
                <input
                  type="text"
                  value={schoolForm.poBox}
                  onChange={(e) => setSchoolForm({ ...schoolForm, poBox: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adresse Physique</label>
                <input
                  type="text"
                  value={schoolForm.address}
                  onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ville / Province & Pays</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={schoolForm.city}
                    onChange={(e) => setSchoolForm({ ...schoolForm, city: e.target.value })}
                    placeholder="Kinshasa"
                    className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                  <input
                    type="text"
                    value={schoolForm.country}
                    onChange={(e) => setSchoolForm({ ...schoolForm, country: e.target.value })}
                    placeholder="RDC"
                    className="w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <h4 className="font-bold text-slate-800 mb-2">Visas Officiels & Signatures</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Arrêté d'Agrément Ministériel</label>
                  <input
                    type="text"
                    value={schoolForm.ministerialOrder}
                    onChange={(e) => setSchoolForm({ ...schoolForm, ministerialOrder: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nom du Signataire</label>
                  <input
                    type="text"
                    value={schoolForm.headmasterName}
                    onChange={(e) => setSchoolForm({ ...schoolForm, headmasterName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Titre du Signataire</label>
                  <input
                    type="text"
                    value={schoolForm.headmasterTitle}
                    onChange={(e) => setSchoolForm({ ...schoolForm, headmasterTitle: e.target.value })}
                    placeholder="Le Préfet des Études"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>Enregistrer les coordonnées de l'école</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ACADEMIC YEARS */}
      {activeTab === 'YEARS' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Ajouter une Nouvelle Année Scolaire</h3>
            <form onSubmit={handleAddAcademicYear} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
              <div className="flex-1 w-full">
                <label className="block font-semibold text-slate-700 mb-1">Libellé (ex: 2026-2027) *</label>
                <input
                  type="text"
                  required
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="2026-2027"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="w-full sm:w-44">
                <label className="block font-semibold text-slate-700 mb-1">Date d'Ouverture</label>
                <input
                  type="date"
                  value={newYearStart}
                  onChange={(e) => setNewYearStart(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <div className="w-full sm:w-44">
                <label className="block font-semibold text-slate-700 mb-1">Date de Clôture</label>
                <input
                  type="date"
                  value={newYearEnd}
                  onChange={(e) => setNewYearEnd(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 shadow-xs transition cursor-pointer"
              >
                Créer l'Année
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-3 px-4">Année Scolaire</th>
                  <th className="py-3 px-4">Période</th>
                  <th className="py-3 px-4">Statut Session</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {db.academicYears.map((ay) => (
                  <tr key={ay.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-black text-sm text-slate-900">
                      {ay.name} {ay.isCurrent && <span className="ml-2 text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-sm">Année Active</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      Du {ay.startDate} au {ay.endDate}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${ay.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {ay.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!ay.isCurrent && (
                        <button
                          onClick={() => handleSetCurrentYear(ay.id)}
                          className="rounded-lg bg-blue-50 hover:bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 transition cursor-pointer"
                        >
                          Définir comme Active
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'BACKUP' && (
        <div className="space-y-4">
          {backupMsg && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                backupMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {backupMsg.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
              <span>{backupMsg.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Backup Box */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Sauvegarde Complète (Export JSON)</h4>
                  <p className="text-xs text-slate-500">Exporte tous les élèves, notes, paiements et configurations</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Téléchargez une copie intégrale de la base de données. Le fichier téléchargé peut être conservé sur clé USB ou disque dur externe pour garantir la sécurité des données scolaires.
              </p>

              <button
                onClick={handleExportJSON}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger la Sauvegarde (.JSON)</span>
              </button>

              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const event = new CustomEvent('nav-to-sqlite');
                    window.dispatchEvent(event);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-2 text-xs font-semibold text-slate-800 transition cursor-pointer"
                >
                  <Database className="h-3.5 w-3.5 text-blue-700" />
                  <span>Gérer dans le Studio SQLite</span>
                </button>
              </div>
            </div>

            {/* Restore Box */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Restauration des Données</h4>
                  <p className="text-xs text-slate-500">Importer un fichier JSON de sauvegarde antérieur</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Restaurez instantanément l'état de l'application à partir d'un fichier de sauvegarde généré par EduGest.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Sélectionner le fichier de sauvegarde JSON</span>
              </button>
            </div>
          </div>

          {/* Reset Demo Data */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-sm text-rose-900">Réinitialisation aux Données de Démonstration</h4>
              <p className="text-xs text-rose-700">
                Remet à zéro la base de données avec le jeu complet d'élèves, de classes et de transactions exemple.
              </p>
            </div>
            <button
              onClick={handleResetToDemo}
              className="rounded-xl border border-rose-300 bg-white hover:bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
