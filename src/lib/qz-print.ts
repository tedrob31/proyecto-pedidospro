import qz from 'qz-tray';

export interface PrintItem {
  codigo: string;
  proveedor?: string;
  isBlank?: boolean;
}

/**
 * Conecta a QZ Tray si no está conectado.
 */
export async function connectQZ(): Promise<void> {
  if (!qz.websocket.isActive()) {
    // 1. Promesa para el certificado público
    qz.security.setCertificatePromise((resolve, reject) => {
      // Intenta obtener el certificado. Si falla (ej. archivo no existe), se pasa vacío y QZ mostrará alerta.
      fetch("/digital-certificate.txt", { cache: 'no-store' })
        .then(response => {
          if (response.ok) return response.text();
          return "";
        })
        .then(resolve)
        .catch(reject);
    });

    // 2. Promesa para firmar peticiones
    qz.security.setSignatureAlgorithm("SHA512");
    qz.security.setSignaturePromise(function(toSign) {
      return function(resolve, reject) {
        fetch("/api/qz-sign?request=" + encodeURIComponent(toSign), { cache: 'no-store' })
          .then(response => response.text())
          .then(resolve)
          .catch(reject);
      };
    });

    await qz.websocket.connect({ retries: 2, delay: 1 });
  }
}

/**
 * Desconecta de QZ Tray.
 */
export async function disconnectQZ(): Promise<void> {
  if (qz.websocket.isActive()) {
    await qz.websocket.disconnect();
  }
}

/**
 * Imprime un lote de códigos dividiéndolos en 2 columnas, usando TSPL.
 * @param printerName Nombre exacto de la impresora en Windows
 * @param items Lista de ítems (ej. [{ codigo: 'BLU176-L' }])
 * @param symbol Símbolo a imprimir al final de la etiqueta
 */
export async function printBatchTSPL(printerName: string, items: PrintItem[], symbol: string = '<', includeQR: boolean = true, providerName: string = ''): Promise<void> {
  if (items.length === 0) return;

  await connectQZ();

  // Buscar la impresora
  const printers = await qz.printers.find(printerName);
  if (!printers) {
    throw new Error(`No se encontró la impresora: ${printerName}`);
  }

  const config = qz.configs.create(printerName, {
    copies: 1,
    jobName: 'PedidosPro - Etiquetas',
  });

  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  const dateStr = `${dd}${mm}${yy}`;
  const defaultProvCode = providerName ? providerName.substring(0, 3).toUpperCase() : '';

  const data: any[] = [];
  
  data.push('SIZE 107 mm, 28 mm\r\n');
  data.push('GAP 2 mm, 0 mm\r\n');
  data.push('DIRECTION 1\r\n');

  // Diseño CON QR
  const layoutQR = {
    dateX: 320, dateY: 170, dateFont: "2", dateRot: 0, 
    provY: 145,
    qrX: 45, qrY: 30, qrCell: 6, 
    textX: 190, textY: 30, textFont: "3", textScale: 2, 
    lineX: 190, lineY: 90, lineWidth: 210, lineThick: 4, 
    subX: 240, subY: 110, subFont: "3", subScale: 2,     
    arrowX: 190, arrowY: 150, arrowFont: "2"             
  };

  // Diseño SIN QR (Más centrado y grande)
  const layoutNoQR = {
    dateX: 320, dateY: 170, dateFont: "2", dateRot: 0, 
    provY: 145,
    qrX: 0, qrY: 0, qrCell: 0,
    textX: 90, textY: 20, textFont: "3", textScale: 3, 
    lineX: 70, lineY: 100, lineWidth: 300, lineThick: 6, 
    subX: 160, subY: 120, subFont: "3", subScale: 3,     
    arrowX: 120, arrowY: 170, arrowFont: "2"             
  };

  const layout = includeQR ? layoutQR : layoutNoQR;

  // Pre-procesar items para asegurar que cada proveedor termine en número par.
  // Esto evita que el último sticker de un proveedor se imprima en la misma fila que el primero de otro.
  const paddedItems: PrintItem[] = [];
  let currentProv = '';
  let provItemCount = 0;

  for (const item of items) {
    const itemProv = item.proveedor || providerName;
    if (itemProv !== currentProv) {
      if (provItemCount % 2 !== 0) {
        paddedItems.push({ codigo: '', proveedor: currentProv, isBlank: true });
      }
      currentProv = itemProv;
      provItemCount = 0;
    }
    paddedItems.push(item);
    provItemCount++;
  }
  if (provItemCount % 2 !== 0) {
    paddedItems.push({ codigo: '', proveedor: currentProv, isBlank: true });
  }

  for (let i = 0; i < paddedItems.length; i += 2) {
    const itemLeft = paddedItems[i];
    const itemRight = paddedItems[i + 1];
    
    data.push('CLS\r\n');

    const drawSticker = (item: PrintItem, offsetX: number) => {
      if (item.isBlank) return;

      const parts = item.codigo.split('-');
      const mainCode = parts[0];
      const subCode = parts.length > 1 ? parts.slice(1).join('-') : '';

      const provName = item.proveedor || providerName;
      const provCode = provName ? provName.substring(0, 3).toUpperCase() : '';

      data.push(`TEXT ${layout.dateX + offsetX},${layout.dateY},"${layout.dateFont}",${layout.dateRot},1,1,"${dateStr}"\r\n`);
      if (provCode) {
        // Centrar los 3 caracteres del proveedor basándose en el X de la fecha.
        // Asumiendo que la fuente "2" tiene ~12px de ancho, el centro aproximado se mantiene si lo alineamos igual.
        data.push(`TEXT ${layout.dateX + offsetX + 10},${layout.provY},"${layout.dateFont}",${layout.dateRot},1,1,"${provCode}"\r\n`);
      }

      if (includeQR) {
        data.push(`QRCODE ${layout.qrX + offsetX},${layout.qrY},L,${layout.qrCell},M,0,M2,"A${item.codigo}"\r\n`);
      }
      
      // Ajuste dinámico si el código tiene 7 o más dígitos (ej. VEJE102)
      let currentScale = layout.textScale;
      let currentX = layout.textX;
      let currentY = layout.textY;
      
      if (mainCode.length >= 7) {
        if (!includeQR) {
          // En modo SIN QR, bajamos a escala 2 y centramos
          currentScale = 2;
          currentX = 110;
          currentY = layout.textY + 10; // Bajamos un poquito para compensar la altura
        } else {
          // En modo CON QR, ya está en escala 2, pero lo moveramos un poquito a la izquierda para que no pegue al borde derecho
          currentX = 175;
        }
      }

      data.push(`TEXT ${currentX + offsetX},${currentY},"${layout.textFont}",0,${currentScale},${currentScale},"${mainCode}"\r\n`);
      data.push(`BAR ${layout.lineX + offsetX},${layout.lineY},${layout.lineWidth},${layout.lineThick}\r\n`);

      if (subCode) {
        data.push(`TEXT ${layout.subX + offsetX},${layout.subY},"${layout.subFont}",0,${layout.subScale},${layout.subScale},"${subCode}"\r\n`);
      }
      
      if (symbol) {
        data.push(`TEXT ${layout.arrowX + offsetX},${layout.arrowY},"${layout.arrowFont}",0,1,1,"${symbol}"\r\n`);
      }
    };

    // Dibujar Columna 1
    if (itemLeft) {
      drawSticker(itemLeft, 0);
    }

    // Dibujar Columna 2 (Offset de 430 dots = ~53.7mm)
    if (itemRight) {
      drawSticker(itemRight, 430);
    }

    // Imprimir la página de 2 columnas
    data.push('PRINT 1,1\r\n');
  }

  // Enviar trabajo de impresión a la cola de QZ Tray
  await qz.print(config, data);
}
