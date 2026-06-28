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
  Edit3,
  Trash2,
  Shuffle,
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
  group?: string;
  registeredAt: string;
  paymentStatus?: 'pending' | 'paid';
  paymentDate?: string;
};

type Match = {
  matchId: string;
  teamA: Team | null;
  teamB: Team | null;
  scoreA: number | null;
  scoreB: number | null;
  sets?: { scoreA: number; scoreB: number }[];
  winnerId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 'A' | 'B' | null;
  stage?: 'groups' | 'playoff' | 'round_robin';
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
  type: 'elimination' | 'round_robin' | 'groups_playoff' | 'americano';
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
  const [activeTab, setActiveTab] = useState<'bracket' | 'teams' | 'groups'>('bracket');
  const [standings, setStandings] = useState<any>(null);

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
    type: "elimination" as 'elimination' | 'round_robin' | 'groups_playoff' | 'americano',
  });

  // Formulario inscribir equipo
  const [newTeam, setNewTeam] = useState({
    name: "",
    player1: { name: "", phone: "", email: "" },
    player2: { name: "", phone: "", email: "" },
  });

  // Formulario puntajes partido (soporta sets)
  const [matchSets, setMatchSets] = useState<{ scoreA: number; scoreB: number }[]>([
    { scoreA: 0, scoreB: 0 }
  ]);

  // Edición de torneo
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  // Edición de equipo
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editTeamForm, setEditTeamForm] = useState({
    name: "",
    player1: { name: "", phone: "", email: "" },
    player2: { name: "", phone: "", email: "" },
  });

  const activeClub = clubs.find((c) => c._id === activeClubId);

  const fetchStandings = async (tournamentId: string) => {
    try {
      const response = await apiFetch(`/tournaments/${tournamentId}/standings`);
      if (response.ok) {
        const data = await response.json();
        setStandings(data);
      }
    } catch (err) {
      console.error("Error fetching standings:", err);
    }
  };

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
          if (updatedSelected.type !== 'elimination') {
            void fetchStandings(updatedSelected._id);
          }
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
        type: "elimination",
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
      const payload = selectedTournament.type === 'americano' ? {
        name: newTeam.player1.name,
        player1: newTeam.player1,
        player2: newTeam.player1,
      } : {
        ...newTeam,
        name: `${newTeam.player1.name} / ${newTeam.player2.name}`,
      };

      const response = await apiFetch(`/tournaments/${selectedTournament._id}/register-team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const handleAdvanceToPlayoffs = async () => {
    if (!selectedTournament) return;
    try {
      const response = await apiFetch(`/tournaments/${selectedTournament._id}/advance-playoffs`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al avanzar a eliminatorias.");
      }
      await fetchTournaments();
      setActiveTab('bracket');
    } catch (err: any) {
      alert(err.message || "Error al avanzar a eliminatorias.");
    }
  };

  const handleUpdateMatchScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !selectedMatch) return;
    try {
      const isAmericano = selectedTournament.type === 'americano';
      const payload: any = {
        matchId: selectedMatch.matchId,
      };

      if (isAmericano) {
        payload.scoreA = Number(matchSets[0]?.scoreA || 0);
        payload.scoreB = Number(matchSets[0]?.scoreB || 0);
      } else {
        payload.sets = matchSets.map(s => ({
          scoreA: Number(s.scoreA),
          scoreB: Number(s.scoreB),
        }));
      }

      const response = await apiFetch(`/tournaments/${selectedTournament._id}/update-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar marcador.");
      }

      setSelectedMatch(null);
      setMatchSets([{ scoreA: 0, scoreB: 0 }]);
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al guardar marcador.");
    }
  };

  const handleEditTournament = (torneo: Tournament) => {
    setEditingTournament(torneo);
    setNewTournament({
      name: torneo.name,
      sport: torneo.sport,
      category: torneo.category,
      startDate: torneo.startDate.split('T')[0],
      endDate: torneo.endDate.split('T')[0],
      registrationFee: torneo.registrationFee,
      maxTeams: torneo.maxTeams,
      type: torneo.type,
    });
    setShowCreateModal(true);
  };

  const handleUpdateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTournament) return;
    try {
      const response = await apiFetch(`/tournaments/${editingTournament._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTournament),
      });
      if (!response.ok) throw new Error("Error al actualizar el torneo.");
      
      setShowCreateModal(false);
      setEditingTournament(null);
      setNewTournament({
        name: "",
        sport: "padel",
        category: "",
        startDate: "",
        endDate: "",
        registrationFee: 0,
        maxTeams: 8,
        type: "elimination",
      });
      await fetchTournaments();
    } catch (err) {
      alert("Error al actualizar el torneo");
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm("¿Estás seguro de que querés eliminar este torneo? Esta acción no se puede deshacer.")) return;
    try {
      const response = await apiFetch(`/tournaments/${tournamentId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el torneo.");
      }
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el torneo.");
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setEditTeamForm({
      name: team.name,
      player1: { name: team.player1.name, phone: team.player1.phone, email: team.player1.email || "" },
      player2: { name: team.player2.name, phone: team.player2.phone, email: team.player2.email || "" },
    });
    setShowEditTeamModal(true);
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament || !editingTeam) return;
    try {
      const payload = selectedTournament.type === 'americano' ? {
        name: editTeamForm.player1.name,
        player1: editTeamForm.player1,
        player2: editTeamForm.player1,
      } : {
        ...editTeamForm,
        name: `${editTeamForm.player1.name} / ${editTeamForm.player2.name}`,
      };

      const response = await apiFetch(`/tournaments/${selectedTournament._id}/teams/${editingTeam._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el equipo.");
      }
      setShowEditTeamModal(false);
      setEditingTeam(null);
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al actualizar el equipo.");
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!selectedTournament) return;
    if (!confirm("¿Estás seguro de que querés eliminar este equipo? Si el torneo ya está activo, se reiniciarán las llaves.")) return;
    try {
      const response = await apiFetch(`/tournaments/${selectedTournament._id}/teams/${teamId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al eliminar el equipo.");
      }
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el equipo.");
    }
  };

  const toggleTeamPayment = async (team: Team) => {
    if (!selectedTournament) return;
    const newStatus = team.paymentStatus === "paid" ? "pending" : "paid";
    try {
      const response = await apiFetch(`/tournaments/${selectedTournament._id}/teams/${team._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: newStatus,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al actualizar el pago.");
      }
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al actualizar el pago.");
    }
  };

  const handleShuffleGroups = async () => {
    if (!selectedTournament) return;
    if (!confirm("¿Querés mezclar los enfrentamientos de la fase de grupos? Se reorganizarán todos los partidos.")) return;
    try {
      const response = await apiFetch(`/tournaments/${selectedTournament._id}/shuffle-groups`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al mezclar enfrentamientos.");
      }
      await fetchTournaments();
    } catch (err: any) {
      alert(err.message || "Error al mezclar enfrentamientos.");
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
  const getRounds = (bracket: Match[], maxTeams: number, type: string) => {
    const playoffBracket = bracket.filter((m: any) => m.stage === 'playoff' || !m.stage);
    if (type === 'groups_playoff') {
      if (maxTeams === 8) {
        return [
          { name: "Semifinales", matches: playoffBracket.filter((m) => m.matchId.startsWith("S")) },
          { name: "Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("F")) },
        ];
      } else {
        return [
          { name: "Cuartos de Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("Q")) },
          { name: "Semifinales", matches: playoffBracket.filter((m) => m.matchId.startsWith("S")) },
          { name: "Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("F")) },
        ];
      }
    } else {
      if (maxTeams === 8) {
        return [
          { name: "Cuartos de Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("Q")) },
          { name: "Semifinales", matches: playoffBracket.filter((m) => m.matchId.startsWith("S")) },
          { name: "Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("F")) },
        ];
      } else {
        return [
          { name: "Octavos de Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("O")) },
          { name: "Cuartos de Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("Q")) },
          { name: "Semifinales", matches: playoffBracket.filter((m) => m.matchId.startsWith("S")) },
          { name: "Final", matches: playoffBracket.filter((m) => m.matchId.startsWith("F")) },
        ];
      }
    }
  };

  const groupMatchesByRound = (matches: Match[]) => {
    const roundsMap: { [key: string]: Match[] } = {};
    matches.forEach(m => {
      const parts = m.matchId.split('-');
      const roundPart = parts.find(p => p.startsWith('R')) || 'R1';
      const roundNum = roundPart.replace('R', '');
      const roundName = `Ronda ${roundNum}`;
      if (!roundsMap[roundName]) {
        roundsMap[roundName] = [];
      }
      roundsMap[roundName].push(m);
    });
    return Object.entries(roundsMap).sort((a, b) => {
      const numA = parseInt(a[0].replace('Ronda ', ''));
      const numB = parseInt(b[0].replace('Ronda ', ''));
      return numA - numB;
    });
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
                  setActiveTab(torneo.type === 'groups_playoff' ? 'groups' : 'bracket');
                  if (torneo.type !== 'elimination') {
                    void fetchStandings(torneo._id);
                  } else {
                    setStandings(null);
                  }
                }}
                className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-md hover:shadow-xl hover:border-zinc-300 dark:hover:border-white/10 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 text-zinc-500 border border-zinc-200 dark:border-white/5">
                      🎾 {torneo.sport.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-950 text-zinc-500 border border-zinc-200 dark:border-white/5">
                      {torneo.type === 'elimination' && '🏆 Eliminación'}
                      {torneo.type === 'round_robin' && '🔁 Liga'}
                      {torneo.type === 'groups_playoff' && '👥 Grupos + Playoffs'}
                      {torneo.type === 'americano' && '🇺🇸 Americano'}
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

                  {/* Cupo de Parejas/Jugadores Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200/55 dark:border-white/[0.03]">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-zinc-500">
                        {torneo.type === 'americano' ? 'Jugadores Inscritos:' : 'Parejas Inscritas:'}
                      </span>
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

                <div className="flex justify-between items-center pt-4 border-t border-zinc-200/55 dark:border-white/[0.03]">
                  <div className="flex gap-2">
                    {(torneo.status === 'draft' || torneo.status === 'registration') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTournament(torneo); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-500/10 text-blue-400 font-bold text-[10px] rounded-lg hover:bg-blue-500/20 transition-all"
                      >
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteTournament(torneo._id); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-400 font-bold text-[10px] rounded-lg hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                  <div className="text-xs font-black text-primary group-hover:translate-x-1.5 transition-all ml-auto">
                    Ver Detalles ➔
                  </div>
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
                <span>📋 Formato: <b className="text-zinc-800 dark:text-zinc-300">
                  {selectedTournament.type === 'elimination' && 'Eliminación Directa'}
                  {selectedTournament.type === 'round_robin' && 'Todos contra Todos (Liga)'}
                  {selectedTournament.type === 'groups_playoff' && 'Fase de Grupos + Playoffs'}
                  {selectedTournament.type === 'americano' && 'Torneo Americano (Individual)'}
                </b></span>
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
                {selectedTournament.type === 'americano' ? 'Inscribir Jugador' : 'Inscribir Pareja Manuscrita'}
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-zinc-200 dark:border-white/5 gap-4">
            {selectedTournament.type === 'groups_playoff' && (
              <button
                onClick={() => setActiveTab('groups')}
                className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === 'groups'
                    ? "border-primary text-primary font-black"
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                }`}
              >
                Fase de Grupos
              </button>
            )}

            <button
              onClick={() => setActiveTab('bracket')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'bracket'
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {selectedTournament.type === 'groups_playoff' && 'Fase Final (Playoffs)'}
              {(selectedTournament.type === 'round_robin' || selectedTournament.type === 'americano') && 'Partidos y Clasificación'}
              {selectedTournament.type === 'elimination' && 'Cuadro del Torneo (Brackets)'}
            </button>

            <button
              onClick={() => setActiveTab('teams')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'teams'
                  ? "border-primary text-primary font-black"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
              }`}
            >
              {selectedTournament.type === 'americano' ? 'Jugadores Inscritos' : 'Parejas Inscritas'} ({selectedTournament.teams.length} / {selectedTournament.maxTeams})
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
                    Las llaves se crearán de forma automática una vez que se completen los cupos del torneo ({selectedTournament.maxTeams} {selectedTournament.type === 'americano' ? 'jugadores' : 'parejas'}).
                  </p>
                </div>
              ) : (selectedTournament.type === 'elimination' || (selectedTournament.type === 'groups_playoff' && activeTab === 'bracket')) ? (
                // Vista de Llaves Eliminatorias (Bracket)
                <div className="flex flex-col lg:flex-row gap-8 overflow-x-auto pb-4 justify-between items-center py-4">
                  {getRounds(selectedTournament.bracket, selectedTournament.maxTeams, selectedTournament.type).map((round, rIdx) => {
                    if (round.matches.length === 0) return null;
                    return (
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
                                  if (hasBothTeams) {
                                    setSelectedMatch(match);
                                    if (selectedTournament.type === 'americano') {
                                      setMatchSets([{ scoreA: match.scoreA || 0, scoreB: match.scoreB || 0 }]);
                                    } else {
                                      setMatchSets(match.sets && match.sets.length > 0 ? match.sets : [{ scoreA: 0, scoreB: 0 }]);
                                    }
                                  }
                                }}
                                className={`bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 rounded-xl shadow-inner relative flex flex-col gap-2 transition-all ${
                                  hasBothTeams
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
                                  {match.sets && match.sets.length > 0 ? (
                                    <div className="flex gap-1 font-extrabold text-xs">
                                      {match.sets.map((set, idx) => (
                                        <span 
                                          key={idx} 
                                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                                            set.scoreA > set.scoreB 
                                              ? "bg-primary/20 text-primary border border-primary/30" 
                                              : "bg-zinc-200/40 dark:bg-zinc-800/50 text-zinc-500"
                                          }`}
                                        >
                                          {set.scoreA}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    match.scoreA !== null && (
                                      <span className="font-extrabold text-sm px-1.5">{match.scoreA}</span>
                                    )
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
                                  {match.sets && match.sets.length > 0 ? (
                                    <div className="flex gap-1 font-extrabold text-xs">
                                      {match.sets.map((set, idx) => (
                                        <span 
                                          key={idx} 
                                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                                            set.scoreB > set.scoreA 
                                              ? "bg-primary/20 text-primary border border-primary/30" 
                                              : "bg-zinc-200/40 dark:bg-zinc-800/50 text-zinc-500"
                                          }`}
                                        >
                                          {set.scoreB}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    match.scoreB !== null && (
                                      <span className="font-extrabold text-sm px-1.5">{match.scoreB}</span>
                                    )
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
                    );
                  })}
                </div>
              ) : (
                // Vista de Round Robin (Liga) o Americano
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Tabla de Clasificación */}
                  <div className="lg:col-span-5 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-200/60 dark:border-white/5 pb-2">
                      Tabla de Clasificación
                    </h4>
                    {standings ? (
                      <div className="overflow-x-auto border border-zinc-200 dark:border-white/5 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-white/5">
                              <th className="p-3 w-10 text-center">Pos</th>
                              <th className="p-3">
                                {selectedTournament.type === 'americano' ? 'Jugador' : 'Pareja'}
                              </th>
                              {selectedTournament.type === 'americano' ? (
                                <>
                                  <th className="p-3 text-center">PJ</th>
                                  <th className="p-3 text-center">PG</th>
                                  <th className="p-3 text-center">Pts +</th>
                                  <th className="p-3 text-center">Pts -</th>
                                  <th className="p-3 text-center">Dif</th>
                                </>
                              ) : (
                                <>
                                  <th className="p-3 text-center">PG</th>
                                  <th className="p-3 text-center">Dif Sets</th>
                                  <th className="p-3 text-center">Dif Games</th>
                                </>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-semibold text-zinc-700 dark:text-zinc-350">
                            {selectedTournament.type === 'americano' ? (
                              standings.map((row: any, idx: number) => (
                                <tr key={row.playerId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                  <td className="p-3 text-center font-black text-primary">{idx + 1}</td>
                                  <td className="p-3 font-bold text-zinc-900 dark:text-white">
                                    <div>{row.name}</div>
                                    <div className="text-[10px] text-zinc-500 font-normal">{row.phone}</div>
                                  </td>
                                  <td className="p-3 text-center">{row.matchesPlayed}</td>
                                  <td className="p-3 text-center text-primary font-bold">{row.matchesWon}</td>
                                  <td className="p-3 text-center">{row.pointsWon}</td>
                                  <td className="p-3 text-center">{row.pointsLost}</td>
                                  <td className={`p-3 text-center font-bold ${row.pointsDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {row.pointsDiff > 0 ? `+${row.pointsDiff}` : row.pointsDiff}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              standings.map((row: any, idx: number) => (
                                <tr key={row.teamId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                  <td className="p-3 text-center font-black text-primary">{idx + 1}</td>
                                  <td className="p-3 font-bold text-zinc-900 dark:text-white">{row.team?.name}</td>
                                  <td className="p-3 text-center text-primary font-bold">{row.matchesWon}</td>
                                  <td className={`p-3 text-center font-bold ${row.setsDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                                  </td>
                                  <td className={`p-3 text-center font-bold ${(row.gamesDiff || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {(row.gamesDiff || 0) > 0 ? `+${row.gamesDiff}` : (row.gamesDiff || 0)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-zinc-500">Cargando clasificación...</div>
                    )}
                  </div>

                  {/* Listado de Partidos por Ronda */}
                  <div className="lg:col-span-7 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-200/60 dark:border-white/5 pb-2">
                      Rondas y Partidos
                    </h4>
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                      {groupMatchesByRound(selectedTournament.bracket).map(([roundName, roundMatches]) => (
                        <div key={roundName} className="space-y-3">
                          <h5 className="text-xs font-extrabold text-primary uppercase tracking-widest">{roundName}</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {roundMatches.map((match) => {
                              const hasBothTeams = match.teamA && match.teamB;
                              const isFinished = match.winnerId !== null;

                              return (
                                <div
                                  key={match.matchId}
                                  onClick={() => {
                                    if (hasBothTeams) {
                                      setSelectedMatch(match);
                                      if (selectedTournament.type === 'americano') {
                                        setMatchSets([{ scoreA: match.scoreA || 0, scoreB: match.scoreB || 0 }]);
                                      } else {
                                        setMatchSets(match.sets && match.sets.length > 0 ? match.sets : [{ scoreA: 0, scoreB: 0 }]);
                                      }
                                    }
                                  }}
                                  className={`bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 rounded-xl shadow-inner relative flex flex-col gap-1.5 transition-all ${
                                    hasBothTeams
                                      ? "hover:border-primary/50 cursor-pointer hover:shadow-lg active:scale-98"
                                      : ""
                                  }`}
                                >
                                  {/* Match ID */}
                                  <span className="text-[9px] font-bold text-zinc-500">
                                    Partido {match.matchId.split('-').pop()}
                                  </span>

                                  {/* Team A */}
                                  <div className={`flex justify-between items-center text-xs p-1 rounded ${
                                    isFinished && match.winnerId === match.teamA?._id?.toString()
                                      ? "bg-primary/10 text-primary border border-primary/20 font-black"
                                      : "text-zinc-700 dark:text-zinc-350"
                                  }`}>
                                    <span className="truncate max-w-[150px]">
                                      {match.teamA?.name}
                                    </span>
                                    {match.sets && match.sets.length > 0 ? (
                                      <div className="flex gap-1 font-extrabold text-xs">
                                        {match.sets.map((set, idx) => (
                                          <span 
                                            key={idx} 
                                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                                              set.scoreA > set.scoreB 
                                                ? "bg-primary/20 text-primary border border-primary/30" 
                                                : "bg-zinc-200/40 dark:bg-zinc-800/50 text-zinc-500"
                                            }`}
                                          >
                                            {set.scoreA}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      match.scoreA !== null && (
                                        <span className="font-extrabold text-sm px-1.5">{match.scoreA}</span>
                                      )
                                    )}
                                  </div>
 
                                  {/* Team B */}
                                  <div className={`flex justify-between items-center text-xs p-1 rounded ${
                                    isFinished && match.winnerId === match.teamB?._id?.toString()
                                      ? "bg-primary/10 text-primary border border-primary/20 font-black"
                                      : "text-zinc-700 dark:text-zinc-350"
                                  }`}>
                                    <span className="truncate max-w-[150px]">
                                      {match.teamB?.name}
                                    </span>
                                    {match.sets && match.sets.length > 0 ? (
                                      <div className="flex gap-1 font-extrabold text-xs">
                                        {match.sets.map((set, idx) => (
                                          <span 
                                            key={idx} 
                                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                                              set.scoreB > set.scoreA 
                                                ? "bg-primary/20 text-primary border border-primary/30" 
                                                : "bg-zinc-200/40 dark:bg-zinc-800/50 text-zinc-500"
                                            }`}
                                          >
                                            {set.scoreB}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      match.scoreB !== null && (
                                        <span className="font-extrabold text-sm px-1.5">{match.scoreB}</span>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FASE DE GRUPOS VIEW PANE */}
          {activeTab === 'groups' && selectedTournament.type === 'groups_playoff' && (
            <div className="space-y-6">
              {/* Botón de acción para el administrador */}
              {selectedTournament.status === 'active' && 
               !selectedTournament.bracket.some(m => m.stage === 'playoff') && (
                <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">Fase de Grupos en Curso</h4>
                    <p className="text-xs text-zinc-500">
                      Una vez que todos los partidos de la fase de grupos tengan sus resultados cargados, podés avanzar a la fase eliminatoria.
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {!selectedTournament.bracket.filter(m => m.stage === 'groups').some(m => m.scoreA !== null || m.scoreB !== null) && (
                      <button
                        onClick={handleShuffleGroups}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-500/10 text-violet-400 font-black text-xs rounded-xl border border-violet-500/20 hover:bg-violet-500/20 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        Mezclar Enfrentamientos
                      </button>
                    )}
                    <button
                      onClick={handleAdvanceToPlayoffs}
                      disabled={!selectedTournament.bracket.filter(m => m.stage === 'groups').every(m => m.scoreA !== null && m.scoreB !== null)}
                      className="px-5 py-2.5 bg-primary text-black font-black text-xs rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                    >
                      Avanzar a Eliminatorias ⚡
                    </button>
                  </div>
                </div>
              )}

              {/* Renderizado de los Grupos */}
              {standings ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {Object.entries(standings).map(([groupName, groupStandings]: [string, any]) => {
                    const groupMatches = selectedTournament.bracket.filter(m => 
                      m.stage === 'groups' && (m.teamA?.group === groupName || m.teamB?.group === groupName)
                    );

                    return (
                      <div key={groupName} className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-lg space-y-6">
                        <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-white/5 pb-2">
                          <h4 className="text-lg font-black text-primary">Grupo {groupName}</h4>
                          <span className="text-xs text-zinc-500 font-bold">Posiciones y Partidos</span>
                        </div>

                        {/* Tabla de posiciones de este grupo */}
                        <div className="overflow-x-auto border border-zinc-200 dark:border-white/5 rounded-xl">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-zinc-100 dark:bg-zinc-900/60 text-zinc-500 font-bold border-b border-zinc-200 dark:border-white/5">
                                <th className="p-2.5 w-10 text-center">Pos</th>
                                <th className="p-2.5">Pareja</th>
                                <th className="p-2.5 text-center">PG</th>
                                <th className="p-2.5 text-center">Dif Sets</th>
                                <th className="p-2.5 text-center">Dif Games</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-white/5 font-semibold text-zinc-700 dark:text-zinc-350">
                              {groupStandings.map((row: any, idx: number) => (
                                <tr key={row.teamId} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                  <td className="p-2.5 text-center font-black text-primary">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-zinc-900 dark:text-white">{row.team?.name}</td>
                                  <td className="p-2.5 text-center text-primary font-bold">{row.matchesWon}</td>
                                  <td className={`p-2.5 text-center font-bold ${row.setsDiff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {row.setsDiff > 0 ? `+${row.setsDiff}` : row.setsDiff}
                                  </td>
                                  <td className={`p-2.5 text-center font-bold ${(row.gamesDiff || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {(row.gamesDiff || 0) > 0 ? `+${row.gamesDiff}` : (row.gamesDiff || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Partidos de este grupo */}
                        <div className="space-y-3">
                          <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Partidos de Grupo</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {groupMatches.map((match) => {
                              const hasBothTeams = match.teamA && match.teamB;
                              const isFinished = match.winnerId !== null;

                              return (
                                <div
                                  key={match.matchId}
                                  onClick={() => {
                                    if (hasBothTeams) {
                                      setSelectedMatch(match);
                                      if (selectedTournament.type === 'americano') {
                                        setMatchSets([{ scoreA: match.scoreA || 0, scoreB: match.scoreB || 0 }]);
                                      } else {
                                        setMatchSets(match.sets && match.sets.length > 0 ? match.sets : [{ scoreA: 0, scoreB: 0 }]);
                                      }
                                    }
                                  }}
                                  className={`bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/5 p-3 rounded-xl shadow-inner relative flex flex-col gap-1.5 transition-all ${
                                    hasBothTeams
                                      ? "hover:border-primary/50 cursor-pointer hover:shadow-lg active:scale-98"
                                      : ""
                                  }`}
                                >
                                  <span className="text-[9px] font-bold text-zinc-500">
                                    Jornada {match.matchId.split('-').find(p => p.startsWith('R'))?.replace('R', '')}
                                  </span>

                                  <div className={`flex justify-between items-center text-xs p-1 rounded ${
                                    isFinished && match.winnerId === match.teamA?._id?.toString()
                                      ? "bg-primary/10 text-primary border border-primary/20 font-black"
                                      : "text-zinc-700 dark:text-zinc-350"
                                  }`}>
                                    <span className="truncate max-w-[140px]">{match.teamA?.name}</span>
                                    {match.sets && match.sets.length > 0 ? (
                                      <div className="flex gap-1 font-extrabold text-xs">
                                        {match.sets.map((set, idx) => (
                                          <span 
                                            key={idx} 
                                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                                              set.scoreA > set.scoreB 
                                                ? "bg-primary/20 text-primary border border-primary/30" 
                                                : "bg-zinc-200/40 dark:bg-zinc-800/50 text-zinc-500"
                                            }`}
                                          >
                                            {set.scoreA}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      match.scoreA !== null && (
                                        <span className="font-extrabold text-sm px-1.5">{match.scoreA}</span>
                                      )
                                    )}
                                  </div>

                                  <div className={`flex justify-between items-center text-xs p-1 rounded ${
                                    isFinished && match.winnerId === match.teamB?._id?.toString()
                                      ? "bg-primary/10 text-primary border border-primary/20 font-black"
                                      : "text-zinc-700 dark:text-zinc-350"
                                  }`}>
                                    <span className="truncate max-w-[140px]">{match.teamB?.name}</span>
                                    {match.sets && match.sets.length > 0 ? (
                                      <div className="flex gap-1 font-extrabold text-xs">
                                        {match.sets.map((set, idx) => (
                                          <span 
                                            key={idx} 
                                            className={`px-1.5 py-0.5 rounded text-[11px] ${
                                              set.scoreB > set.scoreA 
                                                ? "bg-primary/20 text-primary border border-primary/30" 
                                                : "bg-zinc-200/40 dark:bg-zinc-800/50 text-zinc-500"
                                            }`}
                                          >
                                            {set.scoreB}
                                          </span>
                                        ))}
                                      </div>
                                    ) : (
                                      match.scoreB !== null && (
                                        <span className="font-extrabold text-sm px-1.5">{match.scoreB}</span>
                                      )
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500">Cargando fase de grupos...</div>
              )}
            </div>
          )}

          {/* REGISTERED TEAMS PANE */}
          {activeTab === 'teams' && (
            <div className="bg-white/80 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 p-6 rounded-2xl shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {selectedTournament.type === 'americano' ? 'Jugadores Registrados' : 'Parejas Registradas'}
                </h3>
                {selectedTournament.status === 'registration' && (
                  <button
                    onClick={() => setShowRegisterTeamModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {selectedTournament.type === 'americano' ? 'Inscribir Jugador' : 'Inscribir Pareja'}
                  </button>
                )}
              </div>

              {selectedTournament.teams.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-8">No hay inscripciones todavía.</p>
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
                          {selectedTournament.type === 'americano' ? team.player1.name : team.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-500">#{idx + 1}</span>
                          {selectedTournament.status === 'registration' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEditTeam(team)}
                                className="p-1 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-all"
                                title="Editar equipo"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeam(team._id)}
                                className="p-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-all"
                                title="Eliminar equipo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                        {selectedTournament.type === 'americano' ? (
                          <div className="flex justify-between items-center">
                            <span>📞 Teléfono: {team.player1.phone}</span>
                            {team.player1.email && <span className="text-[10px] text-zinc-400">{team.player1.email}</span>}
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-center">
                              <span>👤 {team.player1.name}</span>
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400"><Phone className="w-3 h-3" /> {team.player1.phone}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>👤 {team.player2.name}</span>
                              <span className="flex items-center gap-1 text-[10px] text-zinc-400"><Phone className="w-3 h-3" /> {team.player2.phone}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Estado de Pago */}
                      {selectedTournament.registrationFee > 0 && (
                        <div className="mt-2 pt-2 border-t border-zinc-200/55 dark:border-white/5 flex items-center justify-between text-xs">
                          <span className="text-zinc-500 font-bold">Inscripción (${selectedTournament.registrationFee.toLocaleString("es-AR")}):</span>
                          <button
                            onClick={() => toggleTeamPayment(team)}
                            className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase transition-all flex items-center gap-1 ${
                              team.paymentStatus === "paid"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 hover:bg-amber-500/25"
                            }`}
                            title="Haz clic para cambiar el estado de pago"
                          >
                            <span>{team.paymentStatus === "paid" ? "🟢 Cobrado" : "🟡 Pendiente"}</span>
                          </button>
                        </div>
                      )}
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
                {editingTournament ? '✏️ Editar Torneo' : '🏆 Nuevo Torneo'}
              </h3>
              <button onClick={() => { setShowCreateModal(false); setEditingTournament(null); }} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={editingTournament ? handleUpdateTournament : handleCreateTournament} className="p-6 space-y-4">
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
                    value={newTournament.registrationFee === 0 ? "" : newTournament.registrationFee}
                    onChange={(e) => setNewTournament({ ...newTournament, registrationFee: e.target.value === "" ? 0 : Number(e.target.value) })}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Formato del Torneo</label>
                  <select
                    value={newTournament.type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      const defaultMaxTeams = 8;
                      setNewTournament({ ...newTournament, type: newType, maxTeams: defaultMaxTeams });
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                  >
                    <option value="elimination">Eliminación Directa</option>
                    <option value="round_robin">Liga (Todos contra todos)</option>
                    <option value="groups_playoff">Grupos + Playoffs</option>
                    <option value="americano">Americano (Individual)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                  {newTournament.type === 'americano' ? 'Cupo de Jugadores' : 'Cupo de Parejas'}
                </label>
                <select
                  value={newTournament.maxTeams}
                  onChange={(e) => setNewTournament({ ...newTournament, maxTeams: Number(e.target.value) })}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                >
                  {newTournament.type === 'elimination' && (
                    <>
                      <option value={8}>8 Parejas (Desde Cuartos)</option>
                      <option value={16}>16 Parejas (Desde Octavos)</option>
                    </>
                  )}
                  {newTournament.type === 'round_robin' && (
                    <>
                      <option value={4}>4 Parejas</option>
                      <option value={6}>6 Parejas</option>
                      <option value={8}>8 Parejas</option>
                      <option value={10}>10 Parejas</option>
                      <option value={12}>12 Parejas</option>
                      <option value={16}>16 Parejas</option>
                    </>
                  )}
                  {newTournament.type === 'groups_playoff' && (
                    <>
                      <option value={8}>8 Parejas (2 grupos de 4)</option>
                      <option value={16}>16 Parejas (4 grupos de 4)</option>
                    </>
                  )}
                  {newTournament.type === 'americano' && (
                    <>
                      <option value={4}>4 Jugadores (1 cancha)</option>
                      <option value={8}>8 Jugadores (2 canchas)</option>
                      <option value={12}>12 Jugadores (3 canchas)</option>
                      <option value={16}>16 Jugadores (4 canchas)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingTournament(null); }}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black font-black rounded-xl text-sm"
                >
                  {editingTournament ? 'Actualizar Torneo' : 'Guardar'}
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
                {selectedTournament.type === 'americano' ? '📝 Inscribir Jugador' : '📝 Inscribir Pareja'}
              </h3>
              <button onClick={() => setShowRegisterTeamModal(false)} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRegisterTeam} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              {/* Jugador 1 / Jugador */}
              <div className="pt-1 space-y-3">
                <h4 className="text-xs font-black text-primary">
                  {selectedTournament.type === 'americano' ? 'Datos del Jugador' : 'Jugador 1'}
                </h4>
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
              {selectedTournament.type !== 'americano' && (
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
              )}

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
                  {selectedTournament.type === 'americano' ? 'Confirmar Inscripción' : 'Confirmar Pareja'}
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
              {selectedTournament?.type === 'americano' ? (
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
                      value={matchSets[0]?.scoreA || 0}
                      onChange={(e) => {
                        const newSets = [...matchSets];
                        if (!newSets[0]) newSets[0] = { scoreA: 0, scoreB: 0 };
                        newSets[0].scoreA = Number(e.target.value);
                        setMatchSets(newSets);
                      }}
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
                      value={matchSets[0]?.scoreB || 0}
                      onChange={(e) => {
                        const newSets = [...matchSets];
                        if (!newSets[0]) newSets[0] = { scoreA: 0, scoreB: 0 };
                        newSets[0].scoreB = Number(e.target.value);
                        setMatchSets(newSets);
                      }}
                      className="w-16 bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-white/10 rounded-lg py-2.5 text-center text-sm font-black focus:outline-none focus:border-primary text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Tabla/Grilla compacta de Sets */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-white/5 shadow-inner space-y-3">
                    {/* Encabezado */}
                    <div className="grid grid-cols-12 gap-2 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <div className="col-span-6 text-left">Pareja</div>
                      {matchSets.map((_, idx) => (
                        <div key={idx} className="col-span-2">Set {idx + 1}</div>
                      ))}
                    </div>

                    {/* Fila Equipo A */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6 text-xs font-bold text-zinc-700 dark:text-zinc-350 truncate pr-1">
                        👥 {selectedMatch.teamA?.name}
                      </div>
                      {matchSets.map((set, idx) => (
                        <input
                          key={idx}
                          type="number"
                          required
                          min={0}
                          value={set.scoreA}
                          onChange={(e) => {
                            const newSets = [...matchSets];
                            newSets[idx].scoreA = Number(e.target.value);
                            setMatchSets(newSets);
                          }}
                          className="col-span-2 bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-white/10 rounded-lg py-1.5 text-center text-xs font-extrabold focus:outline-none focus:border-primary text-zinc-900 dark:text-white"
                        />
                      ))}
                    </div>

                    {/* Fila Equipo B */}
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6 text-xs font-bold text-zinc-700 dark:text-zinc-350 truncate pr-1">
                        👥 {selectedMatch.teamB?.name}
                      </div>
                      {matchSets.map((set, idx) => (
                        <input
                          key={idx}
                          type="number"
                          required
                          min={0}
                          value={set.scoreB}
                          onChange={(e) => {
                            const newSets = [...matchSets];
                            newSets[idx].scoreB = Number(e.target.value);
                            setMatchSets(newSets);
                          }}
                          className="col-span-2 bg-white dark:bg-zinc-950 border border-zinc-350 dark:border-white/10 rounded-lg py-1.5 text-center text-xs font-extrabold focus:outline-none focus:border-primary text-zinc-900 dark:text-white"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Botones para agregar/quitar sets */}
                  <div className="flex gap-2">
                    {matchSets.length < 3 && (
                      <button
                        type="button"
                        onClick={() => setMatchSets([...matchSets, { scoreA: 0, scoreB: 0 }])}
                        className="flex-1 py-1.5 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-lg text-[11px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-primary" />
                        Agregar Set
                      </button>
                    )}
                    {matchSets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setMatchSets(matchSets.slice(0, -1))}
                        className="flex-1 py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-[11px] font-bold text-red-500 flex items-center justify-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        Eliminar Set
                      </button>
                    )}
                  </div>
                </div>
              )}

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

      {/* MODAL EDITAR EQUIPO */}
      {showEditTeamModal && editingTeam && selectedTournament && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }} />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-base font-black text-zinc-900 dark:text-white">
                ✏️ Editar {selectedTournament.type === 'americano' ? 'Jugador' : 'Equipo'}
              </h3>
              <button onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }} className="text-zinc-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateTeam} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto pr-2">
              <div className="pt-1 space-y-3">
                <h4 className="text-xs font-black text-primary">
                  {selectedTournament.type === 'americano' ? 'Datos del Jugador' : 'Jugador 1'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Nombre</label>
                    <input
                      type="text"
                      required
                      value={editTeamForm.player1.name}
                      onChange={(e) => setEditTeamForm({
                        ...editTeamForm,
                        player1: { ...editTeamForm.player1, name: e.target.value }
                      })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500">Teléfono</label>
                    <input
                      type="text"
                      value={editTeamForm.player1.phone}
                      onChange={(e) => setEditTeamForm({
                        ...editTeamForm,
                        player1: { ...editTeamForm.player1, phone: e.target.value }
                      })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {selectedTournament.type !== 'americano' && (
                <div className="border-t border-zinc-200 dark:border-white/5 pt-3 space-y-3">
                  <h4 className="text-xs font-black text-primary">Jugador 2</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500">Nombre</label>
                      <input
                        type="text"
                        required
                        value={editTeamForm.player2.name}
                        onChange={(e) => setEditTeamForm({
                          ...editTeamForm,
                          player2: { ...editTeamForm.player2, name: e.target.value }
                        })}
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500">Teléfono</label>
                      <input
                        type="text"
                        value={editTeamForm.player2.phone}
                        onChange={(e) => setEditTeamForm({
                          ...editTeamForm,
                          player2: { ...editTeamForm.player2, phone: e.target.value }
                        })}
                        className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-350 dark:border-white/10 rounded-lg px-2.5 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-zinc-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => { setShowEditTeamModal(false); setEditingTeam(null); }}
                  className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 font-semibold rounded-xl border border-zinc-300 dark:border-zinc-800 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-black font-black rounded-xl text-sm"
                >
                  Actualizar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
