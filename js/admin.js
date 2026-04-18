// Configurar a mesma URL e chave do Apps Script
const ADMIN_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby1o60UP4evcSOQhAUD9tpw9TITQLv-QVAWUHAwMZ5SbmUr3JF31jSlDswNaapBkp20/exec';
const ADMIN_KEY = 'HEDRA@admin2026';

let dadosAdmin = [];
let chartPizzaAdmin = null;

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

  if (ADMIN_APPS_SCRIPT_URL === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') {
    status.textContent = 'URL do Apps Script não configurada.';
    return;
  }

  try {
    const res = await fetch(`${ADMIN_APPS_SCRIPT_URL}?key=${encodeURIComponent(ADMIN_KEY)}`);
    const json = await res.json();

    if (json.status === 'unauthorized') {
      status.textContent = 'Chave inválida no servidor.';
      return;
    }
    if (json.status !== 'ok') {
      status.textContent = 'Erro ao carregar dados.';
      return;
    }

    status.textContent = '';
    const linhas = json.data;
    // Linha 0 = cabeçalhos; dados a partir da linha 1
    dadosAdmin = linhas.slice(1).map((row) => {
      const p = resolverPerfil(row[12] || '');
      return {
        data:      row[0],
        nome:      row[1],
        email:     row[2],
        cargo:     row[3],
        area:      row[4],
        unidade:   row[5],
        autodominio: row[6],
        direcao:   row[7],
        influencia: row[8],
        maestria:  row[9],
        eixoX:     row[10],
        eixoY:     row[11],
        perfil:    p.key,
        perfilNome: p.nome,
        perfilCor:  p.cor,
        respostaAberta: row[13],
      };
    });

    limparSelecao();
    renderizarPainel();
  } catch (err) {
    status.textContent = 'Erro de conexão. Verifique a URL e tente novamente.';
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

  // Distribuição por unidade
  const porUnidade = {};
  dadosAdmin.forEach((d) => {
    const u = d.unidade || 'Não informado';
    porUnidade[u] = (porUnidade[u] || 0) + 1;
  });
  const unidadeEl = document.getElementById('lista-unidades');
  unidadeEl.innerHTML = Object.entries(porUnidade)
    .sort((a, b) => b[1] - a[1])
    .map(([u, n]) => `<li><strong>${u}</strong>: ${n}</li>`)
    .join('');

  // Tabela
  renderizarTabela(dados);
}

function renderizarTabela(dados) {
  const tbody = document.getElementById('tabela-corpo');
  tbody.innerHTML = '';

  // Resetar checkbox "selecionar todos"
  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = false;

  if (dados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:1rem;">Nenhum registro encontrado.</td></tr>';
    return;
  }

  dados.forEach((d) => {
    const dataStr = d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '—';
    const emailSafe = (d.email || '').toLowerCase();
    const tr = document.createElement('tr');
    tr.dataset.email = emailSafe;
    tr.innerHTML = `
      <td class="col-check">
        <input type="checkbox" class="check-linha" data-email="${emailSafe}" title="Selecionar">
      </td>
      <td>${dataStr}</td>
      <td>${d.nome}</td>
      <td>${d.email}</td>
      <td>${d.cargo}</td>
      <td>${d.unidade}</td>
      <td>
        <span class="badge-perfil" style="background:${d.perfilCor}20;color:${d.perfilCor};border:1px solid ${d.perfilCor}40">
          ${d.perfilNome}
        </span>
      </td>
      <td>${Number(d.eixoX).toFixed(0)} / ${Number(d.eixoY).toFixed(0)}</td>
      <td class="resposta-aberta" title="${(d.respostaAberta || '').replace(/"/g, '&quot;')}">${d.respostaAberta || '—'}</td>
      <td class="col-acoes">
        <button class="btn-lixeira" data-email="${emailSafe}" title="Excluir este registro">🗑</button>
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
      const email = btn.dataset.email;
      const nome  = dadosAdmin.find((d) => d.email.toLowerCase() === email)?.nome || email;
      confirmarExclusao([email], `Excluir o registro de "${nome}"?`);
    });
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

  // Atualizar estado do "selecionar todos"
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
  const emails = [...document.querySelectorAll('.check-linha:checked')].map((cb) => cb.dataset.email);
  if (emails.length === 0) return;
  confirmarExclusao(emails, `Excluir ${emails.length} registro${emails.length > 1 ? 's' : ''} selecionado${emails.length > 1 ? 's' : ''}?`);
});

async function confirmarExclusao(emails, mensagem) {
  if (!confirm(`${mensagem}\n\nEssa ação não pode ser desfeita.`)) return;

  const status = document.getElementById('status-carregando');
  status.textContent = 'Excluindo…';

  try {
    const res = await fetch(ADMIN_APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'deleteRows', key: ADMIN_KEY, emails }),
    });
    const json = await res.json();

    if (json.status === 'ok') {
      status.textContent = `${json.deleted} registro${json.deleted !== 1 ? 's' : ''} excluído${json.deleted !== 1 ? 's' : ''}.`;
      setTimeout(() => { status.textContent = ''; }, 3000);
      await carregarDados(); // recarregar tudo do servidor
    } else {
      status.textContent = 'Erro ao excluir: ' + (json.message || json.status);
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
      [d.nome, d.email, d.cargo, d.unidade, d.area].some((v) =>
        (v || '').toLowerCase().includes(busca)
      )
    );
  }
  renderizarTabela(filtrados);
}

// ─── Exportar CSV ────────────────────────────────────────────────────────────

document.getElementById('btn-exportar-csv').addEventListener('click', () => {
  const headers = ['Data', 'Nome', 'Email', 'Cargo', 'Área', 'Unidade', 'Autodomínio', 'Direção', 'Influência', 'Maestria', 'Eixo X', 'Eixo Y', 'Perfil', 'Resposta Aberta'];
  const rows = dadosAdmin.map((d) => [
    d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '',
    d.nome, d.email, d.cargo, d.area, d.unidade,
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

// ─── Atualizar dados ─────────────────────────────────────────────────────────

document.getElementById('btn-atualizar').addEventListener('click', carregarDados);
