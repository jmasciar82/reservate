"use client";

import { useEffect, useState } from "react";
import { useClub } from "@/providers/ClubProvider";
import { apiFetch } from "@/lib/api";
import type { Teacher } from "@/lib/types";
import {
  GraduationCap,
  UserPlus,
  Edit2,
  Trash2,
  DollarSign,
  Clock,
  Calendar,
  Search,
  Activity,
  FileText,
  X,
  Plus,
} from "lucide-react";

export default function TeachersPage() {
  const { activeClubId } = useClub();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"manage" | "settlements">("manage");

  // Manage Teacher Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pricePerHour: "",
    sport: "padel",
    isActive: true,
  });

  // Settlements state
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [settlementData, setSettlementData] = useState<any>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  useEffect(() => {
    if (activeClubId) {
      fetchTeachers();
    }
  }, [activeClubId]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/teachers?clubId=${activeClubId}`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
        if (data.length > 0 && !selectedTeacherId) {
          setSelectedTeacherId(data[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (teacher: Teacher | null = null) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setFormData({
        name: teacher.name,
        email: teacher.email || "",
        phone: teacher.phone || "",
        pricePerHour: String(teacher.pricePerHour),
        sport: teacher.sport,
        isActive: teacher.isActive,
      });
    } else {
      setEditingTeacher(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        pricePerHour: "",
        sport: "padel",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClubId) return;

    const payload = {
      ...formData,
      pricePerHour: Number(formData.pricePerHour) || 0,
      clubId: activeClubId,
    };

    try {
      let res;
      if (editingTeacher) {
        res = await apiFetch(`/teachers/${editingTeacher._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await apiFetch("/teachers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsModalOpen(false);
        fetchTeachers();
      } else {
        alert("Ocurrió un error al guardar el profesor.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar a este profesor?")) return;
    try {
      const res = await apiFetch(`/teachers/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchTeachers();
      } else {
        alert("No se pudo eliminar el profesor.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSettlement = async () => {
    if (!selectedTeacherId || !startDate || !endDate) return;
    setSettlementLoading(true);
    try {
      const res = await apiFetch(
        `/teachers/${selectedTeacherId}/settlement?start=${startDate}&end=${endDate}`
      );
      if (res.ok) {
        const data = await res.json();
        setSettlementData(data);
      } else {
        alert("Error al calcular la liquidación.");
      }
    } catch (err) {
      console.error(err);
      alert("Error de red.");
    } finally {
      setSettlementLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <span className="w-2.5 h-8 bg-primary rounded-full shadow-[0_0_12px_rgba(57,255,20,0.5)]" />
            Agenda y Liquidación de Profesores
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administrá el staff de entrenadores, controlá sus clases particulares y generá sus reportes de pago.
          </p>
        </div>

        {activeTab === "manage" && (
          <button
            onClick={() => handleOpenModal()}
            disabled={!activeClubId}
            className="px-4 py-2.5 bg-primary text-black font-extrabold rounded-xl shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Profesor
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-200 dark:border-white/5 pb-px gap-2">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-5 py-3 text-sm font-black transition-all duration-300 relative ${
            activeTab === "manage"
              ? "text-primary border-b-2 border-primary"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Gestión de Staff
        </button>
        <button
          onClick={() => setActiveTab("settlements")}
          className={`px-5 py-3 text-sm font-black transition-all duration-300 relative ${
            activeTab === "settlements"
              ? "text-primary border-b-2 border-primary"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Liquidaciones
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary border-r-2" />
        </div>
      )}

      {/* Tab CONTENT: Manage Teachers */}
      {!loading && activeTab === "manage" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white/5 border border-dashed border-zinc-200 dark:border-white/10 rounded-2xl">
              <GraduationCap className="w-12 h-12 text-zinc-500 mx-auto mb-3" />
              <p className="text-zinc-400 font-semibold">No hay profesores registrados.</p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 text-xs font-black text-primary hover:underline"
              >
                + Registrar el primero ahora
              </button>
            </div>
          ) : (
            teachers.map((teacher) => (
              <div
                key={teacher._id}
                className="relative bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-primary/30 transition-all duration-300 group overflow-hidden"
              >
                {/* Header card info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center font-black text-xl text-primary shadow-inner">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-zinc-900 dark:text-white text-base group-hover:text-primary transition-colors">
                        {teacher.name}
                      </h3>
                      <span className="inline-block px-2 py-0.5 mt-1 text-[10px] font-black uppercase tracking-wider rounded bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-300">
                        {teacher.sport === "padel" ? "🏸 Pádel" : "⚽ Fútbol"}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${
                      teacher.isActive
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {teacher.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>

                {/* Details list */}
                <div className="mt-5 space-y-2 border-t border-zinc-150 dark:border-white/5 pt-4 text-xs text-zinc-500 dark:text-zinc-400">
                  {teacher.email && (
                    <div className="flex justify-between">
                      <span className="font-medium">Correo:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">
                        {teacher.email}
                      </span>
                    </div>
                  )}
                  {teacher.phone && (
                    <div className="flex justify-between">
                      <span className="font-medium">Teléfono:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200">{teacher.phone}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Tarifa por hora:</span>
                    <span className="font-extrabold text-primary text-sm">
                      ${teacher.pricePerHour.toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 flex gap-2 justify-end border-t border-zinc-150 dark:border-white/5 pt-3">
                  <button
                    onClick={() => handleOpenModal(teacher)}
                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-all"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeacher(teacher._id)}
                    className="p-1.5 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all border border-red-500/10"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab CONTENT: Settlements */}
      {!loading && activeTab === "settlements" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-200">
              Filtros de Reporte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Seleccionar Profesor</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                >
                  <option value="" disabled>-- Seleccioná un profesor --</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t._id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                      {t.name} ({t.sport === "padel" ? "Pádel" : "Fútbol"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Desde</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Hasta</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <button
                onClick={handleGenerateSettlement}
                disabled={settlementLoading || !selectedTeacherId}
                className="w-full py-2 px-4 bg-primary text-black font-extrabold rounded-xl shadow-[0_0_10px_rgba(57,255,20,0.15)] hover:scale-[1.01] active:scale-99 transition-all disabled:opacity-50 text-sm"
              >
                {settlementLoading ? "Calculando..." : "Generar Liquidación"}
              </button>
            </div>
          </div>

          {/* Settlement Result Cards */}
          {settlementData && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-300">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="p-5 bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400">Total a Liquidar</span>
                    <h4 className="text-2xl font-black text-primary mt-0.5">
                      ${settlementData.summary.totalEarnings.toLocaleString("es-AR")}
                    </h4>
                  </div>
                </div>

                <div className="p-5 bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xl">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400">Horas Totales</span>
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                      {settlementData.summary.totalHours} hs
                    </h4>
                  </div>
                </div>

                <div className="p-5 bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-zinc-400">Clases Dadas</span>
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                      {settlementData.summary.totalClasses}
                    </h4>
                  </div>
                </div>
              </div>

              {/* Detailed Table */}
              <div className="bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.01]">
                  <h3 className="text-base font-black text-zinc-900 dark:text-white">
                    Detalle de clases de {settlementData.teacher.name}
                  </h3>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 text-xs font-extrabold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-white/5 transition-all"
                  >
                    🖨️ Imprimir Reporte
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase">
                        <th className="py-4 px-6">Fecha / Hora</th>
                        <th className="py-4 px-6">Cancha</th>
                        <th className="py-4 px-6">Deporte</th>
                        <th className="py-4 px-6">Alumno / Jugador</th>
                        <th className="py-4 px-6">Duración</th>
                        <th className="py-4 px-6 text-right">Honorario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5">
                      {settlementData.classes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-zinc-500">
                            No se registraron clases particulares cobradas para este profesor en las fechas indicadas.
                          </td>
                        </tr>
                      ) : (
                        settlementData.classes.map((cls: any) => (
                          <tr key={cls.id} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors font-medium text-zinc-800 dark:text-zinc-200">
                            <td className="py-4 px-6">
                              {new Date(cls.startTime).toLocaleDateString("es-AR", {
                                timeZone: "America/Argentina/Buenos_Aires",
                              })} - {new Date(cls.startTime).toLocaleTimeString("es-AR", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "America/Argentina/Buenos_Aires",
                              })} hs
                            </td>
                            <td className="py-4 px-6 font-bold">{cls.courtName}</td>
                            <td className="py-4 px-6 uppercase text-xs tracking-wider text-zinc-500">
                              {cls.sport === "padel" ? "🏸 Pádel" : "⚽ Fútbol"}
                            </td>
                            <td className="py-4 px-6 font-bold text-zinc-900 dark:text-white">
                              {cls.playerName}
                            </td>
                            <td className="py-4 px-6">{cls.hours} hs</td>
                            <td className="py-4 px-6 text-right font-black text-primary">
                              ${cls.earnings.toLocaleString("es-AR")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRUD Modal dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-md bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                {editingTeacher ? "Editar Profesor" : "Registrar Profesor"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg border border-zinc-250 dark:border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Valenzuela"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-355 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="Ej. 11 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-355 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Tarifa por Hora ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej. 2500"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData((prev) => ({ ...prev, pricePerHour: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-355 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-black text-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400">Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="profesor@club.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-355 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Disciplina</label>
                  <select
                    value={formData.sport}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sport: e.target.value }))}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-355 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                  >
                    <option value="padel">Pádel</option>
                    <option value="football">Fútbol</option>
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center justify-between h-[42px] bg-zinc-50 dark:bg-white/5 border border-zinc-355 dark:border-white/10 rounded-xl px-4">
                    <span className="text-xs font-semibold text-zinc-500">Activo</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black"></div>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-black font-extrabold rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.2)] hover:scale-[1.02] active:scale-95 transition-all duration-200 mt-2 text-sm"
              >
                {editingTeacher ? "Guardar Cambios" : "Agregar Profesor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
