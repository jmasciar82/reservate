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
    <div className="flex items-center gap-4 bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200/80 dark:border-white/5 p-4 rounded-2xl mb-8 shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.15)] relative overflow-hidden transition-colors duration-300">
      {/* Glossy sheen */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent pointer-events-none" />

      <div className="w-full sm:w-56 z-10 relative">
        <label className="text-[10px] font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 drop-shadow">
          <Calendar className="w-3.5 h-3.5 text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]" /> Fecha
        </label>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full bg-zinc-50 hover:bg-zinc-100 border border-zinc-300 rounded-xl py-2.5 px-4 text-zinc-900 dark:bg-white/5 dark:hover:bg-white/[0.08] dark:border-white/10 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 dark:[color-scheme:dark] shadow-inner font-semibold"
        />
      </div>
    </div>
  );
}
