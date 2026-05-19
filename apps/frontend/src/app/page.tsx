import { CalendarDays } from "lucide-react";
import NewReservationButton from "../components/NewReservationButton";
import ReservationActions from "../components/ReservationActions";

async function getReservations() {
  try {
    const res = await fetch('http://localhost:3001/reservations', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return [];
  }
}

export default async function Dashboard() {
  const reservations = await getReservations();

  return (
    <>
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Dashboard Content */}
      <div className="flex-1 overflow-y-auto p-8 z-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">¡Hola, Juan! 👋</h1>
            <p className="text-zinc-400">Aquí tienes el resumen de tu club deportivo hoy.</p>
          </div>
          <NewReservationButton />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Reservas Hoy", value: reservations.length.toString(), trend: "En tiempo real", color: "text-primary" },
            { label: "Canchas Ocupadas", value: "8/10", trend: "80%", color: "text-white" },
            { label: "Nuevos Jugadores", value: "5", trend: "+2", color: "text-zinc-400" },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-zinc-800/50 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <p className="text-sm text-zinc-400 font-medium mb-1 relative z-10">{stat.label}</p>
              <div className="flex items-baseline space-x-2 relative z-10">
                <h3 className={`text-4xl font-bold ${stat.color}`}>{stat.value}</h3>
                <span className="text-sm text-primary font-medium">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Reservations */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Próximos Partidos (Desde la Base de Datos)</h2>
            <button className="text-sm text-zinc-400 hover:text-primary transition-colors">Ver todo</button>
          </div>
          
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">
                <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay reservas programadas para hoy.</p>
              </div>
            ) : (
              reservations.map((res: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div>
                      <p className="font-semibold text-white">Reserva #{res._id.substring(0, 5)} - {res.courtId?.name || 'Cancha'}</p>
                      <p className="text-sm text-zinc-400">Jugador: <strong className="text-zinc-200">{res.userId}</strong> {res.courtId && <span className="text-xs text-zinc-500 capitalize">({res.courtId.sport})</span>}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-medium text-white">
                        {new Date(res.startTime).toLocaleDateString([], {day: '2-digit', month: '2-digit'})} - {new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} hs
                      </span>
                      <span className="text-xs text-primary font-semibold mt-0.5">${res.totalPrice?.toLocaleString('es-AR') || '0'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${res.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {res.paymentStatus === 'paid' ? 'PAGADO' : 'PAGO PENDIENTE'}
                      </span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${
                        res.status === 'confirmed' ? 'bg-primary/10 text-primary border border-primary/20' :
                        res.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        res.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {res.status === 'pending' ? 'POR CONFIRMAR' : 
                         res.status === 'confirmed' ? 'CONFIRMADA' : 
                         res.status === 'cancelled' ? 'CANCELADA' : 
                         res.status === 'completed' ? 'COMPLETADA' : res.status.toUpperCase()}
                      </span>
                    </div>
                    <ReservationActions reservationId={res._id} status={res.status} paymentStatus={res.paymentStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
