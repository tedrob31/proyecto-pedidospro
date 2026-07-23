import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const codigo = formData.get('codigo') as string;
    const hoja = formData.get('hoja') as string;
    const fila = formData.get('fila') as string;
    
    if (!file || !codigo || !hoja || !fila) {
      return NextResponse.json({ success: false, error: 'Faltan datos requeridos (file, codigo, hoja, fila)' }, { status: 400 });
    }

    const config = await getDbConfig();
    const sheetIdStock = config?.settings?.google_sheets?.sheet_id_stock;
    const columns = config?.settings?.columns_mapping;
    
    if (!sheetIdStock) {
      return NextResponse.json({ success: false, error: 'No ID Stock' }, { status: 400 });
    }

    // 1. Convertir archivo a base64 para Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // 2. Subir a Cloudinary (carpeta 'pedidos', nombre del archivo = codigo)
    const uploadResult = await uploadImage(base64Image, 'pedidos', codigo);
    const secureUrl = uploadResult.secure_url;

    // 3. Escribir en Google Sheets
    // Necesitamos saber qué letra de columna corresponde a URL_FOTO
    // Podríamos leer la cabecera, pero si ya sabemos que fila=X, podemos simplemente leer la primera fila para encontrar la columna
    const { readSheet } = await import('@/lib/google-sheets');
    const rows = await readSheet(sheetIdStock, `'${hoja}'!A1:ZZ1`);
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Hoja vacía' }, { status: 400 });
    }
    
    const headers = rows[0];
    const urlColIndex = headers.findIndex((h: string) => h.trim() === columns.url_foto);
    
    if (urlColIndex === -1) {
      return NextResponse.json({ success: false, error: 'No se encontró la columna URL_FOTO' }, { status: 400 });
    }
    
    const colLetter = getColumnLetter(urlColIndex);
    const cellRange = `'${hoja}'!${colLetter}${fila}`;
    
    await writeSheetCell(sheetIdStock, cellRange, secureUrl);

    return NextResponse.json({ success: true, url: secureUrl });
  } catch (error: any) {
    console.error('Error en /api/upload:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
