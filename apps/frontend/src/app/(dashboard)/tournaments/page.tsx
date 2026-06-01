"use client";

import { useEffect, useState } from "react";
import { useClub } from "@/providers/ClubProvider";
import { apiFetch } from "@/lib/api";
import {
  Trophy,
  Calendar,
  Users,
  DollarSign,
  Plus,
  X,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Medal,
  Award,
  Phone,
  Flame,
} from "lucide-react";

type Player = {
  name: string;
  phone: string;
  email?: string;
};

type Team = {
  _id: string;
  name: string;
  player1: Player;
  player2: Player;
  registeredAt: string;
};

type Match = {
  matchId: string;
  teamA: Team | null;
  teamB: Team | null;
  scoreA: number | null;
  scoreB: number | null;
  winnerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 'A' | 'B' | null;
};

type Tournament = {
  _id: string;
  name: string;
  sport: string;
  category: string;
  startDate: string;
  endDate: string;
  registrationFee: number;
  maxTeams: number;
  status: 'draft' | 'registration' | 'active' | 'completed';
  teams: Team[];
  bracket: Match[];
};

export default function TournamentsPage() {
  const { activeClubId, clubs } = useClub();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'bracket' | 'teams'>('bracket');

  // Modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRegisterTeamModal, setShowRegisterTeamModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Formulario nuevo torneo
  const [newTournament, setNewTournament] = useState({
    name: "",
    sport: "padel",
    category: "",
    startDate: "",
    endDate: "",
    registrationFee: 0,
    maxTeams: 8,
  });

  // Formulario inscribir equipo
  const [newTeam, setNewTeam] = useState({
    name: "",
    player1: { name: "", phone: "", email: "" },
    player2: { name: "", phone: "", email: "" },
  });

  // Formulario puntajes partido
  const [matchScore, setMatchScore] = useState({
    scoreA: 0,
    scoreB: 0,
  });

  const activeClub = clubs.find((c) => c._id === activeClubId);

  const fetchTournaments = async () => {
    if (!activeClubId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/tournaments?clubId=${activeClubId}`);
      if (!response.ok) {
        throw new Error("Error al obtener los torneos.");
      }
      const data = await response.json();
      setTournaments(data);

      // Si hay un torneo seleccionado, recargar sus datos para actualizar el bracket en pantalla
      if (selectedTournament) {
        const updatedSelected = data.find((t: Tournament) => t._id === selectedTournament._id);
        if (updatedSelected) {
          setSelectedTournament(updatedSelected);
        }
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los torneos de la sede.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTournaments();
  }, [activeClubId]);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch("/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newTournament,
          clubId: activeClubId,
        }),
      });
      if (!response.ok) throw new Error("Error al crear el torneo.");
      
      setShowCreateModal(false);
      setNewTournament({
        name: "",
        sport: "padel",
        category: "",
        startDate: "",
        endDate: "",
        registrationFee: 0,
        maxTeams: 8,
      });
      await fetchTournaments();
    } catch (err) {
      alert("Error al guardar el torneo");
    }
  };

  const handleRegisterTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    try {
      const response = await apiFetch(`/tournaments/${selectedTournament._id}/register-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeam),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al inscribir a la pareja.");
      }

      setShowRegisterTeamModal(false);
      setNewTeam({
        name: "",
        player1: { name: "", phone: "", email: "" },
        player2: { name: "", phone: "", email: "" },
      });
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al inscribir equipo.");
    }
  };

  const handleUpdateMatchScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !selectedMatch) return;
    try {
      const response = await apiFetch(`/tournaments/${selectedTournament._id}/update-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedMatch.matchId,
          scoreA: Number(matchScore.scoreA),
          scoreB: Number(matchScore.scoreB),
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar marcador.");
      }

      setSelectedMatch(null);
      setMatchScore({ scoreA: 0, scoreB: 0 });
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al guardar marcador.");
    }
  };

  if (!activeClubId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-zinc-500">
        Por favor, seleccioná una sede activa para administrar sus torneos.
      </div>
    );
  }

  // Helper para renderizar los badges de estado
  const renderStatusBadge = (status: Tournament['status']) => {
    const config = {
      draft: { text: "Borrador", style: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
      registration: { text: "Inscripciones Abiertas", style: "bg-primary/10 text-primary border-primary/20 shadow-[0_0_10px_rgba(57,255,20,0.1)] animate-pulse" },
      active: { text: "En Juego ⚡", style: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      completed: { text: "Finalizado 🏆", style: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    };

    const current = config[status] || config.draft;
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-black border tracking-wider uppercase ${current.style}`}>
        {current.text}
      </span>
    );
  };

  // Agrupamiento del bracket por rondas
  const getRounds = (bracket: Match[], maxTeams: number) => {
    if (maxTeams === 8) {
      return [
        { name: "Cuartos de Final", matches: bracket.filter((m) => m.matchId.startsWith("Q")) },
        { name: "Semifinales", matches: bracket.filter((m) => m.matchId.startsWith("S")) },
        { name: "Final", matches: bracket.filter((m) => m.matchId.startsWith("F")) },
      ];
    } else {
      return [
        { name: "Octavos de Final", matches: bracket.filter((m) => m.matchId.startsWith("O")) },
        { name: "Cuartos de Final", matches: bracket.filter((m) => m.matchId.startsWith("Q")) },
        { name: "Semifinales", matches: bracket.filter((m) => m.matchId.startsWith("S")) },
        { name: "Final", matches: bracket.filter((m) => m.matchId.startsWith("F")) },
      ];
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 max-w-[1600px] w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 dark:border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Trophy className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-extrabold uppercase tracking-widest">Competiciones y Eventos</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Torneos de {activeClub?.name || "tu sede"}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Creá torneos, gestioná las parejas registradas y actualizá los cruces eliminatorios en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-black text-sm rounded-xl shadow-[0_4px_20px_rgba(57,255,20,0.25)] hover:shadow-[0_4px_25px_rgba(57,255,20,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Crear Torneo
        </button>
      </div>

      {loading && tournaments.length === 0 ? (
        <div className="h-[300px] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="border border-dashed border-zinc-300 dark:border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
          <Trophy className="w-12 h-12 text-zinc-400 mx-auto opacity-30" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Sin torneos creados</h3>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Comenzá a armar la comunidad de tu sede creando tu primer torneo eliminatorio de pádel o tenis.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary/10 text-primary font-bold text-xs rounded-xl hover:bg-primary/20 transition-all"
          >
            Crear Primer Torneo
          </button>
        </div>
      ) : !selectedTournament ? (
        // LISTADO DE TORNEOS
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((torneo) => {
            const registeredCount = torneo.teams.length;
            const limit = torneo.maxTeams;
            const progressPercent = Math.min(100, Math.round((registeredCount / limit) * 100));

            return (
              <div
                key={torneo._id}
                onClick={() => {
                  setSelectedTournament(torneo);
                  setActiveTab('bracket');
                }}
                className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-md hover:shadow-xl hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 text-zinc-500 border border-zinc-200 dark:border-white/5">
                      🎾 {torneo.sport.toUpperCase()}
                    </span>
                    {renderStatusBadge(torneo.status)}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                      {torneo.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-semibold mt-0.5">Categoría: {torneo.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-zinc-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{new Date(torneo.startDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-primary" />
                      <span>${torneo.registrationFee.toLocaleString("es-AR")}</span>
                    </div>
                  </div>

                  {/* Cupo de Parejas Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200/55 dark:border-white/[0.03]">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-500">Parejas Inscritas:</span>
                      <span className="font-extrabold text-zinc-700 dark:text-zinc-350">{registeredCount} / {limit}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-950 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary shadow-[0_0_8px_rgba(57,255,20,0.5)] transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 text-xs font-black text-primary group-hover:translate-x-1.5 transition-all">
                  Ver Detalles ➔
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // VISTA DE DETALLE DEL TORNEO SELECCIONADO
        <div className="space-y-6">
          <button
            onClick={() => setSelectedTournament(null)}
            className="text-xs font-black text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all flex items-center gap-1.5"
          >
            ← Volver al Listado
          </button>

          {/* Tournament Quick Info banner */}
          <div className="bg-gradient-to-r from-zinc-100/80 to-zinc-50/50 dark:from-zinc-950/80 dark:to-zinc-900/30 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">{selectedTournament.name}</h2>
                {renderStatusBadge(selectedTournament.status)}
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-semibold text-zinc-500">
                <span>🏆 Deporte: <b className="text-zinc-800 dark:text-zinc-300">{selectedTournament.sport.toUpperCase()}</b></span>
                <span>🏷️ Categoría: <b className="text-zinc-800 dark:text-zinc-300">{selectedTournament.category}</b></span>
                <span>📅 Fecha: <b className="text-zinc-800 dark:text-zinc-300">{new Date(selectedTournament.startDate).toLocaleDateString('es-AR')} al {new Date(selectedTournament.endDate).toLocaleDateString('es-AR')}</b></span>
                <span>💵 Inscripción: <b className="text-primary">${selectedTournament.registrationFee.toLocaleString("es-AR")}</b></span>
              </div>
            </div>

            {selectedTournament.status === 'registration' && (
              <button
                onClick={() => setShowRegisterTeamModal(true)}
                className="px-4 py-2.5 bg-primary text-black font-black text-xs rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
              >
                Inscribir Pareja Manuscrita
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-white/5 gap-4">
            <button
              onClick={() => setActiveTab('bracket')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'bracket'
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Cuadro del Torneo (Brackets)
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'teams'
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              Parejas Inscritas ({selectedTournament.teams.length} / {selectedTournament.maxTeams})
            </button>
          </div>

          {/* BRACKET VIEW PANE */}
          {activeTab === 'bracket' && (
            <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-lg">
              {selectedTournament.bracket.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 max-w-sm mx-auto space-y-3">
                  <ShieldAlert className="w-10 h-10 mx-auto opacity-30 text-amber-400" />
                  <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">El cuadro aún no se ha generado</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Las llaves eliminatorias se crearán de forma automática una vez que se completen los cupos del torneo ({selectedTournament.maxTeams} parejas).
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto pb-4 justify-between items-center py-4">
                  {getRounds(selectedTournament.bracket, selectedTournament.maxTeams).map((round, rIdx) => (
                    <div key={rIdx} className="space-y-8 flex-1 min-w-[240px] w-full">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-200/60 dark:border-white/5 pb-2 text-center">
                        {round.name}
                      </h4>
                      <div className="space-y-6 flex flex-col justify-around h-full">
                        {round.matches.map((match) => {
                          const hasBothTeams = match.teamA && match.teamB;
                          const isFinished = match.winnerId !== null;

                          return (
                            <div
                              key={match.matchId}
                              onClick={() => {
                                if (hasBothTeams && !isFinished) {
                                  setSelectedMatch(match);
                                  setMatchScore({
                                    scoreA: match.scoreA || 0,
                                    scoreB: match.scoreB || 0,
                                  });
                                }
                              }}
                              className={`bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 rounded-xl shadow-inner relative flex flex-col gap-2 transition-all ${
                                hasBothTeams && !isFinished
                                  ? "hover:border-primary/50 cursor-pointer hover:shadow-lg active:scale-98"
                                  : ""
                              }`}
                            >
                              {/* Match ID marker */}
                              <span className="absolute -top-2.5 -left-1.5 bg-zinc-200 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 text-[9px] px-1.5 py-0.5 rounded font-black text-zinc-500 dark:text-zinc-400">
                                {match.matchId}
                              </span>

                              {/* Team A */}
                              <div className={`flex justify-between items-center text-xs p-1.5 rounded ${
                                isFinished && match.winnerId === match.teamA?._id?.toString()
                                  ? "bg-primary/10 text-primary border border-primary/20 font-black"
                                  : "text-zinc-700 dark:text-zinc-350"
                              }`}>
                                <span className="truncate max-w-[140px]">
                                  {match.teamA ? `👥 ${match.teamA.name}` : "⏳ Esperando ganador"}
                                </span>
                                {match.scoreA !== null && (
                                  <span className="font-extrabold text-sm px-1.5">{match.scoreA}</span>
                                )}
                              </div>

                              {/* Team B */}
                              <div className={`flex justify-between items-center text-xs p-1.5 rounded ${
                                isFinished && match.winnerId === match.teamB?._id?.toString()
                                  ? "bg-primary/10 text-primary border border-primary/20 font-black"
                                  : "text-zinc-700 dark:text-zinc-350"
                              }`}>
                                <span className="truncate max-w-[140px]">
                                  {match.teamB ? `👥 ${match.teamB.name}` : "⏳ Esperando ganador"}
                                </span>
                                {match.scoreB !== null && (
                                  <span className="font-extrabold text-sm px-1.5">{match.scoreB}</span>
                                )}
                              </div>

                              {/* Final Champion marker */}
                              {match.matchId === 'F-1' && isFinished && (
                                <div className="mt-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 flex items-center justify-center gap-1.5 text-xs text-yellow-500 font-extrabold animate-pulse">
                                  <Medal className="w-4 h-4 text-[#ffaa00]" />
                                  ¡CAMPEÓN DEFINIDO!
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* REGISTERED TEAMS PANE */}
          {activeTab === 'teams' && (
            <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">Parejas Registradas</h3>
                {selectedTournament.status === 'registration' && (
                  <button
                    onClick={() => setShowRegisterTeamModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Inscribir Pareja
                  </button>
                )}
              </div>

              {selectedTournament.teams.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No hay parejas inscritas todavía.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTournament.teams.map((team, idx) => (
                    <div
                      key={team._id}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 flex flex-col justify-between gap-3 relative"
                    >
                      <div className="flex justify-between items-center border-b border-zinc-200/55 dark:border-white/5 pb-2">
                        <span className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-primary" />
                          {team.name}
                        </span>
                        <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                      </div>

                      <div className="space-y-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        <div className="flex justify-between items-center">
                          <span>👤 {team.player1.name}</span>
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400"><Phone className="w-3 h-3" /> {team.player1.phone}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>👤 {team.player2.name}</span>
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400"><Phone className="w-3 h-3" /> {team.player2.phone}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR TORNEO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-black text-zinc-900 dark:text-white flex items-center gap-2">
                🏆 Nuevo Torneo
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTournament} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Torneo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Torneo Apertura 4ta"
                  value={newTournament.name}
                  onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Deporte</label>
                  <select
                    value={newTournament.sport}
                    onChange={(e) => setNewTournament({ ...newTournament, sport: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="padel">Pádel</option>
                    <option value="tennis">Tenis</option>
                    <option value="football">Fútbol</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Categoría</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 4ta o Suma 11"
                    value={newTournament.category}
                    onChange={(e) => setNewTournament({ ...newTournament, category: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={newTournament.startDate}
                    onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Fecha Fin</label>
                  <input
                    type="date"
                    required
                    value={newTournament.endDate}
                    onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Costo Inscripción ($)</label>
                  <input
                    type="number"
                    required
                    value={newTournament.registrationFee}
                    onChange={(e) => setNewTournament({ ...newTournament, registrationFee: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Cupo de Parejas</label>
                  <select
                    value={newTournament.maxTeams}
                    onChange={(e) => setNewTournament({ ...newTournament, maxTeams: Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value={8}>8 Parejas (Desde Cuartos)</option>
                    <option value={16}>16 Parejas (Desde Octavos)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black font-black rounded-xl text-sm"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INSCRIBIR PAREJA */}
      {showRegisterTeamModal && selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRegisterTeamModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                📝 Inscribir Pareja
              </h3>
              <button onClick={() => setShowRegisterTeamModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterTeam} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Nombre del Equipo / Pareja</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Los Pibes del Vidrio"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Jugador 1 */}
              <div className="border-t border-zinc-200 dark:border-white/5 pt-3 space-y-3">
                <h4 className="text-xs font-black text-primary">Jugador 1</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Nombre</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo"
                      value={newTeam.player1.name}
                      onChange={(e) => setNewTeam({
                        ...newTeam,
                        player1: { ...newTeam.player1, name: e.target.value }
                      })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Teléfono</label>
                    <input
                      type="text"
                      required
                      placeholder="Celular de contacto"
                      value={newTeam.player1.phone}
                      onChange={(e) => setNewTeam({
                        ...newTeam,
                        player1: { ...newTeam.player1, phone: e.target.value }
                      })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Jugador 2 */}
              <div className="border-t border-zinc-200 dark:border-white/5 pt-3 space-y-3">
                <h4 className="text-xs font-black text-primary">Jugador 2</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Nombre</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre completo"
                      value={newTeam.player2.name}
                      onChange={(e) => setNewTeam({
                        ...newTeam,
                        player2: { ...newTeam.player2, name: e.target.value }
                      })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Teléfono</label>
                    <input
                      type="text"
                      required
                      placeholder="Celular de contacto"
                      value={newTeam.player2.phone}
                      onChange={(e) => setNewTeam({
                        ...newTeam,
                        player2: { ...newTeam.player2, phone: e.target.value }
                      })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowRegisterTeamModal(false)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black font-black rounded-xl text-sm"
                >
                  Confirmar Pareja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CARGAR MARCADOR PARTIDO */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMatch(null)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                🎾 Cargar Marcador - Partido {selectedMatch.matchId}
              </h3>
              <button onClick={() => setSelectedMatch(null)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateMatchScore} className="p-6 space-y-5">
              <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-inner">
                {/* Equipo A */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                    👥 {selectedMatch.teamA?.name}
                  </span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={matchScore.scoreA}
                    onChange={(e) => setMatchScore({ ...matchScore, scoreA: Number(e.target.value) })}
                    className="w-16 bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-white/10 rounded-lg py-2.5 text-center text-sm font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white"
                  />
                </div>

                {/* Separador */}
                <div className="border-t border-zinc-200 dark:border-white/5" />

                {/* Equipo B */}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 truncate max-w-[180px]">
                    👥 {selectedMatch.teamB?.name}
                  </span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={matchScore.scoreB}
                    onChange={(e) => setMatchScore({ ...matchScore, scoreB: Number(e.target.value) })}
                    className="w-16 bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-white/10 rounded-lg py-2.5 text-center text-sm font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3 flex items-start gap-2 text-[10px] text-amber-400 font-semibold leading-relaxed">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <span>Al guardar, el equipo ganador avanzará de forma automática en el cuadro a la siguiente fase del torneo.</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black font-black rounded-xl text-sm"
                >
                  Guardar Marcador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
