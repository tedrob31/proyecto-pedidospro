import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

function parsePedidoText(cellText: string, codigo: string) {
  const lines = cellText.split('\n').filter(l => l.trim() !== '');
  const textList: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\d+)(?:[- ](.+))?/);
    if (match) {
      const cantidad = parseInt(match[1], 10);
      const suffix = match[2] ? match[2].trim() : '';
      
      const itemText = suffix ? `${codigo}-${suffix}` : codigo;
      
      for (let i = 0; i < cantidad; i++) {
        textList.push(itemText);
      }
    } else {
      // Fallback si no hay número al inicio
      textList.push(`${codigo}-${trimmed}`);
    }
  }
  
  return textList;
}

function buildCloudinaryUrl(originalUrl: string, cellText: string, config: any) {
  if (!originalUrl || !originalUrl.includes('/upload/')) return originalUrl;
  
  // Encode text for cloudinary: commas and slashes must be double encoded. Newlines are %0A. 
  // Spaces become %20
  const encodedText = encodeURIComponent(cellText)
    .replace(/%2C/g, '%252C')
    .replace(/\//g, '%252F');

  const { base_width = 800, text_color = 'FFFFFF', text_bg_color = '000000AA', font_size = 40 } = config.settings?.cloudinary || {};

  let actualFontSize = font_size;
  // Si no tiene guión ni espacio (ej. "1", "10", "S"), lo hacemos más grande para que resalte
  if (!cellText.includes('-') && !cellText.includes(' ')) {
    actualFontSize = Math.round(font_size * 1.8); 
  }

  // Construct transformation string
  const textTransform = `l_text:Arial_${actualFontSize}_bold_center:${encodedText},co_rgb:${text_color},b_rgb:${text_bg_color},r_10`;
  const applyTransform = `fl_layer_apply,g_center`;
  const resizeTransform = `c_fit,w_${base_width},f_png`;

  const transformString = `${resizeTransform}/${textTransform}/${applyTransform}`;

  return originalUrl.replace('/upload/', `/upload/${transformString}/`);
}

export async function POST(request: Request) {
  try {
    const { proveedores, pedido_column } = await request.json();
    
    if (!proveedores || !Array.isArray(proveedores) || proveedores.length === 0) {
      return NextResponse.json({ success: false, error: 'Debe seleccionar al menos un proveedor.' }, { status: 400 });
    }
    
    // Read local config for column names and cloudinary settings
    const dbPath = path.join(process.cwd(), 'data', 'db.json');
    const dbData = await fs.readFile(dbPath, 'utf8');
    const config = JSON.parse(dbData);
    
    const columns = config.settings.columns_mapping;
    
    // Fetch from real Google Sheets
    const sheetIdStock = config?.settings?.google_sheets?.sheet_id_stock;
    if (!sheetIdStock) {
      return NextResponse.json({ success: false, error: 'No se ha configurado el ID de Google Sheets de Stock' }, { status: 400 });
    }

    const { readSheet } = await import('@/lib/google-sheets');
    
    // Consolidar hojas únicas a consultar
    const sheetSet = new Set<string>();
    proveedores.forEach((p: any) => {
      if (p.hojas) {
        p.hojas.split(',').forEach((h: string) => sheetSet.add(h.trim()));
      }
    });
    
    const sheetList = Array.from(sheetSet).filter(Boolean);
    const stockData: any[] = [];
    
    for (const sheetName of sheetList) {
      if (!sheetName) continue;
      
      try {
        const rows = await readSheet(sheetIdStock, `'${sheetName}'!A:ZZ`);
        if (!rows || rows.length === 0) continue;
        
        let headers = rows[0].map((h: string) => h.trim());
        console.log(`Headers in sheet '${sheetName}':`, headers);
        
        let colCodigo = headers.indexOf(columns.codigo);
        if (colCodigo === -1) {
          colCodigo = 0; // Fallback to column A
          headers[0] = columns.codigo; // Force mapping to work
        }
        
        let hasProvColumn = headers.indexOf(columns.proveedor) > -1;
        
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const obj: any = { _hasProvColumn: hasProvColumn };
          headers.forEach((header: string, index: number) => {
            obj[header.trim()] = row[index] || '';
          });
          stockData.push(obj);
        }
      } catch (err: any) {
        console.error(`Error leyendo la hoja ${sheetName}:`, err.message);
      }
    }
    
    const resultsByProvider: Record<string, { results: any[], summaryList: string[], missingUrls: string[] }> = {};
    
    // Inicializar el objeto de resultados para cada proveedor
    for (const p of proveedores) {
      resultsByProvider[p.nombre] = { results: [], summaryList: [], missingUrls: [] };
    }
    
    console.log(`Mapeo de columnas: CODIGO=${columns.codigo}, URL_FOTO=${columns.url_foto}, Pedido buscado=${pedido_column}`);
    console.log(`Total filas en stockData únicas leídas: ${stockData.length}`);
    
    for (const row of stockData) {
      const pedidoValue = row[pedido_column];
      if (!pedidoValue || pedidoValue.trim() === '') continue; // No hay pedido
      
      let rowProv = '';
      if (row._hasProvColumn) {
        rowProv = (row[columns.proveedor] || '').trim();
      }
      
      if (!rowProv) continue; // Fila sin proveedor válido

      // Buscar si el proveedor de la fila es uno de los que pedimos
      const matchingProv = proveedores.find((p: any) => p.nombre.toLowerCase() === rowProv.toLowerCase());
      if (!matchingProv) continue;
      
      const codigo = row[columns.codigo];
      const urlFoto = row[columns.url_foto];
      const provKey = matchingProv.nombre;
      
      if (!urlFoto) {
        resultsByProvider[provKey].missingUrls.push(codigo);
        continue;
      }
      
      // Parse list
      const parsedTexts = parsePedidoText(pedidoValue, codigo);
      resultsByProvider[provKey].summaryList.push(...parsedTexts);
      
      // Build image
      const transformedUrl = buildCloudinaryUrl(urlFoto, pedidoValue, config);
      
      resultsByProvider[provKey].results.push({
        codigo,
        pedidoOriginal: pedidoValue,
        urlTransformada: transformedUrl
      });
    }
    
    // Construir la respuesta
    const responseData = proveedores.map((p: any) => {
      const provData = resultsByProvider[p.nombre];
      return {
        proveedor: p.nombre,
        success: provData.missingUrls.length === 0,
        results: provData.results,
        summary: provData.summaryList,
        missingUrls: provData.missingUrls,
        error: provData.missingUrls.length > 0 ? 'Faltan fotos' : null
      };
    });
    
    return NextResponse.json({ success: true, data: responseData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
