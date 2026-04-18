let chartMapa = null;
let chartDimensoes = null;
let chartRosquinha = null;

const quadrantPlugin = {
  id: 'quadrantPlugin',
  beforeDraw(chart) {
    const { ctx, chartArea: { left, top, right, bottom }, scales: { x, y } } = chart;
    const midX = x.getPixelForValue(50);
    const midY = y.getPixelForValue(50);

    ctx.save();

    // Fundos dos quadrantes
    const backgrounds = [
      { color: 'rgba(204, 68, 0, 0.08)',   x: left,  y: midY,  w: midX - left,  h: bottom - midY },  // oper.
      { color: 'rgba(26, 82, 118, 0.08)',  x: midX,  y: midY,  w: right - midX, h: bottom - midY },  // exec.
      { color: 'rgba(183, 119, 13, 0.08)', x: left,  y: top,   w: midX - left,  h: midY - top   },   // com.
      { color: 'rgba(26, 107, 69, 0.08)',  x: midX,  y: top,   w: right - midX, h: midY - top   },   // líder
    ];
    backgrounds.forEach(({ color, x: bx, y: by, w, h }) => {
      ctx.fillStyle = color;
      ctx.fillRect(bx, by, w, h);
    });

    // Linhas divisórias tracejadas
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(midX, top);    ctx.lineTo(midX, bottom); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(left, midY);   ctx.lineTo(right, midY);  ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },

  afterDraw(chart) {
    const { ctx, chartArea: { left, top, right, bottom }, scales: { x, y } } = chart;
    const midX = x.getPixelForValue(50);
    const midY = y.getPixelForValue(50);
    const pad = 6;

    ctx.save();
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';

    const labels = [
      { text: ['Operador', 'Sobrecarregado'], color: '#CC4400', cx: (left + midX) / 2, cy: midY + pad + 9 },
      { text: ['Executor', 'Eficiente'],      color: '#1A5276', cx: (midX + right) / 2, cy: midY + pad + 9 },
      { text: ['Comunicador', 'Frágil'],       color: '#B7770D', cx: (left + midX) / 2, cy: top + pad + 9 },
      { text: ['Líder de', 'Influência Est.'], color: '#1A6B45', cx: (midX + right) / 2, cy: top + pad + 9 },
    ];

    labels.forEach(({ text, color, cx, cy }) => {
      ctx.fillStyle = color;
      text.forEach((line, i) => ctx.fillText(line, cx, cy + i * 11));
    });
    ctx.restore();
  },
};

function renderarMapaHEDRA(canvasId, eixoX, eixoY, perfil) {
  const ctx = document.getElementById(canvasId).getContext('2d');

  if (chartMapa) { chartMapa.destroy(); chartMapa = null; }

  chartMapa = new Chart(ctx, {
    type: 'scatter',
    plugins: [quadrantPlugin],
    data: {
      datasets: [{
        label: 'Você',
        data: [{ x: eixoX, y: eixoY }],
        backgroundColor: PERFIS[perfil].cor,
        borderColor: '#fff',
        borderWidth: 2,
        pointRadius: 10,
        pointHoverRadius: 12,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (item) => `Direção: ${item.parsed.x.toFixed(0)} · Impacto: ${item.parsed.y.toFixed(0)}`,
          },
        },
      },
      scales: {
        x: {
          min: 0, max: 100,
          title: { display: true, text: 'Direção →', font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { maxTicksLimit: 6 },
        },
        y: {
          min: 0, max: 100,
          title: { display: true, text: '↑ Impacto', font: { size: 11 } },
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { maxTicksLimit: 6 },
        },
      },
    },
  });
}

function renderarDimensoes(canvasId, scores) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  if (chartDimensoes) { chartDimensoes.destroy(); chartDimensoes = null; }

  const pct = (v) => Math.round((v / 100) * 100);

  chartDimensoes = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Autodomínio', 'Direção', 'Influência', 'Maestria'],
      datasets: [{
        data: [
          pct(scores.autodominio),
          pct(scores.direcao),
          pct(scores.influencia),
          pct(scores.maestria),
        ],
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

function renderarRosquinha(canvasId, scores, perfil) {
  if (chartRosquinha) { chartRosquinha.destroy(); chartRosquinha = null; }

  const canvas = document.getElementById(canvasId);
  const dpr    = window.devicePixelRatio || 1;
  const size   = canvas.clientWidth || 300;

  canvas.style.height = size + 'px';
  canvas.width  = size * dpr;
  canvas.height = size * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  // ── Margens para labels dos eixos ─────────────────────────────────────────
  const PAD   = size * 0.13;  // margem para labels de quadrante
  const cx    = size / 2;
  const cy    = size / 2;
  const R     = (size - PAD * 2) * 0.47;  // raio externo da rosca
  const MIN_T = 0.13;   // espessura mínima como fração de R (score 0%)
  const MAX_T = 0.80;   // espessura máxima como fração de R (score 100%)

  // ── Quadrantes: dimensão, cor, ângulos, posição do label ─────────────────
  // Ângulos: 0 = direita, sentido horário
  // topo-esq  = 180°→270° (π → 3π/2)  → Influência   (ouro)
  // topo-dir  = 270°→360° (3π/2 → 2π) → Maestria      (verde)
  // baixo-dir = 0°→90°    (0 → π/2)   → Direção       (azul)
  // baixo-esq = 90°→180°  (π/2 → π)   → Autodomínio   (vermelho)
  const PI = Math.PI;
  const segmentos = [
    { score: scores.influencia,  color: '#B7770D', start: PI,       end: 3*PI/2, qLabel: 'Comunicador\nFrágil',              lx: PAD*0.4,      ly: PAD*0.55 },
    { score: scores.maestria,    color: '#1A6B45', start: 3*PI/2,   end: 2*PI,   qLabel: 'Líder de\nInfluência\nEstratégica', lx: size-PAD*0.4, ly: PAD*0.55 },
    { score: scores.direcao,     color: '#1A5276', start: 0,        end: PI/2,   qLabel: 'Executor\nEficiente',               lx: size-PAD*0.4, ly: size-PAD*0.55 },
    { score: scores.autodominio, color: '#CC4400', start: PI/2,     end: PI,     qLabel: 'Operador\nSobrecarregado',          lx: PAD*0.4,      ly: size-PAD*0.55 },
  ];

  // ── 1. Plano cartesiano ───────────────────────────────────────────────────
  const axisColor = '#999';
  const axisW     = 1.5;
  const arrow     = size * 0.025;

  ctx.strokeStyle = axisColor;
  ctx.lineWidth   = axisW;
  ctx.setLineDash([]);

  // Eixo Y (vertical) — de baixo para cima
  ctx.beginPath();
  ctx.moveTo(cx, size - PAD * 0.3);
  ctx.lineTo(cx, PAD * 0.3);
  ctx.stroke();
  // Seta Y
  ctx.beginPath();
  ctx.moveTo(cx, PAD * 0.3);
  ctx.lineTo(cx - arrow * 0.5, PAD * 0.3 + arrow);
  ctx.moveTo(cx, PAD * 0.3);
  ctx.lineTo(cx + arrow * 0.5, PAD * 0.3 + arrow);
  ctx.stroke();

  // Eixo X (horizontal)
  ctx.beginPath();
  ctx.moveTo(PAD * 0.3, cy);
  ctx.lineTo(size - PAD * 0.3, cy);
  ctx.stroke();
  // Seta X
  ctx.beginPath();
  ctx.moveTo(size - PAD * 0.3, cy);
  ctx.lineTo(size - PAD * 0.3 - arrow, cy - arrow * 0.5);
  ctx.moveTo(size - PAD * 0.3, cy);
  ctx.lineTo(size - PAD * 0.3 - arrow, cy + arrow * 0.5);
  ctx.stroke();

  // Labels dos eixos
  const fsAxis = Math.round(size * 0.035);
  ctx.fillStyle    = '#777';
  ctx.font         = `600 ${fsAxis}px system-ui, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('↑ Impacto', cx, PAD * 0.28);

  ctx.textAlign    = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('Direção →', size - PAD * 0.28, cy - fsAxis * 0.6);

  // ── 2. Segmentos da rosca ─────────────────────────────────────────────────
  segmentos.forEach(({ score, color, start, end }) => {
    const espessura = (MIN_T + (MAX_T - MIN_T) * (score / 100)) * R;
    const innerR    = Math.max(R - espessura, 1);
    const midAngle  = (start + end) / 2;
    const midR      = (R + innerR) / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, R,      start, end,   false);
    ctx.arc(cx, cy, innerR, end,   start, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Score dentro do arco
    const fsScore = Math.round(size * 0.04);
    ctx.save();
    ctx.fillStyle    = '#fff';
    ctx.font         = `bold ${fsScore}px system-ui, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      Math.round(score) + '%',
      cx + midR * Math.cos(midAngle),
      cy + midR * Math.sin(midAngle)
    );
    ctx.restore();
  });

  // ── 3. Labels dos quadrantes (cantos) ─────────────────────────────────────
  const fsQ    = Math.round(size * 0.034);
  const lhQ    = fsQ * 1.3;
  const aligns = ['left', 'right', 'right', 'left'];
  const vAligns= ['top', 'top', 'bottom', 'bottom'];

  segmentos.forEach(({ color, qLabel, lx, ly }, i) => {
    const linhas = qLabel.split('\n');
    ctx.fillStyle    = color;
    ctx.font         = `bold ${fsQ}px system-ui, sans-serif`;
    ctx.textAlign    = aligns[i];
    ctx.textBaseline = vAligns[i];
    linhas.forEach((l, j) => ctx.fillText(l, lx, ly + j * lhQ));
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
