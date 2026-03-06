import Chat from './components/Chat';
import { prisma } from './lib/prisma';

// ESTA ES LA LÍNEA MÁGICA QUE APAGA LA CACHÉ
export const dynamic = 'force-dynamic';

export default async function Home() {
  const chat = await prisma.chat.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { 
      messages: { orderBy: { createdAt: 'asc' } } 
    }
  });

  const initialMessages = chat?.messages.map(m => ({
    id: m.id,
    role: m.role as 'user' | 'assistant',
    content: m.content,
  })) || [];

  return (
    <main className="min-h-screen bg-white">
      <Chat initialMessages={initialMessages} />
    </main>
  );
}