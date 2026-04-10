import { NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';

// Mantenemos la IP explícita para evitar problemas con Fedora/IPv6
const chromaClient = new ChromaClient({ host: "127.0.0.1", port: 8000 });

// Función para generar vectores con tu Ollama local
async function getEmbedding(text: string) {
  const response = await fetch('http://127.0.0.1:11434/api/embeddings', {
    method: 'POST',
    body: JSON.stringify({ model: 'nomic-embed-text', prompt: text }),
  });
  if (!response.ok) throw new Error("Fallo al contactar a Ollama");
  const data = await response.json();
  return data.embedding;
}

// Función de Chunking: Corta el texto en párrafos para no perder contexto semántico
function chunkText(text: string, maxChunkLength: number = 1000): string[] {
  // Separamos por saltos de línea dobles (párrafos)
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (trimmed.length > 0) {
      // Si un párrafo es absurdamente largo, se podría subdividir más,
      // pero para apuntes normales, separarlo por párrafos es ideal para el RAG.
      chunks.push(trimmed);
    }
  }
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { text, source, category } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: "El campo 'text' es obligatorio" }, { status: 400 });
    }

    // 1. Dividimos el texto en fragmentos (Chunks)
    const chunks = chunkText(text);
    console.log(`📦 Procesando texto en ${chunks.length} fragmentos...`);

    // 2. Conectamos a la colección usando la función dummy para evitar el error de ONNX
    const collection = await chromaClient.getOrCreateCollection({ 
      name: "apuntes_unla",
      embeddingFunction: { generate: async () => [] } 
    });

    // 3. Preparamos los arrays para ChromaDB
    const ids: string[] = [];
    const embeddings: number[][] = [];
    const metadatas: any[] = [];
    const documents: string[] = [];

    // Generamos un ID único base basado en el timestamp
    const baseId = `doc_${Date.now()}`;

    // 4. Vectorizamos cada fragmento
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = await getEmbedding(chunk);
      
      ids.push(`${baseId}_chunk_${i}`);
      embeddings.push(vector);
      metadatas.push({ source: source || "ingesta_web", category: category || "general" });
      documents.push(chunk);
    }

    // 5. Guardamos en la base de datos vectorial
    await collection.add({ ids, embeddings, metadatas, documents });

    console.log(`✅ ¡Ingesta completada! ${chunks.length} vectores guardados.`);

    return NextResponse.json({ 
      success: true, 
      message: `Se guardaron ${chunks.length} fragmentos con éxito.`,
      chunksProcessed: chunks.length
    });

  } catch (error: any) {
    console.error("❌ Error en la ingesta:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}