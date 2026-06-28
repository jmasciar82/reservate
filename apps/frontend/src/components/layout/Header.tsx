"use client";

import { useClub } from "@/providers/ClubProvider";
import { Building2, ChevronDown, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  const { clubs, activeClubId, setActiveClubId, isSidebarOpen, setIsSidebarOpen } = useClub();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeClub = clubs.find((c) => c._id === activeClubId);

  const [isSubdomainActive, setIsSubdomainActive] = useState(false);
  const [initials, setInitials] = useState("JP");

  useEffect(() => {
    const fetchInitials = async () => {
      try {
        const { apiFetch } = await import("@/lib/api");
        const res = await apiFetch("/users/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.initials) {
            setInitials(data.initials);
          } else if (data.name) {
            const names = data.name.trim().split(/\s+/);
            const init = names.map((n: string) => n[0]).join("").substring(0, 3).toUpperCase();
            setInitials(init || "US");
          }
        }
      } catch (err) {
        console.error("Error fetching initials in header:", err);
      }
    };

    fetchInitials();

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.initials) {
        setInitials(customEvent.detail.initials);
      } else if (customEvent.detail?.name) {
        const names = customEvent.detail.name.trim().split(/\s+/);
        const init = names.map((n: string) => n[0]).join("").substring(0, 3).toUpperCase();
        setInitials(init || "US");
      }
    };

    window.addEventListener("profile-updated", handleProfileUpdate);
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    if (typeof window !== "undefined") {
      const host = window.location.host;
      const cleanHost = host.split(":")[0].toLowerCase();
      const parts = cleanHost.split(".");
      let isSub = false;
      if (parts.length > 2) {
        isSub = parts[0] !== "www" && parts[0] !== "reservate-frontend";
      } else if (parts.length === 2 && parts[1] === "localhost") {
        isSub = parts[0] !== "www";
      }
      setIsSubdomainActive(isSub);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-200 dark:border-white/5 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md shrink-0 z-20 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.15)] relative transition-colors duration-300">
      {/* Glossy overlay reflection */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-900/5 dark:via-white/5 to-transparent pointer-events-none" />

      <div className="flex items-center gap-3 md:gap-6 z-10">
        {/* Hamburger Menu for Mobile */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 hover:text-primary hover:border-primary/45 dark:bg-white/5 dark:border-white/10 dark:text-zinc-100 md:hidden transition-all duration-300 focus:outline-none"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <p className="text-sm font-bold text-zinc-800 dark:text-white tracking-wide transition-colors duration-300">Administración diaria</p>
          <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 transition-colors duration-300">Reservas, canchas y sedes de tu club</p>
        </div>

        {clubs.length > 0 && (
          <div className="relative ml-4" ref={dropdownRef}>
            {isSubdomainActive ? (
              <div
                className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2 dark:bg-white/5 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.02)] select-none"
              >
                <Building2 className="w-4 h-4 text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]" />
                <span className="text-sm text-zinc-800 dark:text-zinc-100 font-bold tracking-wide">
                  {activeClub ? activeClub.name : "Club"}
                </span>
              </div>
            ) : (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2.5 bg-white border border-zinc-200 hover:border-primary/45 rounded-xl px-4 py-2 transition-all duration-300 shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:bg-white/5 dark:border-white/10 dark:hover:border-primary/45 dark:shadow-[0_2px_10px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-primary/20 hover:bg-zinc-50 dark:hover:bg-white/[0.08]"
              >
                <Building2 className="w-4 h-4 text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]" />
                <span className="text-sm text-zinc-800 dark:text-zinc-100 font-bold tracking-wide transition-colors duration-300">
                  {activeClub ? activeClub.name : "Seleccionar Sede"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-all duration-300 ${isOpen ? "rotate-180 text-primary" : ""}`} />
              </button>
            )}

            {!isSubdomainActive && isOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                          ? "bg-primary/10 text-emerald-700 dark:text-primary font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-primary/20"
                          : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white border border-transparent"
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

      <div className="flex items-center gap-3.5 z-10">
        <ThemeToggle />
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 overflow-hidden flex items-center justify-center cursor-pointer shadow-[0_0_10px_rgba(57,255,20,0.1)] hover:scale-105 transition-all duration-300">
          <span className="text-xs font-black text-primary drop-shadow-[0_0_4px_rgba(57,255,20,0.3)]">{initials}</span>
        </div>
      </div>
    </header>
  );
}
