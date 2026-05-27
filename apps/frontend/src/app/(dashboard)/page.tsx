import { CalendarDays, Plus, Clock, Sparkles } from "lucide-react";
import NewReservationButton from "@/components/NewReservationButton";
import ReservationActions from "@/components/ReservationActions";
import DashboardFilters from "@/components/DashboardFilters";
import { apiUrl, apiFetch } from "@/lib/api";
import { cookies } from "next/headers";
import type { Club, Reservation, Court } from "@/lib/types";
import Link from "next/link";

function courtSportEmoji(sport: string) {
  const emojis: Record<string, string> = {
    tennis: "🎾",
    padel: "🎾",
    football: "⚽",
    basketball: "🏀",
  };
  return emojis[sport] ?? "🏆";
}

type DashboardSearchParams = Promise<{
  date?: string | string[];
  view?: string | string[];
}>;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function todayInArgentina() {
  const now = new Date();
  const art = new Date(now.getTime() - 3 * 3600 * 1000);
  const yyyy = art.getUTCFullYear();
  const mm = String(art.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(art.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getArtTime(dateInput: Date | string) {
  const d = new Date(dateInput);
  const art = new Date(d.getTime() - 3 * 3600 * 1000);
  return {
    year: art.getUTCFullYear(),
    month: art.getUTCMonth() + 1,
    day: art.getUTCDate(),
    hour: art.getUTCHours(),
    minute: art.getUTCMinutes(),
  };
}

function formatArtTimeStr(dateInput: Date | string) {
  const { hour, minute } = getArtTime(dateInput);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatArtDateStr(dateInput: Date | string) {
  const { day, month } = getArtTime(dateInput);
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`;
}

async function getJson<T>(
  path: string, 
  fallback: T, 
  params?: Record<string, string | number | boolean | null | undefined>
): Promise<T> {
  try {
    const res = await apiFetch(path, { cache: "no-store" }, params);
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return fallback;
  }
}

async function getReservations(date: string, clubId?: string) {
  return getJson<Reservation[]>("/reservations", [], { date, clubId });
}

async function getClubs() {
  return getJson<Club[]>("/clubs", []);
}

async function getCourts() {
  return getJson<Court[]>("/courts", []);
}

function statusLabel(status: Reservation["status"]) {
  const labels: Record<Reservation["status"], string> = {
    pending: "POR CONFIRMAR",
    confirmed: "CONFIRMADA",
    cancelled: "CANCELADA",
    completed: "COMPLETADA",
  };

  return labels[status] ?? status.toUpperCase();
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: DashboardSearchParams;
}) {
  const params = await searchParams;
  const date = firstParam(params.date) || todayInArgentina();
  const view = firstParam(params.view) || "scheduler";

  const clubs = await getClubs();
  const cookieStore = await cookies();
  const activeCookie = cookieStore.get("reservate_active_club")?.value;
  
  const activeClub = clubs.find(c => c._id === activeCookie) ?? clubs[0] ?? null;
  const activeClubId = activeClub?._id ?? "";
  const activeClubName = activeClub?.name ?? "tu sede";

  const reservations = await getReservations(date, activeClubId || undefined);
  const courts = await getCourts();
  const clubCourts = courts.filter((court) => court.clubId === activeClubId);
  const activeClubCourts = clubCourts.filter((court) => court.isActive !== false);

  // Filtrar de forma explícita las reservas para que solo correspondan a la sede activa
  const clubReservations = reservations.filter(
    (r) => r.courtId && String(r.courtId.clubId) === String(activeClubId)
  );

  const activeReservations = clubReservations.filter(
    (reservation) => reservation.status !== "cancelled",
  );
  const occupiedCourtIds = new Set(
    activeReservations
      .map((reservation) => reservation.courtId?._id)
      .filter(Boolean),
  );
  
  const totalCourtsCount = activeClubCourts.length;
  const occupiedCourtsCount = occupiedCourtIds.size;
  const occupancyPercent =
    totalCourtsCount > 0
      ? `${Math.round((occupiedCourtsCount / totalCourtsCount) * 100)}%`
      : "0%";
  const totalRevenue = clubReservations
    .filter(
      (reservation) =>
        reservation.paymentStatus === "paid" &&
        reservation.status !== "cancelled",
    )
    .reduce((sum, reservation) => sum + (reservation.totalPrice || 0), 0);
  const revenueStat = `$${totalRevenue.toLocaleString("es-AR")}`;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel general</h1>
          <p className="text-zinc-400">
            Resumen operativo de todas las sedes para la fecha seleccionada.
          </p>
        </div>
        <NewReservationButton activeClubId={activeClubId} defaultDate={date} />
      </div>

      <DashboardFilters currentDate={date} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Reservas",
            value: clubReservations.length.toString(),
            trend: "Fecha elegida",
            color: "text-primary",
          },
          {
            label: "Canchas ocupadas",
            value: `${occupiedCourtsCount}/${totalCourtsCount}`,
            trend: occupancyPercent,
            color: "text-white",
          },
          {
            label: "Ingresos cobrados",
            value: revenueStat,
            trend: "Pagos confirmados",
            color: "text-zinc-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="relative group overflow-hidden bg-white/[0.02] backdrop-blur-md border border-white/5 hover:border-primary/30 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(57,255,20,0.05)] hover:scale-[1.02]">
            {/* Ambient hover glow inside the card */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <p className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider mb-2">{stat.label}</p>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-3xl font-black tracking-tight ${stat.color} drop-shadow`}>{stat.value}</h3>
                <span className="text-[10px] text-primary font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shadow-[0_0_8px_rgba(57,255,20,0.1)]">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.015] border border-white/5 rounded-2xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.25)] relative overflow-hidden">
        {/* Subtle interior glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5 relative z-10">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2 text-white tracking-wide">
              <span className="w-2.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
              Reservas del día
            </h2>
            <p className="text-[11px] font-medium text-zinc-400 mt-1">Organización y control de turnos en tiempo real</p>
          </div>
          
          <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 w-fit backdrop-blur-md shadow-inner">
            <Link
              href={`?date=${date}&view=scheduler`}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all duration-300 ${
                view === "scheduler"
                  ? "bg-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Vista Agenda (Calendario)
            </Link>
            <Link
              href={`?date=${date}&view=list`}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all duration-300 ${
                view === "list"
                  ? "bg-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Vista Lista (Detallada)
            </Link>
          </div>
        </div>

        {view === "scheduler" ? (
          /* VISTA AGENDA - SCHEDULER GRID */
          activeClubCourts.length === 0 ? (
            <div className="text-center py-16 text-zinc-400 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No hay canchas creadas en esta sede para mostrar la grilla diaria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full border border-white/5 rounded-2xl bg-white/[0.01] shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid border-b border-white/5 relative z-10" style={{ gridTemplateColumns: `100px repeat(${activeClubCourts.length}, minmax(180px, 1fr))` }}>
                  <div className="flex items-center justify-center font-extrabold text-xs uppercase tracking-wider text-zinc-400 bg-white/5 border-r border-white/5 p-3 backdrop-blur-md">
                    Horario
                  </div>
                  {activeClubCourts.map((court) => (
                    <div key={court._id} className="text-center p-3 border-r border-white/5 bg-white/[0.02] flex flex-col items-center justify-center backdrop-blur-md last:border-r-0">
                      <p className="font-black text-sm text-white tracking-wide">{court.name}</p>
                      <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[9px] font-extrabold text-primary uppercase tracking-wider shadow-[0_0_8px_rgba(57,255,20,0.15)]">
                        {court.sport} • {court.isCovered ? "Techada" : "Descubierta"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grid Rows */}
                {(() => {
                  const timeSlots = [];
                  for (let h = 8; h <= 22; h++) {
                    timeSlots.push({ hour: h, minute: 0, label: `${String(h).padStart(2, "0")}:00` });
                    if (h < 22) {
                      timeSlots.push({ hour: h, minute: 30, label: `${String(h).padStart(2, "0")}:30` });
                    }
                  }
                  return timeSlots;
                })().map((slot) => (
                  <div
                    key={slot.label}
                    className="grid hover:bg-white/[0.01] transition-colors"
                    style={{ gridTemplateColumns: `100px repeat(${activeClubCourts.length}, minmax(180px, 1fr))` }}
                  >
                    {/* Hour Column */}
                    <div className="flex items-center justify-center font-extrabold text-xs text-zinc-400 bg-white/[0.01] border-r border-b border-white/5 py-3">
                      {slot.label} hs
                    </div>

                    {/* Court Slots */}
                    {activeClubCourts.map((court) => {
                      // Overlapping reservation
                      const reservation = clubReservations.find((r) => {
                        if (r.courtId?._id !== court._id || r.status === "cancelled") return false;
                        const rStart = getArtTime(r.startTime);
                        const rEnd = getArtTime(r.endTime);
                        
                        const rStartMins = rStart.hour * 60 + rStart.minute;
                        const rEndMins = rEnd.hour * 60 + rEnd.minute;
                        const slotStartMins = slot.hour * 60 + slot.minute;
                        const slotEndMins = slotStartMins + 30;

                        return rStartMins < slotEndMins && rEndMins > slotStartMins;
                      });

                      if (reservation) {
                        const rStart = getArtTime(reservation.startTime);
                        const isStartSlot = rStart.hour === slot.hour && rStart.minute === slot.minute;

                        return (
                          <div key={court._id} className="p-1 border-r border-b border-white/5 min-h-[65px] last:border-r-0">
                            {isStartSlot ? (
                              <div className="h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2.5 flex flex-col justify-between hover:border-primary/45 hover:bg-white/[0.08] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_20px_rgba(57,255,20,0.08)] group/res relative hover:z-20">
                                {/* Soft ambient background color inside slot */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none rounded-xl" />
                                <div className="relative z-10">
                                  <div className="flex justify-between items-start mb-1 gap-1.5">
                                    <span className="text-[9px] font-extrabold text-primary flex items-center gap-1 uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 tracking-wider">
                                      <Clock className="w-2.5 h-2.5" />
                                      {formatArtTimeStr(reservation.startTime)} - {formatArtTimeStr(reservation.endTime)}
                                    </span>
                                    {(() => {
                                      const isPartiallyPaid = reservation.paymentStatus === "paid" && (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                                      return (
                                        <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full tracking-wider ${
                                          isPartiallyPaid
                                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                                            : reservation.paymentStatus === "paid"
                                              ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                        }`}>
                                          {isPartiallyPaid ? `SEÑA: $${(reservation.depositAmount ?? 0).toLocaleString("es-AR")}` : reservation.paymentStatus === "paid" ? "PAGO" : "DEBE"}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <h4 className="text-xs font-black text-white truncate mt-1.5 capitalize flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">
                                      {reservation.firstName
                                        ? `${reservation.firstName} ${reservation.lastName}`
                                        : (reservation.userId || "Jugador")}
                                    </span>
                                    {reservation.isRecurring && (
                                      <span 
                                        className={`inline-flex items-center text-[8px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(99,102,241,0.15)] ${
                                          reservation.paymentStatus === "pending"
                                            ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                            : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                        }`} 
                                        title={reservation.paymentStatus === "pending" ? "Turno Fijo - ¡Debe abonar el bloque de 4 semanas!" : "Turno Fijo Recurrente"}
                                      >
                                        🔁 Fijo {reservation.paymentStatus === "pending" ? "⚠️" : ""}
                                      </span>
                                    )}
                                    {reservation.isLastOfSeries && (
                                      <span className="inline-flex items-center text-[8px] font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(34,197,94,0.15)] animate-pulse" title="¡Último día reservado! Clic en los tres puntos para renovar por 4 semanas más.">
                                        🚨 ÚLTIMO / RENOVAR
                                      </span>
                                    )}
                                  </h4>
                                  {(() => {
                                    const isPartiallyPaid = reservation.paymentStatus === "paid" && (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                                    const balance = (reservation.totalPrice ?? 0) - (reservation.depositAmount ?? 0);
                                    return isPartiallyPaid ? (
                                      <p className="text-[9px] text-zinc-400 mt-0.5 leading-none">
                                        Resta: <strong className="text-white">${balance.toLocaleString("es-AR")}</strong>
                                      </p>
                                    ) : null;
                                  })()}
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-1.5 relative z-10">
                                  <span className={`text-[9px] font-extrabold tracking-wider ${
                                    reservation.status === "confirmed"
                                      ? "text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.3)]"
                                      : reservation.status === "completed"
                                        ? "text-blue-400"
                                        : "text-zinc-400"
                                  }`}>
                                    {statusLabel(reservation.status)}
                                  </span>
                                  <ReservationActions
                                    reservationId={reservation._id}
                                    status={reservation.status}
                                    paymentStatus={reservation.paymentStatus}
                                    totalPrice={reservation.totalPrice}
                                    depositAmount={reservation.depositAmount}
                                    isRecurring={reservation.isRecurring}
                                    recurrenceGroupId={reservation.recurrenceGroupId}
                                    isLastOfSeries={reservation.isLastOfSeries}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="h-full bg-white/[0.01] border border-dashed border-white/5 rounded-xl p-2.5 flex items-center justify-center select-none italic min-h-[48px] gap-2">
                                <span className="text-zinc-500 font-extrabold uppercase tracking-wider text-[8px] flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-zinc-500" /> Sigue:
                                </span>
                                <span className="text-zinc-300 not-italic font-bold truncate max-w-[120px] text-[11px] capitalize">
                                  {reservation.firstName
                                    ? `${reservation.firstName} ${reservation.lastName}`
                                    : (reservation.userId || "Jugador")}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div key={court._id} className="p-1 border-r border-b border-white/5 min-h-[65px] last:border-r-0">
                          <NewReservationButton
                            activeClubId={activeClubId}
                            defaultDate={date}
                            presetCourtId={court._id}
                            presetTime={slot.label}
                            presetDate={date}
                          >
                            <div className="h-full w-full min-h-[48px] border border-dashed border-white/10 hover:border-primary/45 hover:bg-primary/[0.03] rounded-xl flex items-center justify-center group/btn cursor-pointer transition-all duration-300 py-3 shadow-inner">
                              <Plus className="w-4 h-4 text-zinc-600 group-hover/btn:text-primary group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-all" />
                            </div>
                          </NewReservationButton>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* VISTA LISTA - STANDARD LIST VIEW */
          <div className="space-y-3 relative z-10">
            {clubReservations.length === 0 ? (
              <div className="text-center py-16 text-zinc-400 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No hay reservas programadas para esta selección.</p>
              </div>
            ) : (
              clubReservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="relative group flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(57,255,20,0.03)] hover:scale-[1.01] hover:z-20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 min-w-0 relative z-10">
                    <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-white truncate flex items-center gap-2 tracking-wide text-sm sm:text-base">
                        <span>
                          Reserva #{reservation._id.substring(0, 5)} -{" "}
                          {reservation.courtId?.name ?? "Cancha"}
                        </span>
                        {reservation.isRecurring && (
                          <span 
                            className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.15)] ${
                              reservation.paymentStatus === "pending"
                                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                            }`}
                            title={reservation.paymentStatus === "pending" ? "Turno Fijo - ¡Debe abonar el bloque de 4 semanas!" : "Turno Fijo Recurrente"}
                          >
                            🔁 Fijo {reservation.paymentStatus === "pending" ? "⚠️" : ""}
                          </span>
                        )}
                        {reservation.isLastOfSeries && (
                          <span className="inline-flex items-center text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 shrink-0 uppercase tracking-wider shadow-[0_0_8px_rgba(34,197,94,0.15)] animate-pulse" title="¡Último día reservado! Clic en los tres puntos para renovar por 4 semanas más.">
                            🚨 ÚLTIMO / RENOVAR
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Jugador:{" "}
                        <strong className="text-zinc-200 font-bold capitalize">
                          {reservation.isPublic || !reservation.userId
                            ? `${reservation.firstName} ${reservation.lastName} (Público)`
                            : reservation.userId}
                        </strong>{" "}
                        {reservation.courtId && (
                          <span className="text-[10px] font-extrabold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 ml-1 capitalize tracking-wide">
                            {courtSportEmoji(reservation.courtId.sport)} {reservation.courtId.sport}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end relative z-10">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs font-bold text-white tracking-wide">
                        {formatArtDateStr(reservation.startTime)} - {formatArtTimeStr(reservation.startTime)} hs
                      </span>
                      <span className="text-xs text-primary font-black mt-0.5 drop-shadow-[0_0_4px_rgba(57,255,20,0.2)]">
                        ${(reservation.totalPrice ?? 0).toLocaleString("es-AR")}
                      </span>
                      {(() => {
                        const isPartiallyPaid = reservation.paymentStatus === "paid" && (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                        const balance = (reservation.totalPrice ?? 0) - (reservation.depositAmount ?? 0);
                        return isPartiallyPaid ? (
                          <div className="flex flex-col sm:items-end text-[10px] text-zinc-400 mt-1 leading-tight">
                            <span>Seña: <strong className="text-zinc-200">${(reservation.depositAmount ?? 0).toLocaleString("es-AR")}</strong></span>
                            <span>Resta: <strong className="text-white">${balance.toLocaleString("es-AR")}</strong></span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const isPartiallyPaid = reservation.paymentStatus === "paid" && (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                        return (
                          <span
                            className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full tracking-wider shadow-sm ${
                              isPartiallyPaid
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                                : reservation.paymentStatus === "paid"
                                  ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                            }`}
                          >
                            {isPartiallyPaid
                              ? "SEÑADO"
                              : reservation.paymentStatus === "paid"
                                ? "PAGADO"
                                : "PAGO PENDIENTE"}
                          </span>
                        );
                      })()}
                      <span
                        className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full tracking-wider shadow-sm ${
                          reservation.status === "confirmed"
                            ? "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_8px_rgba(57,255,20,0.15)]"
                            : reservation.status === "cancelled"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : reservation.status === "completed"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                        }`}
                      >
                        {statusLabel(reservation.status)}
                      </span>
                    </div>

                    <ReservationActions
                      reservationId={reservation._id}
                      status={reservation.status}
                      paymentStatus={reservation.paymentStatus}
                      totalPrice={reservation.totalPrice}
                      depositAmount={reservation.depositAmount}
                      isRecurring={reservation.isRecurring}
                      recurrenceGroupId={reservation.recurrenceGroupId}
                      isLastOfSeries={reservation.isLastOfSeries}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
