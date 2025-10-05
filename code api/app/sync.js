// app/sync.js
const fs = require("fs");
const path = require("path");
const chokidar = require("chokidar");
const XLSX = require("xlsx");
const axios = require("axios");

const CONFIG_PATH = path.join(__dirname, "config.json");
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    const defaultConfig = { apiUrl: "http://localhost:3000", excelsDir: path.join(__dirname, "excels") };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH));
}
const cfg = loadConfig();
const EXCELS_DIR = cfg.excelsDir;

if (!fs.existsSync(EXCELS_DIR)) fs.mkdirSync(EXCELS_DIR, { recursive: true });

function readExcelFile(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const arr = XLSX.utils.sheet_to_json(sheet);
  return arr.map(r => ({
    code: r.Code || r.code,
    value: r.Value || r.value || "",
    category: r.Category || r.category || path.basename(filePath, path.extname(filePath)),
    active: (typeof r.Active !== "undefined") ? r.Active : ((typeof r.active !== "undefined") ? r.active : true),
    dateCreated: r.DateCreated || r.dateCreated || new Date().toISOString()
  })).filter(x => x.code);
}

async function syncFileToServer(filePath) {
  try {
    const data = readExcelFile(filePath);
    const category = path.basename(filePath, path.extname(filePath));
    await axios.post(cfg.apiUrl + `/api/codes/sync/${category}`, { codes: data });
    console.log(`✅ Synced ${filePath} -> server`);
  } catch (err) {
    console.error("Sync error:", err.message || err);
  }
}

const watcher = chokidar.watch(EXCELS_DIR, { persistent: true, ignoreInitial: false });

watcher.on("add", filePath => {
  console.log("File added:", filePath);
  syncFileToServer(filePath);
});
watcher.on("change", filePath => {
  console.log("File changed:", filePath);
  syncFileToServer(filePath);
});
watcher.on("unlink", filePath => {
  console.log("File removed:", filePath);
});

setInterval(async () => {
  try {
    const res = await axios.get(cfg.apiUrl + "/api/codes");
    const codes = res.data;
    const groups = {};
    codes.forEach(c => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    for (const [cat, arr] of Object.entries(groups)) {
      const ws = XLSX.utils.json_to_sheet(arr.map(x => ({
        Code: x.code,
        Value: x.value,
        Category: x.category,
        Active: x.active,
        DateCreated: x.dateCreated
      })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Codes");
      const filePath = path.join(EXCELS_DIR, cat + ".xlsx");
      XLSX.writeFile(wb, filePath);
    }
  } catch (err) {}
}, 60 * 1000);

console.log("Excel sync running. Watching:", EXCELS_DIR);
