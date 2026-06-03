import { CalendarDays, Plus, Clock, Sparkles } from "lucide-react";
import NewReservationButton from "@/components/NewReservationButton";
import ReservationActions from "@/components/ReservationActions";
import DashboardFilters from "@/components/DashboardFilters";
import SchedulerGrid from "@/components/SchedulerGrid";
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

  // 1. Filtrar las reservas de la sede activa
  const clubReservations = reservations.filter(
    (r) => r.courtId && String(r.courtId.clubId) === String(activeClubId)
  );

  // 2. Filtrar las reservas que se juegan HOY (para la grilla, lista, KPI de Reservas y ocupación)
  const playingTodayReservations = clubReservations.filter((r) => {
    if (r.status === "cancelled") return false;
    const { year, month, day } = getArtTime(r.startTime);
    const rDateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rDateStr === date;
  });

  const occupiedCourtIds = new Set(
    playingTodayReservations
      .map((reservation) => reservation.courtId?._id)
      .filter(Boolean),
  );
  
  const totalCourtsCount = activeClubCourts.length;
  const occupiedCourtsCount = occupiedCourtIds.size;
  const occupancyPercent =
    totalCourtsCount > 0
      ? `${Math.round((occupiedCourtsCount / totalCourtsCount) * 100)}%`
      : "0%";

  // 3. Calcular los ingresos cobrados (cobros realizados HOY)
  const totalRevenue = clubReservations
    .filter((reservation) => {
      if (reservation.paymentStatus !== "paid") return false;

      // Fallback: si no tiene paymentDate (datos semilla/viejos), usamos startTime
      const pDateStr = reservation.paymentDate || reservation.startTime;
      const { year, month, day } = getArtTime(pDateStr);
      const pDateStrFormatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return pDateStrFormatted === date;
    })
    .reduce((sum, reservation) => {
      const amountPaid = (reservation.depositAmount && reservation.depositAmount > 0)
        ? reservation.depositAmount
        : (reservation.totalPrice || 0);
      return sum + amountPaid;
    }, 0);

  const revenueStat = `$${totalRevenue.toLocaleString("es-AR")}`;

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Panel general</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
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
            value: playingTodayReservations.length.toString(),
            trend: "Fecha elegida",
            color: "text-primary",
          },
          {
            label: "Canchas ocupadas",
            value: `${occupiedCourtsCount}/${totalCourtsCount}`,
            trend: occupancyPercent,
            color: "text-zinc-900 dark:text-white",
          },
          {
            label: "Ingresos cobrados",
            value: revenueStat,
            trend: "Pagos confirmados",
            color: "text-zinc-800 dark:text-zinc-100",
          },
        ].map((stat) => (
          <div key={stat.label} className="relative group overflow-hidden bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200/80 dark:border-white/5 hover:border-primary/30 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(57,255,20,0.05)] hover:scale-[1.02]">
            {/* Ambient hover glow inside the card */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <p className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">{stat.label}</p>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-3xl font-black tracking-tight ${stat.color} drop-shadow`}>{stat.value}</h3>
                <span className="text-[10px] text-primary font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shadow-[0_0_8px_rgba(57,255,20,0.1)]">{stat.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white/80 dark:bg-white/[0.015] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] relative overflow-hidden">
        {/* Subtle interior glow */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-300/50 dark:via-white/10 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-zinc-200/80 dark:border-white/5 relative z-10">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2 text-zinc-900 dark:text-white tracking-wide">
              <span className="w-2.5 h-6 bg-primary rounded-full shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
              Reservas del día
            </h2>
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-1">Organización y control de turnos en tiempo real</p>
          </div>
          
          <div className="flex items-center bg-zinc-100/80 dark:bg-white/5 p-1 rounded-xl border border-zinc-200 dark:border-white/10 w-fit backdrop-blur-md shadow-inner">
            <Link
              href={`?date=${date}&view=scheduler`}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all duration-300 ${
                view === "scheduler"
                  ? "bg-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
            >
              Vista Agenda (Calendario)
            </Link>
            <Link
              href={`?date=${date}&view=list`}
              className={`px-4 py-2 text-xs font-extrabold rounded-lg transition-all duration-300 ${
                view === "list"
                  ? "bg-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.4)]"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
              }`}
            >
              Vista Lista (Detallada)
            </Link>
          </div>
        </div>

        {view === "scheduler" ? (
          /* VISTA AGENDA - SCHEDULER GRID CLIENT COMPONENT (DRAG AND DROP SUPPORTED) */
          activeClubCourts.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.01]">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">No hay canchas creadas en esta sede para mostrar la grilla diaria.</p>
            </div>
          ) : (
            <SchedulerGrid
              activeClubCourts={activeClubCourts}
              playingTodayReservations={playingTodayReservations}
              date={date}
              activeClubId={activeClubId}
            />
          )
        ) : (
          /* VISTA LISTA - STANDARD LIST VIEW */
          <div className="space-y-3 relative z-10">
            {playingTodayReservations.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.01]">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No hay reservas programadas para esta selección.</p>
              </div>
            ) : (
              playingTodayReservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="relative group flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-5 rounded-2xl bg-white/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 hover:border-primary/30 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(57,255,20,0.03)] hover:scale-[1.01] hover:z-20"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
                  <div className="flex items-center gap-4 min-w-0 relative z-10">
                    <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
                    <div className="min-w-0">
                      <p className="font-extrabold text-zinc-900 dark:text-white truncate flex items-center gap-2 tracking-wide text-sm sm:text-base">
                        <span>
                          Reserva #{reservation._id.substring(0, 5)} -{" "}
                          {reservation.courtId?.name ?? "Cancha"}
                        </span>
                        {reservation.isRecurring && (() => {
                          const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                          const needsTotalPayment = reservation.paymentStatus === "pending" || isPartiallyPaid;
                          return (
                            <span 
                              className={`inline-flex items-center text-[9px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.15)] ${
                                needsTotalPayment
                                  ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                  : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                              }`}
                              title={needsTotalPayment ? "Turno Fijo - ¡Falta abonar el saldo restante del bloque de 4 semanas!" : "Turno Fijo"}
                            >
                              🔁 Fijo {needsTotalPayment ? "⚠️" : ""}
                            </span>
                          );
                        })()}
                        {reservation.isLastOfSeries && (
                          <span className="inline-flex items-center text-[9px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 shrink-0 uppercase tracking-wider shadow-[0_0_8px_rgba(34,197,94,0.15)] animate-pulse" title="¡Último día reservado! Clic en los tres puntos para renovar por 4 semanas más.">
                            🚨 ÚLTIMO / RENOVAR
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        Jugador:{" "}
                        <strong className="text-zinc-600 dark:text-zinc-200 font-bold capitalize">
                          {reservation.isPublic || !reservation.userId
                            ? `${reservation.firstName} ${reservation.lastName} (Público)`
                            : reservation.userId}
                        </strong>{" "}
                        {reservation.courtId && (
                          <span className="text-[10px] font-extrabold text-zinc-500 bg-zinc-100/80 dark:bg-white/5 px-2 py-0.5 rounded-full border border-zinc-200/80 dark:border-white/5 ml-1 capitalize tracking-wide">
                            {courtSportEmoji(reservation.courtId.sport)} {reservation.courtId.sport}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end relative z-10">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide">
                        {formatArtDateStr(reservation.startTime)} - {formatArtTimeStr(reservation.startTime)} hs
                      </span>
                      <span className="text-xs text-primary font-black mt-0.5 drop-shadow-[0_0_4px_rgba(57,255,20,0.2)]">
                        ${(reservation.totalPrice ?? 0).toLocaleString("es-AR")}
                      </span>
                      {(() => {
                        const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                        const balance = (reservation.totalPrice ?? 0) - (reservation.depositAmount ?? 0);
                        return isPartiallyPaid ? (
                           <div className="flex flex-col sm:items-end text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-tight">
                            <span>Seña: <strong className="text-zinc-600 dark:text-zinc-200">${(reservation.depositAmount ?? 0).toLocaleString("es-AR")}</strong></span>
                            <span>Resta: <strong className="text-zinc-900 dark:text-white">${balance.toLocaleString("es-AR")}</strong></span>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {(() => {
                        const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
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
                                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700"
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
                      playerName={
                        reservation.firstName
                          ? `${reservation.firstName} ${reservation.lastName}`
                          : (reservation.userId || "")
                      }
                      startTime={reservation.startTime}
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
