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

let memoryState = { ...DEFAULT_STATE };

function ensureState() {
  const dir = path.dirname(STATE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf-8');
  }
}

function loadFromDisk() {
  try {
    ensureState();
    return { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function readState() {
  return { ...memoryState };
}

function writeState(changes) {
  memoryState = { ...memoryState, ...changes };
  try {
    ensureState();
    fs.writeFileSync(STATE_PATH, JSON.stringify(memoryState, null, 2), 'utf-8');
  } catch {
    // Render pode falhar ao gravar disco; memória basta para heartbeat
  }
  return { ...memoryState };
}

function bridgeOnline(state = readState()) {
  if (!state.ultimo_heartbeat) return false;
  return Date.now() - new Date(state.ultimo_heartbeat).getTime() < 35000;
}

memoryState = loadFromDisk();

module.exports = { readState, writeState, bridgeOnline, DEFAULT_STATE };
