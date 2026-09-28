// ─── Gerador de PDF estilo slide (A4 paisagem) ──────────────────────────────

function gerarPDF(scores, ud) {
  const { jsPDF } = window.jspdf;
  // A4 paisagem: 297 × 210 mm
  const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

  const PW = 297, PH = 210;
  const ML = 22, MR = 22;
  const CW = PW - ML - MR; // 253 mm

  const pc   = RC.perfis[scores.perfil];
  const pf   = PERFIS[scores.perfil];
  const nome = (ud.nome || '').trim();
  const emp  = ud.empresa || '';
  const cargo = ud.cargo || '';
  const fnome = nome.split(' ')[0] || 'Líder';

  function rgb(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  const COR = rgb(pf.cor);

  // Tint = blend cor com branco (f = 0 a 1, onde 1 = cor pura)
  function tint(f) {
    return COR.map((c) => Math.round(255 - (255 - c) * f));
  }

  // Line height em mm: fontSize (pt) × fator
  function lh(sz, m = 1.2) { return sz * 0.3528 * m; }

  let _pg = 1;

  function rodape(labelEsq) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7);
    pdf.setTextColor(185, 180, 172);
    pdf.text(labelEsq || 'Inventário HEDRA — Asséssor Consultoria e Treinamento', ML, PH - 5.5);
    pdf.text(String(_pg), PW - MR, PH - 5.5, { align: 'right' });
  }

  function novaPagina() { rodape(); pdf.addPage(); _pg++; }

  // Cabeçalho colorido de cada slide (exceto capa)
  const HH = 13; // altura da faixa de cabeçalho
  function header(secao) {
    pdf.setFillColor(...COR);
    pdf.rect(0, 0, PW, HH, 'F');
    // faixa mais escura na borda inferior do header
    pdf.setFillColor(COR[0]*0.8|0, COR[1]*0.8|0, COR[2]*0.8|0);
    pdf.rect(0, HH - 0.8, PW, 0.8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(secao, ML, 8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('HEDRA', PW - MR, 8.5, { align: 'right' });
  }

  const DIMS = [
    { label: 'Autodomínio', val: scores.autodominio, c: rgb('#8B1A1A') },
    { label: 'Direção',     val: scores.direcao,     c: rgb('#C8961A') },
    { label: 'Influência',  val: scores.influencia,  c: rgb('#1A5276') },
    { label: 'Maestria',    val: scores.maestria,    c: rgb('#1A6B45') },
  ];

  // ─── SLIDE 1: CAPA ───────────────────────────────────────────────────────
  // Painel esquerdo colorido (45% da largura) + painel direito branco

  const LP = PW * 0.44; // largura do painel esquerdo (~131 mm)

  // Painel esquerdo sólido
  pdf.setFillColor(...COR);
  pdf.rect(0, 0, LP, PH, 'F');

  // Linha diagonal decorativa (claro)
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.3);
  pdf.setDrawColor(COR[0]*0.72|0, COR[1]*0.72|0, COR[2]*0.72|0);
  for (let i = 0; i < 4; i++) {
    pdf.line(0, PH * 0.6 + i * 8, LP, PH * 0.6 + i * 8);
  }

  // Conteúdo painel esquerdo
  let ly = 24;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 200);
  pdf.text('INVENTÁRIO HEDRA', ML, ly); ly += 10;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  const titLines = pdf.splitTextToSize('Matriz de Maturidade da Liderança', LP - ML - 6);
  pdf.text(titLines, ML, ly); ly += titLines.length * lh(24) + 8;

  // Traço decorativo
  pdf.setFillColor(255, 255, 255);
  pdf.rect(ML, ly, 36, 1.2, 'F');
  ly += 6;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
  pdf.setTextColor(255, 255, 255);
  pdf.text(pf.nome, ML, ly); ly += lh(13) + 3;

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10.5);
  pdf.setTextColor(220, 218, 212);
  pdf.text(nome, ML, ly);

  // Painel direito — conteúdo começa em x = LP + 12
  const RX = LP + 12;
  const RW = PW - RX - 16; // ~138 mm

  let ry = 20;

  // Bloco de informações
  pdf.setFillColor(248, 246, 242);
  pdf.rect(RX, ry, RW, 52, 'F');
  ry += 8;

  [[nome, 'NOME'], [emp || '—', 'EMPRESA'], [cargo || '—', 'CARGO']].forEach(([val, lbl]) => {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7);
    pdf.setTextColor(155, 148, 135);
    pdf.text(lbl, RX + 7, ry); ry += lh(7) + 0.5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.setTextColor(22, 22, 22);
    const vls = pdf.splitTextToSize(val, RW - 14);
    pdf.text(vls, RX + 7, ry); ry += vls.length * lh(10) + 4;
  });

  ry += 4;

  // Barras de dimensões
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
  pdf.setTextColor(150, 143, 130);
  pdf.text('DIMENSÕES DE LIDERANÇA', RX, ry); ry += 5.5;

  DIMS.forEach((d) => {
    pdf.setFillColor(225, 222, 215);
    pdf.rect(RX, ry, RW, 6.5, 'F');
    pdf.setFillColor(...d.c);
    pdf.rect(RX, ry, RW * d.val / 100, 6.5, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(d.label, RX + 2.5, ry + 4.5);
    pdf.setTextColor(38, 38, 38);
    pdf.text(d.val + '%', RX + RW, ry + 4.5, { align: 'right' });
    ry += 9.5;
  });

  rodape('Inventário HEDRA — Asséssor Consultoria e Treinamento');

  // ─── SLIDE 2: CAMPO DE LIDERANÇA ─────────────────────────────────────────
  novaPagina();
  header('SEU CAMPO DE LIDERANÇA');

  // Layout: grade de quadrantes à esquerda, texto à direita
  const S2T = HH + 7; // topo do conteúdo
  const GRID_W = CW * 0.46; // ~116 mm — grade
  const GRID_X = ML;
  const TEXT_X = ML + GRID_W + 10;
  const TEXT_W = CW - GRID_W - 10;
  const GRID_AVAIL_H = PH - S2T - 16; // ~170 mm

  const QW = (GRID_W - 3) / 2;
  const QH = (GRID_AVAIL_H - 3) / 2;

  const QDATA = [
    { key: 'comunicador', nome: 'Comunicador Frágil',              cor: rgb('#B7770D'), col: 0, row: 0 },
    { key: 'lider',       nome: 'Líder de Influência Estratégica', cor: rgb('#1A6B45'), col: 1, row: 0 },
    { key: 'operador',    nome: 'Operador Sobrecarregado',         cor: rgb('#CC4400'), col: 0, row: 1 },
    { key: 'executor',    nome: 'Executor Eficiente',               cor: rgb('#1A5276'), col: 1, row: 1 },
  ];

  QDATA.forEach(({ key, nome: qn, cor: qc, col, row }) => {
    const qx = GRID_X + col * (QW + 3);
    const qy = S2T + row * (QH + 3);
    const ativo = key === scores.perfil;
    const [r, g, b] = qc;
    const bg = [
      r + Math.round((255-r) * (ativo ? 0.86 : 0.95)),
      g + Math.round((255-g) * (ativo ? 0.86 : 0.95)),
      b + Math.round((255-b) * (ativo ? 0.86 : 0.95)),
    ];

    pdf.setFillColor(...bg);
    pdf.setDrawColor(...qc);
    pdf.setLineWidth(ativo ? 0.9 : 0.25);
    pdf.rect(qx, qy, QW, QH, 'FD');

    // Nome do quadrante
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(ativo ? 10 : 8.5);
    pdf.setTextColor(...qc);
    const nls = pdf.splitTextToSize(qn, QW - 6);
    pdf.text(nls, qx + 4, qy + 9);

    // Badge "SEU RESULTADO" para o quadrante ativo
    if (ativo) {
      const bH = 7, bY = qy + QH - bH - 4;
      pdf.setFillColor(...qc);
      pdf.rect(qx + 4, bY, QW - 8, bH, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text('SEU RESULTADO', qx + QW / 2, bY + 5, { align: 'center' });
    }
  });

  // Conteúdo à direita
  let r2y = S2T;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11.5);
  pdf.setTextColor(...COR);
  const hlLines = pdf.splitTextToSize(pc.headline, TEXT_W);
  pdf.text(hlLines, TEXT_X, r2y); r2y += hlLines.length * lh(11.5) + 6;

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
  pdf.setTextColor(55, 55, 52);
  const sumLines = pdf.splitTextToSize(RC.p2_resumos[scores.perfil], TEXT_W);
  pdf.text(sumLines, TEXT_X, r2y); r2y += sumLines.length * lh(9.5) + 10;

  // Mini barras de dimensões no lado direito
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5);
  pdf.setTextColor(148, 142, 130);
  pdf.text('SUAS DIMENSÕES', TEXT_X, r2y); r2y += 5.5;

  const BAR_W = TEXT_W * 0.82;
  DIMS.forEach((d) => {
    pdf.setFillColor(222, 219, 212); pdf.rect(TEXT_X, r2y, BAR_W, 5.5, 'F');
    pdf.setFillColor(...d.c); pdf.rect(TEXT_X, r2y, BAR_W * d.val / 100, 5.5, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7);
    pdf.setTextColor(255, 255, 255);
    pdf.text(d.label, TEXT_X + 2, r2y + 3.8);
    pdf.setTextColor(38, 38, 38);
    pdf.text(d.val + '%', TEXT_X + BAR_W + 2, r2y + 3.8);
    r2y += 8.5;
  });

  rodape();

  // ─── SLIDE 3: FORÇAS & PONTOS ────────────────────────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S3T = HH + 6;

  // Intro breve (até 2 linhas)
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9);
  pdf.setTextColor(88, 83, 76);
  const introShort = pdf.splitTextToSize(pc.p3_intro.slice(0, 2).join(' '), CW);
  pdf.text(introShort.slice(0, 2), ML, S3T + 6);

  const COLS_TOP = S3T + 6 + Math.min(2, introShort.length) * lh(9) + 7;
  const COLW3 = (CW - 6) / 2;

  // Coluna esquerda: FORÇAS
  let lcy3 = COLS_TOP;
  pdf.setFillColor(...COR);
  pdf.rect(ML, lcy3, COLW3, 9, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('FORÇAS', ML + 5, lcy3 + 6.2);
  lcy3 += 12;

  pc.forcas.forEach((f) => {
    const fl = pdf.splitTextToSize(f, COLW3 - 12);
    // ícone "+"
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5);
    pdf.setTextColor(...COR);
    pdf.text('+', ML + 3, lcy3 + 0.3);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.setTextColor(35, 35, 35);
    pdf.text(fl, ML + 9, lcy3);
    lcy3 += fl.length * lh(9) + 1.5;
  });

  // Coluna direita: PONTOS DE ATENÇÃO
  const RC3X = ML + COLW3 + 6;
  const WARN = rgb('#CC4400');
  let rcy3 = COLS_TOP;
  pdf.setFillColor(...WARN);
  pdf.rect(RC3X, rcy3, COLW3, 9, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  pdf.text('PONTOS DE ATENÇÃO', RC3X + 5, rcy3 + 6.2);
  rcy3 += 12;

  pc.pontos.forEach((p) => {
    const pl = pdf.splitTextToSize(p, COLW3 - 12);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5);
    pdf.setTextColor(...WARN);
    pdf.text('!', RC3X + 3.5, rcy3 + 0.3);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.setTextColor(35, 35, 35);
    pdf.text(pl, RC3X + 9, rcy3);
    rcy3 += pl.length * lh(9) + 1.5;
  });

  rodape();

  // ─── SLIDE 4: SOB PRESSÃO & MOVIMENTO ───────────────────────────────────
  novaPagina();
  header('LEITURA APROFUNDADA DO CAMPO');

  const S4T = HH + 8;
  let cy4 = S4T;

  // Título da seção
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.setTextColor(...COR);
  pdf.text('O QUE PODE ACONTECER SOB PRESSÃO', ML, cy4); cy4 += 8;

  pc.pressao.forEach((p) => {
    const pl = pdf.splitTextToSize(p, CW);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
    pdf.setTextColor(48, 45, 42);
    pdf.text(pl, ML, cy4); cy4 += pl.length * lh(9.5) + 3;
  });

  cy4 += 5;

  // Bloco MOVIMENTO — caixa larga com fundo levemente colorido
  const mvH = PH - cy4 - 14;
  pdf.setFillColor(...tint(0.07));
  pdf.rect(ML, cy4, CW, mvH, 'F');
  // Barra lateral esquerda colorida
  pdf.setFillColor(...COR);
  pdf.rect(ML, cy4, 4, mvH, 'F');

  let mvy = cy4 + 8;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
  pdf.setTextColor(...COR);
  pdf.text('MOVIMENTO DE MATURIDADE', ML + 9, mvy); mvy += 8;

  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(13);
  pdf.setTextColor(22, 22, 22);
  const mvls = pdf.splitTextToSize(pc.movimento, CW - 18);
  pdf.text(mvls, ML + 9, mvy); mvy += mvls.length * lh(13) + 5;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5);
  pdf.setTextColor(...COR);
  pdf.text('Prioridade HEDRA: ' + pc.prioridade, ML + 9, mvy);

  rodape();

  // ─── SLIDE 5: CAMINHO DE MATURIDADE ─────────────────────────────────────
  novaPagina();
  header('SEU CAMINHO DE MATURIDADE');

  const S5T = HH + 8;
  let cy5 = S5T;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16);
  pdf.setTextColor(22, 22, 22);
  const t5 = pdf.splitTextToSize(pc.p4_titulo, CW * 0.6);
  pdf.text(t5, ML, cy5); cy5 += t5.length * lh(16) + 8;

  // Passos como blocos horizontais com seta
  const STEP_COUNT = pc.p4_steps.length;
  const STEP_GAP = 2.5;
  const STEP_W = (CW - STEP_GAP * (STEP_COUNT - 1)) / STEP_COUNT;
  const STEP_NUM_H = 10;
  const STEP_BODY_H = 22;
  const STEP_H = STEP_NUM_H + STEP_BODY_H;

  pc.p4_steps.forEach((s, i) => {
    const sx = ML + i * (STEP_W + STEP_GAP);

    // Número (fundo cheio)
    pdf.setFillColor(...COR);
    pdf.rect(sx, cy5, STEP_W, STEP_NUM_H, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text(String(i + 1), sx + STEP_W / 2, cy5 + 7.5, { align: 'center' });

    // Corpo do passo (fundo claro)
    pdf.setFillColor(...tint(0.1));
    pdf.rect(sx, cy5 + STEP_NUM_H, STEP_W, STEP_BODY_H, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
    pdf.setTextColor(...COR);
    const sls = pdf.splitTextToSize(s, STEP_W - 4);
    const stxtY = cy5 + STEP_NUM_H + (STEP_BODY_H - sls.length * lh(8.5)) / 2 + lh(8.5) * 0.9;
    pdf.text(sls, sx + STEP_W / 2, stxtY, { align: 'center' });

    // Seta entre passos (linha simples, sem triangulo)
    if (i < STEP_COUNT - 1) {
      const arrowX = sx + STEP_W + STEP_GAP / 2;
      const arrowY = cy5 + STEP_H / 2;
      pdf.setDrawColor(...COR); pdf.setLineWidth(0.6);
      pdf.line(arrowX - 0.5, arrowY, arrowX + 0.5, arrowY);
    }
  });

  cy5 += STEP_H + 12;

  // Perguntas em 2 colunas
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
  pdf.setTextColor(...COR);
  pdf.text('PERGUNTAS PARA REFLEXÃO', ML, cy5); cy5 += 7;

  const QPW = (CW - 8) / 2;
  const QPH = (PH - cy5 - 14) / Math.ceil(pc.p4_perguntas.length / 2);

  pc.p4_perguntas.forEach((q, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const qx = ML + col * (QPW + 8);
    const qy = cy5 + row * QPH;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
    pdf.setTextColor(...COR);
    pdf.text(String(i + 1) + '.', qx, qy);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.setTextColor(44, 42, 38);
    const qls = pdf.splitTextToSize(q, QPW - 8);
    pdf.text(qls, qx + 7, qy);
  });

  rodape();

  // ─── SLIDE 6: CONSIDERAÇÕES FINAIS ──────────────────────────────────────
  novaPagina();
  header('CONSIDERAÇÕES FINAIS');

  const S6T = HH + 7;
  const LCOL6 = CW * 0.42; // col esquerda ~106 mm
  const RCOL6_X = ML + LCOL6 + 10;
  const RCOL6_W = CW - LCOL6 - 10;

  // Col esquerda: texto de encerramento
  let lcy6 = S6T;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13.5);
  pdf.setTextColor(22, 22, 22);
  const cl1 = pdf.splitTextToSize('A Matriz HEDRA não define quem você é.', LCOL6);
  pdf.text(cl1, ML, lcy6); lcy6 += cl1.length * lh(13.5) + 5;

  [
    'Ela mostra de onde sua liderança está partindo hoje.',
    'O desenvolvimento acontece quando você reconhece seus padrões atuais e começa a fazer movimentos mais intencionais em direção a uma liderança capaz de gerar clareza, autonomia e impacto sustentável.',
    'Liderança madura não é fazer mais. É ampliar sua capacidade de gerar resultados através das pessoas.',
  ].forEach((t) => {
    const tls = pdf.splitTextToSize(t, LCOL6);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.setTextColor(54, 52, 48);
    pdf.text(tls, ML, lcy6); lcy6 += tls.length * lh(9) + 3.5;
  });

  // Fechamento italic no rodapé da col esquerda
  const fechY = PH - 22;
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8);
  pdf.setTextColor(128, 122, 112);
  const fls = pdf.splitTextToSize(
    'Lembre-se: A liderança não é fixa, é evolutiva. Seu resultado não define quem você é como líder — ele revela como você está liderando hoje.',
    LCOL6
  );
  pdf.text(fls, ML, fechY);

  // Col direita: carta pessoal (fundo colorido suave)
  const ctaH = PH - S6T - 12;
  pdf.setFillColor(...tint(0.07));
  pdf.rect(RCOL6_X, S6T, RCOL6_W, ctaH, 'F');
  // Barra lateral top colorida
  pdf.setFillColor(...COR);
  pdf.rect(RCOL6_X, S6T, RCOL6_W, 3, 'F');

  let rcy6 = S6T + 10;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11.5);
  pdf.setTextColor(...COR);
  pdf.text('Caro(a) ' + fnome + ',', RCOL6_X + 7, rcy6); rcy6 += lh(11.5) + 4;

  pc.p5_texto.forEach((t) => {
    const tls = pdf.splitTextToSize(t, RCOL6_W - 14);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
    pdf.setTextColor(38, 36, 33);
    pdf.text(tls, RCOL6_X + 7, rcy6); rcy6 += tls.length * lh(8.5) + 2.5;
  });

  rodape();

  pdf.save('relatorio-hedra.pdf');
}
