'use client';

// 1. Asegúrate de importar 'Message' desde el SDK
import { useChat, Message } from '@ai-sdk/react';
import { WeatherCard, WeatherProps } from './WeatherCard';
import React, { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';



// 2. ESTA ES LA LISTA DE INVITADOS (La Interfaz)
// Le decimos a TypeScript que podemos recibir un array de mensajes
interface ChatProps {
  initialMessages?: Message[];
}

// 3. Le pasamos ChatProps a la función principal
export default function Chat({ initialMessages = [] }: ChatProps) {
  
  // 4. Se los inyectamos a la memoria del chat
  const { messages, input, handleInputChange, handleSubmit, setInput, isLoading } = useChat({
    initialMessages,
  });
  // Referencia oculta al input de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Función nativa y estable para leer texto de un archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const code = event.target?.result;
      // Inyectamos el código en el input para que el LLM lo lea
      setInput(`${input}\n\n=== Archivo: ${file.name} ===\n\`\`\`typescript\n${code}\n\`\`\`\n`);
    };
    // Leemos el archivo como texto plano
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chat Agente</h1>
        <p className="text-sm text-gray-500 mt-2">Agente Local • Memoria Persistente</p>
      </div>
      <div className="space-y-6 mb-16">
          {messages.map(m => (
          <div key={m.id} className="flex flex-col">
            {/* 2. Renderizado Normal de Mensajes de Texto */}
            {m.content && (
              <div className={`whitespace-pre-wrap p-4 rounded-xl border ${
                m.role === 'user' 
                  ? 'bg-blue-600 border-blue-700 text-white ml-24 self-end' 
                  : 'bg-gray-100 border-gray-200 text-gray-900 mr-24 self-start'
              }`}>
<div className="text-gray-800 w-full prose prose-sm max-w-none">
            {m.role === 'assistant' ? (
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Esta función intercepta todo el código Markdown
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    
                    // Si es un bloque de código grande (multilínea)
                    return !inline && match ? (
                      <div className="my-4 rounded-xl overflow-hidden bg-[#1E1E1E] shadow-lg">
                        <div className="flex items-center px-4 py-2 bg-[#2D2D2D] text-xs text-gray-400 font-mono">
                          {match[1]}
                        </div>
                        <SyntaxHighlighter
                          {...props}
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      // Si es código en línea (como `const x = 1`)
                      <code {...props} className="bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded-md font-mono text-sm border border-gray-200">
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {m.content}
              </ReactMarkdown>
            ) : (
              <p>{m.content}</p>
            )}
          </div>
              </div>
            )}

            {/* 3. INTERCEPTOR DE UI GENERATIVA: Chequeamos si hay herramientas */}
            {m.toolInvocations && m.toolInvocations.map(toolInvocation => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === 'result') {
                // Si la herramienta terminó con éxito (state: result)
                if (toolName === 'getWeather') {
                  const result = toolInvocation.result as WeatherProps;
                  // Inyectamos la Tarjeta Visual en el Chat
                  return (
                    <div key={toolCallId}>
                      <WeatherCard {...result} />
                    </div>
                  );
                }
              } else {
                // Mientras la herramienta está "ejecutándose" (loading)
                if (toolName === 'getWeather') {
                  return (
                    <div key={toolCallId} className="ml-8 mt-2 text-xs text-gray-500 animate-pulse">
                      Simulando conexión con API del clima...
                    </div>
                  );
                }
              }
              return null;
            })}
          </div>
        ))}
        
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <div className="text-sm text-gray-500 animate-pulse ml-8">Pensando...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-2xl p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100 flex gap-2">
        
        {/* Input de archivo oculto */}
        <input 
          type="file" 
          accept=".ts,.tsx,.js,.jsx,.txt" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {/* Botón de Clip para abrir el explorador de archivos */}
        <button 
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition"
          title="Adjuntar archivo de código"
        >
          📎
        </button>

        <input
          className="flex-1 p-3 border border-gray-200 rounded-xl shadow-inner text-black bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none transition"
          value={input}
          placeholder="Pregunta algo o adjunta un archivo .ts..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        
        <button 
          type="submit" 
          disabled={isLoading || !input}
          className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}