"use client";

import { useEffect, useMemo, useState } from "react";
import { UserPlus, Shield, User, Mail, Trash2, Key, X, Building2 } from "lucide-react";
import { apiFetch, getClientUserRole } from "@/lib/api";
import { useClub } from "@/providers/ClubProvider";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "player" | "club_owner";
  clubId?: string;
}

export default function UsersPage() {
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { clubs } = useClub();

  const clubMap = useMemo(
    () =>
      clubs.reduce<Record<string, string>>((acc, club) => {
        acc[club._id] = club.name;
        return acc;
      }, {}),
    [clubs],
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    clubId: "",
  });

  useEffect(() => {
    const userRole = getClientUserRole();
    setRole(userRole);
    setCheckingRole(false);
    
    if (userRole === "admin" || userRole === "club_owner") {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error("Error fetching users:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiFetch("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        setFormData({ name: "", email: "", password: "", role: "staff", clubId: "" });
        fetchUsers();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "Error al crear el usuario.");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error al conectar con el servidor.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${name}"?`)) {
      return;
    }
    
    try {
      const response = await apiFetch(`/users/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchUsers();
      } else {
        alert("No se pudo eliminar el usuario.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  if (checkingRole) {
    return (
      <div className="flex-1 bg-white dark:bg-zinc-950 flex items-center justify-center p-8">
        <span className="text-zinc-500 dark:text-zinc-400 font-medium animate-pulse">Verificando credenciales...</span>
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
          No tienes permisos para ver esta sección. Solo los administradores pueden gestionar usuarios del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-zinc-200/80 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-zinc-900 dark:text-white tracking-wide">
            <span className="w-2.5 h-7 bg-primary rounded-full shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
            Control de Usuarios
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gestiona los miembros del equipo que tienen acceso al sistema de reservas.
          </p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-extrabold rounded-xl shadow-[0_4px_15px_rgba(57,255,20,0.3)] hover:scale-[1.02] transition-transform active:scale-[0.99] text-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Crear Usuario
        </button>
      </div>

      <div className="bg-white/80 dark:bg-white/[0.015] border border-zinc-200/80 dark:border-white/5 rounded-2xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold">Cargando usuarios...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 italic">
              No hay usuarios del equipo creados todavía.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 dark:border-white/5 text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider bg-zinc-50/30 dark:bg-white/[0.01]">
                  <th className="p-4">Nombre</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Rol / Permisos</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-white/5 text-sm">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-bold text-zinc-900 dark:text-white capitalize flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center font-black text-xs text-primary uppercase">
                        {userItem.name.substring(0, 2)}
                      </div>
                      {userItem.name}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300 font-medium">{userItem.email}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide border shadow-sm ${
                        userItem.role === "admin"
                          ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                          : userItem.role === "club_owner"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                            : userItem.role === "staff"
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.1)]"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        <Shield className="w-3.5 h-3.5" />
                        {userItem.role === "admin"
                          ? "Administrador Global"
                          : userItem.role === "club_owner"
                            ? "Usuario"
                            : userItem.role === "staff"
                              ? userItem.clubId && clubMap[userItem.clubId]
                                ? `Personal (${clubMap[userItem.clubId]})`
                                : "Personal / Recepción (Sin Config.)"
                              : userItem.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteUser(userItem._id, userItem.name)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal para Crear Usuario */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => !submitting && setShowModal(false)}
          />
          <div className="relative w-full max-w-md bg-white/95 dark:bg-zinc-950/85 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200/80 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(57,255,20,0.5)]" />
                Crear Nuevo Usuario
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 p-1.5 bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg border border-zinc-200 dark:border-white/5"
                title="Cerrar"
                disabled={submitting}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Martín Gómez"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ej. martin@club.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Rol y Permisos
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, clubId: e.target.value !== "staff" ? "" : formData.clubId })}
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                >
                  <option value="staff" className="bg-zinc-950 text-white">
                    Personal / Recepción (Acceso a reservas de su sede)
                  </option>
                  {role === "admin" && (
                    <option value="admin" className="bg-zinc-950 text-white">
                      Administrador (Acceso total, sedes y cuentas)
                    </option>
                  )}
                </select>
              </div>

              {formData.role === "staff" && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Sede Asignada
                  </label>
                  <select
                    required
                    value={formData.clubId}
                    onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-all duration-300 font-semibold"
                  >
                    <option value="" className="bg-zinc-950 text-zinc-500">
                      Seleccionar una sede...
                    </option>
                    {clubs.map((club) => (
                      <option key={club._id} value={club._id} className="bg-zinc-950 text-white">
                        {club.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-primary text-primary-foreground font-black rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_25px_rgba(57,255,20,0.45)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:pointer-events-none text-base transition-all duration-300"
              >
                {submitting ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
