"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, CircleDollarSign, Edit, MoreVertical, User, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { PaymentStatus, ReservationStatus } from "@/lib/types";

interface ReservationActionsProps {
  reservationId: string;
  status: ReservationStatus;
  paymentStatus: PaymentStatus;
  totalPrice?: number;
  depositAmount?: number;
  isRecurring?: boolean;
  recurrenceGroupId?: string;
  isLastOfSeries?: boolean;
  playerName?: string;
  startTime?: string;
}

export default function ReservationActions({
  reservationId,
  status,
  paymentStatus,
  totalPrice = 0,
  depositAmount = 0,
  isRecurring,
  recurrenceGroupId,
  isLastOfSeries = false,
  playerName = "",
  startTime,
}: ReservationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositInputValue, setDepositInputValue] = useState("");
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showSingleCancelModal, setShowSingleCancelModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [nameInputValue, setNameInputValue] = useState(playerName || "");
  const [expandUp, setExpandUp] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderModal = (isOpen: boolean, content: React.ReactNode) => {
    if (!isOpen || !mounted || typeof window === "undefined" || !document.body) return null;
    return createPortal(content, document.body);
  };

  const handleToggle = () => {
    if (!isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      
      let spaceAboveWithinContainer = 999;
      const scrollContainer = menuRef.current.closest('.overflow-x-auto');
      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        spaceAboveWithinContainer = rect.top - containerRect.top;
      }

      // Solo desplegar hacia arriba si falta espacio abajo Y hay espacio suficiente arriba en el viewport Y dentro del contenedor scrollable
      setExpandUp(spaceBelow < 280 && rect.top > 280 && spaceAboveWithinContainer > 220);
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    setNameInputValue(playerName || "");
  }, [playerName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (menuRef.current) {
      const card = menuRef.current.closest(".group\\/res, .group") as HTMLElement;
      if (card) {
        if (isOpen) {
          card.style.zIndex = "40";
        } else {
          card.style.zIndex = "";
        }
      }
    }
  }, [isOpen]);

  const handleUpdate = async (payload: {
    status?: ReservationStatus;
    paymentStatus?: PaymentStatus;
    depositAmount?: number;
    cancelSeries?: boolean;
    userId?: string;
    payBlock?: boolean;
  }) => {
    setIsOpen(false);
    setShowCancelModal(false);
    setShowDepositModal(false);
    setShowEditNameModal(false);

    try {
      const response = await apiFetch(`/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.refresh();
      } else {
        alert("Error al actualizar la reserva.");
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Error al actualizar la reserva.");
    }
  };

  const isPast = startTime ? new Date(startTime) < new Date() : false;
  const showConfirm = status === "pending";
  const showCancel = status !== "cancelled" && !isPast;
  
  const isPartiallyPaid = paymentStatus === "paid" && depositAmount > 0 && depositAmount < totalPrice;
  const showPaymentActions = paymentStatus === "pending" && status !== "cancelled";

  if (!showConfirm && !showPaymentActions && !isPartiallyPaid && !showCancel) {
    return <div className="w-9 h-9" />;
  }

  return (
    <div className={`relative ${isOpen ? "z-30" : ""}`} ref={menuRef}>
      <button
        onClick={handleToggle}
        className="p-2 text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all"
        title="Acciones de reserva"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className={`absolute right-0 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl z-50 py-1.5 animate-in fade-in duration-150 ${
          expandUp 
            ? "bottom-full mb-1 slide-in-from-bottom-2" 
            : "top-full mt-1 slide-in-from-top-2"
        }`}>
          {showConfirm && (
            <button
              onClick={() => handleUpdate({ status: "confirmed" })}
              className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Confirmar (sin cobrar)</span>
            </button>
          )}

          {showPaymentActions && (
            <>
              <button
                onClick={() => {
                  const defaultDeposit = Math.round(totalPrice * 0.3);
                  setDepositInputValue(String(defaultDeposit));
                  setIsOpen(false);
                  setShowDepositModal(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
              >
                <CircleDollarSign className="w-4 h-4 text-blue-400" />
                <span>Registrar Pago de Seña</span>
              </button>

              <button
                onClick={() => {
                  if (isRecurring) {
                    const originalTotal = totalPrice * 4;
                    const discountedTotal = Math.round(originalTotal * 0.9);
                    const savings = originalTotal - discountedTotal;
                    if (
                      confirm(
                        `¿Registrar Pago Total del bloque de 4 semanas con un 10% de descuento?\n\n` +
                        `• Total normal (4 sem): $${originalTotal.toLocaleString("es-AR")}\n` +
                        `• Total con 10% OFF: $${discountedTotal.toLocaleString("es-AR")}\n` +
                        `• Ahorro: $${savings.toLocaleString("es-AR")}\n\n` +
                        `Esta acción marcará las 4 semanas de este bloque mensual como pagadas con descuento.`
                      )
                    ) {
                      handleUpdate({
                        status: "confirmed",
                        paymentStatus: "paid",
                        payBlock: true,
                      });
                    }
                  } else {
                    handleUpdate({
                      status: "confirmed",
                      paymentStatus: "paid",
                      depositAmount: totalPrice,
                    });
                  }
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
              >
                <CircleDollarSign className="w-4 h-4 text-primary" />
                <span>Registrar Pago Total {isRecurring ? "(4 sem -10%)" : ""}</span>
              </button>
            </>
          )}

          {isPartiallyPaid && (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowBalanceModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
            >
              <CircleDollarSign className="w-4 h-4 text-primary animate-pulse" />
              <div className="flex flex-col">
                <span className="font-bold text-zinc-900 dark:text-white">Cobrar Saldo Restante {isRecurring ? "(Bloque)" : ""}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Resta cobrar: ${ (totalPrice * (isRecurring ? 4 : 1) - depositAmount).toLocaleString("es-AR") }
                </span>
              </div>
            </button>
          )}

          {status !== "cancelled" && (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowEditNameModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
            >
              <Edit className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Editar nombre</span>
            </button>
          )}

          {showCancel && (
            <button
              onClick={() => {
                if (isRecurring && recurrenceGroupId) {
                  setIsOpen(false);
                  setShowCancelModal(true);
                } else {
                  setIsOpen(false);
                  setShowSingleCancelModal(true);
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors border-t border-zinc-100 dark:border-zinc-900"
            >
              <Ban className="w-4 h-4" />
              <span>Cancelar reserva</span>
            </button>
          )}
        </div>
      )}

      {renderModal(
        showCancelModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Cancelar Turno Recurrente
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Esta reserva forma parte de una serie recurrente semanal. ¿Cómo querés proceder con la cancelación?
                </p>
              </div>
              
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={() => handleUpdate({ status: "cancelled" })}
                  className="w-full py-2.5 px-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white font-medium rounded-lg border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm shadow-md"
                >
                  Cancelar solo esta fecha
                </button>
                <button
                  onClick={() => handleUpdate({ status: "cancelled", cancelSeries: true })}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all text-sm shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:scale-[1.01]"
                >
                  Cancelar toda la serie (esta y futuras)
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full py-2 px-4 bg-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all text-xs font-semibold"
                >
                  Volver / Conservar turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderModal(
        showDepositModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDepositModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Registrar Pago de Seña
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const amount = Number(depositInputValue);
                if (isNaN(amount) || amount <= 0 || amount > totalPrice) {
                  alert(`Por favor ingresá un monto válido (máximo $${totalPrice.toLocaleString()}).`);
                  return;
                }
                handleUpdate({
                  status: "confirmed",
                  paymentStatus: "paid",
                  depositAmount: amount,
                });
                setShowDepositModal(false);
              }}
              className="p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-primary" />
                  Monto pagado como seña ($)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 2000"
                  value={depositInputValue}
                  onChange={(e) => setDepositInputValue(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold text-lg"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500 italic mt-1 leading-relaxed">
                  El valor total de la reserva es de <strong className="text-zinc-600 dark:text-zinc-300">${totalPrice.toLocaleString("es-AR")}</strong>.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Registrar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {renderModal(
        showBalanceModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowBalanceModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                {isRecurring ? "Cobrar Saldo Restante (Bloque)" : "Cobrar Saldo Restante"}
              </h3>
              <button
                onClick={() => setShowBalanceModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Valor Total {isRecurring ? "(4 sem)" : ""}:</span>
                  <span className="text-zinc-900 dark:text-white">${(totalPrice * (isRecurring ? 4 : 1)).toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>Seña Pagada:</span>
                  <span className="text-blue-400">${depositAmount.toLocaleString("es-AR")}</span>
                </div>
                <div className="border-t border-zinc-200/80 dark:border-white/5 pt-2 flex justify-between text-sm font-bold text-zinc-600 dark:text-zinc-200">
                  <span>Saldo Restante:</span>
                  <span className="text-primary text-base drop-shadow-[0_0_6px_rgba(57,255,20,0.3)]">
                    ${(totalPrice * (isRecurring ? 4 : 1) - depositAmount).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
 
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center leading-relaxed font-semibold">
                {isRecurring 
                  ? "¿Confirmás el cobro del saldo restante del bloque completo de 4 semanas? Todas las reservas de este mes quedarán marcadas como totalmente pagadas."
                  : "¿Confirmás el cobro del saldo restante? La reserva quedará marcada como totalmente pagada."}
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBalanceModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdate({
                      status: "confirmed",
                      paymentStatus: "paid",
                      payBlock: isRecurring ? true : undefined,
                      depositAmount: isRecurring ? undefined : totalPrice,
                    });
                    setShowBalanceModal(false);
                  }}
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {renderModal(
        showEditNameModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowEditNameModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Editar Jugador
              </h3>
              <button
                onClick={() => setShowEditNameModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmedValue = nameInputValue.trim();
                if (!trimmedValue) {
                  alert("Por favor ingresá un nombre válido.");
                  return;
                }
                handleUpdate({
                  userId: trimmedValue,
                });
              }}
              className="p-6 space-y-5"
            >
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre del jugador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nameInputValue}
                  onChange={(e) => setNameInputValue(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold text-base"
                  autoFocus
                />
                {isRecurring && (
                  <p className="text-[10px] text-zinc-500 bg-indigo-500/5 border border-indigo-500/10 rounded-lg p-2 mt-2 leading-relaxed flex items-start gap-1.5">
                    <span className="text-indigo-400 shrink-0 font-extrabold text-[11px]">🔁</span>
                    <span>
                      Al ser un <strong>turno fijo recurrente</strong>, el nuevo nombre se aplicará automáticamente a esta reserva y a todas las futuras fechas de la serie.
                    </span>
                  </p>
                )}
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditNameModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_20px_rgba(57,255,20,0.45)] transition-all text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderModal(
        showSingleCancelModal,
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowSingleCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                Cancelar Reserva
              </h3>
              <button
                onClick={() => setShowSingleCancelModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100/80 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200/80 dark:border-white/5"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="bg-zinc-50 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 rounded-xl p-4 space-y-3">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed text-center font-medium">
                  ¿Estás seguro de que querés cancelar esta reserva? Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSingleCancelModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 transition-all text-sm"
                >
                  Volver / Conservar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdate({ status: "cancelled" });
                    setShowSingleCancelModal(false);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] hover:shadow-[0_4px_20px_rgba(239,68,68,0.45)] transition-all text-sm"
                >
                  Sí, Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
