// ─── Resultado paginado (5 páginas) ─────────────────────────────────────────

let rpPaginaAtual = 1;
const RP_TOTAL = 5;

// Imagens por página — coloque os arquivos em assets/resultado/
const RP_IMGS = {
  p1:             'assets/resultado/p1.jpg',
  p2:             'assets/resultado/p2.jpg',
  p3_operador:    'assets/resultado/p3-operador.jpg',
  p3_executor:    'assets/resultado/p3-executor.jpg',
  p3_comunicador: 'assets/resultado/p3-comunicador.jpg',
  p3_lider:       'assets/resultado/p3-lider.jpg',
  p4_operador:    'assets/resultado/p4-operador.jpg',
  p4_executor:    'assets/resultado/p4-executor.jpg',
  p4_comunicador: 'assets/resultado/p4-comunicador.jpg',
  p4_lider:       'assets/resultado/p4-lider.jpg',
  p5:             'assets/resultado/p5.jpg',
};

function rpImgTag(src, alt) {
  return `<div class="rp-img-wrap"><img src="${src}" alt="${alt}" class="rp-img" onerror="this.parentElement.style.display='none'"></div>`;
}

function rpListItems(arr) {
  return arr.map((t) => `<li>${t}</li>`).join('');
}

// ─── Renderizar todas as páginas ─────────────────────────────────────────────

function renderizarResultadoPaginado(scores, nome) {
  const p = scores.perfil;
  const pc = RC.perfis[p];
  const perfilInfo = PERFIS[p];

  renderP1();
  renderP2(scores);
  renderP3(scores, pc, perfilInfo);
  renderP4(pc, perfilInfo);
  renderP5(pc, perfilInfo, nome);

  rpPaginaAtual = 1;
  rpMostrarPagina(1, 'none');
  rpAtualizarNav();

  // Renderizar gráficos após DOM estar pronto
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      renderarMapaHEDRA('rp-canvas-mapa', scores.eixoX, scores.eixoY, scores.perfil);
      renderarDimensoes('rp-canvas-dim', scores);
    });
  });
}

// ─── Página 1 — Apresentação da metodologia ──────────────────────────────────

function renderP1() {
  document.getElementById('rp-page-1').innerHTML = `
    ${rpImgTag(RP_IMGS.p1, 'Metodologia HEDRA')}

    <div class="rp-content">
      <p class="rp-supertitulo">Inventário de Liderança</p>
      <h1 class="rp-titulo-pagina">Matriz de Maturidade<br>da Liderança — HEDRA</h1>

      <p class="rp-texto">Liderar não é apenas entregar resultados. É fazer com que pessoas, decisões e prioridades caminhem em uma direção capaz de produzir resultados sustentáveis.</p>
      <p class="rp-texto">A Matriz de Maturidade da Liderança HEDRA reúne anos de experiência executiva, pesquisas e atuação direta no desenvolvimento de lideranças em todos os níveis de posição, em grandes organizações.</p>
      <p class="rp-texto">Seu inventário é composto por questões construídas a partir de situações da prática real da liderança: tomada de decisão, definição de prioridades, autocontrole, comunicação, delegação, desenvolvimento de pessoas, condução de conversas difíceis, mobilização de equipes e geração de resultados.</p>
      <p class="rp-texto">A Matriz HEDRA não busca definir sua personalidade. <strong>Ela identifica como sua liderança está sendo exercida neste momento.</strong></p>

      <p class="rp-texto" style="margin-top:20px">Fundamentada nas 4 dimensões do método Hedra®, ela mapeia os Campos de Maturidade da Liderança:</p>

      <div class="rp-campos-lista">
        <div class="rp-campo-item" style="border-color:#CC4400;color:#CC4400">Operador Sobrecarregado</div>
        <div class="rp-campo-item" style="border-color:#1A5276;color:#1A5276">Executor Eficiente</div>
        <div class="rp-campo-item" style="border-color:#B7770D;color:#B7770D">Comunicador Frágil</div>
        <div class="rp-campo-item" style="border-color:#1A6B45;color:#1A6B45">Líder de Influência Estratégica</div>
      </div>

      <div class="rp-destaque-box">
        <p class="rp-destaque-titulo">CONCEITO CENTRAL HEDRA</p>
        <p class="rp-texto" style="margin:0">A maturidade da liderança acontece quando o resultado deixa de depender apenas do esforço do líder e passa a gerar impacto por sua <strong>Liderança de Influência Estratégica</strong>.</p>
      </div>
    </div>
  `;
}

// ─── Página 2 — Seu campo de liderança ──────────────────────────────────────

function renderP2(scores) {
  const perfil = scores.perfil;
  const ordemQuadrantes = ['comunicador', 'lider', 'operador', 'executor'];

  const cards = ordemQuadrantes.map((key) => {
    const info = PERFIS[key];
    const ativo = key === perfil;
    return `
      <div class="rp-perfil-card ${ativo ? 'ativo' : ''}" style="
        border-color:${info.cor}${ativo ? '' : '30'};
        background:${info.cor}${ativo ? '12' : '06'};
        ${ativo ? `box-shadow:0 0 0 2px ${info.cor}` : ''}
      ">
        ${ativo ? `<span class="rp-perfil-card-badge" style="background:${info.cor}">Seu resultado</span>` : ''}
        <p class="rp-perfil-card-nome" style="color:${info.cor}">${info.nome}</p>
        <p class="rp-perfil-card-resumo">${RC.p2_resumos[key]}</p>
      </div>
    `;
  }).join('');

  document.getElementById('rp-page-2').innerHTML = `
    ${rpImgTag(RP_IMGS.p2, 'Mapa dos perfis de liderança')}

    <div class="rp-content">
      <p class="rp-supertitulo">Página 2 de 5</p>
      <h2 class="rp-titulo-secao">Seu Campo de Liderança</h2>
      <p class="rp-texto-secundario">Seu campo predominante neste momento</p>

      <div class="rp-mapa-wrap">
        <canvas id="rp-canvas-mapa"></canvas>
      </div>

      <div class="rp-perfis-grid">
        ${cards}
      </div>
    </div>
  `;
}

// ─── Página 3 — Leitura aprofundada ─────────────────────────────────────────

function renderP3(scores, pc, perfilInfo) {
  const imgKey = `p3_${scores.perfil}`;
  document.getElementById('rp-page-3').innerHTML = `
    ${rpImgTag(RP_IMGS[imgKey], pc.headline)}

    <div class="rp-content">
      <p class="rp-supertitulo">Leitura Aprofundada do Campo</p>
      <h2 class="rp-titulo-secao" style="color:${perfilInfo.cor}">${perfilInfo.nome}</h2>
      <p class="rp-headline">${pc.headline}</p>

      <div class="rp-dimensoes-mini">
        <div class="rp-dim"><span class="rp-dim-label">Autodomínio</span><span class="rp-dim-val">${scores.autodominio}%</span></div>
        <div class="rp-dim"><span class="rp-dim-label">Direção</span><span class="rp-dim-val">${scores.direcao}%</span></div>
        <div class="rp-dim"><span class="rp-dim-label">Influência</span><span class="rp-dim-val">${scores.influencia}%</span></div>
        <div class="rp-dim"><span class="rp-dim-label">Maestria</span><span class="rp-dim-val">${scores.maestria}%</span></div>
      </div>

      ${pc.p3_intro.map((t) => `<p class="rp-texto">${t}</p>`).join('')}

      <div class="rp-secao-bloco">
        <p class="rp-secao-titulo">FORÇAS</p>
        <ul class="rp-lista">${rpListItems(pc.forcas)}</ul>
      </div>

      <div class="rp-secao-bloco">
        <p class="rp-secao-titulo">PONTOS DE ATENÇÃO</p>
        <ul class="rp-lista">${rpListItems(pc.pontos)}</ul>
      </div>

      <div class="rp-secao-bloco rp-pressao-box">
        <p class="rp-secao-titulo">O QUE PODE ACONTECER SOB PRESSÃO</p>
        ${pc.pressao.map((t) => `<p class="rp-texto" style="margin-bottom:8px">${t}</p>`).join('')}
      </div>

      <div class="rp-movimento-box" style="border-color:${perfilInfo.cor}">
        <p class="rp-secao-titulo" style="color:${perfilInfo.cor}">MOVIMENTO DE MATURIDADE</p>
        <p class="rp-texto" style="margin:0">${pc.movimento}</p>
        <p class="rp-prioridade" style="color:${perfilInfo.cor}">Prioridade HEDRA: ${pc.prioridade}</p>
      </div>
    </div>
  `;
}

// ─── Página 4 — Caminho de maturidade ────────────────────────────────────────

function renderP4(pc, perfilInfo) {
  const perfilKey = Object.keys(PERFIS).find((k) => PERFIS[k] === perfilInfo);
  const imgSrc = RP_IMGS[`p4_${perfilKey}`];

  const steps = pc.p4_steps.map((s, i) => `
    <div class="rp-step">
      <span class="rp-step-num" style="background:${perfilInfo.cor}">${i + 1}</span>
      <span class="rp-step-txt">${s}</span>
    </div>
  `).join('<span class="rp-step-seta">→</span>');

  const perguntas = pc.p4_perguntas.map((q, i) =>
    `<div class="rp-pergunta"><span class="rp-pergunta-num" style="color:${perfilInfo.cor}">${i + 1}.</span> ${q}</div>`
  ).join('');

  document.getElementById('rp-page-4').innerHTML = `
    ${rpImgTag(imgSrc, 'Caminho de maturidade')}

    <div class="rp-content">
      <p class="rp-supertitulo">Seu Caminho de Maturidade</p>
      <h2 class="rp-titulo-secao" style="color:${perfilInfo.cor}">Seu próximo movimento:</h2>
      <p class="rp-movimento-titulo" style="color:${perfilInfo.cor}">${pc.p4_titulo}</p>

      <div class="rp-steps-wrap">
        ${steps}
      </div>

      <div class="rp-perguntas-secao">
        <p class="rp-secao-titulo">PERGUNTAS PARA REFLEXÃO</p>
        ${perguntas}
      </div>
    </div>
  `;
}

// ─── Página 5 — Considerações finais ────────────────────────────────────────

function renderP5(pc, perfilInfo, nome) {
  const primeiroNome = nome.trim().split(' ')[0];

  document.getElementById('rp-page-5').innerHTML = `
    ${rpImgTag(RP_IMGS.p5, 'Considerações finais')}

    <div class="rp-content">
      <p class="rp-supertitulo">Considerações Finais</p>
      <h2 class="rp-titulo-secao">A Matriz HEDRA não define quem você é.</h2>
      <p class="rp-texto">Ela mostra de onde sua liderança está partindo hoje.</p>
      <p class="rp-texto">O desenvolvimento acontece quando você reconhece seus padrões atuais e começa a fazer movimentos mais intencionais em direção a uma liderança capaz de gerar clareza, autonomia e impacto sustentável.</p>
      <p class="rp-texto">Liderança madura não é fazer mais. É ampliar sua capacidade de gerar resultados através das pessoas.</p>

      <div class="rp-carta-box" style="border-color:${perfilInfo.cor}">
        <p class="rp-carta-saudacao" style="color:${perfilInfo.cor}">Caro(a) ${primeiroNome},</p>
        ${pc.p5_texto.map((t) => `<p class="rp-texto">${t}</p>`).join('')}
      </div>

      <div class="rp-fechamento-final">
        Lembre-se: A liderança não é fixa, é evolutiva. Seu resultado não define quem você é como líder — ele revela como você está liderando hoje.
      </div>

      <div class="rp-btns-download">
        <button class="btn btn-secundario" id="btn-rp-png">Salvar como imagem (PNG)</button>
        <button class="btn btn-dourado" id="btn-rp-pdf">Salvar como PDF</button>
      </div>
    </div>
  `;

  document.getElementById('btn-rp-png').addEventListener('click', exportarRelatorio('png'));
  document.getElementById('btn-rp-pdf').addEventListener('click', exportarRelatorio('pdf'));
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

  // Re-renderizar gráficos ao voltar para página 2
  if (nova === 2 && scoreData) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        renderarMapaHEDRA('rp-canvas-mapa', scoreData.eixoX, scoreData.eixoY, scoreData.perfil);
        renderarDimensoes('rp-canvas-dim', scoreData);
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
  btnVoltar.style.display = rpPaginaAtual > 1 ? '' : 'none';
  btnAvancar.style.display = rpPaginaAtual < RP_TOTAL ? '' : 'none';

  dots.forEach((d, i) => {
    d.classList.toggle('ativo', i + 1 === rpPaginaAtual);
    d.classList.toggle('concluido', i + 1 < rpPaginaAtual);
  });
}

// ─── Inicializar eventos de navegação ────────────────────────────────────────

function inicializarNavResultado() {
  // Dots
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
}
