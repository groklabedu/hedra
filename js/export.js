// ─── Gerador de PDF estilo slide (A4 paisagem) ──────────────────────────────

async function gerarPDF(scores, ud) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

  const PW = 297, PH = 210;
  const ML = 22, MR = 22;
  const CW = PW - ML - MR; // 253 mm

  const pc    = RC.perfis[scores.perfil];
  const pf    = PERFIS[scores.perfil];
  const nome  = (ud.nome || '').trim();
  const emp   = ud.empresa || '';
  const cargo = ud.cargo || '';
  const fnome = nome.split(' ')[0] || 'Líder';

  function rgb(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  const COR = rgb(pf.cor);
  function tint(f) { return COR.map((c) => Math.round(255 - (255-c)*f)); }
  function lh(sz, m = 1.2) { return sz * 0.3528 * m; }

  let _pg = 1;

  function rodape(lb) {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(7);
    pdf.setTextColor(185,180,172);
    pdf.text(lb||'Inventário HEDRA — Asséssor Consultoria e Treinamento', ML, PH-5.5);
    pdf.text(String(_pg), PW-MR, PH-5.5, {align:'right'});
  }
  function novaPagina() { rodape(); pdf.addPage(); _pg++; }

  const HH = 13; // altura da faixa de cabeçalho colorida
  function header(sec) {
    pdf.setFillColor(...COR); pdf.rect(0,0,PW,HH,'F');
    const dk = COR.map((c) => c*0.78|0);
    pdf.setFillColor(...dk); pdf.rect(0,HH-0.8,PW,0.8,'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8); pdf.setTextColor(255,255,255);
    pdf.text(sec, ML, 8.5);
    pdf.setFont('helvetica','normal');
    pdf.text('HEDRA', PW-MR, 8.5, {align:'right'});
  }

  const DIMS = [
    {label:'Autodomínio', val:scores.autodominio, c:rgb('#8B1A1A')},
    {label:'Direção',     val:scores.direcao,     c:rgb('#C8961A')},
    {label:'Influência',  val:scores.influencia,  c:rgb('#1A5276')},
    {label:'Maestria',    val:scores.maestria,    c:rgb('#1A6B45')},
  ];

  // ── Captura de assets visuais ──────────────────────────────────────────────

  // 1. Logo do cabeçalho do site
  let logoData = null;
  try {
    const logoEl = document.querySelector('header img');
    if (logoEl && logoEl.complete && logoEl.naturalWidth > 0) {
      const c = document.createElement('canvas');
      c.width = logoEl.naturalWidth; c.height = logoEl.naturalHeight;
      c.getContext('2d').drawImage(logoEl, 0, 0);
      logoData = { data: c.toDataURL('image/png'), w: logoEl.naturalWidth, h: logoEl.naturalHeight };
    }
  } catch(e) {}

  // 2. SVG do mapa HEDRA — já renderizado no DOM pela página 2 do resultado
  let mapaImgData = null;
  try {
    const svgEl = document.querySelector('.rp-mapa-wrap svg.hedra-mapa')
               || document.querySelector('svg.hedra-mapa');
    if (svgEl) {
      const VW = 400, VH = 360;
      const SCALE = 3;
      const svgStr = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement('canvas');
      canvas.width = VW * SCALE; canvas.height = VH * SCALE;
      const ctx = canvas.getContext('2d');
      // Fundo bege claro igual ao site
      ctx.fillStyle = '#F8F6F2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await new Promise((res, rej) => {
        const img = new Image();
        const blob = new Blob([svgStr], {type:'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); res(); };
        img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('svg render failed')); };
        img.src = url;
      });
      mapaImgData = canvas.toDataURL('image/png');
    }
  } catch(e) { console.warn('Mapa SVG não capturado:', e); }

  // ─── SLIDE 1: CAPA ─────────────────────────────────────────────────────────
  const LP = PW * 0.44;

  pdf.setFillColor(...COR); pdf.rect(0, 0, LP, PH, 'F');

  // Linhas decorativas sutis no painel esquerdo
  pdf.setDrawColor(...COR.map((c) => c * 0.72 | 0));
  pdf.setLineWidth(0.3);
  for (let i = 0; i < 4; i++) pdf.line(0, PH*0.58+i*9, LP, PH*0.58+i*9);

  let ly = 24;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); pdf.setTextColor(200,200,200);
  pdf.text('INVENTÁRIO HEDRA', ML, ly); ly += 10;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(24); pdf.setTextColor(255,255,255);
  const titLines = pdf.splitTextToSize('Matriz de Maturidade da Liderança', LP-ML-6);
  pdf.text(titLines, ML, ly); ly += titLines.length*lh(24)+8;

  pdf.setFillColor(255,255,255); pdf.rect(ML, ly, 36, 1.2, 'F'); ly += 7;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(13); pdf.setTextColor(255,255,255);
  pdf.text(pf.nome, ML, ly); ly += lh(13)+3;

  pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5); pdf.setTextColor(220,218,212);
  pdf.text(nome, ML, ly);

  // Logo no rodapé do painel esquerdo
  if (logoData) {
    try {
      const lh_px = 20, lw_px = Math.round(logoData.w * 20 / logoData.h);
      pdf.addImage(logoData.data, 'PNG', ML, PH-16, lw_px * 0.264583, lh_px * 0.264583);
    } catch(e) {}
  }

  // Painel direito (branco)
  const RX = LP + 12, RW = PW - RX - 16;
  let ry = 20;

  pdf.setFillColor(248,246,242); pdf.rect(RX, ry, RW, 52, 'F'); ry += 8;

  [[nome,'NOME'],[emp||'—','EMPRESA'],[cargo||'—','CARGO']].forEach(([val,lbl]) => {
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7); pdf.setTextColor(155,148,135);
    pdf.text(lbl, RX+7, ry); ry += lh(7)+0.5;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(10); pdf.setTextColor(22,22,22);
    const vls = pdf.splitTextToSize(val, RW-14);
    pdf.text(vls, RX+7, ry); ry += vls.length*lh(10)+4;
  });

  ry += 4;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); pdf.setTextColor(150,143,130);
  pdf.text('DIMENSÕES DE LIDERANÇA', RX, ry); ry += 5.5;

  DIMS.forEach((d) => {
    pdf.setFillColor(225,222,215); pdf.rect(RX, ry, RW, 6.5, 'F');
    pdf.setFillColor(...d.c); pdf.rect(RX, ry, RW*d.val/100, 6.5, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); pdf.setTextColor(255,255,255);
    pdf.text(d.label, RX+2.5, ry+4.5);
    pdf.setTextColor(38,38,38); pdf.text(d.val+'%', RX+RW, ry+4.5, {align:'right'});
    ry += 9.5;
  });

  rodape('Inventário HEDRA — Asséssor Consultoria e Treinamento');

  // ─── SLIDE 2: CAMPO DE LIDERANÇA ───────────────────────────────────────────
  novaPagina();
  header('SEU CAMPO DE LIDERANÇA');

  const S2T = HH + 5;            // topo do conteúdo (18mm)
  const MAP_W = 113;             // largura da imagem do mapa (mm)
  const MAP_H = MAP_W * 360/400; // altura proporcional (~101.7mm)
  const MAP_X = ML;

  // Coluna direita: cards dos quadrantes
  const CARD_COL_X = ML + MAP_W + 8;
  const CARD_COL_W = CW - MAP_W - 8;       // ~132mm
  const CARD_GAP   = 3;
  const CARD_W     = (CARD_COL_W - CARD_GAP) / 2;   // ~64.5mm cada
  const CARD_H     = (PH - S2T - 14 - CARD_GAP) / 2; // ~86mm cada

  // Mapa HEDRA como imagem (PNG capturado do SVG)
  if (mapaImgData) {
    pdf.addImage(mapaImgData, 'PNG', MAP_X, S2T, MAP_W, MAP_H);
  } else {
    // Fallback: grade simples de quadrantes
    _mapaFallback(pdf, MAP_X, S2T, MAP_W, MAP_H, scores.perfil, COR, rgb, tint);
  }

  // Headline + barras abaixo do mapa (na coluna esquerda)
  let belowY = S2T + MAP_H + 5;
  pdf.setFont('helvetica','italic'); pdf.setFontSize(9); pdf.setTextColor(...COR);
  const hlSplit = pdf.splitTextToSize(pc.headline, MAP_W);
  pdf.text(hlSplit.slice(0,3), MAP_X, belowY); belowY += Math.min(3,hlSplit.length)*lh(9)+4;

  const BAR_W = MAP_W * 0.88;
  DIMS.forEach((d) => {
    pdf.setFillColor(222,219,212); pdf.rect(MAP_X, belowY, BAR_W, 5, 'F');
    pdf.setFillColor(...d.c); pdf.rect(MAP_X, belowY, BAR_W*d.val/100, 5, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7); pdf.setTextColor(255,255,255);
    pdf.text(d.label, MAP_X+2, belowY+3.5);
    pdf.setTextColor(35,35,35); pdf.text(d.val+'%', MAP_X+BAR_W+1.5, belowY+3.5);
    belowY += 7.5;
  });

  // 4 Cards dos quadrantes (2×2) na coluna direita — estilo igual ao site
  const QDATA = [
    {key:'comunicador', nome:'Comunicador Frágil',              cor:rgb('#B7770D'), col:0, row:0},
    {key:'lider',       nome:'Líder de Influência Estratégica', cor:rgb('#1A6B45'), col:1, row:0},
    {key:'operador',    nome:'Operador Sobrecarregado',         cor:rgb('#CC4400'), col:0, row:1},
    {key:'executor',    nome:'Executor Eficiente',               cor:rgb('#1A5276'), col:1, row:1},
  ];

  QDATA.forEach(({key, nome: qn, cor: qc, col, row}) => {
    const cx = CARD_COL_X + col*(CARD_W+CARD_GAP);
    const cy = S2T + row*(CARD_H+CARD_GAP);
    const ativo = key === scores.perfil;
    const [r,g,b] = qc;
    const bgAlpha = ativo ? 0.12 : 0.05;
    const bgR = r + Math.round((255-r)*(1-bgAlpha));
    const bgG = g + Math.round((255-g)*(1-bgAlpha));
    const bgB = b + Math.round((255-b)*(1-bgAlpha));

    // Card com cantos arredondados (igual ao site)
    pdf.setFillColor(bgR,bgG,bgB);
    pdf.setDrawColor(...qc);
    pdf.setLineWidth(ativo ? 1.0 : 0.22);
    pdf.roundedRect(cx, cy, CARD_W, CARD_H, 3, 3, 'FD');

    let textY = cy + 6;

    // Badge "SEU RESULTADO" (ativo)
    if (ativo) {
      pdf.setFillColor(...qc);
      pdf.roundedRect(cx+3, textY, CARD_W-6, 6, 1, 1, 'F');
      pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5); pdf.setTextColor(255,255,255);
      pdf.text('SEU RESULTADO', cx+CARD_W/2, textY+4.3, {align:'center'});
      textY += 9;
    }

    // Nome do perfil
    pdf.setFont('helvetica','bold'); pdf.setFontSize(ativo?9.5:8.5); pdf.setTextColor(...qc);
    const nls = pdf.splitTextToSize(qn, CARD_W-7);
    pdf.text(nls, cx+3.5, textY); textY += nls.length*lh(ativo?9.5:8.5)+2.5;

    // Resumo (texto que cabe no card)
    const resumo = RC.p2_resumos[key];
    pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5); pdf.setTextColor(44,42,38);
    const rls = pdf.splitTextToSize(resumo, CARD_W-7);
    const maxL = Math.floor((cy+CARD_H-textY-4) / lh(7.5));
    pdf.text(rls.slice(0,maxL), cx+3.5, textY);
  });

  rodape();

  // ─── SLIDE 3: FORÇAS & PONTOS DE ATENÇÃO ───────────────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S3T = HH + 6;
  pdf.setFont('helvetica','italic'); pdf.setFontSize(9); pdf.setTextColor(88,83,76);
  const intro3 = pdf.splitTextToSize(pc.p3_intro.slice(0,2).join(' '), CW);
  pdf.text(intro3.slice(0,2), ML, S3T+6);

  const COLS_TOP = S3T + 6 + Math.min(2, intro3.length)*lh(9) + 7;
  const COLW3 = (CW - 6) / 2;

  // Coluna FORÇAS
  let lcy3 = COLS_TOP;
  pdf.setFillColor(...COR); pdf.rect(ML, lcy3, COLW3, 9, 'F');
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
  pdf.text('FORÇAS', ML+5, lcy3+6.2);
  lcy3 += 12;

  pc.forcas.forEach((f) => {
    const fl = pdf.splitTextToSize(f, COLW3-12);
    pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); pdf.setTextColor(...COR);
    pdf.text('+', ML+3, lcy3+0.3);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(35,35,35);
    pdf.text(fl, ML+9, lcy3);
    lcy3 += fl.length*lh(9)+1.5;
  });

  // Coluna PONTOS DE ATENÇÃO
  const RC3X = ML + COLW3 + 6;
  const WARN = rgb('#CC4400');
  let rcy3 = COLS_TOP;
  pdf.setFillColor(...WARN); pdf.rect(RC3X, rcy3, COLW3, 9, 'F');
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
  pdf.text('PONTOS DE ATENÇÃO', RC3X+5, rcy3+6.2);
  rcy3 += 12;

  pc.pontos.forEach((p) => {
    const pl = pdf.splitTextToSize(p, COLW3-12);
    pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); pdf.setTextColor(...WARN);
    pdf.text('!', RC3X+3.5, rcy3+0.3);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(35,35,35);
    pdf.text(pl, RC3X+9, rcy3);
    rcy3 += pl.length*lh(9)+1.5;
  });

  rodape();

  // ─── SLIDE 4: SOB PRESSÃO & MOVIMENTO DE MATURIDADE ────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S4T = HH + 8;
  let cy4 = S4T;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(...COR);
  pdf.text('O QUE PODE ACONTECER SOB PRESSÃO', ML, cy4); cy4 += 8;

  pc.pressao.forEach((p) => {
    const pl = pdf.splitTextToSize(p, CW);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor(48,45,42);
    pdf.text(pl, ML, cy4); cy4 += pl.length*lh(9.5)+3;
  });

  cy4 += 5;
  const mvH = PH - cy4 - 14;
  pdf.setFillColor(...tint(0.07)); pdf.rect(ML, cy4, CW, mvH, 'F');
  pdf.setFillColor(...COR); pdf.rect(ML, cy4, 4, mvH, 'F');

  let mvy = cy4 + 8;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
  pdf.text('MOVIMENTO DE MATURIDADE', ML+9, mvy); mvy += 8;

  pdf.setFont('helvetica','italic'); pdf.setFontSize(13); pdf.setTextColor(22,22,22);
  const mvls = pdf.splitTextToSize(pc.movimento, CW-18);
  pdf.text(mvls, ML+9, mvy); mvy += mvls.length*lh(13)+5;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); pdf.setTextColor(...COR);
  pdf.text('Prioridade HEDRA: '+pc.prioridade, ML+9, mvy);

  rodape();

  // ─── SLIDE 5: SEU CAMINHO DE MATURIDADE ────────────────────────────────────
  novaPagina();
  header('SEU CAMINHO DE MATURIDADE');

  const S5T = HH + 8;
  let cy5 = S5T;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(16); pdf.setTextColor(22,22,22);
  const t5 = pdf.splitTextToSize(pc.p4_titulo, CW * 0.6);
  pdf.text(t5, ML, cy5); cy5 += t5.length*lh(16) + 8;

  // Passos em blocos horizontais com número colorido
  const STEP_COUNT = pc.p4_steps.length;
  const STEP_GAP   = 2.5;
  const STEP_W     = (CW - STEP_GAP*(STEP_COUNT-1)) / STEP_COUNT;
  const STEP_NUM_H = 10;
  const STEP_BODY_H= 22;

  pc.p4_steps.forEach((s, i) => {
    const sx = ML + i*(STEP_W+STEP_GAP);
    // Número (fundo cheio)
    pdf.setFillColor(...COR); pdf.roundedRect(sx, cy5, STEP_W, STEP_NUM_H, 1.5, 1.5, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.setTextColor(255,255,255);
    pdf.text(String(i+1), sx+STEP_W/2, cy5+7.5, {align:'center'});
    // Corpo (fundo claro)
    pdf.setFillColor(...tint(0.1)); pdf.rect(sx, cy5+STEP_NUM_H, STEP_W, STEP_BODY_H, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
    const sls = pdf.splitTextToSize(s, STEP_W-4);
    const sty = cy5+STEP_NUM_H + (STEP_BODY_H-sls.length*lh(8.5))/2 + lh(8.5)*0.85;
    pdf.text(sls, sx+STEP_W/2, sty, {align:'center'});
  });

  cy5 += STEP_NUM_H + STEP_BODY_H + 12;

  // Perguntas para reflexão em grade 2×2
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
  pdf.text('PERGUNTAS PARA REFLEXÃO', ML, cy5); cy5 += 7;

  const QPW = (CW - 8) / 2;
  const QPH = (PH - cy5 - 14) / Math.ceil(pc.p4_perguntas.length/2);

  pc.p4_perguntas.forEach((q, i) => {
    const qcol = i%2, qrow = Math.floor(i/2);
    const qx = ML + qcol*(QPW+8);
    const qy = cy5 + qrow*QPH;
    pdf.setFont('helvetica','bold'); pdf.setFontSize(10); pdf.setTextColor(...COR);
    pdf.text(String(i+1)+'.', qx, qy);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(44,42,38);
    pdf.text(pdf.splitTextToSize(q, QPW-8), qx+7, qy);
  });

  rodape();

  // ─── SLIDE 6: CONSIDERAÇÕES FINAIS ─────────────────────────────────────────
  novaPagina();
  header('CONSIDERAÇÕES FINAIS');

  const S6T   = HH + 7;
  const LCOL6 = CW * 0.42;
  const RCOL6_X = ML + LCOL6 + 10;
  const RCOL6_W = CW - LCOL6 - 10;

  // Coluna esquerda — texto de encerramento
  let lcy6 = S6T;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(13.5); pdf.setTextColor(22,22,22);
  const cl1 = pdf.splitTextToSize('A Matriz HEDRA não define quem você é.', LCOL6);
  pdf.text(cl1, ML, lcy6); lcy6 += cl1.length*lh(13.5)+5;

  [
    'Ela mostra de onde sua liderança está partindo hoje.',
    'O desenvolvimento acontece quando você reconhece seus padrões atuais e começa a fazer movimentos mais intencionais em direção a uma liderança capaz de gerar clareza, autonomia e impacto sustentável.',
    'Liderança madura não é fazer mais. É ampliar sua capacidade de gerar resultados através das pessoas.',
  ].forEach((t) => {
    const tls = pdf.splitTextToSize(t, LCOL6);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(54,52,48);
    pdf.text(tls, ML, lcy6); lcy6 += tls.length*lh(9)+3.5;
  });

  const fechY = PH - 22;
  pdf.setFont('helvetica','italic'); pdf.setFontSize(8); pdf.setTextColor(128,122,112);
  pdf.text(pdf.splitTextToSize(
    'Lembre-se: A liderança não é fixa, é evolutiva. Seu resultado não define quem você é como líder — ele revela como você está liderando hoje.',
    LCOL6
  ), ML, fechY);

  // Coluna direita — carta pessoal
  const ctaH = PH - S6T - 12;
  pdf.setFillColor(...tint(0.07)); pdf.rect(RCOL6_X, S6T, RCOL6_W, ctaH, 'F');
  pdf.setFillColor(...COR); pdf.rect(RCOL6_X, S6T, RCOL6_W, 3, 'F');

  let rcy6 = S6T + 10;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(11.5); pdf.setTextColor(...COR);
  pdf.text('Caro(a) '+fnome+',', RCOL6_X+7, rcy6); rcy6 += lh(11.5)+4;

  pc.p5_texto.forEach((t) => {
    const tls = pdf.splitTextToSize(t, RCOL6_W-14);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5); pdf.setTextColor(38,36,33);
    pdf.text(tls, RCOL6_X+7, rcy6); rcy6 += tls.length*lh(8.5)+2.5;
  });

  rodape();
  pdf.save('relatorio-hedra.pdf');
}

// Fallback caso o SVG não esteja disponível no DOM
function _mapaFallback(pdf, x, y, w, h, perfil, COR, rgb, tint) {
  const QDATA = [
    {key:'comunicador', nome:'Comunicador Frágil',              cor:rgb('#B7770D'), col:0, row:0},
    {key:'lider',       nome:'Líder de Influência Estratégica', cor:rgb('#1A6B45'), col:1, row:0},
    {key:'operador',    nome:'Operador Sobrecarregado',         cor:rgb('#CC4400'), col:0, row:1},
    {key:'executor',    nome:'Executor Eficiente',               cor:rgb('#1A5276'), col:1, row:1},
  ];
  const QW = (w-2)/2, QH = (h-2)/2;
  QDATA.forEach(({key, nome: qn, cor: qc, col, row}) => {
    const qx = x+col*(QW+2), qy = y+row*(QH+2);
    const ativo = key === perfil;
    const [r,g,b] = qc;
    pdf.setFillColor(r+((255-r)*(ativo?0.86:0.95))|0, g+((255-g)*(ativo?0.86:0.95))|0, b+((255-b)*(ativo?0.86:0.95))|0);
    pdf.setDrawColor(...qc); pdf.setLineWidth(ativo?0.8:0.2);
    pdf.roundedRect(qx, qy, QW, QH, 2, 2, 'FD');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...qc);
    pdf.text(pdf.splitTextToSize(qn, QW-5), qx+3, qy+8);
    if (ativo) {
      pdf.setFillColor(...qc);
      pdf.rect(qx+3, qy+QH-7, QW-6, 5.5, 'F');
      pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5); pdf.setTextColor(255,255,255);
      pdf.text('SEU RESULTADO', qx+QW/2, qy+QH-3.2, {align:'center'});
    }
  });
}
