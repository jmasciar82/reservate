"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, User, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Court } from "@/lib/types";

const PRESET_TIMES = [
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

interface NewReservationButtonProps {
  activeClubId: string;
  defaultDate: string;
  presetCourtId?: string;
  presetTime?: string;
  presetDate?: string;
  children?: React.ReactNode;
}

export default function NewReservationButton({
  activeClubId,
  defaultDate,
  presetCourtId,
  presetTime,
  presetDate,
  children,
}: NewReservationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    playerName: "",
    date: defaultDate,
    time: "",
    duration: "1.5",
    courtId: "",
    isRecurring: false,
    recurrenceWeeks: 4,
  });

  const handleOpen = () => {
    setFormData({
      playerName: "",
      date: presetDate || defaultDate || formData.date,
      time: presetTime || "",
      duration: "1.5",
      courtId: presetCourtId || "",
      isRecurring: false,
      recurrenceWeeks: 4,
    });
    setIsOpen(true);
  };

  const filteredTimes =
    formData.duration === "1.5"
      ? PRESET_TIMES.filter((time) => time <= "22:30")
      : PRESET_TIMES;
  const isTimeSelectionReady =
    Boolean(formData.date) && Boolean(formData.time) && Boolean(formData.duration);

  useEffect(() => {
    const shouldLoadCourts = isOpen && isTimeSelectionReady && activeClubId;
    const controller = new AbortController();

    if (!shouldLoadCourts) {
      void Promise.resolve().then(() => {
        setCourts([]);
        setCourtsLoading(false);
      });
      return () => controller.abort();
    }

    void Promise.resolve().then(async () => {
      setCourtsLoading(true);

      const [year, month, day] = formData.date.split("-");
      const [hours, minutes] = formData.time.split(":");
      const start = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
      );
      const durationMs = Number(formData.duration) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      try {
        const response = await apiFetch(
          "/courts/available",
          { signal: controller.signal },
          {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            clubId: activeClubId,
          }
        );

        if (!response.ok) {
          setCourts([]);
          return;
        }

        const data = (await response.json()) as Court[];
        setCourts(data);

        if (
          formData.courtId &&
          !data.some((court) => court._id === formData.courtId)
        ) {
          setFormData((prev) => ({ ...prev, courtId: "" }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching available courts:", error);
          setCourts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCourtsLoading(false);
        }
      }
    });

    return () => controller.abort();
  }, [
    activeClubId,
    formData.courtId,
    formData.date,
    formData.duration,
    formData.time,
    isOpen,
    isTimeSelectionReady,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [year, month, day] = formData.date.split("-");
      const [hours, minutes] = formData.time.split(":");
      const startTime = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hours),
        Number(minutes),
      );
      const durationMs = Number(formData.duration) * 60 * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      const response = await apiFetch("/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: formData.playerName,
          courtId: formData.courtId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          isRecurring: formData.isRecurring,
          recurrenceWeeks: formData.isRecurring ? Number(formData.recurrenceWeeks) : undefined,
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        setFormData({
          playerName: "",
          date: defaultDate,
          time: "",
          duration: "1.5",
          courtId: "",
          isRecurring: false,
          recurrenceWeeks: 4,
        });
        router.refresh();
      } else {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        alert(`No se pudo crear la reserva: ${errorData.message ?? "Error"}`);
      }
    } catch (error) {
      console.error("Error submitting reservation:", error);
      alert("No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children ? (
        <div onClick={handleOpen}>
          {children}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          disabled={!activeClubId}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          + Nueva reserva
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Nueva reserva
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre del jugador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formData.playerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      playerName: e.target.value,
                    }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Inicio
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="" disabled>
                      --:--
                    </option>
                    {filteredTimes.map((time) => (
                      <option key={time} value={time}>
                        {time} hs
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Duración
                  </label>
                  <select
                    required
                    value={formData.duration}
                    onChange={(e) => {
                      const nextDuration = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        duration: nextDuration,
                        time:
                          nextDuration === "1.5" && prev.time === "23:00"
                            ? ""
                            : prev.time,
                      }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="1">1 hora</option>
                    <option value="1.5">1.5 horas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Cancha disponible
                </label>
                <select
                  required
                  value={formData.courtId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      courtId: e.target.value,
                    }))
                  }
                  disabled={!isTimeSelectionReady || courtsLoading || courts.length === 0}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isTimeSelectionReady ? (
                    <option value="">Seleccioná fecha, hora y duración</option>
                  ) : courtsLoading ? (
                    <option value="">Buscando canchas libres...</option>
                  ) : courts.length === 0 ? (
                    <option value="">No hay canchas libres en este horario</option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Seleccioná una cancha libre
                      </option>
                      {courts.map((court) => (
                        <option key={court._id} value={court._id}>
                          {court.name} ({court.sport}) -{" "}
                          {court.isCovered ? "Techada" : "Descubierta"}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Turno Recurrente */}
              <div className="space-y-3 bg-zinc-950/40 border border-zinc-800/60 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
                    <span className="text-indigo-400">🔁</span> Turno Fijo Recurrente
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isRecurring: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white peer-checked:after:border-indigo-600"></div>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-900/60 animate-in fade-in slide-in-from-top-1 duration-150">
                    <label className="text-xs font-semibold text-zinc-400">
                      Semanas de repetición (Duración)
                    </label>
                    <select
                      value={formData.recurrenceWeeks}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurrenceWeeks: Number(e.target.value),
                        }))
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                    >
                      <option value="4">4 semanas (1 mes)</option>
                      <option value="8">8 semanas (2 meses)</option>
                      <option value="12">12 semanas (3 meses)</option>
                      <option value="24">24 semanas (6 meses)</option>
                    </select>
                    <p className="text-[10px] text-zinc-500 italic mt-1 leading-relaxed">
                      El sistema bloqueará el mismo día y horario durante la cantidad de semanas indicada, validando solapamientos.
                    </p>
                  </div>
                )}
              </div>

              {isTimeSelectionReady && formData.time && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(57,255,20,0.8)] flex-shrink-0" />
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    El turno dura{" "}
                    <strong className="text-white font-semibold">
                      {formData.duration === "1" ? "1:00 hs" : "1:30 hs"}
                    </strong>
                    , empieza a las{" "}
                    <strong className="text-white font-semibold">
                      {formData.time} hs
                    </strong>{" "}
                    y termina a las{" "}
                    <strong className="text-white font-semibold">
                      {(() => {
                        const [h, m] = formData.time.split(":").map(Number);
                        const durationMinutes = Number(formData.duration) * 60;
                        const endTotal = h * 60 + m + durationMinutes;
                        const endHour = Math.floor(endTotal / 60) % 24;
                        const endMinute = endTotal % 60;
                        return `${String(endHour).padStart(2, "0")}:${String(
                          endMinute,
                        ).padStart(2, "0")}`;
                      })()}{" "}
                      hs
                    </strong>
                    .
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.courtId}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-[0_0_20px_rgba(57,255,20,0.2)] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:-translate-y-0 text-base"
              >
                {loading ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
