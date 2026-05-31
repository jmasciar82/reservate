"use client";

import { useEffect, useState } from "react";
import { useClub } from "@/providers/ClubProvider";
import { apiFetch } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  Award,
  ShoppingBag,
  Dumbbell,
} from "lucide-react";

type AnalyticsData = {
  averageOccupancy: number;
  totalReservations: number;
  revenueTrend: Array<{
    label: string;
    revenue: number;
    deposits: number;
  }>;
  paymentBreakdown: {
    totalRevenue: number;
    paidOnline: number;
    pendingAtFrontDesk: number;
    courtRevenue: number;
    productsRevenue: number;
  };
  occupancyByCourt: Array<{
    name: string;
    sport: string;
    count: number;
    occupancyRate: number;
  }>;
  occupancyBySport: Array<{
    name: string;
    value: number;
  }>;
  peakHours: Array<{
    hour: string;
    count: number;
  }>;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
};

const defaultData: AnalyticsData = {
  averageOccupancy: 0,
  totalReservations: 0,
  revenueTrend: [],
  paymentBreakdown: {
    totalRevenue: 0,
    paidOnline: 0,
    pendingAtFrontDesk: 0,
    courtRevenue: 0,
    productsRevenue: 0,
  },
  occupancyByCourt: [],
  occupancyBySport: [],
  peakHours: [],
  topProducts: [],
};

const COLORS = ["#39ff14", "#00d1ff", "#ff007f", "#ffaa00"];

export default function AnalyticsPage() {
  const { activeClubId, clubs } = useClub();
  const [range, setRange] = useState<"7d" | "30d" | "12m">("30d");
  const [data, setData] = useState<AnalyticsData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeClub = clubs.find((c) => c._id === activeClubId);

  useEffect(() => {
    async function fetchStats() {
      if (!activeClubId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await apiFetch(`/analytics?clubId=${activeClubId}&range=${range}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("No se pudieron cargar las analíticas.");
        }

        const stats = (await response.json()) as AnalyticsData;
        setData(stats);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Error al conectar con la API de estadísticas.");
      } finally {
        setLoading(false);
      }
    }

    void fetchStats();
  }, [activeClubId, range]);

  if (!activeClubId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500">
        Por favor, seleccioná una sede activa para ver sus analíticas.
      </div>
    );
  }

  // Preparar datos de torta (Pie Chart)
  const pieData = [
    { name: "Señas Online (Mercado Pago)", value: data.paymentBreakdown.paidOnline },
    { name: "Saldo Pendiente (Recepción)", value: data.paymentBreakdown.pendingAtFrontDesk },
  ].filter((item) => item.value > 0);

  // Fallback si no hay pagos para mostrar en la torta
  const displayPieData = pieData.length > 0 ? pieData : [
    { name: "Señas Online", value: 0 },
    { name: "Saldos Recepción", value: 0 }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10 space-y-8 max-w-[1600px] w-full mx-auto">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest">Módulo Estadístico</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Analíticas de {activeClub?.name || "tu sede"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Información en tiempo real para optimizar el rendimiento y facturación del club.
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center bg-white dark:bg-zinc-950 p-1.5 rounded-xl border border-zinc-300 dark:border-zinc-800 w-fit shrink-0">
          {(["7d", "30d", "12m"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                range === r
                  ? "bg-primary text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.25)]"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {r === "7d" ? "7 días" : r === "30d" ? "30 días" : "12 meses"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "Ingresos Totales",
            value: `$${data.paymentBreakdown.totalRevenue.toLocaleString("es-AR")}`,
            icon: DollarSign,
            color: "text-primary border-primary/20",
            desc: `Canchas: $${(data.paymentBreakdown.courtRevenue || 0).toLocaleString("es-AR")} | Extras: $${(data.paymentBreakdown.productsRevenue || 0).toLocaleString("es-AR")}`,
          },
          {
            label: "Ocupación Promedio",
            value: `${data.averageOccupancy}%`,
            icon: TrendingUp,
            color: "text-[#00d1ff] border-[#00d1ff]/20",
            desc: "Porcentaje de horas de cancha reservadas",
          },
          {
            label: "Reservas Totales",
            value: data.totalReservations.toString(),
            icon: Calendar,
            color: "text-[#ff007f] border-[#ff007f]/20",
            desc: "Cantidad de turnos agendados",
          },
          {
            label: "Señas Online",
            value: `$${data.paymentBreakdown.paidOnline.toLocaleString("es-AR")}`,
            icon: Users,
            color: "text-[#ffaa00] border-[#ffaa00]/20",
            desc: "Garantizado en cuenta de Mercado Pago",
          },
        ].map((kpi, idx) => (
          <div
            key={idx}
            className={`bg-white/80 dark:bg-zinc-900/50 border backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors ${loading ? "animate-pulse" : ""}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">{kpi.label}</p>
                <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">{loading ? "..." : kpi.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 border-t border-zinc-300/40 dark:border-zinc-800/40 pt-2">{kpi.desc}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Charts (Revenue Trend & Payment Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Area Chart */}
        <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-2xl shadow-lg lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Tendencia de Ingresos</h3>
              <p className="text-xs text-zinc-500">Comparativa temporal de reservas vs. señas cobradas</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {loading ? (
              <div className="h-full w-full bg-zinc-950/20 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center animate-pulse text-xs text-zinc-600">
                Cargando gráfico...
              </div>
            ) : data.revenueTrend.length === 0 ? (
              <div className="h-full w-full border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                <Clock className="w-8 h-8 opacity-25" />
                <span>No hay suficientes datos de reservas para mostrar la tendencia de ingresos.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#39ff14" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#39ff14" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00d1ff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00d1ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="label" stroke="#4b5563" fontSize={10} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      borderColor: "#374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Ingresos Totales"
                    stroke="#39ff14"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    name="Señas Online"
                    stroke="#00d1ff"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorDeposits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Payment breakdown Pie Chart */}
        <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-2xl shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Método de Recaudación</h3>
            <p className="text-xs text-zinc-500">Origen de los fondos del período</p>
          </div>

          <div className="h-[250px] w-full mt-6 relative flex items-center justify-center">
            {loading ? (
              <div className="h-full w-full bg-zinc-950/20 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center animate-pulse text-xs text-zinc-600">
                Cargando gráfico...
              </div>
            ) : data.paymentBreakdown.totalRevenue === 0 ? (
              <div className="h-full w-full border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                <Clock className="w-8 h-8 opacity-25" />
                <span>Sin datos de cobros.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {displayPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      borderColor: "#374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {!loading && data.paymentBreakdown.totalRevenue > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Cobrado</span>
                <span className="text-lg font-black text-zinc-900 dark:text-white">
                  {Math.round((data.paymentBreakdown.paidOnline / data.paymentBreakdown.totalRevenue) * 100)}%
                </span>
                <span className="text-[8px] text-primary font-medium">Online</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-zinc-300/50 dark:border-zinc-800/50 pt-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-zinc-600 dark:text-zinc-300">Señas Online</span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">${data.paymentBreakdown.paidOnline.toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00d1ff]" />
                <span className="text-zinc-600 dark:text-zinc-300">En mostrador</span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">${data.paymentBreakdown.pendingAtFrontDesk.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Court Occupancy & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Court Occupancy Bar Chart */}
        <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-2xl shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ocupación por Cancha</h3>
            <p className="text-xs text-zinc-500">Porcentaje de tiempo reservado sobre el total disponible</p>
          </div>

          <div className="h-[300px] w-full mt-6">
            {loading ? (
              <div className="h-full w-full bg-zinc-950/20 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center animate-pulse text-xs text-zinc-600">
                Cargando gráfico...
              </div>
            ) : data.occupancyByCourt.length === 0 ? (
              <div className="h-full w-full border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                <Clock className="w-8 h-8 opacity-25" />
                <span>No hay canchas creadas en esta sede para calcular ocupación.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.occupancyByCourt}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} horizontal={false} />
                  <XAxis type="number" stroke="#4b5563" fontSize={10} domain={[0, 100]} unit="%" tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#4b5563" fontSize={10} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      borderColor: "#374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value}%`, "Ocupación"]}
                  />
                  <Bar dataKey="occupancyRate" fill="#39ff14" radius={[0, 6, 6, 0]} barSize={12}>
                    {data.occupancyByCourt.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.sport === "padel" ? "#39ff14" : "#00d1ff"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Peak Hours Line/Area Chart */}
        <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-2xl shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Horarios de Mayor Demanda</h3>
            <p className="text-xs text-zinc-500">Distribución de turnos según hora de inicio</p>
          </div>

          <div className="h-[300px] w-full mt-6">
            {loading ? (
              <div className="h-full w-full bg-zinc-950/20 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center animate-pulse text-xs text-zinc-600">
                Cargando gráfico...
              </div>
            ) : data.peakHours.length === 0 ? (
              <div className="h-full w-full border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                <Clock className="w-8 h-8 opacity-25" />
                <span>Sin datos de turnos para calcular horas de mayor demanda.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.peakHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff007f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff007f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="hour" stroke="#4b5563" fontSize={9} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      borderColor: "#374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [value, "Reservas"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Reservas"
                    stroke="#ff007f"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Revenue by Concept & Top Products Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Concept Donut Chart */}
        <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-2xl shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ingresos por Concepto</h3>
            <p className="text-xs text-zinc-500">Distribución de facturación entre alquileres y extras</p>
          </div>

          <div className="h-[250px] w-full mt-6 relative flex items-center justify-center">
            {loading ? (
              <div className="h-full w-full bg-zinc-950/20 border border-dashed border-zinc-800/40 rounded-xl flex items-center justify-center animate-pulse text-xs text-zinc-600">
                Cargando gráfico...
              </div>
            ) : data.paymentBreakdown.totalRevenue === 0 ? (
              <div className="h-full w-full border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                <Clock className="w-8 h-8 opacity-25" />
                <span>Sin datos de cobros.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Alquiler de Canchas", value: data.paymentBreakdown.courtRevenue || 0 },
                      { name: "Consumos y Extras", value: data.paymentBreakdown.productsRevenue || 0 },
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[
                      { name: "Alquiler de Canchas", value: data.paymentBreakdown.courtRevenue || 0 },
                      { name: "Consumos y Extras", value: data.paymentBreakdown.productsRevenue || 0 },
                    ].filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#39ff14" : "#ff007f"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(17, 24, 39, 0.95)",
                      borderColor: "#374151",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "10px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            {!loading && data.paymentBreakdown.totalRevenue > 0 && (
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest">Extras</span>
                <span className="text-lg font-black text-[#ff007f] drop-shadow-[0_0_6px_rgba(255,0,127,0.2)]">
                  {data.paymentBreakdown.totalRevenue > 0
                    ? Math.round(((data.paymentBreakdown.productsRevenue || 0) / data.paymentBreakdown.totalRevenue) * 100)
                    : 0}%
                </span>
                <span className="text-[8px] text-zinc-400 font-medium">del total</span>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-zinc-300/50 dark:border-zinc-800/50 pt-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-zinc-600 dark:text-zinc-300">Alquiler de Canchas</span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">${(data.paymentBreakdown.courtRevenue || 0).toLocaleString("es-AR")}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff007f]" />
                <span className="text-zinc-600 dark:text-zinc-300">Consumos y Extras</span>
              </div>
              <span className="font-bold text-zinc-900 dark:text-white">${(data.paymentBreakdown.productsRevenue || 0).toLocaleString("es-AR")}</span>
            </div>
          </div>
        </div>

        {/* Top 5 Products Leaderboard */}
        <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-2xl shadow-lg lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-[#ffaa00] animate-bounce" />
                Top 5 Consumos / Extras más Vendidos
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mb-6">Ranking de bebidas, accesorios y servicios adicionales del club</p>

            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-10 bg-zinc-800/20 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : !data.topProducts || data.topProducts.length === 0 ? (
                <div className="h-[200px] border border-dashed border-zinc-800/40 rounded-xl flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
                  <ShoppingBag className="w-8 h-8 opacity-25 text-zinc-400" />
                  <span>No se registraron ventas de extras en este período.</span>
                </div>
              ) : (
                data.topProducts.map((prod, idx) => {
                  const maxRevenue = Math.max(...data.topProducts.map((p) => p.revenue), 1);
                  const progressWidth = Math.round((prod.revenue / maxRevenue) * 100);
                  
                  // Icono segun nombre
                  let icon = "🎒";
                  const nameLower = prod.name.toLowerCase();
                  if (nameLower.includes("agua") || nameLower.includes("bebida") || nameLower.includes("gatorade") || nameLower.includes("lata") || nameLower.includes("coca")) {
                    icon = "🥤";
                  } else if (nameLower.includes("paleta") || nameLower.includes("raqueta")) {
                    icon = "🎾";
                  } else if (nameLower.includes("pelota") || nameLower.includes("tubo")) {
                    icon = "🥎";
                  } else if (nameLower.includes("grip") || nameLower.includes("overgrip")) {
                    icon = "🎗️";
                  } else if (nameLower.includes("toalla")) {
                    icon = "🧼";
                  }

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center rounded-md bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-[10px] font-black text-zinc-600 dark:text-zinc-400">
                            #{idx + 1}
                          </span>
                          <span className="text-lg leading-none">{icon}</span>
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">{prod.name}</span>
                          <span className="text-[10px] text-zinc-500">({prod.quantity} u.)</span>
                        </div>
                        <span className="font-extrabold text-primary">${prod.revenue.toLocaleString("es-AR")}</span>
                      </div>
                      
                      <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-950 border border-zinc-300/30 dark:border-zinc-850 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.4)] transition-all duration-500"
                          style={{ width: `${progressWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {!loading && data.topProducts && data.topProducts.length > 0 && (
            <div className="mt-4 border-t border-zinc-300/50 dark:border-zinc-800/50 pt-3 text-[10px] text-zinc-500 flex justify-between items-center">
              <span>* Basado en las reservas del rango seleccionado.</span>
              <span className="font-bold text-primary">Ingresos Extras: ${(data.paymentBreakdown.productsRevenue || 0).toLocaleString("es-AR")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

