const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eduMasterDesktop', Object.freeze({
  loadDatabase: () => ipcRenderer.invoke('edumaster:db-load'),
  saveDatabase: (state) => ipcRenderer.invoke('edumaster:db-save', state),
  getDatabaseLocation: () => ipcRenderer.invoke('edumaster:db-location')
}));
