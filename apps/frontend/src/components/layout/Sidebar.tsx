"use client";

import Link from "next/link";
import { CalendarDays, LayoutDashboard, Settings, Trophy, BarChart3 } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="w-64 h-screen flex flex-col border-r border-border bg-card/50 backdrop-blur-xl shrink-0">
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Trophy className="w-6 h-6 text-primary mr-2" />
        <span className="text-lg font-bold tracking-wider">RESERVATE</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <Link
          href="/"
          className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-lg font-medium transition-colors"
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Panel general
        </Link>
        <Link
          href="/courts"
          className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-lg font-medium transition-colors"
        >
          <CalendarDays className="w-5 h-5 mr-3" />
          Canchas
        </Link>
        <Link
          href="/analytics"
          className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-lg font-medium transition-colors"
        >
          <BarChart3 className="w-5 h-5 mr-3" />
          Analíticas
        </Link>
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <Link
          href="/settings"
          className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-lg font-medium transition-colors"
        >
          <Settings className="w-5 h-5 mr-3" />
          Configuración
        </Link>
        <button
          onClick={() => {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
          }}
          className="w-full flex items-center px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg font-medium transition-colors text-left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
