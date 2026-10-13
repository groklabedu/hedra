const SUPABASE_URL = 'https://ilpspfqkdgbzvjesdzmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHNwZnFrZGdienZqZXNkem12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTYzNDEsImV4cCI6MjEwNTkzMjM0MX0.4FTajA7ZGARYPs0cxbvQBdmEZP87qk_Ql1UoNO6KTGI';
// Authorization recebe o token do administrador logado (ver onAuthStateChange)
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

// Lido antes de criar o cliente, que limpa o endereço ao processar o link do e-mail
const LINK_EMAIL = new URLSearchParams(window.location.hash.slice(1));

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'implicit', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

let dadosAdmin = [];
let slotsAdmin = {}; // { email: slots }
let chartPizzaAdmin = null;
let sortCol = 'data';
let sortDir = 'desc'; // 'asc' | 'desc'
let listaTabela = []; // registros exibidos na tabela (base + busca + perfil)

function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const PARTICULAS_NOME = ['de', 'da', 'do', 'das', 'dos', 'e', 'di', 'du', 'del', 'van', 'von'];

// Só ajusta nomes digitados todo em maiúsculas ou todo em minúsculas
function nomeExibicao(nome) {
  const t = String(nome ?? '').replace(/\s+/g, ' ').trim();
  if (!/\p{L}/u.test(t) || (t !== t.toUpperCase() && t !== t.toLowerCase())) return t;
  return t.toLowerCase().split(' ').map((p, i) =>
    i > 0 && PARTICULAS_NOME.includes(p) ? p : p.replace(/(^|[-'])(\p{L})/gu, (_, sep, l) => sep + l.toUpperCase())
  ).join(' ');
}

function icone(nome) {
  return `<span class="material-symbols-rounded" aria-hidden="true">${nome}</span>`;
}

function formatarTempo(seg) {
  if (seg == null || isNaN(seg)) return '—';
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2,'0')}s` : `${s}s`;
}

// ─── Login (Supabase Auth) ───────────────────────────────────────────────────

const TELAS_LOGIN = ['form-login', 'form-esqueci', 'form-senha', 'login-sem-acesso', 'login-carregando'];

function mostrarLogin(id) {
  document.getElementById('tela-painel').classList.add('oculto');
  document.getElementById('tela-login').classList.remove('oculto');
  TELAS_LOGIN.forEach((t) => document.getElementById(t).classList.toggle('oculto', t !== id));
  document.querySelectorAll('#tela-login .alerta').forEach((a) => a.classList.add('oculto'));
  document.querySelector(`#${id} input`)?.focus();
}

function mostrarErro(id, texto) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.classList.remove('oculto');
}

function traduzirErroAuth(err) {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('email not confirmed')) return 'Este e-mail ainda não foi confirmado. Use o link do convite.';
  if (msg.includes('should be different')) return 'A nova senha precisa ser diferente da atual.';
  if (msg.includes('password should be at least')) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  return 'Não foi possível concluir. Tente novamente.';
}

function mostrarFormSenha(modo) {
  const alterar = modo === 'alterar';
  document.getElementById('senha-titulo').textContent = alterar ? 'Alterar senha' : 'Defina sua senha';
  document.getElementById('senha-texto').textContent = alterar
    ? 'Escolha uma nova senha para o seu acesso. Use pelo menos 8 caracteres.'
    : 'Crie a senha que você vai usar para entrar no painel. Use pelo menos 8 caracteres.';
  document.getElementById('senha-cancelar').classList.toggle('oculto', !alterar);
  document.getElementById('form-senha').reset();
  mostrarLogin('form-senha');
}

async function entrarNoPainel(session) {
  mostrarLogin('login-carregando');
  SB_HEADERS.Authorization = `Bearer ${session.access_token}`;
  const { data: admin, error } = await sb.rpc('e_admin');
  if (error || admin !== true) {
    await sb.auth.signOut();
    mostrarLogin('login-sem-acesso');
    return;
  }
  document.getElementById('usuario-logado').textContent = session.user.email;
  document.getElementById('tela-login').classList.add('oculto');
  document.getElementById('tela-painel').classList.remove('oculto');
  carregarDados();
  carregarTermoLGPD();
}

sb.auth.onAuthStateChange((evento, session) => {
  SB_HEADERS.Authorization = `Bearer ${session?.access_token || SUPABASE_KEY}`;
  if (evento === 'SIGNED_OUT') {
    dadosAdmin = [];
    mostrarLogin('form-login');
  }
});

document.querySelectorAll('#tela-login [data-ir]').forEach((btn) => {
  btn.addEventListener('click', () => mostrarLogin(btn.dataset.ir));
});

document.getElementById('form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-senha').value;
  if (!email || !password) { mostrarErro('login-erro', 'Preencha o e-mail e a senha.'); return; }
  const btn = e.submitter;
  btn.disabled = true;
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  btn.disabled = false;
  if (error) { mostrarErro('login-erro', traduzirErroAuth(error)); return; }
  document.getElementById('login-senha').value = '';
  entrarNoPainel(data.session);
});

document.getElementById('form-esqueci').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('esqueci-email').value.trim();
  if (!email) return;
  const btn = e.submitter;
  btn.disabled = true;
  await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  btn.disabled = false;
  // Mesma mensagem com ou sem conta, para não revelar quais e-mails existem
  const msg = document.getElementById('esqueci-msg');
  msg.textContent = 'Se este e-mail tiver acesso ao painel, enviamos um link para criar uma nova senha. Confira também a caixa de spam.';
  msg.classList.remove('oculto');
});

document.getElementById('form-senha').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nova = document.getElementById('senha-nova').value;
  const confirma = document.getElementById('senha-confirma').value;
  if (nova.length < 8) { mostrarErro('senha-erro', 'A senha precisa ter pelo menos 8 caracteres.'); return; }
  if (nova !== confirma) { mostrarErro('senha-erro', 'As duas senhas não são iguais.'); return; }
  const btn = e.submitter;
  btn.disabled = true;
  const { error } = await sb.auth.updateUser({ password: nova });
  btn.disabled = false;
  if (error) { mostrarErro('senha-erro', traduzirErroAuth(error)); return; }
  const { data: { session } } = await sb.auth.getSession();
  if (session) entrarNoPainel(session);
  else mostrarLogin('form-login');
});

document.getElementById('senha-cancelar').addEventListener('click', () => {
  document.getElementById('tela-login').classList.add('oculto');
  document.getElementById('tela-painel').classList.remove('oculto');
});

// Menu da conta (alterar senha / sair)
const btnConta = document.getElementById('btn-conta');
const menuConta = document.getElementById('conta-menu');

function abrirMenuConta(abrir) {
  menuConta.classList.toggle('oculto', !abrir);
  btnConta.setAttribute('aria-expanded', String(abrir));
  if (abrir) menuConta.querySelector('button').focus();
}

btnConta.addEventListener('click', () => abrirMenuConta(menuConta.classList.contains('oculto')));
document.addEventListener('click', (e) => {
  if (!menuConta.classList.contains('oculto') && !e.target.closest('.conta')) abrirMenuConta(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menuConta.classList.contains('oculto')) { abrirMenuConta(false); btnConta.focus(); }
});

document.getElementById('btn-alterar-senha').addEventListener('click', () => { abrirMenuConta(false); mostrarFormSenha('alterar'); });
document.getElementById('btn-sair').addEventListener('click', () => { abrirMenuConta(false); sb.auth.signOut(); });

(async function iniciarLogin() {
  mostrarLogin('login-carregando');
  const { data: { session } } = await sb.auth.getSession();
  const tipo = LINK_EMAIL.get('type');

  if (LINK_EMAIL.get('error')) {
    mostrarLogin('form-login');
    mostrarErro('login-erro', 'Este link expirou ou já foi usado. Use "Esqueci minha senha" para receber um novo.');
  } else if (session && (tipo === 'invite' || tipo === 'recovery')) {
    mostrarFormSenha('definir');
  } else if (session) {
    entrarNoPainel(session);
  } else {
    mostrarLogin('form-login');
  }
}());

// ─── Carregar dados ──────────────────────────────────────────────────────────

const INTERVALO_MIN_ATUALIZACAO = 30 * 1000;
let ultimaCarga = 0;

async function carregarDados({ silencioso = false } = {}) {
  const status = document.getElementById('status-carregando');
  if (!silencioso) status.textContent = 'Carregando dados…';

  // Preserva o que estava aberto/selecionado para a atualização não atrapalhar
  const abertos = [...document.querySelectorAll('tr.linha-registro.aberta')].map((tr) => tr.dataset.id);
  const selecionados = [...document.querySelectorAll('.check-linha:checked')].map((cb) => cb.dataset.id);

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
        fone:       row.fone,
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
        respostasQ:     row.respostas_q ?? null,
        consentimentoEm:     row.consentimento_em ?? null,
        consentimentoVersao: row.consentimento_versao ?? null,
        teste:               row.teste === true,
        respostasMantidas:   Array.isArray(row.respostas_mantidas) ? row.respostas_mantidas : null,
      };
    });

    limparSelecao();
    atualizarOpcoesUnidade();
    renderizarPainel();

    abertos.forEach((id) => {
      const tr = document.querySelector(`tr.linha-registro[data-id="${CSS.escape(id)}"]`);
      if (tr) toggleDetalhes(id, tr);
    });
    selecionados.forEach((id) => {
      const cb = document.querySelector(`.check-linha[data-id="${CSS.escape(id)}"]`);
      if (cb) cb.checked = true;
    });
    if (selecionados.length) atualizarBarraSelecao();

    ultimaCarga = Date.now();
    document.getElementById('ultima-atualizacao').textContent =
      `Atualizado às ${new Date(ultimaCarga).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (err) {
    status.textContent = 'Erro de conexão.';
    console.error(err);
  }
}

// ─── Renderizar painel ───────────────────────────────────────────────────────

const PERFIS_LABELS = {
  operador:    { nome: 'Operador Sobrecarregado',         cor: '#f8572d' },
  executor:    { nome: 'Executor Eficiente',              cor: '#1ca31c' },
  comunicador: { nome: 'Comunicador Frágil',              cor: '#8631f4' },
  lider:       { nome: 'Líder de Influência Estratégica', cor: '#ffab24' },
};

// Suporta tanto chave quanto nome completo vindo da planilha
function resolverPerfil(valor) {
  if (PERFIS_LABELS[valor]) return { key: valor, ...PERFIS_LABELS[valor] };
  const entry = Object.entries(PERFIS_LABELS).find(([, v]) => v.nome === valor);
  if (entry) return { key: entry[0], ...entry[1] };
  return { key: valor, nome: valor, cor: '#555' };
}

// ─── Filtros gerais (período, unidade, registros de teste) ───────────────────

function nomeUnidade(d) {
  return (d.empresa || '').replace(/\s+/g, ' ').trim() || 'Não informado';
}

function dentroDoPeriodo(d) {
  const periodo = document.getElementById('filtro-periodo').value;
  if (periodo === 'todos' || !d.data) return periodo === 'todos';
  const data = new Date(d.data);
  if (periodo === 'personalizado') {
    const de  = document.getElementById('filtro-de').value;
    const ate = document.getElementById('filtro-ate').value;
    if (de  && data < new Date(`${de}T00:00:00`)) return false;
    if (ate && data > new Date(`${ate}T23:59:59.999`)) return false;
    return true;
  }
  return data >= new Date(Date.now() - Number(periodo) * 24 * 60 * 60 * 1000);
}

function dadosBase() {
  const unidade = document.getElementById('filtro-unidade').value;
  const mostrarTeste = document.getElementById('filtro-mostrar-teste').checked;
  return dadosAdmin.filter((d) =>
    (mostrarTeste || !d.teste)
    && dentroDoPeriodo(d)
    && (!unidade || chaveUnidade(nomeUnidade(d)) === unidade)
  );
}

function atualizarOpcoesUnidade() {
  const select = document.getElementById('filtro-unidade');
  const atual = select.value;
  const grupos = {};
  dadosAdmin.forEach((d) => {
    const nome = nomeUnidade(d);
    const chave = chaveUnidade(nome);
    grupos[chave] ??= {};
    grupos[chave][nome] = (grupos[chave][nome] || 0) + 1;
  });
  const opcoes = Object.entries(grupos)
    .map(([chave, grafias]) => [chave, Object.entries(grafias).sort((a, b) => b[1] - a[1])[0][0]])
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  select.innerHTML = '<option value="">Todas as unidades</option>'
    + opcoes.map(([chave, nome]) => `<option value="${esc(chave)}">${esc(nome)}</option>`).join('');
  if (opcoes.some(([chave]) => chave === atual)) select.value = atual;
}

document.getElementById('filtro-periodo').addEventListener('change', (e) => {
  document.getElementById('filtro-datas').classList.toggle('oculto', e.target.value !== 'personalizado');
  renderizarPainel();
});
['filtro-de', 'filtro-ate', 'filtro-unidade', 'filtro-mostrar-teste'].forEach((id) => {
  document.getElementById(id).addEventListener('change', renderizarPainel);
});

function renderizarPainel() {
  const base = dadosBase();

  const totalTeste = dadosAdmin.filter((d) => d.teste).length;
  const mostrarTeste = document.getElementById('filtro-mostrar-teste').checked;
  document.getElementById('filtro-resumo').textContent =
    `${base.length} de ${dadosAdmin.length} registros`
    + (totalTeste && !mostrarTeste ? ` · ${totalTeste} de teste oculto${totalTeste > 1 ? 's' : ''}` : '');

  const contadores = { operador: 0, executor: 0, comunicador: 0, lider: 0 };
  base.forEach((d) => { if (contadores[d.perfil] !== undefined) contadores[d.perfil]++; });

  renderizarIndicadores(base, contadores);

  // Gráfico pizza (quantidade de cada perfil na legenda)
  const pizzaDados = Object.entries(PERFIS_LABELS).map(([key, info]) => ({
    label: `${info.nome} · ${contadores[key]}`,
    valor: contadores[key],
    cor: info.cor,
  }));
  if (chartPizzaAdmin) { chartPizzaAdmin.destroy(); }
  chartPizzaAdmin = renderarPizzaAdmin('canvas-pizza', pizzaDados);

  renderizarUnidades(base);
  aplicarFiltros();
}

// ─── Indicadores ──────────────────────────────────────────────────────────────

function renderizarIndicadores(base, contadores) {
  const definir = (id, valor, nota) => {
    document.getElementById(id).textContent = valor;
    document.getElementById(`${id}-nota`).textContent = nota;
  };

  const unidade = document.getElementById('filtro-unidade');
  const periodo = document.getElementById('filtro-periodo');
  const recorte = [
    periodo.value !== 'todos' ? periodo.options[periodo.selectedIndex].text.replace('…', '').toLowerCase() : '',
    unidade.value ? unidade.options[unidade.selectedIndex].text : '',
  ].filter(Boolean).join(' · ');
  definir('kpi-total', base.length, recorte || 'todo o período');

  const limite30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentes = base.filter((d) => d.data && new Date(d.data).getTime() >= limite30).length;
  definir('kpi-30', recentes, base.length ? `${Math.round((recentes / base.length) * 100)}% dos registros listados` : '');

  const tempos = base.map((d) => d.tempoSegundos).filter((t) => Number.isFinite(t) && t > 0);
  const media = tempos.length ? Math.round(tempos.reduce((a, t) => a + t, 0) / tempos.length) : null;
  definir('kpi-tempo', media ? formatarTempo(media) : '—',
    tempos.length ? `média de ${tempos.length} resposta${tempos.length > 1 ? 's' : ''} com tempo registrado` : 'sem tempo registrado');

  const [chave, qtd] = Object.entries(contadores).sort((a, b) => b[1] - a[1])[0] || [];
  const elPerfil = document.getElementById('kpi-perfil');
  if (base.length && qtd) {
    const empate = Object.values(contadores).filter((v) => v === qtd).length > 1;
    definir('kpi-perfil', PERFIS_LABELS[chave].nome,
      `${qtd} participante${qtd > 1 ? 's' : ''} · ${Math.round((qtd / base.length) * 100)}%${empate ? ' · empatado' : ''}`);
    elPerfil.style.color = PERFIS_LABELS[chave].cor;
  } else {
    definir('kpi-perfil', '—', '');
    elPerfil.style.color = '';
  }
}

// ─── Abas ─────────────────────────────────────────────────────────────────────

document.querySelectorAll('.aba').forEach((aba) => {
  aba.addEventListener('click', () => {
    document.querySelectorAll('.aba').forEach((a) => {
      const ativa = a === aba;
      a.classList.toggle('ativa', ativa);
      a.setAttribute('aria-selected', String(ativa));
      document.getElementById(a.dataset.aba).classList.toggle('oculto', !ativa);
    });
  });
});

// ─── Unidades de negócio ─────────────────────────────────────────────────────

const UNIDADES_VISIVEIS = 8;
let mostrarTodasUnidades = false;

function chaveUnidade(nome) {
  return nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function renderizarUnidades(base = dadosBase()) {
  // Agrupa grafias diferentes da mesma empresa (acento, maiúsculas, espaços)
  const grupos = {};
  base.forEach((d) => {
    const original = nomeUnidade(d);
    const chave = chaveUnidade(original);
    grupos[chave] ??= { total: 0, grafias: {} };
    grupos[chave].total++;
    grupos[chave].grafias[original] = (grupos[chave].grafias[original] || 0) + 1;
  });

  const lista = Object.values(grupos)
    .map((g) => ({
      nome: Object.entries(g.grafias).sort((a, b) => b[1] - a[1])[0][0],
      total: g.total,
      variacoes: Object.keys(g.grafias).length,
    }))
    .sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome, 'pt-BR'));

  const maior = lista[0]?.total || 1;
  const visiveis = mostrarTodasUnidades ? lista : lista.slice(0, UNIDADES_VISIVEIS);
  document.getElementById('lista-unidades').innerHTML = visiveis.map((u) => `
    <li title="${u.variacoes > 1 ? `${u.variacoes} grafias agrupadas` : ''}">
      <span class="un-nome">${esc(u.nome)}</span>
      <span class="un-barra"><span style="width:${(u.total / maior) * 100}%"></span></span>
      <span class="un-total">${u.total}</span>
    </li>`).join('');

  const btn = document.getElementById('btn-ver-unidades');
  btn.classList.toggle('oculto', lista.length <= UNIDADES_VISIVEIS);
  btn.textContent = mostrarTodasUnidades ? 'Mostrar menos' : `Ver todas (${lista.length})`;
}

document.getElementById('btn-ver-unidades').addEventListener('click', () => {
  mostrarTodasUnidades = !mostrarTodasUnidades;
  renderizarUnidades();
});

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
  ['data', 'nome'].forEach((col) => {
    const th = document.querySelector(`th[data-sort="${col}"]`);
    if (!th) return;
    const ico = th.querySelector('.sort-ico');
    if (!ico) return;
    ico.textContent = sortCol === col ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more';
  });
}

function badgeSlots(email) {
  const slots = slotsAdmin[email] || 0;
  return slots > 0 ? `<span class="slots-badge" title="${slots} teste(s) liberado(s)">${slots}</span>` : '';
}

function renderizarTabela(dados) {
  const tbody = document.getElementById('tabela-corpo');
  tbody.innerHTML = '';
  dados = ordenarDados(dados);

  const checkTodos = document.getElementById('check-todos');
  if (checkTodos) checkTodos.checked = false;

  if (dados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1rem;">Nenhum registro encontrado.</td></tr>';
    return;
  }

  dados.forEach((d) => {
    const dataStr = d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '—';
    const tr = document.createElement('tr');
    tr.className = d.teste ? 'linha-registro e-teste' : 'linha-registro';
    tr.dataset.id = d.id;
    tr.dataset.email = d.email;
    tr.tabIndex = 0;
    tr.setAttribute('aria-expanded', 'false');
    tr.title = 'Clique para ver os detalhes';
    tr.innerHTML = `
      <td class="col-check">
        <input type="checkbox" class="check-linha" data-id="${esc(d.id)}" title="Selecionar">
      </td>
      <td class="col-data">${dataStr}</td>
      <td class="col-participante">
        <span class="cel-principal">${esc(nomeExibicao(d.nome))}${d.teste ? '<span class="tag-teste">Teste</span>' : ''}</span>
        <span class="cel-secundaria" title="${esc(d.email)}">${esc(d.email).replace('@', '@<wbr>')}</span>
      </td>
      <td class="col-empresa">
        <span class="cel-principal">${esc(d.empresa || '—')}</span>
        <span class="cel-secundaria">${esc(d.cargo || '')}</span>
      </td>
      <td class="col-perfil">
        <span class="badge-perfil" style="background:${d.perfilCor}20;color:${d.perfilCor};border:1px solid ${d.perfilCor}40">${esc(d.perfilNome)}</span>
      </td>
      <td class="col-acoes">
        <span class="acoes-linha">
          <button class="btn-acao btn-pdf2" data-id="${esc(d.id)}" title="Gerar PDF do resultado" aria-label="Gerar PDF do resultado">${icone('picture_as_pdf')}</button>
          <button class="btn-acao btn-liberar" data-email="${esc(d.email)}" data-nome="${esc(nomeExibicao(d.nome))}" title="Liberar novo teste" aria-label="Liberar novo teste">${icone('replay')}${badgeSlots(d.email)}</button>
          <button class="btn-acao btn-lixeira" data-id="${esc(d.id)}" title="Excluir este registro" aria-label="Excluir este registro">${icone('delete')}</button>
          <button class="btn-acao btn-detalhes" title="Ver mais informações" aria-label="Ver mais informações">${icone('expand_more')}</button>
        </span>
      </td>
    `;
    tbody.appendChild(tr);

    tr.addEventListener('click', (e) => {
      if (e.target.closest('button, input')) return;
      toggleDetalhes(d.id, tr);
    });
    tr.querySelector('.btn-detalhes').addEventListener('click', () => toggleDetalhes(d.id, tr));
    tr.addEventListener('keydown', (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target === tr) { e.preventDefault(); toggleDetalhes(d.id, tr); }
    });
  });

  tbody.querySelectorAll('.check-linha').forEach((cb) => {
    cb.addEventListener('change', atualizarBarraSelecao);
  });

  tbody.querySelectorAll('.btn-pdf2').forEach((btn) => {
    btn.addEventListener('click', () => gerarPDFAdminNovo(btn.dataset.id, btn));
  });

  tbody.querySelectorAll('.btn-lixeira').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id   = btn.dataset.id;
      const nome = dadosAdmin.find((d) => d.id === id)?.nome || id;
      confirmarExclusao([id], `Excluir o registro de "${nome}"?`);
    });
  });

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

// ─── Registros de teste ──────────────────────────────────────────────────────

async function marcarComoTeste(ids, valor) {
  const status = document.getElementById('status-carregando');
  status.textContent = valor ? 'Marcando como teste…' : 'Desmarcando…';
  try {
    const idList = ids.map((id) => `"${id}"`).join(',');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/respostas?id=in.(${idList})`, {
      method: 'PATCH',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ teste: valor }),
    });
    if (!res.ok) {
      status.textContent = 'Não foi possível salvar. Verifique se a coluna "teste" foi criada no banco.';
      return;
    }
    dadosAdmin.forEach((d) => { if (ids.includes(d.id)) d.teste = valor; });
    const n = ids.length;
    status.textContent = valor
      ? `${n} registro${n > 1 ? 's' : ''} marcado${n > 1 ? 's' : ''} como teste.`
      : `${n} registro${n > 1 ? 's' : ''} desmarcado${n > 1 ? 's' : ''}.`;
    setTimeout(() => { status.textContent = ''; }, 3000);
    limparSelecao();
    renderizarPainel();
  } catch (err) {
    status.textContent = 'Erro de conexão ao salvar.';
    console.error(err);
  }
}

document.getElementById('btn-marcar-teste-selecionados').addEventListener('click', () => {
  const ids = [...document.querySelectorAll('.check-linha:checked')].map((cb) => cb.dataset.id);
  if (ids.length) marcarComoTeste(ids, true);
});

// ─── Busca e filtro ──────────────────────────────────────────────────────────

document.getElementById('campo-busca').addEventListener('input', aplicarFiltros);
document.getElementById('filtro-perfil').addEventListener('change', aplicarFiltros);

function aplicarFiltros() {
  const busca  = document.getElementById('campo-busca').value.toLowerCase();
  const perfil = document.getElementById('filtro-perfil').value;

  let filtrados = dadosBase();
  if (perfil !== 'todos') filtrados = filtrados.filter((d) => d.perfil === perfil);
  if (busca) {
    filtrados = filtrados.filter((d) =>
      [d.nome, d.email, d.cargo, d.empresa, d.area, d.estado, d.cidade].some((v) =>
        (v || '').toLowerCase().includes(busca)
      )
    );
  }
  listaTabela = filtrados;
  renderizarTabela(filtrados);
}

// ─── Exportar CSV ────────────────────────────────────────────────────────────

document.getElementById('btn-exportar-csv').addEventListener('click', () => {
  const headers = ['Data', 'Nome', 'Email', 'Fone', 'Empresa', 'Cargo', 'Área', 'Estado', 'Cidade', 'Autodomínio', 'Direção', 'Influência', 'Maestria', 'Eixo X', 'Eixo Y', 'Perfil', 'Resposta Aberta', 'Teste'];
  const rows = ordenarDados(listaTabela).map((d) => [
    d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '',
    d.nome, d.email, d.fone || '', d.empresa || '', d.cargo, d.area,
    d.estado || '', d.cidade || '',
    d.autodominio, d.direcao, d.influencia, d.maestria,
    d.eixoX, d.eixoY, d.perfil,
    d.respostaAberta || '',
    d.teste ? 'sim' : '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
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
      document.querySelectorAll(`tr[data-email="${CSS.escape(email)}"] .btn-liberar`).forEach((b) => {
        b.innerHTML = `${icone('replay')}${badgeSlots(email)}`;
      });
    } else {
      status.textContent = 'Erro ao liberar acesso.';
    }
  } catch (err) {
    status.textContent = 'Erro de conexão ao liberar.';
    console.error(err);
  }
}

// ─── Detalhes: respostas individuais ────────────────────────────────────────

function toggleDetalhes(id, tr) {
  const existente = tr.nextElementSibling;
  if (existente && existente.classList.contains('tr-detalhes')) {
    existente.remove();
    tr.classList.remove('aberta');
    tr.setAttribute('aria-expanded', 'false');
    return;
  }

  const d = dadosAdmin.find((r) => r.id === id);
  if (!d) return;

  const local = [d.cidade, d.estado].filter(Boolean).join(' / ') || '—';
  const consentimento = d.consentimentoEm
    ? `${new Date(d.consentimentoEm).toLocaleString('pt-BR')}${d.consentimentoVersao ? ` (versão ${d.consentimentoVersao})` : ''}`
    : 'Não registrado';
  const info = [
    ['Telefone', d.fone || '—'],
    ['Área', d.area || '—'],
    ['Cidade / UF', local],
    ['Tempo de resposta', formatarTempo(d.tempoSegundos)],
    ['Direção (X) / Impacto (Y)', `${Number(d.eixoX).toFixed(0)} / ${Number(d.eixoY).toFixed(0)}`],
    ['Testes liberados', String(slotsAdmin[d.email] || 0)],
    ['Mantidas em 5 pelo aviso', d.respostasMantidas == null ? 'Não registrado' : d.respostasMantidas.length ? `${d.respostasMantidas.length} pergunta${d.respostasMantidas.length > 1 ? 's' : ''}` : 'Nenhuma'],
    ['Consentimento LGPD', consentimento],
  ].map(([k, v]) => `<div class="det-campo"><span class="det-rotulo">${k}</span><span class="det-valor">${esc(v)}</span></div>`).join('');

  const dimensoes = [
    ['Autodomínio', d.autodominio, '#651707'],
    ['Direção',     d.direcao,     '#ffab24'],
    ['Influência',  d.influencia,  '#f8572d'],
    ['Maestria',    d.maestria,    '#037a54'],
  ].map(([nome, valor, cor]) => {
    const v = Math.max(0, Math.min(100, Number(valor) || 0));
    return `<div class="dim-linha">
      <span class="dim-nome">${nome}</span>
      <span class="dim-trilho"><span class="dim-barra" style="width:${v}%;background:${cor}"></span></span>
      <span class="dim-valor" style="color:${cor}">${v}%</span>
    </div>`;
  }).join('');

  let respostasHtml = '';
  if (d.respostasQ) {
    const NOMES_PARTE = ['Na Rotina Real', 'Decisões e Relações', 'Sob Pressão', 'Liderança em Movimento'];
    const perguntas = typeof PERGUNTAS !== 'undefined' ? PERGUNTAS : [];
    const secoes = NOMES_PARTE.map((nome, pi) => {
      const linhas = perguntas.filter((p) => p.parte === pi + 1).map((p) => {
        const val = d.respostasQ[p.id - 1] ?? '—';
        const inv = (p.invertida ? ' <span class="det-inv">(inv)</span>' : '')
          + (d.respostasMantidas?.includes(p.id) ? ' <span class="det-mantida" title="Confirmada em 5 pelo aviso de perguntas pendentes">mantida</span>' : '');
        const cor = val >= 7 ? '#1A6B45' : val >= 4 ? '#B7770D' : '#CC4400';
        return `<tr><td class="det-q-num">${p.id}</td><td class="det-q-texto">${esc(p.texto)}${inv}</td><td class="det-q-val" style="color:${cor}">${esc(val)}</td></tr>`;
      }).join('');
      return `<div class="det-parte"><div class="det-parte-titulo">${nome}</div><table>${linhas}</table></div>`;
    }).join('');
    respostasHtml = `<details class="det-respostas"><summary>Respostas individuais (48)</summary><div class="det-partes">${secoes}</div></details>`;
  }

  const trDet = document.createElement('tr');
  trDet.className = 'tr-detalhes';
  trDet.innerHTML = `<td colspan="6">
    <div class="det-acoes">
      <button type="button" class="btn-marcar-teste">${icone('science')}${d.teste ? 'Desmarcar como teste' : 'Marcar como teste'}</button>
    </div>
    <div class="det-grid">${info}</div>
    <div class="det-dimensoes"><span class="det-rotulo">Dimensões de liderança</span><div class="dim-lista">${dimensoes}</div></div>
    <div class="det-reflexao"><span class="det-rotulo">Reflexão final</span><p>${esc(d.respostaAberta || '—')}</p></div>
    ${respostasHtml}
  </td>`;
  tr.after(trDet);
  trDet.querySelector('.btn-marcar-teste').addEventListener('click', () => marcarComoTeste([d.id], !d.teste));
  tr.classList.add('aberta');
  tr.setAttribute('aria-expanded', 'true');
}

// ─── Gerar PDF de um registro ────────────────────────────────────────────────

async function gerarPDFAdmin(id, btn) {
  const d = dadosAdmin.find((r) => r.id === id);
  if (!d) return;

  btn.classList.add('gerando');
  btn.textContent = '…';

  try {
    const scores = {
      perfil:      d.perfil,
      autodominio: Number(d.autodominio),
      direcao:     Number(d.direcao),
      influencia:  Number(d.influencia),
      maestria:    Number(d.maestria),
      eixoX:       Number(d.eixoX),
      eixoY:       Number(d.eixoY),
    };
    const ud = {
      nome:    d.nome,
      empresa: d.empresa || '',
      cargo:   d.cargo   || '',
    };
    await gerarPDF(scores, ud);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    alert('Erro ao gerar PDF. Verifique o console.');
  } finally {
    btn.classList.remove('gerando');
    btn.textContent = 'PDF';
  }
}

async function gerarPDFAdminNovo(id, btn) {
  const d = dadosAdmin.find((r) => r.id === id);
  if (!d) return;
  btn.classList.add('gerando');
  btn.innerHTML = icone('progress_activity');
  try {
    const scores = {
      perfil:      d.perfil,
      autodominio: Number(d.autodominio),
      direcao:     Number(d.direcao),
      influencia:  Number(d.influencia),
      maestria:    Number(d.maestria),
      eixoX:       Number(d.eixoX),
      eixoY:       Number(d.eixoY),
    };
    const ud = { nome: nomeExibicao(d.nome), empresa: d.empresa || '', cargo: d.cargo || '' };
    await gerarPDFNovo(scores, ud);
  } catch (err) {
    console.error('Erro ao gerar PDF novo:', err);
    alert('Erro ao gerar PDF novo. Verifique o console.');
  } finally {
    btn.classList.remove('gerando');
    btn.innerHTML = icone('picture_as_pdf');
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

// Ao voltar para a aba do navegador, busca os dados de novo (sem recarregar a página)
document.addEventListener('visibilitychange', () => {
  const logado = !document.getElementById('tela-painel').classList.contains('oculto');
  if (document.visibilityState === 'visible' && logado && Date.now() - ultimaCarga > INTERVALO_MIN_ATUALIZACAO) {
    carregarDados({ silencioso: true });
  }
});

// ─── Termo de consentimento (LGPD) ───────────────────────────────────────────

const LGPD_CAMPOS = ['lgpd_cnpj', 'lgpd_email', 'lgpd_compartilhamento', 'lgpd_retencao'];

async function carregarTermoLGPD() {
  const status = document.getElementById('lgpd-status');
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?chave=like.lgpd_*&select=chave,valor`, { headers: SB_HEADERS });
    if (!res.ok) { status.textContent = 'Não foi possível carregar o termo.'; return; }
    const config = Object.fromEntries((await res.json()).map((r) => [r.chave, r.valor]));
    LGPD_CAMPOS.forEach((c) => { document.getElementById(c).value = config[c] || ''; });
    status.textContent = config.lgpd_versao ? `Versão atual: ${config.lgpd_versao}` : 'Termo ainda não preenchido.';
  } catch (err) {
    status.textContent = 'Erro de conexão ao carregar o termo.';
    console.error(err);
  }
}

document.getElementById('btn-salvar-lgpd').addEventListener('click', async () => {
  const btn = document.getElementById('btn-salvar-lgpd');
  const status = document.getElementById('lgpd-status');
  const agora = new Date();
  const versao = `${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const linhas = [
    ...LGPD_CAMPOS.map((c) => ({ chave: c, valor: document.getElementById(c).value.trim() })),
    { chave: 'lgpd_versao', valor: versao },
  ].map((l) => ({ ...l, updated_at: agora.toISOString() }));

  btn.disabled = true;
  status.textContent = 'Salvando…';
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(linhas),
    });
    status.textContent = res.ok ? `Salvo. Versão atual: ${versao}` : 'Erro ao salvar o termo.';
  } catch (err) {
    status.textContent = 'Erro de conexão ao salvar o termo.';
    console.error(err);
  } finally {
    btn.disabled = false;
  }
});
