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
let respostaAberta = '';
let secaoAtual = 1;
let scoreData = null;
let _pendingSlots = null; // { email, slots } quando o acesso é via slot liberado pelo admin
let _testeInicio = null;  // timestamp (ms) de quando o teste foi iniciado

// ─── Utilitários ────────────────────────────────────────────────────────────

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach((t) => t.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
  window.scrollTo(0, 0);
}

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
      renderizarResultado(scoreData);
      mostrarTela('tela-resultado');
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
  };

  secaoAtual = 1;
  respostas = new Array(TOTAL_PERGUNTAS).fill(5);
  _testeInicio = Date.now();
  renderizarSecao(1);
  mostrarTela('tela-teste');
}

// ─── Tela 2: Teste ──────────────────────────────────────────────────────────

function renderizarSecao(secao) {
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
    item.className = 'pergunta-item';
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
    input.addEventListener('input', () => {
      respostas[idx] = parseInt(input.value);
      document.getElementById('val-' + idx).textContent = input.value;
    });
  });

  atualizarProgressBar(offset);

  document.getElementById('btn-avancar').textContent =
    secao < 4 ? 'Próxima parte →' : 'Continuar →';

  atualizarBotaoVoltar();

  document.querySelectorAll('.step-indicator').forEach((el, i) => {
    el.classList.toggle('ativo', i + 1 === secao);
    el.classList.toggle('concluido', i + 1 < secao);
  });

  window.scrollTo(0, 0);
}

function atualizarBotaoVoltar() {
  const btn = document.getElementById('btn-voltar');
  btn.style.display = secaoAtual > 1 ? '' : 'none';
}

document.getElementById('btn-avancar').addEventListener('click', () => {
  if (secaoAtual < 4) {
    secaoAtual++;
    renderizarSecao(secaoAtual);
  } else if (secaoAtual === 4) {
    secaoAtual = 5;
    mostrarPerguntaAberta();
  } else if (secaoAtual === 5) {
    finalizarTeste();
  }
  atualizarBotaoVoltar();
});

document.getElementById('btn-voltar').addEventListener('click', () => {
  if (secaoAtual === 5) {
    secaoAtual = 4;
    renderizarSecao(4);
  } else if (secaoAtual > 1) {
    secaoAtual--;
    renderizarSecao(secaoAtual);
  }
  atualizarBotaoVoltar();
});

// ─── Pergunta aberta ────────────────────────────────────────────────────────

function mostrarPerguntaAberta() {
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
          <div class="qp-cell" style="border-color:#B7770D40;color:#B7770D">
            <strong>Comunicador Frágil</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Tenho boa relação com o time, mas nem sempre consigo direcionar com firmeza."</span>
          </div>
          <div class="qp-cell" style="border-color:#1A6B4540;color:#1A6B45">
            <strong>Líder de Influência Estratégica</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Eu defino direção, mobilizo pessoas e desenvolvo autonomia no time."</span>
          </div>
          <div class="qp-cell" style="border-color:#CC440040;color:#CC4400">
            <strong>Operador Sobrecarregado</strong><br>
            <span style="font-weight:400;font-size:0.75rem">"Faço tudo, resolvo tudo... e ainda sinto que nada sai do lugar."</span>
          </div>
          <div class="qp-cell" style="border-color:#1A527640;color:#1A5276">
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

  renderizarResultado(scoreData);
  mostrarTela('tela-resultado');

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
  mostrarTela('tela-resultado');

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
    _testeInicio = Date.now();
    renderizarSecao(1);
    mostrarTela('tela-teste');
  });
}());
