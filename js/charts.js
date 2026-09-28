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
    operador:    '#CC4400',
    executor:    '#1A5276',
    comunicador: '#B7770D',
    lider:       '#1A6B45',
  };

  const NOMES = {
    operador:    ['Operador', 'Sobrecarregado'],
    executor:    ['Executor', 'Eficiente'],
    comunicador: ['Comunicador', 'Frágil'],
    lider:       ['Líder de', 'Influência Est.'],
  };

  // A PONTA do pin é a âncora (tip = y=0 no grupo SVG).
  // Margens mínimas para tip ficar dentro do card colorido (PAD=10px).
  const THR = 70;
  const needsHighX = (perfil === 'executor' || perfil === 'lider');
  const needsHighY = (perfil === 'comunicador' || perfil === 'lider');
  const px = needsHighX
    ? Math.min(Math.max(eixoX, THR + 5),  99)
    : Math.max(Math.min(eixoX, THR - 11),  1);
  const py = needsHighY
    ? Math.min(Math.max(eixoY, THR + 2),  99)   // tip ≤ MY-PAD: ~2pts acima do THR
    : Math.max(Math.min(eixoY, THR - 5),  1);   // tip ≥ MY+PAD: ~5pts abaixo do THR

  // Dimensões do SVG
  const VW = 400, VH = 360;
  const L = 40, T = 12, R = 392, B = 328;
  const CW = R - L, CH = B - T;
  const MX = L + CW / 2, MY = T + CH / 2;

  // Mapeamento não-linear: threshold 70 = centro visual
  // Garante que quem está em 49% no score fica bem dentro do quadrante inferior
  const sx = (s) => s <= THR
    ? L + (s / THR) * (MX - L)
    : MX + ((s - THR) / (100 - THR)) * (R - MX);
  const sy = (s) => s <= THR
    ? B - (s / THR) * (B - MY)
    : MY - ((s - THR) / (100 - THR)) * (MY - T);
  const pinX = sx(px), pinY = sy(py);

  const uid = canvasId.replace(/[^a-z0-9]/gi, '');
  const PAD = 10;

  const QUADS = [
    { id: 'comunicador', qx: L,  qy: T  },
    { id: 'lider',       qx: MX, qy: T  },
    { id: 'operador',    qx: L,  qy: MY },
    { id: 'executor',    qx: MX, qy: MY },
  ];
  const qw = CW / 2, qh = CH / 2;

  const svgStr = `<svg class="hedra-mapa" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="hatch-${uid}" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="#B8A88A" stroke-width="0.7" stroke-opacity="0.45"/>
    </pattern>
    <filter id="pshadow-${uid}">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="rgba(0,0,0,0.28)"/>
    </filter>
  </defs>

  <!-- Fundo hachurado -->
  <rect x="${L}" y="${T}" width="${CW}" height="${CH}" fill="url(#hatch-${uid})" rx="6"/>

  <!-- Cards dos quadrantes -->
  ${QUADS.map(({ id, qx, qy }) => {
    const c = COR[id];
    const ativo = id === perfil;
    const cx = qx + qw / 2;
    const cy = qy + qh / 2;
    const lines = NOMES[id];
    const lineH = 15;
    const totalH = lines.length * lineH;
    const ty = cy - totalH / 2 + lineH - 3;
    return `
  <rect x="${qx + PAD}" y="${qy + PAD}" width="${qw - PAD*2}" height="${qh - PAD*2}" rx="10"
    fill="${c}" fill-opacity="${ativo ? 0.16 : 0.06}"
    stroke="${c}" stroke-width="${ativo ? 2.5 : 1}" stroke-opacity="${ativo ? 0.65 : 0.22}"/>
  ${lines.map((ln, i) => `<text x="${cx}" y="${ty + i * lineH}" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif" font-size="${ativo ? 11.5 : 10}" font-weight="700"
    fill="${c}" fill-opacity="${ativo ? 1 : 0.5}">${ln}</text>`).join('')}`;
  }).join('')}

  <!-- Divisórias -->
  <line x1="${MX}" y1="${T}" x2="${MX}" y2="${B}" stroke="rgba(0,0,0,0.18)" stroke-width="1.5" stroke-dasharray="5,5"/>
  <line x1="${L}" y1="${MY}" x2="${R}" y2="${MY}" stroke="rgba(0,0,0,0.18)" stroke-width="1.5" stroke-dasharray="5,5"/>

  <!-- Eixo X -->
  <line x1="${L}" y1="${B}" x2="${R+7}" y2="${B}" stroke="#666" stroke-width="1.8"/>
  <polygon points="${R+7},${B-4} ${R+14},${B} ${R+7},${B+4}" fill="#666"/>
  <text x="${(L+R)/2}" y="${VH-2}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11.5" fill="#555" font-weight="600">Direção</text>

  <!-- Eixo Y -->
  <line x1="${L}" y1="${B}" x2="${L}" y2="${T-7}" stroke="#666" stroke-width="1.8"/>
  <polygon points="${L-4},${T-7} ${L},${T-14} ${L+4},${T-7}" fill="#666"/>
  <text transform="rotate(-90,13,${(T+B)/2})" x="13" y="${(T+B)/2+4}" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11.5" fill="#555" font-weight="600">Impacto</text>

  <!-- Pin (ponta = âncora em y=0; corpo sobe até y=-46) -->
  <g transform="translate(${pinX},${pinY})" filter="url(#pshadow-${uid})">
    <ellipse cx="0" cy="2" rx="7" ry="2.5" fill="rgba(0,0,0,0.15)"/>
    <path d="M0,0 C0,0 -17,-17 -17,-29 C-17,-36 -11,-46 0,-46 C11,-46 17,-36 17,-29 C17,-17 0,0 0,0 Z"
      fill="#CC2200"/>
    <path d="M0,0 C0,0 -17,-17 -17,-29 C-17,-36 -11,-46 0,-46 C11,-46 17,-36 17,-29 C17,-17 0,0 0,0 Z"
      fill="none" stroke="white" stroke-width="1.5"/>
    <circle cx="0" cy="-30" r="6.5" fill="rgba(255,255,255,0.4)"/>
  </g>
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
        backgroundColor: ['#8B1A1A', '#C8961A', '#1A5276', '#1A6B45'],
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
