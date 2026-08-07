const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

const TIPOS_VALIDOS = [
  'atualizar_nivel_silo',
  'atualizar_amostragem',
  'atualizar_produto'
];

const STATUS_VALIDOS = ['pendente', 'em_analise', 'concluida', 'rejeitada', 'erro'];
const NIVEL_VALIDOS = ['cheio', 'vazio', 'finalizando', 'parcial'];

const NIVEL_SINONIMOS = {
  'quase cheio': 'finalizando',
  'quase lotado': 'finalizando',
  'enchendo': 'finalizando',
  'parcialmente cheio': 'parcial',
  'meio cheio': 'parcial',
  'zerado': 'vazio',
  'lotado': 'cheio'
};

function normalizarNivel(nivel) {
  if (nivel == null || nivel === '') return null;
  const s = String(nivel).trim().toLowerCase();
  if (NIVEL_VALIDOS.includes(s)) return s;
  return NIVEL_SINONIMOS[s] || s;
}

function isVariavelNaoSubstituida(valor) {
  return typeof valor === 'string' && /^\$/.test(valor.trim());
}

function parseNumero(valor) {
  if (valor == null || valor === '') return null;
  if (typeof valor === 'number' && !Number.isNaN(valor)) return valor;
  const s = String(valor).trim().replace(',', '.').replace(/%/g, '');
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function normalizarSilo(silo) {
  if (!silo || typeof silo !== 'object') return silo;

  const s = { ...silo };

  if (isVariavelNaoSubstituida(s.identificador)) {
    s.identificador = null;
  }

  if (s.numero != null) s.numero = String(s.numero).trim();
  if (s.identificador != null) s.identificador = String(s.identificador).trim();

  if (s.identificador && /^\d+$/.test(s.identificador) && !s.numero) {
    s.numero = s.identificador;
  }

  if (s.numero && (!s.identificador || /^\d+$/.test(s.identificador))) {
    const prefixo = s.tipo_silo === 'pulmao' ? 'Silo pulmão' : 'Silo';
    s.identificador = `${prefixo} ${s.numero}`;
  }

  if (!s.identificador && !s.numero) {
    s.identificador = 'Silo não informado';
  }

  if (s.produto) s.produto = String(s.produto).toUpperCase();

  if (s.nivel != null) s.nivel = normalizarNivel(s.nivel);

  if (s.umidade_percentual != null) s.umidade_percentual = parseNumero(s.umidade_percentual);
  if (s.umidade_percentual_max != null) s.umidade_percentual_max = parseNumero(s.umidade_percentual_max);

  if (s.amostragem && typeof s.amostragem === 'object') {
    s.amostragem = {
      ...s.amostragem,
      umd: parseNumero(s.amostragem.umd),
      imp: parseNumero(s.amostragem.imp),
      avr: parseNumero(s.amostragem.avr)
    };
  }

  return s;
}

function normalizarDados(dados) {
  if (!dados || typeof dados !== 'object') return dados;

  const normalizado = { ...dados };

  if (Array.isArray(normalizado.silos)) {
    normalizado.silos = normalizado.silos.map(normalizarSilo);
  }
  if (Array.isArray(normalizado.outros_silos)) {
    normalizado.outros_silos = normalizado.outros_silos.map(normalizarSilo);
  }

  return normalizado;
}

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
        if (silo.nivel && !NIVEL_VALIDOS.includes(silo.nivel)) {
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
  const body = { ...req.body };
  if (body.dados) body.dados = normalizarDados(body.dados);

  const erros = validarRequisicao(body);
  if (erros.length > 0) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: erros });
  }

  const agora = new Date().toISOString();
  const { tipo, cliente_id, cliente_nome, solicitante, contato, regiao, descricao, dados, origem } = body;

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
    erro_motivo: null,
    concluida_em: null,
    historico: [{
      status: 'pendente',
      em: agora,
      observacao: 'Requisição recebida'
    }],
    criado_em: agora,
    atualizado_em: agora
  });

  res.status(201).json(requisicao);
});

router.patch('/:id', (req, res) => {
  const row = store.findById(req.params.id);
  if (!row) return res.status(404).json({ erro: 'Requisição não encontrada' });

  const { status, observacoes_internas, erro_motivo } = req.body;

  if (status && !STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: `status deve ser um de: ${STATUS_VALIDOS.join(', ')}` });
  }

  const changes = {};
  if (status) changes.status = status;
  if (observacoes_internas !== undefined) changes.observacoes_internas = observacoes_internas;
  if (erro_motivo !== undefined) changes.erro_motivo = erro_motivo;
  if (status === 'erro' && erro_motivo) changes.observacoes_internas = erro_motivo;

  const atualizada = store.update(req.params.id, changes);
  res.json(atualizada);
});

router.delete('/:id', (req, res) => {
  const removed = store.remove(req.params.id);
  if (!removed) return res.status(404).json({ erro: 'Requisição não encontrada' });
  res.status(204).send();
});

module.exports = router;
