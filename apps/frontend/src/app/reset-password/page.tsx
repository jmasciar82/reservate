"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, ChevronLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Token de restablecimiento faltante.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al restablecer la contraseña.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. El token puede haber expirado o ser inválido.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md text-center">
        <div className="h-14 w-14 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-black text-white mb-2">Enlace inválido</h2>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          No se detectó ningún token de recuperación en el enlace. Por favor, solicita uno nuevo.
        </p>
        <Link
          href="/forgot-password"
          className="w-full py-3 bg-zinc-800 text-white font-bold rounded-xl text-xs hover:bg-zinc-700 transition-colors block text-center"
        >
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-12 -left-12 h-36 w-36 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="flex flex-col items-center mb-8 text-center">
        <img
          src="/logo.jpg"
          alt="Reservate Logo"
          className="w-16 h-16 object-cover rounded-2xl border border-primary/20 shadow-[0_0_15px_rgba(57,255,20,0.2)] mb-4"
        />
        <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-zinc-200 to-primary bg-clip-text text-transparent">
          ESTABLECER CONTRASEÑA
        </h1>
        <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
          Ingresá y confirmá tu nueva contraseña para reactivar tu acceso al sistema.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-semibold flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
          {error}
        </div>
      )}

      {success ? (
        <div className="flex flex-col items-center text-center py-4 space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-base font-extrabold text-white">¡Contraseña restablecida!</h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
            Tu contraseña se actualizó correctamente. Serás redirigido a la pantalla de inicio de sesión en unos instantes...
          </p>
          <Link
            href="/login"
            className="text-xs text-primary font-bold hover:underline pt-2"
          >
            Ir al Login de inmediato ➔
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-[#fafafa] placeholder-zinc-650 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Repetir contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-[#fafafa] placeholder-zinc-650 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-[#09090b] font-black rounded-xl text-xs shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando nueva contraseña...
              </>
            ) : (
              "Restablecer Contraseña"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center p-4 font-sans">
      <Suspense fallback={
        <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-zinc-400">Verificando enlace...</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
