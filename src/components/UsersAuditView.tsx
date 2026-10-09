import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Clock,
  History,
  Search,
  Filter,
  Check,
  X,
  Lock,
  Eye,
  KeyRound,
} from 'lucide-react';
import { AppDatabase, createAuditLog } from '../services/storage';
import { User, Role } from '../types';
import { formatDate, formatDateTime } from '../utils/helpers';

interface UsersAuditViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
}

export const UsersAuditView: React.FC<UsersAuditViewProps> = ({ db, onUpdateDb }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT_LOGS'>('AUDIT_LOGS');

  // Search & Filter for Audit Logs
  const [auditSearch, setAuditSearch] = useState('');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState('ALL');

  // User modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState<Partial<User>>({
    role: 'SECRETAIRE',
    permissions: {
      canManageStudents: true,
      canManageFinances: false,
      canEnterGrades: false,
      canValidateBulletins: false,
      canManageConfig: false,
      canBackupRestore: false,
    },
  });

  // Filtered audit logs
  const filteredLogs = db.auditLogs.filter((log) => {
    if (selectedEntityFilter !== 'ALL' && log.entityType !== selectedEntityFilter) return false;
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      const match =
        log.details.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email) return;

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: userForm.name,
      email: userForm.email,
      role: userForm.role || 'SECRETAIRE',
      permissions: userForm.permissions || {
        canManageStudents: true,
        canManageFinances: false,
        canEnterGrades: false,
        canValidateBulletins: false,
        canManageConfig: false,
        canBackupRestore: false,
      },
    };

    const log = createAuditLog(
      db.currentUser,
      'CREATION_UTILISATEUR',
      `Création du compte utilisateur : ${newUser.name} (Rôle: ${newUser.role})`,
      'SYSTEME',
      newUser.id
    );

    onUpdateDb({
      ...db,
      users: [...db.users, newUser],
      auditLogs: [log, ...db.auditLogs],
    });

    setIsUserModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
            Gestion des Utilisateurs & Journal de Traçabilité (Audit)
          </h2>
          <p className="text-xs text-slate-500">
            Contrôle d'accès basé sur les rôles (RBAC), sécurité et historique inviolable des opérations
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'AUDIT_LOGS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Journal d'Audit ({db.auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'USERS' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Utilisateurs & Rôles ({db.users.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AUDIT LOGS */}
      {activeTab === 'AUDIT_LOGS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Rechercher par action, utilisateur, détail..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden"
              />
            </div>

            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 cursor-pointer"
            >
              <option value="ALL">Toutes les entités</option>
              <option value="ELEVE">Élèves</option>
              <option value="PAIEMENT">Paiements & Caisse</option>
              <option value="NOTE">Notes & Cotes</option>
              <option value="INSCRIPTION">Inscriptions</option>
              <option value="CLASSE">Classes</option>
              <option value="ENSEIGNANT">Enseignants</option>
              <option value="SYSTEME">Système & Sécurité</option>
            </select>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-3 px-4">Horodatage</th>
                    <th className="py-3 px-4">Utilisateur Responsable</th>
                    <th className="py-3 px-4">Action Enregistrée</th>
                    <th className="py-3 px-4">Entité</th>
                    <th className="py-3 px-4">Détails de l'Opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{log.userName}</div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded-sm">
                          {log.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[11px] text-slate-800">
                        {log.action}
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-sm bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium max-w-md">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USERS & RBAC MATRIX */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Créer un Compte Utilisateur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {db.users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-900 font-black text-sm">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{user.name}</h3>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-800">
                    {user.role}
                  </span>
                </div>

                {/* Permissions Matrix */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs">
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Matrice des Permissions Attribuées
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-600">
                    <div className="flex items-center gap-1.5">
                      {user.permissions.canManageStudents ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>Gestion des Élèves</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.permissions.canManageFinances ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>Caisse & Finances</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.permissions.canEnterGrades ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>Saisie des Cotes</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.permissions.canValidateBulletins ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>Validation Bulletins</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.permissions.canManageConfig ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>Configuration École</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.permissions.canBackupRestore ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      )}
                      <span>Sauvegarde / Restauration</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Add User */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Nouveau Compte Utilisateur
            </h3>
            <form onSubmit={handleSaveUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nom Complet *</label>
                <input
                  type="text"
                  required
                  value={userForm.name || ''}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Ex: M. Jérôme Bakambu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email / Identifiant *</label>
                <input
                  type="email"
                  required
                  value={userForm.email || ''}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="j.bakambu@ecole.edu"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rôle Principal</label>
                <select
                  value={userForm.role}
                  onChange={(e) => {
                    const r = e.target.value as Role;
                    setUserForm({
                      ...userForm,
                      role: r,
                      permissions: {
                        canManageStudents: r !== 'ENSEIGNANT',
                        canManageFinances: r === 'ADMIN' || r === 'COMPTABLE',
                        canEnterGrades: r === 'ADMIN' || r === 'PREFET_ETUDES' || r === 'ENSEIGNANT',
                        canValidateBulletins: r === 'ADMIN' || r === 'PREFET_ETUDES',
                        canManageConfig: r === 'ADMIN',
                        canBackupRestore: r === 'ADMIN',
                      },
                    });
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                >
                  <option value="ADMIN">Administrateur / Chef d'Établissement</option>
                  <option value="COMPTABLE">Comptable / Économe</option>
                  <option value="SECRETAIRE">Secrétaire de Direction</option>
                  <option value="PREFET_ETUDES">Préfet des Études / Directeur Pédagogique</option>
                  <option value="ENSEIGNANT">Enseignant</option>
                </select>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-xs font-bold text-white hover:bg-blue-800 cursor-pointer"
                >
                  Créer l'utilisateur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
