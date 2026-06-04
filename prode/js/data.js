// js/data.js

const WORLDCUP_TEAMS = {
  // GRUPO A
  MX: { name: "México", flag: "https://flagcdn.com/mx.svg" },
  ZA: { name: "Sudáfrica", flag: "https://flagcdn.com/za.svg" },
  KR: { name: "Corea del Sur", flag: "https://flagcdn.com/kr.svg" },
  CZ: { name: "República Checa", flag: "https://flagcdn.com/cz.svg" },
  // GRUPO B
  CA: { name: "Canadá", flag: "https://flagcdn.com/ca.svg" },
  BA: { name: "Bosnia", flag: "https://flagcdn.com/ba.svg" },
  QA: { name: "Qatar", flag: "https://flagcdn.com/qa.svg" },
  CH: { name: "Suiza", flag: "https://flagcdn.com/ch.svg" },
  // GRUPO C
  BR: { name: "Brasil", flag: "https://flagcdn.com/br.svg" },
  MA: { name: "Marruecos", flag: "https://flagcdn.com/ma.svg" },
  HT: { name: "Haití", flag: "https://flagcdn.com/ht.svg" },
  SC: { name: "Escocia", flag: "https://flagcdn.com/gb-sct.svg" },
  // GRUPO D
  US: { name: "Estados Unidos", flag: "https://flagcdn.com/us.svg" },
  PY: { name: "Paraguay", flag: "https://flagcdn.com/py.svg" },
  AU: { name: "Australia", flag: "https://flagcdn.com/au.svg" },
  TR: { name: "Turquía", flag: "https://flagcdn.com/tr.svg" },
  // GRUPO E
  DE: { name: "Alemania", flag: "https://flagcdn.com/de.svg" },
  CW: { name: "Curazao", flag: "https://flagcdn.com/cw.svg" },
  CI: { name: "Costa de Marfil", flag: "https://flagcdn.com/ci.svg" },
  EC: { name: "Ecuador", flag: "https://flagcdn.com/ec.svg" },
  // GRUPO F
  NL: { name: "Países Bajos", flag: "https://flagcdn.com/nl.svg" },
  JP: { name: "Japón", flag: "https://flagcdn.com/jp.svg" },
  SE: { name: "Suecia", flag: "https://flagcdn.com/se.svg" },
  TN: { name: "Túnez", flag: "https://flagcdn.com/tn.svg" },
  // GRUPO G
  BE: { name: "Bélgica", flag: "https://flagcdn.com/be.svg" },
  EG: { name: "Egipto", flag: "https://flagcdn.com/eg.svg" },
  IR: { name: "Irán", flag: "https://flagcdn.com/ir.svg" },
  NZ: { name: "Nueva Zelanda", flag: "https://flagcdn.com/nz.svg" },
  // GRUPO H
  ES: { name: "España", flag: "https://flagcdn.com/es.svg" },
  CV: { name: "Cabo Verde", flag: "https://flagcdn.com/cv.svg" },
  SA: { name: "Arabia Saudita", flag: "https://flagcdn.com/sa.svg" },
  UY: { name: "Uruguay", flag: "https://flagcdn.com/uy.svg" },
  // GRUPO I
  FR: { name: "Francia", flag: "https://flagcdn.com/fr.svg" },
  SN: { name: "Senegal", flag: "https://flagcdn.com/sn.svg" },
  IQ: { name: "Irak", flag: "https://flagcdn.com/iq.svg" },
  NO: { name: "Noruega", flag: "https://flagcdn.com/no.svg" },
  // GRUPO J
  AT: { name: "Austria", flag: "https://flagcdn.com/at.svg" },
  JO: { name: "Jordania", flag: "https://flagcdn.com/jo.svg" },
  AR: { name: "Argentina", flag: "https://flagcdn.com/ar.svg" },
  DZ: { name: "Argelia", flag: "https://flagcdn.com/dz.svg" },
  // GRUPO K
  PT: { name: "Portugal", flag: "https://flagcdn.com/pt.svg" },
  CD: { name: "RD Congo", flag: "https://flagcdn.com/cd.svg" },
  UZ: { name: "Uzbekistán", flag: "https://flagcdn.com/uz.svg" },
  CO: { name: "Colombia", flag: "https://flagcdn.com/co.svg" },
  // GRUPO L
  EN: { name: "Inglaterra", flag: "https://flagcdn.com/gb-eng.svg" },
  HR: { name: "Croacia", flag: "https://flagcdn.com/hr.svg" },
  GH: { name: "Ghana", flag: "https://flagcdn.com/gh.svg" },
  PA: { name: "Panamá", flag: "https://flagcdn.com/pa.svg" },

  // ==================== MARCADORES DE POSICIÓN PARA FASE ELIMINATORIA ====================

  // 1° y 2° de cada grupo
  "1A": { name: "1° Grupo A", flag: "https://flagcdn.com/un.svg" },
  "2A": { name: "2° Grupo A", flag: "https://flagcdn.com/un.svg" },
  "1B": { name: "1° Grupo B", flag: "https://flagcdn.com/un.svg" },
  "2B": { name: "2° Grupo B", flag: "https://flagcdn.com/un.svg" },
  "1C": { name: "1° Grupo C", flag: "https://flagcdn.com/un.svg" },
  "2C": { name: "2° Grupo C", flag: "https://flagcdn.com/un.svg" },
  "1D": { name: "1° Grupo D", flag: "https://flagcdn.com/un.svg" },
  "2D": { name: "2° Grupo D", flag: "https://flagcdn.com/un.svg" },
  "1E": { name: "1° Grupo E", flag: "https://flagcdn.com/un.svg" },
  "2E": { name: "2° Grupo E", flag: "https://flagcdn.com/un.svg" },
  "1F": { name: "1° Grupo F", flag: "https://flagcdn.com/un.svg" },
  "2F": { name: "2° Grupo F", flag: "https://flagcdn.com/un.svg" },
  "1G": { name: "1° Grupo G", flag: "https://flagcdn.com/un.svg" },
  "2G": { name: "2° Grupo G", flag: "https://flagcdn.com/un.svg" },
  "1H": { name: "1° Grupo H", flag: "https://flagcdn.com/un.svg" },
  "2H": { name: "2° Grupo H", flag: "https://flagcdn.com/un.svg" },
  "1I": { name: "1° Grupo I", flag: "https://flagcdn.com/un.svg" },
  "2I": { name: "2° Grupo I", flag: "https://flagcdn.com/un.svg" },
  "1J": { name: "1° Grupo J", flag: "https://flagcdn.com/un.svg" },
  "2J": { name: "2° Grupo J", flag: "https://flagcdn.com/un.svg" },
  "1K": { name: "1° Grupo K", flag: "https://flagcdn.com/un.svg" },
  "2K": { name: "2° Grupo K", flag: "https://flagcdn.com/un.svg" },
  "1L": { name: "1° Grupo L", flag: "https://flagcdn.com/un.svg" },
  "2L": { name: "2° Grupo L", flag: "https://flagcdn.com/un.svg" },

  // Mejores 3° clasificados (8 de 12 grupos avanzan)
  "3_P1": { name: "3° Mejor 1", flag: "https://flagcdn.com/un.svg" },
  "3_P2": { name: "3° Mejor 2", flag: "https://flagcdn.com/un.svg" },
  "3_P3": { name: "3° Mejor 3", flag: "https://flagcdn.com/un.svg" },
  "3_P4": { name: "3° Mejor 4", flag: "https://flagcdn.com/un.svg" },
  "3_P5": { name: "3° Mejor 5", flag: "https://flagcdn.com/un.svg" },
  "3_P6": { name: "3° Mejor 6", flag: "https://flagcdn.com/un.svg" },
  "3_P7": { name: "3° Mejor 7", flag: "https://flagcdn.com/un.svg" },
  "3_P8": { name: "3° Mejor 8", flag: "https://flagcdn.com/un.svg" },

  // Ganadores de Dieciseisavos de Final (16avos)
  W_DS1:  { name: "Gan. 16avos 1",  flag: "https://flagcdn.com/un.svg" },
  W_DS2:  { name: "Gan. 16avos 2",  flag: "https://flagcdn.com/un.svg" },
  W_DS3:  { name: "Gan. 16avos 3",  flag: "https://flagcdn.com/un.svg" },
  W_DS4:  { name: "Gan. 16avos 4",  flag: "https://flagcdn.com/un.svg" },
  W_DS5:  { name: "Gan. 16avos 5",  flag: "https://flagcdn.com/un.svg" },
  W_DS6:  { name: "Gan. 16avos 6",  flag: "https://flagcdn.com/un.svg" },
  W_DS7:  { name: "Gan. 16avos 7",  flag: "https://flagcdn.com/un.svg" },
  W_DS8:  { name: "Gan. 16avos 8",  flag: "https://flagcdn.com/un.svg" },
  W_DS9:  { name: "Gan. 16avos 9",  flag: "https://flagcdn.com/un.svg" },
  W_DS10: { name: "Gan. 16avos 10", flag: "https://flagcdn.com/un.svg" },
  W_DS11: { name: "Gan. 16avos 11", flag: "https://flagcdn.com/un.svg" },
  W_DS12: { name: "Gan. 16avos 12", flag: "https://flagcdn.com/un.svg" },
  W_DS13: { name: "Gan. 16avos 13", flag: "https://flagcdn.com/un.svg" },
  W_DS14: { name: "Gan. 16avos 14", flag: "https://flagcdn.com/un.svg" },
  W_DS15: { name: "Gan. 16avos 15", flag: "https://flagcdn.com/un.svg" },
  W_DS16: { name: "Gan. 16avos 16", flag: "https://flagcdn.com/un.svg" },

  // Ganadores de Octavos de Final
  W_O1: { name: "Gan. Octavos 1", flag: "https://flagcdn.com/un.svg" },
  W_O2: { name: "Gan. Octavos 2", flag: "https://flagcdn.com/un.svg" },
  W_O3: { name: "Gan. Octavos 3", flag: "https://flagcdn.com/un.svg" },
  W_O4: { name: "Gan. Octavos 4", flag: "https://flagcdn.com/un.svg" },
  W_O5: { name: "Gan. Octavos 5", flag: "https://flagcdn.com/un.svg" },
  W_O6: { name: "Gan. Octavos 6", flag: "https://flagcdn.com/un.svg" },
  W_O7: { name: "Gan. Octavos 7", flag: "https://flagcdn.com/un.svg" },
  W_O8: { name: "Gan. Octavos 8", flag: "https://flagcdn.com/un.svg" },

  // Ganadores de Cuartos de Final
  W_C1: { name: "Gan. Cuartos 1", flag: "https://flagcdn.com/un.svg" },
  W_C2: { name: "Gan. Cuartos 2", flag: "https://flagcdn.com/un.svg" },
  W_C3: { name: "Gan. Cuartos 3", flag: "https://flagcdn.com/un.svg" },
  W_C4: { name: "Gan. Cuartos 4", flag: "https://flagcdn.com/un.svg" },

  // Ganadores de Semifinales
  W_S1: { name: "Gan. Semifinal 1", flag: "https://flagcdn.com/un.svg" },
  W_S2: { name: "Gan. Semifinal 2", flag: "https://flagcdn.com/un.svg" }
};

const WORLDCUP_MATCHES = [
  // ==================== GRUPO A ====================
  { id: "a1", stage: "Fase de Grupos", group: "Grupo A", teamA: "MX", teamB: "ZA", date: "2026-06-11T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "a2", stage: "Fase de Grupos", group: "Grupo A", teamA: "KR", teamB: "CZ", date: "2026-06-11T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "a3", stage: "Fase de Grupos", group: "Grupo A", teamA: "CZ", teamB: "ZA", date: "2026-06-18T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "a4", stage: "Fase de Grupos", group: "Grupo A", teamA: "MX", teamB: "KR", date: "2026-06-18T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "a5", stage: "Fase de Grupos", group: "Grupo A", teamA: "CZ", teamB: "MX", date: "2026-06-24T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "a6", stage: "Fase de Grupos", group: "Grupo A", teamA: "ZA", teamB: "KR", date: "2026-06-24T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO B ====================
  { id: "b1", stage: "Fase de Grupos", group: "Grupo B", teamA: "CA", teamB: "BA", date: "2026-06-12T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "b2", stage: "Fase de Grupos", group: "Grupo B", teamA: "QA", teamB: "CH", date: "2026-06-13T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "b3", stage: "Fase de Grupos", group: "Grupo B", teamA: "CH", teamB: "BA", date: "2026-06-18T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "b4", stage: "Fase de Grupos", group: "Grupo B", teamA: "CA", teamB: "QA", date: "2026-06-18T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "b5", stage: "Fase de Grupos", group: "Grupo B", teamA: "CH", teamB: "CA", date: "2026-06-24T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "b6", stage: "Fase de Grupos", group: "Grupo B", teamA: "BA", teamB: "QA", date: "2026-06-24T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO C ====================
  { id: "c1", stage: "Fase de Grupos", group: "Grupo C", teamA: "BR", teamB: "MA", date: "2026-06-13T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "c2", stage: "Fase de Grupos", group: "Grupo C", teamA: "HT", teamB: "SC", date: "2026-06-13T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "c3", stage: "Fase de Grupos", group: "Grupo C", teamA: "SC", teamB: "MA", date: "2026-06-19T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "c4", stage: "Fase de Grupos", group: "Grupo C", teamA: "BR", teamB: "HT", date: "2026-06-19T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "c5", stage: "Fase de Grupos", group: "Grupo C", teamA: "SC", teamB: "BR", date: "2026-06-24T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "c6", stage: "Fase de Grupos", group: "Grupo C", teamA: "MA", teamB: "HT", date: "2026-06-24T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO D ====================
  { id: "d1", stage: "Fase de Grupos", group: "Grupo D", teamA: "US", teamB: "PY", date: "2026-06-12T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "d2", stage: "Fase de Grupos", group: "Grupo D", teamA: "AU", teamB: "TR", date: "2026-06-13T01:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "d3", stage: "Fase de Grupos", group: "Grupo D", teamA: "TR", teamB: "PY", date: "2026-06-19T01:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "d4", stage: "Fase de Grupos", group: "Grupo D", teamA: "US", teamB: "AU", date: "2026-06-19T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "d5", stage: "Fase de Grupos", group: "Grupo D", teamA: "TR", teamB: "US", date: "2026-06-25T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "d6", stage: "Fase de Grupos", group: "Grupo D", teamA: "PY", teamB: "AU", date: "2026-06-25T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO E ====================
  { id: "e1", stage: "Fase de Grupos", group: "Grupo E", teamA: "DE", teamB: "CW", date: "2026-06-14T14:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "e2", stage: "Fase de Grupos", group: "Grupo E", teamA: "CI", teamB: "EC", date: "2026-06-14T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "e3", stage: "Fase de Grupos", group: "Grupo E", teamA: "DE", teamB: "CI", date: "2026-06-20T17:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "e4", stage: "Fase de Grupos", group: "Grupo E", teamA: "CW", teamB: "EC", date: "2026-06-20T21:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "e5", stage: "Fase de Grupos", group: "Grupo E", teamA: "EC", teamB: "DE", date: "2026-06-25T17:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "e6", stage: "Fase de Grupos", group: "Grupo E", teamA: "CW", teamB: "CI", date: "2026-06-25T17:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO F ====================
  { id: "f1", stage: "Fase de Grupos", group: "Grupo F", teamA: "NL", teamB: "JP", date: "2026-06-14T17:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "f2", stage: "Fase de Grupos", group: "Grupo F", teamA: "SE", teamB: "TN", date: "2026-06-14T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "f3", stage: "Fase de Grupos", group: "Grupo F", teamA: "JP", teamB: "TN", date: "2026-06-20T01:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "f4", stage: "Fase de Grupos", group: "Grupo F", teamA: "NL", teamB: "SE", date: "2026-06-20T14:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "f5", stage: "Fase de Grupos", group: "Grupo F", teamA: "TN", teamB: "NL", date: "2026-06-25T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "f6", stage: "Fase de Grupos", group: "Grupo F", teamA: "JP", teamB: "SE", date: "2026-06-25T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO G ====================
  { id: "g1_match", stage: "Fase de Grupos", group: "Grupo G", teamA: "BE", teamB: "EG", date: "2026-06-15T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "g2_match", stage: "Fase de Grupos", group: "Grupo G", teamA: "IR", teamB: "NZ", date: "2026-06-15T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "g3_match", stage: "Fase de Grupos", group: "Grupo G", teamA: "BE", teamB: "IR", date: "2026-06-21T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "g4_match", stage: "Fase de Grupos", group: "Grupo G", teamA: "EG", teamB: "NZ", date: "2026-06-21T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "g5_match", stage: "Fase de Grupos", group: "Grupo G", teamA: "NZ", teamB: "BE", date: "2026-06-27T00:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "g6_match", stage: "Fase de Grupos", group: "Grupo G", teamA: "EG", teamB: "IR", date: "2026-06-27T00:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO H ====================
  { id: "h1", stage: "Fase de Grupos", group: "Grupo H", teamA: "ES", teamB: "CV", date: "2026-06-15T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "h2", stage: "Fase de Grupos", group: "Grupo H", teamA: "SA", teamB: "UY", date: "2026-06-15T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "h3", stage: "Fase de Grupos", group: "Grupo H", teamA: "ES", teamB: "SA", date: "2026-06-21T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "h4", stage: "Fase de Grupos", group: "Grupo H", teamA: "CV", teamB: "UY", date: "2026-06-21T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "h5", stage: "Fase de Grupos", group: "Grupo H", teamA: "UY", teamB: "ES", date: "2026-06-26T21:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "h6", stage: "Fase de Grupos", group: "Grupo H", teamA: "CV", teamB: "SA", date: "2026-06-26T21:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO I ====================
  { id: "i1", stage: "Fase de Grupos", group: "Grupo I", teamA: "FR", teamB: "SN", date: "2026-06-16T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "i2", stage: "Fase de Grupos", group: "Grupo I", teamA: "IQ", teamB: "NO", date: "2026-06-16T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "i3", stage: "Fase de Grupos", group: "Grupo I", teamA: "FR", teamB: "IQ", date: "2026-06-22T18:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "i4", stage: "Fase de Grupos", group: "Grupo I", teamA: "NO", teamB: "SN", date: "2026-06-22T21:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "i5", stage: "Fase de Grupos", group: "Grupo I", teamA: "NO", teamB: "FR", date: "2026-06-26T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "i6", stage: "Fase de Grupos", group: "Grupo I", teamA: "SN", teamB: "IQ", date: "2026-06-26T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO J ====================
  { id: "j1", stage: "Fase de Grupos", group: "Grupo J", teamA: "AT", teamB: "JO", date: "2026-06-16T01:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "j2", stage: "Fase de Grupos", group: "Grupo J", teamA: "AR", teamB: "DZ", date: "2026-06-16T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "j3", stage: "Fase de Grupos", group: "Grupo J", teamA: "AR", teamB: "AT", date: "2026-06-22T14:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "j4", stage: "Fase de Grupos", group: "Grupo J", teamA: "JO", teamB: "DZ", date: "2026-06-23T00:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "j5", stage: "Fase de Grupos", group: "Grupo J", teamA: "JO", teamB: "AR", date: "2026-06-27T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "j6", stage: "Fase de Grupos", group: "Grupo J", teamA: "DZ", teamB: "AT", date: "2026-06-27T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO K ====================
  { id: "k1", stage: "Fase de Grupos", group: "Grupo K", teamA: "PT", teamB: "CD", date: "2026-06-17T14:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "k2", stage: "Fase de Grupos", group: "Grupo K", teamA: "UZ", teamB: "CO", date: "2026-06-17T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "k3", stage: "Fase de Grupos", group: "Grupo K", teamA: "PT", teamB: "UZ", date: "2026-06-23T14:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "k4", stage: "Fase de Grupos", group: "Grupo K", teamA: "CD", teamB: "CO", date: "2026-06-23T23:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "k5", stage: "Fase de Grupos", group: "Grupo K", teamA: "CO", teamB: "PT", date: "2026-06-27T20:30:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "k6", stage: "Fase de Grupos", group: "Grupo K", teamA: "CD", teamB: "UZ", date: "2026-06-27T20:30:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // ==================== GRUPO L ====================
  { id: "l1", stage: "Fase de Grupos", group: "Grupo L", teamA: "EN", teamB: "HR", date: "2026-06-17T17:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "l2", stage: "Fase de Grupos", group: "Grupo L", teamA: "GH", teamB: "PA", date: "2026-06-17T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "l3", stage: "Fase de Grupos", group: "Grupo L", teamA: "EN", teamB: "GH", date: "2026-06-23T17:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "l4", stage: "Fase de Grupos", group: "Grupo L", teamA: "HR", teamB: "PA", date: "2026-06-23T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "l5", stage: "Fase de Grupos", group: "Grupo L", teamA: "PA", teamB: "EN", date: "2026-06-27T18:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "l6", stage: "Fase de Grupos", group: "Grupo L", teamA: "HR", teamB: "GH", date: "2026-06-27T18:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },


  // ==================== FASES ELIMINATORIAS (FORMATO 48 EQUIPOS) ====================

  // DIECISEISAVOS DE FINAL (16avos) — 16 PARTIDOS — Jun 28 a Jul 1
  { id: "ds1",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1A",   teamB: "3_P1", date: "2026-06-28T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds2",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1B",   teamB: "3_P2", date: "2026-06-28T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds3",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1C",   teamB: "3_P3", date: "2026-06-28T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds4",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1D",   teamB: "3_P4", date: "2026-06-28T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds5",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1E",   teamB: "3_P5", date: "2026-06-29T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds6",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1F",   teamB: "3_P6", date: "2026-06-29T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds7",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1G",   teamB: "3_P7", date: "2026-06-29T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds8",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1H",   teamB: "3_P8", date: "2026-06-29T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds9",  stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1I",   teamB: "2L",   date: "2026-06-30T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds10", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1J",   teamB: "2K",   date: "2026-06-30T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds11", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1K",   teamB: "2J",   date: "2026-06-30T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds12", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "1L",   teamB: "2I",   date: "2026-06-30T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds13", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "2A",   teamB: "2H",   date: "2026-07-01T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds14", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "2B",   teamB: "2G",   date: "2026-07-01T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds15", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "2C",   teamB: "2F",   date: "2026-07-01T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "ds16", stage: "Dieciseisavos de Final", group: "Eliminatoria", teamA: "2D",   teamB: "2E",   date: "2026-07-01T22:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // OCTAVOS DE FINAL — 8 PARTIDOS — Jul 4 a Jul 6
  { id: "o1", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS1",  teamB: "W_DS2",  date: "2026-07-04T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o2", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS3",  teamB: "W_DS4",  date: "2026-07-04T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o3", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS5",  teamB: "W_DS6",  date: "2026-07-05T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o4", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS7",  teamB: "W_DS8",  date: "2026-07-05T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o5", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS9",  teamB: "W_DS10", date: "2026-07-05T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o6", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS11", teamB: "W_DS12", date: "2026-07-06T13:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o7", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS13", teamB: "W_DS14", date: "2026-07-06T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "o8", stage: "Octavos de Final", group: "Eliminatoria", teamA: "W_DS15", teamB: "W_DS16", date: "2026-07-06T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // CUARTOS DE FINAL — 4 PARTIDOS — Jul 9 a Jul 10
  { id: "cf1", stage: "Cuartos de Final", group: "Eliminatoria", teamA: "W_O1", teamB: "W_O2", date: "2026-07-09T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "cf2", stage: "Cuartos de Final", group: "Eliminatoria", teamA: "W_O3", teamB: "W_O4", date: "2026-07-09T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "cf3", stage: "Cuartos de Final", group: "Eliminatoria", teamA: "W_O5", teamB: "W_O6", date: "2026-07-10T16:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "cf4", stage: "Cuartos de Final", group: "Eliminatoria", teamA: "W_O7", teamB: "W_O8", date: "2026-07-10T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // SEMIFINALES — 2 PARTIDOS — Jul 14 a Jul 15
  { id: "s1", stage: "Semifinales", group: "Eliminatoria", teamA: "W_C1", teamB: "W_C2", date: "2026-07-14T19:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },
  { id: "s2", stage: "Semifinales", group: "Eliminatoria", teamA: "W_C3", teamB: "W_C4", date: "2026-07-15T20:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } },

  // GRAN FINAL — Jul 19
  { id: "fn1", stage: "Gran Final", group: "Copa del Mundo", teamA: "W_S1", teamB: "W_S2", date: "2026-07-19T18:00:00-03:00", status: "PENDIENTE", result: { goalsA: null, goalsB: null } }
];
