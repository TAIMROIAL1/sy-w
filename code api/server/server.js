// server/server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { dirname } from 'path';


const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_PATH = path.join(__dirname, "db.json");
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ codes: [] }, null, 2));
}

function loadDB() {
  return JSON.parse(fs.readFileSync(DB_PATH));
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

import { customAlphabet } from "nanoid";
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const nano = customAlphabet(alphabet, 10);

app.post("/api/codes/create", (req, res) => {
  const { codes } = req.body;
  if (!Array.isArray(codes)) return res.status(400).json({ error: "Invalid payload" });

  const db = loadDB();
  let added = 0;
  codes.forEach(c => {
    if (!db.codes.find(x => x.code === c.code)) {
      db.codes.push(c);
      added++;
    }
  });
  saveDB(db);
  res.json({ success: true, added });
});

app.get("/api/codes", (req, res) => {
  const db = loadDB();
  res.json(db.codes);
});

app.get("/api/codes/:category", (req, res) => {
  const db = loadDB();
  const cat = req.params.category;
  const filtered = db.codes.filter(c => c.category === cat);
  res.json(filtered);
});

app.post("/api/codes/sync/:category", (req, res) => {
  const cat = req.params.category;
  const { codes } = req.body;
  if (!Array.isArray(codes)) return res.status(400).json({ error: "Invalid payload" });

  const db = loadDB();
  db.codes = db.codes.filter(c => c.category !== cat);
  db.codes.push(...codes);
  saveDB(db);
  res.json({ success: true, count: codes.length });
});

app.put("/api/codes/use/:code", (req, res) => {
  const codeParam = req.params.code;
  const db = loadDB();
  const code = db.codes.find(c => c.code === codeParam);
  if (!code) return res.status(404).json({ error: "Code not found" });
  code.active = false;
  saveDB(db);
  res.json({ success: true, code });
});

app.delete("/api/codes/:code", (req, res) => {
  const codeParam = req.params.code;
  const db = loadDB();
  const before = db.codes.length;
  db.codes = db.codes.filter(c => c.code !== codeParam);
  saveDB(db);
  res.json({ success: true, removed: before - db.codes.length });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
