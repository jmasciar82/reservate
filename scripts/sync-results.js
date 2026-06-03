const fs = require('fs');
const vm = require('vm');
const path = require('path');

// 1. Validar variables de entorno
const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim() : null;
const SUPABASE_KEY = process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.trim() : null;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Error: SUPABASE_URL y SUPABASE_KEY son requeridos como variables de entorno.");
  process.exit(1);
}

// 2. Cargar WORLDCUP_MATCHES de js/data.js usando VM sandbox
const dataFilePath = path.join(__dirname, '..', 'prode', 'js', 'data.js');
let WORLDCUP_MATCHES = [];
try {
  let dataCode = fs.readFileSync(dataFilePath, 'utf8');
  // Reemplazar const/let con var para que se registren en el contexto de la VM
  dataCode = dataCode.replace(/\bconst\b/g, 'var').replace(/\blet\b/g, 'var');
  const context = {};
  vm.createContext(context);
  vm.runInContext(dataCode, context);
  WORLDCUP_MATCHES = context.WORLDCUP_MATCHES;
  console.log(`Cargados ${WORLDCUP_MATCHES.length} partidos locales de data.js.`);
} catch (e) {
  console.error("Error al leer/evaluar js/data.js:", e);
  process.exit(1);
}

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

// 3. Función auxiliar para realizar fetch robusto con fallback
async function fetchWithFallback(directUrl, proxyUrl) {
  try {
    console.log(`Intentando consulta directa a: ${directUrl}`);
    const res = await fetch(directUrl);
    if (res.ok) {
      return await res.json();
    }
    console.warn(`Respuesta no exitosa de la API directa (${res.status}). Probando con proxy...`);
  } catch (e) {
    console.warn(`Fallo al consultar la API directamente: ${e.message}. Probando con proxy...`);
  }

  // Fallback con proxy
  console.log(`Consultando a través del proxy: ${proxyUrl}`);
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`Fallo de conexión en el proxy CORS (${res.status})`);
  }
  return await res.json();
}

async function run() {
  try {
    // 4. Obtener equipos
    console.log("Obteniendo equipos...");
    const teamsData = await fetchWithFallback(
      "https://worldcup26.ir/get/teams",
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent("https://worldcup26.ir/get/teams")}`
    );
    const apiTeams = teamsData.teams || teamsData;

    // 5. Obtener partidos
    console.log("Obteniendo partidos...");
    const gamesData = await fetchWithFallback(
      "https://worldcup26.ir/get/games",
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent("https://worldcup26.ir/get/games")}`
    );
    const apiMatches = gamesData.games || gamesData;

    // Map de ID -> FIFA Code
    const teamIdToFifaCode = {};
    apiTeams.forEach(t => {
      teamIdToFifaCode[t.id] = t.fifa_code;
    });

    // 6. Obtener partidos actuales en Supabase
    console.log("Consultando partidos actuales en Supabase...");
    const supabaseRes = await fetch(`${SUPABASE_URL}/rest/v1/prode_matches?select=*`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!supabaseRes.ok) {
      throw new Error(`Error al leer partidos de Supabase: ${supabaseRes.status} ${supabaseRes.statusText}`);
    }

    const dbMatches = await supabaseRes.json();
    const dbMatchesMap = {};
    dbMatches.forEach(m => {
      dbMatchesMap[m.id] = m;
    });

    console.log(`Encontrados ${dbMatches.length} partidos registrados en Supabase.`);

    // 7. Comparar y preparar lote de actualización
    const batchUpdates = [];
    let processedCount = 0;

    for (const apiMatch of apiMatches) {
      if (apiMatch.finished === "TRUE") {
        const fifaA = teamIdToFifaCode[apiMatch.home_team_id];
        const fifaB = teamIdToFifaCode[apiMatch.away_team_id];
        
        const codeA = fifaToProdeCode[fifaA];
        const codeB = fifaToProdeCode[fifaB];

        // Buscar partido en WORLDCUP_MATCHES local (grupos)
        const localMatch = WORLDCUP_MATCHES.find(m => 
          m.stage === "Fase de Grupos" &&
          ((m.teamA === codeA && m.teamB === codeB) || (m.teamA === codeB && m.teamB === codeA))
        );

        if (localMatch) {
          const goalsA = localMatch.teamA === codeA ? parseInt(apiMatch.home_score) : parseInt(apiMatch.away_score);
          const goalsB = localMatch.teamB === codeB ? parseInt(apiMatch.away_score) : parseInt(apiMatch.home_score);

          const dbMatch = dbMatchesMap[localMatch.id];
          const isPendingInDb = !dbMatch || dbMatch.status !== "FINALIZADO";
          const hasDifferentScores = dbMatch && (dbMatch.goals_a !== goalsA || dbMatch.goals_b !== goalsB);

          if (isPendingInDb || hasDifferentScores) {
            batchUpdates.push({
              id: localMatch.id,
              status: "FINALIZADO",
              goals_a: goalsA,
              goals_b: goalsB,
              team_a: localMatch.teamA,
              team_b: localMatch.teamB,
              updated_at: new Date().toISOString()
            });
            console.log(`[LOTE] ${localMatch.teamA} vs ${localMatch.teamB} (${goalsA}-${goalsB})`);
          }
          processedCount++;
        }
      }
    }

    // 8. Enviar actualizaciones a Supabase
    if (batchUpdates.length > 0) {
      console.log(`Enviando actualización de ${batchUpdates.length} partidos a Supabase...`);
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/prode_matches`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(batchUpdates)
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        throw new Error(`Error en el upsert de Supabase: ${updateRes.status} - ${errText}`);
      }

      console.log("¡Sincronización de lote exitosa!");
    } else {
      console.log("No se encontraron nuevos partidos finalizados para actualizar.");
    }

    console.log(`Proceso terminado. Partidos analizados de la API: ${processedCount}. Partidos modificados: ${batchUpdates.length}`);

  } catch (e) {
    console.error("Fallo durante la sincronización automática:", e);
    process.exit(1);
  }
}

run();
