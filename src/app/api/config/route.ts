import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

export async function GET() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    // Si no existe, devolvemos un objeto por defecto
    const defaultData = {
      settings: {
        columns_mapping: {
          proveedor: "PROVEEDOR",
          hojas: "HOJAS",
          codigo: "CODIGO",
          url_foto: "URL_FOTO"
        },
        pedido_columns: ["PEDIDO1", "PEDIDO2", "PEDIDO3"],
        google_sheets: {
          sheet_id_proveedores: "",
          sheet_id_stock: ""
        },
        cloudinary: {
          base_width: 800,
          text_color: "FFFFFF",
          text_bg_color: "000000AA",
          font_size: 70,
          quality: "auto:good"
        }
      }
    };
    return NextResponse.json(defaultData);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate or merge structure if needed
    // For now we just save the full object
    await fs.writeFile(dbPath, JSON.stringify(body, null, 2), 'utf8');
    
    return NextResponse.json({ success: true, message: 'Configuración guardada' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write config' }, { status: 500 });
  }
}
