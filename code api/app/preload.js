// app/preload.js
const { contextBridge } = require("electron");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const XLSX = require("xlsx");

const CONFIG_PATH = path.join(__dirname, "config.json");

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = { apiUrl: "http://localhost:3000", excelsDir: path.join(__dirname, "excels") };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH));
}
function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2));
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

contextBridge.exposeInMainWorld("electronAPI", {
  getConfig: () => loadConfig(),
  setConfig: (cfg) => saveConfig(cfg),
  axiosPost: async (url, body) => {
    const cfg = loadConfig();
    return axios.post(cfg.apiUrl + url, body).then(r => r.data);
  },
  axiosGet: async (url) => {
    const cfg = loadConfig();
    return axios.get(cfg.apiUrl + url).then(r => r.data);
  },
  axiosPut: async (url, body) => {
    const cfg = loadConfig();
    return axios.put(cfg.apiUrl + url, body).then(r => r.data);
  },
  axiosDelete: async (url) => {
    const cfg = loadConfig();
    return axios.delete(cfg.apiUrl + url).then(r => r.data);
  },
  // new: save codes to Excel immediately (local save)
  saveExcel: (category, codes) => {
    const cfg = loadConfig();
    const dir = cfg.excelsDir || path.join(__dirname, "excels");
    ensureDir(dir);
    const filePath = path.join(dir, category + ".xlsx");
    // prepare rows
    const rows = codes.map(x => ({
      Code: x.code,
      Value: x.value,
      Category: x.category,
      Active: x.active,
      DateCreated: x.dateCreated
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Codes");
    XLSX.writeFile(wb, filePath);
    return { ok: true, filePath };
  }
});
