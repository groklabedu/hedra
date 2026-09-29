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

  const HH = 13;
  function header(sec) {
    pdf.setFillColor(...COR); pdf.rect(0,0,PW,HH,'F');
    pdf.setFillColor(...COR.map((c) => c*0.78|0)); pdf.rect(0,HH-0.8,PW,0.8,'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8); pdf.setTextColor(255,255,255);
    pdf.text(sec, ML, 8.5);
    pdf.setFont('helvetica','normal'); pdf.text('HEDRA', PW-MR, 8.5, {align:'right'});
  }

  const DIMS = [
    {label:'Autodomínio', val:scores.autodominio, c:rgb('#8B1A1A')},
    {label:'Direção',     val:scores.direcao,     c:rgb('#C8961A')},
    {label:'Influência',  val:scores.influencia,  c:rgb('#1A5276')},
    {label:'Maestria',    val:scores.maestria,    c:rgb('#1A6B45')},
  ];

  // ── Carrega imagem como data URL via canvas (mantém transparência) ────────
  async function loadImg(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        c.getContext('2d').drawImage(img, 0, 0);
        res({ data: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = () => res(null);
      img.src = src;
    });
  }

  // Adiciona imagem mantendo proporção, centralizada no box (x,y,maxW,maxH)
  function addImgFit(imgObj, x, y, maxW, maxH) {
    if (!imgObj) return;
    const ratio = imgObj.w / imgObj.h;
    let w = maxW, h = maxW / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    const dx = x + (maxW - w) / 2;
    const dy = y + (maxH - h) / 2;
    try { pdf.addImage(imgObj.data, 'PNG', dx, dy, w, h); } catch(e) {}
  }

  // ── Captura assets de forma paralela ──────────────────────────────────────
  const p = scores.perfil;
  const [imgCapa, imgP3, imgP4, imgFinal, logoObj, mapaImgData] = await Promise.all([
    loadImg('assets/resultado/p1.png'),
    loadImg(`assets/resultado/p3-${p}.png`),
    loadImg(`assets/resultado/p4-${p}.png`),
    loadImg('assets/resultado/p5.png'),
    // Logo
    (async () => {
      try {
        const el = document.querySelector('header img');
        if (!el || !el.complete || !el.naturalWidth) return null;
        const c = document.createElement('canvas');
        c.width = el.naturalWidth; c.height = el.naturalHeight;
        c.getContext('2d').drawImage(el, 0, 0);
        return { data: c.toDataURL('image/png'), w: el.naturalWidth, h: el.naturalHeight };
      } catch(e) { return null; }
    })(),
    // SVG do mapa HEDRA
    (async () => {
      try {
        const svgEl = document.querySelector('.rp-mapa-wrap svg.hedra-mapa')
                   || document.querySelector('svg.hedra-mapa');
        if (!svgEl) return null;
        const VW = 400, VH = 360, SCALE = 3;
        const svgStr = new XMLSerializer().serializeToString(svgEl);
        const canvas = document.createElement('canvas');
        canvas.width = VW*SCALE; canvas.height = VH*SCALE;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#F8F6F2';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        await new Promise((res,rej) => {
          const img = new Image();
          const blob = new Blob([svgStr], {type:'image/svg+xml;charset=utf-8'});
          const url = URL.createObjectURL(blob);
          img.onload = () => { ctx.drawImage(img,0,0,canvas.width,canvas.height); URL.revokeObjectURL(url); res(); };
          img.onerror = () => { URL.revokeObjectURL(url); rej(); };
          img.src = url;
        });
        return canvas.toDataURL('image/png');
      } catch(e) { return null; }
    })(),
  ]);

  // ─── SLIDE 1: CAPA ─────────────────────────────────────────────────────────
  const LP = PW * 0.44; // painel esquerdo ~130mm

  pdf.setFillColor(...COR); pdf.rect(0, 0, LP, PH, 'F');
  pdf.setDrawColor(...COR.map((c) => c*0.72|0)); pdf.setLineWidth(0.3);
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

  if (logoObj) {
    try {
      const lw = Math.round(logoObj.w * 18 / logoObj.h) * 0.264583;
      pdf.addImage(logoObj.data, 'PNG', ML, PH-17, lw, 18*0.264583);
    } catch(e) {}
  }

  // Painel direito
  const RX = LP + 12, RW = PW - RX - 14;
  let ry = 20;

  // Info box
  pdf.setFillColor(248,246,242); pdf.rect(RX, ry, RW, 48, 'F'); ry += 7;
  [[nome,'NOME'],[emp||'—','EMPRESA'],[cargo||'—','CARGO']].forEach(([val,lbl]) => {
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7); pdf.setTextColor(155,148,135);
    pdf.text(lbl, RX+6, ry); ry += lh(7)+0.5;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor(22,22,22);
    const vls = pdf.splitTextToSize(val, RW-12);
    pdf.text(vls, RX+6, ry); ry += vls.length*lh(9.5)+3.5;
  });

  // Barras de dimensões
  ry += 3;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); pdf.setTextColor(148,142,130);
  pdf.text('DIMENSÕES DE LIDERANÇA', RX, ry); ry += 5.5;
  DIMS.forEach((d) => {
    pdf.setFillColor(225,222,215); pdf.rect(RX, ry, RW, 6.5, 'F');
    pdf.setFillColor(...d.c); pdf.rect(RX, ry, RW*d.val/100, 6.5, 'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); pdf.setTextColor(255,255,255);
    pdf.text(d.label, RX+2.5, ry+4.5);
    pdf.setTextColor(35,35,35); pdf.text(d.val+'%', RX+RW, ry+4.5, {align:'right'});
    ry += 9.5;
  });

  // Ilustração p1 no espaço restante
  const ilTop = ry + 6;
  const ilH = PH - ilTop - 12;
  if (imgCapa && ilH > 20) addImgFit(imgCapa, RX, ilTop, RW, ilH);

  rodape('Inventário HEDRA — Asséssor Consultoria e Treinamento');

  // ─── SLIDE 2: CAMPO DE LIDERANÇA ───────────────────────────────────────────
  novaPagina();
  header('SEU CAMPO DE LIDERANÇA');

  const S2T    = HH + 5;
  const MAP_W  = 113;
  const MAP_H  = MAP_W * 360 / 400; // ~101.7mm
  const MAP_X  = ML;
  const CX     = ML + MAP_W + 8;   // coluna direita começa aqui
  const CW2    = CW - MAP_W - 8;   // ~132mm

  if (mapaImgData) {
    pdf.addImage(mapaImgData, 'PNG', MAP_X, S2T, MAP_W, MAP_H);
  } else {
    _mapaFallback(pdf, MAP_X, S2T, MAP_W, MAP_H, p, COR, rgb, tint);
  }

  // Headline + barras abaixo do mapa
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

  // 4 Cards dos quadrantes (2×2) na coluna direita
  const QDATA = [
    {key:'comunicador', nome:'Comunicador Frágil',              cor:rgb('#B7770D'), col:0, row:0},
    {key:'lider',       nome:'Líder de Influência Estratégica', cor:rgb('#1A6B45'), col:1, row:0},
    {key:'operador',    nome:'Operador Sobrecarregado',         cor:rgb('#CC4400'), col:0, row:1},
    {key:'executor',    nome:'Executor Eficiente',               cor:rgb('#1A5276'), col:1, row:1},
  ];
  const CARD_GAP = 3;
  const CARD_W   = (CW2 - CARD_GAP) / 2;
  const CARD_H   = (PH - S2T - 14 - CARD_GAP) / 2;

  QDATA.forEach(({key, nome: qn, cor: qc, col, row}) => {
    const cx = CX + col*(CARD_W+CARD_GAP);
    const cy = S2T + row*(CARD_H+CARD_GAP);
    const ativo = key === p;
    const [r,g,b] = qc;
    const bgAlpha = ativo ? 0.12 : 0.05;
    pdf.setFillColor(r+((255-r)*(1-bgAlpha))|0, g+((255-g)*(1-bgAlpha))|0, b+((255-b)*(1-bgAlpha))|0);
    pdf.setDrawColor(...qc); pdf.setLineWidth(ativo?1.0:0.22);
    pdf.roundedRect(cx, cy, CARD_W, CARD_H, 3, 3, 'FD');

    let tY = cy+6;
    if (ativo) {
      pdf.setFillColor(...qc); pdf.roundedRect(cx+3, tY, CARD_W-6, 6, 1, 1, 'F');
      pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5); pdf.setTextColor(255,255,255);
      pdf.text('SEU RESULTADO', cx+CARD_W/2, tY+4.3, {align:'center'});
      tY += 9;
    }
    pdf.setFont('helvetica','bold'); pdf.setFontSize(ativo?9.5:8.5); pdf.setTextColor(...qc);
    const nls = pdf.splitTextToSize(qn, CARD_W-7);
    pdf.text(nls, cx+3.5, tY); tY += nls.length*lh(ativo?9.5:8.5)+2.5;
    pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5); pdf.setTextColor(44,42,38);
    const rls = pdf.splitTextToSize(RC.p2_resumos[key], CARD_W-7);
    const maxL = Math.floor((cy+CARD_H-tY-4)/lh(7.5));
    pdf.text(rls.slice(0,maxL), cx+3.5, tY);
  });

  rodape();

  // ─── SLIDE 3: FORÇAS & PONTOS DE ATENÇÃO ───────────────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S3T   = HH + 6;
  const IMG_W = 82; // coluna da ilustração
  const TXT_W = CW - IMG_W - 8; // coluna de texto ~163mm

  // Intro breve
  pdf.setFont('helvetica','italic'); pdf.setFontSize(9); pdf.setTextColor(88,83,76);
  const intro3 = pdf.splitTextToSize(pc.p3_intro[0], TXT_W);
  pdf.text(intro3.slice(0,2), ML, S3T+6);
  const COLS_TOP = S3T + 6 + Math.min(2,intro3.length)*lh(9) + 7;
  const COLW3 = (TXT_W - 6) / 2;

  // Coluna FORÇAS
  let lcy3 = COLS_TOP;
  pdf.setFillColor(...COR); pdf.rect(ML, lcy3, COLW3, 9, 'F');
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
  pdf.text('FORÇAS', ML+5, lcy3+6.2); lcy3 += 12;
  pc.forcas.forEach((f) => {
    const fl = pdf.splitTextToSize(f, COLW3-12);
    pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); pdf.setTextColor(...COR);
    pdf.text('+', ML+3, lcy3+0.3);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(35,35,35);
    pdf.text(fl, ML+9, lcy3); lcy3 += fl.length*lh(9)+1.5;
  });

  // Coluna PONTOS
  const RC3X = ML + COLW3 + 6;
  const WARN  = rgb('#CC4400');
  let rcy3 = COLS_TOP;
  pdf.setFillColor(...WARN); pdf.rect(RC3X, rcy3, COLW3, 9, 'F');
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
  pdf.text('PONTOS DE ATENÇÃO', RC3X+5, rcy3+6.2); rcy3 += 12;
  pc.pontos.forEach((pt) => {
    const pl = pdf.splitTextToSize(pt, COLW3-12);
    pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); pdf.setTextColor(...WARN);
    pdf.text('!', RC3X+3.5, rcy3+0.3);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(35,35,35);
    pdf.text(pl, RC3X+9, rcy3); rcy3 += pl.length*lh(9)+1.5;
  });

  // Ilustração p3 à direita (altura total do conteúdo)
  const IL3_X = ML + TXT_W + 8;
  const IL3_H = PH - S3T - 12;
  addImgFit(imgP3, IL3_X, S3T, IMG_W, IL3_H);

  rodape();

  // ─── SLIDE 4: SOB PRESSÃO & MOVIMENTO ──────────────────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S4T = HH + 8;
  let cy4 = S4T;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(...COR);
  pdf.text('O QUE PODE ACONTECER SOB PRESSÃO', ML, cy4); cy4 += 8;

  pc.pressao.forEach((pt) => {
    const pl = pdf.splitTextToSize(pt, TXT_W);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor(48,45,42);
    pdf.text(pl, ML, cy4); cy4 += pl.length*lh(9.5)+3;
  });

  cy4 += 5;
  const mvH = PH - cy4 - 14;
  pdf.setFillColor(...tint(0.07)); pdf.rect(ML, cy4, TXT_W, mvH, 'F');
  pdf.setFillColor(...COR); pdf.rect(ML, cy4, 4, mvH, 'F');

  let mvy = cy4+8;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
  pdf.text('MOVIMENTO DE MATURIDADE', ML+9, mvy); mvy += 8;
  pdf.setFont('helvetica','italic'); pdf.setFontSize(13); pdf.setTextColor(22,22,22);
  const mvls = pdf.splitTextToSize(pc.movimento, TXT_W-18);
  pdf.text(mvls, ML+9, mvy); mvy += mvls.length*lh(13)+5;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9.5); pdf.setTextColor(...COR);
  pdf.text('Prioridade HEDRA: '+pc.prioridade, ML+9, mvy);

  // Ilustração p4 à direita
  addImgFit(imgP4, IL3_X, S4T, IMG_W, PH-S4T-12);

  rodape();

  // ─── SLIDE 5: SEU CAMINHO DE MATURIDADE ────────────────────────────────────
  novaPagina();
  header('SEU CAMINHO DE MATURIDADE');

  const S5T = HH + 8;
  let cy5 = S5T;

  const IL5_W = 80;
  const TXT5_W = CW - IL5_W - 8;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(16); pdf.setTextColor(22,22,22);
  const t5 = pdf.splitTextToSize(pc.p4_titulo, TXT5_W * 0.85);
  pdf.text(t5, ML, cy5); cy5 += t5.length*lh(16)+8;

  const STEP_COUNT = pc.p4_steps.length;
  const STEP_GAP   = 2.5;
  const STEP_W     = (TXT5_W - STEP_GAP*(STEP_COUNT-1)) / STEP_COUNT;
  const STEP_NUM_H = 10;
  const STEP_BODY_H= 24;

  pc.p4_steps.forEach((s, i) => {
    const sx = ML + i*(STEP_W+STEP_GAP);
    pdf.setFillColor(...COR); pdf.roundedRect(sx, cy5, STEP_W, STEP_NUM_H, 1.5,1.5,'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(12); pdf.setTextColor(255,255,255);
    pdf.text(String(i+1), sx+STEP_W/2, cy5+7.5, {align:'center'});
    pdf.setFillColor(...tint(0.1)); pdf.rect(sx, cy5+STEP_NUM_H, STEP_W, STEP_BODY_H,'F');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
    const sls = pdf.splitTextToSize(s, STEP_W-4);
    const sty = cy5+STEP_NUM_H+(STEP_BODY_H-sls.length*lh(8.5))/2+lh(8.5)*0.85;
    pdf.text(sls, sx+STEP_W/2, sty, {align:'center'});
  });

  cy5 += STEP_NUM_H+STEP_BODY_H+12;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
  pdf.text('PERGUNTAS PARA REFLEXÃO', ML, cy5); cy5 += 7;

  const QPW = (TXT5_W - 8) / 2;
  const QPH = 25; // altura fixa por linha — evita distribuição desproporcional
  pc.p4_perguntas.forEach((q,i) => {
    const qcol = i%2, qrow = Math.floor(i/2);
    const qx = ML+qcol*(QPW+8), qy = cy5+qrow*QPH;
    pdf.setFont('helvetica','bold'); pdf.setFontSize(10); pdf.setTextColor(...COR);
    pdf.text(String(i+1)+'.', qx, qy);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9); pdf.setTextColor(44,42,38);
    pdf.text(pdf.splitTextToSize(q, QPW-8), qx+7, qy);
  });

  // Ilustração à direita (preenche o espaço vertical)
  addImgFit(imgFinal, ML + TXT5_W + 8, S5T, IL5_W, PH - S5T - 12);

  rodape();

  // ─── SLIDE 6: CONSIDERAÇÕES FINAIS ─────────────────────────────────────────
  novaPagina();
  header('CONSIDERAÇÕES FINAIS');

  const S6T  = HH + 7;
  // 3 colunas: ilustração | texto | carta
  const IL6_W   = 52;
  const TX6_W   = 90;
  const IL6_X   = ML;
  const TX6_X   = IL6_X + IL6_W + 8;
  const CARTA_X = TX6_X + TX6_W + 8;
  const CARTA_W = CW - IL6_W - TX6_W - 16;  // 253 - 52 - 90 - 16 = 95mm
  const IL6_H   = PH - S6T - 12;

  if (imgFinal) addImgFit(imgFinal, IL6_X, S6T, IL6_W, IL6_H);

  let lcy6 = S6T;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(13); pdf.setTextColor(22,22,22);
  const cl1 = pdf.splitTextToSize('A Matriz HEDRA não define quem você é.', TX6_W);
  pdf.text(cl1, TX6_X, lcy6); lcy6 += cl1.length*lh(13)+5;

  [
    'Ela mostra de onde sua liderança está partindo hoje.',
    'O desenvolvimento acontece quando você reconhece seus padrões atuais e começa a fazer movimentos mais intencionais.',
    'Liderança madura não é fazer mais. É ampliar sua capacidade de gerar resultados através das pessoas.',
  ].forEach((t) => {
    const tls = pdf.splitTextToSize(t, TX6_W);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5); pdf.setTextColor(54,52,48);
    pdf.text(tls, TX6_X, lcy6); lcy6 += tls.length*lh(8.5)+3.5;
  });

  const fechY = PH - 24;
  pdf.setFont('helvetica','italic'); pdf.setFontSize(7.5); pdf.setTextColor(128,122,112);
  pdf.text(pdf.splitTextToSize(
    'Lembre-se: A liderança não é fixa, é evolutiva.',
    TX6_W
  ), TX6_X, fechY);

  // Carta pessoal
  const ctaH = PH - S6T - 12;
  pdf.setFillColor(...tint(0.07)); pdf.rect(CARTA_X, S6T, CARTA_W, ctaH, 'F');
  pdf.setFillColor(...COR); pdf.rect(CARTA_X, S6T, CARTA_W, 3, 'F');

  let rcy6 = S6T+10;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.setTextColor(...COR);
  pdf.text('Caro(a) '+fnome+',', CARTA_X+6, rcy6); rcy6 += lh(11)+4;
  pc.p5_texto.forEach((t) => {
    const tls = pdf.splitTextToSize(t, CARTA_W-12);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8); pdf.setTextColor(38,36,33);
    pdf.text(tls, CARTA_X+6, rcy6); rcy6 += tls.length*lh(8)+2;
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
  const QW=(w-2)/2, QH=(h-2)/2;
  QDATA.forEach(({key,nome:qn,cor:qc,col,row}) => {
    const qx=x+col*(QW+2), qy=y+row*(QH+2);
    const ativo=key===perfil;
    const [r,g,b]=qc;
    pdf.setFillColor(r+((255-r)*(ativo?0.86:0.95))|0,g+((255-g)*(ativo?0.86:0.95))|0,b+((255-b)*(ativo?0.86:0.95))|0);
    pdf.setDrawColor(...qc); pdf.setLineWidth(ativo?0.8:0.2);
    pdf.roundedRect(qx,qy,QW,QH,2,2,'FD');
    pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...qc);
    pdf.text(pdf.splitTextToSize(qn,QW-5),qx+3,qy+8);
    if(ativo){
      pdf.setFillColor(...qc); pdf.rect(qx+3,qy+QH-7,QW-6,5.5,'F');
      pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5); pdf.setTextColor(255,255,255);
      pdf.text('SEU RESULTADO',qx+QW/2,qy+QH-3.2,{align:'center'});
    }
  });
}
