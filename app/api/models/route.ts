import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Le pegamos a la API nativa de Ollama
    const response = await fetch('http://127.0.0.1:11434/api/tags');
    if (!response.ok) throw new Error("Ollama no responde");
    
    const data = await response.json();
    
    // Filtramos solo los nombres (ej: 'llama3.2:latest', 'gemma4:e2b-it-q4_K_M')
    const models = data.models.map((m: any) => m.name);
    
    return NextResponse.json({ success: true, models });
  } catch (error) {
    console.error("Error obteniendo modelos:", error);
    // Fallback por si Ollama está apagado
    return NextResponse.json({ success: false, models: ['llama3.2'] });
  }
}