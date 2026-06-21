"use client";
import React, { useState, useEffect } from "react";
import { Lock, Loader2, CheckCircle2, ShieldCheck, User, Mail } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ProfilePage() {
  // Datos Personales
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("");
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // Cambio de Contraseña
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiFetch("/users/profile");
      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setEmail(data.email || "");
        setInitials(data.initials || "");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setSuccessInfo(null);

    if (!name.trim() || !email.trim()) {
      setErrorInfo("El nombre y el correo electrónico son obligatorios.");
      return;
    }

    if (initials.trim().length > 3) {
      setErrorInfo("Las iniciales no pueden tener más de 3 caracteres.");
      return;
    }

    setLoadingInfo(true);

    try {
      const response = await apiFetch("/users/profile/info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, initials: initials.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar la información.");
      }

      setSuccessInfo("Información personal actualizada con éxito.");

      // Dispatch custom event to notify other components (like Header)
      window.dispatchEvent(
        new CustomEvent("profile-updated", {
          detail: { name, email, initials: initials.trim() },
        })
      );
    } catch (err: any) {
      setErrorInfo(err.message || "Ocurrió un error al guardar los cambios.");
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/users/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al cambiar la contraseña.");
      }

      setSuccess("Contraseña actualizada con éxito.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Verificá tu contraseña actual.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10 font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mi Perfil</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Gestioná la información personal y la seguridad de tu cuenta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formularios de actualización */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Datos Personales */}
          <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-300/50 dark:via-white/10 to-transparent pointer-events-none" />
            
            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
              Datos Personales
            </h2>

            {errorInfo && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                {errorInfo}
              </div>
            )}

            {successInfo && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-450 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {successInfo}
              </div>
            )}

            <form onSubmit={handleUpdateInfo} className="space-y-5 max-w-md">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    placeholder="Ej. juan@club.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider flex justify-between">
                  <span>Iniciales</span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 lowercase normal-case">(opcional - máx. 3 carac.)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-450 dark:text-zinc-400 select-none">
                    Aa
                  </span>
                  <input
                    type="text"
                    maxLength={3}
                    placeholder="Ej. JP"
                    value={initials}
                    onChange={(e) => setInitials(e.target.value.toUpperCase())}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all font-semibold tracking-widest uppercase"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingInfo}
                className="px-6 py-3 bg-primary text-[#09090b] font-black rounded-xl text-xs shadow-lg shadow-primary/20 hover:shadow-primary/45 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loadingInfo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </form>
          </div>

          {/* Card: Cambiar Contraseña */}
          <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-300/50 dark:via-white/10 to-transparent pointer-events-none" />
            
            <h2 className="text-lg font-black text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
              Cambiar Contraseña
            </h2>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-450 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                {success}
              </div>
            )}

            <form onSubmit={handleSubmitPassword} className="space-y-5 max-w-md">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    placeholder="Ingresá tu contraseña de hoy"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repetir nueva contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-primary text-[#09090b] font-black rounded-xl text-xs shadow-lg shadow-primary/20 hover:shadow-primary/45 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Guardar Contraseña"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Panel lateral informativo */}
        <div className="bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900/30 dark:to-zinc-950/30 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-xl flex flex-col gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white">Seguridad de la Cuenta</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Te recomendamos elegir una contraseña robusta que combine letras, números y caracteres especiales. No compartas tus credenciales de acceso.
          </p>
          <div className="border-t border-zinc-200 dark:border-white/5 pt-4 mt-2">
            <h4 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2">Requisitos</h4>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1.5 font-medium">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Mínimo 6 caracteres
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Debe coincidir con la confirmación
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Requiere tu contraseña actual por seguridad
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
