"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import type { Club } from "@/lib/types";

interface ClubContextType {
  clubs: Club[];
  activeClubId: string | null;
  activeClub: Club | null;
  setActiveClubId: (id: string) => void;
  refreshClubs: () => Promise<void>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({
  children,
  initialClubs,
  initialActiveClubId,
}: {
  children: React.ReactNode;
  initialClubs: Club[];
  initialActiveClubId: string | null;
}) {
  const router = useRouter();
  const [clubs, setClubs] = useState<Club[]>(initialClubs);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Use initial active club or fallback to first club
  const defaultClubId = initialActiveClubId || (initialClubs.length > 0 ? initialClubs[0]._id : null);
  const [activeClubId, setActiveClubIdState] = useState<string | null>(defaultClubId);

  // If we had no cookie but we have clubs, set the cookie to the first club
  useEffect(() => {
    if (!initialActiveClubId && initialClubs.length > 0) {
      Cookies.set("reservate_active_club", initialClubs[0]._id, { expires: 365, path: '/' });
    }
  }, [initialActiveClubId, initialClubs]);

  const setActiveClubId = (id: string) => {
    setActiveClubIdState(id);
    Cookies.set("reservate_active_club", id, { expires: 365, path: '/' });
    // Refrescar el servidor para que los Server Components lean la nueva cookie
    router.refresh();
  };

  const refreshClubs = async () => {
    try {
      const { apiFetch } = await import("@/lib/api");
      const res = await apiFetch("/clubs", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setClubs(data);
      }
    } catch (error) {
      console.error("Error refreshing clubs context", error);
    }
  };

  const activeClub = clubs.find((c) => c._id === activeClubId) || null;

  return (
    <ClubContext.Provider
      value={{
        clubs,
        activeClubId,
        activeClub,
        setActiveClubId,
        refreshClubs,
        isSidebarOpen,
        setIsSidebarOpen,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export function useClub() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error("useClub must be used within a ClubProvider");
  }
  return context;
}
