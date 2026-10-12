const SUPABASE_URL = 'https://ilpspfqkdgbzvjesdzmv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlscHNwZnFrZGdienZqZXNkem12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzNTYzNDEsImV4cCI6MjEwNTkzMjM0MX0.4FTajA7ZGARYPs0cxbvQBdmEZP87qk_Ql1UoNO6KTGI';
const SB_HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const TOTAL_PERGUNTAS = 48;
const PERGUNTAS_POR_BLOCO = 12;

let userData = {};
let respostas = new Array(TOTAL_PERGUNTAS).fill(5);
let respondidas = new Array(TOTAL_PERGUNTAS).fill(false); // pergunta tocada pelo participante
let mantidas = new Set(); // índices confirmados em 5 pelo botão "Manter 5 e continuar"
let respostaAberta = '';
let secaoAtual = 1;
let scoreData = null;
let _pendingSlots = null; // { email, slots } quando o acesso é via slot liberado pelo admin
let _testeInicio = null;  // timestamp (ms) de quando o teste foi iniciado
let _consentimentoEm = null; // ISO de quando o participante aceitou o termo LGPD

// ─── Utilitários ────────────────────────────────────────────────────────────

let CONSENTIMENTO_VERSAO = '1';

async function carregarTermoLGPD() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/configuracoes?chave=like.lgpd_*&select=chave,valor`, { headers: SB_HEADERS });
    if (!res.ok) return;
    const config = Object.fromEntries((await res.json()).map((r) => [r.chave, r.valor]));
    document.querySelectorAll('[data-lgpd]').forEach((el) => {
      const valor = (config[el.dataset.lgpd] || '').trim();
      if (valor) el.textContent = valor;
    });
    if (config.lgpd_versao) CONSENTIMENTO_VERSAO = config.lgpd_versao;
  } catch (err) {
    console.error('Erro ao carregar termo LGPD:', err);
  }
}
carregarTermoLGPD();

const TELAS_COM_MORPH = ['tela-capa', 'tela-intro'];
const ORDEM_TELAS = ['tela-capa', 'tela-intro', 'tela-identificacao', 'tela-teste', 'tela-resultado'];
const DUR_SAIDA = 380;
const SEM_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)');
let _trocaPendente = null;

function animarSaida(elementos, frente, aoTerminar) {
  const classe = frente ? 'saindo-frente' : 'saindo-tras';
  elementos.forEach((el) => el.classList.add(classe));
  const timer = setTimeout(() => {
    _trocaPendente = null;
    elementos.forEach((el) => el.classList.remove('saindo-frente', 'saindo-tras'));
    aoTerminar();
  }, DUR_SAIDA);
  _trocaPendente = () => { clearTimeout(timer); elementos.forEach((el) => el.classList.remove('saindo-frente', 'saindo-tras')); aoTerminar(); };
}

function concluirTrocaPendente() {
  if (!_trocaPendente) return false;
  const f = _trocaPendente;
  _trocaPendente = null;
  f();
  return true;
}

// opcoes.semAnimacao: atalhos de desenvolvimento; opcoes.antes: roda logo antes de exibir a nova tela
function mostrarTela(id, opcoes = {}) {
  const pendente = concluirTrocaPendente();
  const atual = document.body.dataset.tela;
  const trocar = (viaMorph) => {
    if (opcoes.antes) opcoes.antes();
    if (atual === 'tela-capa') document.body.classList.add('capa-vista');
    document.querySelectorAll('.tela').forEach((t) => t.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativa');
    document.body.dataset.tela = id;
    document.body.dataset.via = viaMorph ? 'morph' : '';
    window.scrollTo(0, 0);
  };

  const animar = !opcoes.semAnimacao && !pendente && !SEM_MOVIMENTO.matches && atual !== id;

  if (animar && document.startViewTransition && TELAS_COM_MORPH.includes(atual) && TELAS_COM_MORPH.includes(id)) {
    document.startViewTransition(() => trocar(true)).ready.catch(() => {});
  } else if (animar && document.getElementById(atual)) {
    const frente = ORDEM_TELAS.indexOf(id) >= ORDEM_TELAS.indexOf(atual);
    animarSaida([document.getElementById(atual)], frente, () => trocar(false));
  } else {
    trocar(false);
  }
}

// ─── Capa e introdução ──────────────────────────────────────────────────────

document.getElementById('btn-capa-iniciar').addEventListener('click', () => mostrarTela('tela-intro'));
document.getElementById('btn-intro-voltar').addEventListener('click', () => mostrarTela('tela-capa'));
document.getElementById('btn-intro-continuar').addEventListener('click', () => mostrarTela('tela-identificacao'));
document.getElementById('btn-dados-voltar').addEventListener('click', () => mostrarTela('tela-intro'));

document.getElementById('campo-consentimento').addEventListener('change', () => {
  document.getElementById('msg-consentimento').classList.add('oculto');
});

function atualizarProgressBar(respondidas) {
  const pct = Math.round((respondidas / TOTAL_PERGUNTAS) * 100);
  document.getElementById('progresso-barra').style.width = pct + '%';
  document.getElementById('progresso-texto').textContent = `${respondidas} / ${TOTAL_PERGUNTAS}`;
}

// ─── Tela 1: Identificação ──────────────────────────────────────────────────

document.getElementById('form-identificacao').addEventListener('submit', async (e) => {
  e.preventDefault();

  const campos = ['campo-nome', 'campo-email', 'campo-fone', 'campo-empresa', 'campo-cargo', 'campo-area', 'campo-estado', 'campo-cidade'];
  let valido = true;
  campos.forEach((id) => {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add('campo-erro');
      valido = false;
    } else {
      el.classList.remove('campo-erro');
    }
  });

  if (!valido) {
    document.getElementById('msg-campos-obrigatorios').classList.remove('oculto');
    return;
  }
  document.getElementById('msg-campos-obrigatorios').classList.add('oculto');

  if (!document.getElementById('campo-consentimento').checked) {
    document.getElementById('msg-consentimento').classList.remove('oculto');
    return;
  }
  _consentimentoEm = new Date().toISOString();

  const email = document.getElementById('campo-email').value.trim().toLowerCase();

  document.getElementById('msg-duplicado').classList.add('oculto');
  document.getElementById('opcoes-duplicado').classList.add('oculto');

  const jaFez = JSON.parse(localStorage.getItem('hedra_participantes') || '[]');
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  btnSubmit.textContent = 'Verificando…';
  btnSubmit.disabled = true;

  try {
    // Verifica resultado anterior
    const resRes = await fetch(
      `${SUPABASE_URL}/rest/v1/respostas?email=eq.${encodeURIComponent(email)}&select=*&order=created_at.desc&limit=1`,
      { headers: SB_HEADERS }
    );
    const rows = await resRes.json();
    const temResultado = rows.length > 0;

    if (temResultado) {
      // Verifica se tem slot liberado pelo admin
      const acRes = await fetch(
        `${SUPABASE_URL}/rest/v1/acessos?email=eq.${encodeURIComponent(email)}&select=slots`,
        { headers: SB_HEADERS }
      );
      const acRows = await acRes.json();
      const slots = acRows.length > 0 ? acRows[0].slots : 0;

      if (slots < 1) {
        mostrarBloqueado(email, rows[0]);
        return;
      }
      // Tem slot liberado — registra para consumir após o teste
      _pendingSlots = { email, slots };
      iniciarTeste(email, false);
      return;
    }

    // Primeiro acesso — limpar localStorage legado se existir
    if (jaFez.includes(email)) {
      localStorage.setItem('hedra_participantes',
        JSON.stringify(jaFez.filter((e) => e !== email)));
    }
  } catch (_) {
    if (jaFez.includes(email)) {
      mostrarBloqueado(email, null);
      return;
    }
  } finally {
    btnSubmit.textContent = 'Iniciar inventário →';
    btnSubmit.disabled = false;
  }

  iniciarTeste(email, false);
});

['campo-nome', 'campo-email', 'campo-fone', 'campo-empresa', 'campo-cargo', 'campo-area', 'campo-estado', 'campo-cidade'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id).classList.remove('campo-erro');
    document.getElementById('msg-campos-obrigatorios').classList.add('oculto');
    document.getElementById('msg-duplicado').classList.add('oculto');
    document.getElementById('opcoes-duplicado').classList.add('oculto');
  });
});

function mostrarBloqueado(email, dadosAnteriores) {
  document.getElementById('msg-duplicado').classList.remove('oculto');
  document.getElementById('opcoes-duplicado').classList.remove('oculto');

  // Mensagem atualizada
  const msgEl = document.getElementById('msg-duplicado');
  msgEl.textContent = 'Você já realizou este inventário. Para fazer uma nova avaliação, solicite a liberação ao responsável.';

  document.getElementById('btn-ver-resultado').onclick = () => {
    if (dadosAnteriores) {
      userData = { nome: dadosAnteriores.nome, email, empresa: dadosAnteriores.empresa,
                   cargo: dadosAnteriores.cargo, area: dadosAnteriores.area,
                   estado: dadosAnteriores.estado, cidade: dadosAnteriores.cidade,
                   fone: dadosAnteriores.fone || '' };
      scoreData = {
        autodominio: Number(dadosAnteriores.autodominio),
        direcao:     Number(dadosAnteriores.direcao),
        influencia:  Number(dadosAnteriores.influencia),
        maestria:    Number(dadosAnteriores.maestria),
        eixoX:       Number(dadosAnteriores.eixo_x),
        eixoY:       Number(dadosAnteriores.eixo_y),
        perfil:      dadosAnteriores.perfil,
      };
      mostrarTela('tela-resultado', { antes: () => renderizarResultado(scoreData) });
    } else {
      alert('Não foi possível recuperar o resultado anterior.');
    }
  };

  // Esconder botão "Refazer" — substituído pelo sistema de slots
  document.getElementById('btn-refazer').style.display = 'none';
}

function iniciarTeste(email, override) {
  userData = {
    nome:    document.getElementById('campo-nome').value.trim(),
    email,
    fone:    document.getElementById('campo-fone').value.trim(),
    empresa: document.getElementById('campo-empresa').value.trim(),
    cargo:   document.getElementById('campo-cargo').value.trim(),
    area:    document.getElementById('campo-area').value.trim(),
    estado:  document.getElementById('campo-estado').value.trim(),
    cidade:  document.getElementById('campo-cidade').value.trim(),
    override: !!override,
    consentimento_em: _consentimentoEm,
  };

  secaoAtual = 1;
  respostas = new Array(TOTAL_PERGUNTAS).fill(5);
  respondidas = new Array(TOTAL_PERGUNTAS).fill(false);
  mantidas = new Set();
  _testeInicio = Date.now();
  mostrarTela('tela-teste', { antes: () => renderizarSecao(1) });
}

// ─── Tela 2: Teste ──────────────────────────────────────────────────────────

function renderizarSecao(secao) {
  document.querySelector('#tela-teste .instrucao-box').classList.remove('oculto');
  const parte    = PARTES[secao - 1];
  const perguntas = PERGUNTAS.filter((p) => p.parte === secao);
  const offset   = (secao - 1) * PERGUNTAS_POR_BLOCO;

  document.getElementById('secao-titulo').textContent = `Parte ${secao} de 4 — ${parte.titulo}`;
  document.getElementById('secao-descricao').textContent = parte.descricao;

  const container = document.getElementById('perguntas-container');
  container.innerHTML = '';

  perguntas.forEach((p, idx) => {
    const i   = offset + idx;
    const val = respostas[i];
    const item = document.createElement('div');
    item.className = respondidas[i] ? 'pergunta-item respondida' : 'pergunta-item';
    item.innerHTML = `
      <p class="pergunta-texto"><span class="pergunta-num">${p.id}.</span> ${p.texto}</p>
      <div class="slider-wrapper">
        <span class="slider-label">0</span>
        <input type="range" class="slider" min="0" max="10" step="1"
          value="${val}" data-index="${i}" aria-label="Pergunta ${p.id}">
        <span class="slider-label">10</span>
        <span class="slider-valor" id="val-${i}">${val}</span>
      </div>
      <div class="slider-escala">
        <span>Nunca</span><span>Às vezes</span><span>Sempre</span>
      </div>
    `;
    container.appendChild(item);
  });

  container.querySelectorAll('.slider').forEach((input) => {
    const idx = parseInt(input.dataset.index);
    const item = input.closest('.pergunta-item');
    input.addEventListener('input', () => {
      respostas[idx] = parseInt(input.value);
      document.getElementById('val-' + idx).textContent = input.value;
      registrarInteracao(idx, item);
    });
    // Tocar e soltar sem mudar o valor (ex.: manter o 5) também conta como resposta;
    // pointerup não dispara quando o toque vira rolagem da página
    input.addEventListener('pointerup', () => registrarInteracao(idx, item));
    input.addEventListener('click', () => registrarInteracao(idx, item));
  });

  esconderAvisoPendentes();
  atualizarContador();


  document.getElementById('btn-avancar').textContent =
    secao < 4 ? 'Próxima parte →' : 'Continuar →';

  atualizarBotaoVoltar();

  document.querySelectorAll('.step-indicator').forEach((el, i) => {
    el.classList.toggle('ativo', i + 1 === secao);
    el.classList.toggle('concluido', i + 1 < secao);
  });

  window.scrollTo(0, 0);
}

function indicesDaSecao() {
  const offset = (secaoAtual - 1) * PERGUNTAS_POR_BLOCO;
  return Array.from({ length: PERGUNTAS_POR_BLOCO }, (_, k) => offset + k);
}

function pendentesDaSecao() {
  return secaoAtual <= 4 ? indicesDaSecao().filter((i) => !respondidas[i]) : [];
}

function itemDaPergunta(i) {
  return document.getElementById('val-' + i)?.closest('.pergunta-item');
}

function registrarInteracao(i, item) {
  mantidas.delete(i);
  marcarRespondida(i, item);
}

function marcarRespondida(i, item) {
  if (respondidas[i]) return;
  respondidas[i] = true;
  item.classList.add('respondida');
  item.classList.remove('pendente');
  atualizarContador();
}

function atualizarContador() {
  const el = document.getElementById('contador-respostas');
  if (secaoAtual > 4) { el.classList.add('oculto'); return; }
  const total = PERGUNTAS_POR_BLOCO;
  const feitas = total - pendentesDaSecao().length;
  atualizarProgressBar(respondidas.filter(Boolean).length);
  el.classList.remove('oculto');
  el.classList.toggle('completo', feitas === total);
  el.textContent = feitas === total ? `✓ Todas as ${total} perguntas desta parte respondidas` : `${feitas} de ${total} perguntas respondidas nesta parte`;
  if (feitas === total) esconderAvisoPendentes();
}

function mostrarAvisoPendentes(pendentes) {
  const n = pendentes.length;
  document.getElementById('aviso-pendentes-texto').textContent = n === 1
    ? 'Falta 1 pergunta sem resposta nesta parte. Você pode respondê-la ou manter o valor 5 (às vezes).'
    : `Faltam ${n} perguntas sem resposta nesta parte. Você pode respondê-las ou manter o valor 5 (às vezes).`;
  pendentes.forEach((i) => itemDaPergunta(i)?.classList.add('pendente'));
  document.getElementById('aviso-pendentes').classList.remove('oculto');
}

function esconderAvisoPendentes() {
  document.getElementById('aviso-pendentes').classList.add('oculto');
}

document.getElementById('btn-ver-pendente').addEventListener('click', () => {
  const item = itemDaPergunta(pendentesDaSecao()[0]);
  if (!item) return;
  item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  item.classList.remove('pulsa');
  void item.offsetWidth;
  item.classList.add('pulsa');
});

document.getElementById('btn-manter-5').addEventListener('click', () => {
  pendentesDaSecao().forEach((i) => {
    respondidas[i] = true;
    mantidas.add(i);
    const item = itemDaPergunta(i);
    item?.classList.remove('pendente');
    item?.classList.add('respondida');
  });
  esconderAvisoPendentes();
  avancarSecao();
});

function atualizarBotaoVoltar() {
  const btn = document.getElementById('btn-voltar');
  btn.style.display = secaoAtual > 1 ? '' : 'none';
}

function trocarSecao(frente, renderizar, extras = []) {
  concluirTrocaPendente();
  const header = document.querySelector('#tela-teste .secao-header');
  const perguntas = document.getElementById('perguntas-container');
  const exibir = () => {
    renderizar();
    atualizarBotaoVoltar();
  };
  if (SEM_MOVIMENTO.matches) exibir();
  else animarSaida([...extras, header, perguntas], frente, exibir);
}

function avancarSecao() {
  if (_trocaPendente) return;
  const pendentes = pendentesDaSecao();
  if (pendentes.length) {
    mostrarAvisoPendentes(pendentes);
    return;
  }
  if (secaoAtual < 4) {
    secaoAtual++;
    trocarSecao(true, () => renderizarSecao(secaoAtual));
  } else if (secaoAtual === 4) {
    secaoAtual = 5;
    trocarSecao(true, mostrarPerguntaAberta, [document.querySelector('#tela-teste .instrucao-box')]);
  } else if (secaoAtual === 5) {
    finalizarTeste();
  }
}

document.getElementById('btn-avancar').addEventListener('click', avancarSecao);

document.getElementById('btn-voltar').addEventListener('click', () => {
  if (_trocaPendente) return;
  if (secaoAtual === 5) {
    secaoAtual = 4;
    trocarSecao(false, () => renderizarSecao(4));
  } else if (secaoAtual > 1) {
    secaoAtual--;
    trocarSecao(false, () => renderizarSecao(secaoAtual));
  }
});

// ─── Pergunta aberta ────────────────────────────────────────────────────────

function mostrarPerguntaAberta() {
  document.querySelector('#tela-teste .instrucao-box').classList.add('oculto');
  esconderAvisoPendentes();
  atualizarContador();
  atualizarProgressBar(TOTAL_PERGUNTAS);
  document.getElementById('secao-titulo').textContent = 'Reflexão final';
  document.getElementById('secao-descricao').textContent = '';

  document.querySelectorAll('.step-indicator').forEach((el) => el.classList.add('concluido'));

  const container = document.getElementById('perguntas-container');
  container.innerHTML = `
    <div class="pergunta-item">
      <p class="pergunta-texto" style="font-weight:600;margin-bottom:16px">
        Hoje, em qual quadrante da liderança você acredita estar?
      </p>

      <div class="quadrantes-preview">
        <div class="qp-eixo-y">↑ Impacto</div>
        <div class="qp-grid">
          <div class="qp-cell" style="border-color:#8631f440;color:#8631f4">
            <strong>Comunicador Frágil</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Tenho boa relação com o time, mas nem sempre consigo direcionar com firmeza."</span>
          </div>
          <div class="qp-cell" style="border-color:#ffab2440;color:#ffab24">
            <strong>Líder de Influência Estratégica</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Eu defino direção, mobilizo pessoas e desenvolvo autonomia no time."</span>
          </div>
          <div class="qp-cell" style="border-color:#f8572d40;color:#f8572d">
            <strong>Operador Sobrecarregado</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Faço tudo, resolvo tudo... e ainda sinto que nada sai do lugar."</span>
          </div>
          <div class="qp-cell" style="border-color:#1ca31c40;color:#1ca31c">
            <strong>Executor Eficiente</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Eu garanto a entrega, mas ainda carrego o time nas costas."</span>
          </div>
        </div>
        <div class="qp-eixo-x">Direção →</div>
      </div>

      <textarea id="campo-aberta" rows="3"
        placeholder="Escreva aqui sua percepção…"
        maxlength="1000"
        style="margin-top:16px"></textarea>
    </div>
  `;

  document.getElementById('btn-avancar').textContent = 'Ver meu resultado →';
}

// ─── Finalizar ───────────────────────────────────────────────────────────────

async function finalizarTeste() {
  const campoAberta = document.getElementById('campo-aberta');
  respostaAberta = campoAberta ? campoAberta.value.trim() : '';

  scoreData = calcularScore(respostas);

  mostrarTela('tela-resultado', { antes: () => renderizarResultado(scoreData) });

  enviarDados();
}

async function enviarDados() {
  const payload = {
    nome:            userData.nome,
    email:           userData.email,
    fone:            userData.fone,
    empresa:         userData.empresa,
    cargo:           userData.cargo,
    area:            userData.area,
    estado:          userData.estado,
    cidade:          userData.cidade,
    autodominio:     scoreData.autodominio,
    direcao:         scoreData.direcao,
    influencia:      scoreData.influencia,
    maestria:        scoreData.maestria,
    eixo_x:          scoreData.eixoX,
    eixo_y:          scoreData.eixoY,
    perfil:          scoreData.perfil,
    perfil_nome:     PERFIS[scoreData.perfil].nome,
    resposta_aberta: respostaAberta,
    tempo_segundos:  _testeInicio ? Math.round((Date.now() - _testeInicio) / 1000) : null,
    respostas_q:     [...respostas],
    respostas_mantidas: [...mantidas].sort((a, b) => a - b).map((i) => i + 1),
    consentimento_em:     userData.consentimento_em,
    consentimento_versao: CONSENTIMENTO_VERSAO,
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/respostas`, {
      method: 'POST',
      headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const jaFez = JSON.parse(localStorage.getItem('hedra_participantes') || '[]');
      if (!jaFez.includes(userData.email)) {
        jaFez.push(userData.email);
        localStorage.setItem('hedra_participantes', JSON.stringify(jaFez));
      }

      // Consumir slot se o acesso foi liberado pelo admin
      if (_pendingSlots && _pendingSlots.email === userData.email) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/acessos?email=eq.${encodeURIComponent(userData.email)}`,
          {
            method: 'PATCH',
            headers: { ...SB_HEADERS, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ slots: _pendingSlots.slots - 1 }),
          }
        );
        _pendingSlots = null;
      }
    }
  } catch (err) {
    console.error('Erro ao enviar dados:', err);
  }
}

// ─── Tela 3: Resultado paginado ──────────────────────────────────────────────

function renderizarResultado(scores) {
  inicializarNavResultado();
  renderizarResultadoPaginado(scores, userData.nome || '');
}

// Exportação via botões dentro da página 5 (ligados em resultado.js → renderP5)

// ─── Preview de desenvolvimento (?preview=operador|executor|comunicador|lider) ──

(function () {
  const p = new URLSearchParams(window.location.search).get('preview');

  const mocks = {
    operador:    { autodominio: 55, direcao: 45, influencia: 50, maestria: 48, eixoX: 45, eixoY: 49, perfil: 'operador' },
    executor:    { autodominio: 65, direcao: 78, influencia: 50, maestria: 55, eixoX: 78, eixoY: 52, perfil: 'executor' },
    comunicador: { autodominio: 60, direcao: 45, influencia: 75, maestria: 72, eixoX: 45, eixoY: 73, perfil: 'comunicador' },
    lider:       { autodominio: 75, direcao: 80, influencia: 78, maestria: 72, eixoX: 80, eixoY: 75, perfil: 'lider'      },
  };

  if (!p || !mocks[p]) return;

  userData  = { nome: 'Preview Dev' };
  scoreData = mocks[p];
  renderizarResultado(scoreData);
  mostrarTela('tela-resultado', { semAnimacao: true });

  // Barra flutuante para trocar perfil rapidamente
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;bottom:80px;right:16px;z-index:9999;background:#1A1A1A;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:5px;box-shadow:0 4px 20px rgba(0,0,0,.45)';

  const lbl = document.createElement('span');
  lbl.textContent = '⚙ Preview';
  lbl.style.cssText = 'color:#666;font-size:10px;text-transform:uppercase;letter-spacing:.06em;padding:0 2px';
  bar.appendChild(lbl);

  Object.keys(mocks).forEach((key) => {
    const btn = document.createElement('button');
    btn.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    btn.style.cssText = `background:${key === p ? '#C8961A' : '#333'};color:#fff;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:11px;font-weight:700;text-align:left`;
    btn.onclick = () => {
      const u = new URL(location.href);
      u.searchParams.set('preview', key);
      location.href = u.toString();
    };
    bar.appendChild(btn);
  });

  document.body.appendChild(bar);
}());

// ─── Dev shortcut (?skip) — pula o formulário de identificação ───────────────

(function () {
  if (!new URLSearchParams(window.location.search).has('skip')) return;

  document.addEventListener('DOMContentLoaded', function () {
    userData = {
      nome:     'Dev Test',
      email:    'dev@teste.local',
      fone:     '(11) 99999-9999',
      empresa:  'Empresa Teste',
      cargo:    'Cargo Teste',
      area:     'Área Teste',
      estado:   'SP',
      cidade:   'São Paulo',
      override: false,
    };

    secaoAtual = 1;
    respostas = new Array(TOTAL_PERGUNTAS).fill(5);
    respondidas = new Array(TOTAL_PERGUNTAS).fill(false);
    mantidas = new Set();
    _testeInicio = Date.now();
    renderizarSecao(1);
    mostrarTela('tela-teste', { semAnimacao: true });
  });
}());
