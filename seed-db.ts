// seed-db.ts
import { ChromaClient } from 'chromadb';

async function seed() {
  const client = new ChromaClient({ host: "127.0.0.1", port: 8000 });
  
  console.log("🧹 Limpiando y recreando colección 'apuntes_unla'...");
  const collection = await client.createCollection({ name: "apuntes_unla" });

  const data = [
    // --- Información sobre la UNLa ---
    {
      id: "unla_historia",
      text: "La Universidad Nacional de Lanús (UNLa) fue fundada en 1995. Su campus principal se encuentra en Remedios de Escalada, en lo que solían ser los talleres del Ferrocarril Roca.",
      metadata: { source: "historia_unla", category: "institucional" }
    },
    {
      id: "unla_sistemas",
      text: "La Licenciatura en Sistemas en la UNLa enfoca el desarrollo de software con un compromiso social y nacional. Se dictan materias como Algoritmos, Bases de Datos y Arquitectura de Computadoras.",
      metadata: { source: "plan_estudios", category: "academico" }
    },
    {
      id: "unla_ubicacion",
      text: "El ingreso principal a la UNLa es por la calle 29 de Septiembre 3901. El predio cuenta con edificios reciclados con alto valor histórico y arquitectónico.",
      metadata: { source: "guia_estudiante", category: "geografia" }
    },
    // --- Información sobre el Proyecto asyncReport ---
    {
      id: "project_stack",
      text: "El proyecto asyncReport utiliza Next.js 15, TypeScript, Tailwind CSS, Prisma para el historial de chat y ChromaDB como base de datos vectorial para RAG.",
      metadata: { source: "readme", category: "desarrollo" }
    },
    {
      id: "project_ai",
      text: "La IA local corre mediante Ollama. Utilizamos Llama 3.2 para razonamiento general y nomic-embed-text para la generación de embeddings vectoriales.",
      metadata: { source: "arquitectura", category: "ia" }
    },
    // --- Información sobre el Entorno Fedora ---
    {
      id: "fedora_setup",
      text: "El entorno de desarrollo es Fedora Linux 43 con KDE Plasma. Se utiliza Podman para gestionar contenedores de forma segura y rootless.",
      metadata: { source: "setup_logs", category: "sistema" }
    }
  ];

  console.log(`⏳ Procesando ${data.length} documentos...`);

  const getEmbedding = async (text: string) => {
    const resp = await fetch('http://127.0.0.1:11434/api/embeddings', {
      method: 'POST',
      body: JSON.stringify({ model: 'nomic-embed-text', prompt: text })
    });
    if (!resp.ok) throw new Error("Error conectando con Ollama. ¿Está 'nomic-embed-text' instalado?");
    const res = await resp.json();
    return res.embedding;
  };

  const embeddings = await Promise.all(data.map(d => getEmbedding(d.text)));

  await collection.add({
    ids: data.map(d => d.id),
    embeddings: embeddings,
    metadatas: data.map(d => d.metadata),
    documents: data.map(d => d.text)
  });

  console.log("🚀 ¡Base de datos vectorial alimentada con éxito!");
  console.log("Ahora puedes preguntar sobre la UNLa, el stack del proyecto o tu configuración de Fedora.");
}

seed().catch(err => console.error("❌ Error en el seed:", err));