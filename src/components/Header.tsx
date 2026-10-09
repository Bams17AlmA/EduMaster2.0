import React from 'react';
import {
  School,
  Calendar,
  Shield,
  User as UserIcon,
  Search,
  Bell,
  Menu,
} from 'lucide-react';
import { AppDatabase } from '../services/storage';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  db,
  onUpdateDb,
  onToggleSidebar,
  searchQuery,
  onSearchChange,
}) => {
  const currentYear = db.academicYears.find((y) => y.isCurrent) || db.academicYears[0];

  const handleYearChange = (yearId: string) => {
    const updatedYears = db.academicYears.map((y) => ({
      ...y,
      isCurrent: y.id === yearId,
    }));
    onUpdateDb({
      ...db,
      academicYears: updatedYears,
    });
  };

  const handleUserChange = (userId: string) => {
    const selected = db.users.find((u) => u.id === userId);
    if (selected) {
      onUpdateDb({
        ...db,
        currentUser: selected,
      });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md lg:px-6 no-print">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Ouvrir le menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-900 text-white shadow-xs">
            <School className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1 max-w-[200px] sm:max-w-[320px]">
              {db.school.name}
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              {db.school.slogan || 'Gestion Scolaire Numérisée'}
            </p>
          </div>
        </div>
      </div>

      {/* Center Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher élève (nom, matricule), reçu..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-1.5 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:bg-white focus:outline-hidden transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        <PWAInstallButton variant="nav" />

        {/* Academic Year Switcher */}
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
          <Calendar className="h-3.5 w-3.5 text-blue-600" />
          <select
            value={currentYear.id}
            onChange={(e) => handleYearChange(e.target.value)}
            className="bg-transparent font-semibold text-slate-700 outline-hidden cursor-pointer"
            title="Année scolaire en cours"
          >
            {db.academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} {ay.isCurrent ? '(Actuelle)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* User Role Switcher for easy testing and RBAC switching */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-[11px]">
            {db.currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <select
              value={db.currentUser.id}
              onChange={(e) => handleUserChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-hidden cursor-pointer"
              title="Changer d'utilisateur / Profil de rôle"
            >
              {db.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
