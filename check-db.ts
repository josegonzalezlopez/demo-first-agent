// check-db.ts
import { ChromaClient } from 'chromadb';

async function check() {
  const client = new ChromaClient({ host: "127.0.0.1", port: 8000 });
  
  try {
    const collections = await client.listCollections();
    console.log("📂 Colecciones encontradas:", collections.map(c => c.name));

    if (collections.some(c => c.name === "apuntes_unla")) {
      const collection = await client.getCollection({ name: "apuntes_unla" });
      const count = await collection.count();
      console.log(`✅ La colección 'apuntes_unla' existe y tiene ${count} documentos.`);
      
      if (count === 0) {
        console.log("⚠️ ¡ATENCIÓN! La base de datos está vacía. Por eso el Agente alucina.");
      }
    } else {
      console.log("❌ La colección 'apuntes_unla' NO existe.");
    }
  } catch (error) {
    console.error("❌ Error de conexión: ¿Está corriendo el contenedor de Podman en el puerto 8000?");
  }
}

check();