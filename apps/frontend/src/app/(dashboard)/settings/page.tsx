"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, X, Copy, Check } from "lucide-react";
import { apiFetch, getClientUserRole } from "@/lib/api";
import type { Club } from "@/lib/types";

import { useClub } from "@/providers/ClubProvider";

type ClubFormData = {
  name: string;
  location: string;
  sports: string;
  description: string;
  bookingEnabled: boolean;
  depositType: "percentage" | "fixed" | "none";
  depositValue: number | "";
  mpAccessToken: string;
  mpPublicKey: string;
  subdomain: string;
  customDomain: string;
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
  subdomain: "",
  customDomain: "",
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
    subdomain: club.subdomain ?? "",
    customDomain: club.customDomain ?? "",
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
    depositValue: formData.depositValue === "" ? 0 : Number(formData.depositValue),
    mpAccessToken: formData.mpAccessToken.trim(),
    mpPublicKey: formData.mpPublicKey.trim(),
    subdomain: formData.subdomain.trim() || undefined,
    customDomain: formData.customDomain.trim() || undefined,
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
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Solicitud de nueva sede
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    name: "",
    location: "",
    sports: "padel",
    comments: "",
  });
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [requests, setRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await apiFetch("/audit-logs");
      if (response.ok) {
        const logs = await response.json();
        const creationRequests = logs.filter((log: any) => log.action === "request_club_creation");
        setRequests(creationRequests);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const userRole = getClientUserRole();
    setRole(userRole);
    setCheckingRole(false);
  }, []);

  const getClubBookingLink = (club: Club) => {
    if (!isMounted || typeof window === "undefined") return "";
    const identifier = club.subdomain || club._id;
    return `${window.location.origin}/reservar?clubId=${identifier}`;
  };

  const getClubDomainLink = (club: Club) => {
    if (!isMounted || typeof window === "undefined") return null;
    if (club.customDomain) {
      const domain = club.customDomain.startsWith("http")
        ? club.customDomain
        : `https://${club.customDomain}`;
      return `${domain}/reservar`;
    }
    if (club.subdomain) {
      const host = window.location.host;
      const protocol = window.location.protocol;
      const parts = host.split(".");
      let baseDomain = host;
      if (parts.length >= 4) {
        baseDomain = parts.slice(1).join(".");
      } else if (parts.length === 3 && parts[0] !== "reservate-frontend" && parts[0] !== "www") {
        baseDomain = parts.slice(1).join(".");
      }
      return `${protocol}//${club.subdomain}.${baseDomain}/reservar`;
    }
    return null;
  };

  const handleCopyLink = (clubId: string, text: string, isDomain: boolean = false) => {
    navigator.clipboard.writeText(text).then(() => {
      const key = `${clubId}-${isDomain ? "domain" : "direct"}`;
      setCopiedLink(key);
      setTimeout(() => setCopiedLink(null), 2000);
    });
  };

  useEffect(() => {
    if (role === "admin") {
      fetchRequests();
    }
  }, [role]);

  const resetRequestForm = () => {
    setRequestFormData({
      name: "",
      location: "",
      sports: "padel",
      comments: "",
    });
    setRequestSent(false);
    setRequestError(null);
  };

  const handleRequestSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setRequestLoading(true);
    setRequestError(null);
    try {
      const response = await apiFetch("/clubs/request-creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestFormData),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      setRequestSent(true);
    } catch (err) {
      console.error("Error submitting club creation request:", err);
      setRequestError("No se pudo enviar la solicitud. Por favor intenta más tarde o contacta al administrador del sistema.");
    } finally {
      setRequestLoading(false);
    }
  };

  const refreshClubs = async () => {
    await globalRefreshClubs();
  };

  const resetForm = () => {
    setEditingClubId(null);
    setFormData(initialFormData);
  };

  if (checkingRole) {
    return (
      <div className="flex-1 bg-white dark:bg-zinc-950 flex items-center justify-center p-8">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium">Verificando credenciales...</span>
      </div>
    );
  }

  if (role !== "admin" && role !== "club_owner") {
    return (
      <div className="flex-1 p-8 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          No tienes permisos para ver o modificar la configuración de sedes, cuentas bancarias o Mercado Pago.
        </p>
      </div>
    );
  }

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
      if (role === "admin") {
        fetchRequests();
      }
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
          <p className="text-zinc-500 dark:text-zinc-400">
            Administrá los datos de las distintas sedes de tu club.
          </p>
        </div>
        {!showForm && (
          role === "admin" ? (
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
          ) : (
            <button
              onClick={() => {
                resetRequestForm();
                setShowRequestModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-bold rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:-translate-y-0.5 transition-all w-fit shadow-sm"
            >
              <Plus className="w-5 h-5 text-zinc-500" />
              Solicitar nueva sede
            </button>
          )
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
            <button onClick={handleCancel} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Nombre de la sede
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData({ ...formData, name: event.target.value })
                  }
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Ubicación / Dirección
                </label>
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={(event) =>
                    setFormData({ ...formData, location: event.target.value })
                  }
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Deportes (separados por coma)
                </label>
                <input
                  required
                  type="text"
                  value={formData.sports}
                  onChange={(event) =>
                    setFormData({ ...formData, sports: event.target.value })
                  }
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData({ ...formData, description: event.target.value })
                  }
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>

              {/* Subdominio (Solo editable por Admin) */}
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  Subdominio {role !== "admin" && "🔒"}
                </label>
                <input
                  type="text"
                  disabled={role !== "admin"}
                  placeholder="ej. clubpadel"
                  value={formData.subdomain}
                  onChange={(event) =>
                    setFormData({ ...formData, subdomain: event.target.value })
                  }
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-zinc-800 disabled:opacity-70 disabled:bg-zinc-100/50 dark:disabled:bg-zinc-900/20 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block font-medium">
                  {role === "admin" 
                    ? "Permite acceso directo via [subdominio].reservate.com" 
                    : "Habilitado por el administrador general."}
                </span>
              </div>

              {/* Dominio Personalizado (Solo editable por Admin) */}
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1 flex items-center gap-1">
                  Dominio Personalizado {role !== "admin" && "🔒"}
                </label>
                <input
                  type="text"
                  disabled={role !== "admin"}
                  placeholder="ej. reservas.clubpadel.com"
                  value={formData.customDomain}
                  onChange={(event) =>
                    setFormData({ ...formData, customDomain: event.target.value })
                  }
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-zinc-800 disabled:opacity-70 disabled:bg-zinc-100/50 dark:disabled:bg-zinc-900/20 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                />
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block font-medium">
                  {role === "admin" 
                    ? "Dominio DNS propio apuntado mediante CNAME" 
                    : "Habilitado por el administrador general si posees dominio propio."}
                </span>
              </div>
            </div>

            {/* Configuración de Reservas Públicas y Pagos */}
            <div className="border-t border-zinc-300/80 dark:border-zinc-800/80 pt-5 mt-5">
              <h3 className="text-lg font-bold text-primary mb-4">Configuración de Reservas Públicas y Pagos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Reservas públicas habilitadas */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-900 dark:text-white">Habilitar Reservas Públicas</label>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Permitir a usuarios no registrados reservar online</span>
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
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Tipo de Seña
                  </label>
                  <select
                    value={formData.depositType}
                    onChange={(event) =>
                      setFormData({ ...formData, depositType: event.target.value as "percentage" | "fixed" | "none" })
                    }
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3.5 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                    <option value="none">Sin Seña</option>
                  </select>
                </div>

                {/* Valor de Seña */}
                {formData.depositType !== "none" && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      {formData.depositType === "percentage" ? "Porcentaje de Seña (%)" : "Monto Fijo de Seña ($)"}
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.depositValue}
                      onChange={(event) =>
                        setFormData({ ...formData, depositValue: event.target.value === "" ? "" : Number(event.target.value) })
                      }
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                )}

                {/* Separador para credenciales */}
                <div className="md:col-span-2 border-t border-dashed border-zinc-300/80 dark:border-zinc-800/80 pt-4 mt-2">
                  <h4 className="text-sm font-semibold text-zinc-600 dark:text-zinc-300 mb-2">Credenciales de Mercado Pago (Específico de la Sede)</h4>
                  <p className="text-xs text-zinc-500 mb-4">Ingresá tus credenciales de Mercado Pago para que las señas cobradas se depositen directamente en tu cuenta.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Mercado Pago Public Key
                  </label>
                  <input
                    type="text"
                    placeholder="APP_USR-..."
                    value={formData.mpPublicKey}
                    onChange={(event) =>
                      setFormData({ ...formData, mpPublicKey: event.target.value })
                    }
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Mercado Pago Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="TEST-... o APP_USR-..."
                    value={formData.mpAccessToken}
                    onChange={(event) =>
                      setFormData({ ...formData, mpAccessToken: event.target.value })
                    }
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg transition-colors"
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
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
          <p className="text-zinc-500">Aún no hay sedes configuradas en la base de datos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {clubs.map((club) => (
            <div key={club._id} className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-800 p-6 rounded-lg group hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-primary mb-3">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Sede</span>
                  </div>
                  <h3 className="text-2xl font-bold truncate group-hover:text-primary transition-colors">{club.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{club.location || "Sin ubicación"}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(club)}
                    className="p-2 bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors"
                    title="Editar sede"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {role === "admin" && (
                    <button
                      onClick={() => handleDelete(club._id)}
                      className="p-2 bg-zinc-200/80 dark:bg-zinc-800/80 hover:bg-red-500/20 text-zinc-600 dark:text-zinc-300 hover:text-red-400 rounded-lg transition-colors"
                      title="Eliminar sede"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {club.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-4 leading-relaxed line-clamp-2">
                  {club.description}
                </p>
              )}

              {/* Public Booking / Deposit summary */}
              <div className="mt-4 p-3 bg-zinc-50/40 dark:bg-zinc-950/40 border border-zinc-300/50 dark:border-zinc-800/50 rounded-lg text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Reservas Públicas:</span>
                  <span className={club.bookingEnabled !== false ? "text-primary font-bold animate-pulse" : "text-red-400 font-bold"}>
                    {club.bookingEnabled !== false ? "Habilitado" : "Deshabilitado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Política de Seña:</span>
                  <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                    {club.depositType === "none" && "Sin seña"}
                    {club.depositType === "fixed" && `Monto Fijo ($${club.depositValue})`}
                    {(club.depositType === "percentage" || !club.depositType) && `Porcentaje (${club.depositValue ?? 30}%)`}
                  </span>
                </div>
                {(club.mpPublicKey || club.mpAccessToken) && (
                  <div className="flex justify-between border-t border-zinc-300/40 dark:border-zinc-800/40 pt-2 text-[10px]">
                    <span className="text-zinc-500 font-medium">Mercado Pago:</span>
                    <span className="text-zinc-500 dark:text-zinc-400 font-mono">
                      {club.mpPublicKey ? "Configurado ✓" : "Solo Access Token"}
                    </span>
                  </div>
                )}
              </div>

              {/* Link de Reserva Público */}
              <div className="mt-4 p-3.5 bg-primary/5 dark:bg-primary/5 border border-primary/20 rounded-lg text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold tracking-wide uppercase text-[10px]">Link de Reserva Público</span>
                  {club.bookingEnabled === false && (
                    <span className="text-red-400 font-semibold text-[10px] uppercase">Público Deshabilitado</span>
                  )}
                </div>
                
                {/* Enlace Directo (clubId) */}
                <div className="space-y-1">
                  <span className="text-zinc-500 dark:text-zinc-400 font-medium block">Enlace directo de la sede:</span>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      type="text"
                      value={getClubBookingLink(club)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800/80 rounded px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] select-all focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyLink(club._id, getClubBookingLink(club))}
                      className="flex items-center gap-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded font-semibold text-[11px] transition-all whitespace-nowrap active:scale-95 border border-zinc-300/50 dark:border-zinc-800"
                      title="Copiar enlace directo"
                    >
                      {copiedLink === `${club._id}-direct` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span className="text-primary">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Enlace de Subdominio / Dominio Personalizado si está configurado */}
                {(club.subdomain || club.customDomain) && (
                  <div className="space-y-1 pt-2 border-t border-zinc-300/40 dark:border-zinc-800/40">
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium block">
                      {club.customDomain ? "Dominio personalizado:" : "Enlace con subdominio:"}
                    </span>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        type="text"
                        value={getClubDomainLink(club) || ""}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800/80 rounded px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 font-mono text-[11px] select-all focus:outline-none"
                      />
                      <button
                        onClick={() => handleCopyLink(club._id, getClubDomainLink(club) || "", true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded font-semibold text-[11px] transition-all whitespace-nowrap active:scale-95 border border-zinc-300/50 dark:border-zinc-800"
                        title="Copiar enlace con dominio"
                      >
                        {copiedLink === `${club._id}-domain` ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-primary" />
                            <span className="text-primary">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-5 border-t border-zinc-300/50 dark:border-zinc-800/50">
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

      {role === "admin" && requests.length > 0 && (
        <div className="mt-12 bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col gap-2 mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-5 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
              Solicitudes de Nuevas Sedes
            </h2>
            <p className="text-xs text-zinc-500">
              Pedidos de dueños de franquicia pendientes de activación.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider bg-zinc-50/50 dark:bg-zinc-950/20">
                  <th className="p-3">Sede Propuesta</th>
                  <th className="p-3">Deportes</th>
                  <th className="p-3 text-center">Notas</th>
                  <th className="p-3">Solicitante</th>
                  <th className="p-3">Fecha</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-xs">
                {requests.map((reqItem) => {
                  const details = reqItem.details || {};
                  return (
                    <tr key={reqItem._id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-zinc-900 dark:text-white">{details.name || "Sin Nombre"}</div>
                        <div className="text-[10px] text-zinc-500">{details.location}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {(details.sports || "")
                            .split(",")
                            .map((s: string) => s.trim())
                            .filter(Boolean)
                            .map((sport: string) => (
                              <span key={sport} className="px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-[9px] font-bold text-primary uppercase">
                                {sport}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="p-3 text-zinc-600 dark:text-zinc-350 max-w-[200px] truncate" title={details.comments}>
                        {details.comments || <span className="text-zinc-500 italic">Sin notas</span>}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-zinc-800 dark:text-zinc-200">{reqItem.userName}</div>
                        <div className="text-[10px] text-zinc-500">{reqItem.userEmail}</div>
                      </td>
                      <td className="p-3 text-zinc-500">
                        {new Date(reqItem.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            setFormData({
                              name: details.name || "",
                              location: details.location || "",
                              sports: details.sports || "padel",
                              description: details.comments ? `Solicitada por ${reqItem.userName}. ${details.comments}` : `Habilitada para ${reqItem.userName}`,
                              bookingEnabled: true,
                              depositType: "percentage",
                              depositValue: 30,
                              mpAccessToken: "",
                              mpPublicKey: "",
                              subdomain: (details.name || "").toLowerCase().replace(/[^a-z0-9]/g, ""),
                              customDomain: "",
                            });
                            setEditingClubId(null);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded hover:scale-105 transition-all text-[10px] shadow-[0_0_8px_rgba(57,255,20,0.15)] animate-pulse hover:animate-none"
                        >
                          Habilitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowRequestModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!requestSent ? (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div className="flex items-center gap-3 text-primary mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Solicitar Nueva Sede</h2>
                    <p className="text-xs text-zinc-500">Completá los datos para que el administrador la configure</p>
                  </div>
                </div>

                {requestError && (
                  <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
                    {requestError}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Nombre de la nueva sede</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Padel Club - Sede Norte"
                      value={requestFormData.name}
                      onChange={(e) => setRequestFormData({ ...requestFormData, name: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Ubicación / Dirección</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Av. Cabildo 1234, CABA"
                      value={requestFormData.location}
                      onChange={(e) => setRequestFormData({ ...requestFormData, location: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Deportes (separados por coma)</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. padel, futbol"
                      value={requestFormData.sports}
                      onChange={(e) => setRequestFormData({ ...requestFormData, sports: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Notas adicionales / Cantidad de Canchas</label>
                    <textarea
                      placeholder="Contanos más detalles sobre las canchas que vas a configurar en esta nueva sede..."
                      rows={3}
                      value={requestFormData.comments}
                      onChange={(e) => setRequestFormData({ ...requestFormData, comments: e.target.value })}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-2.5 px-3 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={requestLoading}
                    className="px-5 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all disabled:opacity-50"
                  >
                    {requestLoading ? "Enviando..." : "Enviar Solicitud"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(57,255,20,0.1)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">¡Solicitud Enviada!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Tu solicitud para la sede <strong className="text-zinc-900 dark:text-white">"{requestFormData.name}"</strong> ha sido enviada al administrador global. Te contactaremos pronto para realizar la habilitación y facturación.
                </p>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shadow-[0_0_10px_rgba(57,255,20,0.2)] transition-all mt-4"
                >
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
