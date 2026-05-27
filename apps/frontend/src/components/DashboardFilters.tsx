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
    <div className="flex items-center gap-4 bg-white/[0.02] backdrop-blur-md border border-white/5 p-4 rounded-2xl mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_0_rgba(0,0,0,0.15)] relative overflow-hidden">
      {/* Glossy sheen */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent pointer-events-none" />

      <div className="w-full sm:w-56 z-10 relative">
        <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 drop-shadow">
          <Calendar className="w-3.5 h-3.5 text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.4)]" /> Fecha
        </label>
        <input
          type="date"
          value={currentDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-300 [color-scheme:dark] shadow-inner font-semibold"
        />
      </div>
    </div>
  );
}
