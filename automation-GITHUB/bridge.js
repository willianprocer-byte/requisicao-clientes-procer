function loadConfig() {
  return require('./config.json');
}

async function apiCall(config, path, method = 'GET', body) {
  const url = `${config.api_url}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.api_key
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${method} ${path} → HTTP ${res.status}${text ? `: ${text.slice(0, 120)}` : ''}`);
  }

  return res.json().catch(() => ({}));
}

async function testarConexao(config) {
  console.log(`Testando conexão com ${config.api_url} ...`);
  await apiCall(config, '/api/health');
  await apiCall(config, '/api/automacao/heartbeat', 'POST');
  const status = await apiCall(config, '/api/automacao/status');
  console.log(`✓ Conexão OK — bridge_online: ${status.bridge_online}`);
  return status;
}

async function loop() {
  const config = loadConfig();
  const intervalo = config.bridge?.intervalo_ms || 3000;
  let ultimoLogOk = 0;

  console.log('');
  console.log('========================================');
  console.log('  AUTOMAÇÃO PROCER — ATIVA');
  console.log('========================================');
  console.log(`API: ${config.api_url}`);
  console.log('Deixe esta janela ABERTA.');
  console.log('No site Render, deve aparecer "Automação ativa".');
  console.log('Pressione Ctrl+C para encerrar.');
  console.log('');

  try {
    await testarConexao(config);
  } catch (err) {
    console.error('');
    console.error('[ERRO] Não conectou ao Render:');
    console.error(' ', err.message);
    console.error('');
    console.error('Verifique:');
    console.error('  1. Internet funcionando');
    console.error('  2. api_url em config.json:', config.api_url);
    console.error('  3. Site no ar:', config.api_url.replace(/\/$/, ''));
    console.error('');
    process.exit(1);
  }

  console.log('');
  console.log('Aguardando clique em "Processar" no painel...\n');

  while (true) {
    try {
      const heartbeat = await apiCall(config, '/api/automacao/heartbeat', 'POST');
      const agora = Date.now();
      if (agora - ultimoLogOk > 30000) {
        console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ✓ Online no Render`);
        ultimoLogOk = agora;
      }

      if (heartbeat.solicitar && !heartbeat.processando) {
        console.log('→ Processamento solicitado pelo painel');
        await apiCall(config, '/api/automacao/iniciar', 'POST');

        try {
          const { executar } = require('./procer');
          const result = await executar({ idFiltro: heartbeat.processar_id || null });
          await apiCall(config, '/api/automacao/finalizar', 'POST', {
            sucesso: result.erros === 0,
            mensagem: result.processados
              ? `${result.processados} requisição(ões) processada(s)`
              : 'Nenhuma requisição pendente de amostragem',
            processados: result.processados,
            erros: result.erros
          });
          console.log('✓ Processamento finalizado\n');
        } catch (err) {
          await apiCall(config, '/api/automacao/finalizar', 'POST', {
            sucesso: false,
            mensagem: err.message,
            processados: 0,
            erros: 1
          });
          console.error('✗ Erro no processamento:', err.message, '\n');
        }
      }
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString('pt-BR')}] Bridge erro:`, err.message);
    }

    await sleep(intervalo);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

loop().catch(err => {
  console.error(err.message);
  process.exit(1);
});
