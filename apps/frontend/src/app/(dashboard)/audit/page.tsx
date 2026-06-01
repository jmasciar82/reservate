"use client";

import { useEffect, useState, useMemo } from "react";
import { History, Search, ArrowRight, Shield, Calendar, Mail, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { apiFetch, getClientUserRole } from "@/lib/api";

interface AuditLog {
  _id: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  action: string;
  targetType: string;
  targetId: string;
  clubId?: string;
  tenantId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export default function AuditPage() {
  const [role, setRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const userRole = getClientUserRole();
    setRole(userRole);
    setCheckingRole(false);

    if (userRole === "admin" || userRole === "club_owner") {
      fetchLogs();
    }
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/audit-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        console.error("Error fetching audit logs:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const actionMap: Record<string, { label: string; color: string }> = {
    create_reservation: {
      label: "Creación",
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 shadow-[0_0_8px_rgba(34,197,94,0.05)]",
    },
    reschedule_reservation: {
      label: "Reprogramación",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.05)]",
    },
    cancel_reservation: {
      label: "Cancelación",
      color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.05)]",
    },
    payment_reservation: {
      label: "Actualización de Pago",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.05)]",
    },
    renew_reservation: {
      label: "Renovación",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.05)]",
    },
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch =
        log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.targetId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAction = filterAction === "" || log.action === filterAction;

      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, filterAction]);

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " hs";
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
          No tienes permisos para ver esta sección. Solo los administradores pueden consultar el registro de auditoría.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 z-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 pb-4 border-b border-zinc-200/80 dark:border-white/5">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3 text-zinc-900 dark:text-white tracking-wide">
            <span className="w-2.5 h-7 bg-primary rounded-full shadow-[0_0_10px_rgba(57,255,20,0.6)]" />
            Auditoría de Cambios
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Historial inmutable de modificaciones financieras y operativas de las reservas del sistema.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/80 dark:bg-white/[0.02] border border-zinc-200/80 dark:border-white/5 p-4 rounded-2xl mb-8 shadow-sm">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por usuario, email o ID de reserva..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
          />
        </div>

        {/* Action filter */}
        <div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-300 dark:border-white/10 rounded-xl py-3.5 px-4 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
          >
            <option value="" className="bg-zinc-950 text-white">Todos los tipos de acción</option>
            <option value="create_reservation" className="bg-zinc-950 text-white">Creación de Turno</option>
            <option value="reschedule_reservation" className="bg-zinc-950 text-white">Reprogramación (Drag & Drop)</option>
            <option value="cancel_reservation" className="bg-zinc-950 text-white">Cancelación de Turno</option>
            <option value="payment_reservation" className="bg-zinc-950 text-white">Actualización de Pago</option>
            <option value="renew_reservation" className="bg-zinc-950 text-white">Renovación Turno Fijo</option>
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-white/80 dark:bg-white/[0.015] border border-zinc-200/80 dark:border-white/5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.04)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold animate-pulse">Cargando historial de auditoría...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 italic">
            No se encontraron registros de auditoría que coincidan con la búsqueda.
          </div>
        ) : (
          <div className="divide-y divide-zinc-200/80 dark:divide-white/5">
            {filteredLogs.map((log) => {
              const actionMeta = actionMap[log.action] ?? { label: log.action, color: "bg-zinc-800 text-zinc-400 border-zinc-700" };
              const isExpanded = expandedLogId === log._id;

              return (
                <div key={log._id} className="p-5 hover:bg-zinc-50/50 dark:hover:bg-white/[0.005] transition-all duration-300">
                  {/* Summary row */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-black text-xs text-primary uppercase shrink-0 mt-0.5 select-none">
                        {log.userName.substring(0, 2)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-white">{log.userName}</span>
                          {log.userEmail && (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {log.userEmail}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-zinc-500">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {formatDate(log.createdAt)}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            Reserva: <strong className="text-zinc-700 dark:text-zinc-300 font-mono text-[11px] bg-zinc-100 dark:bg-white/5 px-1.5 py-0.5 rounded border border-zinc-200/80 dark:border-white/5">#{log.targetId.substring(0, 8)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                      {/* Action Badge */}
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide border shadow-sm ${actionMeta.color}`}>
                        {actionMeta.label}
                      </span>

                      {/* Expand Button */}
                      <button
                        onClick={() => toggleExpand(log._id)}
                        className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 border border-zinc-200 dark:border-white/5 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded details block */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-zinc-200/80 dark:border-white/5 animate-in fade-in duration-200">
                      <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-xl p-4 border border-zinc-200/60 dark:border-white/5 font-mono text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Basic Log Info */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-widest border-b border-zinc-200 dark:border-white/5 pb-1">Metadatos de la Acción</h4>
                            <p className="text-zinc-600 dark:text-zinc-400">ID del Log: <span className="text-zinc-900 dark:text-white font-bold">{log._id}</span></p>
                            <p className="text-zinc-600 dark:text-zinc-400">ID del Actor: <span className="text-zinc-900 dark:text-white font-bold">{log.userId || "Sistema (Mercado Pago)"}</span></p>
                            <p className="text-zinc-600 dark:text-zinc-400">Tipo de Recurso: <span className="text-zinc-900 dark:text-white font-bold capitalize">{log.targetType}</span></p>
                            <p className="text-zinc-600 dark:text-zinc-400">ID del Recurso: <span className="text-zinc-900 dark:text-white font-bold">{log.targetId}</span></p>
                          </div>

                          {/* Specific JSON Changes details */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-extrabold text-primary uppercase tracking-widest border-b border-zinc-200 dark:border-white/5 pb-1">Valores y Parámetros</h4>
                            {log.details ? (
                              <div className="space-y-1 text-zinc-600 dark:text-zinc-400">
                                {log.action === "create_reservation" && (
                                  <>
                                    <p>Horario: <strong className="text-zinc-900 dark:text-white">{new Date(log.details.startTime).toLocaleString("es-AR")}</strong></p>
                                    <p>Precio: <strong className="text-zinc-900 dark:text-white">${log.details.totalPrice}</strong></p>
                                    <p>Pago: <strong className="text-zinc-900 dark:text-white font-bold uppercase">{log.details.paymentStatus}</strong></p>
                                    <p>Cliente: <strong className="text-zinc-900 dark:text-white">{log.details.firstName} {log.details.lastName}</strong></p>
                                    <p>Fijo Recurrente: <strong className="text-zinc-900 dark:text-white">{log.details.isRecurring ? "Sí" : "No"}</strong></p>
                                  </>
                                )}
                                {log.action === "reschedule_reservation" && log.details.changes && (
                                  <>
                                    <p className="font-bold text-amber-500">Reprogramación de Turno:</p>
                                    {log.details.changes.startTime && (
                                      <p className="flex items-center gap-1.5">
                                        Nuevo Inicio: <strong className="text-zinc-900 dark:text-white">{new Date(log.details.changes.startTime).toLocaleString("es-AR")}</strong>
                                      </p>
                                    )}
                                    {log.details.changes.courtId && (
                                      <p>Nueva Cancha: <span className="text-zinc-900 dark:text-white font-bold">{log.details.changes.courtId}</span></p>
                                    )}
                                    {log.details.changes.totalPrice && (
                                      <p>Nuevo Precio: <strong className="text-zinc-900 dark:text-white">${log.details.changes.totalPrice}</strong></p>
                                    )}
                                  </>
                                )}
                                {log.action === "cancel_reservation" && (
                                  <>
                                    <p className="text-red-500 font-bold">Turno Cancelado</p>
                                    {log.details.changes?.cancelSeries && (
                                      <p className="text-red-400 font-semibold animate-pulse">⚠️ ¡Se cancelaron todas las reservas futuras de la serie!</p>
                                    )}
                                    <p>Estado Final: <span className="text-zinc-900 dark:text-white font-bold uppercase">{log.details.newValues?.status}</span></p>
                                  </>
                                )}
                                {log.action === "payment_reservation" && (
                                  <>
                                    <p className="text-green-500 font-bold">Pago Registrado</p>
                                    <p>Pago: <span className="text-zinc-900 dark:text-white font-bold uppercase">{log.details.newValues?.paymentStatus}</span></p>
                                    {log.details.changes?.depositAmount !== undefined && (
                                      <p>Monto de Seña: <strong className="text-zinc-900 dark:text-white">${log.details.changes.depositAmount}</strong></p>
                                    )}
                                  </>
                                )}
                                {log.action === "renew_reservation" && (
                                  <p className="text-purple-500 font-bold">{log.details.description || "Renovación Turno Fijo"}</p>
                                )}
                                {!["create_reservation", "reschedule_reservation", "cancel_reservation", "payment_reservation", "renew_reservation"].includes(log.action) && (
                                  <pre className="text-[10px] text-zinc-500 max-h-40 overflow-y-auto w-full whitespace-pre-wrap">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-500 italic">Sin detalles extra</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
