'use client';

// 1. Asegúrate de importar 'Message' desde el SDK
import { useChat, Message } from '@ai-sdk/react';
import { WeatherCard, WeatherProps } from './WeatherCard';


// 2. ESTA ES LA LISTA DE INVITADOS (La Interfaz)
// Le decimos a TypeScript que podemos recibir un array de mensajes
interface ChatProps {
  initialMessages?: Message[];
}

// 3. Le pasamos ChatProps a la función principal
export default function Chat({ initialMessages = [] }: ChatProps) {
  
  // 4. Se los inyectamos a la memoria del chat
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    initialMessages,
  });

  return (
    <div className="flex flex-col w-full max-w-2xl py-24 mx-auto stretch">
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
                <span className="font-bold block mb-1 text-xs opacity-70">
                  {m.role === 'user' ? 'TÚ' : 'AGENTE LOCAL'}
                </span>
                {m.content}
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

      <form onSubmit={handleSubmit} className="fixed bottom-0 w-full max-w-2xl p-4 bg-white/90 backdrop-blur-sm border-t border-gray-100">
        <input
          className="w-full p-3 border border-gray-200 rounded-xl shadow-inner text-black bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none transition"
          value={input}
          placeholder="Ej: ¿Qué clima hace en Buenos Aires?"
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </form>
    </div>
  );
}