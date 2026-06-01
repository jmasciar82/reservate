"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border transition-all duration-300 focus:outline-none hover:scale-105 active:scale-95 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_15px_rgba(0,0,0,0.3)] bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100 dark:hover:bg-white/10"
      title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      aria-label="Alternar tema"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {/* Sun Icon */}
        <Sun 
          className={`absolute w-4 h-4 text-amber-500 transition-all duration-500 ease-out ${
            theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`} 
        />
        {/* Moon Icon */}
        <Moon 
          className={`absolute w-4 h-4 text-indigo-400 drop-shadow-[0_0_5px_rgba(129,140,248,0.5)] transition-all duration-500 ease-out ${
            theme === "light" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          }`} 
        />
      </div>
    </button>
  );
}
