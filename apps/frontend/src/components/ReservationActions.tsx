"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, CircleDollarSign, MoreVertical, RefreshCw, X } from "lucide-react";
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
}: ReservationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositInputValue, setDepositInputValue] = useState("");
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = async (payload: {
    status?: ReservationStatus;
    paymentStatus?: PaymentStatus;
    depositAmount?: number;
    cancelSeries?: boolean;
  }) => {
    setIsOpen(false);
    setShowCancelModal(false);
    setShowDepositModal(false);

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

  const handleRenew = async () => {
    setIsRenewing(true);
    try {
      const response = await apiFetch(`/reservations/${reservationId}/renew`, {
        method: "POST",
      });

      if (response.ok) {
        setShowRenewModal(false);
        router.refresh();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Error al renovar el turno fijo.");
      }
    } catch (error) {
      console.error("Error renewing reservation:", error);
      alert("Error de conexión al renovar el turno fijo.");
    } finally {
      setIsRenewing(false);
    }
  };

  const showConfirm = status === "pending";
  const showCancel = status !== "cancelled";
  
  const isPartiallyPaid = paymentStatus === "paid" && depositAmount > 0 && depositAmount < totalPrice;
  const showPaymentActions = paymentStatus === "pending" && status !== "cancelled";

  if (!showConfirm && !showPaymentActions && !isPartiallyPaid && !showCancel) {
    return <div className="w-9 h-9" />;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
        title="Acciones de reserva"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {showConfirm && (
            <button
              onClick={() => handleUpdate({ status: "confirmed" })}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-zinc-400" />
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
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-900"
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
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
              >
                <CircleDollarSign className="w-4 h-4 text-primary" />
                <span>Registrar Pago Total {isRecurring ? "(4 sem -10%)" : ""}</span>
              </button>
            </>
          )}

          {isPartiallyPaid && (
            <button
              onClick={() => {
                const balance = totalPrice - depositAmount;
                if (confirm(`¿Registrar cobro del saldo restante de $${balance.toLocaleString("es-AR")}?`)) {
                  handleUpdate({
                    status: "confirmed",
                    paymentStatus: "paid",
                    depositAmount: totalPrice,
                  });
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-900"
            >
              <CircleDollarSign className="w-4 h-4 text-primary animate-pulse" />
              <div className="flex flex-col">
                <span className="font-bold text-white">Cobrar Saldo Restante</span>
                <span className="text-[10px] text-zinc-400">Resta cobrar: ${ (totalPrice - depositAmount).toLocaleString("es-AR") }</span>
              </div>
            </button>
          )}

          {isRecurring && recurrenceGroupId && status !== "cancelled" && (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowRenewModal(true);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between transition-colors border-t border-zinc-900 ${
                isLastOfSeries
                  ? "text-green-400 bg-green-500/5 hover:bg-green-500/10 hover:text-green-300"
                  : "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <RefreshCw className={`w-4 h-4 ${isLastOfSeries ? "animate-spin duration-1000" : ""}`} />
                <span>Renovar Turno Fijo (+4 sem)</span>
              </div>
              {isLastOfSeries && (
                <span className="text-[9px] bg-green-500/20 text-green-300 px-1.5 py-0.5 rounded border border-green-500/30 animate-pulse font-black uppercase">
                  Urgente
                </span>
              )}
            </button>
          )}

          {showCancel && (
            <button
              onClick={() => {
                if (isRecurring && recurrenceGroupId) {
                  setIsOpen(false);
                  setShowCancelModal(true);
                } else {
                  if (confirm("¿Estás seguro de que querés cancelar esta reserva?")) {
                    handleUpdate({ status: "cancelled" });
                  }
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors border-t border-zinc-900"
            >
              <Ban className="w-4 h-4" />
              <span>Cancelar reserva</span>
            </button>
          )}
        </div>
      )}

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                <Ban className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">
                  Cancelar Turno Recurrente
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Esta reserva forma parte de una serie recurrente semanal. ¿Cómo querés proceder con la cancelación?
                </p>
              </div>
              
              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={() => handleUpdate({ status: "cancelled" })}
                  className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-medium rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all text-sm shadow-md"
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
                  className="w-full py-2 px-4 bg-transparent text-zinc-500 hover:text-zinc-300 transition-all text-xs font-semibold"
                >
                  Volver / Conservar turno
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowDepositModal(false)}
          />
          <div className="relative w-full max-w-sm bg-zinc-950/85 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Registrar Pago de Seña
              </h3>
              <button
                onClick={() => setShowDepositModal(false)}
                className="text-zinc-400 hover:text-white transition-all duration-300 p-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5"
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
                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <CircleDollarSign className="w-4 h-4 text-primary" />
                  Monto pagado como seña ($)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 2000"
                  value={depositInputValue}
                  onChange={(e) => setDepositInputValue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-white/[0.08] transition-all duration-300 font-semibold text-lg"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500 italic mt-1 leading-relaxed">
                  El valor total de la reserva es de <strong className="text-zinc-300">${totalPrice.toLocaleString("es-AR")}</strong>.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all text-sm"
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

      {showRenewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !isRenewing && setShowRenewModal(false)}
          />
          <div className="relative w-full max-w-sm bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                <RefreshCw className={`w-6 h-6 ${isRenewing ? "animate-spin" : ""}`} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white flex items-center justify-center gap-2">
                  Renovar Turno Fijo
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Esta acción extenderá el turno fijo agregando exactamente <strong className="text-white font-bold">4 semanas más</strong> al final de la serie existente.
                </p>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 text-left mt-3">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block mb-1">
                    ⚠️ AVISO DE COBRO IMPORTANTE
                  </span>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-medium">
                    Al llegar la 5° semana (inicio de este nuevo bloque), <strong className="text-amber-300">recordá cobrar el abono total de las 4 semanas siguientes</strong>. Las nuevas fechas se registrarán como pendientes de pago.
                  </p>
                </div>
              </div>

              <div className="w-full space-y-2 pt-2">
                <button
                  onClick={handleRenew}
                  disabled={isRenewing}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold rounded-xl transition-all text-sm shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isRenewing ? "Renovando..." : "Confirmar y Renovar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRenewModal(false)}
                  disabled={isRenewing}
                  className="w-full py-2 px-4 bg-transparent text-zinc-500 hover:text-zinc-300 transition-all text-xs font-semibold"
                >
                  Volver / Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
