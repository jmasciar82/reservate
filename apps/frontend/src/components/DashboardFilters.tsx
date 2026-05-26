"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar } from "lucide-react";

interface DashboardFiltersProps {
  currentDate: string;
}

export default function DashboardFilters({
  currentDate,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("date", value);
    } else {
      params.delete("date");
    }

    // Keep clubId in the URL if it exists (for multi-club support later)
    const queryString = params.toString();
    router.push(queryString ? `/?${queryString}` : "/");
  };

  return (
    <div className="flex items-center gap-4 bg-zinc-900/30 border border-zinc-800/60 p-4 rounded-lg mb-8">
      <div className="w-full sm:w-56">
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha
        </label>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
        />
      </div>
    </div>
  );
}
