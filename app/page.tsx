import Chat from './components/Chat';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-center w-full mt-10 text-black">
          Panel de Agentes IA
        </h1>
      </div>
      
      {/* Aquí renderizamos nuestro componente cliente */}
      <Chat />
    </main>
  );
}