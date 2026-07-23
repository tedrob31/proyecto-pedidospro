'use client';

import { useState, useEffect } from 'react';
import { printBatchTSPL } from '@/lib/qz-print';

export default function ConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [manualList, setManualList] = useState('');
  const [printingManual, setPrintingManual] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Configuración guardada exitosamente.');
      } else {
        setMessage('Error al guardar.');
      }
    } catch (err) {
      setMessage('Error de conexión.');
    } finally {
      setSaving(false);
    }
  };

  const handlePedidoColumnChange = (val: string) => {
    setConfig({
      ...config,
      settings: {
        ...config.settings,
        pedido_columns: val.split(',').map(s => s.trim())
      }
    });
  };

  const handleManualPrint = async () => {
    if (!manualList.trim()) return;
    
    // Parse the textarea lines into an array of {codigo: ...}
    const lines = manualList.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
      
    if (lines.length === 0) return;
    
    const itemsToPrint = lines.map(str => ({ codigo: str }));
    
    const printerName = config?.settings?.printer?.name || 'TSC TE200';
    const printerSymbol = config?.settings?.printer?.symbol || '<';
    const includeQR = config?.settings?.printer?.includeQR !== false;
    
    try {
      setPrintingManual(true);
      await printBatchTSPL(printerName, itemsToPrint, printerSymbol, includeQR);
      alert('¡Lista manual enviada a la impresora!');
    } catch (err: any) {
      console.error(err);
      alert('Error al imprimir lista manual: ' + (err.message || 'Verifica QZ Tray.'));
    } finally {
      setPrintingManual(false);
    }
  };

  if (loading) return <div className="p-10 text-white">Cargando configuración...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Configuración del Sistema</h1>
      
      {message && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        
        {/* Mapeo de Columnas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Mapeo de Columnas (Google Sheets)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Columna PROVEEDOR</label>
              <input type="text" 
                value={config.settings.columns_mapping.proveedor} 
                onChange={e => setConfig({...config, settings: {...config.settings, columns_mapping: {...config.settings.columns_mapping, proveedor: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Columna HOJAS</label>
              <input type="text" 
                value={config.settings.columns_mapping.hojas} 
                onChange={e => setConfig({...config, settings: {...config.settings, columns_mapping: {...config.settings.columns_mapping, hojas: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Columna CÓDIGO</label>
              <input type="text" 
                value={config.settings.columns_mapping.codigo} 
                onChange={e => setConfig({...config, settings: {...config.settings, columns_mapping: {...config.settings.columns_mapping, codigo: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Columna URL FOTO</label>
              <input type="text" 
                value={config.settings.columns_mapping.url_foto} 
                onChange={e => setConfig({...config, settings: {...config.settings, columns_mapping: {...config.settings.columns_mapping, url_foto: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
        </div>

        {/* Columnas de Pedidos */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Columnas de Pedidos</h2>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nombres de columnas (separadas por comas)</label>
            <input type="text" 
              value={config.settings.pedido_columns.join(', ')} 
              onChange={e => handlePedidoColumnChange(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" 
              placeholder="PEDIDO1, PEDIDO2, PEDIDO3" />
          </div>
        </div>

        {/* Google Sheets IDs */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">IDs de Google Sheets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID Archivo Proveedores</label>
              <input type="text" 
                value={config.settings.google_sheets?.sheet_id_proveedores || ''} 
                onChange={e => setConfig({...config, settings: {...config.settings, google_sheets: {...config.settings.google_sheets, sheet_id_proveedores: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" 
                placeholder="ej: 1BxiMVs0XRY..." />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID Archivo Stock (Pedidos)</label>
              <input type="text" 
                value={config.settings.google_sheets?.sheet_id_stock || ''} 
                onChange={e => setConfig({...config, settings: {...config.settings, google_sheets: {...config.settings.google_sheets, sheet_id_stock: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" 
                placeholder="ej: 1BxiMVs0XRY..." />
            </div>
          </div>
        </div>

        {/* Cloudinary Settings */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Ajustes de Imagen (Cloudinary)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tamaño Base (Ancho px)</label>
              <input type="number" 
                value={config.settings.cloudinary.base_width} 
                onChange={e => setConfig({...config, settings: {...config.settings, cloudinary: {...config.settings.cloudinary, base_width: Number(e.target.value)}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tamaño de Fuente (px)</label>
              <input type="number" 
                value={config.settings.cloudinary.font_size} 
                onChange={e => setConfig({...config, settings: {...config.settings, cloudinary: {...config.settings.cloudinary, font_size: Number(e.target.value)}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Color de Texto (Hex)</label>
              <input type="text" 
                value={config.settings.cloudinary.text_color} 
                onChange={e => setConfig({...config, settings: {...config.settings, cloudinary: {...config.settings.cloudinary, text_color: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Color Fondo Texto (Hex)</label>
              <input type="text" 
                value={config.settings.cloudinary.text_bg_color} 
                onChange={e => setConfig({...config, settings: {...config.settings, cloudinary: {...config.settings.cloudinary, text_bg_color: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
        </div>

        {/* Configuración de Impresora */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Configuración de Impresora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre de la Impresora (QZ Tray)</label>
              <input type="text" 
                value={config.settings.printer?.name || ''} 
                onChange={e => setConfig({...config, settings: {...config.settings, printer: {...config.settings.printer, name: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Símbolo decorativo (ej. {'<'})</label>
              <input type="text" 
                value={config.settings.printer?.symbol || ''} 
                onChange={e => setConfig({...config, settings: {...config.settings, printer: {...config.settings.printer, symbol: e.target.value}}})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <input 
              type="checkbox" 
              id="includeQR" 
              checked={config.settings.printer?.includeQR !== false} 
              onChange={e => setConfig({...config, settings: {...config.settings, printer: {...config.settings.printer, includeQR: e.target.checked}}})}
              className="w-5 h-5 bg-gray-950 border border-gray-800 rounded text-blue-600 focus:ring-blue-500" 
            />
            <label htmlFor="includeQR" className="ml-2 text-sm text-gray-300">
              Imprimir Código QR en la etiqueta
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" className="px-6 py-2 rounded-lg font-medium text-white bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 transition-colors">
            Limpiar Imágenes Huérfanas
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>

      {/* Impresión Libre Manual */}
      <div className="mt-12 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-2">Impresión Libre Manual</h2>
        <p className="text-sm text-gray-400 mb-4">Ingresa los códigos y tallas uno por línea (ej. <code>TYO108-L</code>). Se imprimirán directamente en la impresora configurada.</p>
        <textarea 
          value={manualList}
          onChange={e => setManualList(e.target.value)}
          placeholder="TYO108-L&#10;TYO109-M&#10;BZ151-10"
          className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white h-48 mb-4 font-mono text-sm"
        />
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={handleManualPrint}
            disabled={printingManual || !manualList.trim()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            {printingManual ? 'Imprimiendo...' : 'Imprimir Lista Manual'}
          </button>
        </div>
      </div>
    </div>
  );
}
