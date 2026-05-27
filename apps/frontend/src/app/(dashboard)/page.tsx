import { CalendarDays, Plus, Clock, Sparkles } from "lucide-react";
import NewReservationButton from "@/components/NewReservationButton";
import ReservationActions from "@/components/ReservationActions";
import DashboardFilters from "@/components/DashboardFilters";
import { apiUrl, apiFetch } from "@/lib/api";
import { cookies } from "next/headers";
import type { Club, Reservation, Court } from "@/lib/types";
import Link from "next/link";

type DashboardSearchParams = Promise<{
  date?: string | string[];
  view?: string | string[];
}>;

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function todayInArgentina() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
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
            color: "text-zinc-200",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-border p-5 rounded-lg">
            <p className="text-sm text-zinc-400 font-medium mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
              <span className="text-sm text-primary font-medium">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/60">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
              Reservas del día
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Organización y control de turnos en tiempo real</p>
          </div>
          
          <div className="flex items-center bg-zinc-950 p-1 rounded-lg border border-zinc-800 w-fit">
            <Link
              href={`?date=${date}&view=scheduler`}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                view === "scheduler"
                  ? "bg-primary text-[#09090b] shadow-[0_0_10px_rgba(57,255,20,0.2)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Vista Agenda (Calendario)
            </Link>
            <Link
              href={`?date=${date}&view=list`}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                view === "list"
                  ? "bg-primary text-[#09090b] shadow-[0_0_10px_rgba(57,255,20,0.2)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Vista Lista (Detallada)
            </Link>
          </div>
        </div>

        {view === "scheduler" ? (
          /* VISTA AGENDA - SCHEDULER GRID */
          activeClubCourts.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay canchas creadas en esta sede para mostrar la grilla diaria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full border border-zinc-800 rounded-xl bg-zinc-900/10">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid" style={{ gridTemplateColumns: `100px repeat(${activeClubCourts.length}, minmax(180px, 1fr))` }}>
                  <div className="flex items-center justify-center font-bold text-xs uppercase tracking-wider text-zinc-500 bg-zinc-950/80 border-r border-b border-zinc-800 p-3">
                    Horario
                  </div>
                  {activeClubCourts.map((court) => (
                    <div key={court._id} className="text-center p-3 border-b border-zinc-800 bg-zinc-950/60 flex flex-col items-center justify-center">
                      <p className="font-extrabold text-sm text-white tracking-wide">{court.name}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[9px] font-bold text-primary uppercase tracking-wider">
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
                    className="grid hover:bg-zinc-800/10 transition-colors"
                    style={{ gridTemplateColumns: `100px repeat(${activeClubCourts.length}, minmax(180px, 1fr))` }}
                  >
                    {/* Hour Column */}
                    <div className="flex items-center justify-center font-extrabold text-xs text-zinc-400 bg-zinc-950/20 border-r border-b border-zinc-800 py-3">
                      {slot.label} hs
                    </div>

                    {/* Court Slots */}
                    {activeClubCourts.map((court) => {
                      const slotStart = new Date(`${date}T${slot.label}:00`);
                      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

                      // Overlapping reservation
                      const reservation = clubReservations.find((r) => {
                        if (r.courtId?._id !== court._id || r.status === "cancelled") return false;
                        const rStart = new Date(r.startTime);
                        const rEnd = new Date(r.endTime);
                        return rStart < slotEnd && rEnd > slotStart;
                      });

                      if (reservation) {
                        const rStart = new Date(reservation.startTime);
                        const isStartSlot = rStart.getHours() === slot.hour && rStart.getMinutes() === slot.minute;

                        return (
                          <div key={court._id} className="p-1 border-r border-b border-zinc-800/50 min-h-[65px]">
                            {isStartSlot ? (
                              <div className="h-full bg-zinc-900/60 border border-zinc-800 rounded-lg p-2.5 flex flex-col justify-between hover:border-zinc-700 transition-colors shadow-lg">
                                <div>
                                  <div className="flex justify-between items-start mb-1 gap-2">
                                    <span className="text-[9px] font-extrabold text-primary flex items-center gap-1 uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                                      <Clock className="w-2.5 h-2.5" />
                                      {new Date(reservation.startTime).toLocaleTimeString("es-AR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })} - {new Date(reservation.endTime).toLocaleTimeString("es-AR", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })} hs ({((new Date(reservation.endTime).getTime() - new Date(reservation.startTime).getTime()) / (1000 * 60 * 60))} hs)
                                    </span>
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${
                                      reservation.paymentStatus === "paid"
                                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    }`}>
                                      {reservation.paymentStatus === "paid" ? "PAGO" : "DEBE"}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-white truncate mt-1 capitalize flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">
                                      {reservation.firstName
                                        ? `${reservation.firstName} ${reservation.lastName}`
                                        : (reservation.userId || "Jugador")}
                                    </span>
                                    {reservation.isRecurring && (
                                      <span className="inline-flex items-center text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0 uppercase tracking-wide" title="Turno Fijo Recurrente">
                                        🔁 Fijo
                                      </span>
                                    )}
                                  </h4>
                                </div>
                                <div className="flex items-center justify-between border-t border-zinc-800/30 pt-1.5 mt-1.5">
                                  <span className={`text-[9px] font-semibold ${
                                    reservation.status === "confirmed"
                                      ? "text-primary"
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
                                    isRecurring={reservation.isRecurring}
                                    recurrenceGroupId={reservation.recurrenceGroupId}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="h-full bg-zinc-950/10 border border-dashed border-zinc-800/20 rounded-lg p-2 flex items-center justify-center select-none italic min-h-[48px] gap-2">
                                <span className="text-zinc-600 font-bold uppercase tracking-wider text-[8px] flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-zinc-600" /> Sigue:
                                </span>
                                <span className="text-zinc-500 not-italic font-semibold truncate max-w-[120px] text-[11px] capitalize">
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
                        <div key={court._id} className="p-1 border-r border-b border-zinc-800/50 min-h-[65px]">
                          <NewReservationButton
                            activeClubId={activeClubId}
                            defaultDate={date}
                            presetCourtId={court._id}
                            presetTime={slot.label}
                            presetDate={date}
                          >
                            <div className="h-full w-full min-h-[48px] border border-dashed border-zinc-800/40 hover:border-primary/30 hover:bg-primary/5 rounded-lg flex items-center justify-center group/btn cursor-pointer transition-all py-3">
                              <Plus className="w-4 h-4 text-zinc-700 group-hover/btn:text-primary group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-all" />
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
          <div className="space-y-3">
            {clubReservations.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay reservas programadas para esta selección.</p>
              </div>
            ) : (
              clubReservations.map((reservation) => (
                <div
                  key={reservation._id}
                  className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate flex items-center gap-2">
                        <span>
                          Reserva #{reservation._id.substring(0, 5)} -{" "}
                          {reservation.courtId?.name ?? "Cancha"}
                        </span>
                        {reservation.isRecurring && (
                          <span className="inline-flex items-center text-[9px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-wider shrink-0">
                            🔁 Fijo
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-zinc-400">
                        Jugador:{" "}
                        <strong className="text-zinc-200 capitalize">
                          {reservation.isPublic || !reservation.userId
                            ? `${reservation.firstName} ${reservation.lastName} (Público)`
                            : reservation.userId}
                        </strong>{" "}
                        {reservation.courtId && (
                          <span className="text-xs text-zinc-500 capitalize">
                            ({reservation.courtId.sport})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <div className="flex flex-col sm:items-end">
                      <span className="text-sm font-medium text-white">
                        {new Date(reservation.startTime).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(reservation.startTime).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        hs
                      </span>
                      <span className="text-xs text-primary font-semibold mt-0.5">
                        ${reservation.totalPrice?.toLocaleString("es-AR") || "0"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${
                          reservation.paymentStatus === "paid"
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {reservation.paymentStatus === "paid"
                          ? "PAGADO"
                          : "PAGO PENDIENTE"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${
                          reservation.status === "confirmed"
                            ? "bg-primary/10 text-primary border border-primary/20"
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
                      isRecurring={reservation.isRecurring}
                      recurrenceGroupId={reservation.recurrenceGroupId}
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
