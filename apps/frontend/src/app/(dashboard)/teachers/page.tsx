"use client";

import { useEffect, useState } from "react";
import { useClub } from "@/providers/ClubProvider";
import { apiFetch } from "@/lib/api";
import type { Teacher, Court, AvailabilitySlot } from "@/lib/types";
import {
  GraduationCap,
  UserPlus,
  Edit2,
  Trash2,
  Clock,
  Calendar,
  X,
  Plus,
  Users,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function TeachersPage() {
  const { activeClubId } = useClub();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"manage" | "booking">("manage");

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
  const [teacherAvailability, setTeacherAvailability] = useState<AvailabilitySlot[]>([]);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: "09:00", endTime: "18:00" });

  // Class Booking Form state
  const [bookingSport, setBookingSport] = useState<"padel" | "football">("padel");
  const [bookingTeacherId, setBookingTeacherId] = useState("");
  const [bookingDate, setBookingDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [bookingStartTime, setBookingStartTime] = useState("18:00");
  const [bookingEndTime, setBookingEndTime] = useState("19:00");
  const [bookingCourtId, setBookingCourtId] = useState("");
  const [bookingPaymentStatus, setBookingPaymentStatus] = useState<"pending" | "paid">("pending");
  const [bookingActivityType, setBookingActivityType] = useState<"clase" | "escuelita">("clase");
  const [bookingStudents, setBookingStudents] = useState<
    Array<{ firstName: string; lastName: string; phone?: string; email?: string; paidAbono?: boolean }>
  >([{ firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
  const [bookingIsRecurring, setBookingIsRecurring] = useState(false);
  const [bookingRecurrenceWeeks, setBookingRecurrenceWeeks] = useState(12);

  // Enforce escuelita rules
  useEffect(() => {
    if (bookingActivityType === "escuelita") {
      setBookingIsRecurring(true);
      setBookingRecurrenceWeeks(12);
      if (bookingStartTime) {
        const [h, m] = bookingStartTime.split(":");
        const newHour = (parseInt(h) + 1) % 24;
        setBookingEndTime(`${String(newHour).padStart(2, "0")}:${m}`);
      }
    }
  }, [bookingActivityType, bookingStartTime]);



  const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);

  useEffect(() => {
    if (activeClubId) {
      fetchTeachers();
    }
  }, [activeClubId]);

  // Load available courts when booking parameters change
  useEffect(() => {
    if (activeClubId && bookingDate && bookingStartTime && bookingEndTime) {
      fetchAvailableCourts();
    }
  }, [activeClubId, bookingDate, bookingStartTime, bookingEndTime, bookingSport]);

  // Reset booking teacher when sport changes
  useEffect(() => {
    const sportFilteredTeachers = teachers.filter(
      (t) => t.sport === bookingSport && t.isActive
    );
    if (sportFilteredTeachers.length > 0) {
      setBookingTeacherId(sportFilteredTeachers[0]._id);
    } else {
      setBookingTeacherId("");
    }
    setBookingCourtId("");
  }, [bookingSport, teachers]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/teachers?clubId=${activeClubId}`);
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourts = async () => {
    setCourtsLoading(true);
    try {
      const startIso = new Date(`${bookingDate}T${bookingStartTime}:00.000-03:00`).toISOString();
      const endIso = new Date(`${bookingDate}T${bookingEndTime}:00.000-03:00`).toISOString();

      const res = await apiFetch(
        `/public/courts/available?startTime=${startIso}&endTime=${endIso}&clubId=${activeClubId}`
      );
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((c: any) => c.sport === bookingSport && c.isActive);
        setAvailableCourts(filtered);
        if (filtered.length > 0) {
          setBookingCourtId(filtered[0]._id);
        } else {
          setBookingCourtId("");
        }
      }
    } catch (err) {
      console.error("Error fetching available courts:", err);
    } finally {
      setCourtsLoading(false);
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
      setTeacherAvailability(teacher.availability || []);
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
      setTeacherAvailability([]);
    }
    setNewSlot({ dayOfWeek: 1, startTime: "09:00", endTime: "18:00" });
    setIsModalOpen(true);
  };

  const handleAddAvailabilitySlot = () => {
    if (!newSlot.startTime || !newSlot.endTime) return;
    if (newSlot.startTime >= newSlot.endTime) {
      alert("La hora de inicio debe ser menor que la hora de fin.");
      return;
    }
    // Check duplication
    const isDuplicate = teacherAvailability.some(
      (s) =>
        s.dayOfWeek === newSlot.dayOfWeek &&
        s.startTime === newSlot.startTime &&
        s.endTime === newSlot.endTime
    );
    if (isDuplicate) {
      alert("Este horario ya está configurado.");
      return;
    }
    setTeacherAvailability((prev) => [...prev, { ...newSlot }].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
  };

  const handleRemoveAvailabilitySlot = (index: number) => {
    setTeacherAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClubId) return;

    const payload = {
      ...formData,
      pricePerHour: Number(formData.pricePerHour) || 0,
      clubId: activeClubId,
      availability: teacherAvailability,
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
        const errorData = await res.json();
        alert(errorData.message || "Ocurrió un error al guardar el profesor.");
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

  // Student list row handlers
  const handleAddStudentRow = () => {
    setBookingStudents((prev) => [...prev, { firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
  };

  const handleRemoveStudentRow = (index: number) => {
    if (bookingStudents.length === 1) return;
    setBookingStudents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStudentChange = (index: number, field: string, value: any) => {
    setBookingStudents((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleBookClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCourtId || !bookingTeacherId) {
      alert("Por favor completá los campos de Cancha y Profesor.");
      return;
    }

    const validStudents = bookingStudents.filter((s) => s.firstName.trim() && s.lastName.trim());
    if (validStudents.length === 0) {
      alert("Debes agregar al menos un alumno con nombre y apellido.");
      return;
    }

    setBookingSubmitting(true);

    const startIso = new Date(`${bookingDate}T${bookingStartTime}:00.000-03:00`).toISOString();
    const endIso = new Date(`${bookingDate}T${bookingEndTime}:00.000-03:00`).toISOString();
    const durationHours =
      (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60);

    const teacherObj = teachers.find((t) => t._id === bookingTeacherId);
    const teacherPrice = Math.round(durationHours * (teacherObj?.pricePerHour || 0));

    // Map first student as main contact for notification systems
    const primaryStudent = validStudents[0];

    const payload = {
      courtId: bookingCourtId,
      startTime: startIso,
      endTime: endIso,
      reservationType:
        bookingSport === "padel"
          ? (bookingActivityType === "escuelita" ? "escuelita_padel" : "clase_particular_padel")
          : (bookingActivityType === "escuelita" ? "escuelita_futbol" : "clase_particular_futbol"),
      teacherId: bookingTeacherId,
      teacherPrice,
      paymentStatus: bookingSport === "football" ? "pending" : bookingPaymentStatus,
      status: bookingSport === "football" ? "pending" : (bookingPaymentStatus === "paid" ? "confirmed" : "pending"),
      depositAmount: bookingSport === "football" ? 0 : (bookingPaymentStatus === "paid" ? undefined : 0),
      firstName: primaryStudent.firstName,
      lastName: primaryStudent.lastName,
      email: primaryStudent.email || undefined,
      phone: primaryStudent.phone || undefined,
      students: validStudents,
      isRecurring: bookingIsRecurring,
      recurrenceWeeks: bookingIsRecurring ? bookingRecurrenceWeeks : undefined,
    };

    try {
      const res = await apiFetch("/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("¡Clase reservada con éxito!");
        // Reset booking form state
        setBookingStudents([{ firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
        setBookingIsRecurring(false);
        setBookingRecurrenceWeeks(12);
        fetchAvailableCourts();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Error al crear la reserva de la clase.");
      }

    } catch (err) {
      console.error(err);
      alert("Error de conexión.");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const getTeacherAvailabilitySlots = (teacherId: string) => {
    const t = teachers.find((x) => x._id === teacherId);
    return t?.availability || [];
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <span className="w-2.5 h-8 bg-primary rounded-full shadow-[0_0_12px_rgba(57,255,20,0.5)]" />
            Profesores y Clases
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Administrá la disponibilidad de tus profesores y agendá sus clases directamente.
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
          onClick={() => setActiveTab("booking")}
          className={`px-5 py-3 text-sm font-black transition-all duration-300 relative ${
            activeTab === "booking"
              ? "text-primary border-b-2 border-primary"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Reservar Clase
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
                className="relative bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-primary/30 transition-all duration-300 group overflow-hidden flex flex-col justify-between"
              >
                <div>
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

                    {/* Availability Slots Display */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-white/5">
                      <span className="font-semibold block text-zinc-400 mb-1">Horarios:</span>
                      {teacher.availability && teacher.availability.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.availability.map((slot, idx) => {
                            const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                            return (
                              <span
                                key={idx}
                                className="inline-block bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded px-1.5 py-0.5 text-[9px] font-bold text-zinc-600 dark:text-zinc-300"
                              >
                                {days[slot.dayOfWeek]} {slot.startTime}-{slot.endTime}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500 italic">Disponibilidad total (24/7)</span>
                      )}
                    </div>
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

      {/* Tab CONTENT: Book Class Wizard */}
      {!loading && activeTab === "booking" && (
        <form
          onSubmit={handleBookClass}
          className="max-w-4xl mx-auto bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden p-6 space-y-6"
        >
          <div className="border-b border-zinc-200 dark:border-white/5 pb-4 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Asistente de Reserva de Clase
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Seleccioná un profesor disponible en el horario requerido, definí la cancha y registrá a los alumnos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg transition-all"
              title="Cerrar Asistente"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Main Details */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Disciplina</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingSport("padel")}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-black transition-all ${
                      bookingSport === "padel"
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                        : "border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                    }`}
                  >
                    🏸 Pádel
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingSport("football")}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-black transition-all ${
                      bookingSport === "football"
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                        : "border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                    }`}
                  >
                    ⚽ Fútbol
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Tipo de Actividad</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingActivityType("clase")}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-black transition-all ${
                      bookingActivityType === "clase"
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                        : "border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                    }`}
                  >
                    Clase Particular
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingActivityType("escuelita")}
                    className={`py-2.5 px-4 rounded-xl border text-sm font-black transition-all ${
                      bookingActivityType === "escuelita"
                        ? "bg-primary/10 border-primary text-primary shadow-[0_0_12px_rgba(57,255,20,0.15)]"
                        : "border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                    }`}
                  >
                    Escuelita
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Profesor</label>
                <select
                  required
                  value={bookingTeacherId}
                  onChange={(e) => setBookingTeacherId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                >
                  <option value="" disabled className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">-- Seleccioná un profesor --</option>
                  {teachers
                    .filter((t) => t.sport === bookingSport && t.isActive)
                    .map((t) => (
                      <option key={t._id} value={t._id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                        {t.name} (${t.pricePerHour.toLocaleString("es-AR")}/hs)
                      </option>
                    ))}
                </select>

                {/* Display selected teacher's agenda */}
                {bookingTeacherId && (() => {
                  const slots = getTeacherAvailabilitySlots(bookingTeacherId);
                  return (
                    <div className="mt-2 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-xl p-3">
                      <span className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 block mb-1">
                        📅 Horarios disponibles del profesor:
                      </span>
                      {slots.length === 0 ? (
                        <span className="text-xs text-zinc-500 italic">Disponibilidad total (24/7)</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {slots.map((s, i) => {
                            const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                            return (
                              <span
                                key={i}
                                className="inline-block bg-primary/10 border border-primary/20 text-primary rounded px-2 py-0.5 text-[10px] font-bold"
                              >
                                {days[s.dayOfWeek]} {s.startTime} a {s.endTime} hs
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Fecha</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={bookingEndTime}
                    disabled={bookingActivityType === "escuelita"}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cancha</label>
                <div className="relative">
                  <select
                    required
                    value={bookingCourtId}
                    onChange={(e) => setBookingCourtId(e.target.value)}
                    disabled={courtsLoading || availableCourts.length === 0}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold disabled:opacity-50"
                  >
                    {courtsLoading ? (
                      <option className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Buscando canchas libres...</option>
                    ) : availableCourts.length === 0 ? (
                      <option className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Sin canchas libres para el horario/disciplina seleccionado</option>
                    ) : (
                      availableCourts.map((c) => (
                        <option key={c._id} value={c._id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                          {c.name} {c.isCovered ? "(Techada)" : "(Descubierta)"} - ${c.pricePerHour.toLocaleString("es-AR")}/hs
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {bookingSport !== "football" && (
                <div className="space-y-1.5 animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Estado de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingPaymentStatus("pending")}
                      className={`py-2.5 px-4 rounded-xl border text-sm font-black transition-all ${
                        bookingPaymentStatus === "pending"
                          ? "bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          : "border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                      }`}
                    >
                      Debe (Pendiente)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingPaymentStatus("paid")}
                      className={`py-2.5 px-4 rounded-xl border text-sm font-black transition-all ${
                        bookingPaymentStatus === "paid"
                          ? "bg-green-500/10 border-green-500 text-green-500 shadow-[0_0_12px_rgba(34,197,94,0.15)]"
                          : "border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10"
                      }`}
                    >
                      Abonado (Pagado)
                    </button>
                  </div>
                </div>
              )}

              {/* Recurrence Switcher & Dropdown */}
              <div className="space-y-3.5 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Repetir clase semanalmente (Turno Fijo)</span>
                    <span className="text-[10px] text-zinc-500">Bloquea la cancha y el profesor en las siguientes semanas</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingIsRecurring}
                      disabled={bookingActivityType === "escuelita"}
                      onChange={(e) => setBookingIsRecurring(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black"></div>
                  </label>
                </div>

                {bookingIsRecurring && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200/80 dark:border-white/5 animate-in fade-in duration-200">
                    <label className="text-xs font-semibold text-zinc-400 font-bold">Duración de la recurrencia</label>
                    <select
                      value={bookingRecurrenceWeeks}
                      disabled={bookingActivityType === "escuelita"}
                      onChange={(e) => setBookingRecurrenceWeeks(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-bold"
                    >
                      <option value={4} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">4 Semanas (1 Mes)</option>
                      <option value={8} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">8 Semanas (2 Meses)</option>
                      <option value={12} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">12 Semanas (3 Meses - Recomendado)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>


            {/* Right Column - Students List */}
            <div className="space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-2">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  Alumnos Inscritos ({bookingStudents.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddStudentRow}
                  className="text-xs font-black text-primary flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar Alumno
                </button>
              </div>

              <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
                {bookingStudents.map((student, idx) => (
                  <div
                    key={idx}
                    className="relative p-4 bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-xl space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-primary tracking-wider">
                        Alumno #{idx + 1} {idx === 0 ? "(Contacto Principal)" : ""}
                      </span>
                      {bookingStudents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStudentRow(idx)}
                          className="text-[10px] font-bold text-red-400 hover:text-red-350"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre"
                        required
                        value={student.firstName}
                        onChange={(e) => handleStudentChange(idx, "firstName", e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Apellido"
                        required
                        value={student.lastName}
                        onChange={(e) => handleStudentChange(idx, "lastName", e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="tel"
                        placeholder="Teléfono"
                        value={student.phone || ""}
                        onChange={(e) => handleStudentChange(idx, "phone", e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-medium"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={student.email || ""}
                        onChange={(e) => handleStudentChange(idx, "email", e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-medium"
                      />
                    </div>

                    {bookingSport === "football" && (
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-200/50 dark:border-white/5 mt-1.5 animate-in fade-in duration-200">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                          Abono Mensual
                        </span>
                        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-900/50 p-0.5 rounded-lg border border-zinc-200 dark:border-white/5">
                          <button
                            type="button"
                            onClick={() => handleStudentChange(idx, "paidAbono", false)}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                              !student.paidAbono
                                ? "bg-amber-500/15 text-amber-500 border border-amber-500/20 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            Debe
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudentChange(idx, "paidAbono", true)}
                            className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition-all ${
                              student.paidAbono
                                ? "bg-green-500/15 text-green-400 border border-green-500/20 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-300"
                            }`}
                          >
                            Pagado
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions / Summary */}
          <div className="border-t border-zinc-200 dark:border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Price details summary */}
            {(() => {
              const start = new Date(`${bookingDate}T${bookingStartTime}:00.000-03:00`);
              const end = new Date(`${bookingDate}T${bookingEndTime}:00.000-03:00`);
              const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

              const teacherObj = teachers.find((t) => t._id === bookingTeacherId);
              const selectedCourtObj = availableCourts.find((c) => c._id === bookingCourtId);

              const validDuration = !isNaN(durationHours) && durationHours > 0;
              const courtPrice = validDuration && selectedCourtObj ? Math.round(durationHours * selectedCourtObj.pricePerHour) : 0;
              const teacherPrice = validDuration && teacherObj ? Math.round(durationHours * teacherObj.pricePerHour) : 0;
              const total = teacherPrice;

              return (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 flex flex-wrap gap-x-6 gap-y-1.5">
                  <div>
                    Cancha: <strong className="text-zinc-400 italic font-bold">Incluida en la clase</strong>
                  </div>
                  <div>
                    Valor Clase: <strong className="text-zinc-900 dark:text-white">${teacherPrice.toLocaleString("es-AR")}</strong>
                  </div>
                  <div className="text-sm">
                    Total a pagar: <strong className="text-primary font-black text-base">${total.toLocaleString("es-AR")}</strong>
                  </div>
                </div>
              );

            })()}

            <button
              type="submit"
              disabled={bookingSubmitting || courtsLoading || !bookingCourtId || !bookingTeacherId}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-black font-extrabold rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {bookingSubmitting ? "Creando Reserva..." : "Reservar Clase"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* CRUD Modal dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
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
                    <option value="padel" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Pádel</option>
                    <option value="football" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Fútbol</option>
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

              {/* Teacher Availability slots configuration */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-white/5">
                <label className="text-xs font-black text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Configurar Agenda de Disponibilidad
                </label>
                
                <div className="flex gap-2 items-center bg-zinc-50 dark:bg-white/5 p-3 rounded-xl border border-zinc-200 dark:border-white/5">
                  <select
                    value={newSlot.dayOfWeek}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, dayOfWeek: Number(e.target.value) }))}
                    className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white font-bold"
                  >
                    <option value={1} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Lunes</option>
                    <option value={2} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Martes</option>
                    <option value={3} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Miércoles</option>
                    <option value={4} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Jueves</option>
                    <option value={5} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Viernes</option>
                    <option value={6} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Sábado</option>
                    <option value={0} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Domingo</option>
                  </select>

                  <input
                    type="time"
                    value={newSlot.startTime}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-20 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white font-bold"
                  />
                  <span className="text-zinc-400 text-xs">a</span>
                  <input
                    type="time"
                    value={newSlot.endTime}
                    onChange={(e) => setNewSlot((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-20 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2 py-1 text-xs text-zinc-900 dark:text-white font-bold"
                  />

                  <button
                    type="button"
                    onClick={handleAddAvailabilitySlot}
                    className="px-3 py-1.5 bg-primary text-black font-extrabold text-xs rounded-lg hover:scale-105 transition-all"
                  >
                    Agregar
                  </button>
                </div>

                {/* Slots List */}
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {teacherAvailability.length === 0 ? (
                    <span className="text-xs text-zinc-500 italic block py-2">
                      Sin horarios semanales definidos (disponible en cualquier horario).
                    </span>
                  ) : (
                    teacherAvailability.map((slot, index) => {
                      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-lg bg-zinc-100/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 text-xs"
                        >
                          <span className="font-bold text-zinc-800 dark:text-zinc-200">
                            {days[slot.dayOfWeek]}: {slot.startTime} a {slot.endTime} hs
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAvailabilitySlot(index)}
                            className="text-[10px] font-bold text-red-400 hover:text-red-300"
                          >
                            Eliminar
                          </button>
                        </div>
                      );
                    })
                  )}
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
