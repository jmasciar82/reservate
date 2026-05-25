"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  DollarSign,
  Home,
  Pencil,
  Plus,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { apiUrl } from "@/lib/api";
import type { Club, Court } from "@/lib/types";

type CourtFormData = {
  name: string;
  sport: string;
  isCovered: boolean;
  isActive: boolean;
  clubId: string;
  pricePerHour: number;
};

const initialFormData: CourtFormData = {
  name: "",
  sport: "padel",
  isCovered: false,
  isActive: true,
  clubId: "",
  pricePerHour: 10000,
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

function sportLabel(sport: string) {
  const labels: Record<string, string> = {
    basketball: "Básquet",
    football: "Fútbol",
    padel: "Pádel",
    tennis: "Tenis",
  };

  return labels[sport] ?? sport;
}

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourtFormData>(initialFormData);

  const clubMap = useMemo(
    () =>
      clubs.reduce<Record<string, string>>((acc, club) => {
        acc[club._id] = club.name;
        return acc;
      }, {}),
    [clubs],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [courtsData, clubsData] = await Promise.all([
          fetchJson<Court[]>(apiUrl("/courts")),
          fetchJson<Club[]>(apiUrl("/clubs")),
        ]);

        if (cancelled) return;

        setCourts(courtsData);
        setClubs(clubsData);
        setFormData((prev) => ({
          ...prev,
          clubId: prev.clubId || clubsData[0]?._id || "",
        }));
      } catch (loadError) {
        if (!cancelled) {
          console.error("Error loading courts:", loadError);
          setError("No se pudieron cargar las canchas.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshCourts = async () => {
    const data = await fetchJson<Court[]>(apiUrl("/courts"));
    setCourts(data);
  };

  const resetForm = () => {
    setEditingCourtId(null);
    setFormData({
      ...initialFormData,
      clubId: clubs[0]?._id || "",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingCourtId
        ? apiUrl(`/courts/${editingCourtId}`)
        : apiUrl("/courts");
      const method = editingCourtId ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Save failed with status ${response.status}`);
      }

      setShowForm(false);
      resetForm();
      await refreshCourts();
    } catch (saveError) {
      console.error("Error saving court:", saveError);
      setError("No se pudo guardar la cancha.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (court: Court) => {
    setEditingCourtId(court._id);
    setFormData({
      name: court.name,
      sport: court.sport,
      isCovered: court.isCovered,
      isActive: court.isActive,
      clubId: court.clubId,
      pricePerHour: court.pricePerHour || 0,
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (courtId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que querés eliminar esta cancha? Esta acción no se puede deshacer.",
      )
    ) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(apiUrl(`/courts/${courtId}`), {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Delete failed with status ${response.status}`);
      }

      await refreshCourts();
    } catch (deleteError) {
      console.error("Error deleting court:", deleteError);
      setError("No se pudo eliminar la cancha.");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    resetForm();
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de canchas</h1>
          <p className="text-zinc-400">
            Administrá disponibilidad, deporte, club y precio por hora.
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              handleCancel();
            } else {
              setShowForm(true);
            }
          }}
          disabled={clubs.length === 0}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
        >
          {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showForm ? "Cancelar" : "Añadir cancha"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border p-5 rounded-lg mb-8 shadow-lg max-w-5xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="text-xl font-bold mb-4">
            {editingCourtId ? "Editar cancha" : "Nueva cancha"}
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nombre / número
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cancha 1"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Club asociado
                </label>
                <select
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.clubId}
                  onChange={(e) =>
                    setFormData({ ...formData, clubId: e.target.value })
                  }
                >
                  {clubs.map((club) => (
                    <option key={club._id} value={club._id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Deporte
                </label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value })
                  }
                >
                  <option value="padel">Pádel</option>
                  <option value="tennis">Tenis</option>
                  <option value="football">Fútbol</option>
                  <option value="basketball">Básquet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Tipo de cancha
                </label>
                <select
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.isCovered ? "true" : "false"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isCovered: e.target.value === "true",
                    })
                  }
                >
                  <option value="false">Descubierta</option>
                  <option value="true">Techada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Precio por hora
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    placeholder="Ej. 12000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-8 pr-4 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={formData.pricePerHour}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerHour: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300 md:self-end md:pb-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                Cancha activa
              </label>
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
                disabled={saving || !formData.clubId}
                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:shadow-[0_0_20px_rgba(57,255,20,0.4)] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving
                  ? "Guardando..."
                  : editingCourtId
                    ? "Guardar cambios"
                    : "Crear cancha"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Cargando canchas...</p>
      ) : courts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500">Aún no hay canchas cargadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {courts.map((court) => (
            <div
              key={court._id}
              className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-lg hover:border-zinc-700 transition-all group relative overflow-hidden flex flex-col justify-between min-h-56"
            >
              <div>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <h3 className="text-xl font-bold group-hover:text-primary transition-colors truncate">
                      {court.name}
                    </h3>
                    <span className="text-xs text-zinc-400">
                      {sportLabel(court.sport)}
                    </span>
                    <span className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {clubMap[court.clubId] ?? "Club deportivo"}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {court.isActive ? (
                      <span className="flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                        <Check className="w-2.5 h-2.5 mr-1" /> Activa
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] font-semibold text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700">
                        Inactiva
                      </span>
                    )}

                    {court.isCovered ? (
                      <span className="flex items-center text-[10px] font-semibold text-sky-400 bg-sky-400/10 px-2 py-0.5 rounded-full border border-sky-400/20">
                        <Home className="w-2.5 h-2.5 mr-1" /> Techada
                      </span>
                    ) : (
                      <span className="flex items-center text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        <Sun className="w-2.5 h-2.5 mr-1" /> Descubierta
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-zinc-300 bg-zinc-950/40 py-1.5 px-3 rounded-lg border border-zinc-800/40 w-fit">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span className="text-sm">
                    <strong className="text-white font-bold">
                      ${court.pricePerHour?.toLocaleString("es-AR")}
                    </strong>{" "}
                    / hora
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800/50 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEditClick(court)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  title="Editar cancha"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(court._id)}
                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  title="Eliminar cancha"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
