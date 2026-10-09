const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');

const APP_ID = 'cd.edumaster.school';
let db;
let dbPath;

function persistDatabase() {
  if (!db || !dbPath) return;
  const tempPath = dbPath + '.tmp';
  fs.writeFileSync(tempPath, Buffer.from(db.export()));
  fs.renameSync(tempPath, dbPath);
}

async function openDatabase() {
  const wasmPath = app.isPackaged
    ? path.join(process.resourcesPath, 'sql-wasm.wasm')
    : path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
  const SQL = await initSqlJs({ locateFile: () => wasmPath });
  const dataDir = path.join(app.getPath('userData'), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  dbPath = path.join(dataDir, 'edumaster.sqlite');
  db = fs.existsSync(dbPath)
    ? new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)))
    : new SQL.Database();
  db.run('CREATE TABLE IF NOT EXISTS app_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL, updated_at TEXT NOT NULL)');
  persistDatabase();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'EduMaster 2.0',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  if (app.isPackaged) win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  else win.loadURL('http://127.0.0.1:3000');
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

ipcMain.handle('edumaster:db-load', () => {
  const result = db.exec('SELECT payload FROM app_state WHERE id = 1');
  if (!result.length || !result[0].values.length) return null;
  return JSON.parse(String(result[0].values[0][0]));
});

ipcMain.handle('edumaster:db-save', (_event, state) => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('Données de base invalides.');
  }
  db.run('BEGIN IMMEDIATE');
  try {
    const stmt = db.prepare('INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at');
    stmt.run([JSON.stringify(state), new Date().toISOString()]);
    stmt.free();
    db.run('COMMIT');
    persistDatabase();
    return { saved: true, path: dbPath };
  } catch (error) {
    db.run('ROLLBACK');
    throw error;
  }
});

ipcMain.handle('edumaster:db-location', () => dbPath);

app.whenReady().then(async () => {
  app.setAppUserModelId(APP_ID);
  await openDatabase();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((error) => {
  console.error('Impossible de démarrer EduMaster :', error);
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
