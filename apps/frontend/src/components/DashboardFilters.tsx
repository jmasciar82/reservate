"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Calendar } from "lucide-react";
import type { Club } from "@/lib/types";

interface DashboardFiltersProps {
  clubs: Club[];
  currentClubId: string;
  currentDate: string;
}

export default function DashboardFilters({
  clubs,
  currentClubId,
  currentDate,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-4 bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-lg mb-8">
      <div className="w-full sm:w-56">
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha
        </label>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => handleFilterChange("date", e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
        />
      </div>

      <div className="w-full sm:w-72">
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-primary" /> Club
        </label>
        <select
          value={currentClubId}
          onChange={(e) => handleFilterChange("clubId", e.target.value)}
          disabled={clubs.length === 0}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-60"
        >
          {clubs.length === 0 ? (
            <option value="">Sin clubes cargados</option>
          ) : (
            clubs.map((club) => (
              <option key={club._id} value={club._id}>
                {club.name}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
