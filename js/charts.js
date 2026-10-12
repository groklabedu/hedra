let chartMapa = null;
let chartDimensoes = null;

function renderarMapaHEDRA(canvasId, eixoX, eixoY, perfil) {
  if (chartMapa) { chartMapa.destroy(); chartMapa = null; }

  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const container = canvas.parentElement;
  canvas.style.display = 'none';

  const oldSvg = container.querySelector('svg.hedra-mapa');
  if (oldSvg) oldSvg.remove();

  const COR = {
    operador:    '#f8572d',
    executor:    '#1ca31c',
    comunicador: '#8631f4',
    lider:       '#ffab24',
  };

  // Mesma arte do slide 2 do PDF: assets/slides/mapa-base.png é o recorte (60,240)-(1000,885)
  // do slide 1920×1080; coordenadas abaixo em pixels desse recorte.
  const THR = 70;
  const needsHighX = (perfil === 'executor' || perfil === 'lider');
  const needsHighY = (perfil === 'comunicador' || perfil === 'lider');
  const px = needsHighX
    ? Math.min(Math.max(eixoX, THR + 5),  99)
    : Math.max(Math.min(eixoX, THR - 11),  1);
  const py = needsHighY
    ? Math.min(Math.max(eixoY, THR + 2),  99)   // tip ≤ MY-PAD: ~2pts acima do THR
    : Math.max(Math.min(eixoY, THR - 5),  1);   // tip ≥ MY+PAD: ~5pts abaixo do THR

  const VW = 940, VH = 645;
  const L = 66, T = 36, CW = 770, CH = 538;   // área de dados (= CHART_X/Y/W/H do PDF)
  const MX = L + CW / 2, MY = T + CH / 2, B = T + CH;
  const MM = 1920 / 338.67;                    // px do slide por mm do PDF

  const sx = (s) => s <= THR
    ? L + (s / THR) * (CW / 2)
    : MX + ((s - THR) / (100 - THR)) * (CW / 2);
  const sy = (s) => s <= THR
    ? B - (s / THR) * (CH / 2)
    : MY - ((s - THR) / (100 - THR)) * (CH / 2);
  const pinX = sx(px), pinY = sy(py);

  const PIN = 13 * MM;
  const TAG_W = PIN * (229 / 80), TAG_GAP = 0.5 * MM;
  let tagX = pinX + PIN / 2 + TAG_GAP;
  if (tagX + TAG_W > VW) tagX = pinX - PIN / 2 - TAG_GAP - TAG_W;

  const svgStr = `<svg class="hedra-mapa" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">
  <image href="assets/slides/mapa-base.png" x="0" y="0" width="${VW}" height="${VH}"/>
  <g class="mo-mapa-pin"><path transform="translate(${pinX - PIN / 2},${pinY - PIN}) scale(${PIN / 64})" fill-rule="evenodd" fill="${COR[perfil]}"
    d="m32 0a24.0319 24.0319 0 0 0 -24 24c0 17.23 22.36 38.81 23.31 39.72a.99.99 0 0 0 1.38 0c.95-.91 23.31-22.49 23.31-39.72a24.0319 24.0319 0 0 0 -24-24zm0 35a11 11 0 1 1 11-11 11.0066 11.0066 0 0 1 -11 11z"/></g>
  <g class="mo-mapa-tag"><image href="assets/slides/${perfil}/tag.png" x="${tagX}" y="${pinY - PIN}" width="${TAG_W}" height="${PIN}"/></g>
  <g class="mo-mapa-label"><text x="${pinX}" y="${pinY + 3.5 * MM}" text-anchor="middle" dominant-baseline="middle"
    font-family="FinalSix,system-ui,sans-serif" font-weight="700" font-size="${9 * 0.3528 * MM}" fill="#651707">você está aqui</text></g>
</svg>`;

  container.insertAdjacentHTML('beforeend', svgStr);
}

function renderarDimensoes(canvasId, scores) {
  const el = document.getElementById(canvasId);
  if (!el) return;
  const ctx = el.getContext('2d');
  if (chartDimensoes) { chartDimensoes.destroy(); chartDimensoes = null; }

  chartDimensoes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Autodomínio', 'Direção', 'Influência', 'Maestria'],
      datasets: [{
        data: [scores.autodominio, scores.direcao, scores.influencia, scores.maestria],
        backgroundColor: ['#6a1908', '#ffab24', '#f8572d', '#037a54'],
        borderRadius: 4,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (item) => ` ${item.parsed.x}%` },
        },
      },
      scales: {
        x: {
          min: 0, max: 100,
          ticks: { callback: (v) => v + '%', maxTicksLimit: 6 },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
      },
    },
  });
}

function renderarPizzaAdmin(canvasId, dados) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: dados.map((d) => d.label),
      datasets: [{
        data: dados.map((d) => d.valor),
        backgroundColor: dados.map((d) => d.cor),
        borderWidth: 2,
        borderColor: '#fff',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 12 } } },
      },
    },
  });
}
