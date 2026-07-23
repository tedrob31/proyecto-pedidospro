import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

export async function GET() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
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
