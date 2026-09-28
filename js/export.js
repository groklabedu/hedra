// Captura uma página do resultado e retorna ImageData
async function capturarPagina(pageEl) {
  return html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#F9F7F5',
    logging: false,
  });
}

// Exporta uma função que retorna o listener (para uso nos botões da página 5)
function exportarRelatorio(tipo) {
  return async () => {
    const btnPng = document.getElementById('btn-rp-png');
    const btnPdf = document.getElementById('btn-rp-pdf');
    const btn = tipo === 'pdf' ? btnPdf : btnPng;
    const original = btn.textContent;
    btn.textContent = tipo === 'pdf' ? 'Gerando PDF…' : 'Gerando imagem…';
    btn.disabled = true;
    if (btnPng) btnPng.disabled = true;
    if (btnPdf) btnPdf.disabled = true;

    try {
      const paginas = [];
      const paginaAtualSalva = rpPaginaAtual;

      // Captura cada uma das 5 páginas em sequência
      for (let i = 1; i <= 5; i++) {
        // Mostra a página sem animação
        document.querySelectorAll('.rp-page').forEach((p) => p.classList.remove('ativa'));
        const el = document.getElementById(`rp-page-${i}`);
        el.classList.add('ativa');
        // Aguarda render (incluindo possíveis gráficos canvas)
        await new Promise((r) => setTimeout(r, i === 2 ? 300 : 80));
        paginas.push(await capturarPagina(el));
        el.classList.remove('ativa');
      }

      // Restaura a página que estava visível
      document.getElementById(`rp-page-${paginaAtualSalva}`).classList.add('ativa');

      if (tipo === 'png') {
        // PNG: primeira página apenas (ou concatenar verticalmente)
        const link = document.createElement('a');
        link.download = 'resultado-hedra.png';
        link.href = paginas[0].toDataURL('image/png');
        link.click();
      } else {
        // PDF: uma página A4 por captura
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const A4_W = 210;
        const A4_H = 297;

        paginas.forEach((canvas, idx) => {
          if (idx > 0) pdf.addPage();
          const ratio   = canvas.height / canvas.width;
          const imgW    = A4_W;
          const imgH    = Math.min(A4_W * ratio, A4_H);
          const offsetY = (A4_H - imgH) / 2;
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, offsetY, imgW, imgH);
        });

        pdf.save('relatório-hedra.pdf');
      }
    } catch (err) {
      alert('Erro ao gerar ' + (tipo === 'pdf' ? 'PDF' : 'imagem') + '. Tente novamente.');
      console.error(err);
    } finally {
      btn.textContent = original;
      if (btnPng) btnPng.disabled = false;
      if (btnPdf) btnPdf.disabled = false;
    }
  };
}
