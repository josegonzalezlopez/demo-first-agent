# 🚀 asyncReport - AI Agent with Local RAG

**asyncReport** es un asistente inteligente y agente de desarrollo diseñado para gestionar conocimiento de forma 100% local. Utiliza una arquitectura de **Generación Aumentada por Recuperación (RAG)** para responder consultas basadas en documentos específicos (apuntes universitarios, documentación de proyectos, etc.) sin que los datos salgan de tu infraestructura.

---

## 🛠️ Stack Tecnológico

* **Frontend/Backend:** Next.js 15 (App Router)
* **Lenguaje:** TypeScript
* **Orquestación de IA:** Vercel AI SDK
* **Motor de Inferencia:** Ollama (Modelos: `gemma4:e2b-it-q4_K_M` y `llama3.2`)
* **Base de Datos Vectorial:** ChromaDB (vía Podman)
* **Embeddings:** `nomic-embed-text` (vía Ollama)
* **Persistencia y Notas:** Prisma + SQLite / Integración nativa con Logseq (.md)

---

## 💻 Entorno de Desarrollo (Recomendado)

Este proyecto está optimizado para correr en Linux con aceleración por hardware estricta:

* **OS:** Fedora Linux 43 (KDE Plasma)
* **GPU:** NVIDIA GeForce GTX 1650 Super (4GB VRAM) o superior.
* **Drivers:** NVIDIA Propietarios (RPM Fusion) + CUDA Toolkit
* **Contenedores:** Podman (en modo rootless) para la gestión de ChromaDB

---

## 🚀 Guía de Inicio Rápido (Quickstart)

Si acabas de clonar este repositorio, sigue estos pasos estrictamente en orden para levantar el entorno de desarrollo local de asyncReport.

### 1. Clonar e Instalar Dependencias
```bash
git clone <tu-repo-url>
cd asyncReport
npm install
```
*(Nota: Esto instalará dependencias clave de la UI como `mermaid`, `react-markdown`, `remark-math` y `rehype-katex` para el renderizado avanzado).*

### 2. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto y define la cadena de conexión a tu base de datos SQLite local:
```env
DATABASE_URL="file:./dev.db"
```

### 3. Inicializar la Base de Datos (Prisma)
Como la base de datos no se versiona en Git, debes crearla y sincronizar el esquema en tu máquina:
```bash
# Genera el cliente tipado de Prisma
npx prisma generate

# Empuja el esquema y crea el archivo dev.db localmente
npx prisma db push
```

### 4. Verificación de Servicios Locales (IA & RAG)
Antes de levantar Next.js, asegúrate de que el "cerebro" y la "memoria" estén encendidos en tu sistema operativo:
```bash
# 1. Verificar que ChromaDB está corriendo (Debería escuchar en el Puerto 8000)
podman ps | grep chromadb

# 2. Verificar que Ollama está activo y con los modelos descargados
ollama list
```

### 5. Levantar la Aplicación
```bash
npm run dev
```
Visita `http://localhost:3000` en tu navegador. ¡El Agente ya está listo para iterar!

---

## ✨ Funcionalidades Clave Implementadas

1. **RAG Vectorial y Gestor de Memoria:** Endpoints dedicados para ingesta de documentos y una UI para auditar/eliminar fragmentos de la base vectorial ChromaDB.
2. **Renderizado Avanzado (Markdown & Mermaid):** El chat soporta renderizado nativo de código fuente (Syntax Highlighting), matemáticas (LaTeX/KaTeX) y generación de diagramas arquitectónicos con Mermaid.
3. **Selección Dinámica de Modelos:** Permite alternar en tiempo de ejecución entre motores LLM (ej. Llama 3.2 para velocidad, Gemma 4 para razonamiento arquitectónico complejo).
4. **Exportación a Logseq:** Botón integrado en la UI para empaquetar respuestas estructuradas del LLM con frontmatter y descargarlas directamente a una bóveda de notas local.

---

## ⚠️ Troubleshooting & Lecciones Aprendidas

### Bypass de Binarios ONNX (`onnxruntime-node`)
* **Problema:** La librería `chromadb` intenta cargar binarios nativos de Mac/Darwin (`@chroma-core/default-embed`) en Linux, provocando un Error 500 crítico en Webpack/Next.js.
* **Solución:** Se implementó una función de embedding "dummy" (`embeddingFunction: { generate: async () => [] }`) al instanciar la colección. Los vectores reales se generan manualmente vía el endpoint HTTP de Ollama y se pasan al método `query`.

### Optimización de VRAM (Límites de 4GB)
* Para tarjetas limitadas a 4GB de VRAM, el uso de modelos cuantizados a 4-bits (`gemma4:e2b-it-q4_K_M`) es mandatorio. El sistema delega inteligentemente las capas de la red neuronal excedentes a la RAM del sistema (Offloading) manteniendo una latencia aceptable para tareas de razonamiento complejo.

### Resolución de Host en Fedora
* **Problema:** `localhost` resuelve intermitentemente a IPv6 (`::1`), lo que impide la conexión con el contenedor de Podman escuchando en IPv4.
* **Solución:** Forzar el uso de `127.0.0.1` en la instanciación de los clientes de Chroma y las llamadas a la API de Ollama.

---

## 🗺️ Roadmap

- [x] Ingesta Dinámica y Gestor de Memoria Vectorial.
- [x] Renderizado de código, matemática (LaTeX) y diagramas (Mermaid).
- [x] Integración de Exportación de Notas a Logseq.
- [ ] **Persistencia Estructural:** Implementación de Prisma + SQLite para almacenar sesiones de chat (hilos conversacionales), permitiendo al usuario retomar arquitecturas discutidas en días anteriores.
- [ ] **Agentic Workflow 2.0:** Expansión de herramientas (Tools) para consultas externas en tiempo real de forma asíncrona.