'use client';

import { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { printBatchTSPL, connectQZ, disconnectQZ, PrintItem } from '@/lib/qz-print';

interface ProviderResult {
  proveedor: string;
  success: boolean;
  results: any[];
  summary: string[];
  missingUrls: string[];
  error?: string;
  isExpanded?: boolean;
}

export default function PedidosPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  
  const [selectedProveedores, setSelectedProveedores] = useState<string[]>([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  
  const [providerResults, setProviderResults] = useState<ProviderResult[]>([]);
  const [selectedResultProvs, setSelectedResultProvs] = useState<string[]>([]);
  const [showProvMenu, setShowProvMenu] = useState(false);
  
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    Promise.all([
      fetch('/api/proveedores').then(r => r.json()),
      fetch('/api/config').then(r => r.json())
    ]).then(([provData, confData]) => {
      if (provData.success) {
        setProveedores(provData.data);
      }
      setConfig(confData);
      if (confData.settings?.pedido_columns?.length > 0) {
        setSelectedColumn(confData.settings.pedido_columns[0]);
      }
    });
  }, []);

  const toggleProvSelection = (provName: string) => {
    setSelectedProveedores(prev => 
      prev.includes(provName) ? prev.filter(p => p !== provName) : [...prev, provName]
    );
  };

  const toggleAllProvs = () => {
    if (selectedProveedores.length === proveedores.length) {
      setSelectedProveedores([]);
    } else {
      setSelectedProveedores(proveedores.map(p => p.PROVEEDOR));
    }
  };

  const handleRevisar = async () => {
    if (selectedProveedores.length === 0 || !selectedColumn) return;
    
    setLoading(true);
    setGlobalError('');
    setProviderResults([]);
    setSelectedResultProvs([]);
    setCopiedItems(new Set());
    setShowProvMenu(false);
    
    const provsPayload = selectedProveedores.map(provName => {
      const p = proveedores.find(x => x.PROVEEDOR === provName);
      return { nombre: provName, hojas: p ? p.HOJAS : '' };
    });
    
    try {
      const res = await fetch('/api/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedores: provsPayload,
          pedido_column: selectedColumn
        })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        setGlobalError(data.error);
      } else {
        const processedResults = data.data
          .filter((pr: any) => pr.results.length > 0 || !pr.success)
          .map((pr: any) => ({
            ...pr,
            isExpanded: false
          }));
        setProviderResults(processedResults);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Error de red al consultar Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const copyImage = async (url: string, indexKey: string) => {
    try {
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Network error');
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      setCopiedItems(prev => new Set(prev).add(indexKey));
    } catch (err) {
      alert('Error al copiar imagen.');
    }
  };

  const toggleExpand = (provName: string) => {
    setProviderResults(prev => prev.map(p => 
      p.proveedor === provName ? { ...p, isExpanded: !p.isExpanded } : p
    ));
  };

  const toggleResultSelection = (provName: string) => {
    setSelectedResultProvs(prev => 
      prev.includes(provName) ? prev.filter(p => p !== provName) : [...prev, provName]
    );
  };

  const toggleAllResults = () => {
    const successfulProvs = providerResults.filter(p => p.success).map(p => p.proveedor);
    if (selectedResultProvs.length === successfulProvs.length) {
      setSelectedResultProvs([]);
    } else {
      setSelectedResultProvs(successfulProvs);
    }
  };

  const downloadZips = async (provNames: string[]) => {
    const provsToDownload = providerResults.filter(p => provNames.includes(p.proveedor) && p.success && p.results.length > 0);
    if (provsToDownload.length === 0) return;
    
    try {
      setLoading(true);
      const zip = new JSZip();
      
      for (const prov of provsToDownload) {
        const folder = zip.folder(prov.proveedor);
        if (!folder) continue;
        
        for (const r of prov.results) {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(r.urlTransformada)}`;
          const response = await fetch(proxyUrl);
          const blob = await response.blob();
          folder.file(`${r.codigo}_pedido.jpg`, blob);
        }
      }
      
      const content = await zip.generateAsync({ type: 'blob' });
      const filename = provNames.length === 1 ? `Pedidos_${provNames[0]}.zip` : 'Pedidos_Lote.zip';
      saveAs(content, filename);
      
    } catch(err) {
      alert('Error al generar el archivo ZIP');
    } finally {
      setLoading(false);
    }
  };

  const printLabels = async (provNames: string[]) => {
    const provsToPrint = providerResults.filter(p => provNames.includes(p.proveedor) && p.success && p.summary.length > 0);
    if (provsToPrint.length === 0) return;
    
    try {
      setLoading(true);
      
      const itemsToPrint: PrintItem[] = [];
      provsToPrint.forEach(prov => {
        prov.summary.forEach(codigoStr => {
          itemsToPrint.push({ codigo: codigoStr, proveedor: prov.proveedor });
        });
      });
      
      const printerName = config?.settings?.printer?.name || 'TSC TE200';
      const printerSymbol = config?.settings?.printer?.symbol || '<';
      const includeQR = config?.settings?.printer?.includeQR !== false;
      
      // Llamar a QZ Tray (pasando cadena vacía en providerName global, ya que cada item tiene su proveedor)
      await printBatchTSPL(printerName, itemsToPrint, printerSymbol, includeQR, '');
      alert('¡Etiquetas enviadas a la impresora con éxito!');
    } catch (err: any) {
      console.error(err);
      alert('Error al imprimir: ' + (err.message || 'Verifica que QZ Tray esté abierto y la impresora encendida.'));
    } finally {
      setLoading(false);
    }
  };

  const copySummary = (summaryArray: string[]) => {
    navigator.clipboard.writeText(summaryArray.join('\n'));
    alert('¡Lista de resumen copiada!');
  };

  if (!config) return <div className="p-10 text-white">Cargando...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Procesar Pedidos en Lote</h1>
      
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-end">
        
        <div className="flex-1 w-full relative">
          <label className="block text-sm text-gray-400 mb-2">Proveedores ({selectedProveedores.length} seleccionados)</label>
          <div 
            onClick={() => setShowProvMenu(!showProvMenu)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white cursor-pointer flex justify-between items-center"
          >
            <span>{selectedProveedores.length > 0 ? `${selectedProveedores.length} seleccionados` : 'Seleccionar...'}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          
          {showProvMenu && (
            <div className="absolute z-10 mt-2 w-full bg-gray-950 border border-gray-800 rounded-lg shadow-xl max-h-60 overflow-y-auto">
              <div className="p-2 border-b border-gray-800 sticky top-0 bg-gray-950">
                <button 
                  onClick={toggleAllProvs}
                  className="w-full text-left px-3 py-2 text-sm text-blue-400 hover:bg-gray-900 rounded"
                >
                  {selectedProveedores.length === proveedores.length ? 'Desmarcar todos' : 'Seleccionar todos'}
                </button>
              </div>
              <ul className="p-2 space-y-1">
                {proveedores.map(p => (
                  <li key={p.PROVEEDOR} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-900 rounded cursor-pointer" onClick={() => toggleProvSelection(p.PROVEEDOR)}>
                    <input type="checkbox" checked={selectedProveedores.includes(p.PROVEEDOR)} onChange={() => {}} className="w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-blue-500" />
                    <span className="text-gray-300">{p.PROVEEDOR}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div className="flex-1 w-full">
          <label className="block text-sm text-gray-400 mb-2">Columna de Pedido</label>
          <select 
            value={selectedColumn} 
            onChange={e => setSelectedColumn(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white"
          >
            {config.settings.pedido_columns.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={handleRevisar}
          disabled={loading || selectedProveedores.length === 0}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
        >
          {loading ? 'Revisando...' : 'Revisar Lote'}
        </button>
      </div>

      {globalError && (
        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-bold">{globalError}</p>
        </div>
      )}

      {providerResults.length > 0 && (
        <div className="space-y-6">
          
          {/* Barra de Acciones Masivas */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-900 border border-gray-800 rounded-xl p-4 gap-4">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                checked={selectedResultProvs.length > 0 && selectedResultProvs.length === providerResults.filter(p => p.success).length}
                onChange={toggleAllResults}
                className="w-5 h-5 bg-gray-950 border border-gray-700 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-white font-medium">Lotes Seleccionados ({selectedResultProvs.length})</span>
            </div>
            {selectedResultProvs.length > 0 && (
              <div className="flex gap-3">
                <button 
                  onClick={() => downloadZips(selectedResultProvs)}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Descargar ZIP Masivo
                </button>
                <button 
                  onClick={() => printLabels(selectedResultProvs)}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  Imprimir Etiquetas
                </button>
              </div>
            )}
          </div>

          {/* Lista de Proveedores Procesados */}
          {providerResults.map((provData) => (
            <div key={provData.proveedor} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-800/20">
                <div className="flex items-center gap-4">
                  {provData.success ? (
                    <input 
                      type="checkbox"
                      checked={selectedResultProvs.includes(provData.proveedor)}
                      onChange={() => toggleResultSelection(provData.proveedor)}
                      className="w-5 h-5 bg-gray-950 border border-gray-700 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  ) : (
                    <div className="w-5 h-5 flex items-center justify-center text-red-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">{provData.proveedor}</h3>
                    {provData.success ? (
                      <p className="text-sm text-green-400">{provData.results.length} fotos, {provData.summary.length} etiquetas</p>
                    ) : (
                      <p className="text-sm text-red-400">Error: {provData.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 items-center">
                  {provData.success && (
                    <>
                      <button 
                        onClick={() => downloadZips([provData.proveedor])}
                        disabled={loading}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                        title="Descargar ZIP"
                      >
                        ZIP
                      </button>
                      <button 
                        onClick={() => printLabels([provData.proveedor])}
                        disabled={loading}
                        className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                        title="Imprimir Etiquetas"
                      >
                        Imprimir
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => toggleExpand(provData.proveedor)}
                    className="ml-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-4 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2"
                  >
                    {provData.isExpanded ? 'Ocultar Detalles' : 'Ver Detalles'}
                    <svg className={`w-4 h-4 transform transition-transform ${provData.isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                </div>
              </div>

              {/* Errores */}
              {!provData.success && provData.missingUrls && provData.missingUrls.length > 0 && provData.isExpanded && (
                <div className="p-4 border-t border-gray-800 bg-red-500/5">
                  <p className="text-sm text-red-400 mb-2">Falta subir foto para los siguientes códigos:</p>
                  <ul className="list-disc pl-5 text-sm text-gray-300">
                    {provData.missingUrls.map(c => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              )}

              {/* Contenido Expandido */}
              {provData.success && provData.isExpanded && (
                <div className="p-6 border-t border-gray-800">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Resumen */}
                    <div className="lg:col-span-1">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-white">Resumen</h4>
                        <button onClick={() => copySummary(provData.summary)} className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-2 py-1 rounded">Copiar</button>
                      </div>
                      <div className="bg-gray-950 p-3 rounded-lg font-mono text-sm text-gray-300 max-h-64 overflow-y-auto whitespace-pre">
                        {provData.summary.join('\n')}
                      </div>
                    </div>
                    
                    {/* Fotos */}
                    <div className="lg:col-span-3">
                      <h4 className="font-semibold text-white mb-4">Fotos a Imprimir ({provData.results.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {provData.results.map((r, i) => {
                          const idxKey = `${provData.proveedor}-${i}`;
                          const isCopied = copiedItems.has(idxKey);
                          return (
                            <div key={i} className="bg-gray-950 border border-gray-800 rounded-lg overflow-hidden group">
                              <div className="aspect-square relative">
                                <img 
                                  src={r.urlTransformada} 
                                  alt={`Pedido ${r.codigo}`} 
                                  className="w-full h-full object-contain p-2"
                                  crossOrigin="anonymous"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <button onClick={() => copyImage(r.urlTransformada, idxKey)} className={`${isCopied ? 'bg-green-600' : 'bg-blue-600'} text-white text-xs px-3 py-1.5 rounded-lg`}>
                                    {isCopied ? 'Copiada' : 'Copiar'}
                                  </button>
                                </div>
                              </div>
                              <div className="p-2 border-t border-gray-800 text-center">
                                <p className="text-xs font-semibold text-white truncate">{r.codigo}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      )}
    </div>
  );
}
