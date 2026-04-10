// 1. Solo necesitamos estos imports (que ya están en tu package.json)
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { ChromaClient } from 'chromadb';
import { z } from 'zod';


// 2. Configuramos Ollama como si fuera OpenAI (porque lo es)
const localOllama = createOpenAI({
  baseURL: 'http://127.0.0.1:11434/v1',
  apiKey: 'ollama', // Ollama no la necesita, pero el SDK la pide
});

const chromaClient = new ChromaClient({ host: "127.0.0.1", port: 8000 });

async function getEmbedding(text: string) {
  const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
    method: 'POST',
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });
  const data = await response.json();
  return data.embedding;
}

export async function POST(req: Request) {
  const { messages, model } = await req.json();
  const lastMessage = messages[messages.length - 1];

  // Definimos un fallback seguro por si algo falla
  const selectedModel = model || 'llama3.2';

  let contextFromDB = "";
  try {
    // CAMBIO AQUÍ: Le pasamos una función vacía para que no pida el paquete '@chroma-core/default-embed'
    const collection = await chromaClient.getCollection({ 
      name: "apuntes_unla",
      embeddingFunction: { generate: async (texts) => [] } // <--- Esto silencia el error
    });
    
    const queryVector = await getEmbedding(lastMessage.content);

    const searchResults = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 3 // <--- CAMBIAMOS DE 1 A 3 para tener más contexto
    });

    // Unimos todos los fragmentos encontrados en un solo texto
    if (searchResults.documents[0].length > 0) {
      contextFromDB = searchResults.documents[0].join("\n\n");
      console.log("🧠 MEMORIA AMPLIADA RECUPERADA");
    }
  } catch (error) {
    console.log("⚠️ Error en ChromaDB:", error);
  }

  // 3. CAMBIO CLAVE: Usamos 'localOllama' en lugar de 'ollama'
  const result = await streamText({
    // 2. Le pasamos la variable dinámica al provider
    model: localOllama(selectedModel),
    system: `Eres asyncReport, un asistente técnico experto y Tech Lead.
    
    BASE DE CONOCIMIENTO LOCAL:
    ${contextFromDB}
    
    REGLAS ESTRICTAS DE COMPORTAMIENTO:
    1. Si la pregunta es sobre programación, código (React, TypeScript, etc.) o teoría técnica, RESPONDE INMEDIATAMENTE usando tu conocimiento o la memoria local. NO uses herramientas externas.
    2. Tienes acceso a la herramienta 'getTechNews'. ÚSALA ÚNICA Y EXCLUSIVAMENTE si el usuario escribe explícitamente palabras como "noticias", "news", "actualidad" o "Hacker News". 
    3. Si usas la herramienta para una pregunta de código, serás penalizado.`,
    messages,
    maxSteps: 5, // <--- CRÍTICO: Permite que el modelo llame a la herramienta y luego te responda
    tools: {
      getTechNews: tool({
        description: 'Obtiene las últimas 5 noticias y tendencias mundiales de tecnología, desarrollo e inteligencia artificial desde Hacker News.',
        parameters: z.object({}), // No requiere parámetros del usuario
        execute: async () => {
          console.log("🌍 Llamando a la API de Hacker News...");
          try {
            // 1. Obtenemos los IDs de las historias más top de hoy
            const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
            const storyIds = await response.json();
            
            // 2. Tomamos solo las top 5 para no saturar al LLM
            const top5Ids = storyIds.slice(0, 5);
            
            // 3. Obtenemos los títulos y links de esas 5 historias
            const stories = await Promise.all(
              top5Ids.map(async (id: number) => {
                const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                return await storyRes.json();
              })
            );
            
            // Devolvemos el array resumido al Agente
            return stories.map((s: any) => ({ 
              titulo: s.title, 
              puntuacion: s.score,
              enlace: s.url 
            }));
          } catch (error) {
            return { error: "No se pudieron obtener las noticias en este momento." };
          }
        },
      }),
    },
  });

  return result.toDataStreamResponse();
}