import { CalendarDays, MoreVertical } from "lucide-react";

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
          <button className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-105 transition-transform">
            + Nueva Reserva
          </button>
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
                      <p className="font-semibold text-white">Reserva #{res._id.substring(0, 5)}</p>
                      <p className="text-sm text-zinc-400">Usuario ID: {res.userId}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-6">
                    <span className="text-sm font-medium">{new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${res.status === 'confirmed' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                      {res.status.toUpperCase()}
                    </span>
                    <button className="text-zinc-500 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
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
