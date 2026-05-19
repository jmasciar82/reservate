import Link from 'next/link';
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  Trophy,
  Activity
} from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 h-screen flex flex-col border-r border-border bg-card/50 backdrop-blur-xl shrink-0">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Trophy className="w-6 h-6 text-primary mr-2" />
        <span className="text-lg font-bold tracking-wider">RESERVATE</span>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <Link href="/" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Panel General
        </Link>
        <Link href="/courts" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
          <CalendarDays className="w-5 h-5 mr-3" />
          Canchas
        </Link>
        <Link href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
          <Users className="w-5 h-5 mr-3" />
          Jugadores
        </Link>
        <Link href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
          <Activity className="w-5 h-5 mr-3" />
          Matchmaking
        </Link>
      </nav>
      
      <div className="p-4 border-t border-border">
        <Link href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
          <Settings className="w-5 h-5 mr-3" />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
