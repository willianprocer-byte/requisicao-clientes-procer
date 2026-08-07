const express = require('express');
const { readState, writeState, bridgeOnline } = require('../automacao-state');

const router = express.Router();

router.get('/status', (_req, res) => {
  const state = readState();
  res.json({
    bridge_online: bridgeOnline(state),
    processando: state.processando,
    solicitar_processamento: state.solicitar_processamento,
    solicitado_em: state.solicitado_em,
    auto_processar_ativo: state.auto_processar_ativo !== false,
    ultima_execucao: state.ultima_execucao,
    ultimo_resultado: state.ultimo_resultado,
    ultimo_heartbeat: state.ultimo_heartbeat
  });
});

router.post('/solicitar', (req, res) => {
  const { id } = req.body || {};
  const state = writeState({
    solicitar_processamento: true,
    processar_id: id || null,
    solicitado_em: new Date().toISOString()
  });
  res.json({
    ok: true,
    mensagem: bridgeOnline(state)
      ? 'Processamento solicitado. A automação local vai iniciar em instantes.'
      : 'Solicitação registrada. Ative a automação local (3-ATIVAR-AUTOMACAO.bat) para processar.',
    bridge_online: bridgeOnline(state)
  });
});

router.get('/fila', (_req, res) => {
  const state = readState();
  res.json({
    solicitar: state.solicitar_processamento,
    processar_id: state.processar_id,
    solicitado_em: state.solicitado_em,
    processando: state.processando
  });
});

router.post('/heartbeat', (_req, res) => {
  const state = writeState({ ultimo_heartbeat: new Date().toISOString() });
  res.json({
    solicitar: state.solicitar_processamento,
    processar_id: state.processar_id,
    processando: state.processando
  });
});

router.post('/iniciar', (_req, res) => {
  writeState({
    processando: true,
    solicitar_processamento: false,
    ultima_execucao: new Date().toISOString()
  });
  res.json({ ok: true });
});

router.post('/finalizar', (req, res) => {
  const { sucesso, mensagem, processados, erros } = req.body || {};
  writeState({
    processando: false,
    solicitar_processamento: false,
    processar_id: null,
    ultimo_resultado: {
      sucesso: sucesso !== false,
      mensagem: mensagem || null,
      processados: processados || 0,
      erros: erros || 0,
      em: new Date().toISOString()
    }
  });
  res.json({ ok: true });
});

router.post('/auto', (req, res) => {
  const ativo = req.body?.ativo !== false;
  const state = writeState({ auto_processar_ativo: ativo });
  res.json({
    ok: true,
    auto_processar_ativo: state.auto_processar_ativo !== false
  });
});

module.exports = router;
