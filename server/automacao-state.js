const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '..', 'data', 'automacao.json');

const DEFAULT_STATE = {
  solicitar_processamento: false,
  processar_id: null,
  solicitado_em: null,
  processando: false,
  ultima_execucao: null,
  ultimo_resultado: null,
  ultimo_heartbeat: null
};

function ensureState() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STATE_PATH)) fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
}

function readState() {
  ensureState();
  return { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')) };
}

function writeState(changes) {
  const current = readState();
  const next = { ...current, ...changes };
  fs.writeFileSync(STATE_PATH, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

function bridgeOnline(state = readState()) {
  if (!state.ultimo_heartbeat) return false;
  return Date.now() - new Date(state.ultimo_heartbeat).getTime() < 35000;
}

module.exports = { readState, writeState, bridgeOnline, DEFAULT_STATE };
