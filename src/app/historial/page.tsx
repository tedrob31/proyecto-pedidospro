'use client';

import { useState, useEffect } from 'react';
import { HistorialPedido } from '@/lib/historial';

export default function HistorialPage() {
  const [historial, setHistorial] = useState<HistorialPedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHistorial();
  }, []);

  const fetchHistorial = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/historial');
      const data = await res.json();
      if (data.success) {
        setHistorial(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteByDate = async (dateStr: string) => {
    if (!confirm(`¿Estás seguro de eliminar todo el historial del día ${dateStr}?`)) return;
    
    try {
      const res = await fetch(`/api/historial?date=${encodeURIComponent(dateStr)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchHistorial();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de red');
    }
  };

  const deleteById = async (id: string) => {
    if (!confirm('¿Eliminar este lote guardado?')) return;
    
    try {
      const res = await fetch(`/api/historial?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchHistorial();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de red');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Agrupar por fecha local (YYYY-MM-DD)
  const groupedByDate: Record<string, HistorialPedido[]> = {};
  historial.forEach(item => {
    const d = new Date(item.fecha);
    // Ajuste para zona horaria local simple
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
    groupedByDate[dateStr].push(item);
  });

  const availableDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a)); // Mas reciente primero

  const getDayName = (dateStr: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    const theDayBefore = new Date(today);
    theDayBefore.setDate(theDayBefore.getDate() - 2);
    const dayBefStr = `${theDayBefore.getFullYear()}-${String(theDayBefore.getMonth() + 1).padStart(2, '0')}-${String(theDayBefore.getDate()).padStart(2, '0')}`;

    if (dateStr === todayStr) return 'Hoy';
    if (dateStr === yestStr) return 'Ayer';
    if (dateStr === dayBefStr) return 'Anteayer';
    return dateStr;
  };

  const datesToShow = selectedDate === 'all' ? availableDates : [selectedDate];

  if (loading) return <div className="p-10 text-white">Cargando historial...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Historial de Pedidos</h1>
          <p className="mt-2 text-sm text-gray-400">Consulta los pedidos guardados anteriormente.</p>
        </div>
        
        {availableDates.length > 0 && (
          <div className="flex gap-4 items-center">
            <label className="text-sm text-gray-400">Filtrar por día:</label>
            <select 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="all">Todos los días</option>
              {availableDates.map(d => (
                <option key={d} value={d}>{getDayName(d)} ({d})</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {availableDates.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-400">No hay historial de pedidos guardado.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {datesToShow.map(dateStr => (
            <div key={dateStr} className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {getDayName(dateStr)} <span className="text-sm text-gray-500 font-normal">({dateStr})</span>
                </h2>
                <button 
                  onClick={() => deleteByDate(dateStr)}
                  className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Limpiar Día
                </button>
              </div>

              <div className="space-y-4">
                {groupedByDate[dateStr].map(pedido => (
                  <div key={pedido.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="p-4 bg-gray-800/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm text-gray-400">{new Date(pedido.fecha).toLocaleTimeString()}</span>
                          <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded border border-blue-800">{pedido.columna}</span>
                        </div>
                        <h3 className="font-semibold text-white">Lote de {pedido.proveedores.length} proveedores</h3>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => deleteById(pedido.id)}
                          className="bg-gray-800 hover:bg-red-900/50 text-gray-400 hover:text-red-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
                          title="Borrar Lote"
                        >
                          Eliminar
                        </button>
                        <button 
                          onClick={() => toggleExpand(pedido.id)}
                          className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 px-4 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-2"
                        >
                          {expandedItems.has(pedido.id) ? 'Ocultar Lote' : 'Ver Lote'}
                          <svg className={`w-4 h-4 transform transition-transform ${expandedItems.has(pedido.id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                      </div>
                    </div>

                    {expandedItems.has(pedido.id) && (
                      <div className="p-4 border-t border-gray-800 space-y-6">
                        {pedido.proveedores.map((provData, pIdx) => (
                          <div key={pIdx} className="bg-gray-950 border border-gray-800/50 rounded-lg p-4">
                            <h4 className="font-bold text-white mb-3 flex items-center justify-between border-b border-gray-800/50 pb-2">
                              <span>{provData.proveedor}</span>
                              <span className="text-xs text-green-400 font-normal bg-green-900/20 px-2 py-1 rounded">
                                {provData.results.length} fotos, {provData.summary.length} etiquetas
                              </span>
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
                              <div className="md:col-span-1">
                                <h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Resumen TSPL</h5>
                                <div className="bg-black/50 p-3 rounded font-mono text-xs text-gray-400 max-h-48 overflow-y-auto whitespace-pre border border-gray-900">
                                  {provData.summary.join('\n')}
                                </div>
                              </div>
                              <div className="md:col-span-3">
                                <h5 className="text-xs text-gray-400 uppercase font-semibold mb-2">Imágenes Solicitadas</h5>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                  {provData.results.map((r: any, i: number) => (
                                    <div key={i} className="bg-black/50 border border-gray-900 rounded overflow-hidden">
                                      <div className="aspect-square relative p-1">
                                        <img 
                                          src={r.urlTransformada} 
                                          alt={r.codigo} 
                                          className="w-full h-full object-contain"
                                          loading="lazy"
                                        />
                                      </div>
                                      <div className="p-1 border-t border-gray-900 text-center bg-gray-900/50">
                                        <p className="text-[10px] font-mono text-gray-300 truncate">{r.codigo}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
