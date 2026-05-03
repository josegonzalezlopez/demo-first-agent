'use client';

import { useChat, Message } from '@ai-sdk/react';
import { WeatherCard, WeatherProps } from './WeatherCard';
import React, { useRef, useState, useEffect } from 'react';

// Renderizadores de Markdown, Código, Gráficos y Matemática
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Estilos vitales para la matemática
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import mermaid from 'mermaid';

// --- COMPONENTE AISLADO PARA GRÁFICOS MERMAID ---
const MermaidChart = ({ chart }: { chart: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. GUARDIA: Si el chart está vacío o es undefined (típico en streaming inicial), no hacemos nada.
    if (!chart || chart.trim() === '') return;

    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    
    if (containerRef.current) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      
      // 2. TRY/CATCH: Atrapamos errores de parseo mientras el LLM escribe el código a medias
      try {
        mermaid.render(id, chart)
          .then(({ svg }) => {
            if (containerRef.current) containerRef.current.innerHTML = svg;
          })
          .catch((e) => {
            // Silenciamos el error en consola. Es normal que falle mientras se transmite el texto.
            // console.warn("Esperando más tokens para el gráfico..."); 
          });
      } catch (error) {
        // Ignoramos errores sincrónicos de inicialización incompleta
      }
    }
  }, [chart]);

  return (
    <div 
      ref={containerRef} 
      className="my-6 flex justify-center bg-[#1E1E1E] p-6 rounded-xl shadow-lg border border-gray-700 overflow-x-auto min-h-[100px] items-center text-gray-500 text-sm"
    >
      {/* Mensaje temporal mientras se carga el gráfico */}
      {!chart || chart.trim() === '' ? 'Generando diagrama...' : ''}
    </div>
  );
};

// --- INTERFAZ DE PROPS ---
interface ChatProps {
  initialMessages?: Message[];
}

// --- COMPONENTE PRINCIPAL DEL CHAT ---
export default function Chat({ initialMessages = [] }: ChatProps) {
  
  // 1. Estados para los modelos LLM
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2');

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.models.length > 0) {
          setAvailableModels(data.models);
          setSelectedModel(data.models[0]);
        }
      })
      .catch(err => console.error("Error obteniendo modelos:", err));
  }, []);

  // 2. Hook del Chat de Vercel AI SDK
  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading } = useChat({
    initialMessages,
    body: {
      model: selectedModel // Inyectamos el modelo seleccionado
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 3. Lógica para adjuntar archivos locales
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target?.result;
      setInput(`${input}\n\n=== Archivo: ${file.name} ===\n\`\`\`typescript\n${code}\n\`\`\`\n`);
    };
    reader.readAsText(file);
  };

  // 4. Exportación limpia a Logseq (Frontmatter corregido)
  const exportToLogseq = (content: string) => {
    const date = new Date().toISOString().split('T')[0];
    const frontmatter = `---
title: asyncReport Insight
date: ${date}
tags: #asyncReport #tech-lead #arquitectura #ai-notes
---

`;
    const finalMarkdown = frontmatter + content;
    const blob = new Blob([finalMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asyncReport-nota-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto">
      
      {/* --- CABECERA Y SELECTOR FIJOS --- */}
      <div className="shrink-0 p-6 border-b border-gray-200 flex justify-between items-end bg-white/80 backdrop-blur-md z-10">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chat Agente</h1>
          <p className="text-sm text-gray-500 mt-1">Agente Local • Memoria Vectorial • Exportacion Markdown</p>
        </div>
        
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Motor LLM</label>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-gray-50 text-gray-800 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-48 p-2 cursor-pointer outline-none shadow-sm transition-colors"
          >
            {availableModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- ÁREA SCROLLABLE DE MENSAJES --- */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-8">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 opacity-80 mt-20">
            <span className="text-6xl">🤖</span>
            <p className="text-lg font-medium text-gray-500">¡Hola! Seleccioná tu modelo y empezá a iterar.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="flex flex-col">
              {m.content && (
                <div className={`whitespace-pre-wrap p-5 rounded-2xl border shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 border-blue-700 text-white ml-12 md:ml-32 self-end rounded-br-sm' 
                    : 'bg-white border-gray-200 text-gray-800 mr-12 md:mr-32 self-start rounded-bl-sm'
                }`}>
                  <div className="w-full prose prose-sm max-w-none prose-pre:p-0 prose-pre:bg-transparent prose-p:leading-relaxed">
                    {m.role === 'assistant' ? (
                      <div className="flex flex-col gap-2">
                        {/* --- RENDERIZADOR MAESTRO DE MARKDOWN --- */}
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeText = String(children).replace(/\n$/, '');
                              
                              // 1. Interceptor de Gráficos Mermaid
                              if (!inline && match && match[1] === 'mermaid') {
                                return <MermaidChart chart={codeText} />;
                              }

                              // 2. Interceptor de Bloques de Código Normales
                              return !inline && match ? (
                                <div className="my-4 rounded-xl overflow-hidden bg-[#1E1E1E] shadow-lg border border-gray-700">
                                  <div className="flex items-center px-4 py-2 bg-[#2D2D2D] text-xs text-gray-300 font-mono border-b border-gray-700/50">
                                    {match[1]}
                                  </div>
                                  <SyntaxHighlighter
                                    {...props}
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                  >
                                    {codeText}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                // 3. Código en línea (ej: `const x = 1`)
                                <code {...props} className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded-md font-mono text-sm border border-gray-200">
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                        
                        {/* Botonera inferior de cada mensaje de la IA */}
                        <div className="flex justify-end border-t border-gray-100 pt-3 mt-3">
                          <button
                            onClick={() => exportToLogseq(m.content)}
                            className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 shadow-sm"
                            title="Exportar a Logseq"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Exportar .md
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p>{m.content}</p>
                    )}
                  </div>
                </div>
              )}

              {/* --- INTERCEPTOR DE HERRAMIENTAS (Tools) --- */}
              {m.toolInvocations?.map(toolInvocation => {
                const { toolName, toolCallId, state } = toolInvocation;
                if (state === 'result' && toolName === 'getWeather') {
                  return <div key={toolCallId} className="mt-2"><WeatherCard {...(toolInvocation.result as WeatherProps)} /></div>;
                } else if (toolName === 'getWeather') {
                  return <div key={toolCallId} className="ml-8 mt-2 text-xs text-gray-500 animate-pulse">Conectando con API del clima...</div>;
                }
                return null;
              })}
            </div>
          ))
        )}
        
        {/* Indicador de "Pensando" */}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="text-sm text-gray-500 animate-pulse ml-8 mt-2 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Procesando inferencia...
          </div>
        )}
      </div>

      {/* --- FORMULARIO DE INPUT FIJO --- */}
      <div className="shrink-0 p-4 bg-white border-t border-gray-200 w-full z-10">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto relative">
          <input 
            type="file" 
            accept=".ts,.tsx,.js,.jsx,.txt,.md" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition shadow-sm border border-gray-200"
            title="Adjuntar archivo para contexto"
          >
            📎
          </button>
          <input
            className="flex-1 p-3.5 border border-gray-300 rounded-xl shadow-inner text-black bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={input}
            placeholder="Preguntá algo, pedí un diagrama o adjuntá un archivo..."
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50 shadow-sm font-medium"
          >
            Enviar
          </button>
        </form>
      </div>
      
    </div>
  );
}