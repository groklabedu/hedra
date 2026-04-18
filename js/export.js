async function exportarPNG() {
  const btn = document.getElementById('btn-exportar-png');
  const original = btn.textContent;
  btn.textContent = 'Gerando imagem…';
  btn.disabled = true;

  try {
    const el = document.getElementById('resultado-exportavel');
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F9F7F5',
      logging: false,
    });
    const link = document.createElement('a');
    link.download = 'resultado-hedra.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    alert('Erro ao gerar imagem. Tente novamente.');
    console.error(err);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}

async function exportarPDF() {
  const btn = document.getElementById('btn-exportar-pdf');
  const original = btn.textContent;
  btn.textContent = 'Gerando PDF…';
  btn.disabled = true;

  try {
    const el = document.getElementById('resultado-exportavel');
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#F9F7F5',
      logging: false,
    });

    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/png');
    const imgW = canvas.width;
    const imgH = canvas.height;

    // Página no tamanho real da imagem (em pt, 1px ≈ 0.75pt)
    const ptW = imgW * 0.75;
    const ptH = imgH * 0.75;

    const pdf = new jsPDF({ orientation: ptW > ptH ? 'l' : 'p', unit: 'pt', format: [ptW, ptH] });
    pdf.addImage(imgData, 'PNG', 0, 0, ptW, ptH);
    pdf.save('resultado-hedra.pdf');
  } catch (err) {
    alert('Erro ao gerar PDF. Tente novamente.');
    console.error(err);
  } finally {
    btn.textContent = original;
    btn.disabled = false;
  }
}
