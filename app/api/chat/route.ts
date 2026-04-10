// 1. Solo necesitamos estos imports (que ya están en tu package.json)
import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { ChromaClient } from 'chromadb';

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
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1];

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
    model: localOllama('llama3.2'), // <--- Aquí usamos el provider que definimos arriba
    system: `Eres asyncReport. Contexto local: ${contextFromDB}`,
    messages,
  });

  return result.toDataStreamResponse();
}