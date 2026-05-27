import { Court } from "@/lib/types";
import { Building2, Check, DollarSign, Home, Pencil, Sun, Trash2 } from "lucide-react";

interface CourtCardProps {
  court: Court;
  clubName: string;
  onEdit: (court: Court) => void;
  onDelete: (id: string) => void;
}

export default function CourtCard({ court, clubName, onEdit, onDelete }: CourtCardProps) {
  // Función auxiliar para determinar el diseño según el deporte
  const getSportDesign = (sport: string) => {
    switch (sport) {
      case "padel":
        return {
          bg: "bg-blue-500/20",
          border: "border-blue-500/50",
          accent: "text-blue-400",
          label: "Pádel",
          courtBg: "bg-blue-600/30",
          lines: "border-white/40",
          renderField: () => (
            <div className="absolute inset-0 opacity-30 pointer-events-none flex flex-col p-4">
              {/* Representación de cancha de pádel */}
              <div className="w-full h-full border-2 border-white/50 rounded-sm relative flex flex-col">
                <div className="flex-1 border-b-2 border-white/50 relative">
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-t-2 border-l-2 border-r-2 border-white/50" />
                </div>
                <div className="flex-1 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 border-b-2 border-l-2 border-r-2 border-white/50" />
                </div>
                {/* Red */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] -translate-y-1/2" />
              </div>
            </div>
          ),
        };
      case "tennis":
        return {
          bg: "bg-orange-600/20",
          border: "border-orange-500/50",
          accent: "text-orange-400",
          label: "Tenis",
          courtBg: "bg-orange-700/30",
          lines: "border-white/40",
          renderField: () => (
            <div className="absolute inset-0 opacity-30 pointer-events-none flex flex-col p-3">
              {/* Representación de cancha de tenis */}
              <div className="w-full h-full border-2 border-white/50 relative flex">
                <div className="w-1/6 border-r-2 border-white/50 h-full" />
                <div className="flex-1 flex flex-col relative">
                  <div className="flex-1 border-b-2 border-white/50 relative">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-white/50" />
                  </div>
                  <div className="flex-1 relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[2px] bg-white/50" />
                  </div>
                  {/* Red */}
                  <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white shadow-[0_0_5px_rgba(255,255,255,0.8)] -translate-y-1/2" />
                </div>
                <div className="w-1/6 border-l-2 border-white/50 h-full" />
              </div>
            </div>
          ),
        };
      case "football":
        return {
          bg: "bg-emerald-600/20",
          border: "border-emerald-500/50",
          accent: "text-emerald-400",
          label: "Fútbol",
          courtBg: "bg-emerald-700/30",
          lines: "border-white/40",
          renderField: () => (
            <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-col p-2">
              {/* Representación de cancha de fútbol */}
              <div className="w-full h-full border-2 border-white/50 relative flex flex-col">
                {/* Áreas */}
                <div className="w-1/2 h-1/4 border-b-2 border-l-2 border-r-2 border-white/50 mx-auto" />
                <div className="flex-1 relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <div className="w-1 h-1 rounded-full bg-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <div className="w-full h-[2px] bg-white/50 absolute top-1/2 left-0 -translate-y-1/2" />
                </div>
                <div className="w-1/2 h-1/4 border-t-2 border-l-2 border-r-2 border-white/50 mx-auto" />
              </div>
            </div>
          ),
        };
      case "basketball":
        return {
          bg: "bg-amber-600/20",
          border: "border-amber-500/50",
          accent: "text-amber-400",
          label: "Básquet",
          courtBg: "bg-amber-700/30",
          lines: "border-white/40",
          renderField: () => (
            <div className="absolute inset-0 opacity-20 pointer-events-none flex flex-col p-2">
              {/* Representación de cancha de básquet */}
              <div className="w-full h-full border-2 border-white/50 relative flex flex-col">
                <div className="w-1/2 h-1/3 border-b-2 border-l-2 border-r-2 border-white/50 mx-auto rounded-b-[100px]" />
                <div className="flex-1 relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-white/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  <div className="w-full h-[2px] bg-white/50 absolute top-1/2 left-0 -translate-y-1/2" />
                </div>
                <div className="w-1/2 h-1/3 border-t-2 border-l-2 border-r-2 border-white/50 mx-auto rounded-t-[100px]" />
              </div>
            </div>
          ),
        };
      default:
        return {
          bg: "bg-zinc-800/50",
          border: "border-zinc-700/50",
          accent: "text-zinc-400",
          label: sport,
          courtBg: "bg-zinc-900/50",
          lines: "border-zinc-600/40",
          renderField: () => null,
        };
    }
  };

  const design = getSportDesign(court.sport);

  return (
    <div
      className={`group relative overflow-hidden flex flex-col justify-between min-h-64 rounded-2xl border ${design.border} ${design.courtBg} bg-white/[0.01] backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]`}
    >
      {/* Patrón de fondo (Field) */}
      {design.renderField()}

      <div className="relative z-10 p-5 flex flex-col h-full bg-gradient-to-t from-zinc-950/95 via-zinc-950/50 to-transparent flex-1 justify-between">
        <div>
          <div className="flex justify-between items-start gap-3 mb-2">
            <div className="flex flex-col gap-1 min-w-0">
              <h3 className="text-xl font-bold text-white drop-shadow-md truncate">
                {court.name}
              </h3>
              <span className={`text-xs font-extrabold uppercase tracking-wider ${design.accent} drop-shadow`}>
                {design.label}
              </span>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              {court.isActive ? (
                <span className="flex items-center text-[10px] font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/25 backdrop-blur-md shadow-[0_0_8px_rgba(57,255,20,0.15)]">
                  <Check className="w-2.5 h-2.5 mr-1" /> Activa
                </span>
              ) : (
                <span className="flex items-center text-[10px] font-extrabold text-zinc-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5 backdrop-blur-md">
                  Inactiva
                </span>
              )}

              {court.isCovered ? (
                <span className="flex items-center text-[10px] font-extrabold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-400/25 backdrop-blur-md shadow-[0_0_8px_rgba(56,189,248,0.15)]">
                  <Home className="w-2.5 h-2.5 mr-1" /> Techada
                </span>
              ) : (
                <span className="flex items-center text-[10px] font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/25 backdrop-blur-md shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  <Sun className="w-2.5 h-2.5 mr-1" /> Libre
                </span>
              )}
            </div>
          </div>

          <span className="text-sm text-zinc-200 mt-2 flex items-center gap-1.5 drop-shadow">
            <Building2 className="w-3.5 h-3.5 opacity-80" />
            {clubName || "Club deportivo"}
          </span>
        </div>

        <div className="mt-auto pt-6 flex items-end justify-between">
          <div className="flex items-center gap-1.5 text-zinc-100 bg-white/5 backdrop-blur-md py-1.5 px-3 rounded-xl border border-white/10 w-fit shadow-inner">
            <DollarSign className="w-4 h-4 text-primary drop-shadow-[0_0_4px_rgba(57,255,20,0.4)]" />
            <span className="text-xs font-semibold">
              <strong className="text-white font-extrabold text-sm">
                ${court.pricePerHour?.toLocaleString("es-AR")}
              </strong>{" "}
              / hora
            </span>
          </div>

          <div className="flex justify-end gap-2 transition-opacity duration-200">
            <button
              onClick={() => onEdit(court)}
              className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all backdrop-blur-sm hover:scale-105 duration-200"
              title="Editar cancha"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(court._id)}
              className="p-2 text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-xl border border-white/5 hover:border-red-500/20 transition-all backdrop-blur-sm hover:scale-105 duration-200"
              title="Eliminar cancha"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
