"use client";

import { useClub } from "@/providers/ClubProvider";
import { Building2, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { clubs, activeClubId, setActiveClubId } = useClub();
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
    <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm shrink-0 z-20">
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm font-medium text-zinc-300">Administración diaria</p>
          <p className="text-xs text-zinc-500">Reservas, canchas y clubes</p>
        </div>

        {clubs.length > 0 && (
          <div className="relative ml-4" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-4 py-2 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-sm text-white font-medium">
                {activeClub ? activeClub.name : "Seleccionar Sede"}
              </span>
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="py-1">
                  {clubs.map((club) => (
                    <button
                      key={club._id}
                      onClick={() => {
                        setActiveClubId(club._id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                        club._id === activeClubId
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
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

      <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
        <span className="text-xs font-bold">JP</span>
      </div>
    </header>
  );
}
