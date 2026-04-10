'use client';

import { useEffect, useState } from 'react';

type Memory = {
  id: string;
  document: string;
  metadata: { source: string; category: string };
};

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.success) {
        setMemories(data.memories);
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Seguro que quieres borrar este conocimiento? El Agente lo olvidará para siempre.")) return;

    try {
      const res = await fetch('/api/memory', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (res.ok) {
        // Actualizamos la UI quitando el borrado
        setMemories(memories.filter(m => m.id !== id));
      }
    } catch (error) {
      console.error("Error deleting memory:", error);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-8 mt-10 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">🧠 Gestor de Conocimiento</h1>
          <p className="text-gray-500">Visualiza y administra lo que el Agente tiene en su memoria vectorial.</p>
        </div>
        <button 
          onClick={fetchMemories}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          🔄 Refrescar
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-gray-500 animate-pulse">Cargando vectores de ChromaDB...</div>
      ) : memories.length === 0 ? (
        <div className="text-center py-10 text-gray-500">La memoria está vacía.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">ID / Origen</th>
                <th className="p-4 font-semibold text-gray-600">Categoría</th>
                <th className="p-4 font-semibold text-gray-600">Contenido (Fragmento)</th>
                <th className="p-4 font-semibold text-gray-600 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {memories.map((m) => (
                <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 align-top">
                    <div className="text-xs text-gray-400 truncate w-32" title={m.id}>{m.id}</div>
                    <div className="font-medium text-blue-600">{m.metadata?.source || 'Desconocido'}</div>
                  </td>
                  <td className="p-4 align-top">
                    <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">
                      {m.metadata?.category || 'General'}
                    </span>
                  </td>
                  <td className="p-4 align-top text-sm text-gray-700 max-w-xl">
                    {m.document}
                  </td>
                  <td className="p-4 align-top text-center">
                    <button 
                      onClick={() => handleDelete(m.id)}
                      className="text-red-500 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      Borrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}