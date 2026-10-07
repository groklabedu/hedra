// ─── Resultado paginado (6 páginas) ─────────────────────────────────────────

let rpPaginaAtual = 1;
const RP_TOTAL = 6;

// Imagens das páginas com ilustração
const RP_IMGS = {
  p3_operador:    'assets/resultado/p3-operador.png',
  p3_executor:    'assets/resultado/p3-executor.png',
  p3_comunicador: 'assets/resultado/p3-comunicador.png',
  p3_lider:       'assets/resultado/p3-lider.png',
  p4_operador:    'assets/resultado/p4-operador.png',
  p4_executor:    'assets/resultado/p4-executor.png',
  p4_comunicador: 'assets/resultado/p4-comunicador.png',
  p4_lider:       'assets/resultado/p4-lider.png',
  p5:             'assets/resultado/p5.png',
};

function rpImgTag(src, alt) {
  return `<div class="rp-img-wrap"><img src="${src}" alt="${alt}" class="rp-img" onerror="this.parentElement.style.display='none'"></div>`;
}

// ─── Renderizar todas as páginas ─────────────────────────────────────────────

function renderizarResultadoPaginado(scores, nome) {
  const p = scores.perfil;
  const pc = RC.perfis[p];
  const perfilInfo = PERFIS[p];

  renderP1(scores, pc, perfilInfo, nome);
  renderP2(scores, pc, perfilInfo);
  renderP3(scores, pc, perfilInfo);
  renderP4(pc, perfilInfo);
  renderP5(pc, perfilInfo);
  renderP6(pc, perfilInfo, nome);

  rpPaginaAtual = 1;
  rpMostrarPagina(1, 'none');
  rpAtualizarNav();

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderarMapaHEDRA('rp-canvas-mapa', scores.eixoX, scores.eixoY, scores.perfil);
    });
  });
}

// ─── Página 1 — Resultado: hero ──────────────────────────────────────────────

function renderP1(scores, pc, perfilInfo, nome) {
  const primeiroNome = nome.trim().split(' ')[0];

  const dimBars = [
    { label: 'Autodomínio', val: scores.autodominio, cor: '#651707' },
    { label: 'Direção',     val: scores.direcao,     cor: '#ffab24' },
    { label: 'Influência',  val: scores.influencia,  cor: '#f8572d' },
    { label: 'Maestria',    val: scores.maestria,    cor: '#037a54' },
  ];

  document.getElementById('rp-page-1').innerHTML = `
    <div class="rp-img-wrap rp2-hero-wrap">
      <div class="rp2-hero">
        <span class="rp2-hero-tag">Inventário HEDRA</span>
        <p class="rp2-hero-label">Seu campo de liderança</p>
        <p class="rp2-hero-nome-perfil" style="color:${perfilInfo.cor}">${perfilInfo.nome}</p>
        <p class="rp2-hero-usuario">${primeiroNome}</p>
        <p class="rp2-hero-headline">${pc.headline}</p>
      </div>
    </div>

    <div class="rp-content">
      <div class="rp2-info-card">
        <div class="rp2-info-row">
          <span class="rp2-info-key">Participante</span>
          <span class="rp2-info-val">${nome}</span>
        </div>
        <div class="rp2-info-row">
          <span class="rp2-info-key">Perfil</span>
          <span class="rp2-info-val" style="color:${perfilInfo.cor};font-weight:800">${perfilInfo.nome}</span>
        </div>
      </div>

      <div class="rp2-dim-card">
        <p class="rp2-dim-card-title">Dimensões de liderança</p>
        ${dimBars.map(d => `
          <div class="rp2-dim-row">
            <span class="rp2-dim-label">${d.label}</span>
            <div class="rp2-dim-track">
              <div class="rp2-dim-fill" style="width:${d.val}%;background:${d.cor}"></div>
            </div>
            <span class="rp2-dim-val" style="color:${d.cor}">${d.val}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ─── Página 2 — Campo de liderança (mapa) ────────────────────────────────────

function renderP2(scores, pc, perfilInfo) {
  document.getElementById('rp-page-2').innerHTML = `
    <div class="rp-img-wrap rp2-map-wrap">
      <canvas id="rp-canvas-mapa"></canvas>
    </div>

    <div class="rp-content">
      <span class="rp2-pill">Seu Campo de Liderança</span>

      <div class="rp2-perfil-card" style="border-color:${perfilInfo.cor}">
        <p class="rp2-seu-resultado">Seu resultado</p>
        <p class="rp2-perfil-nome" style="color:${perfilInfo.cor}">${perfilInfo.nome}</p>
        <p class="rp2-perfil-resumo">${RC.p2_resumos[scores.perfil]}</p>
      </div>
    </div>
  `;
}

// ─── Página 3 — Forças e Pontos de Atenção ───────────────────────────────────

function renderP3(scores, pc, perfilInfo) {
  const forcasItems = pc.forcas.map(f =>
    `<div class="rp2-col-item"><span class="rp2-col-icon">✓</span>${f}</div>`
  ).join('');
  const pontosItems = pc.pontos.map(p =>
    `<div class="rp2-col-item"><span class="rp2-col-icon">!</span>${p}</div>`
  ).join('');

  document.getElementById('rp-page-3').innerHTML = `

    <div class="rp-content">
      <span class="rp2-pill">Leitura Aprofundada</span>
      <p class="rp2-subtitulo" style="color:${perfilInfo.cor}">${perfilInfo.nome}</p>

      ${pc.p3_intro.map(t => `<p class="rp2-intro">${t}</p>`).join('')}

      <div class="rp2-cols">
        <div class="rp2-col-card">
          <div class="rp2-col-header forcas">Forças</div>
          <div class="rp2-col-body">${forcasItems}</div>
        </div>
        <div class="rp2-col-card">
          <div class="rp2-col-header pontos">Pontos de atenção</div>
          <div class="rp2-col-body">${pontosItems}</div>
        </div>
      </div>
    </div>
  `;
}

// ─── Página 4 — Sob pressão e Movimento ──────────────────────────────────────

function renderP4(pc, perfilInfo) {
  document.getElementById('rp-page-4').innerHTML = `

    <div class="rp-content">
      <span class="rp2-pill">Sob Pressão</span>
      <p class="rp2-pressao-titulo">O que pode acontecer sob pressão</p>

      ${pc.pressao.map(t => `<p class="rp2-pressao-quote">${t}</p>`).join('')}

      <div class="rp2-movimento">
        <p class="rp2-movimento-label">Movimento de maturidade</p>
        <p class="rp2-movimento-texto">${pc.movimento}</p>
        <p style="margin-top:12px">
          <span class="rp2-prioridade">Prioridade HEDRA: ${pc.prioridade}</span>
        </p>
      </div>
    </div>
  `;
}

// ─── Página 5 — Caminho de maturidade ────────────────────────────────────────

function renderP5(pc, perfilInfo) {
  const steps = pc.p4_steps.map((s, i) => `
    <div class="rp2-step">
      <div class="rp2-step-circle" style="background:${perfilInfo.cor}">${i + 1}</div>
      <span class="rp2-step-label">${s}</span>
    </div>
  `).join('');

  const perguntas = pc.p4_perguntas.map((q, i) => `
    <div class="rp2-pergunta">
      <span class="rp2-pergunta-num" style="color:${perfilInfo.cor}">${i + 1}.</span>
      ${q}
    </div>
  `).join('');

  document.getElementById('rp-page-5').innerHTML = `

    <div class="rp-content">
      <span class="rp2-pill">Caminho de Maturidade</span>
      <p class="rp2-subtitulo">${pc.p4_titulo}</p>

      <div class="rp2-steps">${steps}</div>

      <div class="rp2-perguntas">
        <p class="rp2-perguntas-titulo">Perguntas para reflexão</p>
        ${perguntas}
      </div>
    </div>
  `;
}

// ─── Página 6 — Considerações finais ─────────────────────────────────────────

function renderP6(pc, perfilInfo, nome) {
  const primeiroNome = nome.trim().split(' ')[0];

  document.getElementById('rp-page-6').innerHTML = `

    <div class="rp-content">
      <span class="rp2-pill">Considerações Finais</span>

      <p class="rp2-lembrese">A Matriz HEDRA não define quem você é — ela revela como você está liderando hoje.</p>

      <div class="rp2-carta">
        <p class="rp2-carta-saudacao" style="color:${perfilInfo.cor}">Caro(a) ${primeiroNome},</p>
        ${pc.p5_texto.map(t => `<p class="rp2-carta-texto">${t}</p>`).join('')}
      </div>

      <div class="rp2-fechamento">
        Liderança não é fixa, é evolutiva. Seu resultado revela como você está liderando hoje — não quem você é como líder.
      </div>
    </div>
  `;
}

// ─── Navegação entre páginas ─────────────────────────────────────────────────

function rpMostrarPagina(nova, direcao) {
  const anterior = document.querySelector('.rp-page.ativa');
  const proxima  = document.getElementById(`rp-page-${nova}`);

  if (anterior) {
    anterior.classList.remove('ativa');
    if (direcao !== 'none') {
      anterior.classList.add(direcao === 'frente' ? 'saindo-esq' : 'saindo-dir');
      setTimeout(() => anterior.classList.remove('saindo-esq', 'saindo-dir'), 400);
    }
  }

  proxima.classList.add('ativa');
  if (direcao !== 'none') proxima.classList.add(direcao === 'frente' ? 'entrando-dir' : 'entrando-esq');
  if (direcao !== 'none') {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => proxima.classList.remove('entrando-dir', 'entrando-esq'));
    });
  }

  window.scrollTo(0, 0);

  // Re-renderizar mapa ao navegar para a página 2
  if (nova === 2 && scoreData) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderarMapaHEDRA('rp-canvas-mapa', scoreData.eixoX, scoreData.eixoY, scoreData.perfil);
      });
    });
  }
}

function rpAtualizarNav() {
  const btnVoltar  = document.getElementById('btn-rp-voltar');
  const btnAvancar = document.getElementById('btn-rp-avancar');
  const num        = document.getElementById('rp-pagina-num');
  const dots       = document.querySelectorAll('.rp-dot');

  num.textContent = `${rpPaginaAtual} / ${RP_TOTAL}`;

  btnVoltar.classList.toggle('invisivel', rpPaginaAtual <= 1);
  btnAvancar.classList.toggle('invisivel', rpPaginaAtual >= RP_TOTAL);

  dots.forEach((d, i) => {
    d.classList.toggle('ativo', i + 1 === rpPaginaAtual);
    d.classList.toggle('concluido', i + 1 < rpPaginaAtual);
  });
}

// ─── Inicializar eventos de navegação ────────────────────────────────────────

function inicializarNavResultado() {
  const dotsContainer = document.getElementById('rp-dots');
  dotsContainer.innerHTML = Array.from({ length: RP_TOTAL }, (_, i) =>
    `<div class="rp-dot${i === 0 ? ' ativo' : ''}" data-pagina="${i + 1}"></div>`
  ).join('');

  dotsContainer.querySelectorAll('.rp-dot').forEach((dot) => {
    dot.addEventListener('click', () => {
      const alvo = Number(dot.dataset.pagina);
      if (alvo === rpPaginaAtual) return;
      const dir = alvo > rpPaginaAtual ? 'frente' : 'tras';
      rpPaginaAtual = alvo;
      rpMostrarPagina(alvo, dir);
      rpAtualizarNav();
    });
  });

  document.getElementById('btn-rp-avancar').addEventListener('click', () => {
    if (rpPaginaAtual >= RP_TOTAL) return;
    rpPaginaAtual++;
    rpMostrarPagina(rpPaginaAtual, 'frente');
    rpAtualizarNav();
  });

  document.getElementById('btn-rp-voltar').addEventListener('click', () => {
    if (rpPaginaAtual <= 1) return;
    rpPaginaAtual--;
    rpMostrarPagina(rpPaginaAtual, 'tras');
    rpAtualizarNav();
  });

  document.getElementById('btn-rp-pdf-nav').addEventListener('click', async () => {
    const btn = document.getElementById('btn-rp-pdf-nav');
    btn.textContent = '⏳ Gerando…';
    btn.disabled = true;
    try {
      await gerarPDFNovo(scoreData, userData);
    } catch (err) {
      alert('Erro ao gerar PDF. Tente novamente.');
      console.error(err);
    } finally {
      btn.textContent = '⬇ PDF';
      btn.disabled = false;
    }
  });
}
