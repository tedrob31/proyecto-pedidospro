import { NextResponse } from 'next/server';
import { writeSheetCell } from '@/lib/google-sheets';
import { getDbConfig } from '@/lib/db';

function getColumnLetter(colIndex: number) {
  let letter = '';
  while (colIndex >= 0) {
    letter = String.fromCharCode((colIndex % 26) + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
}

export async function POST(request: Request) {
  try {
    const { hoja, fila } = await request.json();
    
    if (!hoja || !fila) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos (hoja, fila)' }, { status: 400 });
    }

    const config = await getDbConfig();
    const sheetIdStock = config?.settings?.google_sheets?.sheet_id_stock;
    const columns = config?.settings?.columns_mapping;
    
    if (!sheetIdStock) {
      return NextResponse.json({ success: false, error: 'No ID Stock' }, { status: 400 });
    }

    const { readSheet } = await import('@/lib/google-sheets');
    const rows = await readSheet(sheetIdStock, `'${hoja}'!A1:ZZ1`);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Hoja vacía' }, { status: 400 });
    }
    
    const headers = rows[0].map((h: string) => h.trim());
    const urlColIndex = headers.indexOf(columns.url_foto);
    
    if (urlColIndex === -1) {
      return NextResponse.json({ success: false, error: 'No se encontró la columna URL_FOTO' }, { status: 400 });
    }
    
    const colLetter = getColumnLetter(urlColIndex);
    const cellRange = `'${hoja}'!${colLetter}${fila}`;
    
    // Leer el URL actual de la celda
    const cellData = await readSheet(sheetIdStock, cellRange);
    const url = cellData && cellData[0] && cellData[0][0] ? cellData[0][0].trim() : '';
    
    if (!url) {
      // Si ya está vacía, no hay nada que borrar en Cloudinary
      return NextResponse.json({ success: true });
    }

    // Extraer public_id
    const { deleteImage, extractPublicIdFromUrl } = await import('@/lib/cloudinary');
    const publicId = extractPublicIdFromUrl(url);
    if (!publicId) {
      return NextResponse.json({ success: false, error: 'URL inválida de Cloudinary' }, { status: 400 });
    }
    
    // Eliminar de Cloudinary
    await deleteImage(publicId);
    
    // Escribir un string vacío para borrar la foto
    await writeSheetCell(sheetIdStock, cellRange, '');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error en /api/delete-foto:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
