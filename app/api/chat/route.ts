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

  const result = await streamText({
    model: localOllama('llama3.1'),
    system: 'Eres el Agente Principal de asyncReport. Eres un asistente experto, conciso y directo. Tienes memoria de la conversación y acceso a herramientas en tiempo real.',
    messages,
    tools: {
      getWeather: tool({
        description: 'ÚSA LA HERRAMIENTA SOLO SI el usuario pide explícitamente la temperatura o el clima de un lugar exacto.',
        parameters: z.object({
          location: z.string().describe('El nombre de la ciudad, ej: Lanús, Buenos Aires, Madrid'),
        }),
        execute: async ({ location }) => {
          try {
            // 1. Convertir la ciudad a Latitud/Longitud (Geocoding API)
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=es`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) {
              return { temp: 0, description: 'Ciudad no encontrada', location };
            }

            const { latitude, longitude, name } = geoData.results[0];

            // 2. Obtener el clima real con las coordenadas obtenidas
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`);
            const weatherData = await weatherRes.json();

            // 3. Formatear y devolver los datos a nuestra WeatherCard
            const temp = Math.round(weatherData.current.temperature_2m);
            const code = weatherData.current.weather_code;

            return {
              temp,
              description: getWeatherDescription(code),
              location: name // Devolvemos el nombre formateado oficial
            };
          } catch (error) {
            console.error(error);
            return { temp: 0, description: 'Error de conexión', location };
          }
        },
      }),
      // NUEVA HERRAMIENTA: La Calculadora
      calculator: tool({
        description: 'Una calculadora para realizar operaciones matemáticas exactas. ÚSALA SIEMPRE que el usuario te pida resolver un cálculo.',
        parameters: z.object({
          num1: z.number().describe('El primer número de la operación'),
          num2: z.number().describe('El segundo número de la operación'),
          operacion: z.enum(['sumar', 'restar', 'multiplicar', 'dividir']).describe('La operación matemática a realizar'),
        }),
        execute: async ({ num1, num2, operacion }) => {
          let resultado = 0;
          switch (operacion) {
            case 'sumar': resultado = num1 + num2; break;
            case 'restar': resultado = num1 - num2; break;
            case 'multiplicar': resultado = num1 * num2; break;
            case 'dividir': resultado = num2 !== 0 ? num1 / num2 : 0; break;
          }
          // Devolvemos el resultado al modelo
          return { resultado, operacion, num1, num2 };
        },
      }),
    },
    maxSteps: 5,
    async onFinish({ text }) {
      try {
        // 1. Buscamos el chat principal (o lo creamos si no existe)
        let chat = await prisma.chat.findFirst({ orderBy: { createdAt: 'desc' } });
        if (!chat) {
          chat = await prisma.chat.create({ data: { title: 'Chat Principal' } });
        }

        // 2. Guardamos tu mensaje (el último que enviaste)
        const userMessage = messages[messages.length - 1];
        if (userMessage.role === 'user') {
          await prisma.message.create({
            data: { content: userMessage.content, role: 'user', chatId: chat.id }
          });
        }

        // 3. Guardamos la respuesta del Agente
        await prisma.message.create({
          data: { content: text || '[Herramienta ejecutada]', role: 'assistant', chatId: chat.id }
        });
      } catch (error) {
        console.error("Error guardando en la BD:", error);
      }
    }
  });

  return result.toDataStreamResponse();
}