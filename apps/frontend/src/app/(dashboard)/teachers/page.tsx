"use client";

import { useEffect, useState, useMemo } from "react";
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
  Search,
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
    Array<{ firstName: string; lastName: string; phone?: string; email?: string; paidAbono?: boolean; socioId?: string }>
  >([{ firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
  const [bookingIsRecurring, setBookingIsRecurring] = useState(false);
  const [bookingRecurrenceWeeks, setBookingRecurrenceWeeks] = useState(12);

  // Autocomplete search for socios
  const [socioSearchResults, setSocioSearchResults] = useState<{ [key: number]: any[] }>({});
  const [activeSearchIdx, setActiveSearchIdx] = useState<number | null>(null);

  const getCurrentMonthString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  const searchSociosForStudent = async (index: number, query: string) => {
    if (!activeClubId) return;
    if (!query || query.trim().length < 2) {
      setSocioSearchResults(prev => ({ ...prev, [index]: [] }));
      return;
    }

    try {
      const res = await apiFetch(`/socios?clubId=${activeClubId}&search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSocioSearchResults(prev => ({ ...prev, [index]: data }));
      }
    } catch (err) {
      console.error("Error searching socios:", err);
    }
  };

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

  // Drag and drop / Board states
  const [scheduledClasses, setScheduledClasses] = useState<any[]>([]);
  const [socios, setSocios] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [sociosLoading, setSociosLoading] = useState(false);
  const [dragOverClassId, setDragOverClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);

  // New Search Filters for Clases Programadas
  const [searchFilterActivity, setSearchFilterActivity] = useState<"all" | "escuelita" | "clase">("all");
  const [searchFilterTeacherId, setSearchFilterTeacherId] = useState<string>("");
  const [searchFilterDate, setSearchFilterDate] = useState<string>("");
  const [searchFilterTime, setSearchFilterTime] = useState<string>("");
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (activeClubId) {
      fetchTeachers();
      fetchScheduledClasses();
      fetchSocios();
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

  const fetchScheduledClasses = async () => {
    if (!activeClubId) return;
    setClassesLoading(true);
    try {
      const res = await apiFetch(`/reservations?clubId=${activeClubId}&type=class`);
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((r: any) =>
          r.reservationType &&
          (r.reservationType.startsWith("escuelita_") || r.reservationType.startsWith("clase_particular_")) &&
          r.status !== "cancelled"
        );
        setScheduledClasses(filtered);
      }
    } catch (err) {
      console.error("Error fetching scheduled classes:", err);
    } finally {
      setClassesLoading(false);
    }
  };

  const fetchSocios = async () => {
    if (!activeClubId) return;
    setSociosLoading(true);
    try {
      const res = await apiFetch(`/socios?clubId=${activeClubId}`);
      if (res.ok) {
        const data = await res.json();
        setSocios(data.filter((s: any) => s.status === "active"));
      }
    } catch (err) {
      console.error("Error fetching socios:", err);
    } finally {
      setSociosLoading(false);
    }
  };

  const quickAssignSocio = async (socio: any, classId: string) => {
    const cls = scheduledClasses.find(c => c._id === classId);
    if (!cls) return;
    
    const exists = cls.students?.some((s: any) => s.socioId === socio._id);
    if (exists) {
      alert(`El socio ${socio.firstName} ${socio.lastName} ya está inscrito en esta clase.`);
      return;
    }
    
    const currentMonthStr = getCurrentMonthString();
    const isPaid = socio.payments?.some((p: any) => p.month === currentMonthStr && p.status === "paid");
    
    const newStudent = {
      firstName: socio.firstName,
      lastName: socio.lastName,
      email: socio.email || "",
      phone: socio.phone || "",
      paidAbono: isPaid,
      socioId: socio._id,
    };
    
    const updatedStudents = [...(cls.students || []), newStudent];
    
    try {
      const res = await apiFetch(`/reservations/${classId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: updatedStudents,
          firstName: cls.students?.length === 0 ? socio.firstName : cls.firstName,
          lastName: cls.students?.length === 0 ? socio.lastName : cls.lastName,
          email: cls.students?.length === 0 ? (socio.email || undefined) : cls.email,
          phone: cls.students?.length === 0 ? (socio.phone || undefined) : cls.phone,
        }),
      });
      if (res.ok) {
        fetchScheduledClasses();
      } else {
        alert("Error al inscribir al socio.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDropSocio = async (e: React.DragEvent, classId: string) => {
    e.preventDefault();
    setDragOverClassId(null);
    const socioId = e.dataTransfer.getData("text/plain");
    if (!socioId) return;
    
    const socio = socios.find(s => s._id === socioId);
    if (!socio) return;
    
    await quickAssignSocio(socio, classId);
  };

  const handleToggleStudentAbono = async (cls: any, studentIndex: number, newPaidState: boolean) => {
    const updatedStudents = cls.students.map((student: any, i: number) =>
      i === studentIndex ? { ...student, paidAbono: newPaidState } : student
    );
    
    const student = cls.students[studentIndex];
    
    try {
      const res = await apiFetch(`/reservations/${cls._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: updatedStudents }),
      });
      
      if (res.ok) {
        if (student.socioId) {
          const currentMonthStr = getCurrentMonthString();
          if (newPaidState) {
            await apiFetch(`/socios/${student.socioId}/payments`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                month: currentMonthStr,
                amount: 35000,
                status: "paid",
                paymentMethod: "Efectivo",
                notes: "Registrado desde el tablero de clases",
              }),
            });
          } else {
            await apiFetch(`/socios/${student.socioId}/payments/${currentMonthStr}`, {
              method: "DELETE",
            });
          }
          fetchSocios();
        }
        fetchScheduledClasses();
      } else {
        alert("Error al actualizar abono del alumno.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveStudentFromClass = async (cls: any, studentIndex: number) => {
    if (!confirm("¿Deseas desinscribir a este alumno de la clase?")) return;
    
    const updatedStudents = cls.students.filter((_: any, i: number) => i !== studentIndex);
    
    try {
      const res = await apiFetch(`/reservations/${cls._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: updatedStudents }),
      });
      if (res.ok) {
        fetchScheduledClasses();
      } else {
        alert("Error al remover al alumno.");
      }
    } catch (err) {
      console.error(err);
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

    const validStudents = bookingStudents.filter((s) => s.firstName && s.firstName.trim() && s.lastName && s.lastName.trim());
    const primaryStudent = validStudents[0] || { firstName: "Clase", lastName: "Programada", email: "", phone: "" };

    setBookingSubmitting(true);

    const startIso = new Date(`${bookingDate}T${bookingStartTime}:00.000-03:00`).toISOString();
    const endIso = new Date(`${bookingDate}T${bookingEndTime}:00.000-03:00`).toISOString();
    const durationHours =
      (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60);

    const teacherObj = teachers.find((t) => t._id === bookingTeacherId);
    const teacherPrice = Math.round(durationHours * (teacherObj?.pricePerHour || 0));

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
        setBookingStudents([{ firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
        setBookingIsRecurring(true);
        setBookingRecurrenceWeeks(12);
        setIsNewClassModalOpen(false);
        fetchScheduledClasses();
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

  // Filter scheduled classes based on search filters
  const filteredClasses = useMemo(() => {
    if (!hasSearched) return [];

    return scheduledClasses.filter((c) => {
      // 1. Activity filter
      if (searchFilterActivity !== "all") {
        const isEscuelita = c.reservationType?.includes("escuelita");
        if (searchFilterActivity === "escuelita" && !isEscuelita) return false;
        if (searchFilterActivity === "clase" && isEscuelita) return false;
      }

      // 2. Teacher filter
      if (searchFilterTeacherId) {
        const teacherId = typeof c.teacherId === "object" ? c.teacherId?._id : c.teacherId;
        if (teacherId !== searchFilterTeacherId) return false;
      }

      // 3. Date filter
      if (searchFilterDate) {
        const d = new Date(c.startTime);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const classDateStr = `${year}-${month}-${day}`;
        if (classDateStr !== searchFilterDate) return false;
      }

      // 4. Time filter
      if (searchFilterTime) {
        const d = new Date(c.startTime);
        const classTimeStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        if (classTimeStr !== searchFilterTime) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [scheduledClasses, hasSearched, searchFilterActivity, searchFilterTeacherId, searchFilterDate, searchFilterTime]);

  // Suggest teacher availability slots if no scheduled classes are found
  const teacherSuggestions = useMemo(() => {
    if (!hasSearched || !searchFilterTeacherId) return [];
    const teacher = teachers.find((t) => t._id === searchFilterTeacherId);
    if (!teacher || !teacher.availability || teacher.availability.length === 0) return [];

    if (searchFilterDate) {
      const parts = searchFilterDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayOfWeek = d.getDay(); // 0: Sunday, 1: Monday, etc.

      const slots = teacher.availability.filter((slot) => slot.dayOfWeek === dayOfWeek);
      return slots.map((s) => ({
        teacher,
        slot: s,
        date: searchFilterDate,
      }));
    }

    return teacher.availability.map((s) => ({
      teacher,
      slot: s,
      date: null,
    }));
  }, [hasSearched, searchFilterTeacherId, searchFilterDate, teachers]);

  // Filter socios based on search query
  const filteredSocios = useMemo(() => {
    if (!searchQuery) return socios;
    const q = searchQuery.toLowerCase().trim();
    return socios.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        (s.dni && s.dni.includes(q))
    );
  }, [socios, searchQuery]);

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

      {/* Tab CONTENT: Book Class Drag-and-Drop Board */}
      {!loading && activeTab === "booking" && (
        <div className="space-y-6">
          {/* Header controls for Board */}
          <div className="p-5 bg-white/70 dark:bg-zinc-950/45 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-white/5 space-y-4 shadow-sm">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Buscador de Clases</h3>
              <p className="text-[11px] text-zinc-500">Filtrá por tipo, profesor, día u horario para encontrar la clase programada.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-end">
              {/* Activity Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Actividad</label>
                <select
                  value={searchFilterActivity}
                  onChange={(e) => setSearchFilterActivity(e.target.value as any)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold font-sans"
                >
                  <option value="all">Todas</option>
                  <option value="escuelita">🎓 Escuelitas</option>
                  <option value="clase">👤 Clases Particulares</option>
                </select>
              </div>

              {/* Teacher Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Profesor</label>
                <select
                  value={searchFilterTeacherId}
                  onChange={(e) => setSearchFilterTeacherId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold font-sans"
                >
                  <option value="">Todos</option>
                  {teachers.filter(t => t.isActive).map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Fecha</label>
                <input
                  type="date"
                  value={searchFilterDate}
                  onChange={(e) => setSearchFilterDate(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold dark:[color-scheme:dark]"
                />
              </div>

              {/* Time Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 block">Horario (Inicio)</label>
                <input
                  type="time"
                  value={searchFilterTime}
                  onChange={(e) => setSearchFilterTime(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold dark:[color-scheme:dark]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setHasSearched(true)}
                  className="flex-1 px-4 py-2.5 bg-primary text-black font-black text-xs rounded-xl shadow-[0_4px_12px_rgba(57,255,20,0.15)] hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Buscar
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setSearchFilterActivity("all");
                    setSearchFilterTeacherId("");
                    setSearchFilterDate("");
                    setSearchFilterTime("");
                    setHasSearched(false);
                  }}
                  className="px-3 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs rounded-xl border border-zinc-200 dark:border-white/5 cursor-pointer"
                  title="Limpiar Filtros"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left/Middle: Scheduled Classes List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Clases Programadas ({filteredClasses.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingStudents([{ firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
                      setBookingIsRecurring(true);
                      setBookingRecurrenceWeeks(12);
                      setIsNewClassModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-primary text-black font-extrabold text-[10px] rounded-lg shadow-[0_2px_8px_rgba(57,255,20,0.15)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Programar Clase
                  </button>
                </div>
                <span className="text-[10px] text-zinc-500 font-bold hidden sm:inline">Arrastrá un socio de la derecha para inscribir</span>
              </div>

              {classesLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !hasSearched ? (
                <div className="text-center py-16 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl">
                  <Search className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Buscador de Clases</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">Ingresá los filtros en el panel superior y hacé click en "Buscar" para visualizar las clases programadas.</p>
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="text-center py-12 bg-white/40 dark:bg-zinc-950/20 backdrop-blur-md border border-zinc-200 dark:border-white/5 rounded-2xl space-y-4 animate-in fade-in duration-205">
                  <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">No hay clases programadas</h4>
                    <p className="text-[11px] text-zinc-500 mt-1">No se encontraron clases programadas que coincidan con la búsqueda.</p>
                  </div>
                  
                  {teacherSuggestions.length > 0 && (
                    <div className="max-w-md mx-auto p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                      <h5 className="text-[11px] font-black text-primary uppercase tracking-wider">Horarios sugeridos de disponibilidad del profesor</h5>
                      <div className="space-y-2">
                        {teacherSuggestions.slice(0, 3).map((sugg, sIdx) => {
                          const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
                          const dayName = days[sugg.slot.dayOfWeek];
                          
                          return (
                            <div key={sIdx} className="flex items-center justify-between bg-zinc-900/40 p-2.5 rounded-lg border border-white/5 text-xs text-left">
                              <div>
                                <span className="font-bold text-white block">
                                  {sugg.date ? `${dayName} (${sugg.date.split('-').reverse().slice(0, 2).join('/')})` : `Todos los ${dayName}`}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  Horario: {sugg.slot.startTime} a {sugg.slot.endTime} hs
                                </span>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  setBookingTeacherId(sugg.teacher._id);
                                  setBookingSport(sugg.teacher.sport as any);
                                  setBookingDate(sugg.date || new Date().toISOString().split("T")[0]);
                                  setBookingStartTime(sugg.slot.startTime);
                                  setBookingEndTime(sugg.slot.endTime);
                                  setBookingStudents([{ firstName: "", lastName: "", phone: "", email: "", paidAbono: false }]);
                                  setBookingIsRecurring(true);
                                  setBookingRecurrenceWeeks(12);
                                  setIsNewClassModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-primary text-black font-extrabold text-[10px] rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer animate-in fade-in"
                              >
                                Programar
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredClasses.map((cls) => {
                    const isOver = dragOverClassId === cls._id;
                    const dateFormatted = new Date(cls.startTime).toLocaleDateString("es-AR", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const timeFormatted = `${new Date(cls.startTime).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} - ${new Date(cls.endTime).toLocaleTimeString("es-AR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`;

                    return (
                      <div
                        key={cls._id}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={() => setDragOverClassId(cls._id)}
                        onDragLeave={() => setDragOverClassId(null)}
                        onDrop={(e) => handleDropSocio(e, cls._id)}
                        className={`bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all duration-300 min-h-[260px] ${
                          isOver
                            ? "border-primary bg-primary/5 shadow-[0_0_15px_rgba(57,255,20,0.15)] scale-[1.01]"
                            : "border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10"
                        }`}
                      >
                        <div>
                          {/* Class Card Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-white/5 pb-2.5">
                            <div>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                cls.reservationType.includes("escuelita")
                                  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                              }`}>
                                {cls.reservationType.includes("escuelita") ? "🎓 Escuelita" : "👤 Clase Particular"}
                              </span>
                              <h4 className="font-extrabold text-zinc-900 dark:text-white text-sm mt-1">
                                {cls.courtId?.name || "Cancha"}
                              </h4>
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 text-right">
                              <div className="capitalize">{dateFormatted}</div>
                              <div className="text-zinc-400 dark:text-zinc-500 mt-0.5">{timeFormatted}</div>
                            </span>
                          </div>

                          {/* Class Card Instructor Details */}
                          <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                            <span>Profesor: <strong className="text-zinc-800 dark:text-zinc-200">{cls.teacherId?.name || "Sin asignar"}</strong></span>
                            {cls.isRecurring && (
                              <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded-md font-black uppercase">
                                Fijo
                              </span>
                            )}
                          </div>

                          {/* Class Enrolled Students List */}
                          <div className="mt-3.5 space-y-2">
                            <span className="text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider block">
                              Alumnos Inscritos ({cls.students?.length || 0})
                            </span>
                            
                            {(!cls.students || cls.students.length === 0) ? (
                              <div className="py-4 text-center border border-dashed border-zinc-200 dark:border-white/5 rounded-xl text-[10px] text-zinc-400 font-semibold italic">
                                Sin alumnos. Arrastrá un socio aquí.
                              </div>
                            ) : (
                              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-0.5">
                                {cls.students.map((st: any, sIdx: number) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-center justify-between bg-zinc-50 dark:bg-white/[0.01] border border-zinc-150 dark:border-white/5 rounded-lg px-2.5 py-1.5 text-xs"
                                  >
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]" title={`${st.firstName} ${st.lastName}`}>
                                      {st.lastName ? `${st.lastName}, ${st.firstName}` : st.firstName}
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                      {/* Abono Payment Status Toggle */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleStudentAbono(cls, sIdx, !st.paidAbono)}
                                        className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded transition-all border ${
                                          st.paidAbono
                                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                                            : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                        }`}
                                      >
                                        {st.paidAbono ? "Pagado" : "Debe"}
                                      </button>
                                      
                                      {/* Remove Student Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveStudentFromClass(cls, sIdx)}
                                        className="text-zinc-400 hover:text-red-400 p-0.5 transition-colors"
                                        title="Quitar de la clase"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Drop Zone Indicator inside Class Card */}
                        <div className={`mt-4 border border-dashed rounded-xl py-3 text-center transition-all ${
                          isOver
                            ? "border-primary bg-primary/10 text-primary scale-95"
                            : "border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-white/[0.01] text-zinc-400 hover:border-zinc-300 dark:hover:border-white/10 hover:text-zinc-300"
                        }`}>
                          <span className="text-[10px] font-bold block">
                            {isOver ? "¡Soltalo acá!" : "📥 Soltar Socio para inscribir"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Draggable Socios List */}
            <div className="bg-white/95 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200 dark:border-white/5 rounded-2xl p-4 space-y-4 shadow-sm h-[600px] flex flex-col">
              <div className="border-b border-zinc-150 dark:border-white/5 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-855 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4.5 h-4.5 text-primary" />
                  Socios Disponibles
                </h3>
              </div>

              {/* Search filter for socios */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Buscar socio por nombre o DNI..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              {/* Draggable items list */}
              {sociosLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : filteredSocios.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <Users className="w-10 h-10 text-zinc-650 mb-2" />
                  <span className="text-xs font-bold text-zinc-550">No hay socios disponibles</span>
                  <span className="text-[10px] text-zinc-500 mt-1">Asegurate de tener socios activos creados en la pestaña Socios.</span>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 select-none">
                  {filteredSocios.map((socio) => {
                    const currentMonth = getCurrentMonthString();
                    const currentMonthPayment = socio.payments?.find((p: any) => p.month === currentMonth);
                    const isPaid = currentMonthPayment && currentMonthPayment.status === "paid";

                    return (
                      <div
                        key={socio._id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", socio._id);
                        }}
                        className="relative p-3 bg-zinc-50 dark:bg-white/[0.01] hover:bg-zinc-100 dark:hover:bg-white/[0.03] border border-zinc-200 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10 rounded-xl cursor-grab active:cursor-grabbing transition-all flex items-center justify-between group shadow-sm animate-in fade-in duration-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Drag handle grid icon */}
                          <div className="text-zinc-400 dark:text-zinc-600 flex flex-col gap-0.5 justify-center">
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 bg-current rounded-full" />
                              <span className="w-1 h-1 bg-current rounded-full" />
                            </div>
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 bg-current rounded-full" />
                              <span className="w-1 h-1 bg-current rounded-full" />
                            </div>
                            <div className="flex gap-0.5">
                              <span className="w-1 h-1 bg-current rounded-full" />
                              <span className="w-1 h-1 bg-current rounded-full" />
                            </div>
                          </div>

                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-zinc-900 dark:text-white truncate">
                              {socio.lastName}, {socio.firstName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              {socio.dni && <span className="text-[9px] font-bold text-zinc-400">DNI: {socio.dni}</span>}
                              <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-green-500" : "bg-amber-500"}`} title={isPaid ? "Abono Pagado" : "Abono Debe"} />
                            </div>
                          </div>
                        </div>

                        {/* Quick Add Option (Mobile Fallback) */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              if (filteredClasses.length === 0) {
                                alert("No hay clases programadas para inscribir.");
                                return;
                              }
                              const selectedClassId = prompt(
                                "Ingresá el número de la clase donde querés inscribir a este socio:\n\n" +
                                filteredClasses.map((c, i) => `${i + 1}. ${c.courtId?.name || "Cancha"} - ${c.teacherId?.name || "Profe"} (${new Date(c.startTime).toLocaleTimeString("es-AR", {hour:"2-digit",minute:"2-digit"})})`).join("\n")
                              );
                              if (selectedClassId) {
                                const idx = parseInt(selectedClassId) - 1;
                                if (idx >= 0 && idx < filteredClasses.length) {
                                  quickAssignSocio(socio, filteredClasses[idx]._id);
                                } else {
                                  alert("Opción no válida.");
                                }
                              }
                            }}
                            className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 opacity-80 hover:opacity-100 transition-all"
                            title="Inscribir en clase..."
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NEW CLASS MODAL DIALOG */}
      {isNewClassModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-5 bg-primary rounded-full" />
                Programar Nueva Clase
              </h2>
              <button
                onClick={() => setIsNewClassModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white p-1 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg border border-zinc-250 dark:border-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBookClass} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">Disciplina</label>
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
                  <label className="text-xs font-semibold text-zinc-400">Tipo de Actividad</label>
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
                      Particular
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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-450 dark:text-zinc-400">Profesor</label>
                <select
                  required
                  value={bookingTeacherId}
                  onChange={(e) => setBookingTeacherId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-450 dark:text-zinc-400">Fecha</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-455 dark:text-zinc-400">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold dark:[color-scheme:dark]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-455 dark:text-zinc-400">Hora Fin</label>
                  <input
                    type="time"
                    required
                    disabled={bookingActivityType === "escuelita"}
                    value={bookingEndTime}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold disabled:opacity-50 dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-455 dark:text-zinc-400">Cancha Disponible</label>
                <select
                  required
                  value={bookingCourtId}
                  onChange={(e) => setBookingCourtId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold"
                >
                  <option value="" disabled className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                    {courtsLoading ? "Buscando canchas disponibles..." : "-- Seleccioná la cancha --"}
                  </option>
                  {availableCourts
                    .filter((c) => c.sport === bookingSport)
                    .map((c) => (
                      <option key={c._id} value={c._id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                        {c.name} {c.isCovered ? "(Techada)" : "(Descubierta)"} - ${c.pricePerHour}/hs
                      </option>
                    ))}
                </select>
                {availableCourts.filter((c) => c.sport === bookingSport).length === 0 && !courtsLoading && (
                  <span className="text-[10px] text-red-400 block font-semibold">
                    ⚠️ No hay canchas disponibles para este horario. Intentá otro rango de horas.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-455 dark:text-zinc-400">Estado de Pago Inicial</label>
                  <select
                    value={bookingPaymentStatus}
                    disabled={bookingSport === "football"}
                    onChange={(e) => setBookingPaymentStatus(e.target.value as any)}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-primary font-bold disabled:opacity-50"
                  >
                    <option value="pending" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Debe (Pendiente)</option>
                    <option value="paid" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Abonado (Pagado)</option>
                  </select>
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <div className="flex items-center justify-between h-[42px] bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4">
                    <span className="text-xs font-semibold text-zinc-500">Repetir semanalmente</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={bookingActivityType === "escuelita"}
                        checked={bookingIsRecurring}
                        onChange={(e) => setBookingIsRecurring(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary peer-checked:after:bg-black disabled:opacity-50"></div>
                    </label>
                  </div>
                </div>
              </div>

              {bookingIsRecurring && (
                <div className="space-y-1.5 p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl animate-in fade-in duration-200">
                  <label className="text-xs font-semibold text-zinc-450 dark:text-zinc-400">Duración de la recurrencia (semanas)</label>
                  <select
                    value={bookingRecurrenceWeeks}
                    disabled={bookingActivityType === "escuelita"}
                    onChange={(e) => setBookingRecurrenceWeeks(Number(e.target.value))}
                    className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none font-bold"
                  >
                    <option value={4} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">4 Semanas (1 Mes)</option>
                    <option value={8} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">8 Semanas (2 Meses)</option>
                    <option value={12} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">12 Semanas (3 Meses)</option>
                    <option value={24} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">24 Semanas (6 Meses)</option>
                  </select>
                </div>
              )}

              {/* Form Actions / Summary */}
              <div className="border-t border-zinc-200 dark:border-white/5 pt-5 flex items-center justify-between gap-4">
                {(() => {
                  const start = new Date(`${bookingDate}T${bookingStartTime}:00.000-03:00`);
                  const end = new Date(`${bookingDate}T${bookingEndTime}:00.000-03:00`);
                  const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                  const teacherObj = teachers.find((t) => t._id === bookingTeacherId);
                  const validDuration = !isNaN(durationHours) && durationHours > 0;
                  const teacherPrice = validDuration && teacherObj ? Math.round(durationHours * teacherObj.pricePerHour) : 0;

                  return (
                    <div className="text-xs text-zinc-500">
                      Costo Clase: <strong className="text-primary font-black text-sm">${teacherPrice.toLocaleString("es-AR")}</strong>
                    </div>
                  );
                })()}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewClassModalOpen(false)}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl border border-zinc-200 dark:border-white/5 text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting || courtsLoading || !bookingCourtId || !bookingTeacherId}
                    className="px-5 py-2.5 bg-primary text-black font-extrabold rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-1.5"
                  >
                    {bookingSubmitting ? "Creando..." : "Programar Clase"}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
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
