import { NextResponse } from 'next/server';
import { getHistorial, saveHistorial, deleteHistorialByDate, deleteHistorialById } from '@/lib/historial';

export async function GET() {
  try {
    const data = await getHistorial();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.proveedores || !body.columna) {
      return NextResponse.json({ success: false, error: 'Faltan datos (proveedores o columna)' }, { status: 400 });
    }
    const nuevo = await saveHistorial(body);
    return NextResponse.json({ success: true, data: nuevo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const id = url.searchParams.get('id');

    if (date) {
      await deleteHistorialByDate(date);
    } else if (id) {
      await deleteHistorialById(id);
    } else {
      return NextResponse.json({ success: false, error: 'Debe proveer date o id' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
