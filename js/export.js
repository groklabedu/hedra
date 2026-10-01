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
    pdf.text(lb||'Matriz HEDRA — Asséssor Consultoria e Treinamento', ML, PH-5.5);
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

  // ── Carrega imagem como data URL via canvas ───────────────────────────────
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

  // Versão com fundo branco (para ilustrações com transparência)
  async function loadImgWhite(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0);
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
    loadImgWhite('assets/resultado/p1.png'),
    loadImgWhite(`assets/resultado/p3-${p}.png`),
    loadImgWhite(`assets/resultado/p4-${p}.png`),
    loadImgWhite('assets/resultado/p5.png'),
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
    // SVG do mapa HEDRA (usa o existente no DOM ou gera temporariamente)
    (async () => {
      try {
        let svgEl = document.querySelector('.rp-mapa-wrap svg.hedra-mapa')
                 || document.querySelector('svg.hedra-mapa');
        let tmpDiv = null;

        if (!svgEl && typeof renderarMapaHEDRA === 'function') {
          const tmpId = '_hedra_pdf_tmp_' + Date.now();
          tmpDiv = document.createElement('div');
          tmpDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:400px;height:360px;overflow:hidden';
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.id = tmpId;
          tmpDiv.appendChild(tmpCanvas);
          document.body.appendChild(tmpDiv);
          renderarMapaHEDRA(tmpId, scores.eixoX, scores.eixoY, scores.perfil);
          svgEl = tmpDiv.querySelector('svg.hedra-mapa');
        }

        if (!svgEl) { if (tmpDiv) document.body.removeChild(tmpDiv); return null; }

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
        const dataUrl = canvas.toDataURL('image/png');
        if (tmpDiv) document.body.removeChild(tmpDiv);
        return dataUrl;
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

  rodape('Matriz HEDRA — Asséssor Consultoria e Treinamento');

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

  // Card único do perfil — altura ajustada ao conteúdo
  const CARD_W = CW2;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(17);
  const nls2 = pdf.splitTextToSize(pf.nome, CARD_W-14);
  pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5);
  const rls2 = pdf.splitTextToSize(RC.p2_resumos[p], CARD_W-14);
  const CARD_H = 8 + 8 + 7 + nls2.length*lh(17) + 8 + rls2.length*lh(10.5) + 10;

  pdf.setFillColor(...tint(0.09));
  pdf.setDrawColor(...COR); pdf.setLineWidth(1.2);
  pdf.roundedRect(CX, S2T, CARD_W, CARD_H, 3, 3, 'FD');

  let tY2 = S2T + 8;
  pdf.setFillColor(...COR); pdf.roundedRect(CX+6, tY2, CARD_W-12, 8, 1.5, 1.5, 'F');
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8); pdf.setTextColor(255,255,255);
  pdf.text('SEU RESULTADO', CX+CARD_W/2, tY2+5.5, {align:'center'});
  tY2 += 15;

  pdf.setFont('helvetica','bold'); pdf.setFontSize(17); pdf.setTextColor(...COR);
  pdf.text(nls2, CX+7, tY2); tY2 += nls2.length*lh(17)+8;

  pdf.setFont('helvetica','normal'); pdf.setFontSize(10.5); pdf.setTextColor(44,42,38);
  pdf.text(rls2, CX+7, tY2);

  // Ilustração abaixo do card
  const IMG2_Y = S2T + CARD_H + 4;
  const IMG2_H = PH - IMG2_Y - 12;
  if (IMG2_H > 15) addImgFit(imgP3, CX, IMG2_Y, CARD_W, IMG2_H);

  rodape();

  // ─── SLIDE 3: FORÇAS & PONTOS DE ATENÇÃO ───────────────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S3T   = HH + 6;
  const IMG_W = 95; // coluna da ilustração
  const TXT_W = CW - IMG_W - 8; // coluna de texto ~150mm

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
  pdf.text('FORÇAS', ML+5, lcy3+6.2); lcy3 += 16;
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
  pdf.text('PONTOS DE ATENÇÃO', RC3X+5, rcy3+6.2); rcy3 += 16;
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

  // Pré-calcular alturas para centralizar verticalmente
  const pressaoLines4 = pc.pressao.map((pt) => pdf.splitTextToSize(pt, TXT_W));
  const pressaoH4 = pressaoLines4.reduce((acc, pl) => acc + pl.length*lh(9.5)+3, 0);
  const mvls = pdf.splitTextToSize(pc.movimento, TXT_W-18);
  const mvH = 8 + 8 + mvls.length*lh(13)+5 + lh(9.5) + 10; // callout auto-height
  const totalH4 = 8 + pressaoH4 + 8 + mvH;
  const availH4 = PH - S4T - 12;
  let cy4 = S4T + Math.max(0, (availH4 - totalH4) / 2);

  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); pdf.setTextColor(...COR);
  pdf.text('O QUE PODE ACONTECER SOB PRESSÃO', ML, cy4); cy4 += 8;

  pressaoLines4.forEach((pl) => {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor(48,45,42);
    pdf.text(pl, ML, cy4); cy4 += pl.length*lh(9.5)+3;
  });

  cy4 += 8;
  pdf.setFillColor(...tint(0.07)); pdf.rect(ML, cy4, TXT_W, mvH, 'F');
  pdf.setFillColor(...COR); pdf.rect(ML, cy4, 4, mvH, 'F');

  let mvy = cy4+8;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
  pdf.text('MOVIMENTO DE MATURIDADE', ML+9, mvy); mvy += 8;
  pdf.setFont('helvetica','italic'); pdf.setFontSize(13); pdf.setTextColor(22,22,22);
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
  const STEP_GAP   = 8;
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

    // Seta para o próximo step
    if (i < STEP_COUNT - 1) {
      const ax = sx + STEP_W + 1.5;
      const ay = cy5 + STEP_NUM_H/2;
      const ae = ax + STEP_GAP - 3;
      pdf.setDrawColor(...COR); pdf.setLineWidth(0.6);
      pdf.line(ax, ay, ae, ay);
      pdf.line(ae - 2, ay - 1.5, ae, ay);
      pdf.line(ae - 2, ay + 1.5, ae, ay);
    }
  });

  cy5 += STEP_NUM_H+STEP_BODY_H+10;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); pdf.setTextColor(...COR);
  pdf.text('PERGUNTAS PARA REFLEXÃO', ML, cy5); cy5 += 7;

  pc.p4_perguntas.forEach((q, i) => {
    const qls = pdf.splitTextToSize(q, TXT5_W - 10);
    const qy = cy5;
    pdf.setFont('helvetica','bold'); pdf.setFontSize(10); pdf.setTextColor(...COR);
    pdf.text(String(i+1)+'.', ML, qy);
    pdf.setFont('helvetica','normal'); pdf.setFontSize(9.5); pdf.setTextColor(44,42,38);
    pdf.text(qls, ML+7, qy);
    cy5 += qls.length*lh(9.5) + 4;
    // Linha separadora
    if (i < pc.p4_perguntas.length - 1) {
      pdf.setDrawColor(220,217,210); pdf.setLineWidth(0.2);
      pdf.line(ML, cy5, ML+TXT5_W-10, cy5);
      cy5 += 4;
    }
  });

  // Ilustração à direita (preenche o espaço vertical)
  addImgFit(imgFinal, ML + TXT5_W + 8, S5T, IL5_W, PH - S5T - 12);

  rodape();

  // ─── SLIDE 6: CONSIDERAÇÕES FINAIS ─────────────────────────────────────────
  novaPagina();
  header('CONSIDERAÇÕES FINAIS');

  const S6T  = HH + 7;
  // 2 colunas: texto empilhado (esquerda) | ilustração (direita)
  const IL6_W   = 85;
  const TX6_W   = CW - IL6_W - 10;   // ~158mm
  const TX6_X   = ML;
  const IL6_X   = ML + TX6_W + 10;
  const IL6_H   = PH - S6T - 12;

  // Pré-calcular alturas para centralizar verticalmente
  const titLines6 = pdf.splitTextToSize('A Matriz HEDRA não define quem você é.', TX6_W);
  const paras6 = [
    'Ela mostra de onde sua liderança está partindo hoje.',
    'O desenvolvimento acontece quando você reconhece seus padrões atuais e começa a fazer movimentos mais intencionais.',
    'Liderança madura não é fazer mais. É ampliar sua capacidade de gerar resultados através das pessoas.',
  ];
  const parasLines6 = paras6.map((t) => pdf.splitTextToSize(t, TX6_W));
  const fechoLines6 = pdf.splitTextToSize('Lembre-se: A liderança não é fixa, é evolutiva.', TX6_W);
  const cartaSaudLines6 = pdf.splitTextToSize('Caro(a) '+fnome+',', TX6_W-12);
  const cartaTextoLines6 = pc.p5_texto.map((t) => pdf.splitTextToSize(t, TX6_W-12));

  const block1H = titLines6.length*lh(13)+5
    + parasLines6.reduce((a, ls) => a + ls.length*lh(8.5)+3.5, 0)
    + fechoLines6.length*lh(7.5) + 8;
  const cartaContentH = lh(11)+4 + cartaTextoLines6.reduce((a, ls) => a + ls.length*lh(8)+2, 0);
  const cartaH = 10 + cartaContentH + 6;
  const totalH6 = block1H + cartaH;
  const availH6 = PH - S6T - 12;
  let lcy6 = S6T + Math.max(0, (availH6 - totalH6) / 2);

  // Bloco 1: texto geral
  pdf.setFont('helvetica','bold'); pdf.setFontSize(13); pdf.setTextColor(22,22,22);
  pdf.text(titLines6, TX6_X, lcy6); lcy6 += titLines6.length*lh(13)+5;

  paras6.forEach((t, i) => {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5); pdf.setTextColor(54,52,48);
    pdf.text(parasLines6[i], TX6_X, lcy6); lcy6 += parasLines6[i].length*lh(8.5)+3.5;
  });

  pdf.setFont('helvetica','italic'); pdf.setFontSize(7.5); pdf.setTextColor(128,122,112);
  pdf.text(fechoLines6, TX6_X, lcy6);
  lcy6 += fechoLines6.length*lh(7.5) + 8;

  // Bloco 2: carta pessoal (altura auto)
  pdf.setFillColor(...tint(0.07)); pdf.rect(TX6_X, lcy6, TX6_W, cartaH, 'F');
  pdf.setFillColor(...COR); pdf.rect(TX6_X, lcy6, TX6_W, 3, 'F');

  let rcy6 = lcy6 + 10;
  pdf.setFont('helvetica','bold'); pdf.setFontSize(11); pdf.setTextColor(...COR);
  pdf.text(cartaSaudLines6, TX6_X+6, rcy6); rcy6 += lh(11)+4;
  cartaTextoLines6.forEach((tls) => {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8); pdf.setTextColor(38,36,33);
    pdf.text(tls, TX6_X+6, rcy6); rcy6 += tls.length*lh(8)+2;
  });

  // Ilustração à direita (altura total do slide)
  if (imgFinal) addImgFit(imgFinal, IL6_X, S6T, IL6_W, IL6_H);

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
