"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Club } from "@/lib/types";

import { useClub } from "@/providers/ClubProvider";

type ClubFormData = {
  name: string;
  location: string;
  sports: string;
  description: string;
  bookingEnabled: boolean;
  depositType: "percentage" | "fixed" | "none";
  depositValue: number;
  mpAccessToken: string;
  mpPublicKey: string;
};

const initialFormData: ClubFormData = {
  name: "",
  location: "",
  sports: "padel",
  description: "",
  bookingEnabled: true,
  depositType: "percentage",
  depositValue: 30,
  mpAccessToken: "",
  mpPublicKey: "",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await apiFetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function toFormData(club: Club): ClubFormData {
  return {
    name: club.name,
    location: club.location ?? "",
    sports: club.sports?.join(", ") ?? "",
    description: club.description ?? "",
    bookingEnabled: club.bookingEnabled !== false,
    depositType: club.depositType ?? "percentage",
    depositValue: club.depositValue ?? 30,
    mpAccessToken: club.mpAccessToken ?? "",
    mpPublicKey: club.mpPublicKey ?? "",
  };
}

function toPayload(formData: ClubFormData) {
  return {
    name: formData.name.trim(),
    location: formData.location.trim(),
    sports: formData.sports
      .split(",")
      .map((sport) => sport.trim())
      .filter(Boolean),
    description: formData.description.trim(),
    bookingEnabled: formData.bookingEnabled,
    depositType: formData.depositType,
    depositValue: Number(formData.depositValue),
    mpAccessToken: formData.mpAccessToken.trim(),
    mpPublicKey: formData.mpPublicKey.trim(),
  };
}

export default function SettingsPage() {
  const { clubs, refreshClubs: globalRefreshClubs } = useClub();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClubFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  const refreshClubs = async () => {
    await globalRefreshClubs();
  };

  const resetForm = () => {
    setEditingClubId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingClubId ? `/clubs/${editingClubId}` : "/clubs";
      const method = editingClubId ? "PUT" : "POST";
      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(formData)),
      });

      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      setShowForm(false);
      resetForm();
      await refreshClubs();
    } catch (saveError) {
      console.error("Error saving club:", saveError);
      setError("No se pudo guardar el club.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (club: Club) => {
    setEditingClubId(club._id);
    setFormData(toFormData(club));
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  const handleDelete = async (clubId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar esta sede? Asegurate de eliminar primero todas las canchas asociadas a ella.")) return;
    
    setSaving(true);
    setError(null);
    try {
      const response = await apiFetch(`/clubs/${clubId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      await refreshClubs();
    } catch (err) {
      console.error("Error deleting club:", err);
      setError("No se pudo eliminar la sede.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración de Sedes</h1>
          <p className="text-zinc-400">
            Administrá los datos de las distintas sedes de tu club.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:-translate-y-0.5 transition-all w-fit"
          >
            <Plus className="w-5 h-5" />
            Añadir nueva sede
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border p-5 rounded-lg mb-8 shadow-lg max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingClubId ? "Editar sede" : "Nueva sede"}
            </h2>
            <button onClick={handleCancel} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nombre de la sede
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Ubicación / Dirección
                </label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={(event) =>
                    setFormData({ ...formData, location: event.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Deportes (separados por coma)
                </label>
                <input
                  required
                  type="text"
                  value={formData.sports}
                  onChange={(event) =>
                    setFormData({ ...formData, sports: event.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </div>

            {/* Configuración de Reservas Públicas y Pagos */}
            <div className="border-t border-zinc-800/80 pt-5 mt-5">
              <h3 className="text-lg font-bold text-primary mb-4">Configuración de Reservas Públicas y Pagos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Reservas públicas habilitadas */}
                <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-white">Habilitar Reservas Públicas</label>
                    <span className="text-xs text-zinc-400">Permitir a usuarios no registrados reservar online</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.bookingEnabled}
                    onChange={(event) =>
                      setFormData({ ...formData, bookingEnabled: event.target.checked })
                    }
                    className="w-5 h-5 accent-primary cursor-pointer"
                  />
                </div>

                {/* Tipo de Seña */}
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Tipo de Seña
                  </label>
                  <select
                    value={formData.depositType}
                    onChange={(event) =>
                      setFormData({ ...formData, depositType: event.target.value as "percentage" | "fixed" | "none" })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3.5 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                    <option value="none">Sin Seña</option>
                  </select>
                </div>

                {/* Valor de Seña */}
                {formData.depositType !== "none" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      {formData.depositType === "percentage" ? "Porcentaje de Seña (%)" : "Monto Fijo de Seña ($)"}
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.depositValue}
                      onChange={(event) =>
                        setFormData({ ...formData, depositValue: Number(event.target.value) })
                      }
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                )}

                {/* Separador para credenciales */}
                <div className="md:col-span-2 border-t border-dashed border-zinc-800/80 pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-zinc-300 mb-2">Credenciales de Mercado Pago (Específico de la Sede)</h4>
                  <p className="text-xs text-zinc-500 mb-4">Ingresá tus credenciales de Mercado Pago para que las señas cobradas se depositen directamente en tu cuenta.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Mercado Pago Public Key
                  </label>
                  <input
                    type="text"
                    placeholder="APP_USR-..."
                    value={formData.mpPublicKey}
                    onChange={(event) =>
                      setFormData({ ...formData, mpPublicKey: event.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">
                    Mercado Pago Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="TEST-... o APP_USR-..."
                    value={formData.mpAccessToken}
                    onChange={(event) =>
                      setFormData({ ...formData, mpAccessToken: event.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving
                  ? "Guardando..."
                  : editingClubId
                    ? "Guardar cambios"
                    : "Crear sede"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Cargando sedes...</p>
      ) : clubs.length === 0 && !showForm ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500">Aún no hay sedes configuradas en la base de datos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {clubs.map((club) => (
            <div key={club._id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-lg group hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sede</span>
                  </div>
                  <h3 className="text-2xl font-bold truncate group-hover:text-primary transition-colors">{club.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{club.location || "Sin ubicación"}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(club)}
                    className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-colors"
                    title="Editar sede"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(club._id)}
                    className="p-2 bg-zinc-800/80 hover:bg-red-500/20 text-zinc-300 hover:text-red-400 rounded-lg transition-colors"
                    title="Eliminar sede"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {club.description && (
                <p className="text-sm text-zinc-300 mt-4 leading-relaxed line-clamp-2">
                  {club.description}
                </p>
              )}

              {/* Public Booking / Deposit summary */}
              <div className="mt-4 p-3 bg-zinc-950/40 border border-zinc-800/50 rounded-lg text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Reservas Públicas:</span>
                  <span className={club.bookingEnabled !== false ? "text-primary font-bold animate-pulse" : "text-red-400 font-bold"}>
                    {club.bookingEnabled !== false ? "Habilitado" : "Deshabilitado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Política de Seña:</span>
                  <span className="text-zinc-300 font-medium">
                    {club.depositType === "none" && "Sin seña"}
                    {club.depositType === "fixed" && `Monto Fijo ($${club.depositValue})`}
                    {(club.depositType === "percentage" || !club.depositType) && `Porcentaje (${club.depositValue ?? 30}%)`}
                  </span>
                </div>
                {(club.mpPublicKey || club.mpAccessToken) && (
                  <div className="flex justify-between border-t border-zinc-800/40 pt-2 text-[10px]">
                    <span className="text-zinc-500 font-medium">Mercado Pago:</span>
                    <span className="text-zinc-400 font-mono">
                      {club.mpPublicKey ? "Configurado ✓" : "Solo Access Token"}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-zinc-800/50">
                <div className="flex flex-wrap gap-2">
                  {club.sports?.length ? (
                    club.sports.map((sport) => (
                      <span
                        key={sport}
                        className="px-2.5 py-1 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-bold text-primary tracking-wide uppercase"
                      >
                        {sport}
                      </span>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-xs">Sin deportes</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
