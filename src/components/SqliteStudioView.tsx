import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Terminal,
  Play,
  Download,
  Upload,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertTriangle,
  Table,
  Layers,
  Code,
  HardDrive,
  Save,
  X,
  FileCode,
} from 'lucide-react';
import {
  initSqliteDatabase,
  populateSqliteFromAppDatabase,
  readAppDatabaseFromSqlite,
  executeSqliteQuery,
  exportSqliteFromDatabase,
  generateSqlDumpScript,
  saveSqliteToIndexedDB,
  QueryResult,
} from '../services/sqliteService';
import { AppDatabase, createAuditLog } from '../services/storage';

interface SqliteStudioViewProps {
  db: AppDatabase;
  onUpdateDb: (updated: AppDatabase) => void;
}

const TABLE_DEFINITIONS = [
  { name: 'eleves', label: 'Élèves (eleves)', description: 'Fiches signalétiques et données personnelles' },
  { name: 'inscriptions', label: 'Inscriptions (inscriptions)', description: 'Affectations annuelles aux classes' },
  { name: 'classes', label: 'Classes (classes)', description: 'Salles, effectifs et capacités' },
  { name: 'niveaux', label: 'Niveaux (niveaux)', description: 'Cycles scolaires et ordre' },
  { name: 'sections', label: 'Sections (sections)', description: 'Filières et options' },
  { name: 'enseignants', label: 'Enseignants (enseignants)', description: 'Corps professoral et qualifications' },
  { name: 'matieres', label: 'Matières (matieres)', description: 'Programme d\'études et coefficients' },
  { name: 'affectations', label: 'Affectations (affectations)', description: 'Charges horaires par classe et matière' },
  { name: 'frais_scolaires', label: 'Frais (frais_scolaires)', description: 'Grille tarifaire et échéances' },
  { name: 'paiements', label: 'Paiements (paiements)', description: 'Journal des encaissements et reçus' },
  { name: 'notes', label: 'Notes (notes)', description: 'Cotes d\'évaluations et examens' },
  { name: 'etablissement', label: 'École (etablissement)', description: 'Configuration et coordonnées de l\'école' },
  { name: 'annees_scolaires', label: 'Années (annees_scolaires)', description: 'Sessions académiques' },
  { name: 'utilisateurs', label: 'Utilisateurs (utilisateurs)', description: 'Comptes et droits d\'accès' },
  { name: 'journal_audit', label: 'Audit (journal_audit)', description: 'Traçabilité et journal d\'opérations' },
];

export const SqliteStudioView: React.FC<SqliteStudioViewProps> = ({ db, onUpdateDb }) => {
  const [activeTab, setActiveTab] = useState<'TABLE_EXPLORER' | 'SQL_CONSOLE' | 'SCHEMA' | 'BACKUP_SYNC'>('TABLE_EXPLORER');
  const [selectedTable, setSelectedTable] = useState<string>('eleves');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [queryInput, setQueryInput] = useState<string>('SELECT * FROM eleves LIMIT 10;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [sqliteLoaded, setSqliteLoaded] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Row editor modal
  const [isRowEditModalOpen, setIsRowEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [isNewRow, setIsNewRow] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sqliteDbRef = useRef<any>(null);

  // Initialize SQLite database instance
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const sqliteDb = await initSqliteDatabase(db);
        sqliteDbRef.current = sqliteDb;
        if (isMounted) {
          setSqliteLoaded(true);
          loadTableData(sqliteDb, 'eleves');
        }
      } catch (err: any) {
        console.error('Error init sqlite:', err);
        if (isMounted) {
          setQueryError('Erreur d\'initialisation SQLite : ' + (err.message || String(err)));
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadTableData = (sqliteDb: any, tableName: string) => {
    try {
      const res = executeSqliteQuery(sqliteDb, `SELECT * FROM ${tableName} ORDER BY ROWID DESC LIMIT 100;`);
      setQueryResult(res);
      setQueryError(null);
    } catch (e: any) {
      setQueryError(e.message || String(e));
    }
  };

  const handleSelectTable = (tblName: string) => {
    setSelectedTable(tblName);
    setTableSearch('');
    if (sqliteDbRef.current) {
      loadTableData(sqliteDbRef.current, tblName);
    }
  };

  const handleExecuteConsoleSQL = () => {
    if (!sqliteDbRef.current || !queryInput.trim()) return;
    try {
      const res = executeSqliteQuery(sqliteDbRef.current, queryInput);
      setQueryResult(res);
      setQueryError(null);

      // If statement was an INSERT, UPDATE, or DELETE, sync back to App state
      const upper = queryInput.trim().toUpperCase();
      if (upper.startsWith('INSERT') || upper.startsWith('UPDATE') || upper.startsWith('DELETE') || upper.startsWith('DROP')) {
        syncSqliteToAppState();
        setStatusMessage({
          type: 'success',
          text: `Requête SQL exécutée avec succès (${res.executionTimeMs} ms). Données synchronisées avec l'application.`,
        });
      }
    } catch (e: any) {
      setQueryError('Erreur SQL : ' + (e.message || String(e)));
      setQueryResult(null);
    }
  };

  const syncSqliteToAppState = async () => {
    if (!sqliteDbRef.current) return;
    try {
      const updatedAppDb = readAppDatabaseFromSqlite(sqliteDbRef.current);
      onUpdateDb(updatedAppDb);
      const binary = exportSqliteFromDatabase(sqliteDbRef.current);
      await saveSqliteToIndexedDB(binary);
    } catch (e) {
      console.error('Failed syncing SQLite to App state:', e);
    }
  };

  const syncAppStateToSqlite = async () => {
    if (!sqliteDbRef.current) return;
    try {
      populateSqliteFromAppDatabase(sqliteDbRef.current, db);
      const binary = exportSqliteFromDatabase(sqliteDbRef.current);
      await saveSqliteToIndexedDB(binary);
      loadTableData(sqliteDbRef.current, selectedTable);
      setStatusMessage({
        type: 'success',
        text: 'Synchronisation bidirectionnelle réussie : Base SQLite locale actualisée.',
      });
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erreur de synchronisation : ' + e.message,
      });
    }
  };

  // Row Edit Handlers
  const handleOpenEditRow = (rowValues: any[], columns: string[]) => {
    const rowObj: Record<string, any> = {};
    columns.forEach((col, idx) => {
      rowObj[col] = rowValues[idx];
    });
    setEditingRow(rowObj);
    setIsNewRow(false);
    setIsRowEditModalOpen(true);
  };

  const handleOpenAddRow = () => {
    if (!queryResult || queryResult.columns.length === 0) return;
    const rowObj: Record<string, any> = {};
    queryResult.columns.forEach((col) => {
      rowObj[col] = col === 'id' ? `${selectedTable.substring(0, 3)}-${Date.now()}` : '';
    });
    setEditingRow(rowObj);
    setIsNewRow(true);
    setIsRowEditModalOpen(true);
  };

  const handleSaveRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqliteDbRef.current || !editingRow || !queryResult) return;

    try {
      if (isNewRow) {
        const cols = Object.keys(editingRow);
        const placeholders = cols.map(() => '?').join(', ');
        const vals = cols.map((c) => editingRow[c]);
        const sql = `INSERT INTO ${selectedTable} (${cols.join(', ')}) VALUES (${placeholders});`;
        sqliteDbRef.current.run(sql, vals);
      } else {
        const idCol = queryResult.columns[0];
        const idVal = editingRow[idCol];
        const setCols = Object.keys(editingRow).filter((c) => c !== idCol);
        const setStatements = setCols.map((c) => `${c} = ?`).join(', ');
        const vals = [...setCols.map((c) => editingRow[c]), idVal];
        const sql = `UPDATE ${selectedTable} SET ${setStatements} WHERE ${idCol} = ?;`;
        sqliteDbRef.current.run(sql, vals);
      }

      syncSqliteToAppState();
      loadTableData(sqliteDbRef.current, selectedTable);
      setIsRowEditModalOpen(false);
      setStatusMessage({
        type: 'success',
        text: `Enregistrement ${isNewRow ? 'inséré' : 'mis à jour'} avec succès dans la table SQLite ${selectedTable} !`,
      });
    } catch (err: any) {
      alert('Erreur lors de la mise à jour SQLite : ' + err.message);
    }
  };

  const handleDeleteRow = (idVal: any) => {
    if (!sqliteDbRef.current || !queryResult) return;
    const idCol = queryResult.columns[0];
    if (confirm(`Confirmez-vous la suppression de l'enregistrement (${idCol} = ${idVal}) dans la table SQLite ${selectedTable} ?`)) {
      try {
        sqliteDbRef.current.run(`DELETE FROM ${selectedTable} WHERE ${idCol} = ?;`, [idVal]);
        syncSqliteToAppState();
        loadTableData(sqliteDbRef.current, selectedTable);
        setStatusMessage({
          type: 'success',
          text: `Enregistrement supprimé de la table SQLite ${selectedTable}.`,
        });
      } catch (err: any) {
        alert('Erreur de suppression : ' + err.message);
      }
    }
  };

  // Download true SQLite binary file (.sqlite / .db)
  const handleDownloadSqliteFile = () => {
    if (!sqliteDbRef.current) return;
    const binary = exportSqliteFromDatabase(sqliteDbRef.current);
    const blob = new Blob([binary.buffer as ArrayBuffer], { type: 'application/x-sqlite3' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edugest_database_${db.school.code || 'local'}.sqlite`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Download SQL script dump (.sql)
  const handleDownloadSqlDump = () => {
    if (!sqliteDbRef.current) return;
    const sqlScript = generateSqlDumpScript(sqliteDbRef.current);
    const blob = new Blob([sqlScript], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edugest_database_dump_${db.school.code || 'local'}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import SQLite file (.sqlite / .db / .sql)
  const handleImportSqliteFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      if (file.name.endsWith('.sql')) {
        reader.onload = (event) => {
          const sqlContent = event.target?.result as string;
          if (sqliteDbRef.current) {
            sqliteDbRef.current.run(sqlContent);
            syncSqliteToAppState();
            loadTableData(sqliteDbRef.current, selectedTable);
            setStatusMessage({
              type: 'success',
              text: 'Script SQL importé et exécuté avec succès dans la base SQLite locale !',
            });
          }
        };
        reader.readAsText(file);
      } else {
        reader.onload = async (event) => {
          const buffer = event.target?.result as ArrayBuffer;
          const u8 = new Uint8Array(buffer);
          const engine = await import('sql.js');
          const sqlJsStatic = await engine.default({ locateFile: (f) => `/${f}` });
          const newDb = new sqlJsStatic.Database(u8);
          sqliteDbRef.current = newDb;
          await saveSqliteToIndexedDB(u8);
          syncSqliteToAppState();
          loadTableData(newDb, selectedTable);
          setStatusMessage({
            type: 'success',
            text: 'Fichier binaire SQLite (.sqlite / .db) importé et monté avec succès !',
          });
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Erreur lors de l\'importation SQLite : ' + err.message,
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs">
              <Database className="h-3.5 w-3.5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
              Base de Données Locale SQLite & Navigateur
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Moteur SQLite embarqué (WASM) & persistance IndexedDB sans internet (Windows PC, Android & Navigateur)
          </p>
        </div>

        {/* Action quick buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={syncAppStateToSqlite}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
            title="Synchroniser l'état actuel de l'ERP avec SQLite"
          >
            <RefreshCw className="h-3.5 w-3.5 text-blue-700" />
            <span>Synchroniser</span>
          </button>
          <button
            onClick={handleDownloadSqliteFile}
            className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            title="Télécharger la base sous format natif .sqlite"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Télécharger .SQLITE</span>
          </button>
          <button
            onClick={handleDownloadSqlDump}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
            title="Télécharger le script SQL d'export"
          >
            <FileCode className="h-3.5 w-3.5 text-amber-300" />
            <span>Script .SQL</span>
          </button>
        </div>
      </div>

      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('TABLE_EXPLORER')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'TABLE_EXPLORER' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Table className="h-3.5 w-3.5" />
          <span>Explorateur & Éditeur de Tables</span>
        </button>
        <button
          onClick={() => setActiveTab('SQL_CONSOLE')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SQL_CONSOLE' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Terminal className="h-3.5 w-3.5 text-blue-600" />
          <span>Console de Requêtes SQL</span>
        </button>
        <button
          onClick={() => setActiveTab('SCHEMA')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'SCHEMA' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-purple-600" />
          <span>Schéma & Architecture Tables</span>
        </button>
        <button
          onClick={() => setActiveTab('BACKUP_SYNC')}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'BACKUP_SYNC' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
          <span>Persistance Locale (IndexedDB & Windows)</span>
        </button>
      </div>

      {/* TAB 1: TABLE EXPLORER & DATA EDITOR */}
      {activeTab === 'TABLE_EXPLORER' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left Table Selector */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tables SQLite ({TABLE_DEFINITIONS.length})
            </h3>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {TABLE_DEFINITIONS.map((tbl) => {
                const isSelected = selectedTable === tbl.name;
                return (
                  <button
                    key={tbl.name}
                    onClick={() => handleSelectTable(tbl.name)}
                    className={`w-full text-left rounded-xl px-3 py-2 text-xs transition cursor-pointer flex flex-col ${
                      isSelected
                        ? 'bg-blue-800 text-white font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="font-mono text-xs">{tbl.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {tbl.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Table Grid & Data Editor */}
          <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              {/* Table Toolbar */}
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md">
                    {selectedTable}
                  </span>
                  <span className="text-xs text-slate-500">
                    {queryResult ? `${queryResult.rowCount} enregistrements affichés` : 'Chargement...'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Filtrer les lignes..."
                      className="rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
                    />
                  </div>

                  <button
                    onClick={handleOpenAddRow}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Ajouter une ligne</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto max-h-[500px]">
                {queryResult && queryResult.columns.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">Actions</th>
                        {queryResult.columns.map((col) => (
                          <th key={col} className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {queryResult.values
                        .filter((row) => {
                          if (!tableSearch) return true;
                          return row.some((val) =>
                            String(val).toLowerCase().includes(tableSearch.toLowerCase())
                          );
                        })
                        .map((row, rowIdx) => {
                          const idVal = row[0]; // first column is usually primary key
                          return (
                            <tr key={rowIdx} className="hover:bg-slate-50 transition">
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditRow(row, queryResult.columns)}
                                    title="Éditer cette ligne"
                                    className="p-1 rounded-md text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRow(idVal)}
                                    title="Supprimer cette ligne"
                                    className="p-1 rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className="py-2 px-3 text-slate-800 whitespace-nowrap max-w-xs truncate font-mono text-[11px]"
                                >
                                  {cell === null || cell === undefined ? (
                                    <span className="text-slate-300 italic">NULL</span>
                                  ) : (
                                    String(cell)
                                  )}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    Aucun enregistrement dans la table sélectionnée.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom table info footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                Table active : <strong>{selectedTable}</strong> • Requête interne : <code>SELECT * FROM {selectedTable}</code>
              </span>
              <span>
                Temps d'exécution SQLite WASM : <strong>{queryResult?.executionTimeMs || 0} ms</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SQL QUERY CONSOLE */}
      {activeTab === 'SQL_CONSOLE' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-blue-700" />
                <span>Console SQL Interactive (Requêtes SELECT, UPDATE, INSERT, PRAGMA)</span>
              </label>

              {/* Sample Queries Dropdown */}
              <select
                onChange={(e) => setQueryInput(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 font-semibold cursor-pointer"
              >
                <option value="">-- Exemples de requêtes rapides --</option>
                <option value="SELECT * FROM eleves WHERE sexe = 'F';">Élèves filles (sexe = 'F')</option>
                <option value="SELECT classe_id, count(*) as total FROM inscriptions GROUP BY classe_id;">Effectifs par classe</option>
                <option value="SELECT sum(montant_paye) as total_encaisse, mode_paiement FROM paiements GROUP BY mode_paiement;">Recettes par mode de paiement</option>
                <option value="SELECT * FROM notes WHERE note < 20;">Notes sous la moyenne (&lt; 20)</option>
                <option value="PRAGMA table_info(eleves);">Structure de la table eleves (PRAGMA)</option>
              </select>
            </div>

            <textarea
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              rows={4}
              placeholder="Saisissez votre code SQL ici (ex: SELECT * FROM eleves;)"
              className="w-full rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 font-mono text-xs p-3 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Supporte la syntaxe standard SQLite 3 complète.
              </span>
              <button
                onClick={handleExecuteConsoleSQL}
                className="flex items-center gap-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 px-5 py-2 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Exécuter la requête SQL</span>
              </button>
            </div>
          </div>

          {/* Results Area */}
          {queryError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
              <strong>{queryError}</strong>
            </div>
          )}

          {queryResult && (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">
                  Résultats : <strong>{queryResult.rowCount} ligne(s) retournée(s)</strong>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Exécuté en {queryResult.executionTimeMs} ms
                </span>
              </div>

              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 font-bold border-b border-slate-200 text-slate-700">
                    <tr>
                      {queryResult.columns.map((c) => (
                        <th key={c} className="py-2 px-3 whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queryResult.values.map((r, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {r.map((val, cIdx) => (
                          <td key={cIdx} className="py-1.5 px-3 whitespace-nowrap text-slate-800 text-[11px]">
                            {val === null ? <span className="text-slate-300">NULL</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SCHEMA & ARCHITECTURE */}
      {activeTab === 'SCHEMA' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TABLE_DEFINITIONS.map((tbl) => (
            <div key={tbl.name} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                  {tbl.name}
                </span>
                <span className="text-[10px] text-slate-400">TABLE</span>
              </div>
              <h4 className="text-xs font-bold text-slate-800">{tbl.label}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{tbl.description}</p>
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedTable(tbl.name);
                    setActiveTab('TABLE_EXPLORER');
                    if (sqliteDbRef.current) loadTableData(sqliteDbRef.current, tbl.name);
                  }}
                  className="text-xs font-bold text-blue-700 hover:text-blue-900 cursor-pointer"
                >
                  Ouvrir & Éditer la table &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: PERSISTENCE & SYNC */}
      {activeTab === 'BACKUP_SYNC' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Native .SQLITE Download */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Fichier Binaire Natif SQLite (.sqlite / .db)</h4>
                  <p className="text-xs text-slate-500">Pour PC Windows, SQLiteStudio, DB Browser</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Ce fichier est une véritable base de données SQLite 3 conforme. Vous pouvez l'ouvrir avec n'importe quel logiciel SQLite pour Windows, Mac, Linux ou intégrer dans vos scripts Python, C# ou PHP.
              </p>

              <button
                onClick={handleDownloadSqliteFile}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Télécharger la Base Complète (.sqlite)</span>
              </button>
            </div>

            {/* Import .SQLITE / .SQL */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Importer une Base SQLite ou Script (.sql)</h4>
                  <p className="text-xs text-slate-500">Restauration directe dans le moteur local</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Chargez un fichier <code>.sqlite</code>, <code>.db</code> ou un script de requêtes <code>.sql</code> pour injecter directement vos données dans le stockage local du navigateur ou de l'application Windows.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".sqlite,.db,.sql"
                onChange={handleImportSqliteFile}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 hover:bg-purple-800 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                <span>Sélectionner le fichier SQLite ou SQL</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-900">ℹ️ Architecture de Stockage Hybride Hors-Ligne :</h4>
            <p>
              • <strong>Sur PC sous Windows :</strong> Le moteur SQLite WASM fonctionne de concert avec le cache local et peut exporter à tout moment le fichier <code>edugest.sqlite</code> pour archivage physique ou utilisation dans des applications desktop.
            </p>
            <p>
              • <strong>Sur Android & Navigateur Mobile :</strong> Les données sont persistées de manière permanente dans la base <strong>IndexedDB</strong> locale du navigateur (<code>EduGestLocalDB</code>), permettant une disponibilité instantanée sans connexion Internet.
            </p>
          </div>
        </div>
      )}

      {/* Row Edit Modal */}
      {isRowEditModalOpen && editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {isNewRow ? `Insérer une ligne dans ${selectedTable}` : `Modifier l'enregistrement (${selectedTable})`}
              </h3>
              <button
                onClick={() => setIsRowEditModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRow} className="mt-4 space-y-3 text-xs">
              {Object.keys(editingRow).map((col, idx) => (
                <div key={col}>
                  <label className="block font-mono text-[11px] font-bold text-slate-700 mb-1">
                    {col} {idx === 0 && <span className="text-blue-700">(PRIMARY KEY)</span>}
                  </label>
                  <input
                    type="text"
                    value={editingRow[col] !== null && editingRow[col] !== undefined ? editingRow[col] : ''}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        [col]: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
              ))}

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRowEditModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 shadow-xs cursor-pointer"
                >
                  Enregistrer dans SQLite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
