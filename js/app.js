// Configurar a URL do Apps Script após publicar o Web App
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnnMhv-1cccHQfx8b-ODYOFM7BGo0J4pcVoi597-UxWtlUsWEv7AkkI_KN9Bxw2mE8/exec';

// Estado da aplicação
let userData = {};
let respostas = new Array(40).fill(5);
let respostaAberta = '';
let secaoAtual = 1;
let scoreData = null;

// ─── Utilitários ────────────────────────────────────────────────────────────

function mostrarTela(id) {
  document.querySelectorAll('.tela').forEach((t) => t.classList.remove('ativa'));
  document.getElementById(id).classList.add('ativa');
  window.scrollTo(0, 0);
}

function atualizarProgressBar(respondidas) {
  const pct = Math.round((respondidas / 40) * 100);
  document.getElementById('progresso-barra').style.width = pct + '%';
  document.getElementById('progresso-texto').textContent = `${respondidas} / 40`;
}

// ─── Tela 1: Identificação ──────────────────────────────────────────────────

document.getElementById('form-identificacao').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('campo-email').value.trim().toLowerCase();

  // Verificação localStorage
  const jaFez = JSON.parse(localStorage.getItem('hedra_participantes') || '[]');
  if (jaFez.includes(email)) {
    document.getElementById('msg-duplicado').classList.remove('oculto');
    return;
  }

  userData = {
    nome:     document.getElementById('campo-nome').value.trim(),
    email,
    cargo:    document.getElementById('campo-cargo').value.trim(),
    area:     document.getElementById('campo-area').value.trim(),
    unidade:  document.getElementById('campo-unidade').value.trim(),
  };

  secaoAtual = 1;
  respostas = new Array(40).fill(5);
  renderizarSecao(1);
  mostrarTela('tela-teste');
});

document.getElementById('campo-email').addEventListener('input', () => {
  document.getElementById('msg-duplicado').classList.add('oculto');
});

// ─── Tela 2: Teste ──────────────────────────────────────────────────────────

function renderizarSecao(secao) {
  const parte = PARTES[secao - 1];
  const perguntas = PERGUNTAS.filter((p) => p.parte === secao);
  const offset = (secao - 1) * 10;

  document.getElementById('secao-titulo').textContent = `Parte ${secao} de 4 — ${parte.titulo}`;
  document.getElementById('secao-descricao').textContent = parte.descricao;

  const container = document.getElementById('perguntas-container');
  container.innerHTML = '';

  perguntas.forEach((p, idx) => {
    const i = offset + idx;
    const val = respostas[i];
    const item = document.createElement('div');
    item.className = 'pergunta-item';
    item.innerHTML = `
      <p class="pergunta-texto"><span class="pergunta-num">${p.id}.</span> ${p.texto}</p>
      <div class="slider-wrapper">
        <span class="slider-label">0</span>
        <input
          type="range"
          class="slider"
          min="0" max="10" step="1"
          value="${val}"
          data-index="${i}"
          aria-label="Pergunta ${p.id}"
        >
        <span class="slider-label">10</span>
        <span class="slider-valor" id="val-${i}">${val}</span>
      </div>
      <div class="slider-escala">
        <span>Nunca</span>
        <span>Às vezes</span>
        <span>Sempre</span>
      </div>
    `;
    container.appendChild(item);
  });

  // Eventos dos sliders
  container.querySelectorAll('.slider').forEach((input) => {
    const idx = parseInt(input.dataset.index);
    input.addEventListener('input', () => {
      respostas[idx] = parseInt(input.value);
      document.getElementById('val-' + idx).textContent = input.value;
      const respondidas = respostas.filter((_, j) => Math.floor(j / 10) < secaoAtual - 1
        ? true
        : j < offset + 10
      ).length;
      atualizarProgressBar(Math.min(offset + 10, 40));
    });
  });

  // Progresso
  atualizarProgressBar(offset);

  // Botão avançar
  const btnAvançar = document.getElementById('btn-avancar');
  if (secao < 4) {
    btnAvançar.textContent = `Próxima parte →`;
  } else {
    btnAvançar.textContent = 'Continuar →';
  }

  // Indicadores de passo
  document.querySelectorAll('.step-indicator').forEach((el, i) => {
    el.classList.toggle('ativo', i + 1 === secao);
    el.classList.toggle('concluido', i + 1 < secao);
  });

  window.scrollTo(0, 0);
}

document.getElementById('btn-avancar').addEventListener('click', () => {
  if (secaoAtual < 4) {
    secaoAtual++;
    renderizarSecao(secaoAtual);
  } else {
    // Exibir pergunta aberta
    mostrarPerguntaAberta();
  }
});

// ─── Pergunta aberta ────────────────────────────────────────────────────────

function mostrarPerguntaAberta() {
  atualizarProgressBar(40);
  document.getElementById('secao-titulo').textContent = 'Reflexão final';
  document.getElementById('secao-descricao').textContent = '';

  const container = document.getElementById('perguntas-container');
  container.innerHTML = `
    <div class="pergunta-aberta-wrapper">
      <p class="pergunta-aberta-label">
        Hoje, em qual quadrante da liderança você acredita estar?
      </p>
      <textarea
        id="campo-aberta"
        rows="4"
        placeholder="Escreva sua percepção aqui…"
        maxlength="1000"
      ></textarea>
    </div>
  `;

  document.querySelectorAll('.step-indicator').forEach((el) => el.classList.add('concluido'));

  const btn = document.getElementById('btn-avancar');
  btn.textContent = 'Ver meu resultado →';
  btn.onclick = finalizarTeste;
}

// ─── Finalizar e calcular ───────────────────────────────────────────────────

async function finalizarTeste() {
  const campoAberta = document.getElementById('campo-aberta');
  respostaAberta = campoAberta ? campoAberta.value.trim() : '';

  scoreData = calcularScore(respostas);

  // Exibir resultado imediatamente
  renderizarResultado(scoreData);
  mostrarTela('tela-resultado');

  // Enviar ao Apps Script em background
  enviarDados();
}

async function enviarDados() {
  if (APPS_SCRIPT_URL === 'COLE_AQUI_A_URL_DO_APPS_SCRIPT') return;

  const payload = {
    ...userData,
    ...scoreData,
    respostaAberta,
  };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (json.status === 'duplicate') {
      // Já foi salvo; ignorar silenciosamente (localStorage pode ter sido limpo)
      return;
    }

    if (json.status === 'ok') {
      // Marcar no localStorage
      const jaFez = JSON.parse(localStorage.getItem('hedra_participantes') || '[]');
      if (!jaFez.includes(userData.email)) {
        jaFez.push(userData.email);
        localStorage.setItem('hedra_participantes', JSON.stringify(jaFez));
      }
    }
  } catch (err) {
    console.error('Erro ao enviar dados:', err);
  }
}

// ─── Tela 3: Resultado ──────────────────────────────────────────────────────

function renderizarResultado(scores) {
  const perfil = PERFIS[scores.perfil];

  // Cabeçalho do perfil
  const nomePerfil = document.getElementById('perfil-nome');
  nomePerfil.textContent = perfil.nome;
  nomePerfil.style.color = perfil.cor;

  document.getElementById('perfil-descricao').textContent = perfil.descricao;

  // Porcentagens das dimensões
  document.getElementById('pct-autodominio').textContent = scores.autodominio + '%';
  document.getElementById('pct-direcao').textContent     = scores.direcao + '%';
  document.getElementById('pct-influencia').textContent  = scores.influencia + '%';
  document.getElementById('pct-maestria').textContent    = scores.maestria + '%';

  // Renderizar gráficos após o DOM estar visível (rAF duplo garante paint)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderarMapaHEDRA('canvas-mapa', scores.eixoX, scores.eixoY, scores.perfil);
      renderarDimensoes('canvas-dimensoes', scores);
    });
  });
}

// ─── Botões de exportação ───────────────────────────────────────────────────

document.getElementById('btn-exportar-png').addEventListener('click', exportarPNG);
document.getElementById('btn-exportar-pdf').addEventListener('click', exportarPDF);
