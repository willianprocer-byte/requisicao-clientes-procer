const API = '/api/requisicoes';

const TIPO_LABELS = {
  atualizar_nivel_silo: 'Atualizar Nível do Silo',
  atualizar_amostragem: 'Atualizar Amostragem',
  atualizar_produto: 'Atualizar Produto'
};

const STATUS_LABELS = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  concluida: 'Concluída',
  rejeitada: 'Rejeitada'
};

let requisicoes = [];
let selectedId = null;

async function fetchRequisicoes() {
  const status = document.getElementById('filter-status').value;
  const tipo = document.getElementById('filter-tipo').value;

  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (tipo) params.set('tipo', tipo);

  const url = params.toString() ? `${API}?${params}` : API;
  const res = await fetch(url);
  requisicoes = await res.json();
  render();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function renderStats() {
  const counts = { pendente: 0, em_analise: 0, concluida: 0, rejeitada: 0 };
  requisicoes.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  document.getElementById('stats').innerHTML = `
    <div class="stat-card pendente"><div class="number">${counts.pendente}</div><div class="label">Pendentes</div></div>
    <div class="stat-card analise"><div class="number">${counts.em_analise}</div><div class="label">Em análise</div></div>
    <div class="stat-card concluida"><div class="number">${counts.concluida}</div><div class="label">Concluídas</div></div>
  `;
}

function renderList() {
  const list = document.getElementById('task-list');
  const empty = document.getElementById('empty-state');

  if (requisicoes.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  list.innerHTML = requisicoes.map(r => `
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
      <div class="task-date">${formatDate(r.criado_em)}</div>
    </article>
  `).join('');

  list.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', () => openModal(card.dataset.id));
  });
}

function renderResumoSilos(r) {
  const silos = r.dados?.silos;
  if (!silos?.length) return '';

  const resumos = silos.slice(0, 3).map(s => {
    const nome = s.identificador || `Silo ${s.numero}`;
    if (r.tipo === 'atualizar_nivel_silo') return `${nome}: ${s.nivel}`;
    if (r.tipo === 'atualizar_amostragem' && s.amostragem) {
      const parts = [];
      if (s.amostragem.umd != null) parts.push(`UMD ${s.amostragem.umd}`);
      if (s.amostragem.imp != null) parts.push(`IMP ${s.amostragem.imp}`);
      if (s.amostragem.avr != null) parts.push(`AVR ${s.amostragem.avr}`);
      return `${nome}${s.produto ? ` (${s.produto})` : ''}: ${parts.join(', ')}`;
    }
    if (r.tipo === 'atualizar_produto') return `${nome}: ${s.produto}${s.umidade_percentual_max ? ` ≤${s.umidade_percentual_max}%` : ''}`;
    return nome;
  });

  const extra = silos.length > 3 ? ` +${silos.length - 3} silos` : '';
  return `<div class="task-silos">${resumos.join(' · ')}${extra}</div>`;
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
    </div>
    <div class="detail-section">
      <h3>Cliente</h3>
      <p class="cliente-nome-destaque">${r.cliente_nome}</p>
      ${r.solicitante ? `<p>Solicitante: ${r.solicitante}</p>` : ''}
      ${r.regiao ? `<p>Região: ${r.regiao}</p>` : ''}
      ${r.contato ? `<p>Contato: ${r.contato}</p>` : ''}
    </div>
    ${r.descricao ? `<div class="detail-section"><h3>Descrição</h3><p>${r.descricao}</p></div>` : ''}
    <div class="detail-section">
      <h3>Dados da requisição</h3>
      <pre class="detail-json">${JSON.stringify(r.dados, null, 2)}</pre>
    </div>
    <div class="detail-section">
      <h3>Observações internas</h3>
      <textarea class="obs-input" id="obs-input" placeholder="Adicionar observação...">${r.observacoes_internas || ''}</textarea>
    </div>
    <div class="detail-section">
      <h3>Informações</h3>
      <p>Criado em: ${formatDate(r.criado_em)}</p>
      <p>Atualizado em: ${formatDate(r.atualizado_em)}</p>
      <p>Origem: ${r.origem}</p>
    </div>
    <div class="modal-actions">
      ${r.status !== 'em_analise' ? '<button class="btn-action btn-analise" data-status="em_analise">Marcar em análise</button>' : ''}
      ${r.status !== 'concluida' ? '<button class="btn-action btn-concluir" data-status="concluida">Concluir</button>' : ''}
      ${r.status !== 'rejeitada' ? '<button class="btn-action btn-rejeitar" data-status="rejeitada">Rejeitar</button>' : ''}
    </div>
  `;

  document.querySelectorAll('.btn-action').forEach(btn => {
    btn.addEventListener('click', () => updateStatus(btn.dataset.status));
  });

  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  selectedId = null;
}

async function updateStatus(status) {
  if (!selectedId) return;

  const observacoes = document.getElementById('obs-input')?.value || null;

  await fetch(`${API}/${selectedId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, observacoes_internas: observacoes })
  });

  closeModal();
  await fetchRequisicoes();
}

document.getElementById('filter-status').addEventListener('change', fetchRequisicoes);
document.getElementById('filter-tipo').addEventListener('change', fetchRequisicoes);
document.getElementById('btn-refresh').addEventListener('click', fetchRequisicoes);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);

fetchRequisicoes();
setInterval(fetchRequisicoes, 30000);
