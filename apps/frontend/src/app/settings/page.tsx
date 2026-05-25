"use client";

import { useEffect, useState } from "react";
import { Building2, Pencil, Plus, X } from "lucide-react";
import { apiUrl } from "@/lib/api";
import type { Club } from "@/lib/types";

type ClubFormData = {
  name: string;
  location: string;
  sports: string;
  description: string;
};

const initialFormData: ClubFormData = {
  name: "",
  location: "",
  sports: "padel",
  description: "",
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

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
  };
}

export default function SettingsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ClubFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchJson<Club[]>(apiUrl("/clubs"));
        if (!cancelled) {
          setClubs(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error("Error loading clubs:", loadError);
          setError("No se pudieron cargar los clubes.");
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

  const refreshClubs = async () => {
    const data = await fetchJson<Club[]>(apiUrl("/clubs"));
    setClubs(data);
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
      const url = editingClubId ? apiUrl(`/clubs/${editingClubId}`) : apiUrl("/clubs");
      const method = editingClubId ? "PUT" : "POST";
      const response = await fetch(url, {
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

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-zinc-400">
            Datos base de los clubes que usan el panel de reservas.
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
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center"
        >
          {showForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showForm ? "Cancelar" : "Añadir club"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-border p-5 rounded-lg mb-8 shadow-lg max-w-4xl">
          <h2 className="text-xl font-bold mb-4">
            {editingClubId ? "Editar club" : "Nuevo club"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">
                  Nombre
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
                  Ubicación
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
                  Deportes
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
                    : "Crear club"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-zinc-500">Cargando clubes...</p>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-500">Aún no hay clubes cargados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {clubs.map((club) => (
            <div
              key={club._id}
              className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-lg hover:border-zinc-700 transition-all"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-primary mb-2">
                    <Building2 className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase">
                      Club
                    </span>
                  </div>
                  <h3 className="text-xl font-bold truncate">{club.name}</h3>
                  <p className="text-sm text-zinc-400 mt-1">{club.location}</p>
                </div>
                <button
                  onClick={() => handleEdit(club)}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                  title="Editar club"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {club.description && (
                <p className="text-sm text-zinc-300 mt-4">{club.description}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                {club.sports?.map((sport) => (
                  <span
                    key={sport}
                    className="px-2.5 py-0.5 rounded-full border border-zinc-700 bg-zinc-950/60 text-xs text-zinc-300"
                  >
                    {sport}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
