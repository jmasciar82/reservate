"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, CheckCircle, Ban } from "lucide-react";

interface ReservationActionsProps {
  reservationId: string;
  status: string;
  paymentStatus: string;
}

export default function ReservationActions({ reservationId, status, paymentStatus }: ReservationActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUpdate = async (payload: { status?: string; paymentStatus?: string }) => {
    setIsOpen(false);
    try {
      const res = await fetch(`http://localhost:3001/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Error al actualizar la reserva.");
      }
    } catch (error) {
      console.error("Error updating reservation:", error);
    }
  };

  const showConfirm = status === "pending";
  const showCancel = status !== "cancelled";

  if (!showConfirm && !showCancel) {
    return <div className="w-9 h-9" />; // Spacer
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
        <div className="absolute right-0 mt-1 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {showConfirm && (
            <button
              onClick={() => handleUpdate({ status: "confirmed", paymentStatus: "paid" })}
              className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 flex items-center gap-2.5 transition-colors"
            >
              <CheckCircle className="w-4 h-4 text-primary" />
              <span>Confirmar Pago de Seña</span>
            </button>
          )}

          {showCancel && (
            <button
              onClick={() => {
                if (confirm("¿Estás seguro de que deseas cancelar esta reserva?")) {
                  handleUpdate({ status: "cancelled" });
                }
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors border-t border-zinc-900"
            >
              <Ban className="w-4 h-4" />
              <span>Cancelar Reserva</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
