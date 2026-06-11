"use client";

import React, { useState } from "react";
import { X, DollarSign, Trophy, Calendar, User, CalendarDays, CheckCircle2, Ticket } from "lucide-react";

export interface ReservationIncomeDetail {
  id: string;
  courtName: string;
  playerName: string;
  timeRange: string;
  amount: number;
  type: "paid" | "deposit";
}

export interface TournamentIncomeDetail {
  tournamentName: string;
  teamName: string;
  amount: number;
}

interface RevenueStatsProps {
  reservationsCount: number;
  occupiedCourtsText: string;
  occupancyPercent: string;
  reservationIncomes: ReservationIncomeDetail[];
  tournamentIncomes: TournamentIncomeDetail[];
  dateFormatted: string;
}

export default function RevenueStats({
  reservationsCount,
  occupiedCourtsText,
  occupancyPercent,
  reservationIncomes,
  tournamentIncomes,
  dateFormatted,
}: RevenueStatsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalReservationRevenue = reservationIncomes.reduce((sum, item) => sum + item.amount, 0);
  const totalTournamentRevenue = tournamentIncomes.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = totalReservationRevenue + totalTournamentRevenue;

  const revenueStat = `$${totalRevenue.toLocaleString("es-AR")}`;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Reservas",
            value: reservationsCount.toString(),
            trend: "Fecha elegida",
            color: "text-primary",
            onClick: undefined,
            cursor: "cursor-default",
          },
          {
            label: "Canchas ocupadas",
            value: occupiedCourtsText,
            trend: occupancyPercent,
            color: "text-zinc-900 dark:text-white",
            onClick: undefined,
            cursor: "cursor-default",
          },
          {
            label: "Ingresos cobrados",
            value: revenueStat,
            trend: "Ver detalle 👁️",
            color: "text-zinc-800 dark:text-zinc-100 group-hover:text-primary",
            onClick: () => setIsOpen(true),
            cursor: "cursor-pointer",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            onClick={stat.onClick}
            className={`relative group overflow-hidden bg-white/80 dark:bg-white/[0.02] backdrop-blur-md border border-zinc-200/80 dark:border-white/5 hover:border-primary/30 p-5 rounded-2xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(57,255,20,0.05)] hover:scale-[1.02] ${stat.cursor}`}
          >
            {/* Ambient hover glow inside the card */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative z-10">
              <p className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                {stat.label}
              </p>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className={`text-3xl font-black tracking-tight ${stat.color} drop-shadow transition-colors duration-200`}>
                  {stat.value}
                </h3>
                <span className="text-[10px] text-primary font-extrabold uppercase bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shadow-[0_0_8px_rgba(57,255,20,0.1)]">
                  {stat.trend}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DETALLE INGRESOS MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                  💵 Detalle de Ingresos Cobrados
                </h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">
                  Fecha: {dateFormatted}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-650 dark:hover:text-white p-1.5 bg-zinc-205/50 dark:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-2xl">
                <div className="text-center">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Canchas (Reservas)
                  </span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    ${totalReservationRevenue.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="text-center border-x border-zinc-200 dark:border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Inscrip. Torneos
                  </span>
                  <span className="text-sm font-extrabold text-zinc-900 dark:text-white">
                    ${totalTournamentRevenue.toLocaleString("es-AR")}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                    Total Neto
                  </span>
                  <span className="text-sm font-black text-primary drop-shadow-[0_0_8px_rgba(57,255,20,0.2)]">
                    ${totalRevenue.toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Reservations list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Reservas de Canchas ({reservationIncomes.length})
                </h4>
                
                {reservationIncomes.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl border border-dashed border-zinc-200 dark:border-white/5">
                    No se registraron cobros de reservas para este día.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {reservationIncomes.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-xl text-xs hover:border-zinc-300 dark:hover:border-white/10 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-zinc-900 dark:text-white">
                              {item.courtName}
                            </span>
                            <span className="text-[10px] font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 px-1.5 py-0.5 rounded">
                              🕒 {item.timeRange}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <User className="w-3 h-3" />
                            <span>{item.playerName}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-zinc-900 dark:text-white">
                            ${item.amount.toLocaleString("es-AR")}
                          </div>
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            item.type === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {item.type === "paid" ? "Total Pago" : "Seña / Depósito"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tournaments list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider border-b border-zinc-200 dark:border-white/5 pb-2">
                  <Trophy className="w-4 h-4 text-primary" />
                  Inscripciones a Torneos ({tournamentIncomes.length})
                </h4>

                {tournamentIncomes.length === 0 ? (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center py-4 bg-zinc-50/50 dark:bg-zinc-900/10 rounded-xl border border-dashed border-zinc-200 dark:border-white/5">
                    No se registraron cobros de torneos para este día.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {tournamentIncomes.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-xl text-xs hover:border-zinc-300 dark:hover:border-white/10 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-zinc-900 dark:text-white">
                              🏆 {item.tournamentName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <User className="w-3 h-3" />
                            <span>Pareja/Jugador: <b className="text-zinc-700 dark:text-zinc-300">{item.teamName}</b></span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-zinc-900 dark:text-white">
                            ${item.amount.toLocaleString("es-AR")}
                          </div>
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Inscripción Paga
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 flex justify-between items-center">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                Reservate Cashbox Flow
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-primary text-[#09090b] font-black rounded-xl text-xs shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
