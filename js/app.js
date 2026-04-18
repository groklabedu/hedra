const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbylXejuMSFfudVko4KNyECI18LgDCcu7WN4tWgmnE8zUiAqhwCHjUinJkEwyJMnbuT4/exec';

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

document.getElementById('form-identificacao').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validar campos obrigatórios
  const campos = ['campo-nome', 'campo-email', 'campo-cargo', 'campo-area', 'campo-unidade'];
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

  // Esconder mensagens anteriores
  document.getElementById('msg-duplicado').classList.add('oculto');
  document.getElementById('opcoes-duplicado').classList.add('oculto');

  // Verificar localStorage e servidor
  const jaFez = JSON.parse(localStorage.getItem('hedra_participantes') || '[]');
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  btnSubmit.textContent = 'Verificando…';
  btnSubmit.disabled = true;

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=getByEmail&email=${encodeURIComponent(email)}`);
    const json = await res.json();
    if (json.status === 'found') {
      mostrarOpcoesDuplicado(email, json.data);
      return;
    }
    // Não está no servidor; se estava no localStorage, limpar entrada obsoleta
    if (jaFez.includes(email)) {
      const atualizado = jaFez.filter((e) => e !== email);
      localStorage.setItem('hedra_participantes', JSON.stringify(atualizado));
    }
  } catch (_) {
    // Falha na conexão: usar localStorage como fallback
    if (jaFez.includes(email)) {
      mostrarOpcoesDuplicado(email, null);
      return;
    }
  } finally {
    btnSubmit.textContent = 'Iniciar inventário →';
    btnSubmit.disabled = false;
  }

  iniciarTeste(email, false);
});

// Limpar erros ao digitar
['campo-nome', 'campo-email', 'campo-cargo', 'campo-area', 'campo-unidade'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id).classList.remove('campo-erro');
    document.getElementById('msg-campos-obrigatorios').classList.add('oculto');
    document.getElementById('msg-duplicado').classList.add('oculto');
    document.getElementById('opcoes-duplicado').classList.add('oculto');
  });
});

function mostrarOpcoesDuplicado(email, dadosAnteriores) {
  document.getElementById('msg-duplicado').classList.remove('oculto');
  document.getElementById('opcoes-duplicado').classList.remove('oculto');

  document.getElementById('btn-ver-resultado').onclick = () => {
    if (dadosAnteriores) {
      scoreData = {
        autodominio: Number(dadosAnteriores.autodominio),
        direcao:     Number(dadosAnteriores.direcao),
        influencia:  Number(dadosAnteriores.influencia),
        maestria:    Number(dadosAnteriores.maestria),
        eixoX:       Number(dadosAnteriores.eixoX),
        eixoY:       Number(dadosAnteriores.eixoY),
        perfil:      dadosAnteriores.perfilKey,
      };
      renderizarResultado(scoreData);
      mostrarTela('tela-resultado');
    } else {
      alert('Não foi possível recuperar o resultado anterior. Tente refazer o teste.');
    }
  };

  document.getElementById('btn-refazer').onclick = () => {
    document.getElementById('msg-duplicado').classList.add('oculto');
    document.getElementById('opcoes-duplicado').classList.add('oculto');
    iniciarTeste(email, true);
  };
}

function iniciarTeste(email, override) {
  userData = {
    nome:     document.getElementById('campo-nome').value.trim(),
    email,
    cargo:    document.getElementById('campo-cargo').value.trim(),
    area:     document.getElementById('campo-area').value.trim(),
    unidade:  document.getElementById('campo-unidade').value.trim(),
    override: !!override,
  };

  secaoAtual = 1;
  respostas = new Array(40).fill(5);
  renderizarSecao(1);
  mostrarTela('tela-teste');
}

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

// Avançar
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

// Voltar
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
  atualizarProgressBar(40);
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
            Comunicador<br>Frágil
          </div>
          <div class="qp-cell" style="border-color:#1A6B4540;color:#1A6B45">
            Líder de<br>Influência Estratégica
          </div>
          <div class="qp-cell" style="border-color:#CC440040;color:#CC4400">
            Operador<br>Sobrecarregado
          </div>
          <div class="qp-cell" style="border-color:#1A527640;color:#1A5276">
            Executor<br>Eficiente
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
    ...userData,
    ...scoreData,
    perfilNome: PERFIS[scoreData.perfil].nome,
    respostaAberta,
  };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();

    if (json.status === 'ok') {
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

// ─── Tela 3: Resultado ───────────────────────────────────────────────────────

function renderizarResultado(scores) {
  const perfil = PERFIS[scores.perfil];

  const nomePerfil = document.getElementById('perfil-nome');
  nomePerfil.textContent = perfil.nome;
  nomePerfil.style.color = perfil.cor;

  document.getElementById('perfil-descricao').textContent = perfil.descricao;

  document.getElementById('pct-autodominio').textContent = scores.autodominio + '%';
  document.getElementById('pct-direcao').textContent     = scores.direcao + '%';
  document.getElementById('pct-influencia').textContent  = scores.influencia + '%';
  document.getElementById('pct-maestria').textContent    = scores.maestria + '%';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderarMapaHEDRA('canvas-mapa', scores.eixoX, scores.eixoY, scores.perfil);
      renderarDimensoes('canvas-dimensoes', scores);
      renderarRosquinha('canvas-rosquinha', scores, scores.perfil);
    });
  });
}

// ─── Exportação ──────────────────────────────────────────────────────────────

document.getElementById('btn-exportar-png').addEventListener('click', exportarPNG);
document.getElementById('btn-exportar-pdf').addEventListener('click', exportarPDF);
