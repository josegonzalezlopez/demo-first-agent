'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Sidebar() {
  const pathname = usePathname();

  // Helper para saber qué pestaña está activa y pintarla de otro color
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-72 bg-slate-900 text-white flex flex-col h-screen shadow-2xl relative z-20 border-r border-slate-800 shrink-0">
      
      {/* Header / Logo de asyncReport */}
      <div className="flex items-center gap-4 mb-8 px-6 pt-8 pb-4 border-b border-slate-800/50">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          🤖
        </div>
        <div>
          <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight">
            asyncReport
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider">AI AGENT DASHBOARD</p>
        </div>
      </div>
      
      {/* Navegación Principal */}
      <nav className="flex flex-col gap-2 flex-grow px-4">
        <Link 
          href="/" 
          className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${
            isActive('/') 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-sm' 
              : 'border-transparent hover:bg-slate-800 text-slate-300 hover:text-white hover:translate-x-1'
          }`}
        >
          <span className="text-xl">💬</span>
          <span className="font-semibold text-sm">Chat Assistant</span>
        </Link>
        
        <Link 
          href="/ingest" 
          className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${
            isActive('/ingest') 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-sm' 
              : 'border-transparent hover:bg-slate-800 text-slate-300 hover:text-white hover:translate-x-1'
          }`}
        >
          <span className="text-xl">📥</span>
          <span className="font-semibold text-sm">Cargar Conocimiento</span>
        </Link>
        
        <Link 
          href="/memory" 
          className={`group flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${
            isActive('/memory') 
              ? 'bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-sm' 
              : 'border-transparent hover:bg-slate-800 text-slate-300 hover:text-white hover:translate-x-1'
          }`}
        >
          <span className="text-xl">🧠</span>
          <span className="font-semibold text-sm">Memoria RAG</span>
        </Link>
      </nav>

      {/* Tarjeta de Status del Sistema (Abajo) */}
      <div className="p-5 m-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-md relative overflow-hidden">
        {/* Línea decorativa superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </div>
          <p className="text-xs text-slate-300 font-bold tracking-widest uppercase">Sistema Activo</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-xs text-slate-400 flex justify-between">
            <span>Base Vectorial:</span> 
            <span className="text-white font-medium">ChromaDB</span>
          </p>
          <p className="text-xs text-slate-400 flex justify-between">
            <span>Aceleración:</span> 
            <span className="text-green-400 font-medium">GTX 1650</span>
          </p>
        </div>
      </div>
    </aside>
  );
}