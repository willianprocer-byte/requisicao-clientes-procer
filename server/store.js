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

  const atual = rows[idx];
  const agora = new Date().toISOString();
  const historico = Array.isArray(atual.historico) ? [...atual.historico] : [];

  if (changes.status && changes.status !== atual.status) {
    historico.push({
      status: changes.status,
      em: agora,
      observacao: changes.observacoes_internas || changes.erro_motivo || null
    });
  }

  rows[idx] = {
    ...atual,
    ...changes,
    historico,
    atualizado_em: agora,
    concluida_em: changes.status === 'concluida' ? agora : (changes.concluida_em ?? atual.concluida_em),
    erro_motivo: changes.status === 'erro'
      ? (changes.erro_motivo || changes.observacoes_internas || atual.erro_motivo)
      : (changes.erro_motivo ?? atual.erro_motivo)
  };

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
