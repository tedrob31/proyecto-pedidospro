import { NextResponse } from 'next/server';
import { readSheet, appendSheetRow, updateSheetRow, deleteSheetRow, getFirstSheetId } from '@/lib/google-sheets';
import { getDbConfig } from '@/lib/db';

export async function GET() {
  try {
    const config = await getDbConfig();
    const sheetId = config?.settings?.google_sheets?.sheet_id_proveedores;
    
    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'No se ha configurado el ID de Google Sheets de Proveedores' }, { status: 400 });
    }

    // Leemos la primera hoja, columnas de la A a la Z
    const rows = await readSheet(sheetId, 'A:Z');
    
    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // La primera fila son los encabezados
    const headers = rows[0];
    const data = [];
    
    // Convertimos las filas a objetos
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header.trim()] = row[index] || '';
      });
      data.push(obj);
    }
    
    // Ordenar alfabéticamente por nombre de proveedor
    data.sort((a, b) => {
      const nameA = (a.PROVEEDOR || '').toUpperCase();
      const nameB = (b.PROVEEDOR || '').toUpperCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching proveedores:', error);
    return NextResponse.json({ success: false, error: error.message || 'Error fetching proveedores' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { proveedor, hojas } = await request.json();
    const config = await getDbConfig();
    const sheetId = config?.settings?.google_sheets?.sheet_id_proveedores;
    if (!sheetId) return NextResponse.json({ success: false, error: 'No sheet ID' }, { status: 400 });

    const rows = await readSheet(sheetId, 'A:Z');
    
    // Check if exists
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === proveedor) {
        return NextResponse.json({ success: false, error: 'Proveedor ya existe' }, { status: 400 });
      }
    }

    await appendSheetRow(sheetId, 'A:B', [proveedor, hojas]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { oldProveedor, newProveedor, hojas } = await request.json();
    const config = await getDbConfig();
    const sheetId = config?.settings?.google_sheets?.sheet_id_proveedores;
    if (!sheetId) return NextResponse.json({ success: false, error: 'No sheet ID' }, { status: 400 });

    const rows = await readSheet(sheetId, 'A:Z');
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === oldProveedor) {
        rowIndex = i + 1; // 1-indexed for range updates
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Checking if new name already exists elsewhere
    if (oldProveedor !== newProveedor) {
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === newProveedor && i + 1 !== rowIndex) {
          return NextResponse.json({ success: false, error: 'El nuevo nombre ya existe' }, { status: 400 });
        }
      }
    }

    await updateSheetRow(sheetId, `A${rowIndex}:B${rowIndex}`, [newProveedor, hojas]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { proveedor } = await request.json();
    const config = await getDbConfig();
    const spreadsheetId = config?.settings?.google_sheets?.sheet_id_proveedores;
    if (!spreadsheetId) return NextResponse.json({ success: false, error: 'No sheet ID' }, { status: 400 });

    const rows = await readSheet(spreadsheetId, 'A:Z');
    let rowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === proveedor) {
        rowIndex = i; // 0-indexed for batchUpdate
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json({ success: false, error: 'Proveedor no encontrado' }, { status: 404 });
    }

    const firstSheetId = await getFirstSheetId(spreadsheetId);
    if (firstSheetId === null) {
      return NextResponse.json({ success: false, error: 'No se pudo obtener el ID interno de la hoja' }, { status: 500 });
    }

    await deleteSheetRow(spreadsheetId, firstSheetId, rowIndex);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
