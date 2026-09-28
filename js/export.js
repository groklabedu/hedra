// ─── Gerador de PDF nativo (jsPDF) ──────────────────────────────────────────
// Gera um PDF próprio com o conteúdo completo do resultado HEDRA,
// sem captura de telas (html2canvas não é mais usado).

function gerarPDF(scores, ud) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const PW = 210, PH = 297;
  const ML = 20, MR = 20;
  const CW = PW - ML - MR; // 170 mm
  let cy = 20;

  const pc   = RC.perfis[scores.perfil];
  const pf   = PERFIS[scores.perfil];
  const nome = (ud.nome || '').trim();
  const fnome = nome.split(' ')[0] || 'Líder';

  function hex2rgb(h) {
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  const COR = hex2rgb(pf.cor);

  // Converte tamanho de fonte (pt) em altura de linha (mm)
  function lh(sz, m = 1.25) { return sz * 0.3528 * m; }

  let _pg = 1;

  function rodape() {
    pdf.setDrawColor(210, 205, 195);
    pdf.line(ML, PH - 14, PW - MR, PH - 14);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5);
    pdf.setTextColor(160, 155, 145);
    pdf.text('Inventário HEDRA — Asséssor Consultoria e Treinamento', ML, PH - 9);
    pdf.text(String(_pg), PW - MR, PH - 9, { align: 'right' });
  }

  function novaPagina() {
    rodape(); pdf.addPage(); _pg++; cy = 20;
  }

  function check(h) { if (cy + h > PH - 22) novaPagina(); }
  function gap(mm = 4) { cy += mm; }

  // Escreve texto e avança cy; retorna número de linhas
  function texto(str, x, maxW, sp = 1.25) {
    const lines = pdf.splitTextToSize(str || '', maxW || (PW - MR - x));
    if (lines.length) pdf.text(lines, x, cy);
    cy += lines.length * lh(pdf.getFontSize(), sp);
    return lines.length;
  }

  function rotulo(txt) {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
    pdf.setTextColor(...COR);
    pdf.text(txt, ML, cy); cy += lh(8) + 2;
  }

  function titulo(txt, sz = 14) {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(sz);
    pdf.setTextColor(25, 25, 25);
    texto(txt, ML, CW); gap(1);
  }

  function paragrafo(txt) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.setTextColor(55, 55, 55);
    texto(txt, ML, CW); gap(1.5);
  }

  function topico(txt) {
    check(10);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.setTextColor(55, 55, 55);
    pdf.text('•', ML + 1, cy);
    texto(txt, ML + 6, CW - 6); gap(0.5);
  }

  // ─── PÁGINA 1: Capa ──────────────────────────────────────────────────────

  pdf.setFillColor(...COR);
  pdf.rect(0, 0, PW, 16, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
  pdf.setTextColor(255, 255, 255);
  pdf.text('INVENTÁRIO HEDRA', ML, 10);
  pdf.text('CONFIDENCIAL', PW - MR, 10, { align: 'right' });

  cy = 30;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(22);
  pdf.setTextColor(25, 25, 25);
  pdf.text('Matriz de Maturidade', ML, cy); cy += lh(22);
  pdf.text('da Liderança — HEDRA', ML, cy); cy += lh(22) + 6;

  pdf.setFillColor(...COR);
  pdf.rect(ML, cy, 32, 1, 'F'); cy += 5;

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
  pdf.setTextColor(...COR);
  pdf.text(pf.nome, ML, cy); cy += lh(13) + 2;

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  pdf.text(nome, ML, cy);

  // Caixa de informações
  cy = 132;
  pdf.setFillColor(248, 246, 243);
  pdf.rect(ML, cy, CW, 50, 'F');
  cy += 9;

  [['NOME', nome], ['EMPRESA', ud.empresa || '—'], ['CARGO', ud.cargo || '—']].forEach(([lbl, val]) => {
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
    pdf.setTextColor(140, 135, 120);
    pdf.text(lbl, ML + 8, cy); cy += lh(8) + 0.5;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10.5);
    pdf.setTextColor(25, 25, 25);
    pdf.text(val, ML + 8, cy); cy += lh(10.5) + 3.5;
  });

  // Barras das dimensões
  cy = 197;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
  pdf.setTextColor(140, 135, 120);
  pdf.text('DIMENSÕES DE LIDERANÇA', ML, cy); cy += 6;

  const DIMS = [
    { label: 'Autodomínio', val: scores.autodominio, c: hex2rgb('#8B1A1A') },
    { label: 'Direção',     val: scores.direcao,     c: hex2rgb('#C8961A') },
    { label: 'Influência',  val: scores.influencia,  c: hex2rgb('#1A5276') },
    { label: 'Maestria',    val: scores.maestria,    c: hex2rgb('#1A6B45') },
  ];

  DIMS.forEach((d) => {
    pdf.setFillColor(228, 225, 218); pdf.rect(ML, cy, CW, 7, 'F');
    pdf.setFillColor(...d.c); pdf.rect(ML, cy, CW * d.val / 100, 7, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(d.label, ML + 2.5, cy + 4.8);
    pdf.setTextColor(35, 35, 35);
    pdf.text(d.val + '%', PW - MR, cy + 4.8, { align: 'right' });
    cy += 10;
  });

  rodape();

  // ─── PÁGINA 2: Campo de Liderança ────────────────────────────────────────

  novaPagina();

  rotulo('SEU CAMPO DE LIDERANÇA'); gap(1);
  titulo(pf.nome, 17); gap(2);

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
  pdf.setTextColor(...COR);
  texto(pc.headline, ML, CW); gap(5);

  // Grade dos 4 quadrantes (dimensões fixas)
  const QDATA = [
    { key: 'comunicador', nome: 'Comunicador Frágil',              cor: hex2rgb('#B7770D'), col: 0 },
    { key: 'lider',       nome: 'Líder de Influência Estratégica', cor: hex2rgb('#1A6B45'), col: 1 },
    { key: 'operador',    nome: 'Operador Sobrecarregado',         cor: hex2rgb('#CC4400'), col: 0 },
    { key: 'executor',    nome: 'Executor Eficiente',               cor: hex2rgb('#1A5276'), col: 1 },
  ];
  const QW = CW / 2 - 2, QH = 24, gridY = cy;

  QDATA.forEach(({ key, nome: qn, cor: qc, col }, i) => {
    const qx = ML + col * (QW + 4);
    const qy = gridY + Math.floor(i / 2) * (QH + 3);
    const ativo = key === scores.perfil;
    const [r, g, b] = qc;
    pdf.setLineWidth(ativo ? 0.7 : 0.25); pdf.setDrawColor(...qc);
    pdf.setFillColor(
      r + Math.round((255-r) * (ativo ? 0.87 : 0.96)),
      g + Math.round((255-g) * (ativo ? 0.87 : 0.96)),
      b + Math.round((255-b) * (ativo ? 0.87 : 0.96))
    );
    pdf.rect(qx, qy, QW, QH, 'FD');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5);
    pdf.setTextColor(...qc);
    const nls = pdf.splitTextToSize(qn, QW - 5);
    pdf.text(nls, qx + 3, qy + 6);
    if (ativo) {
      pdf.setFontSize(7.5);
      pdf.text('◄ SEU RESULTADO', qx + 3, qy + QH - 3.5);
    }
  });
  cy = gridY + (QH + 3) * 2 + 6;

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.setTextColor(55, 55, 55);
  texto(RC.p2_resumos[scores.perfil], ML, CW);

  rodape();

  // ─── PÁGINA 3: Leitura Aprofundada ──────────────────────────────────────

  novaPagina();

  rotulo('LEITURA APROFUNDADA DO CAMPO'); gap(1);
  titulo(pc.headline, 13); gap(2);

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
  pdf.setTextColor(100, 95, 85);
  pdf.text(DIMS.map((d) => `${d.label}: ${d.val}%`).join('   '), ML, cy); cy += lh(9) + 4;

  pc.p3_intro.forEach((t) => { check(14); paragrafo(t); });
  gap(3);

  rotulo('FORÇAS'); gap(1);
  pc.forcas.forEach((f) => topico(f));
  gap(3);

  rotulo('PONTOS DE ATENÇÃO'); gap(1);
  pc.pontos.forEach((p) => topico(p));
  gap(3);

  rotulo('O QUE PODE ACONTECER SOB PRESSÃO'); gap(1);
  pc.pressao.forEach((p) => { check(14); paragrafo(p); });
  gap(3);

  // Bloco Movimento (linha lateral colorida)
  check(30);
  const mvY = cy;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.setTextColor(...COR);
  pdf.text('MOVIMENTO DE MATURIDADE', ML + 6, cy); cy += lh(9) + 2;
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(10.5);
  pdf.setTextColor(30, 30, 30);
  texto(pc.movimento, ML + 6, CW - 6); gap(2);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9);
  pdf.setTextColor(...COR);
  pdf.text('Prioridade HEDRA: ' + pc.prioridade, ML + 6, cy); cy += lh(9);
  // Linha lateral
  pdf.setDrawColor(...COR); pdf.setLineWidth(2);
  pdf.line(ML + 1, mvY - 2, ML + 1, cy + 2);
  gap(5);

  rodape();

  // ─── PÁGINA 4: Caminho de Maturidade ────────────────────────────────────

  novaPagina();

  rotulo('SEU CAMINHO DE MATURIDADE'); gap(1);
  titulo(pc.p4_titulo, 13); gap(5);

  pc.p4_steps.forEach((s, i) => {
    check(16);
    const BSZ = 6.5, bx = ML, by = cy - BSZ + 1.5;
    pdf.setFillColor(...COR); pdf.rect(bx, by, BSZ, BSZ, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(String(i + 1), bx + BSZ / 2, by + BSZ - 1.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.setTextColor(55, 55, 55);
    const sls = pdf.splitTextToSize(s, CW - BSZ - 5);
    pdf.text(sls, ML + BSZ + 4, cy);
    cy += Math.max(sls.length * lh(10), BSZ) + 3.5;
  });
  gap(5);

  rotulo('PERGUNTAS PARA REFLEXÃO'); gap(2);

  pc.p4_perguntas.forEach((q, i) => {
    check(14);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
    pdf.setTextColor(...COR);
    pdf.text(String(i + 1) + '.', ML, cy);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.setTextColor(55, 55, 55);
    const qls = pdf.splitTextToSize(q, CW - 8);
    pdf.text(qls, ML + 7, cy);
    cy += qls.length * lh(10) + 3.5;
  });

  rodape();

  // ─── PÁGINA 5: Considerações Finais ─────────────────────────────────────

  novaPagina();

  rotulo('CONSIDERAÇÕES FINAIS'); gap(2);

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13);
  pdf.setTextColor(25, 25, 25);
  pdf.text('A Matriz HEDRA não define quem você é.', ML, cy); cy += lh(13) + 2;

  [
    'Ela mostra de onde sua liderança está partindo hoje.',
    'O desenvolvimento acontece quando você reconhece seus padrões atuais e começa a fazer movimentos mais intencionais em direção a uma liderança capaz de gerar clareza, autonomia e impacto sustentável.',
    'Liderança madura não é fazer mais. É ampliar sua capacidade de gerar resultados através das pessoas.',
  ].forEach((t) => paragrafo(t));
  gap(5);

  // Carta pessoal (linha lateral colorida)
  check(70);
  const ctY = cy;
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12);
  pdf.setTextColor(...COR);
  pdf.text('Caro(a) ' + fnome + ',', ML + 6, cy); cy += lh(12) + 3;

  pc.p5_texto.forEach((t) => {
    check(14);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.setTextColor(55, 55, 55);
    const ls = pdf.splitTextToSize(t, CW - 10);
    pdf.text(ls, ML + 6, cy);
    cy += ls.length * lh(10) + 2.5;
  });
  // Linha lateral
  pdf.setDrawColor(...COR); pdf.setLineWidth(2);
  pdf.line(ML + 1, ctY - 2, ML + 1, cy + 2);
  gap(7);

  check(16);
  pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9.5);
  pdf.setTextColor(110, 105, 98);
  texto('Lembre-se: A liderança não é fixa, é evolutiva. Seu resultado não define quem você é como líder — ele revela como você está liderando hoje.', ML, CW);

  rodape();

  pdf.save('relatorio-hedra.pdf');
}
