export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm shrink-0 z-20">
      <div>
        <p className="text-sm font-medium text-zinc-300">Administración diaria</p>
        <p className="text-xs text-zinc-500">Reservas, canchas y clubes</p>
      </div>
      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
        <span className="text-xs font-bold">JP</span>
      </div>
    </header>
  );
}
