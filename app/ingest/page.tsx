'use client';

import { useState } from 'react';

export default function IngestPage() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('apuntes_manuales');
  const [category, setCategory] = useState('general');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setStatus({ type: 'loading', message: '🧠 Procesando y vectorizando con Ollama...' });

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, category }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: `✅ ¡Perfecto! ${data.message}` });
        setText(''); // Limpiamos el área de texto tras el éxito
      } else {
        setStatus({ type: 'error', message: `❌ Error: ${data.error}` });
      }
    } catch (error) {
      setStatus({ type: 'error', message: '❌ Error de conexión con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 mt-10 bg-white rounded-xl shadow-lg border border-gray-100">
      <h1 className="text-3xl font-bold mb-2 text-gray-800">📥 Cargar Conocimiento</h1>
      <p className="text-gray-500 mb-6">Pega texto, apuntes o documentación para alimentar la memoria del Agente.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuente (Source)</label>
            <input 
              type="text" 
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: pdf_sistemas, documentacion_nextjs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="general">General</option>
              <option value="universidad">Universidad (UNLa)</option>
              <option value="programacion">Programación / Código</option>
              <option value="proyecto">Proyecto asyncReport</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none resize-y"
            placeholder="Pega aquí todo el texto que quieras que el Agente aprenda..."
            required
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading || !text.trim()}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
            isLoading || !text.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Guardando en Memoria Vectorial...' : 'Inyectar Conocimiento'}
        </button>

        {status.message && (
          <div className={`p-4 rounded mt-4 ${
            status.type === 'success' ? 'bg-green-100 text-green-800' : 
            status.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'
          }`}>
            {status.message}
          </div>
        )}
      </form>
    </div>
  );
}