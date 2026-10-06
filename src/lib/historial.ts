import fs from 'fs/promises';
import path from 'path';

export interface HistorialPedido {
  id: string;
  fecha: string;
  columna: string;
  proveedores: any[];
}

const HISTORIAL_PATH = path.join(process.cwd(), 'data', 'historial_pedidos.json');

export async function getHistorial(): Promise<HistorialPedido[]> {
  try {
    const data = await fs.readFile(HISTORIAL_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') return [];
    console.error('Error leyendo historial:', error);
    return [];
  }
}

export async function saveHistorial(nuevoPedido: Omit<HistorialPedido, 'id' | 'fecha'>): Promise<HistorialPedido> {
  const historial = await getHistorial();
  
  const pedidoCompleto: HistorialPedido = {
    ...nuevoPedido,
    id: Date.now().toString(),
    fecha: new Date().toISOString()
  };
  
  historial.unshift(pedidoCompleto); // Añadir al inicio
  
  await fs.writeFile(HISTORIAL_PATH, JSON.stringify(historial, null, 2), 'utf8');
  return pedidoCompleto;
}

export async function deleteHistorialByDate(fechaStr: string): Promise<void> {
  // fechaStr formato YYYY-MM-DD
  const historial = await getHistorial();
  const filtrado = historial.filter(item => {
    const itemDate = new Date(item.fecha).toISOString().split('T')[0];
    return itemDate !== fechaStr;
  });
  
  await fs.writeFile(HISTORIAL_PATH, JSON.stringify(filtrado, null, 2), 'utf8');
}

export async function deleteHistorialById(id: string): Promise<void> {
  const historial = await getHistorial();
  const filtrado = historial.filter(item => item.id !== id);
  await fs.writeFile(HISTORIAL_PATH, JSON.stringify(filtrado, null, 2), 'utf8');
}
