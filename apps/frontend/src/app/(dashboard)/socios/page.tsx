"use client";

import { useEffect, useState, useMemo } from "react";
import { useClub } from "@/providers/ClubProvider";
import { apiFetch } from "@/lib/api";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Plus,
  X,
  CreditCard,
  History,
  CheckCircle2,
  AlertCircle,
  Search,
  DollarSign,
  Calendar,
  Sparkles,
} from "lucide-react";

interface AbonoPayment {
  _id?: string;
  month: string;
  amount: number;
  status: string;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
}

interface Socio {
  _id: string;
  firstName: string;
  lastName: string;
  dni?: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  payments: AbonoPayment[];
}

export default function SociosPage() {
  const { activeClubId } = useClub();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);

  // Activity reservation state
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  // Selected activity detail for details modal
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<{
    socioName: string;
    activityName: string;
    courtName: string;
    teacherName: string;
    sport: string;
    time: string;
    day: string;
    paidAbono: boolean;
    date: Date;
  } | null>(null);

  // Socio Form fields
  const [socioForm, setSocioForm] = useState({
    firstName: "",
    lastName: "",
    dni: "",
    email: "",
    phone: "",
    status: "active",
  });

  // Payment Form fields
  const [paymentForm, setPaymentForm] = useState({
    month: "",
    amount: "35000", // Default monthly fee suggestion
    paymentMethod: "Efectivo",
    notes: "",
  });

  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const getMonthLabel = (monthStr: string) => {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, 15);
    return date.toLocaleString("es-ES", { month: "long", year: "numeric" });
  };

  const fetchSocios = async () => {
    if (!activeClubId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/socios?clubId=${activeClubId}`);
      if (res.ok) {
        const data = await res.json();
        setSocios(data);
      } else {
        console.error("Error al obtener socios");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduledClasses = async () => {
    if (!activeClubId) return;
    setClassesLoading(true);
    try {
      const res = await apiFetch(`/reservations?clubId=${activeClubId}&type=class`);
      if (res.ok) {
        const data = await res.json();
        setScheduledClasses(data);
      }
    } catch (err) {
      console.error("Error al obtener clases programadas:", err);
    } finally {
      setClassesLoading(false);
    }
  };

  const getSocioActivities = (socioId: string) => {
    const activitiesMap = new Map<string, {
      classId: string;
      name: string;
      teacherName: string;
      sport: string;
      startTime: string;
      endTime: string;
      paidAbono: boolean;
      reservationType: string;
    }>();

    for (const cls of scheduledClasses) {
      const student = cls.students?.find((st: any) => st.socioId === socioId);
      if (!student) continue;

      const key = cls.recurrenceGroupId || cls._id;
      const existing = activitiesMap.get(key);

      const classDate = new Date(cls.startTime);
      const classMonthStr = `${classDate.getFullYear()}-${String(classDate.getMonth() + 1).padStart(2, "0")}`;
      const socioObj = socios.find((s) => s._id === socioId);
      const hasSocioPaidForMonth = socioObj?.payments?.some(
        (p) => p.month === classMonthStr && p.status === "paid"
      );

      const isPaid = !!student.paidAbono || !!hasSocioPaidForMonth;

      if (!existing) {
        activitiesMap.set(key, {
          classId: cls._id,
          name: cls.courtId?.name || "Cancha",
          teacherName: cls.teacherId?.name || "Sin profesor",
          sport: cls.reservationType?.includes("padel") ? "Pádel" : "Fútbol",
          startTime: cls.startTime,
          endTime: cls.endTime,
          paidAbono: isPaid,
          reservationType: cls.reservationType || "standard",
        });
      } else {
        const d = new Date(cls.startTime);
        const now = new Date();
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          existing.paidAbono = isPaid;
        }
      }
    }

    return Array.from(activitiesMap.values());
  };

  useEffect(() => {
    fetchSocios();
    fetchScheduledClasses();
  }, [activeClubId]);

  // Search filter
  const filteredSocios = useMemo(() => {
    if (!searchQuery) return socios;
    const query = searchQuery.toLowerCase().trim();
    return socios.filter(
      (s) =>
        s.firstName.toLowerCase().includes(query) ||
        s.lastName.toLowerCase().includes(query) ||
        (s.dni && s.dni.includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.phone && s.phone.includes(query))
    );
  }, [socios, searchQuery]);

  // Add Socio
  const handleCreateSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClubId) return;

    try {
      const res = await apiFetch("/socios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...socioForm,
          clubId: activeClubId,
        }),
      });

      if (res.ok) {
        setIsCreateModalOpen(false);
        setSocioForm({
          firstName: "",
          lastName: "",
          dni: "",
          email: "",
          phone: "",
          status: "active",
        });
        fetchSocios();
      } else {
        const err = await res.json();
        alert(err.message || "Error al crear socio");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  // Edit Socio
  const handleUpdateSocio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocio) return;

    try {
      const res = await apiFetch(`/socios/${selectedSocio._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(socioForm),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        setSelectedSocio(null);
        fetchSocios();
      } else {
        const err = await res.json();
        alert(err.message || "Error al actualizar socio");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  // Delete Socio
  const handleDeleteSocio = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar a este socio?")) return;

    try {
      const res = await apiFetch(`/socios/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSocios();
      } else {
        alert("No se pudo eliminar el socio");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Register abono payment
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSocio) return;

    try {
      const res = await apiFetch(`/socios/${selectedSocio._id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: paymentForm.month,
          amount: Number(paymentForm.amount) || 0,
          status: "paid",
          paymentMethod: paymentForm.paymentMethod,
          notes: paymentForm.notes,
        }),
      });

      if (res.ok) {
        setIsPaymentModalOpen(false);
        // If history is open, refresh selected socio details
        const updatedSocio = await res.json();
        if (isHistoryModalOpen) {
          setSelectedSocio(updatedSocio);
        } else {
          setSelectedSocio(null);
        }
        fetchSocios();
      } else {
        const err = await res.json();
        alert(err.message || "Error al registrar el pago");
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión");
    }
  };

  // Delete payment
  const handleDeletePayment = async (socioId: string, month: string) => {
    if (!confirm(`¿Deseas anular el pago registrado para el mes de ${getMonthLabel(month)}?`)) return;

    try {
      const res = await apiFetch(`/socios/${socioId}/payments/${month}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const updatedSocio = await res.json();
        setSelectedSocio(updatedSocio);
        fetchSocios();
      } else {
        alert("No se pudo anular el pago");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCreateModal = () => {
    setSocioForm({
      firstName: "",
      lastName: "",
      dni: "",
      email: "",
      phone: "",
      status: "active",
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (socio: Socio) => {
    setSelectedSocio(socio);
    setSocioForm({
      firstName: socio.firstName,
      lastName: socio.lastName,
      dni: socio.dni || "",
      email: socio.email || "",
      phone: socio.phone || "",
      status: socio.status,
    });
    setIsEditModalOpen(true);
  };

  const openPaymentModal = (socio: Socio) => {
    setSelectedSocio(socio);
    setPaymentForm({
      month: getCurrentMonthString(),
      amount: "35000",
      paymentMethod: "Efectivo",
      notes: "",
    });
    setIsPaymentModalOpen(true);
  };

  const openHistoryModal = (socio: Socio) => {
    setSelectedSocio(socio);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            Gestión de Socios
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-semibold text-xs">
            Administrá el padrón de alumnos/socios y controlá sus pagos de cuotas (abono mensual) de escuelita de fútbol.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-black text-xs rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_25px_rgba(57,255,20,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Registrar Socio
        </button>
      </div>

      {/* Search Filter Bar */}
      <div className="p-4 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-md rounded-2xl border border-zinc-200 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, DNI, email o teléfono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-medium"
          />
        </div>
        <div className="hidden md:flex flex-1 justify-end text-[11px] font-bold text-zinc-500 dark:text-zinc-400 gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
            Abono al día
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
            Pendiente de pago
          </span>
        </div>
      </div>

      {/* Socio List / Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredSocios.length === 0 ? (
        <div className="text-center py-16 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl">
          <Users className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No se encontraron socios</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? "Modificá los términos de búsqueda para encontrar lo que buscás."
              : "Registrá tu primer alumno o socio para empezar a asociarlo a clases y cobrar abonos."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
                <th className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Nombre y Apellido</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">DNI</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">Abono {getMonthLabel(getCurrentMonthString())}</th>
                <th className="px-6 py-4 text-xs font-black uppercase text-zinc-500 dark:text-zinc-400 tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-zinc-900 dark:text-zinc-100">
              {filteredSocios.map((socio) => {
                const currentMonth = getCurrentMonthString();
                const currentMonthPayment = socio.payments.find((p) => p.month === currentMonth);
                const isPaid = currentMonthPayment && currentMonthPayment.status === "paid";

                return (
                  <tr key={socio._id} className="hover:bg-zinc-50/55 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4.5 font-bold text-sm">
                      <div className="flex flex-col gap-1">
                        <span>{socio.lastName}, {socio.firstName}</span>
                        {(() => {
                          const socioActivities = getSocioActivities(socio._id);
                          if (socioActivities.length > 0) {
                            return (
                              <div className="flex gap-1.5 items-center mt-0.5">
                                {socioActivities.map((act, aIdx) => (
                                  <div key={aIdx} className="relative group/tooltip flex items-center">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedActivityDetail({
                                          socioName: `${socio.firstName} ${socio.lastName}`,
                                          activityName: act.reservationType.includes("escuelita") ? "Escuelita" : "Clase Particular",
                                          courtName: act.name,
                                          teacherName: act.teacherName,
                                          sport: act.sport,
                                          time: `${new Date(act.startTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} - ${new Date(act.endTime).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
                                          day: new Date(act.startTime).toLocaleDateString("es-AR", { weekday: "long" }),
                                          paidAbono: act.paidAbono,
                                          date: new Date(act.startTime),
                                        });
                                      }}
                                      className={`w-2 h-2 rounded-full hover:scale-125 transition-all border border-black/25 cursor-pointer ${
                                        act.paidAbono 
                                          ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.45)]" 
                                          : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.45)]"
                                      }`}
                                      title={`${act.reservationType.includes("escuelita") ? "Escuelita" : "Clase Particular"} - click para ver detalles`}
                                    />
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/tooltip:block bg-zinc-900 border border-white/10 text-[9px] text-white p-1.5 rounded-lg shadow-xl whitespace-nowrap z-[9999]">
                                      <div className="font-extrabold">{act.reservationType.includes("escuelita") ? "🎓 Escuelita" : "👤 Clase Particular"}</div>
                                      <div className="text-zinc-400 mt-0.5">{act.name} - {act.teacherName}</div>
                                      <div className={`mt-1 font-black ${act.paidAbono ? "text-green-400" : "text-red-400"}`}>
                                        {act.paidAbono ? "✓ PAGADO" : "✗ DEBE"}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                      {socio.dni || "—"}
                    </td>
                    <td className="px-6 py-4.5 text-xs space-y-0.5">
                      {socio.phone && <div className="font-semibold text-zinc-700 dark:text-zinc-300">📞 {socio.phone}</div>}
                      {socio.email && <div className="text-zinc-400 dark:text-zinc-500">✉️ {socio.email}</div>}
                      {!socio.phone && !socio.email && <span className="text-zinc-400 dark:text-zinc-600">—</span>}
                    </td>
                    <td className="px-6 py-4.5">
                      {isPaid ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded-full text-[10px] font-black uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Pagado (${currentMonthPayment.amount.toLocaleString()})
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-black uppercase">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Pendiente
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-right space-x-2">
                      <button
                        onClick={() => openPaymentModal(socio)}
                        title="Cobrar Abono"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 dark:text-green-400 transition-all"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openHistoryModal(socio)}
                        title="Ver Historial de Pagos"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400 transition-all"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(socio)}
                        title="Editar Socio"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-white/5 hover:border-zinc-400 dark:hover:border-zinc-800 text-zinc-700 dark:text-zinc-300 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSocio(socio._id)}
                        title="Eliminar Socio"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE SOCIO MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Registrar Nuevo Socio
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleCreateSocio} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Nombre</label>
                  <input
                    type="text"
                    required
                    value={socioForm.firstName}
                    onChange={(e) => setSocioForm({ ...socioForm, firstName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Apellido</label>
                  <input
                    type="text"
                    required
                    value={socioForm.lastName}
                    onChange={(e) => setSocioForm({ ...socioForm, lastName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">DNI / ID</label>
                <input
                  type="text"
                  placeholder="Sin puntos ni espacios"
                  value={socioForm.dni}
                  onChange={(e) => setSocioForm({ ...socioForm, dni: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Teléfono</label>
                  <input
                    type="tel"
                    value={socioForm.phone}
                    onChange={(e) => setSocioForm({ ...socioForm, phone: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={socioForm.email}
                    onChange={(e) => setSocioForm({ ...socioForm, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl border border-zinc-200 dark:border-white/5 transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-xs"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SOCIO MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-primary" />
                Editar Datos del Socio
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <form onSubmit={handleUpdateSocio} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Nombre</label>
                  <input
                    type="text"
                    required
                    value={socioForm.firstName}
                    onChange={(e) => setSocioForm({ ...socioForm, firstName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Apellido</label>
                  <input
                    type="text"
                    required
                    value={socioForm.lastName}
                    onChange={(e) => setSocioForm({ ...socioForm, lastName: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">DNI / ID</label>
                <input
                  type="text"
                  placeholder="Sin puntos ni espacios"
                  value={socioForm.dni}
                  onChange={(e) => setSocioForm({ ...socioForm, dni: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Teléfono</label>
                  <input
                    type="tel"
                    value={socioForm.phone}
                    onChange={(e) => setSocioForm({ ...socioForm, phone: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={socioForm.email}
                    onChange={(e) => setSocioForm({ ...socioForm, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Estado</label>
                <select
                  value={socioForm.status}
                  onChange={(e) => setSocioForm({ ...socioForm, status: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl border border-zinc-200 dark:border-white/5 transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER PAYMENT MODAL */}
      {isPaymentModalOpen && selectedSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-500" />
                Registrar Pago de Abono
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="px-5 pt-4">
              <div className="p-3 bg-zinc-50 dark:bg-white/[0.01] rounded-xl border border-zinc-200 dark:border-white/5">
                <div className="text-[10px] text-zinc-400 uppercase font-black">Socio a cobrar</div>
                <div className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                  {selectedSocio.lastName}, {selectedSocio.firstName}
                </div>
                {selectedSocio.dni && <div className="text-[10px] text-zinc-500">DNI: {selectedSocio.dni}</div>}
              </div>
            </div>
            <form onSubmit={handleRegisterPayment} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    Mes a Pagar
                  </label>
                  <input
                    type="month"
                    required
                    value={paymentForm.month}
                    onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    Monto ($)
                  </label>
                  <input
                    type="number"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Método de Pago</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="MercadoPago">Mercado Pago</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Notas / Comprobante</label>
                <textarea
                  placeholder="Número de transferencia, comentarios, etc."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                />
              </div>
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl border border-zinc-200 dark:border-white/5 transition-all text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl shadow-[0_4px_15px_rgba(34,197,94,0.25)] hover:shadow-[0_4px_20px_rgba(34,197,94,0.45)] transition-all text-xs"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {isHistoryModalOpen && selectedSocio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01]">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" />
                Historial de Pagos de Abonos
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-all">
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center bg-zinc-50 dark:bg-white/[0.01] p-4 rounded-2xl border border-zinc-200 dark:border-white/5">
                <div>
                  <div className="text-sm font-black text-zinc-800 dark:text-zinc-100">
                    {selectedSocio.lastName}, {selectedSocio.firstName}
                  </div>
                  {selectedSocio.dni && <div className="text-xs text-zinc-500">DNI: {selectedSocio.dni}</div>}
                </div>
                <button
                  onClick={() => {
                    setPaymentForm({
                      month: getCurrentMonthString(),
                      amount: "35000",
                      paymentMethod: "Efectivo",
                      notes: "",
                    });
                    setIsPaymentModalOpen(true);
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-black text-xs rounded-xl transition-all shadow-md"
                >
                  Registrar Cobro
                </button>
              </div>

              {selectedSocio.payments.length === 0 ? (
                <div className="text-center py-10 text-zinc-400 dark:text-zinc-600 font-semibold text-xs">
                  No hay pagos registrados para este socio.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto border border-zinc-200 dark:border-white/5 rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] text-[10px] uppercase font-black text-zinc-400">
                        <th className="px-4 py-3">Mes Abono</th>
                        <th className="px-4 py-3">Monto</th>
                        <th className="px-4 py-3">Método</th>
                        <th className="px-4 py-3">Fecha Cobro</th>
                        <th className="px-4 py-3">Notas</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-white/5 text-xs">
                      {[...selectedSocio.payments]
                        .sort((a, b) => b.month.localeCompare(a.month))
                        .map((payment, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.01]">
                            <td className="px-4 py-3 font-bold">{getMonthLabel(payment.month)}</td>
                            <td className="px-4 py-3 font-semibold text-green-500">${payment.amount.toLocaleString()}</td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-medium">{payment.paymentMethod || "—"}</td>
                            <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 font-medium">
                              {new Date(payment.paymentDate).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-4 py-3 text-zinc-400 font-medium truncate max-w-[120px]" title={payment.notes}>
                              {payment.notes || "—"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleDeletePayment(selectedSocio._id, payment.month)}
                                className="text-red-400 hover:text-red-300 font-black hover:underline"
                              >
                                Anular
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-800 font-bold rounded-xl text-xs transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-zinc-950/95 border border-white/10 rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <button
              onClick={() => setSelectedActivityDetail(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 hover:bg-white/5 rounded-lg border border-white/5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>

              <div>
                <h3 className="text-base font-black text-white">{selectedActivityDetail.socioName}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Detalle de Actividad</p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Disciplina:</span>
                  <span className="font-bold text-white capitalize">{selectedActivityDetail.sport}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Tipo:</span>
                  <span className="font-bold text-white">{selectedActivityDetail.activityName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Cancha:</span>
                  <span className="font-bold text-white">{selectedActivityDetail.courtName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Profesor:</span>
                  <span className="font-bold text-white">{selectedActivityDetail.teacherName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400 font-medium">Horario:</span>
                  <span className="font-bold text-white capitalize">{selectedActivityDetail.day} {selectedActivityDetail.time} hs</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between p-3 bg-zinc-900/60 rounded-xl border border-white/5">
                  <div className="text-left">
                    <span className="text-[10px] text-zinc-450 block">Estado del Abono</span>
                    <span className={`text-xs font-black block mt-0.5 ${selectedActivityDetail.paidAbono ? "text-green-400" : "text-red-400"}`}>
                      {selectedActivityDetail.paidAbono ? "✓ PAGADO (Al día)" : "✗ DEBE (Impago)"}
                    </span>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-450 block">Vencimiento</span>
                    <span className="text-[10px] font-bold text-zinc-300 block mt-0.5">
                      1 al 10 de {selectedActivityDetail.date.toLocaleDateString("es-AR", { month: "long" })}
                    </span>
                    {!selectedActivityDetail.paidAbono && new Date().getDate() > 10 && (
                      <span className="text-[9px] font-black text-red-500 uppercase tracking-wider block mt-1 animate-pulse">Vencido</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedActivityDetail(null)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl border border-white/5 text-xs transition-all cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
