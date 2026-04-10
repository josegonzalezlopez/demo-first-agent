import Chat from './components/Chat'; 
// (Nota: Si tu Chat.tsx está en la misma carpeta app, cambiá la ruta a './Chat')

export default function HomePage() {
  return (
    <div className="h-full w-full">
      <Chat />
    </div>
  );
}