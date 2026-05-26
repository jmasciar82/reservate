"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CreditCard, CheckCircle2, XCircle, ShieldAlert, Loader2, Sparkles } from "lucide-react";

function MockCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservation_id");
  const preferenceId = searchParams.get("preference_id");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservationDetails, setReservationDetails] = useState<any>(null);

  const isFree = searchParams.get("free") === "true";

  // Si la reserva es gratis (sin seña), autoprocesar pago aprobado inmediatamente
  useEffect(() => {
    if (isFree && reservationId) {
      const timer = setTimeout(() => {
        handleSimulatePayment("success");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFree, reservationId]);

  const handleSimulatePayment = async (status: "success" | "failure") => {
    if (!reservationId) {
      setError("No se detectó un ID de reserva válido.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const mockPaymentId = `mp-sim-${Math.floor(Math.random() * 100000000)}`;

      // Llamar al endpoint del backend para confirmar/cancelar
      const res = await apiFetch(`/public/reservations/${reservationId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: mockPaymentId,
          status: status === "success" ? "success" : "failure",
        }),
      });

      if (res.ok) {
        // Redirigir a la página de resultados con el estado
        router.push(
          `/reservar/resultado?status=${status}&reservation_id=${reservationId}&payment_id=${mockPaymentId}&is_mock=true`
        );
      } else {
        const errData = await res.json();
        setError(errData.message || "Error al registrar la simulación de pago.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión al simular el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-[#fafafa] flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-[#111827]/80 border border-blue-500/20 rounded-3xl p-6 md:p-8 backdrop-blur-md shadow-[0_0_50px_rgba(59,130,246,0.1)] relative overflow-hidden">
        {/* Glow decorative banner */}
        <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />

        {/* Mock Badge */}
        <div className="flex justify-center mb-6">
          <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full">
            <Sparkles className="h-3 w-3 animate-pulse" /> Sandbox Simulado
          </span>
        </div>

        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            {isFree ? "Confirmando Reserva" : "Pasarela de Pago"}
          </h1>
          <p className="text-xs text-[#9ca3af] max-w-xs mx-auto">
            {isFree 
              ? "Esta sede no requiere el pago de una seña previa. Estamos registrando y confirmando tu turno automáticamente..."
              : "Estás en el entorno de pruebas local. Aquí podés simular la aprobación o el rechazo de la seña para completar el circuito de reserva."}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-xs text-center">
            {error}
          </div>
        )}

        <div className="bg-[#1f2937]/50 border border-[#374151] rounded-2xl p-4 mb-8 text-xs flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">ID de Reserva:</span>
            <span className="font-mono text-white select-all">{reservationId || "No provisto"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Tipo de Seña:</span>
            <span className="text-white font-semibold">{isFree ? "Sin Seña ($0)" : "Reserva Cancha"}</span>
          </div>
          {preferenceId && !isFree && (
            <div className="flex justify-between border-t border-[#374151] pt-2 mt-1">
              <span className="text-[#9ca3af]">Preferencia MP:</span>
              <span className="font-mono text-white truncate max-w-[180px]">{preferenceId}</span>
            </div>
          )}
        </div>

        {isFree ? (
          <div className="flex flex-col items-center justify-center py-6 gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <span className="text-sm font-bold text-primary animate-pulse">Procesando confirmación...</span>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={() => handleSimulatePayment("success")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-primary text-[#09090b] font-bold shadow-[0_0_25px_rgba(57,255,20,0.25)] hover:shadow-[0_0_35px_rgba(57,255,20,0.45)] hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#09090b]" />
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Simular Pago Aprobado
                </>
              )}
            </button>

            <button
              onClick={() => handleSimulatePayment("failure")}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  Simular Pago Rechazado
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-8 text-center flex items-center justify-center gap-1 text-[10px] text-[#6b7280]">
          <ShieldAlert className="h-3.5 w-3.5 text-blue-500" />
          <span>{isFree ? "La reserva se confirmará de inmediato." : "Ningún cargo real será efectuado a tus tarjetas."}</span>
        </div>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#0b0f19] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    }>
      <MockCheckoutContent />
    </Suspense>
  );
}
