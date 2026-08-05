const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function loadConfig() {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Crie automation/config.json a partir de config.example.json');
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function encontrarUnidade(config, clienteNome) {
  return config.unidades.find(u =>
    clienteNome.toLowerCase().includes(u.cliente_nome_contem.toLowerCase())
  );
}

function normalizarTexto(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function extrairNumeroSilo(siloReq) {
  if (siloReq.numero != null && String(siloReq.numero).trim() !== '') {
    return String(siloReq.numero).trim();
  }
  const id = String(siloReq.identificador || '');
  const match = id.match(/\d+/);
  return match ? match[0] : '';
}

function siloCorresponde(labelOpcao, siloReq) {
  const opcao = normalizarTexto(labelOpcao);
  const identificador = normalizarTexto(siloReq.identificador || '');
  const numero = extrairNumeroSilo(siloReq);

  if (identificador && opcao === identificador) return true;

  if (!numero) {
    return identificador.length > 0 && opcao.includes(identificador);
  }

  const numInt = parseInt(numero, 10);
  const pad2 = String(numInt).padStart(2, '0');

  const padroes = [
    new RegExp(`\\bsilo\\s*0*${numInt}(?!\\d)`, 'i'),
    new RegExp(`\\barmazem\\s*0*${numInt}(?!\\d)`, 'i'),
    new RegExp(`\\bcelula\\s*0*${numInt}(?!\\d)`, 'i'),
    new RegExp(`\\bpulmao\\s*0*${numInt}(?!\\d)`, 'i'),
    new RegExp(`^0*${numInt}(?!\\d)$`, 'i'),
  ];

  if (padroes.some(p => p.test(opcao))) return true;

  if (identificador) {
    const idNum = identificador.match(/\d+/);
    if (idNum && parseInt(idNum[0], 10) === numInt && opcao.includes(String(numInt))) {
      return new RegExp(`(?<!\\d)0*${numInt}(?!\\d)`).test(opcao);
    }
  }

  return opcao === `silo ${pad2}` || opcao === `silo ${numInt}`;
}

async function selecionarSiloNoFormulario(page, siloReq) {
  const selectSilo = page.locator('select').first();
  await selectSilo.waitFor({ state: 'visible', timeout: 10000 });

  const opcoes = await selectSilo.locator('option').evaluateAll(opts =>
    opts
      .map(o => ({ value: o.value, label: (o.textContent || '').trim() }))
      .filter(o => o.value && o.label)
  );

  const match = opcoes.find(o => siloCorresponde(o.label, siloReq));
  if (!match) {
    const ref = siloReq.identificador || extrairNumeroSilo(siloReq) || '?';
    throw new Error(
      `Silo "${ref}" não encontrado no CeresWeb. Opções disponíveis: ${opcoes.map(o => o.label).join(', ')}`
    );
  }

  await selectSilo.selectOption({ value: match.value });
  return match.label;
}

function formatarNumero(valor) {
  if (valor == null) return '';
  return String(valor).replace('.', ',');
}

function dataHojeBR() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

async function login(page, config) {
  const { base_url, usuario, senha } = config.procer;
  await page.goto(`${base_url}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await page.fill('input[name="_username"], input#username', usuario);
  await page.fill('input[name="_password"], input#password', senha);
  await page.click('button:has-text("Entrar")');

  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 60000 });
  } catch {
    if (page.url().includes('/login')) {
      throw new Error('Login falhou — verifique usuário e senha no config.json');
    }
  }

  console.log(`  → Login OK: ${page.url()}`);
}

async function selecionarFilial(page, filialBusca) {
  const unidadeAtual = await page.locator('#branchSearchButton').textContent().catch(() => '');
  if (unidadeAtual.toLowerCase().includes(filialBusca.toLowerCase())) {
    console.log(`  → Unidade já selecionada: ${unidadeAtual.trim()}`);
    return;
  }

  await page.click('#branchSearchButton');
  await page.waitForSelector('#branchSearchDialog.in', { timeout: 10000 });

  await page.waitForFunction(() => {
    const sel = document.querySelector('#branchSearchSelect');
    return sel && !sel.disabled;
  }, { timeout: 30000 });

  await page.locator('#branchSearchDialog .select2-selection').click();
  await page.waitForSelector('.select2-container--open .select2-search__field', { timeout: 5000 });

  const campoBusca = page.locator('.select2-container--open .select2-search__field');
  await campoBusca.fill(filialBusca);
  await page.waitForTimeout(800);

  const opcao = page.locator('.select2-results__option').filter({ hasText: filialBusca }).first();
  await opcao.waitFor({ state: 'visible', timeout: 10000 });
  await opcao.click();

  await page.locator('#branchSearchDialog button[type="submit"]').click();
  await page.waitForFunction(
    (termo) => document.querySelector('#branchSearchButton')?.textContent.toLowerCase().includes(termo.toLowerCase()),
    filialBusca,
    { timeout: 30000 }
  );

  const unidadeNova = await page.locator('#branchSearchButton').textContent();
  console.log(`  → Unidade selecionada: ${unidadeNova.trim()}`);
}

async function abrirFormularioAmostragem(page, config) {
  const base = config.procer.base_url;
  await page.goto(`${base}/sampling/moisture-content/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.click('text=Incluir amostragem');
  await page.waitForURL(/add/, { timeout: 30000 });
}

async function preencherAmostragem(page, requisicao, siloReq) {
  const am = siloReq.amostragem || {};

  const siloSelecionado = await selecionarSiloNoFormulario(page, siloReq);
  console.log(`  → Silo selecionado: ${siloSelecionado}`);

  await page.locator('input').filter({ has: page.locator('xpath=..') }).first();

  const inputs = page.locator('input[type="text"], input:not([type])');
  const count = await inputs.count();

  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    const val = await el.inputValue().catch(() => '');
    if (val.match(/\d{2}\/\d{2}\/\d{4}/)) {
      await el.fill(dataHojeBR());
    }
  }

  await page.locator('label:has-text("Umidade Controle")').locator('..').locator('input').fill(formatarNumero(am.umd)).catch(() => {});
  await page.locator('text=Avariados').locator('..').locator('input').fill(formatarNumero(am.avr)).catch(() => {});
  await page.locator('text=Impurezas').locator('..').locator('input').fill(formatarNumero(am.imp)).catch(() => {});

  if (requisicao.descricao) {
    await page.locator('textarea').fill(requisicao.descricao).catch(() => {});
  }
}

async function salvarAmostragem(page) {
  await page.click('button:has-text("Salvar amostragem")');
  await page.waitForTimeout(2000);
}

async function processarAmostragem(page, config, requisicao) {
  const unidade = encontrarUnidade(config, requisicao.cliente_nome);
  if (!unidade) {
    throw new Error(`Unidade não mapeada para: ${requisicao.cliente_nome}. Adicione em config.json`);
  }

  await selecionarFilial(page, unidade.filial_busca);

  const silos = requisicao.dados?.silos || [];
  for (const siloReq of silos) {
    const ref = siloReq.identificador || extrairNumeroSilo(siloReq) || '?';
    console.log(`  → Processando silo: ${ref}`);
    await abrirFormularioAmostragem(page, config);
    await preencherAmostragem(page, requisicao, siloReq);
    await salvarAmostragem(page);
  }
}

function produtoCorresponde(labelOpcao, produtoReq) {
  const opcao = normalizarTexto(labelOpcao);
  const produto = normalizarTexto(produtoReq);

  if (opcao === produto) return true;
  if (opcao.startsWith(produto) || produto.startsWith(opcao)) return true;

  const mapa = {
    soja: 'soja',
    milho: 'milho',
    trigo: 'trigo',
    aveia: 'aveia',
    canola: 'canola',
    feijao: 'feijao',
    cevada: 'cevada',
    sorgo: 'sorgo',
    arroz: 'arroz branco',
  };

  for (const [chave, alvo] of Object.entries(mapa)) {
    if (produto.includes(chave) && opcao.includes(alvo)) return true;
  }

  return false;
}

async function encontrarUrlConfigSilo(page, config, siloReq) {
  const base = config.procer.base_url;
  await page.goto(`${base}/silos/settings/general`, { waitUntil: 'domcontentloaded', timeout: 60000 });

  const links = await page.locator('a[href*="/silos/settings/general/"]').evaluateAll(els =>
    els
      .map(a => ({
        href: (a.getAttribute('href') || '').trim(),
        text: a.textContent.replace(/\s+/g, ' ').trim()
      }))
      .filter(l => /\/silos\/settings\/general\/\d+/.test(l.href))
  );

  const match = links.find(l => siloCorresponde(l.text, siloReq));
  if (!match) {
    const ref = siloReq.identificador || extrairNumeroSilo(siloReq) || '?';
    const nomes = links.map(l => l.text.split(/\s+/).slice(0, 2).join(' ')).join(', ');
    throw new Error(`Silo "${ref}" não encontrado em Configurações. Silos disponíveis: ${nomes}`);
  }

  return match.href.startsWith('http') ? match.href : `${base}${match.href}`;
}

async function selecionarProdutoNoFormulario(page, produto) {
  if (!produto) throw new Error('Produto não informado na requisição');

  const select = page.locator('#silo_product');
  await select.waitFor({ state: 'visible', timeout: 10000 });

  const opcoes = await select.locator('option').evaluateAll(opts =>
    opts
      .map(o => ({ value: o.value, label: (o.textContent || '').trim() }))
      .filter(o => o.value && o.label && o.label !== '---')
  );

  const match = opcoes.find(o => produtoCorresponde(o.label, produto));
  if (!match) {
    throw new Error(
      `Produto "${produto}" não encontrado. Opções: ${opcoes.map(o => o.label).join(', ')}`
    );
  }

  await select.selectOption({ value: match.value });
  return match.label;
}

async function preencherUmidadeProduto(page, siloReq) {
  const umidade = siloReq.umidade_percentual ?? siloReq.umidade_percentual_max;
  if (umidade == null) return;

  const campo = page.locator('#silo_moistureContent');
  if (await campo.isVisible({ timeout: 3000 }).catch(() => false)) {
    await campo.fill(formatarNumero(umidade));
  }
}

async function salvarConfigSilo(page) {
  await page.click('button:has-text("Salvar Alterações")');
  await page.waitForTimeout(2000);
}

async function processarProduto(page, config, requisicao) {
  const unidade = encontrarUnidade(config, requisicao.cliente_nome);
  if (!unidade) {
    throw new Error(`Unidade não mapeada para: ${requisicao.cliente_nome}. Adicione em config.json`);
  }

  await selecionarFilial(page, unidade.filial_busca);

  const silos = requisicao.dados?.silos || [];
  for (const siloReq of silos) {
    const ref = siloReq.identificador || extrairNumeroSilo(siloReq) || '?';
    console.log(`  → Processando produto silo: ${ref} → ${siloReq.produto || '?'}`);

    const url = await encontrarUrlConfigSilo(page, config, siloReq);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    const produtoSelecionado = await selecionarProdutoNoFormulario(page, siloReq.produto);
    console.log(`  → Produto selecionado: ${produtoSelecionado}`);

    await preencherUmidadeProduto(page, siloReq);

    if (requisicao.descricao) {
      await page.locator('#silo_observations, textarea[name*="observation"]').first()
        .fill(requisicao.descricao).catch(() => {});
    }

    await salvarConfigSilo(page);
  }
}

const TIPOS_AUTOMATIZADOS = ['atualizar_amostragem', 'atualizar_produto'];
async function buscarRequisicoes(config, idFiltro) {
  const url = idFiltro
    ? `${config.api_url}/api/requisicoes/${idFiltro}`
    : `${config.api_url}/api/requisicoes?status=pendente`;

  const res = await fetch(url, {
    headers: { 'X-API-Key': config.api_key }
  });
  if (!res.ok) throw new Error(`API erro ${res.status}`);
  const data = await res.json();
  const lista = idFiltro ? [data] : data;
  return idFiltro ? lista : lista.filter(r => TIPOS_AUTOMATIZADOS.includes(r.tipo));
}

async function atualizarStatus(config, id, status, observacoes, erroMotivo) {
  await fetch(`${config.api_url}/api/requisicoes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.api_key
    },
    body: JSON.stringify({
      status,
      observacoes_internas: observacoes,
      erro_motivo: erroMotivo || (status === 'erro' ? observacoes : null)
    })
  });
}

async function executar({ idFiltro } = {}) {
  const config = loadConfig();
  const requisicoes = await buscarRequisicoes(config, idFiltro);

  if (!requisicoes.length) {
    console.log('Nenhuma requisição pendente (amostragem ou produto).');
    return { processados: 0, erros: 0 };
  }

  const browser = await chromium.launch({ headless: config.procer.headless !== false });
  const page = await browser.newPage();
  let processados = 0;
  let erros = 0;

  try {
    await login(page, config);

    for (const req of requisicoes) {
      if (!TIPOS_AUTOMATIZADOS.includes(req.tipo)) continue;

      console.log(`Processando [${req.tipo}]: ${req.cliente_nome} (${req.id})`);
      try {
        await atualizarStatus(config, req.id, 'em_analise', 'Automação iniciada');
        if (req.tipo === 'atualizar_amostragem') {
          await processarAmostragem(page, config, req);
        } else if (req.tipo === 'atualizar_produto') {
          await processarProduto(page, config, req);
        }
        await atualizarStatus(
          config,
          req.id,
          'concluida',
          `Atualizado no CeresWeb em ${new Date().toLocaleString('pt-BR')}`
        );
        console.log(`✓ Concluído: ${req.id}`);
        processados++;
      } catch (err) {
        console.error(`✗ Erro ${req.id}:`, err.message);
        await atualizarStatus(config, req.id, 'erro', err.message, err.message);
        erros++;
      }
    }
  } finally {
    await browser.close();
  }

  return { processados, erros };
}

module.exports = { executar };
