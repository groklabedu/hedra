// ─── Inventário HEDRA — Google Apps Script ─────────────────────────────────
// 1. Crie um novo projeto em script.google.com vinculado à planilha
// 2. Cole este código e publique como Web App:
//    Executar como: Minha conta
//    Acesso: Qualquer pessoa (inclusive anônimos)
// 3. Cole a URL gerada em js/app.js (constante APPS_SCRIPT_URL)
//    e em js/admin.js (constante ADMIN_APPS_SCRIPT_URL)
// 4. Troque TROCAR_POR_CHAVE_SECRETA por uma senha forte em ambos os arquivos
// ─────────────────────────────────────────────────────────────────────────────

const SHEET_NAME = 'Respostas';
const ADMIN_KEY  = 'HEDRA@admin2026'; // igual ao valor em admin.js

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Criar aba se não existir
    if (!sheet) {
      const s = SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
      s.appendRow(['Data','Nome','Email','Cargo','Área','Unidade',
                   'Autodomínio','Direção','Influência','Maestria',
                   'Eixo X','Eixo Y','Perfil','Resposta Aberta']);
    }

    const planilha = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // Verificação de e-mail duplicado
    const lastRow = planilha.getLastRow();
    if (lastRow > 1) {
      const emails = planilha.getRange(2, 3, lastRow - 1, 1).getValues().flat();
      if (emails.includes(data.email)) {
        return resp({ status: 'duplicate' });
      }
    }

    planilha.appendRow([
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
      data.perfil,
      data.respostaAberta,
    ]);

    return resp({ status: 'ok' });
  } catch (err) {
    return resp({ status: 'error', message: err.toString() });
  }
}

function doGet(e) {
  if (e.parameter.key !== ADMIN_KEY) {
    return resp({ status: 'unauthorized' });
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return resp({ status: 'ok', data: [] });
  const data = sheet.getDataRange().getValues();
  return resp({ status: 'ok', data: data });
}

function resp(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
