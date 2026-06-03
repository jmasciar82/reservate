// js/engine.js

const USER_STORAGE_KEY = "worldcup_prode_users";
const ACTIVE_USER_KEY = "worldcup_prode_active_email";
const SIMULATED_TIME_KEY = "worldcup_prode_simulated_time";

const ProdeEngine = {
  _activeUserCache: null,

  // Determina si un correo electrónico pertenece a un administrador
  isAdmin(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    
    // Lista de correos administradores explícitos
    const adminList = [
      "scaloni.dt@afa.com.ar",
      "antigravity.bot@deepmind.com",
      "admin@admin.com"
    ];
    
    // Es admin si está en la lista o si el correo contiene la palabra "admin"
    return adminList.includes(cleanEmail) || cleanEmail.includes("admin");
  },

  // Inicializa usuarios y crea competidores simulados
  initUsers() {
    let saved = localStorage.getItem(USER_STORAGE_KEY);
    if (!saved) {
      const mockCompetitors = this.generateMockCompetitors();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockCompetitors));
      return mockCompetitors;
    }
    return JSON.parse(saved);
  },

  // Genera contrincantes ficticios con predicciones aleatorias pero coherentes
  generateMockCompetitors() {
    const names = [
      { email: "antigravity.bot@deepmind.com", name: "Antigravity AI (Bot)" },
      { email: "scaloni.dt@afa.com.ar", name: "Lionel Scaloneta" },
      { email: "dibu.martinez@villaalbertina.com", name: "El Dibu Atajador" },
      { email: "la.boti.futbol@charlas.net", name: "Boti Futbolero" },
      { email: "messi10.fan@rosario.gov.ar", name: "La Pulga Fans" }
    ];

    const competitors = {};

    names.forEach((comp, index) => {
      competitors[comp.email] = {
        email: comp.email,
        name: comp.name,
        paid: true, // Todos los competidores simulados ya pagaron sus $1000
        paymentDate: new Date(Date.now() - (index + 1) * 3600000).toISOString(),
        predictions: this.generateRandomPredictions()
      };
    });

    return competitors;
  },

  // Genera predicciones aleatorias de 0 a 3 goles para los partidos definidos
  generateRandomPredictions() {
    const predictions = {};
    WORLDCUP_MATCHES.forEach(match => {
      predictions[match.id] = {
        goalsA: Math.floor(Math.random() * 4),
        goalsB: Math.floor(Math.random() * 4)
      };
    });
    return predictions;
  },

  // Obtiene todos los usuarios locales
  getUsers() {
    return this.initUsers();
  },

  // Guarda la base de datos de usuarios locales
  saveUsers(users) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  },

  // Sincroniza el usuario activo desde Supabase y actualiza la caché
  async syncActiveUser() {
    const email = localStorage.getItem(ACTIVE_USER_KEY);
    if (!email) {
      this._activeUserCache = null;
      return null;
    }

    const cleanEmail = email.trim().toLowerCase();
    const sb = ProdeAPI.getSupabaseClient();

    if (sb) {
      try {
        const { data: u, error: uErr } = await sb.from("prode_users").select("*").eq("email", cleanEmail).maybeSingle();
        if (uErr) throw uErr;

        if (u) {
          const { data: preds, error: pErr } = await sb.from("prode_predictions").select("*").eq("user_email", cleanEmail);
          if (pErr) throw pErr;

          const predictions = {};
          if (preds) {
            preds.forEach(p => {
              predictions[p.match_id] = {
                goalsA: p.goals_a,
                goalsB: p.goals_b
              };
            });
          }

          this._activeUserCache = {
            email: u.email,
            name: u.name,
            paid: u.paid,
            paymentDate: u.payment_date,
            paymentMethod: u.payment_method,
            transactionId: u.transaction_id,
            predictions: predictions
          };
          
          let localUsers = this.getUsers();
          localUsers[cleanEmail] = this._activeUserCache;
          this.saveUsers(localUsers);

          return this._activeUserCache;
        }
      } catch (e) {
        console.error("Error al sincronizar usuario activo de Supabase:", e);
      }
    }

    const users = this.getUsers();
    this._activeUserCache = users[cleanEmail] || null;
    return this._activeUserCache;
  },

  // Registra un nuevo correo
  async registerUser(email) {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Correo inválido");

    let users = this.getUsers();
    let user = users[cleanEmail];

    if (!user) {
      user = {
        email: cleanEmail,
        name: cleanEmail.split("@")[0],
        paid: false,
        paymentDate: null,
        paymentMethod: null,
        transactionId: null,
        predictions: {}
      };
      users[cleanEmail] = user;
      this.saveUsers(users);
    }

    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        const { data: existingUser } = await sb.from("prode_users").select("email").eq("email", cleanEmail).maybeSingle();
        if (!existingUser) {
          const { error } = await sb.from("prode_users").insert({
            email: cleanEmail,
            name: cleanEmail.split("@")[0],
            paid: false,
            payment_date: null,
            payment_method: null,
            transaction_id: null
          });
          if (error) throw error;
        } else {
          const { data: fullUser } = await sb.from("prode_users").select("*").eq("email", cleanEmail).single();
          user.paid = fullUser.paid;
          user.paymentDate = fullUser.payment_date;
          user.paymentMethod = fullUser.payment_method;
          user.transactionId = fullUser.transaction_id;
          users[cleanEmail] = user;
          this.saveUsers(users);
        }
      } catch (e) {
        console.error("Error al registrar usuario en Supabase:", e);
      }
    }

    this._activeUserCache = user;
    return user;
  },

  // Registra que un correo completó el pago de $1000
  async processPayment(email, paymentMethod = "CreditCard", transactionId = "") {
    const cleanEmail = email.trim().toLowerCase();
    let users = this.getUsers();
    
    if (!users[cleanEmail]) {
      await this.registerUser(cleanEmail);
      users = this.getUsers();
    }
    
    const paymentDate = new Date().toISOString();
    
    users[cleanEmail].paid = true;
    users[cleanEmail].paymentDate = paymentDate;
    users[cleanEmail].paymentMethod = paymentMethod;
    users[cleanEmail].transactionId = transactionId;
    this.saveUsers(users);
    
    if (this._activeUserCache && this._activeUserCache.email === cleanEmail) {
      this._activeUserCache.paid = true;
      this._activeUserCache.paymentDate = paymentDate;
      this._activeUserCache.paymentMethod = paymentMethod;
      this._activeUserCache.transactionId = transactionId;
    }

    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb.from("prode_users").upsert({
          email: cleanEmail,
          name: users[cleanEmail].name || cleanEmail.split("@")[0],
          paid: true,
          payment_date: paymentDate,
          payment_method: paymentMethod,
          transaction_id: transactionId
        });
        if (error) throw error;
      } catch (e) {
        console.error("Error al registrar pago en Supabase:", e);
      }
    }
    
    window.dispatchEvent(new CustomEvent("prode_payment_success", { detail: users[cleanEmail] }));
    return users[cleanEmail];
  },

  // Gestiona el correo activo (Usuario Logueado)
  getActiveUser() {
    if (this._activeUserCache) return this._activeUserCache;
    const email = localStorage.getItem(ACTIVE_USER_KEY);
    if (!email) return null;
    
    const users = this.getUsers();
    this._activeUserCache = users[email.toLowerCase()] || null;
    return this._activeUserCache;
  },

  setActiveUser(email) {
    localStorage.setItem(ACTIVE_USER_KEY, email.trim().toLowerCase());
    this._activeUserCache = null;
  },

  logout() {
    localStorage.removeItem(ACTIVE_USER_KEY);
    this._activeUserCache = null;
  },

  // Guardar pronósticos
  async savePredictions(email, predictions) {
    const cleanEmail = email.trim().toLowerCase();
    let users = this.getUsers();
    
    if (users[cleanEmail]) {
      users[cleanEmail].predictions = {
        ...users[cleanEmail].predictions,
        ...predictions
      };
      this.saveUsers(users);

      if (this._activeUserCache && this._activeUserCache.email === cleanEmail) {
        this._activeUserCache.predictions = {
          ...this._activeUserCache.predictions,
          ...predictions
        };
      }

      const sb = ProdeAPI.getSupabaseClient();
      if (sb) {
        try {
          const promises = Object.entries(predictions).map(([matchId, pred]) => {
            return sb.from("prode_predictions").upsert({
              id: `${cleanEmail}:${matchId}`,
              user_email: cleanEmail,
              match_id: matchId,
              goals_a: pred.goalsA,
              goals_b: pred.goalsB,
              updated_at: new Date().toISOString()
            });
          });
          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res.error) throw res.error;
          });
        } catch (e) {
          console.error("Error al guardar predicciones en Supabase:", e);
        }
      }
      return true;
    }
    return false;
  },

  // CÓMPUTO DE PUNTOS
  calculateMatchPoints(pred, real) {
    if (real.status !== "FINALIZADO") return 0;
    if (pred.goalsA === null || pred.goalsB === null || pred.goalsA === undefined || pred.goalsB === undefined) return 0;

    const gA = parseInt(pred.goalsA);
    const gB = parseInt(pred.goalsB);
    const rA = parseInt(real.result.goalsA);
    const rB = parseInt(real.result.goalsB);

    // 1. Acierto Exacto -> 3 puntos
    if (gA === rA && gB === rB) {
      return 3;
    }

    // 2. Acierto del ganador o empate (pero no goles exactos) -> 1 punto
    const predictedWinner = gA > gB ? "A" : (gA < gB ? "B" : "DRAW");
    const realWinner = rA > rB ? "A" : (rA < rB ? "B" : "DRAW");

    if (predictedWinner === realWinner) {
      return 1;
    }

    // 3. Ningún acierto -> 0 puntos
    return 0;
  },

  // CALCULA Y ORDENA LA TABLA DE POSICIONES
  async getLeaderboard() {
    const sb = ProdeAPI.getSupabaseClient();
    let users = {};
    let realMatches = await ProdeAPI.getMatches();

    if (sb) {
      try {
        const { data: dbUsers, error: usersErr } = await sb.from("prode_users").select("*");
        if (usersErr) throw usersErr;

        const { data: dbPreds, error: predsErr } = await sb.from("prode_predictions").select("*");
        if (predsErr) throw predsErr;

        dbUsers.forEach(u => {
          users[u.email] = {
            email: u.email,
            name: u.name,
            paid: u.paid,
            paymentDate: u.payment_date,
            paymentMethod: u.payment_method,
            transactionId: u.transaction_id,
            predictions: {}
          };
        });

        dbPreds.forEach(p => {
          if (users[p.user_email]) {
            users[p.user_email].predictions[p.match_id] = {
              goalsA: p.goals_a,
              goalsB: p.goals_b
            };
          }
        });
      } catch (e) {
        console.error("Error al sincronizar Leaderboard con Supabase, usando LocalStorage:", e);
        users = this.getUsers();
      }
    } else {
      users = this.getUsers();
    }
    
    const leaderboard = [];
    let totalPaidParticipants = 0;

    Object.values(users).forEach(user => {
      if (user.paid) {
        totalPaidParticipants++;
      }
      
      let points = 0;
      let exactHits = 0;
      let partialHits = 0;

      realMatches.forEach(match => {
        if (match.status === "FINALIZADO") {
          const pred = user.predictions[match.id];
          if (pred) {
            const pts = this.calculateMatchPoints(pred, match);
            points += pts;
            if (pts === 3) exactHits++;
            else if (pts === 1) partialHits++;
          }
        }
      });

      leaderboard.push({
        email: user.email,
        name: user.name,
        points: points,
        exactHits: exactHits,
        partialHits: partialHits,
        paymentDate: user.paymentDate,
        paid: !!user.paid
      });
    });

    // Ordenar: 1) Puntos, 2) Exactos, 3) Fecha de pago más antigua (los no pagos van al final si empatan)
    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactHits !== a.exactHits) return b.exactHits - a.exactHits;
      
      const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : Infinity;
      const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : Infinity;
      return dateA - dateB;
    });

    const config = this.getOrganizerConfig();
    const commissionPct = config.commission !== undefined ? parseInt(config.commission) : 20;

    const grossPool = totalPaidParticipants * 1000;
    const adminCut = grossPool * (commissionPct / 100);
    const netPool = grossPool - adminCut;

    return {
      rankings: leaderboard,
      totalPool: netPool, // Pozo acumulado Neto para el ganador
      totalGrossPool: grossPool, // Bruto total
      adminCommissionAmount: adminCut, // Ganancia del admin
      participantsCount: totalPaidParticipants
    };
  },

  // -------------------------------------------------------------
  // LÓGICA DE SIMULADOR DE TIEMPO Y VENTANAS DE CIERRE
  // -------------------------------------------------------------
  
  // Obtiene la fecha/hora actual del sistema (real o simulada)
  getCurrentTime() {
    const saved = localStorage.getItem(SIMULATED_TIME_KEY);
    if (saved) {
      return new Date(saved);
    }
    return new Date();
  },

  // Configura la fecha simulada
  setSimulatedTime(dateStr) {
    if (dateStr) {
      localStorage.setItem(SIMULATED_TIME_KEY, dateStr);
    } else {
      localStorage.removeItem(SIMULATED_TIME_KEY);
    }
    window.dispatchEvent(new CustomEvent("prode_time_change"));
  },

  // Obtiene la configuración del organizador de cobros
  getOrganizerConfig() {
    const defaultConfig = {
      alias: "prode.mundial.2026",
      cvu: "0000003100019283746501",
      holder: "Juan Pérez (Organizador)",
      paymentLink: "",
      commission: 20
    };
    const saved = localStorage.getItem("worldcup_prode_organizer_config");
    if (saved) {
      try {
        return { ...defaultConfig, ...JSON.parse(saved) };
      } catch (e) {
        return defaultConfig;
      }
    }
    return defaultConfig;
  },

  // Sincroniza la configuración del organizador desde Supabase
  async syncOrganizerConfig() {
    const sb = ProdeAPI.getSupabaseClient();
    const defaultConfig = this.getOrganizerConfig();

    if (sb) {
      try {
        const { data, error } = await sb.from("prode_config").select("*").eq("id", 1).maybeSingle();
        if (error) throw error;
        
        if (data) {
          const config = {
            alias: data.alias || defaultConfig.alias,
            cvu: data.cvu || defaultConfig.cvu,
            holder: data.holder || defaultConfig.holder,
            paymentLink: data.payment_link || defaultConfig.paymentLink,
            commission: data.commission !== undefined && data.commission !== null ? parseInt(data.commission) : defaultConfig.commission
          };
          localStorage.setItem("worldcup_prode_organizer_config", JSON.stringify(config));
          return config;
        }
      } catch (e) {
        console.error("Error al sincronizar configuración del organizador desde Supabase:", e);
      }
    }
    return defaultConfig;
  },

  // Guarda la configuración del organizador
  async saveOrganizerConfig(config) {
    localStorage.setItem("worldcup_prode_organizer_config", JSON.stringify(config));
    
    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb.from("prode_config").upsert({
          id: 1,
          alias: config.alias,
          cvu: config.cvu,
          holder: config.holder,
          payment_link: config.paymentLink,
          commission: config.commission
        });
        if (error) throw error;
      } catch (e) {
        console.error("Error al guardar configuración del organizador en Supabase:", e);
      }
    }

    window.dispatchEvent(new CustomEvent("prode_organizer_config_change", { detail: config }));
  },

  // Comprueba si una etapa está bloqueada para apuestas según la fecha/hora actual
  isStageLocked(stage) {
    const currentTime = this.getCurrentTime();

    // 1. Fase de Grupos
    if (stage === "Fase de Grupos") {
      const limitGroup = new Date("2026-06-11T16:00:00-03:00");
      return currentTime >= limitGroup;
    }

    // 2. Fase Eliminatoria
    const limitKnockout = new Date("2026-06-28T16:00:00-03:00");
    return currentTime >= limitKnockout;
  }
};
