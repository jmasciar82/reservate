"use client";

import { useClub } from "@/providers/ClubProvider";
import { Building2, ChevronDown, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { clubs, activeClubId, setActiveClubId, isSidebarOpen, setIsSidebarOpen } = useClub();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeClub = clubs.find((c) => c._id === activeClubId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-zinc-950/20 backdrop-blur-md shrink-0 z-20 shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative">
      {/* Glossy overlay reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      <div className="flex items-center gap-3 md:gap-6 z-10">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-100 hover:text-primary hover:border-primary/45 md:hidden transition-all duration-300 focus:outline-none"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-bold text-white tracking-wide">Administración diaria</p>
          <p className="text-[11px] font-medium text-zinc-400">Reservas, canchas y sedes de tu club</p>
        </div>

        {clubs.length > 0 && (
          <div className="relative ml-4" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2.5 bg-white/5 border border-white/10 hover:border-primary/45 rounded-xl px-4 py-2 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-white/[0.08]"
            >
              <Building2 className="w-4 h-4 text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]" />
              <span className="text-sm text-zinc-100 font-bold tracking-wide">
                {activeClub ? activeClub.name : "Seleccionar Sede"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-all duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1.5 px-1 space-y-1">
                  {clubs.map((club) => (
                    <button
                      key={club._id}
                      onClick={() => {
                        setActiveClubId(club._id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs rounded-xl transition-all duration-300 flex items-center gap-2 ${
                        club._id === activeClubId
                          ? "bg-primary/10 text-primary font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-primary/20"
                          : "text-zinc-300 hover:bg-white/5 hover:text-white border border-transparent"
                      }`}
                    >
                      <span className="truncate">{club.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 overflow-hidden flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(57,255,20,0.1)] hover:scale-105 transition-all duration-300 z-10">
        <span className="text-xs font-black text-primary drop-shadow-[0_0_4px_rgba(57,255,20,0.3)]">JP</span>
      </div>
    </header>
  );
}
