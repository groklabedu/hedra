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
  // Limpar instância Chart.js anterior se existir
  if (chartRosquinha) { chartRosquinha.destroy(); chartRosquinha = null; }

  const canvas = document.getElementById(canvasId);
  const dpr    = window.devicePixelRatio || 1;
  const size   = canvas.clientWidth || 280;

  // Canvas quadrado
  canvas.style.height = size + 'px';
  canvas.width  = size * dpr;
  canvas.height = size * dpr;

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx  = size / 2;
  const cy  = size / 2;
  const R   = size * 0.41;   // raio externo
  const GAP = 0.07;           // espaço entre segmentos (radianos)

  // MIN = espessura mínima (score 0%), MAX = espessura máxima (score 100%)
  const MIN_T = 0.12;
  const MAX_T = 0.74;

  // Mapeamento: cada quadrante → dimensão correspondente
  // Posições no círculo: topo-esq, topo-dir, baixo-dir, baixo-esq
  const segmentos = [
    { score: scores.influencia,  color: '#B7770D', label: 'Influência',  start: -Math.PI      }, // topo-esq
    { score: scores.maestria,    color: '#1A6B45', label: 'Maestria',    start: -Math.PI / 2  }, // topo-dir
    { score: scores.direcao,     color: '#1A5276', label: 'Direção',     start: 0             }, // baixo-dir
    { score: scores.autodominio, color: '#CC4400', label: 'Autodomínio', start: Math.PI / 2   }, // baixo-esq
  ];

  segmentos.forEach(({ score, color, label, start }) => {
    const end      = start + Math.PI / 2;
    const espessura = (MIN_T + (MAX_T - MIN_T) * (score / 100)) * R;
    const innerR   = Math.max(R - espessura, 2);
    const midAngle = start + Math.PI / 4;
    const midR     = (R + innerR) / 2;

    // Arco com espessura variável
    ctx.beginPath();
    ctx.arc(cx, cy, R,      start + GAP, end - GAP, false);
    ctx.arc(cx, cy, innerR, end   - GAP, start + GAP, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Score no meio do arco (só se houver espaço)
    if (espessura > R * 0.22) {
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.round(size * 0.038)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(Math.round(score) + '%',
        cx + midR * Math.cos(midAngle),
        cy + midR * Math.sin(midAngle));
      ctx.restore();
    }
  });

  // Nome do perfil no centro
  const nome     = PERFIS[perfil].nome;
  const corNome  = PERFIS[perfil].cor;
  const palavras = nome.split(' ');
  const linhas   = [];
  for (let i = 0; i < palavras.length; i += 2) {
    linhas.push(palavras.slice(i, i + 2).join(' '));
  }

  const fs = Math.round(size * 0.042);
  const lh = fs * 1.35;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = corNome;
  ctx.font         = `bold ${fs}px system-ui, sans-serif`;

  linhas.forEach((linha, i) => {
    const y = cy - ((linhas.length - 1) * lh) / 2 + i * lh;
    ctx.fillText(linha, cx, y);
  });

  // Legenda abaixo
  const legendaItens = segmentos.map(s => ({ label: s.label, color: s.color }));
  const fsL = Math.round(size * 0.036);
  ctx.font = `${fsL}px system-ui, sans-serif`;

  const itemW = size / 2;
  const legY0 = size - fsL * 2.4;

  legendaItens.forEach(({ label, color }, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x   = col === 0 ? size * 0.05 : size * 0.52;
    const y   = legY0 + row * (fsL + 6);

    ctx.fillStyle = color;
    ctx.fillRect(x, y - fsL * 0.75, fsL, fsL);
    ctx.fillStyle = '#555';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + fsL + 5, y - fsL * 0.25);
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
