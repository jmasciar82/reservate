"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, LayoutDashboard, Settings, Trophy, BarChart3, Users, History } from "lucide-react";
import { getClientUserRole } from "@/lib/api";
import { useClub } from "@/providers/ClubProvider";

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setIsSidebarOpen } = useClub();
  const isActive = (path: string) => pathname === path;
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(getClientUserRole());
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-all duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 h-screen flex flex-col border-r border-zinc-200 dark:border-white/5 bg-white/95 md:bg-zinc-50/40 dark:bg-zinc-950/95 dark:md:bg-zinc-950/40 backdrop-blur-xl shrink-0 z-50 md:z-20 shadow-[4px_0_24px_rgba(0,0,0,0.03)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Glossy overlay reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="flex items-center h-16 px-6 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/[0.02] dark:bg-white/[0.01] z-10 transition-colors duration-300">
          <Trophy className="w-6 h-6 text-primary mr-2.5 drop-shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
          <span className="text-lg font-black tracking-widest bg-gradient-to-r from-zinc-800 via-zinc-600 to-primary dark:from-white dark:via-zinc-200 dark:to-primary bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(57,255,20,0.15)]">
            RESERVATE
          </span>
        </div>

      <nav className="flex-1 py-6 px-4 space-y-2.5 overflow-y-auto z-10">
        <Link
          href="/"
          className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
            isActive("/")
              ? "bg-primary/10 text-emerald-800 dark:text-white shadow-[0_0_15px_rgba(57,255,20,0.05)] border-l-2 border-primary"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1"
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 mr-3 transition-colors ${isActive("/") ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
          Panel general
        </Link>
        <Link
          href="/courts"
          className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
            isActive("/courts")
              ? "bg-primary/10 text-emerald-800 dark:text-white shadow-[0_0_15px_rgba(57,255,20,0.05)] border-l-2 border-primary"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1"
          }`}
        >
          <CalendarDays className={`w-5 h-5 mr-3 transition-colors ${isActive("/courts") ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
          Canchas
        </Link>
        <Link
          href="/analytics"
          className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
            isActive("/analytics")
              ? "bg-primary/10 text-emerald-800 dark:text-white shadow-[0_0_15px_rgba(57,255,20,0.05)] border-l-2 border-primary"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1"
          }`}
        >
          <BarChart3 className={`w-5 h-5 mr-3 transition-colors ${isActive("/analytics") ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
          Analíticas
        </Link>
        {role === "admin" && (
          <Link
            href="/users"
            className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
              isActive("/users")
                ? "bg-primary/10 text-emerald-800 dark:text-white shadow-[0_0_15px_rgba(57,255,20,0.05)] border-l-2 border-primary"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1"
            }`}
          >
            <Users className={`w-5 h-5 mr-3 transition-colors ${isActive("/users") ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
            Usuarios
          </Link>
        )}
        {(role === "admin" || role === "club_owner") && (
          <Link
            href="/audit"
            className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
              isActive("/audit")
                ? "bg-primary/10 text-emerald-800 dark:text-white shadow-[0_0_15px_rgba(57,255,20,0.05)] border-l-2 border-primary"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1"
            }`}
          >
            <History className={`w-5 h-5 mr-3 transition-colors ${isActive("/audit") ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
            Auditoría
          </Link>
        )}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/[0.02] dark:bg-white/[0.01] space-y-2.5 z-10 transition-colors duration-300">
        {role === "admin" && (
          <Link
            href="/settings"
            className={`flex items-center px-4 py-3 rounded-xl font-bold transition-all duration-300 ${
              isActive("/settings")
                ? "bg-primary/10 text-emerald-800 dark:text-white shadow-[0_0_15px_rgba(57,255,20,0.05)] border-l-2 border-primary"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-l-2 border-transparent hover:translate-x-1"
            }`}
          >
            <Settings className={`w-5 h-5 mr-3 transition-colors ${isActive("/settings") ? "text-primary" : "text-zinc-400 dark:text-zinc-500"}`} />
            Configuración
          </Link>
        )}
        <button
          onClick={() => {
            document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
          }}
          className="w-full flex items-center px-4 py-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 border-l-2 border-transparent hover:border-red-500 rounded-xl font-bold transition-all duration-300 text-left hover:translate-x-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-3"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
    </>
  );
}
