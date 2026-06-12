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
import { apiFetch } from "@/lib/api";
import type { Club, Court } from "@/lib/types";
import CourtCard from "@/components/CourtCard";
import { useClub } from "@/providers/ClubProvider";

type CourtFormData = {
  name: string;
  sport: string;
  isCovered: boolean;
  isActive: boolean;
  clubId: string;
  pricePerHour: number;
  capacity?: number;
};

const initialFormData: CourtFormData = {
  name: "",
  sport: "padel",
  isCovered: false,
  isActive: true,
  clubId: "",
  pricePerHour: 10000,
  capacity: undefined,
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await apiFetch(url, { cache: "no-store" });

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
    parrilla: "Parrilla",
    quincho: "Quincho",
  };

  return labels[sport] ?? sport;
}

const isAmenity = (sport: string) => sport === "parrilla" || sport === "quincho";

export default function CourtsPage() {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { activeClubId, clubs } = useClub();
  const [showForm, setShowForm] = useState(false);
  const [editingCourtId, setEditingCourtId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CourtFormData>(initialFormData);

  const filteredCourts = useMemo(
    () => courts.filter((c) => c.clubId === activeClubId),
    [courts, activeClubId]
  );

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
        const [courtsData] = await Promise.all([
          fetchJson<Court[]>("/courts"),
        ]);

        if (cancelled) return;

        setCourts(courtsData);
        setFormData((prev) => ({
          ...prev,
          clubId: activeClubId || "",
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
    try {
      const data = await fetchJson<Court[]>("/courts");
      setCourts(data);
    } catch (err) {
      console.error("Error refreshing courts:", err);
      setError("No se pudieron actualizar las canchas.");
    }
  };

  const resetForm = () => {
    setEditingCourtId(null);
    setFormData({
      ...initialFormData,
      clubId: activeClubId || "",
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const url = editingCourtId
        ? `/courts/${editingCourtId}`
        : "/courts";
      const method = editingCourtId ? "PUT" : "POST";
      const response = await apiFetch(url, {
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
      capacity: court.capacity || undefined,
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
      const response = await apiFetch(`/courts/${courtId}`, {
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
          <h1 className="text-3xl font-bold mb-2">Gestión de canchas y espacios</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Administrá canchas, parrillas, quinchos y otros espacios reservables.
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
          {showForm ? "Cancelar" : "Añadir espacio"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border p-5 rounded-lg mb-8 shadow-lg max-w-5xl animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="text-xl font-bold mb-4">
            {editingCourtId ? "Editar espacio" : "Nuevo espacio"}
          </h2>
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Nombre / número
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cancha 1, Parrilla Norte"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>



              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Tipo de espacio
                </label>
                <select
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  value={formData.sport}
                  onChange={(e) =>
                    setFormData({ ...formData, sport: e.target.value, capacity: isAmenity(e.target.value) ? (formData.capacity || 10) : undefined })
                  }
                >
                  <optgroup label="Deportes">
                    <option value="padel">Pádel</option>
                    <option value="tennis">Tenis</option>
                    <option value="football">Fútbol</option>
                    <option value="basketball">Básquet</option>
                  </optgroup>
                  <optgroup label="Espacios">
                    <option value="parrilla">Parrilla</option>
                    <option value="quincho">Quincho</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  Tipo de cancha
                </label>
                <select
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
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
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 pl-8 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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

              {isAmenity(formData.sport) && (
                <div>
                  <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    Capacidad (personas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 20"
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    value={formData.capacity || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-600 dark:text-zinc-300 md:self-end md:pb-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-primary focus:ring-0 focus:ring-offset-0 w-4 h-4"
                />
                Espacio activo
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white font-semibold rounded-lg transition-colors"
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
        <div className="text-center py-16 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
          <p className="text-zinc-500">Aún no hay canchas cargadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {courts.filter(c => c.clubId === activeClubId).map((court) => (
            <CourtCard
              key={court._id}
              court={court}
              clubName={clubMap[court.clubId] ?? "Club deportivo"}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
