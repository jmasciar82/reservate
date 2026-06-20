// js/api.js

const API_STORAGE_KEY = "worldcup_prode_api_matches";

const ProdeAPI = {
  _supabaseClient: null,

  // Obtiene o inicializa el cliente de Supabase dinámicamente
  getSupabaseClient() {
    if (this._supabaseClient) return this._supabaseClient;

    // Valores por defecto del proyecto (para conexión automática de todos los usuarios)
    const DEFAULT_URL = "https://serhuzweioduzrdlyywb.supabase.co";
    const DEFAULT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmh1endlaW9kdXpyZGx5eXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMyMTcsImV4cCI6MjA5NjAxOTIxN30.PkhLiXy3ELj2tQQoMORSOEJysgvQE8HU0hNJ_CK6Xzk"; // Aquí colocaremos la Anon Key del usuario

    let url = localStorage.getItem("worldcup_prode_supabase_url") || DEFAULT_URL;
    let key = localStorage.getItem("worldcup_prode_supabase_key") || DEFAULT_KEY;

    if (url && key && key !== "PEGA_TU_ANON_KEY_AQUI" && typeof supabase !== "undefined") {
      try {
        // Limpiar URL: eliminar /rest/v1 duplicado y barras finales
        url = url.trim();
        if (url.endsWith("/rest/v1/")) url = url.slice(0, -9);
        else if (url.endsWith("/rest/v1")) url = url.slice(0, -8);
        if (url.endsWith("/")) url = url.slice(0, -1);

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
        if (parsed && parsed.length > 0 && (parsed[0].teamA === "QA" || parsed[0].id === "g1" || !parsed.find(m => m.id === "ds1"))) {
          // Detectado fixture antiguo o sin 16avos. Reseteando a la nueva versión 2026 de 103 partidos...
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

    // Si hay discrepancia de fechas en la versión cacheada con WORLDCUP_MATCHES, actualizamos los campos estáticos
    try {
      const parsed = JSON.parse(saved);
      let isUpdated = false;
      const matchesMap = {};
      WORLDCUP_MATCHES.forEach(m => {
        matchesMap[m.id] = m;
      });

      const updatedParsed = parsed.map(m => {
        const fresh = matchesMap[m.id];
        if (fresh && fresh.date !== m.date) {
          isUpdated = true;
          return { ...m, date: fresh.date };
        }
        return m;
      });

      if (isUpdated) {
        localStorage.setItem(API_STORAGE_KEY, JSON.stringify(updatedParsed));
        return updatedParsed;
      }
      return parsed;
    } catch (e) {
      localStorage.setItem(API_STORAGE_KEY, JSON.stringify(WORLDCUP_MATCHES));
      return WORLDCUP_MATCHES;
    }
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
  }, // Sincroniza resultados reales desde la API open-source de worldcup2026
  async syncWithWorldCup2026API() {
    try {
      console.log("Iniciando sincronización con API real...");

      // Helper local para realizar fetch con reintentos y lidiar con la flakiness de la API/proxies
      const fetchWithRetry = async (url, retries = 3, delayMs = 1000) => {
        for (let i = 0; i < retries; i++) {
          try {
            const res = await fetch(url);
            if (res.ok) return res;
            if (res.status >= 500 || res.status === 408 || res.status === 429) {
              throw new Error(`HTTP ${res.status}`);
            }
            return res; // No reintentamos en errores 4xx del cliente
          } catch (e) {
            if (i === retries - 1) throw e;
            console.warn(`[INTENTO ${i + 1}/${retries}] Fallido para ${url}: ${e.message}. Reintentando en ${delayMs}ms...`);
            await new Promise(r => setTimeout(r, delayMs));
          }
        }
      };
      
      // Lista de proxies de respaldo para asegurar compatibilidad con diferentes orígenes (localhost y file://)
      const proxies = [
        url => url, // Consulta directa (CORS nativo soportado con Access-Control-Allow-Origin: *)
        url => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, // AllOrigins JSON (Estable, con caché)
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        url => `https://proxy.corsfix.com/?${url}`,
        url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`
      ];

      let apiTeams = null;
      let apiMatches = null;
      let fetchError = null;

      // Iterar sobre los proxies para intentar obtener los datos (los endpoints GET son públicos y no requieren auth)
      for (const getProxyUrl of proxies) {
        // Determinar el nombre del proxy para logging informativo
        const testUrl = getProxyUrl("TEST");
        const proxyName = testUrl === "TEST" ? "Conexión Directa" :
                          (testUrl.includes("allorigins.win/get") ? "AllOrigins (JSON)" :
                          (testUrl.includes("codetabs") ? "CodeTabs" :
                          (testUrl.includes("corsfix") ? "CORSFix" :
                          (testUrl.includes("corsproxy.io") ? "CorsProxy.io" : "Proxy CORS"))));

        try {
          console.log(`Intentando conectar usando: ${proxyName}`);
          
          // 1. Obtener equipos
          const teamsUrl = getProxyUrl("https://worldcup26.ir/get/teams");
          const teamsRes = await fetchWithRetry(teamsUrl, 3, 1000);
          if (!teamsRes.ok) throw new Error(`Fallo al obtener equipos (HTTP ${teamsRes.status})`);
          
          let teamsData = await teamsRes.json();
          // Desempaquetar respuesta si viene de un proxy que encapsula (como AllOrigins JSON)
          if (teamsData && typeof teamsData.contents === "string") {
            teamsData = JSON.parse(teamsData.contents);
          }
          apiTeams = teamsData.teams || teamsData;

          // 2. Obtener partidos
          const gamesUrl = getProxyUrl("https://worldcup26.ir/get/games");
          const gamesRes = await fetchWithRetry(gamesUrl, 3, 1000);
          if (!gamesRes.ok) throw new Error(`Fallo al obtener partidos (HTTP ${gamesRes.status})`);
          
          let gamesData = await gamesRes.json();
          // Desempaquetar respuesta si viene de un proxy que encapsula (como AllOrigins JSON)
          if (gamesData && typeof gamesData.contents === "string") {
            gamesData = JSON.parse(gamesData.contents);
          }
          apiMatches = gamesData.games || gamesData;

          if (apiTeams && apiMatches) {
            console.log(`Datos obtenidos exitosamente de la API usando: ${proxyName}`);
            
            // Agregar log de éxito en el panel si ProdeApp está disponible
            if (typeof ProdeApp !== "undefined" && ProdeApp.addAdminLog) {
              ProdeApp.addAdminLog(`Conexión exitosa a la API vía: ${proxyName}`);
            }
            
            fetchError = null;
            break; // Salió bien, rompemos el bucle
          }
        } catch (e) {
          const logMsg = `Fallo en sync vía ${proxyName}: ${e.message}`;
          console.warn(logMsg);
          
          // Agregar log informativo en el panel de administrador
          if (typeof ProdeApp !== "undefined" && ProdeApp.addAdminLog) {
            ProdeApp.addAdminLog(logMsg);
          }
          fetchError = e;
        }
      }

      if (fetchError || !apiTeams || !apiMatches) {
        throw new Error("No se pudo obtener datos de la API a través de ningún proxy disponible.");
      }

      // 3. Armar un mapa de ID -> Código FIFA (ej: 37 -> ARG)
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

      // 4. Obtener partidos locales del PRODE y sincronizar los finalizados
      const localMatches = await this.getMatches();
      let updatedCount = 0;

      for (const apiMatch of apiMatches) {
        if (apiMatch.finished === "TRUE") {
          const fifaA = teamIdToFifaCode[apiMatch.home_team_id];
          const fifaB = teamIdToFifaCode[apiMatch.away_team_id];
          
          const codeA = fifaToProdeCode[fifaA];
          const codeB = fifaToProdeCode[fifaB];

          // Buscar el partido en el fixture local para la fase correspondiente
          const getStageFromApiType = (type) => {
            switch (type) {
              case "group": return "Fase de Grupos";
              case "r32": return "Dieciseisavos de Final";
              case "r16": return "Octavos de Final";
              case "qf": return "Cuartos de Final";
              case "sf": return "Semifinales";
              case "final": return "Gran Final";
              default: return null;
            }
          };

          const targetStage = getStageFromApiType(apiMatch.type);
          if (!targetStage) continue;

          const localMatch = localMatches.find(m => 
            m.stage === targetStage &&
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
