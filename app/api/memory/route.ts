import { NextResponse } from 'next/server';
import { ChromaClient } from 'chromadb';

const chromaClient = new ChromaClient({ host: "127.0.0.1", port: 8000 });

export async function GET() {
  try {
    const collection = await chromaClient.getCollection({ 
        name: "apuntes_unla",
        embeddingFunction: { generate: async () => [] } // El truco del dummy
    });

    // Pedimos los datos (limitado a 50 para no saturar)
    const results = await collection.get({
        limit: 50,
        include: ["documents", "metadatas"] as any
    });

    // Formateamos los datos para enviarlos al Frontend
    const memories = results.ids.map((id, index) => ({
      id,
      document: results.documents[index],
      metadata: results.metadatas[index]
    }));

    return NextResponse.json({ success: true, memories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const collection = await chromaClient.getCollection({ 
        name: "apuntes_unla",
        embeddingFunction: { generate: async () => [] } 
    });

    // Borramos el vector específico de ChromaDB
    await collection.delete({ ids: [id] });

    return NextResponse.json({ success: true, message: "Fragmento eliminado" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}