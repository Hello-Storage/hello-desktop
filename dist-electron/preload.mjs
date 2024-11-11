"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  },
  // You can expose other APis you need here.
  // ...
  getAvailableStorage: async () => electron.ipcRenderer.invoke("get-available-storage"),
  setOfferedStorage: async (storage) => electron.ipcRenderer.invoke("set-offered-storage", storage),
  openOfferedStorage: () => electron.ipcRenderer.invoke("open-offered-storage"),
  openExternal: (url) => electron.ipcRenderer.invoke("open-external", url),
  onAlertTitle: (callback) => {
    electron.ipcRenderer.on("alert-title", (_, title) => callback(title));
  },
  fetchData: () => electron.ipcRenderer.invoke("fetch-data"),
  startMining: (challenge) => electron.ipcRenderer.invoke("start-mining", challenge),
  stopMining: () => electron.ipcRenderer.invoke("stop-mining")
});
