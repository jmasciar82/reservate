"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, AlertTriangle, Calendar, Trophy, ChevronRight, CornerDownRight, CreditCard } from "lucide-react";

function ResultadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const status = searchParams.get("status");
  const reservationId = searchParams.get("reservation_id");
  const paymentId = searchParams.get("payment_id");
  const isMock = searchParams.get("is_mock") === "true";

  const isSuccess = status === "success" || status === "approved";
  const isFailure = status === "failure" || status === "rejected";
  const isPending = status === "pending" || status === "in_process";

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <header className="border-b border-[#27272a] bg-[#09090b]/85 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center font-bold text-[#09090b] shadow-[0_0_15px_rgba(57,255,20,0.5)]">
            R
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Reservate<span className="text-primary font-extrabold">.</span>
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 py-12 md:py-20 flex items-center justify-center">
        <div className="w-full bg-[#18181b]/50 border border-[#27272a] rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl text-center relative overflow-hidden">
          
          {/* Decorative Glow */}
          {isSuccess && <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />}
          {isFailure && <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-red-500/10 blur-3xl" />}

          {/* Success State */}
          {isSuccess && (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(57,255,20,0.15)] animate-bounce">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
                ¡Reserva Confirmada!
              </h1>
              <p className="text-sm text-[#a1a1aa] max-w-xs mb-6">
                Tu seña ha sido acreditada correctamente. La cancha está reservada a tu nombre. ¡Te esperamos!
              </p>

              <div className="w-full bg-[#09090b]/60 border border-[#27272a] rounded-2xl p-4 text-xs flex flex-col gap-2.5 mb-8 text-left">
                <div className="flex justify-between border-b border-[#27272a]/60 pb-2 mb-1">
                  <span className="text-[#a1a1aa]">Comprobante de Reserva</span>
                  <span className="font-bold text-primary uppercase">Pago Aprobado</span>
                </div>
                {reservationId && (
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">ID de Turno:</span>
                    <span className="font-mono text-white select-all">{reservationId}</span>
                  </div>
                )}
                {paymentId && (
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">ID de Pago:</span>
                    <span className="font-mono text-white select-all">{paymentId}</span>
                  </div>
                )}
                {isMock && (
                  <div className="flex justify-between text-[#a1a1aa] italic">
                    <span>Método de Simulación:</span>
                    <span className="text-blue-400">Sandbox Local</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-[#a1a1aa] bg-[#18181b] border border-[#27272a] rounded-lg p-2 mt-2">
                  <CornerDownRight className="h-3 w-3 text-primary" />
                  <span>Se envió un comprobante detallado a tu correo electrónico.</span>
                </div>
              </div>

              <button
                onClick={() => router.push("/reservar")}
                className="w-full py-3 px-4 rounded-xl bg-primary text-[#09090b] font-bold shadow-[0_0_20px_rgba(57,255,20,0.25)] hover:shadow-[0_0_30px_rgba(57,255,20,0.45)] hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-1 text-sm"
              >
                Hacer otra Reserva
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Failure State */}
          {isFailure && (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <XCircle className="h-9 w-9" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
                Pago Rechazado
              </h1>
              <p className="text-sm text-[#a1a1aa] max-w-xs mb-6">
                Mercado Pago no pudo procesar tu transacción. La reserva no ha sido confirmada y la cancha sigue libre.
              </p>

              <div className="w-full bg-[#09090b]/60 border border-red-500/10 rounded-2xl p-4 text-xs text-left mb-8">
                <p className="text-[#a1a1aa] leading-relaxed">
                  Podés volver a intentarlo utilizando otra tarjeta, saldo de Mercado Pago o verificando con tu banco si hay alguna restricción para pagos en línea.
                </p>
              </div>

              <div className="flex flex-col w-full gap-3">
                <button
                  onClick={() => router.push("/reservar")}
                  className="w-full py-3 px-4 rounded-xl bg-[#18181b] border border-[#27272a] text-white font-bold hover:bg-[#27272a] active:scale-98 transition-all text-sm"
                >
                  Intentar Nuevamente
                </button>
              </div>
            </div>
          )}

          {/* Pending/Other State */}
          {!isSuccess && !isFailure && (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                <AlertTriangle className="h-9 w-9" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-2">
                Pago en Proceso
              </h1>
              <p className="text-sm text-[#a1a1aa] max-w-xs mb-6">
                Tu pago está siendo evaluado por Mercado Pago. Recibirás una confirmación por mail en cuanto sea aprobado.
              </p>

              <div className="w-full bg-[#09090b]/60 border border-[#27272a] rounded-2xl p-4 text-xs flex flex-col gap-2.5 mb-8 text-left">
                {reservationId && (
                  <div className="flex justify-between">
                    <span className="text-[#71717a]">ID de Reserva:</span>
                    <span className="font-mono text-white">{reservationId}</span>
                  </div>
                )}
                <div className="text-[10px] text-[#a1a1aa] mt-1 bg-[#18181b] p-2 rounded-lg border border-[#27272a]">
                  Una vez que Mercado Pago apruebe el dinero, tu turno aparecerá inmediatamente como "Confirmado" en nuestro sistema.
                </div>
              </div>

              <button
                onClick={() => router.push("/reservar")}
                className="w-full py-3 px-4 rounded-xl bg-[#18181b] border border-[#27272a] text-white font-bold hover:bg-[#27272a] active:scale-98 transition-all text-sm"
              >
                Volver al Asistente
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default function ResultadoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full bg-[#09090b] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    }>
      <ResultadoContent />
    </Suspense>
  );
}
