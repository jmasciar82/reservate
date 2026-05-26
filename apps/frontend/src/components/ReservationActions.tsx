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
}

export default function ReservationActions({
  reservationId,
  status,
  paymentStatus,
}: ReservationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
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
  }) => {
    setIsOpen(false);

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
  const showMarkPaid = paymentStatus !== "paid" && status !== "cancelled";
  const showCancel = status !== "cancelled";

  if (!showConfirm && !showMarkPaid && !showCancel) {
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
        <div className="absolute right-0 mt-1 w-56 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {showConfirm && (
            <button
              onClick={() =>
                handleUpdate({ status: "confirmed", paymentStatus: "paid" })
              }
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Confirmar reserva</span>
            </button>
          )}

          {showMarkPaid && (
            <button
              onClick={() => handleUpdate({ paymentStatus: "paid" })}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
            >
              <CircleDollarSign className="w-4 h-4 text-primary" />
              <span>Registrar pago (auto-confirma)</span>
            </button>
          )}

          {showCancel && (
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de que querés cancelar esta reserva?")) {
                  handleUpdate({ status: "cancelled" });
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
    </div>
  );
}
