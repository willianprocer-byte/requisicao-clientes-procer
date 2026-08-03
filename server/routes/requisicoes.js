const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

const TIPOS_VALIDOS = [
  'atualizar_nivel_silo',
  'atualizar_amostragem',
  'atualizar_produto'
];

const STATUS_VALIDOS = ['pendente', 'em_analise', 'concluida', 'rejeitada'];
const NIVEL_VALIDOS = ['cheio', 'vazio', 'finalizando', 'parcial'];

function temIdentificadorSilo(silo) {
  return silo && (silo.identificador || silo.numero);
}

function validarSilos(silos, erros, label = 'dados.silos') {
  if (!Array.isArray(silos) || silos.length === 0) {
    erros.push(`${label} deve ser um array com pelo menos um silo`);
    return;
  }

  silos.forEach((silo, i) => {
    if (!temIdentificadorSilo(silo)) {
      erros.push(`${label}[${i}]: identificador ou numero é obrigatório`);
    }
  });
}

function validarRequisicao(body) {
  const erros = [];

  if (!body.tipo || !TIPOS_VALIDOS.includes(body.tipo)) {
    erros.push(`tipo deve ser um de: ${TIPOS_VALIDOS.join(', ')}`);
  }
  if (!body.cliente_nome) erros.push('cliente_nome é obrigatório');
  if (!body.dados || typeof body.dados !== 'object') {
    erros.push('dados é obrigatório e deve ser um objeto');
  }

  if (!body.dados) return erros;

  switch (body.tipo) {
    case 'atualizar_nivel_silo':
      validarSilos(body.dados.silos, erros);
      body.dados.silos?.forEach((silo, i) => {
        if (!silo.nivel) {
          erros.push(`dados.silos[${i}].nivel é obrigatório (cheio, vazio, finalizando, parcial)`);
        } else if (!NIVEL_VALIDOS.includes(silo.nivel)) {
          erros.push(`dados.silos[${i}].nivel deve ser um de: ${NIVEL_VALIDOS.join(', ')}`);
        }
      });
      break;

    case 'atualizar_amostragem':
      validarSilos(body.dados.silos, erros);
      body.dados.silos?.forEach((silo, i) => {
        const am = silo.amostragem;
        if (!am || (am.umd == null && am.imp == null && am.avr == null)) {
          erros.push(`dados.silos[${i}].amostragem deve ter pelo menos umd, imp ou avr`);
        }
      });
      if (body.dados.outros_silos) {
        validarSilos(body.dados.outros_silos, erros, 'dados.outros_silos');
      }
      break;

    case 'atualizar_produto':
      validarSilos(body.dados.silos, erros);
      body.dados.silos?.forEach((silo, i) => {
        if (!silo.produto) {
          erros.push(`dados.silos[${i}].produto é obrigatório (SOJA, MILHO, etc.)`);
        }
      });
      break;
  }

  return erros;
}

router.get('/', (req, res) => {
  const rows = store.findAll({
    status: req.query.status,
    tipo: req.query.tipo,
    cliente_id: req.query.cliente_id
  });
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = store.findById(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Requisição não encontrada' });
  res.json(row);
});

router.post('/', (req, res) => {
  const erros = validarRequisicao(req.body);
  if (erros.length > 0) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });
  }

  const agora = new Date().toISOString();
  const { tipo, cliente_id, cliente_nome, solicitante, contato, regiao, descricao, dados, origem } = req.body;

  const requisicao = store.insert({
    id: uuidv4(),
    tipo,
    status: 'pendente',
    cliente_id: cliente_id || null,
    cliente_nome,
    solicitante: solicitante || null,
    contato: contato || null,
    regiao: regiao || null,
    descricao: descricao || null,
    dados,
    origem: origem || 'agente_ia',
    observacoes_internas: null,
    criado_em: agora,
    atualizado_em: agora
  });

  res.status(201).json(requisicao);
});

router.patch('/:id', (req, res) => {
  const row = store.findById(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Requisição não encontrada' });

  const { status, observacoes_internas } = req.body;

  if (status && !STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: `status deve ser um de: ${STATUS_VALIDOS.join(', ')}` });
  }

  const changes = {};
  if (status) changes.status = status;
  if (observacoes_internas !== undefined) changes.observacoes_internas = observacoes_internas;

  const atualizada = store.update(req.params.id, changes);
  res.json(atualizada);
});

router.delete('/:id', (req, res) => {
  const removed = store.remove(req.params.id);
  if (!removed) return res.status(404).json({ erro: 'Requisição não encontrada' });
  res.status(204).send();
});

module.exports = router;
