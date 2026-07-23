import { readSheet } from './src/lib/google-sheets';
import fs from 'fs';

async function test() {
  const config = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
  const sheetIdStock = config.settings.google_sheets.sheet_id_stock;
  
  try {
    const rows = await readSheet(sheetIdStock, `'CONJUNTOS NIÑOS'!A:Z`);
    console.log("CONJUNTOS NIÑOS headers:");
    console.log(rows[0]);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();
