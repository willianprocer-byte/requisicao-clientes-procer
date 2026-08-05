const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const requisicoesRouter = require('./routes/requisicoes');
const automacaoRouter = require('./routes/automacao');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || 'procer-api-key-2026';

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

function authMiddleware(req, res, next) {
  if (req.method === 'GET') return next();

  const key = req.headers['x-api-key'] || req.query.api_key;
  if (key !== API_KEY) {
    return res.status(401).json({ erro: 'API key inválida ou ausente. Envie no header X-API-Key.' });
  }
  next();
}

app.use('/api/requisicoes', authMiddleware, requisicoesRouter);
app.use('/api/automacao', automacaoRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/molde', (_req, res) => {
  const moldePath = path.join(__dirname, '..', 'docs', 'molde-requisicao.json');
  res.sendFile(moldePath);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel de tarefas: http://localhost:${PORT}`);
  console.log(`Molde da API: http://localhost:${PORT}/api/molde`);
});
