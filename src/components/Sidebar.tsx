import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Wallet,
  Printer,
  ShieldCheck,
  Settings,
  X,
  Sparkles,
  Download,
  Database,
} from 'lucide-react';
import { Role } from '../types';

export type NavView =
  | 'dashboard'
  | 'students'
  | 'enrollments'
  | 'classes'
  | 'teachers'
  | 'grades'
  | 'finances'
  | 'documents'
  | 'users'
  | 'settings'
  | 'sqlite';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  isOpen: boolean;
  onClose: () => void;
  userRole: Role;
  schoolName: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onClose,
  userRole,
  schoolName,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavView,
      label: 'Tableau de Bord',
      sublabel: 'Statistiques & Synthèse',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'COMPTABLE', 'SECRETAIRE', 'PREFET_ETUDES', 'ENSEIGNANT'],
    },
    {
      id: 'students' as NavView,
      label: 'Élèves',
      sublabel: 'Répertoire & Dossiers',
      icon: Users,
      roles: ['ADMIN', 'COMPTABLE', 'SECRETAIRE', 'PREFET_ETUDES', 'ENSEIGNANT'],
    },
    {
      id: 'enrollments' as NavView,
      label: 'Inscriptions',
      sublabel: 'Nouvelles & Réinscriptions',
      icon: UserPlus,
      roles: ['ADMIN', 'SECRETAIRE', 'COMPTABLE'],
    },
    {
      id: 'classes' as NavView,
      label: 'Classes & Niveaux',
      sublabel: 'Salles, Niveaux & Sections',
      icon: GraduationCap,
      roles: ['ADMIN', 'PREFET_ETUDES', 'SECRETAIRE'],
    },
    {
      id: 'teachers' as NavView,
      label: 'Corps Enseignant',
      sublabel: 'Affectations & Matières',
      icon: Briefcase,
      roles: ['ADMIN', 'PREFET_ETUDES'],
    },
    {
      id: 'grades' as NavView,
      label: 'Notes & Bulletins',
      sublabel: 'Bulletins Périodiques & Blancs',
      icon: FileSpreadsheet,
      roles: ['ADMIN', 'PREFET_ETUDES', 'ENSEIGNANT'],
      highlight: true,
    },
    {
      id: 'finances' as NavView,
      label: 'Frais & Finances',
      sublabel: 'Paiements, Dettes & Reçus',
      icon: Wallet,
      roles: ['ADMIN', 'COMPTABLE'],
    },
    {
      id: 'documents' as NavView,
      label: 'Centre d\'Impression',
      sublabel: 'Reçus, Cartes, Certificats',
      icon: Printer,
      roles: ['ADMIN', 'COMPTABLE', 'SECRETAIRE', 'PREFET_ETUDES', 'ENSEIGNANT'],
    },
    {
      id: 'sqlite' as NavView,
      label: 'Base SQLite Locale',
      sublabel: 'Explorateur & Console SQL',
      icon: Database,
      roles: ['ADMIN', 'COMPTABLE', 'PREFET_ETUDES', 'SECRETAIRE'],
    },
    {
      id: 'users' as NavView,
      label: 'Utilisateurs & Audit',
      sublabel: 'Rôles & Traçabilité',
      icon: ShieldCheck,
      roles: ['ADMIN'],
    },
    {
      id: 'settings' as NavView,
      label: 'Configuration & .EXE',
      sublabel: 'Sauvegarde, Restauration & App',
      icon: Settings,
      roles: ['ADMIN', 'COMPTABLE', 'SECRETAIRE', 'PREFET_ETUDES'],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col justify-between border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:shadow-none no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-white font-extrabold text-lg shadow-sm">
                E
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900">EduGest</span>
                <span className="ml-1.5 rounded-sm bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                  ERP PRO
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer le menu"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const hasAccess = item.roles.includes(userRole);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    onClose();
                  }}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-800 text-white shadow-xs'
                      : hasAccess
                      ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition ${
                      isActive ? 'text-white' : hasAccess ? 'text-blue-700 group-hover:text-blue-900' : 'text-slate-300'
                    }`}
                  />
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="truncate">{item.label}</span>
                      {item.highlight && !isActive && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                          Blanc & Réel
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] font-normal truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Bottom Card / System Status */}
          <div className="border-t border-slate-100 p-4 bg-slate-50/70">
            <div className="rounded-xl border border-blue-100 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Système Local Actif
                </span>
                <span className="text-[10px] font-semibold text-slate-500">v2.5 PWA</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 leading-tight">
                Données synchronisées en local. Fonctionne sans connexion Internet.
              </p>
              <button
                onClick={() => {
                  onSelectView('settings');
                  onClose();
                }}
                className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-50 py-1.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger .EXE & Sauvegarde</span>
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
