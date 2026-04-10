# 🚀 asyncReport - AI Agent with Local RAG

**asyncReport** es un asistente inteligente y agente de desarrollo diseñado para gestionar conocimiento de forma 100% local. Utiliza una arquitectura de **Generación Aumentada por Recuperación (RAG)** para responder consultas basadas en documentos específicos (apuntes universitarios, documentación de proyectos, etc.) sin que los datos salgan de tu infraestructura.

---

## 🛠️ Stack Tecnológico

* **Frontend/Backend:** [Next.js 15](https://nextjs.org/) (App Router)
* **Lenguaje:** TypeScript
* **Orquestación de IA:** [Vercel AI SDK](https://sdk.vercel.ai/docs)
* **Motor de Inferencia:** [Ollama](https://ollama.com/) (Modelos: `llama3.2` y `gemma4`)
* **Base de Datos Vectorial:** [ChromaDB](https://www.trychroma.com/) (vía Podman)
* **Embeddings:** `nomic-embed-text` (vía Ollama)
* **Persistencia:** Prisma + SQLite

---

## 💻 Entorno de Desarrollo (Fedora Linux)

Este proyecto está optimizado para correr en Fedora con aceleración por hardware:

* **OS:** Fedora Linux 43 (KDE Plasma)
* **GPU:** NVIDIA GeForce GTX 1650 Super (4GB VRAM)
* **Drivers:** NVIDIA Propietarios (RPM Fusion) + CUDA Toolkit
* **Contenedores:** Podman (en modo rootless) para la gestión de ChromaDB

---

## ⚙️ Configuración del Sistema

### 1. Preparación de la GPU (NVIDIA)
Para asegurar que Ollama utilice los núcleos CUDA y no sature el CPU:
```bash
sudo dnf install akmod-nvidia xorg-x11-drv-nvidia-cuda
# Reiniciar y verificar conectividad CUDA
nvidia-smi
```

### 2. Infraestructura de Contenedores (ChromaDB)
Levantar la base de datos vectorial en el puerto 8000:
```bash
podman run -d \
  --name chromadb \
  -p 8000:8000 \
  docker.io/chromadb/chroma:latest
```

### 3. Modelos de IA
Descargar los pesos de los modelos necesarios en el motor local:
```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

---

## 🧠 Arquitectura RAG Implementada



El flujo de recuperación de información se ha diseñado para evitar dependencias pesadas y conflictos de binarios en el servidor:

1.  **Vectorización:** La consulta del usuario se convierte a un vector usando `nomic-embed-text`.
2.  **Búsqueda Semántica:** Se consultan los **Top 3** resultados en ChromaDB (`nResults: 3`) para garantizar un contexto completo e hilado.
3.  **Inyección de Contexto:** Los documentos recuperados se inyectan dinámicamente en el `system prompt` antes de la inferencia.
4.  **Inferencia:** El LLM genera la respuesta final basándose exclusivamente en la memoria recuperada.

---

## ⚠️ Troubleshooting & Lecciones Aprendidas

### Bypass de Binarios ONNX (`onnxruntime-node`)
* **Problema:** La librería `chromadb` intenta cargar binarios nativos de Mac/Darwin (`@chroma-core/default-embed`) incluso en entornos Linux, provocando errores de compilación críticos (Error 500) en Webpack/Next.js.
* **Solución:** Se implementó una función de embedding "dummy" (`embeddingFunction: { generate: async () => [] }`) para silenciar la inicialización interna de ChromaDB. Los vectores reales se generan manualmente vía Ollama y se pasan directo al método `query`.

### Resolución de Host en Fedora
* **Problema:** `localhost` resuelve intermitentemente a IPv6 (`::1`), lo que impide la conexión con el contenedor de Podman escuchando en IPv4.
* **Solución:** Forzar el uso de `127.0.0.1` en la instanciación de los clientes de Chroma y Ollama.

### Optimización de VRAM
* Para tarjetas de **4GB de VRAM**, se recomienda estrictamente el uso de `llama3.2` o versiones cuantizadas (Q4_K_M) para mantener una latencia de respuesta ágil y evitar el offloading masivo a la memoria RAM del sistema.

---

## 🚀 Roadmap

- [ ] **Ingesta Dinámica:** Creación de endpoint `/api/ingest` para carga de PDFs y apuntes universitarios desde la UI.
- [ ] **Gestor de Memoria:** Interfaz visual para auditar y borrar fragmentos específicos de la base vectorial.
- [ ] **Agentic Workflow:** Implementación de llamadas a herramientas (Tools) para consultas externas en tiempo real cuando el contexto local sea insuficiente.