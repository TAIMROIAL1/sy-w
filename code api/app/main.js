// app/main.js
const { app, BrowserWindow } = require("electron");
const path = require("path");
const { fork } = require("child_process");

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 760,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  // start sync process in background
  try {
    fork(path.join(__dirname, "sync.js"));
  } catch(e) {}
  createWindow();
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
