import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "./components/sidebar"; // Ajusta la ruta si no usas alias '@'
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "asyncReport - AI Agent",
  description: "Plataforma de gestión inteligente con RAG local",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-slate-50 flex h-screen overflow-hidden antialiased`}>
        
        {/* Aquí inyectamos el nuevo componente */}
        <Sidebar />

        {/* CONTENIDO PRINCIPAL */}
        {/* Al darle flex-1, toma todo el ancho restante. relative e h-screen aseguran que el chat no rompa el scroll */}
        <main className="flex-1 h-screen overflow-hidden relative bg-white/50">
          {children}
        </main>
        
      </body>
    </html>
  );
}