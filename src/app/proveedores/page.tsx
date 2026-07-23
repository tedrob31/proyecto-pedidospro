'use client';

import { useState, useEffect } from 'react';

interface Proveedor {
  PROVEEDOR: string;
  HOJAS: string;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingOldName, setEditingOldName] = useState('');
  
  // Form State
  const [formProv, setFormProv] = useState('');
  const [formHojas, setFormHojas] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/proveedores');
      const data = await res.json();
      if (data.success) {
        setProveedores(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setFormProv('');
    setFormHojas('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Proveedor) => {
    setModalMode('edit');
    setEditingOldName(p.PROVEEDOR);
    setFormProv(p.PROVEEDOR);
    setFormHojas(p.HOJAS);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProv.trim() || !formHojas.trim()) {
      alert('Por favor completa ambos campos.');
      return;
    }

    setSubmitting(true);
    
    try {
      const url = '/api/proveedores';
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const payload = modalMode === 'create' 
        ? { proveedor: formProv.trim(), hojas: formHojas.trim() }
        : { oldProveedor: editingOldName, newProveedor: formProv.trim(), hojas: formHojas.trim() };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (data.success) {
        closeModal();
        await fetchProveedores();
      } else {
        alert(data.error || 'Ocurrió un error');
      }
    } catch (err) {
      alert('Error de red al guardar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (provName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente el proveedor "${provName}" y toda su fila de Google Sheets?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/proveedores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proveedor: provName })
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchProveedores();
      } else {
        alert(data.error || 'Ocurrió un error al eliminar');
      }
    } catch (err) {
      alert('Error de red al eliminar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Gestión de Proveedores</h1>
        <button 
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Nuevo Proveedor
        </button>
      </div>

      {error && (
        <div className="mb-8 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {loading && proveedores.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Cargando proveedores...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-950 text-gray-300 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Proveedor</th>
                  <th className="px-6 py-4">Hojas Asignadas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {proveedores.map((p) => (
                  <tr key={p.PROVEEDOR} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-white">{p.PROVEEDOR}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {p.HOJAS.split(',').map((h, i) => (
                          <span key={i} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                            {h.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-3">
                      <button 
                        onClick={() => openEditModal(p)}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(p.PROVEEDOR)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {proveedores.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center">No hay proveedores registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'create' ? 'Crear Nuevo Proveedor' : 'Editar Proveedor'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del Proveedor</label>
                  <input 
                    type="text" 
                    value={formProv}
                    onChange={(e) => setFormProv(e.target.value)}
                    placeholder="Ej. VALENTINA"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors uppercase"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Hojas Asignadas</label>
                  <input 
                    type="text" 
                    value={formHojas}
                    onChange={(e) => setFormHojas(e.target.value)}
                    placeholder="Ej. LIMA, AREQUIPA"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors uppercase"
                  />
                  <p className="text-xs text-gray-500 mt-2">Separa múltiples hojas usando comas (,)</p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
