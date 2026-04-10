# 🚀 asyncReport - AI Agent with Local RAG

**asyncReport** es un asistente inteligente y agente de desarrollo diseñado para gestionar conocimiento de forma 100% local. Utiliza una arquitectura de **Generación Aumentada por Recuperación (RAG)** para responder consultas basadas en documentos específicos (apuntes universitarios, documentación de proyectos, etc.) sin que los datos salgan de tu infraestructura.

---

## 🛠️ Stack Tecnológico

* **Frontend/Backend:** [Next.js 15](https://nextjs.org/) (App Router)
* **Lenguaje:** TypeScript
* **Orquestación de IA:** [Vercel AI SDK](https://sdk.vercel.ai/docs)
* **Motor de Inferencia:** [Ollama](https://ollama.com/) (Modelos: `gemma4:e2b-it-q4_K_M` y `llama3.2`)
* **Base de Datos Vectorial:** [ChromaDB](https://www.trychroma.com/) (vía Podman)
* **Embeddings:** `nomic-embed-text` (vía Ollama)
* **Persistencia y Notas:** Prisma + SQLite / Integración nativa con Logseq (.md)

---

## 💻 Entorno de Desarrollo

Este proyecto está optimizado para correr en Linux con aceleración por hardware estricta:

* **OS:** Fedora Linux 43 (KDE Plasma)
* **GPU:** NVIDIA GeForce GTX 1650 Super (4GB VRAM)
* **Drivers:** NVIDIA Propietarios (RPM Fusion) + CUDA Toolkit
* **Contenedores:** Podman (en modo rootless) para la gestión de ChromaDB

---

## ✨ Funcionalidades Clave Implementadas

1. **RAG Vectorial y Gestor de Memoria:** Endpoints dedicados para ingesta de documentos y una UI para auditar/eliminar fragmentos de la base vectorial ChromaDB.
2. **Renderizado Avanzado (Markdown & Mermaid):** El chat soporta renderizado nativo de código fuente (Syntax Highlighting), matemáticas (LaTeX/KaTeX) y generación de diagramas arquitectónicos con Mermaid.
3. **Selección Dinámica de Modelos:** Permite alternar en tiempo de ejecución entre motores LLM (ej. Llama 3.2 para velocidad, Gemma 4 para razonamiento arquitectónico complejo).
4. **Exportación a Logseq:** Botón integrado en la UI para empaquetar respuestas estructuradas del LLM con frontmatter y descargarlas directamente a una bóveda de notas local.


---

## ⚠️ Troubleshooting & Lecciones Aprendidas

### Bypass de Binarios ONNX (`onnxruntime-node`)
* **Problema:** La librería `chromadb` intenta cargar binarios nativos de Mac/Darwin (`@chroma-core/default-embed`) en Linux, provocando Error 500 en Next.js.
* **Solución:** Se implementó una función de embedding "dummy" (`embeddingFunction: { generate: async () => [] }`). Los vectores reales se generan manualmente vía Ollama y se pasan al método `query`.

### Optimización de VRAM (4GB)
* Para tarjetas limitadas a 4GB de VRAM, el uso de modelos cuantizados a 4-bits (`gemma4:e2b-it-q4_K_M`) es mandatorio. El sistema delega inteligentemente las capas excedentes a la RAM del sistema (Offloading) manteniendo una latencia aceptable para tareas complejas.

---

## 🚀 Roadmap

- [x] Ingesta Dinámica y Gestor de Memoria Vectorial.
- [x] Renderizado de código, matemática (LaTeX) y diagramas (Mermaid).
- [x] Integración de Exportación a Logseq.
- [ ] **Persistencia de Sesiones:** Conectar la UI del chat con SQLite/Prisma para recuperar el historial de conversaciones al recargar la aplicación.
- [ ] **Agentic Workflow:** Expansión de herramientas (Tools) para consultas externas en tiempo real (APIs financieras, clima, noticias).