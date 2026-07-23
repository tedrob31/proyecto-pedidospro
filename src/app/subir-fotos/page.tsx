'use client';

import { useState, useEffect, useRef } from 'react';

export default function SubirFotosPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [selectedProveedor, setSelectedProveedor] = useState('');
  const [sinFoto, setSinFoto] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'pending' | 'uploading' | 'success' | 'error' }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/proveedores')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setProveedores(data.data);
          if (data.data.length > 0) setSelectedProveedor(data.data[0].PROVEEDOR);
        }
      });
  }, []);

  const fetchSinFoto = () => {
    if (!selectedProveedor) return;
    setLoading(true);
    fetch(`/api/fotos?proveedor=${encodeURIComponent(selectedProveedor)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSinFoto(data.data);
          const initialStatus: any = {};
          data.data.forEach((item: any) => {
            initialStatus[item.codigo] = 'pending';
          });
          setUploadStatus(initialStatus);
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSinFoto();
  }, [selectedProveedor]);

  const processFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);

    let hasErrors = false;
    let uploadedCount = 0;

    for (const file of files) {
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      const itemFaltante = sinFoto.find(item => item.codigo.toLowerCase() === fileName.toLowerCase());

      if (!itemFaltante) {
        // Ignorar si el nombre está mal o no pertenece al proveedor actual
        continue;
      }

      if (itemFaltante.tieneFoto) {
        // Mostrar error si ya tiene foto
        alert(`La foto para el código ${itemFaltante.codigo} ya existe. Elimínala primero si deseas reemplazarla.`);
        hasErrors = true;
        continue;
      }

      setUploadStatus(prev => ({ ...prev, [itemFaltante.codigo]: 'uploading' }));

      const formData = new FormData();
      formData.append('file', file);
      formData.append('codigo', itemFaltante.codigo);
      formData.append('hoja', itemFaltante.hoja);
      formData.append('fila', itemFaltante.fila.toString());

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          setUploadStatus(prev => ({ ...prev, [itemFaltante.codigo]: 'success' }));
          uploadedCount++;
        } else {
          setUploadStatus(prev => ({ ...prev, [itemFaltante.codigo]: 'error' }));
          hasErrors = true;
        }
      } catch (err) {
        setUploadStatus(prev => ({ ...prev, [itemFaltante.codigo]: 'error' }));
        hasErrors = true;
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (uploadedCount > 0) {
      setTimeout(() => fetchSinFoto(), 1500);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!uploading && e.dataTransfer.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDeleteFoto = async (item: any) => {
    if (!confirm(`¿Estás seguro de eliminar la foto del código ${item.codigo}?`)) return;

    setUploadStatus(prev => ({ ...prev, [item.codigo]: 'uploading' }));
    try {
      const res = await fetch('/api/delete-foto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hoja: item.hoja, fila: item.fila })
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(prev => ({ ...prev, [item.codigo]: 'pending' }));
        fetchSinFoto();
      } else {
        alert('Error al eliminar: ' + data.error);
        setUploadStatus(prev => ({ ...prev, [item.codigo]: 'error' }));
      }
    } catch (err) {
      alert('Error de red al eliminar');
      setUploadStatus(prev => ({ ...prev, [item.codigo]: 'error' }));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Subir Fotos Faltantes</h1>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
        <label className="block text-sm text-gray-400 mb-2">Seleccionar Proveedor</label>
        <select
          value={selectedProveedor}
          onChange={e => setSelectedProveedor(e.target.value)}
          className="w-full md:w-1/2 bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white"
        >
          {proveedores.map(p => (
            <option key={p.PROVEEDOR} value={p.PROVEEDOR}>{p.PROVEEDOR}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lista de faltantes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 h-fit max-h-[60vh] overflow-y-auto">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center justify-between">
            <span>Códigos del Proveedor</span>
            <span className="bg-blue-500/20 text-blue-400 text-sm py-1 px-3 rounded-full">
              {sinFoto.length} totales ({sinFoto.filter((s: any) => !s.tieneFoto).length} sin foto)
            </span>
          </h2>

          {loading ? (
            <div className="text-gray-400 text-sm">Cargando...</div>
          ) : sinFoto.length === 0 ? (
            <div className="text-gray-400 text-sm p-4 bg-gray-800 rounded-lg border border-gray-700">
              No se encontraron códigos para este proveedor.
            </div>
          ) : (
            <ul className="space-y-2">
              {sinFoto.map((item, i) => {
                const status = uploadStatus[item.codigo] || 'pending';
                return (
                  <li key={i} className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${status === 'success' ? 'bg-green-500/10 border-green-500/50' :
                      status === 'error' ? 'bg-red-500/10 border-red-500/50' :
                        status === 'uploading' ? 'bg-blue-500/10 border-blue-500/50' :
                          'bg-gray-950 border-gray-800'
                    }`}>
                    <span className="font-mono text-gray-300">
                      {item.codigo}
                      <span className="ml-3 text-xs text-gray-500 font-sans">
                        {item.tieneFoto ? '(Con Foto)' : '(Sin Foto)'}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm">
                        {status === 'pending' && (
                          <span className={`w-3 h-3 inline-block rounded-full ${item.tieneFoto ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        )}
                        {status === 'uploading' && <span className="text-blue-400 font-semibold animate-pulse">Procesando...</span>}
                        {status === 'success' && <span className="text-green-400 font-semibold">¡Listo!</span>}
                        {status === 'error' && <span className="text-red-400 font-semibold">Error</span>}
                      </span>
                      {item.tieneFoto && status !== 'uploading' && (
                        <button
                          onClick={() => handleDeleteFoto(item)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Eliminar Foto"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Zona de Input */}
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col justify-center items-center h-[60vh] border-dashed border-2 transition-colors group ${uploading ? 'border-gray-600 opacity-50 cursor-not-allowed' :
              isDragging ? 'border-blue-500 bg-gray-800 cursor-copy' :
                'border-gray-700 hover:border-blue-500 cursor-pointer'
            }`}
        >
          <div className="bg-gray-950 p-4 rounded-full group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-white group-hover:text-blue-400 transition-colors">
            {uploading ? 'Subiendo imágenes...' : 'Selecciona o arrastra fotos'}
          </h3>
          <p className="mt-2 text-sm text-gray-400 text-center max-w-xs">
            Los nombres de los archivos deben coincidir con los códigos (ej. <span className="font-mono text-gray-300">ZAP-003.jpg</span>).
          </p>
          <button
            disabled={uploading}
            className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? 'Procesando...' : 'Seleccionar Archivos'}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
