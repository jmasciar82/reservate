// js/api.js

const API_STORAGE_KEY = "worldcup_prode_api_matches";

const ProdeAPI = {
  _supabaseClient: null,

  // Obtiene o inicializa el cliente de Supabase dinámicamente
  getSupabaseClient() {
    if (this._supabaseClient) return this._supabaseClient;
    const url = localStorage.getItem("worldcup_prode_supabase_url");
    const key = localStorage.getItem("worldcup_prode_supabase_key");
    if (url && key && typeof supabase !== "undefined") {
      try {
        this._supabaseClient = supabase.createClient(url, key);
        return this._supabaseClient;
      } catch (e) {
        console.error("Error al inicializar cliente Supabase:", e);
      }
    }
    return null;
  },

  // Inicializa los partidos en LocalStorage si no existen.
  initMatches() {
    let saved = localStorage.getItem(API_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0 && (parsed[0].teamA === "QA" || parsed[0].id === "g1")) {
          // Detectado fixture antiguo. Reseteando a la nueva versión 2026 de 72 partidos...
          localStorage.removeItem(API_STORAGE_KEY);
          localStorage.removeItem("worldcup_prode_users"); // Reset bots also to get new predictions
          saved = null;
        }
      } catch (e) {
        localStorage.removeItem(API_STORAGE_KEY);
        saved = null;
      }
    }

    if (!saved) {
      localStorage.setItem(API_STORAGE_KEY, JSON.stringify(WORLDCUP_MATCHES));
      return WORLDCUP_MATCHES;
    }
    return JSON.parse(saved);
  },

  // Obtiene la lista actual de partidos (resultados reales oficiales).
  async getMatches() {
    const sb = this.getSupabaseClient();
    let localMatches = this.initMatches();

    if (sb) {
      try {
        const { data, error } = await sb.from("prode_matches").select("*");
        if (error) throw error;

        if (data && data.length > 0) {
          const dbMatchesMap = {};
          data.forEach(row => {
            dbMatchesMap[row.id] = row;
          });

          localMatches = localMatches.map(m => {
            const dbMatch = dbMatchesMap[m.id];
            if (dbMatch) {
              return {
                ...m,
                status: dbMatch.status || m.status,
                teamA: dbMatch.team_a || m.teamA,
                teamB: dbMatch.team_b || m.teamB,
                result: {
                  goalsA: dbMatch.goals_a !== null && dbMatch.goals_a !== undefined ? dbMatch.goals_a : m.result.goalsA,
                  goalsB: dbMatch.goals_b !== null && dbMatch.goals_b !== undefined ? dbMatch.goals_b : m.result.goalsB
                }
              };
            }
            return m;
          });

          // Guardar en caché local
          localStorage.setItem(API_STORAGE_KEY, JSON.stringify(localMatches));
        }
      } catch (e) {
        console.error("Error al sincronizar partidos con Supabase:", e);
      }
    }

    return localMatches;
  },

  // Guarda la lista de partidos actualizada (usado por el panel de administración/simulación local)
  saveMatches(matches) {
    localStorage.setItem(API_STORAGE_KEY, JSON.stringify(matches));
    window.dispatchEvent(new CustomEvent("prode_api_update", { detail: matches }));
  },

  // Simula la finalización de un partido ingresando sus resultados oficiales
  async updateMatchResult(matchId, goalsA, goalsB) {
    let matches = await this.getMatches();
    let match = matches.find(m => m.id === matchId);
    if (!match) throw new Error("Partido no encontrado");

    match.status = "FINALIZADO";
    match.result.goalsA = parseInt(goalsA);
    match.result.goalsB = parseInt(goalsB);
    this.saveMatches(matches);

    const sb = this.getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb.from("prode_matches").upsert({
          id: matchId,
          status: "FINALIZADO",
          goals_a: parseInt(goalsA),
          goals_b: parseInt(goalsB),
          team_a: match.teamA,
          team_b: match.teamB,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      } catch (e) {
        console.error("Error al actualizar partido en Supabase:", e);
      }
    }

    return match;
  },

  // Resetea todos los resultados reales a PENDIENTE (útil para reiniciar pruebas)
  async resetAllResults() {
    localStorage.removeItem(API_STORAGE_KEY);
    const sb = this.getSupabaseClient();
    if (sb) {
      try {
        // En Supabase, para reiniciar, podemos eliminar las filas
        const { error } = await sb.from("prode_matches").delete().neq("id", "");
        if (error) throw error;
      } catch (e) {
        console.error("Error al reiniciar partidos en Supabase:", e);
      }
    }
    return this.initMatches();
  },

  // FUNCIÓN PREPARADA PARA PRODUCCIÓN (Integración con API real)
  async fetchLiveResults(apiKey = "") {
    if (!apiKey) {
      console.warn("Se requiere una API Key para consultar resultados reales en vivo.");
      return null;
    }
    
    try {
      const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
        headers: { "X-Auth-Token": apiKey }
      });
      
      if (!response.ok) throw new Error("Error consultando la API externa");
      
      const data = await response.json();
      
      const updatedMatches = data.matches.map(realMatch => {
        return {
          id: `real_${realMatch.id}`,
          stage: realMatch.stage,
          teamA: realMatch.homeTeam.tla,
          teamB: realMatch.awayTeam.tla,
          status: realMatch.status === "FINISHED" ? "FINALIZADO" : "PENDIENTE",
          result: {
            goalsA: realMatch.score.fullTime.home,
            goalsB: realMatch.score.fullTime.away
          }
        };
      });
      
      return updatedMatches;
    } catch (error) {
      console.error("Error obteniendo resultados en vivo:", error);
      return null;
    }
  }
};
