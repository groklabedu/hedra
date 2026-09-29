const SUPABASE_URL = 'https://ilpspfqkdgbzvjesdzmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHNwZnFrZGdienZqZXNkem12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTYzNDEsImV4cCI6MjEwNTkzMjM0MX0.4FTajA7ZGARYPs0cxbvQBdmEZP87qk_Ql1UoNO6KTGI';
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};
const ADMIN_KEY = 'HEDRA@admin2026';

let dadosAdmin = [];
let slotsAdmin = {}; // { email: slots }
let chartPizzaAdmin = null;
let sortCol = 'data';
let sortDir = 'desc'; // 'asc' | 'desc'

function formatarTempo(seg) {
  if (seg == null || isNaN(seg)) return '—';
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2,'0')}s` : `${s}s`;
}

// ─── Login ───────────────────────────────────────────────────────────────────

document.getElementById('btn-login').addEventListener('click', () => {
  const senha = document.getElementById('campo-senha').value;
  if (senha !== ADMIN_KEY) {
    document.getElementById('msg-erro-login').classList.remove('oculto');
    return;
  }
  document.getElementById('tela-login').classList.add('oculto');
  document.getElementById('tela-painel').classList.remove('oculto');
  carregarDados();
});

document.getElementById('campo-senha').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

// ─── Carregar dados ──────────────────────────────────────────────────────────

async function carregarDados() {
  const status = document.getElementById('status-carregando');
  status.textContent = 'Carregando dados…';

  try {
    const [res, acRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/respostas?select=*&order=created_at.desc`, { headers: SB_HEADERS }),
      fetch(`${SUPABASE_URL}/rest/v1/acessos?select=email,slots`, { headers: SB_HEADERS }),
    ]);

    if (!res.ok) {
      status.textContent = 'Erro ao carregar dados.';
      return;
    }

    const acRows = acRes.ok ? await acRes.json() : [];
    slotsAdmin = {};
    acRows.forEach((r) => { slotsAdmin[r.email] = r.slots; });

    const rows = await res.json();
    status.textContent = '';

    dadosAdmin = rows.map((row) => {
      const p = resolverPerfil(row.perfil || '');
      return {
        id:         row.id,
        data:       row.created_at,
        nome:       row.nome,
        email:      row.email,
        cargo:      row.cargo,
        area:       row.area,
        empresa:    row.empresa,
        estado:     row.estado,
        cidade:     row.cidade,
        autodominio: row.autodominio,
        direcao:    row.direcao,
        influencia: row.influencia,
        maestria:   row.maestria,
        eixoX:      row.eixo_x,
        eixoY:      row.eixo_y,
        perfil:     p.key,
        perfilNome: p.nome,
        perfilCor:  p.cor,
        respostaAberta: row.resposta_aberta,
        tempoSegundos:  row.tempo_segundos ?? null,
      };
    });

    limparSelecao();
    renderizarPainel();
  } catch (err) {
    status.textContent = 'Erro de conexão.';
    console.error(err);
  }
}

// ─── Renderizar painel ───────────────────────────────────────────────────────

const PERFIS_LABELS = {
  operador:    { nome: 'Operador Sobrecarregado',         cor: '#CC4400' },
  executor:    { nome: 'Executor Eficiente',              cor: '#1A5276' },
  comunicador: { nome: 'Comunicador Frágil',              cor: '#B7770D' },
  lider:       { nome: 'Líder de Influência Estratégica', cor: '#1A6B45' },
};

// Suporta tanto chave quanto nome completo vindo da planilha
function resolverPerfil(valor) {
  if (PERFIS_LABELS[valor]) return { key: valor, ...PERFIS_LABELS[valor] };
  const entry = Object.entries(PERFIS_LABELS).find(([, v]) => v.nome === valor);
  if (entry) return { key: entry[0], ...entry[1] };
  return { key: valor, nome: valor, cor: '#555' };
}

function renderizarPainel(filtro = 'todos') {
  const dados = filtro === 'todos'
    ? dadosAdmin
    : dadosAdmin.filter((d) => d.perfil === filtro);

  // Totais
  document.getElementById('total-participantes').textContent = dadosAdmin.length;

  // Contadores por perfil
  const contadores = { operador: 0, executor: 0, comunicador: 0, lider: 0 };
  dadosAdmin.forEach((d) => { if (contadores[d.perfil] !== undefined) contadores[d.perfil]++; });

  Object.entries(contadores).forEach(([key, val]) => {
    const el = document.getElementById('count-' + key);
    if (el) el.textContent = val;
  });

  // Gráfico pizza
  const pizzaDados = Object.entries(PERFIS_LABELS).map(([key, info]) => ({
    label: info.nome,
    valor: contadores[key],
    cor: info.cor,
  }));
  if (chartPizzaAdmin) { chartPizzaAdmin.destroy(); }
  chartPizzaAdmin = renderarPizzaAdmin('canvas-pizza', pizzaDados);

  // Distribuição por empresa
  const porEmpresa = {};
  dadosAdmin.forEach((d) => {
    const u = d.empresa || 'Não informado';
    porEmpresa[u] = (porEmpresa[u] || 0) + 1;
  });
  const unidadeEl = document.getElementById('lista-unidades');
  unidadeEl.innerHTML = Object.entries(porEmpresa)
    .sort((a, b) => b[1] - a[1])
    .map(([u, n]) => `<li><strong>${u}</strong>: ${n}</li>`)
    .join('');

  // Tabela
  renderizarTabela(dados);
}

function ordenarDados(dados) {
  return [...dados].sort((a, b) => {
    let va, vb;
    if (sortCol === 'data')  { va = a.data  || ''; vb = b.data  || ''; }
    if (sortCol === 'nome')  { va = (a.nome  || '').toLowerCase(); vb = (b.nome  || '').toLowerCase(); }
    if (sortCol === 'email') { va = (a.email || '').toLowerCase(); vb = (b.email || '').toLowerCase(); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ?  1 : -1;
    return 0;
  });
}

function atualizarIconesOrdenacao() {
  ['data', 'nome', 'email'].forEach((col) => {
    const th = document.querySelector(`th[data-sort="${col}"]`);
    if (!th) return;
    const ico = th.querySelector('.sort-ico');
    if (!ico) return;
    ico.textContent = sortCol === col ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ' ↕';
  });
}

function renderizarTabela(dados) {
  const tbody = document.getElementById('tabela-corpo');
  tbody.innerHTML = '';
  dados = ordenarDados(dados);

  // Resetar checkbox "selecionar todos"
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = false;

  if (dados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:1rem;">Nenhum registro encontrado.</td></tr>';
    return;
  }

  dados.forEach((d) => {
    const dataStr = d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '—';
    const slots = slotsAdmin[d.email] || 0;
    const slotsBadge = slots > 0
      ? `<span class="badge-slots badge-slots-ativo" title="${slots} teste(s) liberado(s)">${slots}</span>`
      : `<span class="badge-slots" title="Nenhum teste liberado">—</span>`;
    const tr = document.createElement('tr');
    tr.dataset.id = d.id;
    tr.dataset.email = d.email;
    tr.innerHTML = `
      <td class="col-check">
        <input type="checkbox" class="check-linha" data-id="${d.id}" title="Selecionar">
      </td>
      <td>${dataStr}</td>
      <td>${d.nome}</td>
      <td>${d.email}</td>
      <td>${d.cargo}</td>
      <td>${d.empresa || '—'}</td>
      <td>
        <span class="badge-perfil" style="background:${d.perfilCor}20;color:${d.perfilCor};border:1px solid ${d.perfilCor}40">
          ${d.perfilNome}
        </span>
      </td>
      <td>${Number(d.eixoX).toFixed(0)} / ${Number(d.eixoY).toFixed(0)}</td>
      <td class="resposta-aberta" title="${(d.respostaAberta || '').replace(/"/g, '&quot;')}">${d.respostaAberta || '—'}</td>
      <td class="col-tempo">${formatarTempo(d.tempoSegundos)}</td>
      <td class="col-slots">${slotsBadge}</td>
      <td class="col-acoes">
        <button class="btn-liberar" data-email="${d.email}" data-nome="${d.nome}" title="Liberar novo teste para este participante">+</button>
        <button class="btn-lixeira" data-id="${d.id}" title="Excluir este registro">🗑</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Listeners das caixas de linha
  tbody.querySelectorAll('.check-linha').forEach((cb) => {
    cb.addEventListener('change', atualizarBarraSelecao);
  });

  // Listeners dos botões de lixeira individuais
  tbody.querySelectorAll('.btn-lixeira').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const nome = dadosAdmin.find((d) => d.id === id)?.nome || id;
      confirmarExclusao([id], `Excluir o registro de "${nome}"?`);
    });
  });

  // Listeners dos botões de liberar
  tbody.querySelectorAll('.btn-liberar').forEach((btn) => {
    btn.addEventListener('click', () => liberarTeste(btn.dataset.email, btn.dataset.nome));
  });
}

// ─── Seleção e exclusão ──────────────────────────────────────────────────────

function atualizarBarraSelecao() {
  const selecionados = document.querySelectorAll('.check-linha:checked');
  const barra = document.getElementById('barra-selecao');
  const texto = document.getElementById('texto-selecao');

  if (selecionados.length > 0) {
    barra.classList.add('visivel');
    texto.textContent = `${selecionados.length} registro${selecionados.length > 1 ? 's' : ''} selecionado${selecionados.length > 1 ? 's' : ''}`;
  } else {
    barra.classList.remove('visivel');
  }

  const total = document.querySelectorAll('.check-linha').length;
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) {
    checkTodos.checked = selecionados.length === total && total > 0;
    checkTodos.indeterminate = selecionados.length > 0 && selecionados.length < total;
  }
}

function limparSelecao() {
  document.querySelectorAll('.check-linha:checked').forEach((cb) => { cb.checked = false; });
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) { checkTodos.checked = false; checkTodos.indeterminate = false; }
  document.getElementById('barra-selecao').classList.remove('visivel');
}

// Checkbox "selecionar todos"
document.getElementById('check-todos').addEventListener('change', (e) => {
  document.querySelectorAll('.check-linha').forEach((cb) => { cb.checked = e.target.checked; });
  atualizarBarraSelecao();
});

// Botão cancelar seleção
document.getElementById('btn-cancelar-selecao').addEventListener('click', limparSelecao);

// Botão excluir selecionados
document.getElementById('btn-excluir-selecionados').addEventListener('click', () => {
  const ids = [...document.querySelectorAll('.check-linha:checked')].map((cb) => cb.dataset.id);
  if (ids.length === 0) return;
  confirmarExclusao(ids, `Excluir ${ids.length} registro${ids.length > 1 ? 's' : ''} selecionado${ids.length > 1 ? 's' : ''}?`);
});

async function confirmarExclusao(ids, mensagem) {
  if (!confirm(`${mensagem}\n\nEssa ação não pode ser desfeita.`)) return;

  const status = document.getElementById('status-carregando');
  status.textContent = 'Excluindo…';

  try {
    const idList = ids.map((id) => `"${id}"`).join(',');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/respostas?id=in.(${idList})`,
      { method: 'DELETE', headers: SB_HEADERS }
    );

    if (res.ok) {
      status.textContent = `${ids.length} registro${ids.length !== 1 ? 's' : ''} excluído${ids.length !== 1 ? 's' : ''}.`;
      setTimeout(() => { status.textContent = ''; }, 3000);
      await carregarDados();
    } else {
      status.textContent = 'Erro ao excluir.';
    }
  } catch (err) {
    status.textContent = 'Erro de conexão ao excluir.';
    console.error(err);
  }
}

// ─── Busca e filtro ──────────────────────────────────────────────────────────

document.getElementById('campo-busca').addEventListener('input', aplicarFiltros);
document.getElementById('filtro-perfil').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
  const busca  = document.getElementById('campo-busca').value.toLowerCase();
  const perfil = document.getElementById('filtro-perfil').value;

  let filtrados = dadosAdmin;
  if (perfil !== 'todos') filtrados = filtrados.filter((d) => d.perfil === perfil);
  if (busca) {
    filtrados = filtrados.filter((d) =>
      [d.nome, d.email, d.cargo, d.empresa, d.area, d.estado, d.cidade].some((v) =>
        (v || '').toLowerCase().includes(busca)
      )
    );
  }
  renderizarTabela(filtrados);
}

// ─── Exportar CSV ────────────────────────────────────────────────────────────

document.getElementById('btn-exportar-csv').addEventListener('click', () => {
  const headers = ['Data', 'Nome', 'Email', 'Fone', 'Empresa', 'Cargo', 'Área', 'Estado', 'Cidade', 'Autodomínio', 'Direção', 'Influência', 'Maestria', 'Eixo X', 'Eixo Y', 'Perfil', 'Resposta Aberta'];
  const rows = dadosAdmin.map((d) => [
    d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '',
    d.nome, d.email, d.fone || '', d.empresa || '', d.cargo, d.area,
    d.estado || '', d.cidade || '',
    d.autodominio, d.direcao, d.influencia, d.maestria,
    d.eixoX, d.eixoY, d.perfil,
    (d.respostaAberta || '').replace(/"/g, '""'),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(','))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'hedra-dados.csv';
  link.click();
});

// ─── Liberar novo teste ──────────────────────────────────────────────────────

async function liberarTeste(email, nome) {
  if (!confirm(`Liberar um novo teste para "${nome}" (${email})?`)) return;

  const status = document.getElementById('status-carregando');
  status.textContent = 'Liberando acesso…';

  try {
    // Busca slots atuais
    const getRes = await fetch(
      `${SUPABASE_URL}/rest/v1/acessos?email=eq.${encodeURIComponent(email)}&select=slots`,
      { headers: SB_HEADERS }
    );
    const rows = await getRes.json();
    const slotsAtuais = rows.length > 0 ? rows[0].slots : 0;

    // UPSERT com slots + 1
    const res = await fetch(`${SUPABASE_URL}/rest/v1/acessos`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ email, slots: slotsAtuais + 1, liberado_em: new Date().toISOString() }),
    });

    if (res.ok || res.status === 204) {
      status.textContent = `Acesso liberado para ${nome}.`;
      setTimeout(() => { status.textContent = ''; }, 3000);

      // Atualiza o badge na linha sem recarregar tudo
      const novosSlots = slotsAtuais + 1;
      slotsAdmin[email] = novosSlots;
      document.querySelectorAll(`tr[data-email="${CSS.escape(email)}"] .col-slots`).forEach((td) => {
        td.innerHTML = `<span class="badge-slots badge-slots-ativo" title="${novosSlots} teste(s) liberado(s)">${novosSlots}</span>`;
      });
    } else {
      status.textContent = 'Erro ao liberar acesso.';
    }
  } catch (err) {
    status.textContent = 'Erro de conexão ao liberar.';
    console.error(err);
  }
}

// ─── Ordenação ───────────────────────────────────────────────────────────────

document.querySelectorAll('th[data-sort]').forEach((th) => {
  th.style.cursor = 'pointer';
  th.addEventListener('click', () => {
    const col = th.dataset.sort;
    if (sortCol === col) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortCol = col;
      sortDir = col === 'data' ? 'desc' : 'asc';
    }
    atualizarIconesOrdenacao();
    aplicarFiltros();
  });
});

// ─── Atualizar dados ─────────────────────────────────────────────────────────

document.getElementById('btn-atualizar').addEventListener('click', carregarDados);
