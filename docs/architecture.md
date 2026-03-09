# 🧠 Guía Arquitectónica: Construcción de un Agente de IA Local
**Proyecto:** asyncReport
**Entorno:** Fedora Linux, AMD Radeon RX 6650 XT (8GB VRAM), Next.js, React.

---

## 1. Visión General
Este documento detalla la arquitectura, los conceptos teóricos y las decisiones técnicas detrás de la construcción de un Agente de IA 100% local. El objetivo es crear un sistema capaz de razonar, utilizar herramientas externas, mantener memoria persistente y analizar código fuente, todo sin depender de APIs de pago de terceros.

## 2. Arquitectura del Sistema (Fase 1)

El sistema actual funciona bajo un flujo de **Single-step Tool Calling** (Invocación de herramientas de un solo paso) con Generative UI.

* **Motor LLM (Inferencia):** Ollama ejecutando modelos cuantizados (Llama 3.1 8B, Gemma 2 9B, Qwen 2.5 Coder 7B). Optimizados para arquitectura AMD ROCm (`HSA_OVERRIDE_GFX_VERSION=10.3.0`).
* **Orquestador (Backend):** Vercel AI SDK corriendo sobre Next.js (App Router). Maneja el "streaming" de la respuesta y la lógica condicional de las herramientas.
* **Capa de Presentación (Frontend):** React. Consume el stream y renderiza texto o componentes interactivos (UI Dinámica).
* **Capa de Persistencia (Memoria):** Base de datos SQLite gestionada a través del ORM Prisma. Almacena el historial de mensajes para mantener el contexto entre recargas (`force-dynamic`).

### Diagrama Lógico de Interacción

```text
[ Usuario ] ---> (Ingresa Prompt / Adjunta Archivo)
     |
[ Frontend ] ---> Envía historial + nuevo mensaje vía POST
     |
[ Backend (Next.js API) ] 
     |---> 1. Evalúa el contexto (¿Hay archivo adjunto?)
     |---> 2. Enrutamiento Inteligente (Agentic Routing):
             ├── SÍ: Apaga Tools -> Modo "Analista Puro"
             └── NO: Enciende Tools -> Modo "Agente Conversacional"
     |---> 3. Envía el paquete a Ollama.
     |
[ Ollama (GPU AMD) ] ---> Procesa y devuelve Stream de texto o llamadas JSON
     |
[ Backend ] ---> Ejecuta la función de la herramienta (si aplica) 
     |      ---> Guarda en Prisma (SQLite)
     |
[ Frontend ] <--- Recibe Stream y renderiza (Texto en Markdown o Tarjeta React)
```

---

## 3. Conceptos Teóricos Clave Aprendidos

### 3.1. Gestión de VRAM y Modelos Locales
En la IA local, la memoria RAM (32GB) es secundaria; el verdadero cuello de botella es la **VRAM (8GB)** de la tarjeta de video. 
* **Spillover:** Si el tamaño del modelo sumado a la "Ventana de Contexto" (el historial y los archivos adjuntos) supera los 8GB de VRAM, el sistema desborda hacia la RAM normal, degradando el rendimiento drásticamente.
* **Cuantización:** Usar modelos comprimidos a 4-bits permite meter "cerebros" de 8 a 9 billones de parámetros en ~5.5GB de VRAM, dejando espacio vital para el contexto.

### 3.2. Generative UI y Function Calling (Herramientas)
Los LLMs modernos no solo generan texto, sino que pueden estructurar datos. 
* **Function Calling:** Se le explica al LLM qué herramientas existen. El LLM decide cuándo usarlas y devuelve un comando estructurado (JSON).
* **Generative UI:** El frontend detecta que se ejecutó una herramienta, toma el JSON devuelto y dibuja un componente visual (ej. `WeatherCard`) en lugar de escupir texto plano.

### 3.3. RAG Básico (Retrieval-Augmented Generation)
Técnica para darle información privada al modelo que no estaba en su entrenamiento original.
* **Implementación actual:** Inyección manual. El navegador lee un archivo `.ts` local usando la API nativa de HTML5 y lo inyecta como texto estructurado en el prompt del usuario.

### 3.4. Prompt Engineering para Modelos Pequeños (8B)
Los modelos locales pequeños sufren de "Fragilidad de Herramientas" y se ponen a la defensiva con prompts restrictivos.
* **El Problema:** Prohibir explícitamente ("ESTÁ PROHIBIDO...") suele causar que el modelo rompa el formato o devuelva el JSON crudo en el chat.
* **La Solución:** Refuerzo positivo y "Mensajes Ocultos". Es mejor darle instrucciones limpias e inyectar un mensaje invisible en el retorno de las herramientas (ej. `mensaje_para_el_agente`) para guiar su respuesta final de forma natural.

---

## 4. Patrones de Código Destacados

### Agentic Routing (Enrutamiento Inteligente)
Técnica utilizada en `route.ts` para evitar que el LLM colapse al intentar procesar contexto denso (código fuente) y herramientas de forma simultánea.

```typescript
// 1. Detectar si el usuario adjuntó un archivo mediante una marca en el texto
const lastMessage = messages[messages.length - 1];
const hasCodeFile = lastMessage.role === 'user' && lastMessage.content.includes('=== Archivo:');

const result = streamText({
  model: localOllama('llama3.1'),
  system: `Eres asyncReport. Si te envían código, analízalo. Si te piden un dato, usa tus herramientas.`,
  messages,
  
  // 2. MAGIA DE ENRUTAMIENTO: Alternar dinámicamente entre modos
  // Si hay código, 'tools' es undefined (Modo Analista). 
  // Si es charla normal, se cargan las herramientas (Modo Agente).
  tools: hasCodeFile ? undefined : {
    getWeather: tool({ /* configuración de la herramienta */ }),
  },
  
  // 3. Prevenir bucles infinitos de herramientas al leer código
  maxSteps: hasCodeFile ? 1 : 5,
});
```

---

## 5. Roadmap: Próximos Pasos

- [x] Conexión básica y streaming (Ollama + Vercel AI SDK).
- [x] Persistencia de memoria (SQLite + Prisma).
- [x] RAG estático y Agentic Routing.
- [ ] **Fase 2 - Interfaz Profesional:** Renderizado nativo de Markdown (`react-markdown`). Implementar resaltado de sintaxis para que los bloques de código se vean como en un IDE profesional.
- [ ] **Fase 3 - RAG Vectorial (Embeddings):** Transición de la inyección manual de un solo archivo a una base de datos vectorial. Esto permitirá al agente procesar directorios enteros de documentación de la universidad y buscar contexto semánticamente en milisegundos.
- [ ] **Fase 4 - Sistema Multi-Sesión:** Creación de una barra lateral para gestionar múltiples hilos de chat independientes.