"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ChevronLeft, Loader2, KeyRound } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al solicitar la recuperación.");
      }

      const data = await response.json();
      setMessage(data.message || "Solicitud procesada correctamente.");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-[#fafafa] flex flex-col items-center justify-center p-4 font-sans">
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
            RECUPERAR CONTRASEÑA
          </h1>
          <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed">
            Ingresá tu correo electrónico registrado y te enviaremos las instrucciones para restablecer tu contraseña.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-semibold flex items-center justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
            {error}
          </div>
        )}

        {message ? (
          <div className="space-y-6 text-center py-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-relaxed font-semibold">
              {message}
            </div>
            <p className="text-[10px] text-zinc-500 italic bg-zinc-950 p-3 rounded-lg border border-zinc-800">
              💡 Para pruebas en desarrollo local: El enlace de restablecimiento con el token temporal se ha impreso directamente en la consola del servidor backend (NestJS).
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline pt-2"
            >
              <ChevronLeft className="w-4 h-4" /> Volver al Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@reservate.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-[#fafafa] placeholder-zinc-600 focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-[#09090b] font-black rounded-xl text-xs shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-101 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando solicitud...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Enviar Enlace de Recuperación
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Cancelar y volver
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
