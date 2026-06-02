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
  },  // Sincroniza resultados reales desde la API open-source de worldcup2026
  async syncWithWorldCup2026API() {
    try {
      console.log("Iniciando sincronización con API real...");
      const proxy = "https://corsproxy.io/?";
      const baseUrl = "https://worldcup26.ir";

      // 1. Autenticar para obtener Token (crea una cuenta del PRODE si es necesario)
      // La API requiere registro previo, por lo que usamos una cuenta fija del sistema
      const authRes = await fetch(`${proxy}${baseUrl}/auth/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "prode_system_sync@prode.com",
          password: "SecureSyncPassword2026!"
        })
      });

      let token = "";
      if (authRes.ok) {
        const authData = await authRes.json();
        token = authData.token;
      } else {
        // Si la cuenta no existe en la API externa, la registramos primero
        const regRes = await fetch(`${proxy}${baseUrl}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Prode Sync System",
            email: "prode_system_sync@prode.com",
            password: "SecureSyncPassword2026!"
          })
        });
        if (!regRes.ok) throw new Error("No se pudo autenticar ni registrar en la API");
        const regData = await regRes.json();
        token = regData.token;
      }

      // 2. Obtener Equipos para armar un mapa de ID -> Código FIFA (ej: 37 -> ARG)
      const teamsRes = await fetch(`${proxy}${baseUrl}/get/teams`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!teamsRes.ok) throw new Error("Error al obtener equipos de la API");
      const apiTeams = await teamsRes.json();
      
      const teamIdToFifaCode = {};
      apiTeams.forEach(t => {
        teamIdToFifaCode[t.id] = t.fifa_code;
      });

      // Mapa de traducción: Código FIFA (3 letras) -> Código del PRODE (2 letras)
      const fifaToProdeCode = {
        "MEX": "MX", "RSA": "ZA", "KOR": "KR", "CZE": "CZ",
        "CAN": "CA", "BIH": "BA", "QAT": "QA", "SUI": "CH",
        "BRA": "BR", "MAR": "MA", "HAI": "HT", "SCO": "SC",
        "USA": "US", "PAR": "PY", "AUS": "AU", "TUR": "TR",
        "GER": "DE", "CUW": "CW", "CIV": "CI", "ECU": "EC",
        "NED": "NL", "JPN": "JP", "SWE": "SE", "TUN": "TN",
        "BEL": "BE", "EGY": "EG", "IRN": "IR", "NZL": "NZ",
        "ESP": "ES", "CPV": "CV", "KSA": "SA", "URU": "UY",
        "FRA": "FR", "SEN": "SN", "IRQ": "IQ", "NOR": "NO",
        "AUT": "AT", "JOR": "JO", "ARG": "AR", "ALG": "DZ",
        "POR": "PT", "COD": "CD", "UZB": "UZ", "COL": "CO",
        "ENG": "EN", "CRO": "HR", "GHA": "GH", "PAN": "PA"
      };

      // 3. Obtener todos los partidos de la API
      const matchesRes = await fetch(`${proxy}${baseUrl}/get/games`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!matchesRes.ok) throw new Error("Error al obtener partidos de la API");
      const apiMatches = await matchesRes.json();

      // 4. Obtener partidos locales del PRODE y sincronizar los finalizados
      const localMatches = await this.getMatches();
      let updatedCount = 0;

      for (const apiMatch of apiMatches) {
        if (apiMatch.finished === "TRUE") {
          const fifaA = teamIdToFifaCode[apiMatch.home_team_id];
          const fifaB = teamIdToFifaCode[apiMatch.away_team_id];
          
          const codeA = fifaToProdeCode[fifaA];
          const codeB = fifaToProdeCode[fifaB];

          // Buscar el partido en el fixture local de fase de grupos
          const localMatch = localMatches.find(m => 
            m.stage === "Fase de Grupos" &&
            ((m.teamA === codeA && m.teamB === codeB) || (m.teamA === codeB && m.teamB === codeA))
          );

          if (localMatch && localMatch.status !== "FINALIZADO") {
            // Alinear goles según el orden de local/visitante
            const goalsA = localMatch.teamA === codeA ? apiMatch.home_score : apiMatch.away_score;
            const goalsB = localMatch.teamB === codeB ? apiMatch.away_score : apiMatch.home_score;

            // Actualizar resultado oficial del partido
            await this.updateMatchResult(localMatch.id, goalsA, goalsB);
            updatedCount++;
            console.log(`Sincronizado: ${localMatch.teamA} vs ${localMatch.teamB} (${goalsA}-${goalsB})`);
          }
        }
      }

      console.log(`Sincronización finalizada. Partidos actualizados: ${updatedCount}`);
      return updatedCount;
    } catch (e) {
      console.error("Error en la sincronización de la API:", e);
      return null;
    }
  }
};
