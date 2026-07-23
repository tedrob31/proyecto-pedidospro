const fs = require('fs');

async function test() {
  const { readSheet, getGoogleSheetsClient } = await import('./src/lib/google-sheets.ts');
  const config = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  const sheetIdStock = config.settings.google_sheets.sheet_id_stock;
  
  try {
    const rows = await readSheet(sheetIdStock, `'JEANS RIGIDO DAMAS'!A:Z`);
    console.log("JEANS RIGIDO DAMAS headers:", rows[0]);
  } catch (err) {
    console.error("Error JEANS RIGIDO DAMAS:", err.message);
  }
  
  try {
    const rows = await readSheet(sheetIdStock, `'SHORTS FALDAS DAMA'!A:Z`);
    console.log("SHORTS FALDAS DAMA headers:", rows[0]);
  } catch (err) {
    console.error("Error SHORTS FALDAS DAMA:", err.message);
  }
}
test();
