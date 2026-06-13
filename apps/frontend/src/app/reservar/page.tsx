"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Calendar, Clock, MapPin, Trophy, User, Mail, Phone, ChevronRight, ChevronLeft, CreditCard, Loader2, Check, Lock } from "lucide-react";
import type { Club, Court } from "@/lib/types";

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30"
];

// Helper para calcular la seña de forma dinámica según las reglas del club
const getDepositAmount = (totalPrice: number, club: Club | null): number => {
  if (!club || !club.depositType || club.depositType === "none") {
    return 0;
  }
  if (club.depositType === "fixed") {
    return club.depositValue !== undefined ? Math.min(club.depositValue, totalPrice) : 0;
  }
  if (club.depositType === "percentage") {
    const percent = club.depositValue !== undefined ? club.depositValue : 30;
    return Math.round((totalPrice * percent) / 100);
  }
  // Default fallback 30%
  return Math.round(totalPrice * 0.3);
};

// Helper para obtener el texto descriptivo de la política de seña
const getDepositDescription = (totalPrice: number, club: Club | null): string => {
  if (!club || !club.depositType || club.depositType === "none") {
    return "Sin seña (Paga en recepción)";
  }
  if (club.depositType === "fixed") {
    return `Seña Fija: $${(club.depositValue || 0).toLocaleString()}`;
  }
  if (club.depositType === "percentage") {
    const percent = club.depositValue !== undefined ? club.depositValue : 30;
    const amount = Math.round((totalPrice * percent) / 100);
    return `Seña del ${percent}% ($${amount.toLocaleString()})`;
  }
  return `Seña del 30% ($${Math.round(totalPrice * 0.3).toLocaleString()})`;
};

const sportLabel = (sport: string): string => {
  const labels: Record<string, string> = {
    padel: "Pádel",
    tennis: "Tenis",
    football: "Fútbol",
    basketball: "Básquet",
    parrilla: "Parrilla",
    quincho: "Quincho",
    escuelita_padel: "Escuelita Pádel",
    escuelita_futbol: "Escuelita Fútbol",
  };
  return labels[sport] ?? sport;
};

export default function PublicBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Datos disponibles
  const [clubs, setClubs] = useState<Club[]>([]);
  const [availableCourts, setAvailableCourts] = useState<Court[]>([]);

  // Selección del usuario
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // en horas
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [isSubdomainActive, setIsSubdomainActive] = useState(false);

  // Datos personales
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Cargar sedes al iniciar
  useEffect(() => {
    async function loadClubs() {
      try {
        setLoading(true);
        // Detectar si estamos en un subdominio/dominio del club
        const host = typeof window !== "undefined" ? window.location.host : "";
        const cleanHost = host.split(":")[0].toLowerCase();
        
        // Determinar si hay subdominio (ej: club.reservate.com o club.localhost)
        const parts = cleanHost.split(".");
        let isSubdomain = false;
        let subdomainName = "";
        
        if (parts.length > 2) {
          subdomainName = parts[0];
          isSubdomain = subdomainName !== "www";
        } else if (parts.length === 2 && parts[1] === "localhost") {
          subdomainName = parts[0];
          isSubdomain = subdomainName !== "www";
        }

        if (isSubdomain) {
          const res = await apiFetch(`/public/clubs/by-domain?hostname=${host}`);
          if (res.ok) {
            const club = await res.json();
            setClubs([club]);
            setSelectedClub(club);
            setSelectedSport((club.sports && club.sports[0]) || "");
            setIsSubdomainActive(true);
            setStep(2); // Ir directo al paso de horarios
            return;
          }
        }

        const res = await apiFetch("/public/clubs");
        if (res.ok) {
          const data = await res.json();
          setClubs(data);
        } else {
          setError("No se pudieron cargar las sedes. Intentá más tarde.");
        }
      } catch (err) {
        console.error(err);
        setError("Error de red al cargar las sedes.");
      } finally {
        setLoading(false);
      }
    }
    loadClubs();

    // Setear fecha de hoy como inicial
    const today = new Date().toISOString().split("T")[0];
    setSelectedDate(today);
  }, []);

  // Buscar canchas cuando cambia la fecha, hora, duración o sede
  useEffect(() => {
    if (selectedClub && selectedSport && selectedDate && selectedTime) {
      loadAvailableCourts();
    }
  }, [selectedClub, selectedSport, selectedDate, selectedTime, selectedDuration]);

  const loadAvailableCourts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00.000-03:00`);
      const endDateTime = new Date(startDateTime.getTime() + selectedDuration * 60 * 60 * 1000);

      const params = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        clubId: selectedClub?._id || "",
      };

      const res = await apiFetch("/public/courts/available", {}, params);
      if (res.ok) {
        const data = await res.json();
        // Filtrar por deporte
        const filtered = data.filter((court: Court) => court.sport === selectedSport);
        setAvailableCourts(filtered);
        setSelectedCourt(null); // Resetear cancha elegida
      } else {
        setError("No se pudo obtener la disponibilidad de canchas.");
      }
    } catch (err) {
      console.error(err);
      setError("Error al buscar disponibilidad de canchas.");
    } finally {
      setLoading(false);
    }
  };

  const handleClubSelect = (club: Club) => {
    setSelectedClub(club);
    setSelectedSport((club.sports && club.sports[0]) || "");
    setStep(2);
  };

  const handleNextStep = () => {
    if (step === 2 && (!selectedDate || !selectedTime)) {
      setError("Por favor seleccioná fecha y hora.");
      return;
    }
    if (step === 3 && !selectedCourt) {
      setError("Por favor seleccioná una cancha.");
      return;
    }
    if (step === 4) {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        setError("Nombre, Apellido y Email son obligatorios.");
        return;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setError("Por favor ingresá un email válido.");
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const handlePrevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  const handleConfirmAndPay = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDateTime = new Date(`${selectedDate}T${selectedTime}:00.000-03:00`);
      const endDateTime = new Date(startDateTime.getTime() + selectedDuration * 60 * 60 * 1000);

      const payload = {
        courtId: selectedCourt?._id || "",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        isPublic: true,
      };

      const res = await apiFetch("/public/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirigir al checkout (Mercado Pago real o pantalla simulada)
        if (data.initPoint) {
          router.push(data.initPoint);
        } else {
          setError("Error: No se recibió la pasarela de pago.");
        }
      } else {
        const errData = await res.json();
        setError(errData.message || "Error al registrar la reserva. Verificá los datos.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al procesar la reserva.");
    } finally {
      setLoading(false);
    }
  };

  // Generar próximos 7 días
  const getNextDays = () => {
    const days = [];
    const weekdayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      days.push({
        iso,
        dayNum: d.getDate(),
        dayName: weekdayNames[d.getDay()],
        isToday: i === 0,
      });
    }
    return days;
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col font-sans overflow-y-auto">
      {/* Header Público */}
      <header className="border-b border-[#27272a] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img
            src="/logo.jpg"
            alt="Reservate Logo"
            className="h-8 w-8 object-cover rounded-lg border border-primary/20 shadow-[0_0_10px_rgba(57,255,20,0.3)]"
          />
          <span className="text-xl font-bold tracking-tight text-white">
            Reservate<span className="text-primary font-extrabold">.</span>
          </span>
        </div>
        <div className="text-xs text-[#a1a1aa] bg-[#18181b] px-3 py-1 rounded-full border border-[#27272a]">
          Reserva al Instante
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col">
        {/* Progress bar */}
        {step > 1 && (
          <div className="w-full mb-8">
            <div className="flex justify-between text-xs text-[#a1a1aa] mb-2 px-1">
              <span className={step >= 2 ? "text-primary font-semibold" : ""}>Horario</span>
              <span className={step >= 3 ? "text-primary font-semibold" : ""}>Cancha</span>
              <span className={step >= 4 ? "text-primary font-semibold" : ""}>Datos</span>
              <span className={step >= 5 ? "text-primary font-semibold" : ""}>Pago</span>
            </div>
            <div className="h-1.5 w-full bg-[#27272a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary shadow-[0_0_10px_rgba(57,255,20,0.6)] transition-all duration-300"
                style={{ width: `${((step - 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            {error}
          </div>
        )}

        {/* STEP 1: Seleccionar Club */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center py-4">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
                Reservá tu cancha en segundos
              </h1>
              <p className="text-[#a1a1aa] max-w-md mx-auto text-sm md:text-base">
                Elegí una de nuestras sedes deportivas exclusivas para ver la disponibilidad y reservar sin tener que registrarte.
              </p>
            </div>

            {loading && clubs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs text-[#a1a1aa]">Cargando sedes disponibles...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clubs.map((club) => (
                  <div
                    key={club._id}
                    onClick={() => handleClubSelect(club)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#27272a] bg-[#18181b]/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/50 hover:bg-[#18181b] hover:shadow-[0_0_30px_rgba(57,255,20,0.05)]"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full group-hover:bg-primary group-hover:text-[#09090b] transition-colors duration-300">
                        Seleccionar
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary transition-colors duration-300">
                      {club.name}
                    </h3>
                    <p className="text-sm text-[#a1a1aa] flex items-center gap-1.5 mb-4">
                      <MapPin className="h-4 w-4 text-[#71717a]" />
                      {club.location}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap border-t border-[#27272a] pt-4 mt-2">
                      {(club.sports || []).map((sp) => (
                        <span key={sp} className="text-xs px-2 py-0.5 rounded bg-[#27272a] text-[#d4d4d8] capitalize">
                          {sp}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Deporte, Fecha y Hora */}
        {step === 2 && selectedClub && (
          <div className="flex-grow flex flex-col gap-6">
            <div>
              {!isSubdomainActive && (
                <button onClick={() => setStep(1)} className="text-xs text-[#a1a1aa] hover:text-primary flex items-center gap-1 mb-2">
                  <ChevronLeft className="h-3 w-3" /> Volver a Sedes
                </button>
              )}
              <h2 className="text-2xl font-bold text-white">Elegí fecha y horario en {selectedClub.name}</h2>
            </div>

            {/* Selección de Deporte */}
            <div className="bg-[#18181b]/40 border border-[#27272a] p-4 rounded-xl">
              <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-2">Deporte</label>
              <div className="flex gap-3">
                {(selectedClub.sports || []).map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize border transition-all ${
                      selectedSport === sport
                        ? "bg-primary border-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                        : "bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                    }`}
                  >
                    {sportLabel(sport)}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de Fecha */}
            <div className="bg-[#18181b]/40 border border-[#27272a] p-4 rounded-xl">
              <label className="block text-xs font-bold text-[#a1a1aa] uppercase tracking-wider mb-3">Fecha de la Reserva</label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {getNextDays().map((day) => (
                  <button
                    key={day.iso}
                    onClick={() => setSelectedDate(day.iso)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                      selectedDate === day.iso
                        ? "bg-primary border-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                        : "bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{day.dayName}</span>
                    <span className="text-lg font-extrabold mt-0.5">{day.dayNum}</span>
                    {day.isToday && <span className="text-[8px] mt-0.5 font-bold uppercase tracking-wider opacity-85">Hoy</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de Hora y Duración */}
            <div className="bg-[#18181b]/40 border border-[#27272a] p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Hora de Inicio</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#a1a1aa]">Duración:</span>
                  <select
                    value={selectedDuration}
                    onChange={(e) => setSelectedDuration(parseFloat(e.target.value))}
                    className="bg-[#09090b] border border-[#27272a] text-sm text-[#fafafa] rounded-md px-2 py-1 focus:outline-none focus:border-primary"
                  >
                    <option value={1}>1 Hora</option>
                    <option value={1.5}>1.5 Horas</option>
                    <option value={2}>2 Horas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      selectedTime === time
                        ? "bg-primary border-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                        : "bg-[#09090b] border-[#27272a] text-[#a1a1aa] hover:border-[#3f3f46]"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 opacity-80" />
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegación */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:bg-[#18181b] flex items-center gap-1 text-sm font-semibold transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedDate || !selectedTime}
                className="px-6 py-2.5 rounded-xl bg-primary text-[#09090b] shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-50 hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] flex items-center gap-1 text-sm font-bold transition-all ml-auto"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Elegir Cancha */}
        {step === 3 && selectedClub && (
          <div className="flex-grow flex flex-col gap-6">
            <div>
              <button onClick={() => setStep(2)} className="text-xs text-[#a1a1aa] hover:text-primary flex items-center gap-1 mb-2">
                <ChevronLeft className="h-3 w-3" /> Volver a Horarios
              </button>
              <h2 className="text-2xl font-bold text-white">Seleccioná una cancha disponible</h2>
              <p className="text-xs text-[#a1a1aa] mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {selectedDate} a las {selectedTime} ({selectedDuration} {selectedDuration === 1 ? "hora" : "horas"})
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-xs text-[#a1a1aa]">Buscando canchas libres en este horario...</p>
              </div>
            ) : availableCourts.length === 0 ? (
              <div className="bg-[#18181b]/50 border border-[#27272a] rounded-2xl p-12 text-center flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">No hay canchas disponibles</h3>
                <p className="text-xs text-[#a1a1aa] max-w-sm">
                  Lamentablemente no quedan canchas libres de **{sportLabel(selectedSport)}** para el horario seleccionado. Intentá con otra hora u otro día.
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-2 text-xs font-bold text-primary hover:underline"
                >
                  Cambiar Horario
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {availableCourts.map((court) => {
                  const totalPrice = Math.round(selectedDuration * court.pricePerHour);
                  const depositAmount = getDepositAmount(totalPrice, selectedClub);
                  const isAvailable = court.isAvailable !== false;
                  const isSelected = selectedCourt?._id === court._id;

                  // Color del césped según deporte
                  // Azul para pádel, verde para tenis/otros
                  const isPadel = court.sport.toLowerCase().includes("padel") || court.sport.toLowerCase().includes("pádel");
                  const turfGradient = !isAvailable
                    ? "from-[#1a1212] to-[#120a0a]"
                    : isSelected
                      ? isPadel
                        ? "from-[#082f49] to-[#0c4a6e]" // azul padel seleccionado
                        : "from-[#052e16] to-[#064e3b]" // verde tenis seleccionado
                      : isPadel
                        ? "from-[#071f30] to-[#0b2b40]" // azul padel hover/idle
                        : "from-[#052010] to-[#0a3520]"; // verde tenis hover/idle

                  const borderStyle = !isAvailable
                    ? "border-red-950/40 opacity-70 cursor-not-allowed"
                    : isSelected
                      ? "border-primary shadow-[0_0_25px_rgba(57,255,20,0.25)] ring-2 ring-primary/45 scale-[1.01]"
                      : "border-[#27272a] hover:border-zinc-500 hover:shadow-[0_0_15px_rgba(255,255,255,0.02)]";

                  return (
                    <div
                      key={court._id}
                      onClick={() => isAvailable && setSelectedCourt(court)}
                      className={`relative aspect-[16/10] w-full rounded-2xl border p-4 bg-[#121214] overflow-hidden transition-all duration-300 select-none cursor-pointer flex flex-col justify-between group ${borderStyle}`}
                    >
                      {/* Dibujo de la Cancha de Deporte en el Fondo */}
                      <div className={`absolute inset-3 rounded-xl bg-gradient-to-br border border-white/5 overflow-hidden transition-all duration-300 ${turfGradient}`}>
                        {/* Líneas de juego realistas */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-300">
                          {/* Línea perimetral doble (pasillo) */}
                          <div className="absolute inset-x-[6%] inset-y-[8%] border border-white" />
                          
                          {/* Líneas de singles/dobles (carriles) */}
                          <div className="absolute inset-x-[6%] top-[16%] bottom-[16%] border-t border-b border-white" />
                          
                          {/* Líneas de servicio (línea de saque) */}
                          <div className="absolute inset-y-[8%] left-[23%] right-[23%] border-l border-r border-white" />
                          
                          {/* Línea central de servicio */}
                          <div className="absolute left-[23%] right-[23%] top-1/2 -translate-y-1/2 border-t border-white" />
                          
                          {/* Red del medio (Línea de red punteada/discontinua) */}
                          <div className="absolute top-[8%] bottom-[8%] left-1/2 -translate-x-1/2 border-l-2 border-dashed border-white/60" />
                          
                          {/* Postes de la red */}
                          <div className="absolute top-[6%] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-300 shadow-[0_0_4px_white]" />
                          <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-zinc-300 shadow-[0_0_4px_white]" />
                        </div>

                        {/* Patrón de Techo para Canchas Techadas o Efecto de Sol para Descubiertas */}
                        {isAvailable && court.isCovered ? (
                          <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.015)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.015)_50%,rgba(255,255,255,0.015)_75%,transparent_75%,transparent)] bg-[length:35px_35px] opacity-75 pointer-events-none animate-fade-in" />
                        ) : isAvailable ? (
                          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-yellow-500/5 blur-3xl pointer-events-none" />
                        ) : null}

                        {/* Overlay para Canchas Ocupadas */}
                        {!isAvailable && (
                          <div className="absolute inset-0 bg-[#09090b]/85 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-10">
                            <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                              <Lock className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-extrabold px-3 py-1 rounded bg-red-500/20 border border-red-500/40 text-red-400 uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.1)]">
                              Ocupada
                            </span>
                          </div>
                        )}

                        {/* Badge de Selección (Check) */}
                        {isAvailable && isSelected && (
                          <div className="absolute top-3 right-3 bg-primary text-[#09090b] rounded-full p-1 shadow-[0_0_15px_#39ff14] z-20">
                            <Check className="h-4 w-4 stroke-[3]" />
                          </div>
                        )}
                        
                        {/* Contenido Superior: Nombre de Cancha y Badges Prominentes sin Solapamiento */}
                        <div className="absolute top-3 inset-x-3 flex justify-between items-start z-10 px-1">
                          <div className="flex flex-col gap-1 max-w-[75%]">
                            <span className={`text-base font-black tracking-tight leading-tight transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${
                              !isAvailable ? "text-zinc-500" : "text-white group-hover:text-primary"
                            }`}>
                              {court.name}
                            </span>
                            
                            <div className="flex flex-wrap gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                !isAvailable
                                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700/30"
                                  : court.isCovered
                                    ? "bg-amber-500/20 border border-amber-500/35 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                                    : "bg-sky-500/20 border border-sky-500/35 text-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                              }`}>
                                {court.isCovered ? "🏠 Techada (Indoor)" : "☀️ Al Aire Libre (Outdoor)"}
                              </span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full capitalize border border-white/5 bg-[#121214]/90 ${
                                !isAvailable ? "text-zinc-600" : "text-primary"
                              }`}>
                                {court.sport}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contenido Inferior: Precios y Señas */}
                        <div className="absolute bottom-3 inset-x-3 z-10 bg-[#121214]/85 border border-white/5 backdrop-blur-md rounded-xl p-2.5 flex justify-between items-center transition-all duration-300 group-hover:bg-[#121214]/95">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-[#a1a1aa] uppercase tracking-wider font-bold">Total ({selectedDuration}h)</span>
                            <span className="text-sm font-black text-white">${totalPrice.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-[#a1a1aa] uppercase tracking-wider font-bold">Seña Requerida</span>
                            <span className={`text-sm font-black ${!isAvailable ? "text-zinc-500" : "text-primary drop-shadow-[0_0_8px_rgba(57,255,20,0.15)]"}`}>
                              {depositAmount === 0 ? "Sin Seña" : `$${depositAmount.toLocaleString()}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navegación */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:bg-[#18181b] flex items-center gap-1 text-sm font-semibold transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </button>
              <button
                onClick={handleNextStep}
                disabled={!selectedCourt}
                className="px-6 py-2.5 rounded-xl bg-primary text-[#09090b] shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-50 hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] flex items-center gap-1 text-sm font-bold transition-all ml-auto"
              >
                Siguiente <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Datos del Cliente */}
        {step === 4 && selectedCourt && (
          <div className="flex-grow flex flex-col gap-6">
            <div>
              <button onClick={() => setStep(3)} className="text-xs text-[#a1a1aa] hover:text-primary flex items-center gap-1 mb-2">
                <ChevronLeft className="h-3 w-3" /> Volver a Canchas
              </button>
              <h2 className="text-2xl font-bold text-white">Completá tus datos para la reserva</h2>
              <p className="text-xs text-[#a1a1aa] mt-1">
                No requerimos contraseña ni registro. Solo necesitamos tu información básica de contacto para enviarte el comprobante de reserva y el link de Mercado Pago.
              </p>
            </div>

            <div className="bg-[#18181b]/50 border border-[#27272a] rounded-2xl p-6 md:p-8 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Nombre</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                    <input
                      type="text"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(57,255,20,0.08)] transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Apellido</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                    <input
                      type="text"
                      placeholder="Pérez"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(57,255,20,0.08)] transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                  <input
                    type="email"
                    placeholder="juan.perez@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(57,255,20,0.08)] transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">Teléfono de Contacto (Celular)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71717a]" />
                  <input
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#09090b] border border-[#27272a] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[#fafafa] placeholder-[#52525b] focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(57,255,20,0.08)] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Navegación */}
            <div className="flex justify-between mt-4">
              <button
                onClick={handlePrevStep}
                className="px-5 py-2.5 rounded-xl border border-[#27272a] text-[#a1a1aa] hover:bg-[#18181b] flex items-center gap-1 text-sm font-semibold transition-all"
              >
                <ChevronLeft className="h-4 w-4" /> Volver
              </button>
              <button
                onClick={handleNextStep}
                disabled={!formData.firstName || !formData.lastName || !formData.email}
                className="px-6 py-2.5 rounded-xl bg-primary text-[#09090b] shadow-[0_0_20px_rgba(57,255,20,0.3)] disabled:opacity-50 hover:shadow-[0_0_25px_rgba(57,255,20,0.5)] flex items-center gap-1 text-sm font-bold transition-all ml-auto"
              >
                Resumen de Reserva <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Resumen y Pago */}
        {step === 5 && selectedClub && selectedCourt && (
          <div className="flex-grow flex flex-col gap-6">
            <div>
              <button onClick={() => setStep(4)} className="text-xs text-[#a1a1aa] hover:text-primary flex items-center gap-1 mb-2">
                <ChevronLeft className="h-3 w-3" /> Volver a Mis Datos
              </button>
              <h2 className="text-2xl font-bold text-white">Revisá tu reserva antes de pagar</h2>
              <p className="text-xs text-[#a1a1aa] mt-1">
                Confirmá que todos los datos sean correctos. Serás redirigido a la pasarela segura para pagar la seña y bloquear la cancha en el sistema de inmediato.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Resumen Detallado */}
              <div className="md:col-span-2 flex flex-col gap-4">
                {/* Detalles de Reserva */}
                <div className="bg-[#18181b]/50 border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-[#fafafa] border-b border-[#27272a] pb-2">Detalles del Turno</h3>
                  
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-[#a1a1aa]">Sede</span>
                      <span className="font-semibold text-white">{selectedClub.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#a1a1aa]">Cancha</span>
                      <span className="font-semibold text-white">{selectedCourt.name}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#a1a1aa]">Fecha</span>
                      <span className="font-semibold text-white">{selectedDate}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#a1a1aa]">Horario</span>
                      <span className="font-semibold text-white">
                        {selectedTime} ({selectedDuration} {selectedDuration === 1 ? "hora" : "horas"})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detalles del Cliente */}
                <div className="bg-[#18181b]/50 border border-[#27272a] rounded-2xl p-5 flex flex-col gap-4">
                  <h3 className="text-sm font-bold text-[#fafafa] border-b border-[#27272a] pb-2">Tus Datos de Contacto</h3>
                  
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="flex flex-col col-span-2 sm:col-span-1">
                      <span className="text-xs text-[#a1a1aa]">Nombre Completo</span>
                      <span className="font-semibold text-white">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex flex-col col-span-2 sm:col-span-1">
                      <span className="text-xs text-[#a1a1aa]">Correo Electrónico</span>
                      <span className="font-semibold text-white truncate">{formData.email}</span>
                    </div>
                    {formData.phone && (
                      <div className="flex flex-col">
                        <span className="text-xs text-[#a1a1aa]">Teléfono</span>
                        <span className="font-semibold text-white">{formData.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tarjeta de Cobro */}
              <div className="bg-gradient-to-b from-[#1c1c22] to-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Resumen del Pago</h3>
                  <p className="text-xs text-[#a1a1aa] mb-6">
                    {getDepositAmount(selectedDuration * selectedCourt.pricePerHour, selectedClub) > 0
                      ? "Para confirmar este turno es obligatorio abonar la seña requerida."
                      : "Confirmá tu turno de forma directa y sin cargo adicional de seña."}
                  </p>

                  <div className="flex flex-col gap-2.5 text-sm border-t border-[#27272a] pt-4 mb-6">
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>Alquiler Cancha:</span>
                      <span>${(selectedDuration * selectedCourt.pricePerHour).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#a1a1aa]">
                      <span>Tasa de Reserva:</span>
                      <span>Gratis</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-base border-t border-[#27272a]/60 pt-3 mt-1">
                      <span>Total General:</span>
                      <span>${(selectedDuration * selectedCourt.pricePerHour).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <div className="bg-primary/5 border border-primary/25 rounded-xl p-3 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-0.5">
                      {getDepositAmount(selectedDuration * selectedCourt.pricePerHour, selectedClub) > 0 ? "Seña a Pagar Ahora" : "Confirmación Directa"}
                    </span>
                    <span className="text-2xl font-extrabold text-primary">
                      {getDepositAmount(selectedDuration * selectedCourt.pricePerHour, selectedClub) > 0
                        ? `$${getDepositAmount(selectedDuration * selectedCourt.pricePerHour, selectedClub).toLocaleString()}`
                        : "Gratis"}
                    </span>
                    <span className="text-[10px] text-[#a1a1aa] block mt-1">
                      {getDepositAmount(selectedDuration * selectedCourt.pricePerHour, selectedClub) > 0
                        ? "Saldo restante se abona en el club"
                        : "El total del alquiler se abona en recepción"}
                    </span>
                  </div>

                  <button
                    onClick={handleConfirmAndPay}
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-primary text-[#09090b] font-bold shadow-[0_0_25px_rgba(57,255,20,0.3)] hover:shadow-[0_0_35px_rgba(57,255,20,0.5)] active:scale-98 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-[#09090b]" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        {getDepositAmount(selectedDuration * selectedCourt.pricePerHour, selectedClub) > 0
                          ? "Pagar Seña con Mercado Pago"
                          : "Confirmar Reserva"}
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272a] bg-[#09090b] py-6 text-center text-xs text-[#52525b] mt-auto">
        <p>© 2026 Reservate. Todos los derechos reservados. Sistema de pagos operado de forma segura por Mercado Pago.</p>
      </footer>
    </div>
  );
}
