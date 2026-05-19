"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Calendar, Clock, User, MapPin } from "lucide-react";

interface Court {
  _id: string;
  name: string;
  sport: string;
  isCovered?: boolean;
}

const PRESET_TIMES = [
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
  "22:00", "22:30", "23:00"
];

export default function NewReservationButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    playerName: "",
    date: "",
    time: "",
    duration: "1.5",
    courtId: "",
  });

  // Filter start times so bookings don't go past 24:00 (closing hour)
  const filteredTimes = formData.duration === "1.5"
    ? PRESET_TIMES.filter(t => t <= "22:30")
    : PRESET_TIMES;

  useEffect(() => {
    if (isOpen && formData.date && formData.time && formData.duration) {
      setCourtsLoading(true);
      
      const [year, month, day] = formData.date.split('-');
      const [hours, minutes] = formData.time.split(':');
      
      const start = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      const durationMs = parseFloat(formData.duration) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      const url = `http://localhost:3001/courts/available?startTime=${start.toISOString()}&endTime=${end.toISOString()}`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          setCourts(data);
          // If the selected court is no longer available in the new list, clear the selection
          if (formData.courtId && !data.some((c: Court) => c._id === formData.courtId)) {
            setFormData(prev => ({ ...prev, courtId: "" }));
          }
        })
        .catch(err => console.error("Error fetching available courts:", err))
        .finally(() => setCourtsLoading(false));
    } else {
      setCourts([]);
    }
  }, [isOpen, formData.date, formData.time, formData.duration]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const [year, month, day] = formData.date.split('-');
      const [hours, minutes] = formData.time.split(':');
      
      const startTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
      const durationMs = parseFloat(formData.duration) * 60 * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      const payload = {
        userId: formData.playerName,
        courtId: formData.courtId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      };

      const response = await fetch('http://localhost:3001/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsOpen(false);
        setFormData({ playerName: "", date: "", time: "", duration: "1.5", courtId: "" });
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || "Error al crear la reserva";
        alert(`No se pudo crear la reserva: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const isTimeSelectionReady = formData.date && formData.time && formData.duration;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-105 transition-transform"
      >
        + Nueva Reserva
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <div className="w-2 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]"></div>
                Nueva Reserva
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white transition-colors p-1 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre del Jugador
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formData.playerName}
                  onChange={(e) => setFormData({...formData, playerName: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Hora de Inicio
                  </label>
                  <div className="relative">
                    <select 
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    >
                      <option value="" disabled>--:--</option>
                      {filteredTimes.map((t) => (
                        <option key={t} value={t}>{t} hs</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Duración
                  </label>
                  <div className="relative">
                    <select 
                      required
                      value={formData.duration}
                      onChange={(e) => {
                        const newDur = e.target.value;
                        if (newDur === "1.5" && formData.time === "23:00") {
                          setFormData({ ...formData, duration: newDur, time: "" });
                        } else {
                          setFormData({ ...formData, duration: newDur });
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                    >
                      <option value="1">1 hora</option>
                      <option value="1.5">1.5 horas</option>
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Cancha Disponible
                </label>
                <div className="relative">
                  <select 
                    required
                    value={formData.courtId}
                    onChange={(e) => setFormData({...formData, courtId: e.target.value})}
                    disabled={!isTimeSelectionReady || courtsLoading || courts.length === 0}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!isTimeSelectionReady ? (
                      <option value="">Selecciona fecha, hora y duración...</option>
                    ) : courtsLoading ? (
                      <option value="">Buscando canchas libres...</option>
                    ) : courts.length === 0 ? (
                      <option value="">No hay canchas libres en este horario</option>
                    ) : (
                      <>
                        <option value="" disabled>Selecciona una cancha libre</option>
                        {courts.map((court) => (
                          <option key={court._id} value={court._id}>
                            {court.name} ({court.sport}) - {court.isCovered ? 'Techada' : 'Descubierta'}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Info summary */}
              {isTimeSelectionReady && formData.time && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                  <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_5px_rgba(57,255,20,0.8)] flex-shrink-0"></div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    Tu partido será de <strong className="text-white font-semibold">{formData.duration === "1" ? "1:00 hs" : "1:30 hs"}</strong>, comenzando a las <strong className="text-white font-semibold">{formData.time} hs</strong> y finalizando a las <strong className="text-white font-semibold">
                      {(() => {
                        const [h, m] = formData.time.split(':').map(Number);
                        const durMin = parseFloat(formData.duration) * 60;
                        const endMinTotal = h * 60 + m + durMin;
                        const endH = Math.floor(endMinTotal / 60) % 24;
                        const endM = endMinTotal % 60;
                        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                      })()} hs
                    </strong>.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !formData.courtId}
                  className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl shadow-[0_0_20px_rgba(57,255,20,0.2)] hover:shadow-[0_0_25px_rgba(57,255,20,0.4)] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none disabled:-translate-y-0 text-base"
                >
                  {loading ? 'Confirmando...' : 'Confirmar Reserva'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
