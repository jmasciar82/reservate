import { Search, Bell } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm shrink-0 z-20">
      <div className="relative w-64">
        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-zinc-400 hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
        </button>
        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
          <span className="text-xs font-bold">JP</span>
        </div>
      </div>
    </header>
  );
}
