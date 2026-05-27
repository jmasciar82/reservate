"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, CircleDollarSign, MoreVertical } from "lucide-react";
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
}

export default function ReservationActions({
  reservationId,
  status,
  paymentStatus,
  totalPrice = 0,
  depositAmount = 0,
  isRecurring,
  recurrenceGroupId,
}: ReservationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
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
                  const amountStr = prompt(`Ingresá el monto de la seña pagada:`, String(defaultDeposit));
                  if (amountStr === null) return;
                  const amount = Number(amountStr);
                  if (isNaN(amount) || amount <= 0) {
                    alert("Por favor ingresá un monto válido.");
                    return;
                  }
                  handleUpdate({
                    status: "confirmed",
                    paymentStatus: "paid",
                    depositAmount: amount,
                  });
                }}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors border-t border-zinc-900"
              >
                <CircleDollarSign className="w-4 h-4 text-blue-400" />
                <span>Registrar Pago de Seña</span>
              </button>

              <button
                onClick={() => handleUpdate({
                  status: "confirmed",
                  paymentStatus: "paid",
                  depositAmount: totalPrice,
                })}
                className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
              >
                <CircleDollarSign className="w-4 h-4 text-primary" />
                <span>Registrar Pago Total</span>
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
    </div>
  );
}
