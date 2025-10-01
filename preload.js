const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
   // print: (options) => ipcRenderer.invoke('print', options),
    //printToPDF: (options) => ipcRenderer.invoke('print-to-pdf', options),
    //onProtocolUrl: (callback) => ipcRenderer.on('protocol-url', (event, url) => callback(url))
});
// 日志
console.log('Preload script loaded');
