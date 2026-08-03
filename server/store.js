const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'requisicoes.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, '[]', 'utf-8');
}

function readAll() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeAll(data) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function findAll(filters = {}) {
  let rows = readAll();

  if (filters.status) rows = rows.filter(r => r.status === filters.status);
  if (filters.tipo) rows = rows.filter(r => r.tipo === filters.tipo);
  if (filters.cliente_id) rows = rows.filter(r => r.cliente_id === filters.cliente_id);

  return rows.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
}

function findById(id) {
  return readAll().find(r => r.id === id) || null;
}

function insert(record) {
  const rows = readAll();
  rows.push(record);
  writeAll(rows);
  return record;
}

function update(id, changes) {
  const rows = readAll();
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;

  rows[idx] = { ...rows[idx], ...changes, atualizado_em: new Date().toISOString() };
  writeAll(rows);
  return rows[idx];
}

function remove(id) {
  const rows = readAll();
  const filtered = rows.filter(r => r.id !== id);
  if (filtered.length === rows.length) return false;
  writeAll(filtered);
  return true;
}

module.exports = { findAll, findById, insert, update, remove };
