import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const localOllama = createOpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama',
});

export const dynamic = 'force-dynamic';

// Función auxiliar para traducir los códigos del clima de Open-Meteo a texto
function getWeatherDescription(code: number): string {
  if (code === 0) return 'Despejado';
  if (code >= 1 && code <= 3) return 'Algo nublado';
  if (code >= 45 && code <= 48) return 'Niebla';
  if (code >= 51 && code <= 67) return 'Llovizna / Lluvia';
  if (code >= 71 && code <= 77) return 'Nieve';
  if (code >= 95) return 'Tormenta';
  return 'Desconocido';
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // 1. Analizamos tu último mensaje antes de enviarlo al LLM
    const lastMessage = messages[messages.length - 1];
    
    // 2. Creamos el interruptor mágico
    const hasCodeFile = lastMessage.role === 'user' && lastMessage.content.includes('=== Archivo:');


const result = await streamText({
  model: localOllama('llama3.1'),

  // 1. ELIMINAMOS LAS PROHIBICIONES. Un prompt limpio y amigable.
  system: `Eres asyncReport, un asistente útil y desarrollador experto. 
      Si el usuario te envía código, explícalo. 
      Si el usuario te pide el clima o un cálculo, usa tus herramientas para obtener la información y luego respóndele al usuario de forma natural.`,

  messages,

  tools: hasCodeFile ? undefined : {
    getWeather: tool({
      description: 'Obtiene el clima actual en una ciudad',
      parameters: z.object({
        city: z.string().describe('La ciudad a consultar'),
      }),
      execute: async ({ city }) => {
        // 2. TESTIGO SILENCIOSO: Esto se imprimirá en tu terminal de Fedora
        console.log(`🛠️ EJECUTANDO HERRAMIENTA CLIMA PARA: ${city}`);

        const weatherData = {
          "Buenos Aires": { temp: "22°C", condition: "Soleado" },
          "Bariloche": { temp: "12°C", condition: "Nublado" },
          "Paris": { temp: "16°C", condition: "Nublado" },
          "Cordoba": { temp: "18°C", condition: "Niebla" }
        };
        const defaultWeather = { temp: "20°C", condition: "Despejado" };
        const data = weatherData[city as keyof typeof weatherData] || defaultWeather;

        // 3. EL TRUCO DEFINITIVO: Datos separados para React y para el LLM
        return {
          city: city,
          temp: data.temp,
          condition: data.condition,
          mensaje_para_el_agente: `La herramienta fue exitosa. En ${city} hace ${data.temp} y el clima está ${data.condition}. Dile esto al usuario directamente.`
        };
      },
    }),
    // ... (tu herramienta calculator queda igual) ...
  },
  maxSteps: hasCodeFile ? 1 : 5,
  async onFinish({ text }) {
    // ... (Tu código exacto de Prisma se mantiene igual aquí) ...
    try {
      let chat = await prisma.chat.findFirst({ orderBy: { createdAt: 'desc' } });
      if (!chat) chat = await prisma.chat.create({ data: { title: 'Chat Principal' } });
      const userMessage = messages[messages.length - 1];
      if (userMessage.role === 'user') {
        await prisma.message.create({ data: { content: userMessage.content, role: 'user', chatId: chat.id } });
      }
      await prisma.message.create({ data: { content: text || '[Herramienta ejecutada]', role: 'assistant', chatId: chat.id } });
    } catch (error) {
      console.error("Error guardando en la BD:", error);
    }
  }
});

    return result.toDataStreamResponse();
}