const fs = require('fs');

async function test() {
  const { readSheet, getGoogleSheetsClient } = await import('./src/lib/google-sheets.ts');
  const config = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  const sheetIdStock = config.settings.google_sheets.sheet_id_stock;
  
  try {
    const rows = await readSheet(sheetIdStock, `'JEANS STRETCH damas'!A:Z`);
    console.log("JEANS STRETCH damas headers:", rows[0]);
  } catch (err) {
    console.error("Error JEANS STRETCH damas:", err.message);
  }
}
test();
