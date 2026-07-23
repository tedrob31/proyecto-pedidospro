export const mockProveedoresSheet = [
  { PROVEEDOR: 'PROVEEDOR_A', HOJAS: 'ZAPATILLAS, POLOS' },
  { PROVEEDOR: 'PROVEEDOR_B', HOJAS: 'PANTALONES' },
];

export const mockStockSheets: Record<string, any[]> = {
  'ZAPATILLAS': [
    { PROVEEDOR: 'PROVEEDOR_A', CODIGO: 'ZAP-001', URL_FOTO: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', PEDIDO1: '2-30\n1 32', PEDIDO2: '' },
    { PROVEEDOR: 'PROVEEDOR_A', CODIGO: 'ZAP-002', URL_FOTO: 'https://res.cloudinary.com/demo/image/upload/cld-sample.jpg', PEDIDO1: '1', PEDIDO2: '3-40' },
    { PROVEEDOR: 'PROVEEDOR_B', CODIGO: 'ZAP-003', URL_FOTO: '', PEDIDO1: '1-30', PEDIDO2: '' },
  ],
  'POLOS': [
    { PROVEEDOR: 'PROVEEDOR_A', CODIGO: 'POL-001', URL_FOTO: 'https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg', PEDIDO1: '', PEDIDO2: '4' },
  ],
  'PANTALONES': [
    { PROVEEDOR: 'PROVEEDOR_B', CODIGO: 'PAN-001', URL_FOTO: 'https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg', PEDIDO1: '1-28', PEDIDO2: '2-30\n1-32' },
  ]
};

// Simulated fetch function
export async function fetchProveedores() {
  return mockProveedoresSheet;
}

export async function fetchStock(sheetNames: string[], proveedor: string) {
  let results: any[] = [];
  for (const sheet of sheetNames) {
    const data = mockStockSheets[sheet.trim()];
    if (data) {
      // Filter by proveedor
      const filtered = data.filter(row => row.PROVEEDOR === proveedor);
      results = [...results, ...filtered];
    }
  }
  return results;
}
