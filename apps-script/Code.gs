// ─── Inventário HEDRA — Google Apps Script ─────────────────────────────────
// Publicar como Web App: Executar como Minha conta / Acesso: Qualquer pessoa
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Respostas';
const ADMIN_KEY  = 'HEDRA@admin2026';

// Mapeamento nome completo → chave (para getByEmail)
const PERFIL_KEY_BY_NOME = {
  'Operador Sobrecarregado':        'operador',
  'Executor Eficiente':             'executor',
  'Comunicador Frágil':             'comunicador',
  'Líder de Influência Estratégica':'lider',
};

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const emails = sheet.getRange(2, 3, lastRow - 1, 1).getValues().flat();
      const idx    = emails.indexOf(data.email);

      if (idx !== -1) {
        if (!data.override) {
          return resp({ status: 'duplicate' });
        }
        // Substituir: apagar linha existente
        sheet.deleteRow(idx + 2); // +2: base 1 + linha de cabeçalho
      }
    }

    sheet.appendRow([
      new Date(),
      data.nome,
      data.email,
      data.cargo,
      data.area,
      data.unidade,
      data.autodominio,
      data.direcao,
      data.influencia,
      data.maestria,
      data.eixoX,
      data.eixoY,
      data.perfilNome,      // nome completo do perfil
      data.respostaAberta,
    ]);

    return resp({ status: 'ok' });
  } catch (err) {
    return resp({ status: 'error', message: err.toString() });
  }
}

function doGet(e) {
  // ── Buscar resultado pelo e-mail (para "Ver resultado anterior") ──────────
  if (e.parameter.action === 'getByEmail') {
    const email = (e.parameter.email || '').trim().toLowerCase();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    if (!sheet || sheet.getLastRow() < 2) {
      return resp({ status: 'not_found' });
    }

    const rows = sheet.getDataRange().getValues();
    const row  = rows.slice(1).find((r) => (r[2] || '').toString().toLowerCase() === email);

    if (!row) return resp({ status: 'not_found' });

    const perfilNome = row[12] ? row[12].toString() : '';
    // Suporta tanto chave ('operador') quanto nome completo na coluna
    const perfilKey =
      PERFIL_KEY_BY_NOME[perfilNome] ||
      (['operador','executor','comunicador','lider'].includes(perfilNome) ? perfilNome : 'operador');

    return resp({
      status: 'found',
      data: {
        nome:        row[1],
        email:       row[2],
        cargo:       row[3],
        area:        row[4],
        unidade:     row[5],
        autodominio: row[6],
        direcao:     row[7],
        influencia:  row[8],
        maestria:    row[9],
        eixoX:       row[10],
        eixoY:       row[11],
        perfilNome,
        perfilKey,
      },
    });
  }

  // ── Painel admin ──────────────────────────────────────────────────────────
  if (e.parameter.key !== ADMIN_KEY) {
    return resp({ status: 'unauthorized' });
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return resp({ status: 'ok', data: [] });

  return resp({ status: 'ok', data: sheet.getDataRange().getValues() });
}

function resp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
