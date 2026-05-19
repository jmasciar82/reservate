import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
  Trophy,
  Bell,
  Search,
  MoreVertical,
  Activity
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="flex items-center h-16 px-6 border-b border-border">
          <Trophy className="w-6 h-6 text-primary mr-2" />
          <span className="text-lg font-bold tracking-wider">RESERVATE</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          <a href="#" className="flex items-center px-4 py-3 text-primary-foreground bg-primary rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(57,255,20,0.3)]">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Panel General
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
            <CalendarDays className="w-5 h-5 mr-3" />
            Reservas
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Jugadores
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
            <Activity className="w-5 h-5 mr-3" />
            Matchmaking
          </a>
        </nav>
        
        <div className="p-4 border-t border-border">
          <a href="#" className="flex items-center px-4 py-3 text-zinc-400 hover:text-foreground hover:bg-zinc-800/50 rounded-xl font-medium transition-colors">
            <Settings className="w-5 h-5 mr-3" />
            Configuración
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-border/50 bg-background/50 backdrop-blur-sm z-10">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Buscar reservas..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-zinc-400 hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden flex items-center justify-center">
              <span className="text-xs font-bold">JP</span>
            </div>
          </div>
        </header>

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
              { label: "Reservas Hoy", value: "24", trend: "+12%", color: "text-primary" },
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
              <h2 className="text-xl font-bold">Próximos Partidos</h2>
              <button className="text-sm text-zinc-400 hover:text-primary transition-colors">Ver todo</button>
            </div>
            
            <div className="space-y-4">
              {[
                { time: "18:00 - 19:30", court: "Cancha 1 (Pádel)", players: "Torneo Interno", status: "Confirmado" },
                { time: "19:00 - 20:00", court: "Cancha 3 (Tenis)", players: "Martín vs. Diego", status: "Pendiente" },
                { time: "19:30 - 21:00", court: "Cancha 2 (Pádel)", players: "Clase Grupal", status: "Confirmado" },
              ].map((res, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-1.5 h-12 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                    <div>
                      <p className="font-semibold text-white">{res.players}</p>
                      <p className="text-sm text-zinc-400">{res.court}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-6">
                    <span className="text-sm font-medium">{res.time}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${res.status === 'Confirmado' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                      {res.status}
                    </span>
                    <button className="text-zinc-500 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
