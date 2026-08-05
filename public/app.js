const API = '/api/requisicoes';

const API_AUTOMACAO = '/api/automacao';



const TIPO_LABELS = {

  atualizar_nivel_silo: 'Atualizar Nível do Silo',

  atualizar_amostragem: 'Atualizar Amostragem',

  atualizar_produto: 'Atualizar Produto'

};



const STATUS_LABELS = {

  pendente: 'Pendente',

  em_analise: 'Em análise',

  concluida: 'Concluída',

  rejeitada: 'Rejeitada',

  erro: 'Erro'

};



const NIVEL_LABELS = {

  cheio: 'Cheio',

  vazio: 'Vazio',

  finalizando: 'Finalizando',

  parcial: 'Parcial'

};



const TAB_STATUS = {

  pendentes: ['pendente', 'em_analise'],

  concluidas: ['concluida'],

  erros: ['erro', 'rejeitada']

};



let requisicoes = [];

let selectedId = null;

let activeTab = 'pendentes';

let automacaoStatus = { bridge_online: false, processando: false };



async function fetchRequisicoes() {

  const res = await fetch(API);

  requisicoes = await res.json();

  render();

}



async function fetchAutomacaoStatus() {

  try {

    const res = await fetch(`${API_AUTOMACAO}/status`);

    automacaoStatus = await res.json();

    renderAutomacaoPanel();

  } catch {

    automacaoStatus = { bridge_online: false, processando: false };

    renderAutomacaoPanel();

  }

}



function renderAutomacaoPanel() {

  const statusEl = document.getElementById('bridge-status');

  const btn = document.getElementById('btn-processar');

  const online = automacaoStatus.bridge_online;

  const processando = automacaoStatus.processando;



  statusEl.innerHTML = processando

    ? '<span class="status-dot processando"></span> Processando...'

    : online

      ? '<span class="status-dot online"></span> Automação ativa'

      : '<span class="status-dot offline"></span> Automação offline';



  btn.disabled = processando;

  btn.textContent = processando ? 'Processando...' : 'Processar pendentes';

  btn.title = online

    ? 'Executar requisições pendentes de amostragem no CeresWeb'

    : 'Ative a automação local (3-ATIVAR-AUTOMACAO.bat) e clique aqui';

}



function showToast(msg, type = 'info') {

  const el = document.getElementById('toast');

  el.textContent = msg;

  el.className = `toast toast-${type}`;

  el.classList.remove('hidden');

  setTimeout(() => el.classList.add('hidden'), 6000);

}



async function solicitarProcessamento() {

  const btn = document.getElementById('btn-processar');

  btn.disabled = true;



  try {

    const res = await fetch(`${API_AUTOMACAO}/solicitar`, { method: 'POST' });

    const data = await res.json();

    showToast(data.mensagem, data.bridge_online ? 'success' : 'warning');

  } catch {

    showToast('Erro ao solicitar processamento.', 'error');

  }



  await fetchAutomacaoStatus();

  btn.disabled = automacaoStatus.processando;

}



function formatDate(iso) {

  if (!iso) return '—';

  return new Date(iso).toLocaleString('pt-BR', {

    day: '2-digit', month: '2-digit', year: 'numeric',

    hour: '2-digit', minute: '2-digit'

  });

}



function formatSiloNome(silo) {

  if (!silo) return 'Silo não informado';



  if (silo.identificador && /^\$/.test(String(silo.identificador).trim())) {

    if (silo.numero) {

      const prefixo = silo.tipo_silo === 'pulmao' ? 'Silo pulmão' : 'Silo';

      return `${prefixo} ${silo.numero}`;

    }

    return 'Silo não informado';

  }



  if (silo.identificador) {

    const id = String(silo.identificador).trim();

    if (/^\d+$/.test(id)) {

      const prefixo = silo.tipo_silo === 'pulmao' ? 'Silo pulmão' : 'Silo';

      return `${prefixo} ${id}`;

    }

    return id;

  }



  if (silo.numero) {

    const prefixo = silo.tipo_silo === 'pulmao' ? 'Silo pulmão' : 'Silo';

    return `${prefixo} ${silo.numero}`;

  }



  return 'Silo não informado';

}



function formatNivel(nivel) {

  return NIVEL_LABELS[nivel] || nivel || '—';

}



function formatSiloDetalhe(silo, tipo) {

  const nome = formatSiloNome(silo);

  const linhas = [`<strong>${nome}</strong>`];



  if (silo.numero) linhas.push(`Nº: ${silo.numero}`);

  if (silo.tipo_silo) linhas.push(`Tipo: ${silo.tipo_silo}`);



  if (tipo === 'atualizar_nivel_silo' && silo.nivel) {

    linhas.push(`Nível: ${formatNivel(silo.nivel)}`);

  }



  if (tipo === 'atualizar_produto') {

    if (silo.produto) linhas.push(`Produto: ${silo.produto}`);

    if (silo.umidade_percentual != null) linhas.push(`Umidade: ${silo.umidade_percentual}%`);

    if (silo.umidade_percentual_max != null) linhas.push(`Umidade máx: ${silo.umidade_percentual_max}%`);

  }



  if (tipo === 'atualizar_amostragem') {

    if (silo.produto) linhas.push(`Produto: ${silo.produto}`);

    if (silo.amostragem) {

      const am = silo.amostragem;

      const parts = [];

      if (am.umd != null) parts.push(`UMD ${am.umd}%`);

      if (am.imp != null) parts.push(`IMP ${am.imp}%`);

      if (am.avr != null) parts.push(`AVR ${am.avr}%`);

      if (parts.length) linhas.push(parts.join(' · '));

    }

  }



  return linhas.join(' · ');

}



function getFilteredRequisicoes() {

  const tipo = document.getElementById('filter-tipo').value;

  const statuses = TAB_STATUS[activeTab];



  return requisicoes.filter(r => {

    if (!statuses.includes(r.status)) return false;

    if (tipo && r.tipo !== tipo) return false;

    return true;

  });

}



function renderStats() {

  const counts = { pendente: 0, em_analise: 0, concluida: 0, erro: 0 };



  requisicoes.forEach(r => {

    if (r.status === 'pendente') counts.pendente++;

    else if (r.status === 'em_analise') counts.em_analise++;

    else if (r.status === 'concluida') counts.concluida++;

    else if (r.status === 'erro' || r.status === 'rejeitada') counts.erro++;

  });



  document.getElementById('stats').innerHTML = `

    <div class="stat-card pendente"><div class="number">${counts.pendente + counts.em_analise}</div><div class="label">Pendentes</div></div>

    <div class="stat-card concluida"><div class="number">${counts.concluida}</div><div class="label">Concluídas</div></div>

    <div class="stat-card erro"><div class="number">${counts.erro}</div><div class="label">Erros</div></div>

  `;



  document.querySelectorAll('.tab').forEach(tab => {

    const key = tab.dataset.tab;

    const n = requisicoes.filter(r => TAB_STATUS[key].includes(r.status)).length;

    const base = tab.dataset.tab === 'pendentes' ? 'Pendentes' : tab.dataset.tab === 'concluidas' ? 'Concluídas' : 'Erros';

    tab.textContent = `${base} (${n})`;

  });

}



function renderResumoSilos(r) {

  const silos = r.dados?.silos;

  if (!silos?.length) return '';



  const resumos = silos.slice(0, 3).map(s => formatSiloDetalhe(s, r.tipo));

  const extra = silos.length > 3 ? ` +${silos.length - 3} silos` : '';



  return `<div class="task-silos">${resumos.join('<br>')}${extra}</div>`;

}



function renderSilosHtml(r) {

  const silos = r.dados?.silos || [];

  const outros = r.dados?.outros_silos || [];



  if (!silos.length && !outros.length) {

    return '<p class="text-muted">Nenhum silo informado</p>';

  }



  let html = silos.map(s => `

    <div class="silo-card">

      <div class="silo-card-title">${formatSiloNome(s)}</div>

      <div class="silo-card-grid">

        ${s.numero ? `<span><label>Número</label>${s.numero}</span>` : ''}

        ${s.tipo_silo ? `<span><label>Tipo silo</label>${s.tipo_silo}</span>` : ''}

        ${s.nivel ? `<span><label>Nível</label>${formatNivel(s.nivel)}</span>` : ''}

        ${s.produto ? `<span><label>Produto</label>${s.produto}</span>` : ''}

        ${s.umidade_percentual != null ? `<span><label>Umidade</label>${s.umidade_percentual}%</span>` : ''}

        ${s.umidade_percentual_max != null ? `<span><label>Umidade máx</label>${s.umidade_percentual_max}%</span>` : ''}

        ${s.amostragem?.umd != null ? `<span><label>UMD</label>${s.amostragem.umd}%</span>` : ''}

        ${s.amostragem?.imp != null ? `<span><label>IMP</label>${s.amostragem.imp}%</span>` : ''}

        ${s.amostragem?.avr != null ? `<span><label>AVR</label>${s.amostragem.avr}%</span>` : ''}

      </div>

    </div>

  `).join('');



  if (outros.length) {

    html += '<h4 class="outros-silos-title">Outros silos mencionados</h4>';

    html += outros.map(s => `

      <div class="silo-card silo-card-secondary">

        <div class="silo-card-title">${formatSiloNome(s)}</div>

        ${s.nivel ? `<div>Nível: ${formatNivel(s.nivel)}</div>` : ''}

      </div>

    `).join('');

  }



  return html;

}



function renderHistorico(r) {

  const historico = r.historico || [];

  if (!historico.length) return '<p class="text-muted">Sem histórico registrado</p>';



  return `<ul class="historico-list">${historico.map(h => `

    <li>

      <span class="badge badge-${h.status}">${STATUS_LABELS[h.status] || h.status}</span>

      <span class="historico-data">${formatDate(h.em)}</span>

      ${h.observacao ? `<span class="historico-obs">${h.observacao}</span>` : ''}

    </li>

  `).join('')}</ul>`;

}



function renderList() {

  const list = document.getElementById('task-list');

  const empty = document.getElementById('empty-state');

  const filtered = getFilteredRequisicoes();



  if (filtered.length === 0) {

    list.innerHTML = '';

    empty.classList.remove('hidden');

    return;

  }



  empty.classList.add('hidden');

  list.innerHTML = filtered.map(r => `

    <article class="task-card" data-id="${r.id}">

      <div class="task-header">

        <div class="task-title">${TIPO_LABELS[r.tipo] || r.tipo}</div>

        <div class="task-meta">

          <span class="badge badge-tipo">${TIPO_LABELS[r.tipo] || r.tipo}</span>

          <span class="badge badge-${r.status}">${STATUS_LABELS[r.status] || r.status}</span>

        </div>

      </div>

      <div class="task-client"><strong>${r.cliente_nome}</strong>${r.solicitante ? ` · ${r.solicitante}` : ''}</div>

      ${renderResumoSilos(r)}

      ${r.descricao ? `<div class="task-desc">${r.descricao}</div>` : ''}

      ${r.erro_motivo && activeTab === 'erros' ? `<div class="task-erro">⚠ ${r.erro_motivo}</div>` : ''}

      <div class="task-date">

        ${r.status === 'concluida' && r.concluida_em ? `Concluída: ${formatDate(r.concluida_em)} · ` : ''}

        Criada: ${formatDate(r.criado_em)}

      </div>

    </article>

  `).join('');



  list.querySelectorAll('.task-card').forEach(card => {

    card.addEventListener('click', () => openModal(card.dataset.id));

  });

}



function render() {

  renderStats();

  renderList();

}



function openModal(id) {

  selectedId = id;

  const r = requisicoes.find(x => x.id === id);

  if (!r) return;



  document.getElementById('modal-body').innerHTML = `

    <h2 style="margin-bottom:1rem">${TIPO_LABELS[r.tipo] || r.tipo}</h2>

    <div class="detail-section">

      <h3>Status</h3>

      <span class="badge badge-${r.status}">${STATUS_LABELS[r.status]}</span>

      ${r.erro_motivo ? `<p class="erro-motivo">Motivo: ${r.erro_motivo}</p>` : ''}

    </div>

    <div class="detail-section">

      <h3>Cliente</h3>

      <p class="cliente-nome-destaque">${r.cliente_nome}</p>

      ${r.solicitante ? `<p>Solicitante: ${r.solicitante}</p>` : ''}

      ${r.regiao ? `<p>Região: ${r.regiao}</p>` : ''}

      ${r.contato ? `<p>Contato: ${r.contato}</p>` : ''}

    </div>

    ${r.descricao ? `<div class="detail-section"><h3>Descrição do pedido</h3><p>${r.descricao}</p></div>` : ''}

    <div class="detail-section">

      <h3>Silos / Informações</h3>

      ${renderSilosHtml(r)}

    </div>

    <div class="detail-section">

      <h3>Histórico</h3>

      ${renderHistorico(r)}

    </div>

    <details class="detail-section detail-raw">

      <summary>Ver JSON completo</summary>

      <pre class="detail-json">${JSON.stringify(r.dados, null, 2)}</pre>

    </details>

    <div class="detail-section">

      <h3>Observações internas</h3>

      <textarea class="obs-input" id="obs-input" placeholder="Adicionar observação...">${r.observacoes_internas || ''}</textarea>

    </div>

    <div class="detail-section">

      <h3>Informações</h3>

      <p>Criado em: ${formatDate(r.criado_em)}</p>

      <p>Atualizado em: ${formatDate(r.atualizado_em)}</p>

      ${r.concluida_em ? `<p>Concluída em: ${formatDate(r.concluida_em)}</p>` : ''}

      <p>Origem: ${r.origem}</p>

    </div>

    <div class="modal-actions">

      ${r.status !== 'em_analise' ? '<button class="btn-action btn-analise" data-status="em_analise">Marcar em análise</button>' : ''}

      ${r.status !== 'concluida' ? '<button class="btn-action btn-concluir" data-status="concluida">Concluir</button>' : ''}

      ${r.status === 'erro' || r.status === 'pendente' ? '<button class="btn-action btn-reprocessar" data-status="pendente">Voltar para pendente</button>' : ''}

      ${r.status !== 'rejeitada' ? '<button class="btn-action btn-rejeitar" data-status="rejeitada">Rejeitar</button>' : ''}

      ${['atualizar_amostragem', 'atualizar_produto'].includes(r.tipo) && ['pendente', 'erro'].includes(r.status)

        ? '<button class="btn-action btn-processar-uma" type="button">Processar esta</button>' : ''}

    </div>

  `;



  document.querySelectorAll('.btn-action').forEach(btn => {

    btn.addEventListener('click', () => updateStatus(btn.dataset.status));

  });



  document.querySelector('.btn-processar-uma')?.addEventListener('click', () => processarUma(r.id));



  document.getElementById('modal').classList.remove('hidden');

}



async function processarUma(id) {

  closeModal();

  await fetch(`${API_AUTOMACAO}/solicitar`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ id })

  });

  showToast('Processamento solicitado para esta requisição.', 'success');

  await fetchAutomacaoStatus();

}



function closeModal() {

  document.getElementById('modal').classList.add('hidden');

  selectedId = null;

}



async function updateStatus(status) {

  if (!selectedId) return;



  const observacoes = document.getElementById('obs-input')?.value || null;

  const body = { status, observacoes_internas: observacoes };

  if (status === 'pendente') body.erro_motivo = null;



  await fetch(`${API}/${selectedId}`, {

    method: 'PATCH',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify(body)

  });



  closeModal();

  await fetchRequisicoes();

}



document.getElementById('tabs').addEventListener('click', e => {

  const tab = e.target.closest('.tab');

  if (!tab) return;

  activeTab = tab.dataset.tab;

  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));

  renderList();

});



document.getElementById('filter-tipo').addEventListener('change', renderList);

document.getElementById('btn-refresh').addEventListener('click', () => {

  fetchRequisicoes();

  fetchAutomacaoStatus();

});

document.getElementById('btn-processar').addEventListener('click', solicitarProcessamento);

document.getElementById('modal-close').addEventListener('click', closeModal);

document.querySelector('.modal-backdrop').addEventListener('click', closeModal);



fetchRequisicoes();

fetchAutomacaoStatus();

setInterval(fetchRequisicoes, 15000);

setInterval(fetchAutomacaoStatus, 5000);


