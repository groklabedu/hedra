let chartMapa = null;
let chartDimensoes = null;

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
