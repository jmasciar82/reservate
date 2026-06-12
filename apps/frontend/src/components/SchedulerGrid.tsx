"use client";

import React, { useState, useTransition } from "react";
import { Clock, Plus, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Court, Reservation } from "@/lib/types";
import NewReservationButton from "./NewReservationButton";
import ReservationActions from "./ReservationActions";

interface SchedulerGridProps {
  activeClubCourts: Court[];
  playingTodayReservations: Reservation[];
  date: string;
  activeClubId: string;
}

// Helper sport styling and labeling functions
function getSportBadgeStyles(sport: string) {
  const styles: Record<string, string> = {
    padel: "border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.15)]",
    tennis: "border-orange-500/20 bg-orange-500/10 text-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    football: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)]",
    basketball: "border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    parrilla: "border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
    quincho: "border-yellow-600/20 bg-yellow-600/10 text-yellow-500 shadow-[0_0_8px_rgba(202,138,4,0.15)]",
    escuelita_padel: "border-indigo-500/20 bg-indigo-500/10 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.15)]",
    escuelita_futbol: "border-teal-500/20 bg-teal-500/10 text-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.15)]",
  };
  return styles[sport] ?? "border-primary/20 bg-primary/10 text-primary shadow-[0_0_8px_rgba(57,255,20,0.15)]";
}

function getSportLabel(sport: string) {
  const labels: Record<string, string> = {
    padel: "Pádel",
    tennis: "Tenis",
    football: "Fútbol",
    basketball: "Básquet",
    parrilla: "Parrilla",
    quincho: "Quincho",
    escuelita_padel: "Escuelita Pádel",
    escuelita_futbol: "Escuelita Fútbol",
  };
  return labels[sport] ?? sport;
}

// Helper time functions
function getArtTime(dateInput: Date | string) {
  const d = new Date(dateInput);
  const art = new Date(d.getTime() - 3 * 3600 * 1000);
  return {
    year: art.getUTCFullYear(),
    month: art.getUTCMonth() + 1,
    day: art.getUTCDate(),
    hour: art.getUTCHours(),
    minute: art.getUTCMinutes(),
  };
}

function formatArtTimeStr(dateInput: Date | string) {
  const { hour, minute } = getArtTime(dateInput);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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

export default function SchedulerGrid({
  activeClubCourts,
  playingTodayReservations,
  date,
  activeClubId,
}: SchedulerGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draggingReservation, setDraggingReservation] = useState<Reservation | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{ courtId: string; hour: number; minute: number } | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  // Generate grid rows (8:00 to 23:00)
  const timeSlots = [];
  for (let h = 8; h <= 23; h++) {
    timeSlots.push({ hour: h, minute: 0, label: `${String(h).padStart(2, "0")}:00` });
    if (h < 23) {
      timeSlots.push({ hour: h, minute: 30, label: `${String(h).padStart(2, "0")}:30` });
    }
  }

  // Calculate duration of dragging reservation in slots (30 min blocks)
  const getDraggingSlotsCount = () => {
    if (!draggingReservation) return 0;
    const rStart = getArtTime(draggingReservation.startTime);
    const rEnd = getArtTime(draggingReservation.endTime);
    const startMins = rStart.hour * 60 + rStart.minute;
    const endMins = rEnd.hour * 60 + rEnd.minute;
    return Math.round((endMins - startMins) / 30);
  };

  const draggingSlotsCount = getDraggingSlotsCount();

  // Helper to check if a range of slots is occupied
  const isRangeOccupied = (courtId: string, startHour: number, startMinute: number, slotsCount: number) => {
    const startMins = startHour * 60 + startMinute;
    const endMins = startMins + slotsCount * 30;

    // Check if the range goes past the closing time of the scheduler (23:30 hs or 1410 minutes)
    if (endMins > 23 * 60 + 30) return true;

    return playingTodayReservations.some((r) => {
      if (
        !draggingReservation ||
        r._id === draggingReservation._id ||
        r.courtId?._id !== courtId ||
        r.status === "cancelled"
      ) {
        return false;
      }

      const rStart = getArtTime(r.startTime);
      const rEnd = getArtTime(r.endTime);
      const rStartMins = rStart.hour * 60 + rStart.minute;
      const rEndMins = rEnd.hour * 60 + rEnd.minute;

      return rStartMins < endMins && rEndMins > startMins;
    });
  };

  // Drag handles
  const handleDragStart = (e: React.DragEvent, reservation: Reservation) => {
    setDraggingReservation(reservation);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", reservation._id);
  };

  const handleDragEnd = () => {
    setDraggingReservation(null);
    setHoveredSlot(null);
  };

  const handleDragOver = (e: React.DragEvent, courtId: string, hour: number, minute: number) => {
    e.preventDefault();
    if (!draggingReservation) return;
    if (hoveredSlot?.courtId !== courtId || hoveredSlot?.hour !== hour || hoveredSlot?.minute !== minute) {
      setHoveredSlot({ courtId, hour, minute });
    }
  };

  const handleDrop = async (e: React.DragEvent, courtId: string, hour: number, minute: number) => {
    e.preventDefault();
    if (!draggingReservation) return;

    const slotsCount = draggingSlotsCount;
    const isOccupied = isRangeOccupied(courtId, hour, minute, slotsCount);

    if (isOccupied) {
      alert("Error: El horario seleccionado se encuentra ocupado o supera el límite del calendario.");
      setDraggingReservation(null);
      setHoveredSlot(null);
      return;
    }

    setRescheduling(true);

    try {
      // Construct start and end dates with Argentina offset
      const newStart = new Date(
        `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000-03:00`
      );
      const newEnd = new Date(newStart.getTime() + slotsCount * 30 * 60 * 1000);

      const response = await apiFetch(`/reservations/${draggingReservation._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId,
          startTime: newStart.toISOString(),
          endTime: newEnd.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al reprogramar la reserva.");
      }

      // Smooth transition to refresh server component data
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || "No se pudo reprogramar la reserva.");
    } finally {
      setRescheduling(false);
      setDraggingReservation(null);
      setHoveredSlot(null);
    }
  };

  return (
    <div className="overflow-x-auto w-full border border-zinc-200/80 dark:border-white/5 rounded-2xl bg-zinc-50/50 dark:bg-white/[0.01] shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.15)] relative">
      {rescheduling && (
        <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-zinc-900 dark:text-white">Reprogramando turno...</span>
          </div>
        </div>
      )}

      <div className="min-w-[800px]">
        {/* Header Row */}
        <div
          className="grid border-b border-zinc-200/80 dark:border-white/5 relative z-10"
          style={{ gridTemplateColumns: `100px repeat(${activeClubCourts.length}, minmax(180px, 1fr))` }}
        >
          <div className="flex items-center justify-center font-extrabold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100/80 dark:bg-white/5 border-r border-zinc-200/80 dark:border-white/5 p-3 backdrop-blur-md">
            Horario
          </div>
          {activeClubCourts.map((court) => (
            <div
              key={court._id}
              className="text-center p-3 border-r border-zinc-200/80 dark:border-white/5 bg-white/80 dark:bg-white/[0.02] flex flex-col items-center justify-center backdrop-blur-md last:border-r-0"
            >
              <p className="font-black text-sm text-zinc-900 dark:text-white tracking-wide">{court.name}</p>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-extrabold uppercase tracking-wider ${getSportBadgeStyles(court.sport)}`}>
                {getSportLabel(court.sport)} • {court.isCovered ? "Techada" : "Descubierta"}
              </span>
            </div>
          ))}
        </div>

        {/* Grid Rows */}
        {timeSlots.map((slot, slotIndex) => (
          <div
            key={slot.label}
            className="grid hover:bg-zinc-50/50 dark:hover:bg-white/[0.01] transition-colors"
            style={{ gridTemplateColumns: `100px repeat(${activeClubCourts.length}, minmax(180px, 1fr))` }}
          >
            {/* Hour Column */}
            <div className="flex items-center justify-center font-extrabold text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-white/[0.01] border-r border-b border-zinc-200/80 dark:border-white/5 py-3">
              {slot.label} hs
            </div>

            {/* Court Slots */}
            {activeClubCourts.map((court) => {
              // Find if this cell is occupied by a reservation
              const reservation = playingTodayReservations.find((r) => {
                if (r.courtId?._id !== court._id || r.status === "cancelled") return false;
                const rStart = getArtTime(r.startTime);
                const rEnd = getArtTime(r.endTime);

                const rStartMins = rStart.hour * 60 + rStart.minute;
                const rEndMins = rEnd.hour * 60 + rEnd.minute;
                const slotStartMins = slot.hour * 60 + slot.minute;
                const slotEndMins = slotStartMins + 30;

                return rStartMins < slotEndMins && rEndMins > slotStartMins;
              });

              if (reservation) {
                const rStart = getArtTime(reservation.startTime);
                const rEnd = getArtTime(reservation.endTime);

                const rStartMins = rStart.hour * 60 + rStart.minute;
                const rEndMins = rEnd.hour * 60 + rEnd.minute;
                const slotStartMins = slot.hour * 60 + slot.minute;
                const slotEndMins = slotStartMins + 30;

                const isStartSlot = rStart.hour === slot.hour && rStart.minute === slot.minute;
                const isEndSlot = slotEndMins === rEndMins;
                const isIntermediateSlot = !isStartSlot && !isEndSlot;

                const totalSlots = Math.round((rEndMins - rStartMins) / 30);
                const isSecondSlot = slotStartMins === rStartMins + 30;

                const isEscuelitaPadel = reservation.reservationType === "escuelita_padel";
                const isEscuelitaFutbol = reservation.reservationType === "escuelita_futbol";
                const isEscuelita = isEscuelitaPadel || isEscuelitaFutbol;

                // Color classes for start/full slot
                let blockBgClass = "bg-zinc-100/80 dark:bg-white/5";
                let blockBorderClass = "border-zinc-200 dark:border-white/10";
                let blockHoverBorderClass = "hover:border-primary/45";
                let blockHoverShadowClass = "hover:shadow-[0_8px_20px_rgba(57,255,20,0.08)]";

                if (reservation.isRecurring && reservation.paymentStatus !== "paid") {
                  blockBgClass = "bg-red-500/15 dark:bg-red-950/40";
                  blockBorderClass = "border-red-400/50 dark:border-red-500/30";
                  blockHoverBorderClass = "hover:border-red-400/80";
                  blockHoverShadowClass = "hover:shadow-[0_0_16px_rgba(239,68,68,0.15)]";
                } else if (isEscuelitaPadel) {
                  blockBgClass = "bg-indigo-600/25 dark:bg-indigo-950/45";
                  blockBorderClass = "border-indigo-400/40 dark:border-indigo-500/30";
                  blockHoverBorderClass = "hover:border-indigo-400/80";
                  blockHoverShadowClass = "hover:shadow-[0_8px_20px_rgba(99,102,241,0.15)]";
                } else if (isEscuelitaFutbol) {
                  blockBgClass = "bg-teal-600/20 dark:bg-teal-950/40";
                  blockBorderClass = "border-teal-400/45 dark:border-teal-500/30";
                  blockHoverBorderClass = "hover:border-teal-400/80";
                  blockHoverShadowClass = "hover:shadow-[0_8px_20px_rgba(20,184,166,0.15)]";
                }

                return (
                  <div
                    key={court._id}
                    className={`p-1 border-r border-zinc-200/80 dark:border-white/5 min-h-[65px] last:border-r-0 relative ${
                      isStartSlot
                        ? "pb-0 border-b-0"
                        : isIntermediateSlot
                          ? "py-0 border-b-0"
                          : "pt-0 border-b border-zinc-200/80 dark:border-white/5"
                    }`}
                  >
                    {isStartSlot ? (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, reservation)}
                        onDragEnd={handleDragEnd}
                        className={`h-full ${blockBgClass} backdrop-blur-sm border ${blockBorderClass} p-2.5 flex flex-col justify-between ${blockHoverBorderClass} hover:bg-zinc-100/20 dark:hover:bg-white/[0.08] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${blockHoverShadowClass} group/res relative hover:z-20 cursor-grab active:cursor-grabbing ${
                          isEndSlot ? "rounded-xl" : "rounded-t-xl rounded-b-none border-b-0 pb-1"
                        }`}
                        style={{ zIndex: 50 - slotIndex }}
                      >
                        {/* Drag Handle Indicator */}
                        <div className="absolute top-1 right-8 opacity-0 group-hover/res:opacity-60 transition-opacity pointer-events-none flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                          <span className="w-1 h-1 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                        </div>

                        <div className={`absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none ${isEndSlot ? "rounded-xl" : "rounded-t-xl rounded-b-none"}`} />
                        <div className="relative z-10 flex-1 flex flex-col justify-between h-full w-full">
                          <div className="flex justify-between items-start mb-1 gap-1.5">
                            <span className="text-[10px] font-black text-primary flex items-center gap-1 uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 tracking-wider select-none">
                              <Clock className="w-3 h-3" />
                              {formatArtTimeStr(reservation.startTime)} - {formatArtTimeStr(reservation.endTime)}
                            </span>
                            {(() => {
                              const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                              return (
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full tracking-wider select-none ${
                                  isPartiallyPaid
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]"
                                    : reservation.paymentStatus === "paid"
                                      ? "bg-green-500/10 text-green-400 border border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.1)]"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                                }`}>
                                  {isPartiallyPaid ? `SEÑA: $${(reservation.depositAmount ?? 0).toLocaleString("es-AR")}` : reservation.paymentStatus === "paid" ? "PAGO" : "DEBE"}
                                </span>
                              );
                            })()}
                          </div>

                          {totalSlots <= 2 && (
                            <div className="mt-2.5">
                              <h4 className="text-sm font-black text-zinc-900 dark:text-white truncate capitalize flex items-center gap-1.5 min-w-0 select-none">
                                <span className="truncate">
                                  {(() => {
                                    const baseName = reservation.firstName
                                      ? `${reservation.firstName} ${reservation.lastName}`
                                      : (reservation.userId || "Jugador");
                                    const extraStudentsCount = reservation.students && reservation.students.length > 1
                                      ? reservation.students.length - 1
                                      : 0;
                                    return extraStudentsCount > 0 ? `${baseName} (+${extraStudentsCount} alumnos)` : baseName;
                                  })()}
                                </span>
                                {isEscuelitaPadel && (
                                  <span className="inline-flex items-center text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(99,102,241,0.15)]">
                                    🎓 Escuelita Pádel
                                  </span>
                                )}
                                {isEscuelitaFutbol && (
                                  <span className="inline-flex items-center text-[9px] font-black text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20 shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(20,184,166,0.15)]">
                                    🎓 Escuelita Fútbol
                                  </span>
                                )}
                                {reservation.isRecurring && (() => {
                                  const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                                  const needsTotalPayment = reservation.paymentStatus === "pending" || isPartiallyPaid;
                                  return (
                                    <span
                                      className={`inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(99,102,241,0.15)] ${
                                        needsTotalPayment
                                          ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                          : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                      }`}
                                      title={needsTotalPayment ? "Turno Fijo - ¡Falta abonar el saldo restante del bloque de 4 semanas!" : "Turno Fijo"}
                                    >
                                      🔁 Fijo {needsTotalPayment ? "⚠️" : ""}
                                    </span>
                                  );
                                })()}
                                {reservation.isLastOfSeries && (
                                  <span className="inline-flex items-center text-[9px] font-black text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(34,197,94,0.15)] animate-pulse" title="¡Último día reservado! Clic en los tres puntos para renovar por 4 semanas más.">
                                    🚨 ÚLTIMO / RENOVAR
                                  </span>
                                )}
                              </h4>
                              {(() => {
                                const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                                const balance = (reservation.totalPrice ?? 0) - (reservation.depositAmount ?? 0);
                                return (totalSlots === 1 && isPartiallyPaid) ? (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-none select-none">
                                    Resta: <strong className="text-zinc-900 dark:text-white">${balance.toLocaleString("es-AR")}</strong>
                                  </p>
                                ) : null;
                              })()}
                            </div>
                          )}
                        </div>
                        {isEndSlot ? (
                          <div className="flex items-center justify-between border-t border-zinc-200/80 dark:border-white/5 pt-1.5 mt-1.5 relative z-10 w-full">
                            <span className={`text-[10px] font-black tracking-wider select-none ${
                              reservation.status === "confirmed"
                                ? "text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.3)]"
                                : reservation.status === "completed"
                                  ? "text-blue-400"
                                  : "text-zinc-500 dark:text-zinc-400"
                            }`}>
                              {statusLabel(reservation.status)}
                            </span>
                            <ReservationActions
                              reservationId={reservation._id}
                              status={reservation.status}
                              paymentStatus={reservation.paymentStatus}
                              totalPrice={reservation.totalPrice}
                              depositAmount={reservation.depositAmount}
                              isRecurring={reservation.isRecurring}
                              recurrenceGroupId={reservation.recurrenceGroupId}
                              isLastOfSeries={reservation.isLastOfSeries}
                              playerName={
                                reservation.firstName
                                  ? `${reservation.firstName} ${reservation.lastName}`
                                  : (reservation.userId || "")
                              }
                              startTime={reservation.startTime}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : isIntermediateSlot ? (
                      (() => {
                        const interBgClass = reservation.isRecurring && reservation.paymentStatus !== "paid"
                          ? "bg-red-500/15 dark:bg-red-950/40 border-red-400/20 dark:border-red-500/20"
                          : isEscuelitaPadel
                            ? "bg-indigo-600/25 dark:bg-indigo-950/45 border-indigo-400/20 dark:border-indigo-500/20"
                            : isEscuelitaFutbol
                              ? "bg-teal-600/20 dark:bg-teal-950/40 border-teal-400/20 dark:border-teal-500/20"
                              : "bg-zinc-100/80 dark:bg-white/5 border-zinc-200 dark:border-white/10";
                        return (
                          <div
                            className={`h-full ${interBgClass} backdrop-blur-sm border-x rounded-none px-2.5 py-1.5 flex flex-col items-center justify-center relative group/res hover:bg-zinc-100/20 dark:hover:bg-white/[0.08] transition-all duration-300`}
                            style={{ zIndex: 50 - slotIndex }}
                          >
                        {isSecondSlot && totalSlots >= 3 ? (
                          <div className="text-center w-full animate-in fade-in zoom-in-95 duration-200 select-none">
                            <h4 className="text-base font-black text-zinc-900 dark:text-white capitalize flex items-center justify-center gap-1.5 w-full">
                              <span className="truncate max-w-[150px]">
                                {(() => {
                                  const baseName = reservation.firstName
                                    ? `${reservation.firstName} ${reservation.lastName}`
                                    : (reservation.userId || "Jugador");
                                  const extraStudentsCount = reservation.students && reservation.students.length > 1
                                    ? reservation.students.length - 1
                                    : 0;
                                  return extraStudentsCount > 0 ? `${baseName} (+${extraStudentsCount} alumnos)` : baseName;
                                })()}
                              </span>
                              {reservation.isRecurring && (() => {
                                const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                                const needsTotalPayment = reservation.paymentStatus === "pending" || isPartiallyPaid;
                                return (
                                  <span
                                    className={`inline-flex items-center text-[9px] font-black px-1.5 py-0.5 rounded border shrink-0 uppercase tracking-wide shadow-[0_0_8px_rgba(99,102,241,0.15)] ${
                                      needsTotalPayment
                                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                        : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                                    }`}
                                  >
                                    🔁 Fijo
                                  </span>
                                );
                              })()}
                            </h4>
                          </div>
                        ) : (
                          <div className="w-1.5 h-3 rounded-full bg-primary/20 group-hover/res:bg-primary/45 transition-colors pointer-events-none" />
                        )}
                          </div>
                        );
                      })()
                    ) : (
                      (() => {
                        const bottomBgClass = reservation.isRecurring && reservation.paymentStatus !== "paid"
                          ? "bg-red-500/15 dark:bg-red-950/40 border-red-400/25 dark:border-red-500/30"
                          : isEscuelitaPadel
                            ? "bg-indigo-600/25 dark:bg-indigo-950/45 border-indigo-400/25 dark:border-indigo-500/30"
                            : isEscuelitaFutbol
                              ? "bg-teal-600/20 dark:bg-teal-950/40 border-teal-400/25 dark:border-teal-500/30"
                              : "bg-zinc-100/80 dark:bg-white/5 border-zinc-200 dark:border-white/10";
                        return (
                          <div
                            className={`h-full ${bottomBgClass} backdrop-blur-sm border-x border-b rounded-b-xl rounded-t-none px-2.5 py-2.5 flex flex-col justify-between relative group/res hover:bg-zinc-100/20 dark:hover:bg-white/[0.08] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.15)]`}
                            style={{ zIndex: 50 - slotIndex }}
                          >
                        <div className="text-center w-full flex flex-col items-center justify-center flex-1 select-none">
                          {(() => {
                            const isPartiallyPaid = (reservation.depositAmount ?? 0) > 0 && (reservation.depositAmount ?? 0) < (reservation.totalPrice ?? 0);
                            const balance = (reservation.totalPrice ?? 0) - (reservation.depositAmount ?? 0);

                            if (isPartiallyPaid) {
                              return (
                                <p className="text-xs text-zinc-600 dark:text-zinc-300 font-bold bg-zinc-100/80 dark:bg-white/5 px-3 py-1 rounded-lg border border-zinc-200/80 dark:border-white/5 shadow-inner">
                                  Resta: <strong className="text-zinc-900 dark:text-white font-extrabold">${balance.toLocaleString("es-AR")}</strong>
                                </p>
                              );
                            } else if (reservation.paymentStatus === "pending") {
                              return (
                                <p className="text-xs text-amber-300 font-bold bg-amber-500/5 px-3 py-1 rounded-lg border border-amber-500/10 shadow-inner">
                                  Total: <strong className="text-zinc-900 dark:text-white font-extrabold">${reservation.totalPrice.toLocaleString("es-AR")}</strong>
                                </p>
                              );
                            } else {
                              return (
                                <p className="text-xs text-green-300 font-bold bg-green-500/5 px-3 py-1 rounded-lg border border-green-500/10 shadow-inner">
                                  Total Pagado: <strong className="text-zinc-900 dark:text-white font-extrabold">${reservation.totalPrice.toLocaleString("es-AR")}</strong>
                                </p>
                              );
                            }
                          })()}
                        </div>

                        <div className="flex items-center justify-between border-t border-zinc-200/80 dark:border-white/5 pt-1.5 mt-1.5 relative z-10 w-full shrink-0">
                          <span className={`text-[10px] font-black tracking-wider select-none ${
                            reservation.status === "confirmed"
                              ? "text-primary drop-shadow-[0_0_5px_rgba(57,255,20,0.3)]"
                              : reservation.status === "completed"
                                ? "text-blue-400"
                                : "text-zinc-500 dark:text-zinc-400"
                          }`}>
                            {statusLabel(reservation.status)}
                          </span>
                          <ReservationActions
                            reservationId={reservation._id}
                            status={reservation.status}
                            paymentStatus={reservation.paymentStatus}
                            totalPrice={reservation.totalPrice}
                            depositAmount={reservation.depositAmount}
                            isRecurring={reservation.isRecurring}
                            recurrenceGroupId={reservation.recurrenceGroupId}
                            isLastOfSeries={reservation.isLastOfSeries}
                            playerName={
                              reservation.firstName
                                ? `${reservation.firstName} ${reservation.lastName}`
                                : (reservation.userId || "")
                            }
                            startTime={reservation.startTime}
                          />
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>
                );
              }

              // Empty grid cell logic
              const slotMins = slot.hour * 60 + slot.minute;
              const isHoveredInRange =
                draggingReservation &&
                hoveredSlot &&
                hoveredSlot.courtId === court._id &&
                (() => {
                  const hoverMins = hoveredSlot.hour * 60 + hoveredSlot.minute;
                  const diff = (slotMins - hoverMins) / 30;
                  return diff >= 0 && diff < draggingSlotsCount;
                })();

              const isOccupiedInHoveredRange =
                isHoveredInRange &&
                isRangeOccupied(court._id, hoveredSlot.hour, hoveredSlot.minute, draggingSlotsCount);

              return (
                <div
                  key={court._id}
                  onDragOver={(e) => handleDragOver(e, court._id, slot.hour, slot.minute)}
                  onDrop={(e) => handleDrop(e, court._id, slot.hour, slot.minute)}
                  className={`p-1 border-r border-b border-zinc-200/80 dark:border-white/5 min-h-[65px] last:border-r-0 relative transition-all duration-200 ${
                    isHoveredInRange ? "bg-zinc-100/30 dark:bg-white/[0.02]" : ""
                  }`}
                >
                  {isHoveredInRange ? (
                    <div
                      className={`absolute inset-1 rounded-xl border border-dashed flex items-center justify-center pointer-events-none animate-pulse ${
                        isOccupiedInHoveredRange
                          ? "border-red-500 bg-red-500/10 text-red-500"
                          : "border-primary bg-primary/10 text-primary"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider select-none">
                        {isOccupiedInHoveredRange ? "⚠️ Ocupado" : "Mover aquí"}
                      </span>
                    </div>
                  ) : (
                    <NewReservationButton
                      activeClubId={activeClubId}
                      defaultDate={date}
                      presetCourtId={court._id}
                      presetTime={slot.label}
                      presetDate={date}
                    >
                      <div className="h-full w-full min-h-[48px] border border-dashed border-zinc-300 dark:border-white/10 hover:border-primary/45 hover:bg-primary/[0.03] rounded-xl flex items-center justify-center group/btn cursor-pointer transition-all duration-300 py-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                        <Plus className="w-4 h-4 text-zinc-600 group-hover/btn:text-primary group-hover/btn:scale-110 group-hover/btn:rotate-90 transition-all" />
                      </div>
                    </NewReservationButton>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
