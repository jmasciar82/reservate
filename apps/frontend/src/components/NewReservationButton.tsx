"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, User, X, Mail, Phone, Users, Plus } from "lucide-react";
import { createPortal } from "react-dom";
import { apiFetch } from "@/lib/api";
import type { Court, Product, Teacher } from "@/lib/types";

const PRESET_TIMES = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

function parseArtDateTime(dateStr: string, timeStr: string): Date {
  const dateParts = dateStr.split(/[-/]/);
  const timeParts = timeStr.split(":");
  
  let year = 2026;
  let monthIndex = 4; // Mayo (0-indexed)
  let day = 27;
  let hours = 0;
  let minutes = 0;

  if (dateParts.length === 3) {
    if (dateParts[0].length === 4) {
      // YYYY-MM-DD
      year = Number(dateParts[0]);
      monthIndex = Number(dateParts[1]) - 1;
      day = Number(dateParts[2]);
    } else {
      const part0 = Number(dateParts[0]);
      const part1 = Number(dateParts[1]);
      const part2 = Number(dateParts[2]);
      if (part0 > 12) {
        // DD/MM/YYYY
        year = part2;
        monthIndex = part1 - 1;
        day = part0;
      } else {
        // MM/DD/YYYY
        year = part2;
        monthIndex = part0 - 1;
        day = part1;
      }
    }
  }

  if (timeParts.length >= 2) {
    hours = Number(timeParts[0]);
    minutes = Number(timeParts[1]);
  }

  // Argentina es UTC-3.
  // UTC = ART + 3 horas.
  const utcMs = Date.UTC(year, monthIndex, day, hours, minutes) + 3 * 3600 * 1000;
  return new Date(utcMs);
}

interface NewReservationButtonProps {
  activeClubId: string;
  defaultDate: string;
  presetCourtId?: string;
  presetTime?: string;
  presetDate?: string;
  children?: React.ReactNode;
}

const PRESET_PRODUCTS = [
  { name: "Alquiler de Pala", price: 1500, icon: "🎒" },
  { name: "Tubo de Pelotas", price: 3000, icon: "🥎" },
  { name: "Agua Mineral", price: 1200, icon: "🥤" },
  { name: "Gatorade", price: 2000, icon: "⚡" },
];

export default function NewReservationButton({
  activeClubId,
  defaultDate,
  presetCourtId,
  presetTime,
  presetDate,
  children,
 }: NewReservationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [courtsLoading, setCourtsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    playerName: "",
    email: "",
    phone: "",
    date: defaultDate,
    time: "",
    duration: "1.5",
    courtId: "",
    isRecurring: false,
    recurrenceWeeks: 4,
    depositAmount: "",
    isDepositPaid: false,
    reservationType: "standard",
    teacherId: "",
  });
  const [paymentType, setPaymentType] = useState<string>("pending");
  const [products, setProducts] = useState<Array<{ name: string; quantity: number; price: number }>>([]);
  const [customProduct, setCustomProduct] = useState({ name: "", price: "", quantity: "1" });
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bookingStudents, setBookingStudents] = useState<
    Array<{ firstName: string; lastName: string; phone?: string; email?: string }>
  >([{ firstName: "", lastName: "", phone: "", email: "" }]);


  useEffect(() => {
    if (isOpen && activeClubId) {
      apiFetch(`/courts`)
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data: Court[]) => {
          setAllCourts(data.filter(c => c.clubId === activeClubId));
        })
        .catch((err) => console.error("Error fetching all courts:", err));
    }
  }, [isOpen, activeClubId]);

  useEffect(() => {
    if (isOpen && activeClubId) {
      apiFetch(`/products?clubId=${activeClubId}`)
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data: Product[]) => {
          // Filter only active products
          setAvailableProducts(data.filter(p => p.isActive));
        })
        .catch((err) => console.error("Error fetching products:", err));
    }
  }, [isOpen, activeClubId]);

  useEffect(() => {
    const isEscuelita = formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol";
    if (isEscuelita) {
      setFormData((prev) => ({
        ...prev,
        duration: "1",
        isRecurring: true,
        recurrenceWeeks: 12,
      }));
    }
  }, [formData.reservationType]);

  useEffect(() => {
    if (isOpen && activeClubId) {
      apiFetch(`/teachers?clubId=${activeClubId}`)
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data: Teacher[]) => {
          setTeachers(data.filter(t => t.isActive));
        })
        .catch((err) => console.error("Error fetching teachers in NewReservationButton:", err));
    }
  }, [isOpen, activeClubId]);

  const addPresetProduct = (preset: { name: string; price: number }) => {
    setProducts(prev => {
      const existing = prev.find(p => p.name === preset.name);
      if (existing) {
        return prev.map(p => p.name === preset.name ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { name: preset.name, price: preset.price, quantity: 1 }];
    });
  };

  const addCustomProduct = () => {
    if (!customProduct.name.trim() || !customProduct.price) return;
    const priceNum = Number(customProduct.price);
    const qtyNum = Number(customProduct.quantity) || 1;
    if (isNaN(priceNum) || priceNum < 0) return;

    setProducts(prev => {
      const existing = prev.find(p => p.name.toLowerCase() === customProduct.name.toLowerCase());
      if (existing) {
        return prev.map(p => p.name.toLowerCase() === customProduct.name.toLowerCase() ? { ...p, quantity: p.quantity + qtyNum } : p);
      }
      return [...prev, { name: customProduct.name.trim(), price: priceNum, quantity: qtyNum }];
    });
    setCustomProduct({ name: "", price: "", quantity: "1" });
  };

  const updateProductQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setProducts(prev => prev.filter((_, i) => i !== index));
    } else {
      setProducts(prev => prev.map((p, i) => i === index ? { ...p, quantity: newQty } : p));
    }
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpen = () => {
    setFormData({
      playerName: "",
      email: "",
      phone: "",
      date: presetDate || defaultDate || formData.date,
      time: presetTime || "",
      duration: "1.5",
      courtId: presetCourtId || "",
      isRecurring: false,
      recurrenceWeeks: 4,
      depositAmount: "",
      isDepositPaid: false,
      reservationType: "standard",
      teacherId: "",
    });
    setProducts([]);
    setCustomProduct({ name: "", price: "", quantity: "1" });
    setPaymentType("pending");
    setIsOpen(true);
  };

  const filteredTimes =
    formData.duration === "1.5"
      ? PRESET_TIMES.filter((time) => time <= "22:30")
      : PRESET_TIMES;
  const isTimeSelectionReady =
    Boolean(formData.date) && Boolean(formData.time) && Boolean(formData.duration);

  const selectedCourt = courts.find((c) => c._id === formData.courtId);
  const durationHours = Number(formData.duration);
  const courtPrice = selectedCourt ? selectedCourt.pricePerHour : 0;
  const calculatedTotalPrice = Math.round(durationHours * courtPrice);

  const selectedTeacher = teachers.find((t) => t._id === formData.teacherId);
  const teacherPricePerHour = selectedTeacher ? selectedTeacher.pricePerHour : 0;
  const calculatedTeacherPrice = Math.round(durationHours * teacherPricePerHour);

  const productsPrice = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalWithProducts = formData.teacherId
    ? (calculatedTeacherPrice + productsPrice)
    : (calculatedTotalPrice + productsPrice);


  useEffect(() => {
    const shouldLoadCourts = isOpen && isTimeSelectionReady && activeClubId;
    const controller = new AbortController();

    if (!shouldLoadCourts) {
      void Promise.resolve().then(() => {
        setCourts([]);
        setCourtsLoading(false);
      });
      return () => controller.abort();
    }

    void Promise.resolve().then(async () => {
      setCourtsLoading(true);

      const start = parseArtDateTime(formData.date, formData.time);

      if (Number.isNaN(start.getTime())) {
        console.error("Invalid Date constructed:", formData.date, formData.time);
        setCourts([]);
        setCourtsLoading(false);
        return;
      }

      const durationMs = Number(formData.duration) * 60 * 60 * 1000;
      const end = new Date(start.getTime() + durationMs);

      try {
        const response = await apiFetch(
          "/public/courts/available",
          { signal: controller.signal },
          {
            startTime: start.toISOString(),
            endTime: end.toISOString(),
            clubId: activeClubId,
          }
        );

        if (!response.ok) {
          setCourts([]);
          return;
        }

        const data = (await response.json()) as (Court & { isAvailable?: boolean })[];
        const availableCourts = data.filter((c) => c.isAvailable !== false);
        setCourts(availableCourts);

        if (
          formData.courtId &&
          !availableCourts.some((court) => court._id === formData.courtId)
        ) {
          setFormData((prev) => ({ ...prev, courtId: "" }));
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error fetching available courts:", error);
          setCourts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setCourtsLoading(false);
        }
      }
    });

    return () => controller.abort();
  }, [
    activeClubId,
    formData.courtId,
    formData.date,
    formData.duration,
    formData.time,
    isOpen,
    isTimeSelectionReady,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startTime = parseArtDateTime(formData.date, formData.time);

      if (Number.isNaN(startTime.getTime())) {
        alert("La fecha seleccionada no es válida.");
        setLoading(false);
        return;
      }

      const durationMs = Number(formData.duration) * 60 * 60 * 1000;
      const endTime = new Date(startTime.getTime() + durationMs);

      let finalDepositAmount = 0;
      let finalPaymentStatus = "pending";

      const isEscuelita = formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol";

      if (paymentType === "deposit") {
        finalDepositAmount = formData.depositAmount ? Number(formData.depositAmount) : 0;
        finalPaymentStatus = "paid";
      } else if (paymentType === "full") {
        finalDepositAmount = (formData.isRecurring && !isEscuelita)
          ? Math.round((formData.teacherId ? calculatedTeacherPrice : calculatedTotalPrice) * Number(formData.recurrenceWeeks || 4) * 0.90) + productsPrice
          : totalWithProducts;

        finalPaymentStatus = "paid";
      }

      const isClassOrEscuelita =
        formData.reservationType.startsWith("clase_particular_") ||
        formData.reservationType.startsWith("escuelita_");

      let payload: any = {
        courtId: formData.courtId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isRecurring: formData.isRecurring,
        recurrenceWeeks: formData.isRecurring ? Number(formData.recurrenceWeeks) : undefined,
        payBlock: formData.isRecurring && paymentType === "full" ? true : undefined,
        depositAmount: finalDepositAmount,
        paymentStatus: finalPaymentStatus,
        products: products,
        reservationType: formData.reservationType,
        teacherId: formData.teacherId || undefined,
      };

      if (isClassOrEscuelita) {
        const validStudents = bookingStudents.filter((s) => s.firstName.trim() && s.lastName.trim());
        if (validStudents.length === 0) {
          alert("Debes ingresar al menos un alumno con nombre y apellido.");
          setLoading(false);
          return;
        }
        const primaryStudent = validStudents[0];
        payload = {
          ...payload,
          userId: `${primaryStudent.firstName} ${primaryStudent.lastName}`.trim(),
          firstName: primaryStudent.firstName,
          lastName: primaryStudent.lastName,
          email: primaryStudent.email || undefined,
          phone: primaryStudent.phone || undefined,
          students: validStudents,
        };
      } else {
        payload = {
          ...payload,
          userId: formData.playerName,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
        };
      }

      const response = await apiFetch("/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsOpen(false);
        setFormData({
          playerName: "",
          email: "",
          phone: "",
          date: defaultDate,
          time: "",
          duration: "1.5",
          courtId: "",
          isRecurring: false,
          recurrenceWeeks: 4,
          depositAmount: "",
          isDepositPaid: false,
          reservationType: "standard",
          teacherId: "",
        });
        setProducts([]);
        setCustomProduct({ name: "", price: "", quantity: "1" });
        setBookingStudents([{ firstName: "", lastName: "", phone: "", email: "" }]);
        setPaymentType("pending");
        router.refresh();
      } else {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        alert(`No se pudo crear la reserva: ${errorData.message ?? "Error"}`);
      }
    } catch (error) {
      console.error("Error submitting reservation:", error);
      alert("No se pudo crear la reserva.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {children ? (
        <div onClick={handleOpen} className="w-full h-full block">
          {children}
        </div>
      ) : (
        <button
          onClick={handleOpen}
          disabled={!activeClubId}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:pointer-events-none"
        >
          + Nueva reserva
        </button>
      )}

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02] shrink-0">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Nueva reserva
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

              {(() => {
                const isClassOrEscuelita =
                  formData.reservationType.startsWith("clase_particular_") ||
                  formData.reservationType.startsWith("escuelita_");

                if (isClassOrEscuelita) {
                  return (
                    <div className="space-y-4 border-b border-zinc-200 dark:border-white/5 pb-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" />
                          Alumnos de la clase ({bookingStudents.length})
                        </label>
                        <button
                          type="button"
                          onClick={() => setBookingStudents(prev => [...prev, { firstName: "", lastName: "", phone: "", email: "" }])}
                          className="text-xs font-black text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Agregar Alumno
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                        {bookingStudents.map((student, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 rounded-xl space-y-2 relative"
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase text-primary">
                                Alumno #{idx + 1} {idx === 0 ? "(Principal)" : ""}
                              </span>
                              {bookingStudents.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setBookingStudents(prev => prev.filter((_, i) => i !== idx))}
                                  className="text-[10px] text-red-400 hover:text-red-300"
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
                                onChange={(e) => setBookingStudents(prev => prev.map((s, i) => i === idx ? { ...s, firstName: e.target.value } : s))}
                                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                              />
                              <input
                                type="text"
                                placeholder="Apellido"
                                required
                                value={student.lastName}
                                onChange={(e) => setBookingStudents(prev => prev.map((s, i) => i === idx ? { ...s, lastName: e.target.value } : s))}
                                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-semibold"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="tel"
                                placeholder="Teléfono"
                                value={student.phone || ""}
                                onChange={(e) => setBookingStudents(prev => prev.map((s, i) => i === idx ? { ...s, phone: e.target.value } : s))}
                                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-medium"
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                value={student.email || ""}
                                onChange={(e) => setBookingStudents(prev => prev.map((s, i) => i === idx ? { ...s, email: e.target.value } : s))}
                                className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary font-medium"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Nombre del jugador
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez"
                        value={formData.playerName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            playerName: e.target.value,
                          }))
                        }
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-505 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" />
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          placeholder="ejemplo@correo.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-505 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          Teléfono / Celular
                        </label>
                        <input
                          type="tel"
                          placeholder="Ej. +54 9 11 1234 5678"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-505 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-medium"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 dark:[color-scheme:dark] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Inicio
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                  >
                    <option value="" disabled className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                      --:--
                    </option>
                    {filteredTimes.map((time) => (
                      <option key={time} value={time} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                        {time} hs
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Duración
                  </label>
                  <select
                    required
                    value={formData.duration}
                    disabled={formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol"}
                    onChange={(e) => {
                      const nextDuration = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        duration: nextDuration,
                        time:
                          nextDuration === "1.5" && prev.time === "23:00"
                            ? ""
                            : prev.time,
                      }));
                    }}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="1" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">1 hora</option>
                    <option value="1.5" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">1.5 horas</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Cancha disponible
                </label>
                <select
                  required
                  value={formData.courtId}
                  onChange={(e) => {
                    const courtId = e.target.value;
                    const courtDetail = allCourts.find((c) => c._id === courtId);
                    const isPadelOrFutbol = courtDetail?.sport === "padel" || courtDetail?.sport === "football";
                    setFormData((prev) => ({
                      ...prev,
                      courtId,
                      reservationType: isPadelOrFutbol ? prev.reservationType : "standard",
                    }));
                  }}
                  disabled={!isTimeSelectionReady || courtsLoading || courts.length === 0}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
                >
                  {!isTimeSelectionReady ? (
                    <option value="" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Seleccioná fecha, hora y duración</option>
                  ) : courtsLoading ? (
                    <option value="" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Buscando canchas libres...</option>
                  ) : courts.length === 0 ? (
                    <option value="" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">No hay canchas libres en este horario</option>
                  ) : (
                    <>
                      <option value="" disabled className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                        Seleccioná una cancha libre
                      </option>
                      {courts.map((court) => (
                        <option key={court._id} value={court._id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                          {court.name} ({court.sport}) -{" "}
                          {court.isCovered ? "Techada" : "Descubierta"}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {(() => {
                const selectedCourtDetail = allCourts.find((c) => c._id === formData.courtId);
                const showPadelOption = selectedCourtDetail?.sport === "padel";
                const showFootballOption = selectedCourtDetail?.sport === "football";
                const showSelector = showPadelOption || showFootballOption;

                if (!showSelector) return null;

                return (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      🎓 Tipo de turno
                    </label>
                    <select
                      value={formData.reservationType}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          reservationType: e.target.value,
                        }))
                      }
                      className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                    >
                      <option value="standard" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Particular / Cliente normal</option>
                      {showPadelOption && (
                        <>
                          <option value="escuelita_padel" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Escuelita de Pádel</option>
                          <option value="clase_particular_padel" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Clase Particular de Pádel</option>
                        </>
                      )}
                      {showFootballOption && (
                        <>
                          <option value="escuelita_futbol" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Escuelita de Fútbol</option>
                          <option value="clase_particular_futbol" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">Clase Particular de Fútbol</option>
                        </>
                      )}
                    </select>
                  </div>
                );
              })()}

              {/* Teacher Selector for Private Lessons */}
              {(() => {
                const isPrivateLesson = formData.reservationType === "clase_particular_padel" || formData.reservationType === "clase_particular_futbol";
                if (!isPrivateLesson) return null;

                const selectedCourtDetail = allCourts.find((c) => c._id === formData.courtId);
                const sportFilter = selectedCourtDetail?.sport || "padel";

                const filteredTeachers = teachers.filter((t) => t.sport === sportFilter);

                return (
                   <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                     <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                       👨‍🏫 Profesor Asignado
                     </label>
                     <select
                       required
                       value={formData.teacherId}
                       onChange={(e) =>
                         setFormData((prev) => ({
                           ...prev,
                           teacherId: e.target.value,
                         }))
                       }
                       className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                     >
                       <option value="" className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                         -- Seleccionar Profesor --
                       </option>
                       {filteredTeachers.map((teacher) => (
                         <option key={teacher._id} value={teacher._id} className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-white">
                           {teacher.name} (${teacher.pricePerHour}/hs)
                         </option>
                       ))}
                     </select>
                   </div>
                );
              })()}

              {/* Consumos / Extras Adicionales */}
              {formData.courtId && (
                <div className="space-y-3 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 shadow-inner">
                  <label className="text-sm font-bold text-zinc-600 dark:text-zinc-200 flex items-center gap-2">
                    📦 Consumos y Extras
                  </label>
                  <p className="text-[10px] text-zinc-400">
                    Hacé clic para agregar bebidas, alquiler de palas o extras a la reserva.
                  </p>
                  
                  {/* Preset Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {(availableProducts.length > 0 ? availableProducts : PRESET_PRODUCTS).map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => addPresetProduct(preset)}
                        className="flex items-center justify-between p-2.5 text-xs font-semibold rounded-xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-zinc-50 dark:hover:bg-white/[0.08] active:scale-95 transition-all duration-200 text-left text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <span>{'icon' in preset ? preset.icon : '📦'}</span>
                          <span className="truncate">{preset.name}</span>
                        </span>
                        <span className="font-bold text-primary shrink-0">${preset.price.toLocaleString("es-AR")}</span>
                      </button>
                    ))}
                  </div>

                  {/* Custom item input */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200/80 dark:border-white/5">
                    <span className="text-[10px] font-bold text-zinc-500">Ítem personalizado</span>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Nombre (ej. Grip)"
                        value={customProduct.name}
                        onChange={(e) => setCustomProduct(prev => ({ ...prev, name: e.target.value }))}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary"
                      />
                      <input
                        type="number"
                        placeholder="Precio"
                        value={customProduct.price}
                        onChange={(e) => setCustomProduct(prev => ({ ...prev, price: e.target.value }))}
                        className="w-16 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={addCustomProduct}
                        className="px-3 py-1.5 bg-primary text-black font-extrabold text-xs rounded-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        ➕
                      </button>
                    </div>
                  </div>

                  {/* List of currently added products */}
                  {products.length > 0 && (
                    <div className="space-y-1.5 pt-3 border-t border-zinc-200/80 dark:border-white/5">
                      <span className="text-[10px] font-bold text-zinc-500">Consumos Cargados</span>
                      <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                        {products.map((p, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 text-xs"
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{p.name}</span>
                              <span className="text-[10px] text-zinc-500">${p.price.toLocaleString("es-AR")} c/u</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="flex items-center bg-zinc-200 dark:bg-white/10 rounded-md">
                                <button
                                  type="button"
                                  onClick={() => updateProductQty(idx, p.quantity - 1)}
                                  className="px-2 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/15 rounded-l-md transition-colors"
                                >
                                  -
                                </button>
                                <span className="px-2.5 text-xs font-black text-zinc-800 dark:text-zinc-200">{p.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateProductQty(idx, p.quantity + 1)}
                                  className="px-2 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-white/15 rounded-r-md transition-colors"
                                >
                                  +
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeProduct(idx)}
                                className="text-red-500 hover:text-red-400 p-1"
                                title="Eliminar"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Estimación de Precio */}
              {selectedCourt && (
                <div className="bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-2.5 shadow-inner">
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    <span>Precio por hora cancha:</span>
                    <span className="text-zinc-900 dark:text-white">${selectedCourt.pricePerHour.toLocaleString("es-AR")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-t border-zinc-200/80 dark:border-white/5 pt-2">
                    <span>Subtotal turno (cancha):</span>
                    {formData.teacherId ? (
                      <span className="text-zinc-400 italic font-bold">Incluida en la clase</span>
                    ) : (
                      <span className="text-zinc-900 dark:text-white">${calculatedTotalPrice.toLocaleString("es-AR")}</span>
                    )}
                  </div>
                  {productsPrice > 0 && (
                    <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      <span>Subtotal consumos / extras:</span>
                      <span className="text-zinc-900 dark:text-white">${productsPrice.toLocaleString("es-AR")}</span>
                    </div>
                  )}
                  {calculatedTeacherPrice > 0 && (
                    <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      <span>Clase / Profesor ({selectedTeacher?.name}):</span>
                      <span className="text-zinc-900 dark:text-white">${calculatedTeacherPrice.toLocaleString("es-AR")}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-bold text-zinc-600 dark:text-zinc-300 border-t border-zinc-200/80 dark:border-white/5 pt-2">
                    <span>Valor estimado total:</span>
                    <span className="text-primary text-sm font-black">${totalWithProducts.toLocaleString("es-AR")}</span>
                  </div>
                  {formData.isRecurring && formData.reservationType === "standard" && (
                    <div className="flex flex-col gap-1 border-t border-zinc-200/80 dark:border-white/5 pt-2.5">
                      <div className="flex justify-between items-center text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        <span>Total normal ({Number(formData.recurrenceWeeks || 4)} sem):</span>
                        <span className="line-through text-zinc-505">
                          ${(((formData.teacherId ? calculatedTeacherPrice : calculatedTotalPrice) * Number(formData.recurrenceWeeks || 4)) + productsPrice).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-indigo-300">
                        <span className="flex items-center gap-1">🏷️ Total con 10% OFF:</span>
                        <span className="text-indigo-400 text-sm font-black">
                          ${(Math.round((formData.teacherId ? calculatedTeacherPrice : calculatedTotalPrice) * Number(formData.recurrenceWeeks || 4) * 0.90) + productsPrice).toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Registro de Pago */}
              {selectedCourt && (
                <div className="space-y-3.5 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 shadow-inner">
                  <label className="text-sm font-bold text-zinc-600 dark:text-zinc-200 flex items-center gap-2">
                    💵 Registro de Pago
                  </label>
                  
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-100/80 dark:bg-white/5 rounded-xl border border-zinc-200/80 dark:border-white/5">
                    {[
                      { id: "pending", label: "Pendiente" },
                      { id: "deposit", label: "Seña" },
                      { id: "full", label: "Pago Total" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setPaymentType(opt.id);
                          if (opt.id === "deposit") {
                            const defaultDeposit = Math.round(totalWithProducts * 0.3);
                            setFormData(prev => ({ ...prev, depositAmount: String(defaultDeposit) }));
                          } else {
                            setFormData(prev => ({ ...prev, depositAmount: "" }));
                          }
                        }}
                        className={`py-2 text-xs font-extrabold rounded-lg transition-all duration-300 ${
                          paymentType === opt.id
                            ? "bg-primary text-[#09090b] shadow-[0_0_10px_rgba(57,255,20,0.3)]"
                            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {paymentType === "full" && (
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol"
                        ? `Se registrará el pago individual de la primera clase por $${totalWithProducts.toLocaleString("es-AR")}.`
                        : `Se registrará el pago de todo el bloque (${formData.recurrenceWeeks} sem) con 10% OFF.`
                      }
                    </p>
                  )}

                  {paymentType === "deposit" && (
                    <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-1 duration-150">
                      <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Monto de la seña ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej. 5400"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                        className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-2.5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-650 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-semibold"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Turno Recurrente */}
              <div className="space-y-3 bg-zinc-50/50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-200 flex items-center gap-2">
                    <span className="text-indigo-400">🔁</span> Turno Fijo
                  </span>
                  <label className={`relative inline-flex items-center ${(formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol") ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      disabled={formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isRecurring: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 peer-checked:after:bg-white peer-checked:after:border-indigo-500 shadow-md"></div>
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200/80 dark:border-white/5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {formData.reservationType === "escuelita_padel" || formData.reservationType === "escuelita_futbol" ? (
                        <>
                          Se creará un bloque de <strong className="text-zinc-900 dark:text-white">12 semanas (3 meses)</strong>. Al registrar el pago de cualquiera de las clases, se reservará automáticamente el próximo período.
                        </>
                      ) : (
                        <>
                          Se creará un bloque de <strong className="text-zinc-900 dark:text-white">4 semanas (1 mes)</strong>. Podrás renovarlo de forma indefinida y cobrar el próximo mes en un solo clic.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {isTimeSelectionReady && formData.time && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm shadow-[0_4px_12px_rgba(57,255,20,0.02)] animate-in fade-in slide-in-from-top-1">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(57,255,20,0.8)] flex-shrink-0" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                    El turno dura{" "}
                    <strong className="text-zinc-900 dark:text-white font-bold">
                      {formData.duration === "1" ? "1:00 hs" : "1:30 hs"}
                    </strong>
                    , empieza a las{" "}
                    <strong className="text-zinc-900 dark:text-white font-bold">
                      {formData.time} hs
                    </strong>{" "}
                    y termina a las{" "}
                    <strong className="text-zinc-900 dark:text-white font-bold">
                      {(() => {
                        const [h, m] = formData.time.split(":").map(Number);
                        const durationMinutes = Number(formData.duration) * 60;
                        const endTotal = h * 60 + m + durationMinutes;
                        const endHour = Math.floor(endTotal / 60) % 24;
                        const endMinute = endTotal % 60;
                        return `${String(endHour).padStart(2, "0")}:${String(
                          endMinute,
                        ).padStart(2, "0")}`;
                      })()}{" "}
                      hs
                    </strong>
                    .
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !formData.courtId}
                className="w-full py-3.5 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_25px_rgba(57,255,20,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_10px_rgba(57,255,20,0.2)] disabled:opacity-40 disabled:pointer-events-none disabled:-translate-y-0 text-base transition-all duration-300 tracking-wide"
              >
                {loading ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
