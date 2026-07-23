import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const proveedor = searchParams.get('proveedor');
    
    if (!proveedor) {
      return NextResponse.json({ success: false, error: 'Proveedor requerido' }, { status: 400 });
    }

    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    const dbData = await fs.readFile(dbPath, 'utf8');
    const config = JSON.parse(dbData);
    const columns = config.settings.columns_mapping;

    const { readSheet } = await import('@/lib/google-sheets');

    // 1. Obtener hojas del proveedor
    const sheetIdProv = config?.settings?.google_sheets?.sheet_id_proveedores;
    if (!sheetIdProv) return NextResponse.json({ success: false, error: 'No ID Proveedores' }, { status: 400 });

    const provRows = await readSheet(sheetIdProv, 'A:ZZ');
    let hojasStr = '';
    
    if (provRows.length > 1) {
      const headers = provRows[0];
      const provIndex = headers.findIndex((h: string) => h.trim() === columns.proveedor);
      const hojasIndex = headers.findIndex((h: string) => h.trim() === columns.hojas);
      
      if (provIndex > -1 && hojasIndex > -1) {
        const hojasArr = [];
        for (let i = 1; i < provRows.length; i++) {
          if (provRows[i][provIndex] === proveedor) {
            if (provRows[i][hojasIndex]) {
              hojasArr.push(provRows[i][hojasIndex]);
            }
          }
        }
        hojasStr = hojasArr.join(',');
      }
    }

    if (!hojasStr) {
      return NextResponse.json({ success: false, error: 'Proveedor no encontrado o sin hojas' }, { status: 404 });
    }

    const sheetList = hojasStr.split(',').map((h: string) => h.trim());
    
    // 2. Buscar en el stock
    const sheetIdStock = config?.settings?.google_sheets?.sheet_id_stock;
    if (!sheetIdStock) return NextResponse.json({ success: false, error: 'No ID Stock' }, { status: 400 });
    
    const sinFoto: any[] = [];
    const currentUrls: string[] = [];
    
    for (const sheetName of sheetList) {
      if (!sheetName) continue;
      
      try {
        const rows = await readSheet(sheetIdStock, `'${sheetName}'!A:ZZ`);
        if (!rows || rows.length < 2) continue;
        
        const headers = rows[0];
        console.log(`Headers for sheet ${sheetName}:`, headers);
        let colCodigo = headers.findIndex((h: string) => h.trim() === columns.codigo);
        if (colCodigo === -1) colCodigo = 0; // Fallback to first column
        
        let colUrl = headers.findIndex((h: string) => h.trim() === columns.url_foto);
        const colProv = headers.findIndex((h: string) => h.trim() === columns.proveedor);
        
        console.log(`Cols in ${sheetName} -> colCodigo: ${colCodigo}, colUrl: ${colUrl}, colProv: ${colProv}`);
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const codigo = row[colCodigo];
          const url = row[colUrl];
          
          if (colProv > -1) {
            const rowProv = row[colProv]?.trim();
            // Filter by provider (case insensitive to be safe, or just exact match)
            if (!rowProv || rowProv.toLowerCase() !== proveedor.toLowerCase().trim()) {
              continue; // Skip if empty or belongs to another provider
            }
          }
          
          if (codigo) {
            const tieneFoto = !!url && url.trim() !== '';
            if (tieneFoto) {
              currentUrls.push(url.trim());
            }
            
            sinFoto.push({
              codigo,
              hoja: sheetName,
              fila: i + 1, // +1 porque el índice del array empieza en 0 y en Sheets empieza en 1 (row[0] es la fila 1, row[i] es la fila i+1)
              tieneFoto
            });
          }
        }
      } catch (err: any) {
        console.error(`Error leyendo la hoja ${sheetName}:`, err.message);
      }
    }

    console.log(`Proveedor: ${proveedor}`);
    console.log(`Hojas encontradas (string):`, hojasStr);
    console.log(`Hojas encontradas (array):`, sheetList);
    console.log(`Total resultados:`, sinFoto.length);

    // Disparar sincronización en segundo plano (fire and forget)
    const { syncAndDeleteOrphans } = await import('@/lib/sync');
    syncAndDeleteOrphans(proveedor, currentUrls).catch(console.error);

    return NextResponse.json({ success: true, data: sinFoto });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
