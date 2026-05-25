import { CalendarDays } from "lucide-react";
import NewReservationButton from "../components/NewReservationButton";
import ReservationActions from "../components/ReservationActions";
import DashboardFilters from "../components/DashboardFilters";
import { apiUrl } from "@/lib/api";
import type { Club, Court, Reservation } from "@/lib/types";

type DashboardSearchParams = Promise<{
  date?: string | string[];
  clubId?: string | string[];
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

async function getJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return fallback;
  }
}

async function getReservations(date: string, clubId?: string) {
  return getJson<Reservation[]>(
    apiUrl("/reservations", { date, clubId }),
    [],
  );
}

async function getClubs() {
  return getJson<Club[]>(apiUrl("/clubs"), []);
}

async function getCourts() {
  return getJson<Court[]>(apiUrl("/courts"), []);
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
  const requestedClubId = firstParam(params.clubId);

  const [clubs, courts] = await Promise.all([getClubs(), getCourts()]);
  const activeClub =
    clubs.find((club) => club._id === requestedClubId) ?? clubs[0] ?? null;
  const activeClubId = activeClub?._id ?? "";
  const activeClubName = activeClub?.name ?? "tu club deportivo";

  const reservations = await getReservations(date, activeClubId || undefined);
  const filteredCourts = activeClubId
    ? courts.filter((court) => court.clubId === activeClubId)
    : courts;

  const activeReservations = reservations.filter(
    (reservation) => reservation.status !== "cancelled",
  );
  const occupiedCourtIds = new Set(
    activeReservations
      .map((reservation) => reservation.courtId?._id)
      .filter(Boolean),
  );
  const totalCourtsCount = filteredCourts.length;
  const occupiedCourtsCount = occupiedCourtIds.size;
  const occupancyPercent =
    totalCourtsCount > 0
      ? `${Math.round((occupiedCourtsCount / totalCourtsCount) * 100)}%`
      : "0%";
  const totalRevenue = reservations
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
            Resumen operativo de {activeClubName} para la fecha seleccionada.
          </p>
        </div>
        <NewReservationButton activeClubId={activeClubId} defaultDate={date} />
      </div>

      <DashboardFilters
        clubs={clubs}
        currentClubId={activeClubId}
        currentDate={date}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Reservas",
            value: reservations.length.toString(),
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">Reservas del día</h2>
        </div>

        <div className="space-y-3">
          {reservations.length === 0 ? (
            <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No hay reservas programadas para esta selección.</p>
            </div>
          ) : (
            reservations.map((reservation) => (
              <div
                key={reservation._id}
                className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      Reserva #{reservation._id.substring(0, 5)} -{" "}
                      {reservation.courtId?.name ?? "Cancha"}
                    </p>
                    <p className="text-sm text-zinc-400">
                      Jugador:{" "}
                      <strong className="text-zinc-200">
                        {reservation.userId}
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
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
