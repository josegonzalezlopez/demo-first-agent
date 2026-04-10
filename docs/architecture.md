# 🧠 Guía Arquitectónica: Construcción de un Agente de IA Local
**Proyecto:** asyncReport
**Entorno:** Fedora Linux, NVIDIA GTX 1650 Super (4GB VRAM), Next.js, React.

---

## 1. Visión General
Este documento detalla la arquitectura, los conceptos teóricos y las decisiones técnicas detrás de la construcción de un Agente de IA 100% local. El objetivo es crear un sistema capaz de razonar arquitecturas de software, utilizar herramientas externas, inyectar conocimiento (RAG) y exportar insights, sin depender de APIs de pago.

## 2. Arquitectura del Sistema (Fase 2)

El sistema opera mediante una arquitectura de **Generación Aumentada por Recuperación (RAG)** combinada con **Tool Calling**.

* **Motor LLM (Inferencia):** Ollama ejecutando modelos cuantizados a 4-bits (`gemma4:e2b-it-q4_K_M`, `llama3.2`). Optimizados para núcleos CUDA de NVIDIA.
* **Orquestador (Backend):** Vercel AI SDK sobre Next.js (App Router).
* **Memoria a Largo Plazo (Conocimiento):** ChromaDB (vectorial) corriendo en Podman para búsquedas semánticas (Embeddings vía `nomic-embed-text`).
* **Capa de Presentación (Frontend):** React con procesamiento avanzado (ReactMarkdown, rehype-katex, mermaid) para renderizar UI Generativa y diagramas en tiempo real.


### Diagrama Lógico de Interacción

```text
[ Usuario ] ---> (Selecciona Modelo + Ingresa Prompt)
     |
[ Frontend ] ---> Envía consulta vía POST a /api/chat
     |
[ Backend (Next.js) ]
     |---> 1. Vectoriza el prompt de usuario (nomic-embed-text)
     |---> 2. Consulta ChromaDB (Top 3 fragmentos más relevantes)
     |---> 3. Inyecta el contexto recuperado en el System Prompt
     |---> 4. Evalúa herramientas disponibles (Tool Calling)
     |---> 5. Envía el paquete al motor LLM seleccionado.
     |
[ Ollama (GPU NVIDIA) ] ---> Procesa (Offloading si supera 4GB VRAM) y devuelve Stream
     |
[ Frontend ] <--- Recibe Stream, renderiza Markdown/Mermaid y habilita Exportación (.md)