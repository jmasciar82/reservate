// js/app.js

document.addEventListener("DOMContentLoaded", () => {
  // Inicialización de Datos y Vistas
  ProdeApp.init();
});

const ProdeApp = {
  activeTab: "dashboard",
  selectedStage: "Fase de Grupos",

  async init() {
    // Inicializar bases de datos locales
    ProdeAPI.initMatches();
    ProdeEngine.initUsers();

    // Enlazar Eventos de UI
    this.bindEvents();

    // Sincronizar datos iniciales de Supabase si está conectado
    await ProdeEngine.syncActiveUser();
    await ProdeEngine.syncOrganizerConfig();

    // Procesar redirección de Google OAuth (si viene de un callback)
    await this.handleSupabaseAuthRedirect();

    // Verificar Estado de Sesión al iniciar
    this.checkSessionFlow();

    // Escuchar actualizaciones de la API para sincronizar vistas en tiempo real
    window.addEventListener("prode_api_update", () => {
      this.refreshAppViews();
      this.addAdminLog("Actualización de partidos y resultados recibida.");
    });

    // Escuchar cambios del simulador de tiempo
    window.addEventListener("prode_time_change", () => {
      this.refreshAppViews();
    });

    // Iniciar timer de cuenta regresiva (B3)
    this.startCountdownTimer();
    this.startSyncCountdownTimer();

    // Setup de realtime (B4)
    this.setupRealtimeSubscription();
  },

  // -------------------------------------------------------------
  // VERIFICACIÓN DE SESIÓN Y ENRUTAMIENTO (SPA FLOW)
  // -------------------------------------------------------------
  checkSessionFlow() {
    const activeUser = ProdeEngine.getActiveUser();
    
    // Ocultar todas las pantallas por defecto
    document.querySelectorAll(".app-screen").forEach(s => s.classList.remove("active"));

    if (!activeUser) {
      // Mostrar pantalla de Login
      document.getElementById("login-screen").classList.add("active");
    } else {
      // Todos los usuarios registrados acceden DIRECTAMENTE a la SPA
      document.getElementById("main-screen").classList.add("active");
      
      // Controlar la visualización del banner de advertencia si no ha pagado
      const unpaidBanner = document.getElementById("unpaid-warning-banner");
      if (!activeUser.paid) {
        unpaidBanner.style.display = "flex";
      } else {
        unpaidBanner.style.display = "none";
      }

      this.refreshAppViews();
    }
  },

  // Redirección al Checkout de Pago
  goToPaymentScreen() {
    document.querySelectorAll(".app-screen").forEach(s => s.classList.remove("active"));
    document.getElementById("payment-screen").classList.add("active");
    this.initMercadoPagoScreen();
  },

  // Cancelar flujo de pago
  cancelPaymentFlow() {
    this.checkSessionFlow();
  },

  // -------------------------------------------------------------
  // EVENTOS E INTERACCIONES DE INTERFAZ DE USUARIO
  // -------------------------------------------------------------
  bindEvents() {
    // 1. Formulario de Login con Contraseña Dinámica para Administradores
    const loginForm = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passwordGroup = document.getElementById("login-password-group");
    const passwordLabel = document.getElementById("login-password-label");
    const passwordInput = document.getElementById("login-password");

    if (emailInput && passwordGroup && passwordInput) {
      const checkEmailForAdmin = () => {
        const email = emailInput.value.trim();
        if (ProdeEngine.isAdmin(email)) {
          passwordGroup.style.display = "block";
          passwordInput.required = true;
          
          const savedPin = ProdeEngine.getOrganizerConfig().adminPasswordHash;
          const isValidHash = savedPin && savedPin.length === 64 && /^[0-9a-fA-F]+$/.test(savedPin);
          if (!isValidHash) {
            passwordLabel.textContent = "Definir nueva Contraseña de Administrador";
            passwordInput.placeholder = "Crear contraseña segura (mín. 8 caracteres)";
          } else {
            passwordLabel.textContent = "Contraseña de Administrador";
            passwordInput.placeholder = "Ingresa tu contraseña";
          }
        } else {
          passwordGroup.style.display = "none";
          passwordInput.required = false;
          passwordInput.value = "";
        }
      };

      emailInput.addEventListener("input", checkEmailForAdmin);
      emailInput.addEventListener("change", checkEmailForAdmin);
    }

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = emailInput.value.trim();
        
        if (email) {
          // Bloquear correos no-admin en el formulario clásico
          if (!ProdeEngine.isAdmin(email)) {
            this.showMicroNotification("Por seguridad, los usuarios deben iniciar sesión con Google.", "warning");
            return;
          }

          // Si es Admin, validar contraseña
          if (ProdeEngine.isAdmin(email) && passwordInput) {
            const enteredPass = passwordInput.value.trim();
            const savedPin = ProdeEngine.getOrganizerConfig().adminPasswordHash;
            const isValidHash = savedPin && savedPin.length === 64 && /^[0-9a-fA-F]+$/.test(savedPin);

            if (!isValidHash) {
              // Si no hay contraseña válida, registrar la ingresada
              if (enteredPass.length < 8) {
                this.showMicroNotification("La contraseña debe tener al menos 8 caracteres.", "warning");
                return;
              }
              const hashed = await this.hashPassword(enteredPass);
              await ProdeEngine.saveAdminPassword(hashed);
              sessionStorage.setItem("worldcup_prode_admin_authenticated", "true");
              this.showMicroNotification("¡Contraseña de administrador creada con éxito!", "success");
            } else {
              // Validar contraseña
              const enteredHash = await this.hashPassword(enteredPass);
              if (enteredHash !== savedPin) {
                this.showMicroNotification("Contraseña de administrador incorrecta.", "error");
                passwordInput.value = "";
                passwordInput.focus();
                return;
              }
              sessionStorage.setItem("worldcup_prode_admin_authenticated", "true");
            }
          }

          const btn = document.getElementById("btn-login-submit");
          const originalText = btn.innerHTML;
          btn.disabled = true;
          btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Iniciando sesión...`;
          
          try {
            await ProdeEngine.registerUser(email);
            ProdeEngine.setActiveUser(email);
            await ProdeEngine.syncActiveUser();
            this.checkSessionFlow();
          } catch (err) {
            console.error(err);
            this.showMicroNotification("Error al iniciar sesión", "error");
          } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (passwordInput) passwordInput.value = ""; // Limpiar campo
          }
        }
      });
    }

    // El formulario de pago anterior se reemplazó por el flujo de Mercado Pago con acciones explícitas.

    // 3. Botones de Navegación Pestañas (Sidebar y Mobile Nav)
    const tabSelectors = document.querySelectorAll(".nav-item, .mobile-nav-link");
    tabSelectors.forEach(item => {
      item.addEventListener("click", () => {
        const targetTab = item.getAttribute("data-tab");
        this.switchTab(targetTab);
      });
    });

    // 4. Botones de Salida (Cerrar Sesión)
    const logoutBtnSidebar = document.getElementById("btn-logout-sidebar");
    if (logoutBtnSidebar) {
      logoutBtnSidebar.addEventListener("click", () => this.handleLogout());
    }
    const logoutBtnMobile = document.getElementById("btn-logout-mobile");
    if (logoutBtnMobile) {
      logoutBtnMobile.addEventListener("click", () => this.handleLogout());
    }

    // 5. Filtros de etapa de partidos (Fixture)
    const filterButtons = document.querySelectorAll(".btn-filter");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.selectedStage = btn.getAttribute("data-stage");
        this.renderPredictionsFixture();
      });
    });

    // 6. Guardar predicciones desde el fixture general
    const btnSaveFixture = document.getElementById("btn-save-fixture-predictions");
    if (btnSaveFixture) {
      btnSaveFixture.addEventListener("click", () => {
        this.saveFixturePredictions();
      });
    }

    // 7. Guardar predicción rápida desde el Dashboard
    const btnSaveFeatured = document.getElementById("btn-save-featured");
    if (btnSaveFeatured) {
      btnSaveFeatured.addEventListener("click", () => {
        this.saveFeaturedPrediction();
      });
    }

    // 8. Botón Resetear Simulador API
    const btnResetSim = document.getElementById("btn-reset-simulator");
    if (btnResetSim) {
      btnResetSim.addEventListener("click", async () => {
        if (confirm("¿Estás seguro de que quieres restablecer todos los partidos a PENDIENTE? Los puntos se recalcularán a 0.")) {
          await ProdeAPI.resetAllResults();
          this.addAdminLog("Reinicio de todos los partidos del mundial.");
          this.showMicroNotification("Resultados restablecidos con éxito", "success");
        }
      });
    }

    // 8.b. Botón Sincronizar API Real
    const btnSyncApi = document.getElementById("btn-sync-real-api");
    if (btnSyncApi) {
      btnSyncApi.addEventListener("click", async () => {
        const originalText = btnSyncApi.innerHTML;
        btnSyncApi.disabled = true;
        btnSyncApi.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sincronizando...`;
        
        try {
          const updatedCount = await ProdeAPI.syncWithWorldCup2026API();
          if (updatedCount !== null) {
            this.addAdminLog(`Sincronización de API real finalizada (${updatedCount} partidos actualizados).`);
            this.showMicroNotification(`¡Sincronización exitosa! ${updatedCount} partidos actualizados.`, "success");
            this.refreshAppViews();
          } else {
            this.showMicroNotification("Error al sincronizar resultados desde la API externa.", "error");
          }
        } catch (e) {
          console.error(e);
          this.showMicroNotification("Ocurrió un error inesperado al conectar con la API.", "error");
        } finally {
          btnSyncApi.disabled = false;
          btnSyncApi.innerHTML = originalText;
        }
      });
    }

    // 9. Formulario de PIN de Administrador (A1)
    const pinForm = document.getElementById("admin-pin-form");
    if (pinForm) {
      pinForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.verifyAdminPin();
      });
    }
  },

  // -------------------------------------------------------------
  // PASARELA Y SIMULADOR DE MERCADO PAGO
  // -------------------------------------------------------------
  initMercadoPagoScreen() {
    const config = ProdeEngine.getOrganizerConfig();
    document.getElementById("mp-display-alias").textContent = config.alias;
    document.getElementById("mp-display-cvu").textContent = config.cvu;
    document.getElementById("mp-display-holder").textContent = config.holder;
    
    // Resetear campos
    document.getElementById("mp-transaction-id").value = "";
    
    // Pestaña inicial (ahora siempre transferencia)
    this.switchPaymentTab("transfer");
  },

  switchPaymentTab(tabType) {
    // Botones
    const btnExpress = document.getElementById("btn-tab-mp-express");
    const btnTransfer = document.getElementById("btn-tab-mp-transfer");
    
    // Contenedores
    const paneExpress = document.getElementById("mp-pane-express");
    const paneTransfer = document.getElementById("mp-pane-transfer");
    
    if (tabType === "express" && btnExpress && paneExpress) {
      btnExpress.classList.add("active");
      if (btnTransfer) btnTransfer.classList.remove("active");
      paneExpress.classList.add("active");
      if (paneTransfer) paneTransfer.classList.remove("active");
    } else {
      if (btnExpress) btnExpress.classList.remove("active");
      if (btnTransfer) btnTransfer.classList.add("active");
      if (paneExpress) paneExpress.classList.remove("active");
      if (paneTransfer) paneTransfer.classList.add("active");
    }
  },

  copyToClipboard(label, elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
      this.showMicroNotification(`¡${label} copiado al portapapeles!`, "success");
    }).catch(() => {
      // Fallback para navegadores antiguos
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      this.showMicroNotification(`¡${label} copiado al portapapeles!`, "success");
    });
  },

  async submitMpTransferReceipt() {
    const receiptInput = document.getElementById("mp-transaction-id");
    const receiptId = receiptInput.value.trim();
    const activeUser = ProdeEngine.getActiveUser();
    
    if (!activeUser || !receiptId) return;

    if (receiptId.length < 8) {
      this.showMicroNotification("El comprobante debe tener al menos 8 dígitos", "warning");
      return;
    }

    const btn = document.getElementById("btn-transfer-submit");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Verificando transferencia...`;

    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb.from("prode_users").upsert({
          email: activeUser.email,
          name: activeUser.name,
          paid: false, // Pendiente de verificación por el admin
          payment_date: new Date().toISOString(),
          payment_method: "MercadoPago_Transfer",
          transaction_id: receiptId
        });
        if (error) throw error;
        
        await ProdeEngine.syncActiveUser();
        
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Registrar Transferencia`;
          this.checkSessionFlow();
          this.showMicroNotification("¡Transferencia registrada! Pendiente de aprobación del organizador.", "warning");
        }, 1500);
      } catch (e) {
        console.error(e);
        this.showMicroNotification("Error al registrar transferencia en la base de datos", "error");
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Registrar Transferencia`;
      }
    } else {
      // Modo Demo local
      setTimeout(() => {
        ProdeEngine.processPayment(activeUser.email, "MercadoPago_Transfer", receiptId);
        this.fireConfetiEffect();
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Registrar Transferencia`;
          this.checkSessionFlow();
          this.showMicroNotification("¡Transferencia registrada y pozo activado! Éxito.", "success");
        }, 1000);
      }, 2000);
    }
  },

  startMpExpressFlow() {
    const config = ProdeEngine.getOrganizerConfig();
    
    // Si el organizador definió un Link de Pago real, lo abrimos
    if (config.paymentLink) {
      window.open(config.paymentLink, "_blank");
    }

    // De todos modos, abrimos el Simulador de Checkout Pro en modal
    const modal = document.getElementById("mp-checkout-simulator-modal");
    modal.classList.add("active");
    
    // Resetear a paso 1
    document.getElementById("mp-step-summary").classList.add("active");
    document.getElementById("mp-step-processing").classList.remove("active");
    document.getElementById("mp-step-success").classList.remove("active");
    
    this.selectMpMethod("wallet");
  },

  selectMpMethod(methodType) {
    const optWallet = document.getElementById("mp-opt-wallet");
    const optCard = document.getElementById("mp-opt-card");
    
    if (methodType === "wallet") {
      optWallet.classList.add("active");
      optCard.classList.remove("active");
    } else {
      optWallet.classList.remove("active");
      optCard.classList.add("active");
    }
  },

  triggerMpProcessing() {
    // Ir a Paso 2 (Spinner)
    document.getElementById("mp-step-summary").classList.remove("active");
    document.getElementById("mp-step-processing").classList.add("active");

    setTimeout(async () => {
      // Ir a Paso 3 (Éxito verde)
      const txId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      document.getElementById("mp-success-tx-id").textContent = txId;
      
      document.getElementById("mp-step-processing").classList.remove("active");
      document.getElementById("mp-step-success").classList.add("active");

      // Guardar en motor
      const activeUser = ProdeEngine.getActiveUser();
      await ProdeEngine.processPayment(activeUser.email, "MercadoPago_Express", txId);
      await ProdeEngine.syncActiveUser();
      
      this.fireConfetiEffect();

      // Sonido de éxito simulado o cierre
      setTimeout(() => {
        this.closeMpSimulator();
        this.checkSessionFlow();
        this.showMicroNotification("¡Pago exprés exitoso! Cuenta activada.", "success");
      }, 3500);

    }, 2000);
  },

  closeMpSimulator() {
    document.getElementById("mp-checkout-simulator-modal").classList.remove("active");
  },

  async saveAdminMpConfig() {
    const alias = document.getElementById("admin-mp-alias").value.trim();
    const cvu = document.getElementById("admin-mp-cvu").value.trim();
    const holder = document.getElementById("admin-mp-holder").value.trim();
    const paymentLink = document.getElementById("admin-mp-link").value.trim();
    const commission = parseInt(document.getElementById("admin-mp-commission").value) || 0;
    const entryCost = parseInt(document.getElementById("admin-mp-entry-cost").value) || 1000;

    if (!alias || !cvu || !holder) {
      this.showMicroNotification("Completa todos los campos obligatorios", "warning");
      return;
    }

    const config = { alias, cvu, holder, paymentLink, commission, entryCost };
    try {
      await ProdeEngine.saveOrganizerConfig(config);
      this.addAdminLog(`Configuración de cobros actualizada (Comisión: ${commission}%).`);
      this.showMicroNotification("Credenciales del Organizador actualizadas con éxito", "success");
      this.refreshAppViews();
    } catch (e) {
      console.error(e);
      this.showMicroNotification("Error al guardar credenciales. Verifica que prode_config tenga las columnas commission, admin_password_hash y entry_cost.", "error");
    }
  },

  async changeAdminPassword() {
    const currentPassEl = document.getElementById("admin-current-pass");
    const newPassEl = document.getElementById("admin-new-pass");
    const confirmPassEl = document.getElementById("admin-confirm-pass");
    
    if (!currentPassEl || !newPassEl || !confirmPassEl) return;
    
    const currentPass = currentPassEl.value.trim();
    const newPass = newPassEl.value.trim();
    const confirmPass = confirmPassEl.value.trim();
    
    if (!currentPass || !newPass || !confirmPass) {
      this.showMicroNotification("Completa todos los campos.", "warning");
      return;
    }
    
    if (newPass.length < 8) {
      this.showMicroNotification("La nueva contraseña debe tener al menos 8 caracteres.", "warning");
      return;
    }
    
    if (newPass !== confirmPass) {
      this.showMicroNotification("Las contraseñas nuevas no coinciden.", "warning");
      return;
    }
    
    // Validar contraseña actual
    const currentHash = await this.hashPassword(currentPass);
    const savedPin = ProdeEngine.getOrganizerConfig().adminPasswordHash;
    
    if (savedPin && currentHash !== savedPin) {
      this.showMicroNotification("La contraseña actual es incorrecta.", "error");
      currentPassEl.value = "";
      currentPassEl.focus();
      return;
    }
    
    // Cambiar contraseña
    try {
      const newHash = await this.hashPassword(newPass);
      await ProdeEngine.saveAdminPassword(newHash);
      this.addAdminLog("Contraseña de administrador actualizada.");
      this.showMicroNotification("¡Contraseña de administrador actualizada con éxito!", "success");
      
      // Limpiar formulario
      currentPassEl.value = "";
      newPassEl.value = "";
      confirmPassEl.value = "";
    } catch (e) {
      console.error(e);
      this.showMicroNotification("Error al cambiar la contraseña.", "error");
    }
  },

  fireConfetiEffect() {
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#d4af37", "#ffffff", "#10b981"]
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#d4af37", "#ffffff", "#10b981"]
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  },

  // -------------------------------------------------------------
  // CAMBIO DE PESTAÑAS (SPA FLOW)
  // -------------------------------------------------------------
  switchTab(tabId) {
    if (tabId === "admin") {
      const activeUser = ProdeEngine.getActiveUser();
      if (!activeUser || !ProdeEngine.isAdmin(activeUser.email)) {
        this.showMicroNotification("Acceso denegado: Se requieren permisos de administrador.", "error");
        this.switchTab("dashboard");
        return;
      }
    }

    this.activeTab = tabId;

    // Actualizar estados visuales en menús
    document.querySelectorAll(".nav-item, .mobile-nav-link").forEach(el => {
      if (el.getAttribute("data-tab") === tabId) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });

    // Actualizar visibilidad de paneles de contenido
    document.querySelectorAll(".tab-content").forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    // Recargar datos específicos del tab seleccionado
    this.refreshAppViews();
  },

  updateDynamicEntryCosts() {
    const config = ProdeEngine.getOrganizerConfig();
    const cost = config.entryCost !== undefined ? config.entryCost : 1000;
    document.querySelectorAll(".entry-cost-display").forEach(el => {
      el.textContent = cost;
    });
  },

  // -------------------------------------------------------------
  // REFRESH DE VISTAS (SINCRONIZACIÓN DE LA SPA)
  // -------------------------------------------------------------
  async refreshAppViews() {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    // Actualizar todos los montos dinámicos de inscripción
    this.updateDynamicEntryCosts();

    // Controlar visibilidad del tab Admin según el rol
    const adminSidebarItem = document.querySelector(".nav-item[data-tab='admin']");
    const adminMobileItem = document.querySelector(".mobile-nav-link[data-tab='admin']");
    const isAdmin = ProdeEngine.isAdmin(activeUser.email);
    
    if (isAdmin) {
      if (adminSidebarItem) adminSidebarItem.style.display = "block";
      if (adminMobileItem) adminMobileItem.style.display = "flex";
    } else {
      if (adminSidebarItem) adminSidebarItem.style.display = "none";
      if (adminMobileItem) adminMobileItem.style.display = "none";
      
      if (this.activeTab === "admin") {
        this.switchTab("dashboard");
        return;
      }
    }

    // Sincronizar banner de fecha simulada (Time simulation)
    const simulatedDate = localStorage.getItem("worldcup_prode_simulated_time");
    const timeBanner = document.getElementById("time-simulation-banner");
    const timeDisplay = document.getElementById("simulated-time-display");
    
    if (simulatedDate) {
      timeBanner.style.display = "flex";
      const dateObj = new Date(simulatedDate);
      timeDisplay.textContent = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "long" }) + " (Simulada)";
    } else {
      timeBanner.style.display = "none";
    }

    // Actualizar Info de Perfil en Barra Lateral / Header
    document.getElementById("user-display-email").textContent = activeUser.email;
    const statusText = document.getElementById("user-display-status");
    if (activeUser.paid) {
      const config = ProdeEngine.getOrganizerConfig();
      const cost = config.entryCost !== undefined ? config.entryCost : 1000;
      statusText.innerHTML = `<i class="fa-solid fa-circle-check"></i> Activo ($${cost})`;
      statusText.className = "profile-status";
    } else {
      statusText.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Inactivo`;
      statusText.className = "profile-status unpaid";
    }

    // Sincronizar banner de cuenta impaga
    const unpaidBanner = document.getElementById("unpaid-warning-banner");
    if (!activeUser.paid) {
      unpaidBanner.style.display = "flex";
    } else {
      unpaidBanner.style.display = "none";
    }

    // Actualizar Pestañas Específicas
    if (this.activeTab === "dashboard") {
      await this.renderDashboard();
    } else if (this.activeTab === "predictions") {
      this.renderPredictionsFixture();
    } else if (this.activeTab === "standings") {
      this.renderStandings();
    } else if (this.activeTab === "leaderboard") {
      await this.renderLeaderboard();
    } else if (this.activeTab === "admin") {
      await this.renderAdminSimulator();
    }
  },

  // -------------------------------------------------------------
  // SIMULADOR DE TIEMPO (VIAJE EN EL TIEMPO)
  // -------------------------------------------------------------
  changeSimulatedTime(dateStr) {
    ProdeEngine.setSimulatedTime(dateStr);

    // Ajustar clases active en los botones del Admin
    document.getElementById("btn-time-before").classList.remove("active");
    document.getElementById("btn-time-groups").classList.remove("active");
    document.getElementById("btn-time-knockout").classList.remove("active");

    if (dateStr === null) {
      document.getElementById("btn-time-before").classList.add("active");
      this.showMicroNotification("Fecha restablecida al tiempo real", "info");
    } else if (dateStr.includes("06-15")) {
      document.getElementById("btn-time-groups").classList.add("active");
      this.showMicroNotification("Viaje en el tiempo: Fase de Grupos iniciada", "info");
    } else {
      document.getElementById("btn-time-knockout").classList.add("active");
      this.showMicroNotification("Viaje en el tiempo: Fase Eliminatoria iniciada", "info");
    }
  },

  // -------------------------------------------------------------
  // SECCIÓN 1: DASHBOARD (INICIO)
  // -------------------------------------------------------------
  async renderDashboard() {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    // Saludo
    document.getElementById("dashboard-user-name").textContent = activeUser.name;

    // Obtener estadísticas del Leaderboard y pozo
    const boardData = await ProdeEngine.getLeaderboard();
    document.getElementById("dash-total-pool").textContent = `$${boardData.totalPool.toLocaleString()} ARS`;
    
    const isUserAdmin = ProdeEngine.isAdmin(activeUser.email);
    const participantsDisplay = document.getElementById("dash-pool-participants");
    if (participantsDisplay) {
      participantsDisplay.innerHTML = `<i class="fa-solid fa-users"></i> ${boardData.participantsCount} participantes activos en el pozo`;
      participantsDisplay.style.display = isUserAdmin ? "flex" : "none";
    }

    // Buscar posición y puntos del usuario
    const rankIndex = boardData.rankings.findIndex(r => r.email === activeUser.email);
    const pointsText = document.getElementById("dash-user-points");
    const rankText = document.getElementById("dash-user-rank");

    // Calcular puntos informativos generales para el usuario activo y estadísticas (B2)
    const matches = await ProdeAPI.getMatches();
    let currentPoints = 0;
    let exactHits = 0;
    let partialHits = 0;
    let finishedMatchesWithPredictions = 0;
    
    // Racha actual de predicciones
    let currentStreak = 0;
    const sortedFinishedMatches = matches
      .filter(m => m.status === "FINALIZADO")
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    sortedFinishedMatches.forEach(match => {
      const pred = activeUser.predictions[match.id];
      if (pred && pred.goalsA !== null && pred.goalsB !== null && pred.goalsA !== undefined && pred.goalsB !== undefined) {
        finishedMatchesWithPredictions++;
        const pts = ProdeEngine.calculateMatchPoints(pred, match);
        currentPoints += pts;
        
        if (pts === 3) {
          exactHits++;
          currentStreak++;
        } else if (pts === 1) {
          partialHits++;
          currentStreak++;
        } else {
          currentStreak = 0; // Se corta la racha
        }
      }
    });

    pointsText.textContent = `${currentPoints} pts`;

    if (activeUser.paid && rankIndex !== -1) {
      rankText.innerHTML = `<i class="fa-solid fa-trophy"></i> Posición: <strong>#${rankIndex + 1}</strong> de ${boardData.participantsCount}`;
    } else if (!activeUser.paid) {
      rankText.innerHTML = `<i class="fa-solid fa-eye"></i> Puntos informativos (Sin activar pozo)`;
    } else {
      rankText.textContent = "Calculando...";
    }

    // Renderizar Estadísticas Personales en el DOM (B2)
    const statsExact = document.getElementById("stats-exact-hits");
    const statsPartial = document.getElementById("stats-partial-hits");
    const statsEfficiency = document.getElementById("stats-efficiency");
    const statsStreak = document.getElementById("stats-streak");
    const statsProgressBar = document.getElementById("stats-progress-bar");

    if (statsExact && statsPartial && statsEfficiency && statsStreak && statsProgressBar) {
      statsExact.textContent = exactHits;
      statsPartial.textContent = partialHits;
      
      const efficiency = finishedMatchesWithPredictions > 0 
        ? Math.round(((exactHits + partialHits) / finishedMatchesWithPredictions) * 100)
        : 0;
        
      statsEfficiency.textContent = `${efficiency}%`;
      statsStreak.textContent = `${currentStreak} 🔥`;
      statsProgressBar.style.width = `${efficiency}%`;
    }

    // Cargar Partido Destacado (el primer partido PENDIENTE de la lista)
    const nextPending = matches.find(m => m.status === "PENDIENTE");
    const featWidget = document.getElementById("featured-match-widget");

    if (nextPending) {
      const teamA = WORLDCUP_TEAMS[nextPending.teamA];
      const teamB = WORLDCUP_TEAMS[nextPending.teamB];
      
      // Obtener si ya existe predicción
      const userPred = activeUser.predictions[nextPending.id] || { goalsA: "", goalsB: "" };

      // Comprobar si el partido destacado está bloqueado por tiempo
      const isLocked = ProdeEngine.isStageLocked(nextPending.stage);
      
      featWidget.innerHTML = `
        <div class="mini-team">
          <img src="${teamA.flag}" alt="${teamA.name}" class="mini-flag">
          <span class="mini-team-name">${teamA.name}</span>
        </div>
        
        <div class="mini-pred-box">
          <input type="number" class="mini-pred-input" id="feat-goals-a" value="${userPred.goalsA !== undefined ? userPred.goalsA : ""}" placeholder="-" min="0" data-match-id="${nextPending.id}" ${isLocked ? "disabled" : ""}>
          <span class="mini-versus">vs</span>
          <input type="number" class="mini-pred-input" id="feat-goals-b" value="${userPred.goalsB !== undefined ? userPred.goalsB : ""}" placeholder="-" min="0" ${isLocked ? "disabled" : ""}>
        </div>

        <div class="mini-team">
          <img src="${teamB.flag}" alt="${teamB.name}" class="mini-flag">
          <span class="mini-team-name">${teamB.name}</span>
        </div>
      `;

      const featuredTimeBadge = document.getElementById("featured-match-time-badge");
      const btnSaveFeatured = document.getElementById("btn-save-featured");

      if (isLocked) {
        featuredTimeBadge.textContent = "🔒 Apuestas Cerradas";
        featuredTimeBadge.style.background = "rgba(239, 68, 68, 0.1)";
        featuredTimeBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
        featuredTimeBadge.style.color = "var(--accent-red)";
        btnSaveFeatured.style.display = "none";
      } else {
        featuredTimeBadge.textContent = "Partido Destacado";
        featuredTimeBadge.style.background = "rgba(16, 185, 129, 0.1)";
        featuredTimeBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
        featuredTimeBadge.style.color = "var(--accent-green)";
        btnSaveFeatured.style.display = "block";
      }
    } else {
      featWidget.innerHTML = `<p style="color: var(--text-muted); font-size: 0.95rem; text-align: center; width: 100%;">No hay partidos pendientes. ¡El mundial ha finalizado!</p>`;
      document.getElementById("btn-save-featured").style.display = "none";
    }
  },

  async saveFeaturedPrediction() {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    const featGoalsAInput = document.getElementById("feat-goals-a");
    const featGoalsBInput = document.getElementById("feat-goals-b");

    if (!featGoalsAInput || !featGoalsBInput) return;

    const matchId = featGoalsAInput.getAttribute("data-match-id");
    const goalsA = featGoalsAInput.value;
    const goalsB = featGoalsBInput.value;

    if (goalsA === "" || goalsB === "") {
      this.showMicroNotification("Ingresa goles para ambos equipos", "warning");
      return;
    }

    const predictions = {
      [matchId]: {
        goalsA: parseInt(goalsA),
        goalsB: parseInt(goalsB)
      }
    };

    const btn = document.getElementById("btn-save-featured");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    try {
      await ProdeEngine.savePredictions(activeUser.email, predictions);
      this.showMicroNotification("Pronóstico destacado guardado", "success");
      await ProdeEngine.syncActiveUser();
      this.refreshAppViews();
    } catch (e) {
      console.error(e);
      this.showMicroNotification("Error al guardar pronóstico destacado", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  // -------------------------------------------------------------
  // SECCIÓN 2: FIXTURE Y PREDICCIONES
  // -------------------------------------------------------------
  async renderPredictionsFixture() {
    const activeUser = ProdeEngine.getActiveUser();
    const container = document.getElementById("matches-render-container");
    
    if (!activeUser) return;

    container.innerHTML = "";

    // Renderizado especial de Bracket Visual (E2)
    if (this.selectedStage === "Bracket Visual") {
      this.renderBracketVisual();
      return;
    }

    // Comprobar si la etapa actual está bloqueada por tiempo simulado o real
    const isStageLocked = ProdeEngine.isStageLocked(this.selectedStage);
    const lockAlert = document.getElementById("fixture-lock-alert");
    const btnSaveFixture = document.getElementById("btn-save-fixture-predictions");

    if (isStageLocked) {
      lockAlert.style.display = "flex";
      btnSaveFixture.style.display = "none";
    } else {
      lockAlert.style.display = "none";
      btnSaveFixture.style.display = "flex";
    }

    // Obtener los partidos reales de la API
    const matches = await ProdeAPI.getMatches();
    const filteredMatches = matches.filter(m => m.stage === this.selectedStage);

    if (filteredMatches.length === 0) {
      container.innerHTML = `<p style="color: var(--text-muted); text-align: center; grid-column: 1 / -1; padding: 40px;">No hay partidos definidos para esta fase.</p>`;
      return;
    }

    filteredMatches.forEach(match => {
      const teamA = WORLDCUP_TEAMS[match.teamA];
      const teamB = WORLDCUP_TEAMS[match.teamB];
      
      // Cargar predicción previa del usuario si existe
      const userPred = activeUser.predictions[match.id] || { goalsA: null, goalsB: null };
      
      const isFinished = match.status === "FINALIZADO";

      // Formatear Fecha
      const dateParsed = new Date(match.date);
      const dateFormatted = dateParsed.toLocaleDateString("es-ES", { day: "numeric", month: "long" }) + " - " + dateParsed.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " hs";

      // Calcular puntos obtenidos por el partido
      let pointsEarnedBadge = "";
      if (isFinished) {
        const pts = ProdeEngine.calculateMatchPoints(userPred, match);
        pointsEarnedBadge = `<span class="pts-earned-badge ${pts === 0 ? "zero-pts" : ""}">${pts} pt${pts !== 1 ? "s" : ""} obtenido${pts !== 1 ? "s" : ""}</span>`;
      }

      // El marcador es editable si el partido no ha terminado Y si la etapa entera no está bloqueada por tiempo
      const canEdit = !isFinished && !isStageLocked;

      const matchCard = document.createElement("div");
      matchCard.className = "glass-panel match-card";
      matchCard.innerHTML = `
        <div class="match-card-header">
          <span class="match-stage-badge">${match.group}</span>
          <span>${dateFormatted}</span>
        </div>

        <div class="match-row-grid">
          <!-- Equipo A -->
          <div class="team-block">
            <img src="${teamA.flag}" alt="${teamA.name}" class="team-flag">
            <span class="team-name">${teamA.name}</span>
          </div>

          <!-- Marcadores interactivos -->
          <div class="prediction-inputs-block">
            <div class="goals-input-container">
              ${canEdit ? `<button class="btn-number-step" onclick="ProdeApp.stepGoals('${match.id}', 'goalsA', 1)"><i class="fa-solid fa-plus"></i></button>` : ""}
              <input 
                type="number" 
                class="goals-field match-pred-a" 
                id="pred-a-${match.id}" 
                value="${userPred.goalsA !== null && userPred.goalsA !== undefined ? userPred.goalsA : ""}" 
                placeholder="-" 
                min="0"
                ${!canEdit ? "disabled" : ""}
                data-match-id="${match.id}"
              >
              ${canEdit ? `<button class="btn-number-step" onclick="ProdeApp.stepGoals('${match.id}', 'goalsA', -1)"><i class="fa-solid fa-minus"></i></button>` : ""}
            </div>

            <span class="versus-label">VS</span>

            <div class="goals-input-container">
              ${canEdit ? `<button class="btn-number-step" onclick="ProdeApp.stepGoals('${match.id}', 'goalsB', 1)"><i class="fa-solid fa-plus"></i></button>` : ""}
              <input 
                type="number" 
                class="goals-field match-pred-b" 
                id="pred-b-${match.id}" 
                value="${userPred.goalsB !== null && userPred.goalsB !== undefined ? userPred.goalsB : ""}" 
                placeholder="-" 
                min="0"
                ${!canEdit ? "disabled" : ""}
              >
              ${canEdit ? `<button class="btn-number-step" onclick="ProdeApp.stepGoals('${match.id}', 'goalsB', -1)"><i class="fa-solid fa-minus"></i></button>` : ""}
            </div>
          </div>

          <!-- Equipo B -->
          <div class="team-block">
            <img src="${teamB.flag}" alt="${teamB.name}" class="team-flag">
            <span class="team-name">${teamB.name}</span>
          </div>
        </div>

        <div class="match-card-footer">
          <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-start;">
            ${isFinished 
              ? `<span style="color: var(--accent-green); font-weight:700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> Finalizado</span>`
              : (isStageLocked 
                  ? `<span style="color: var(--accent-red); font-weight:700; font-size: 0.75rem;"><i class="fa-solid fa-lock"></i> Ventana Cerrada</span>`
                  : `<span style="color: var(--text-muted); font-size: 0.75rem;"><i class="fa-regular fa-clock"></i> Abierto para pronósticos</span>`
                )
            }
            ${isFinished 
              ? `<div class="match-real-result-banner"><i class="fa-solid fa-square-poll-vertical"></i> Resultado Real: <span class="match-real-score">${match.result.goalsA} - ${match.result.goalsB}</span></div>` 
              : `<div class="match-real-result-banner" style="background: rgba(255, 255, 255, 0.015); border-color: rgba(255, 255, 255, 0.03); color: var(--text-muted); opacity: 0.75;"><i class="fa-solid fa-square-poll-vertical"></i> Resultado Real: <span class="match-real-score" style="color: var(--text-muted); font-style: italic;">Pendiente</span></div>`
            }
          </div>
          <div>
            ${pointsEarnedBadge}
          </div>
        </div>
      `;

      container.appendChild(matchCard);
    });
  },

  // Ajusta numéricamente los goles con los botones rápidos +/-
  stepGoals(matchId, field, value) {
    const input = document.getElementById(`pred-${field === "goalsA" ? "a" : "b"}-${matchId}`);
    if (input && !input.disabled) {
      let currentVal = parseInt(input.value);
      if (isNaN(currentVal)) currentVal = 0;
      
      let newVal = currentVal + value;
      if (newVal < 0) newVal = 0;
      
      input.value = newVal;
    }
  },

  async saveFixturePredictions() {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    // Verificar si la etapa está cerrada antes de guardar
    if (ProdeEngine.isStageLocked(this.selectedStage)) {
      this.showMicroNotification("La ventana de apuestas ya está cerrada para esta fase.", "error");
      return;
    }

    const predictions = {};
    const inputsA = document.querySelectorAll(".match-pred-a");

    let itemsSaved = 0;

    inputsA.forEach(inputA => {
      const matchId = inputA.getAttribute("data-match-id");
      const inputB = document.getElementById(`pred-b-${matchId}`);
      
      if (inputA.value !== "" && inputB.value !== "") {
        predictions[matchId] = {
          goalsA: parseInt(inputA.value),
          goalsB: parseInt(inputB.value)
        };
        itemsSaved++;
      }
    });

    if (itemsSaved === 0) {
      this.showMicroNotification("Completa al menos un marcador para guardar", "warning");
      return;
    }

    const btn = document.getElementById("btn-save-fixture-predictions");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`;

    try {
      await ProdeEngine.savePredictions(activeUser.email, predictions);
      this.showMicroNotification(`¡Se guardaron ${itemsSaved} pronósticos de ${this.selectedStage}!`, "success");
      await ProdeEngine.syncActiveUser();
      this.refreshAppViews();
    } catch (e) {
      console.error(e);
      this.showMicroNotification("Error al guardar predicciones", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  // -------------------------------------------------------------
  // SECCIÓN 3: TABLA DE POSICIONES (LEADERBOARD)
  // -------------------------------------------------------------
  async renderLeaderboard() {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    const boardData = await ProdeEngine.getLeaderboard();
    
    // Rellenar pozo acumulado en la cabecera
    document.getElementById("board-total-pool").textContent = `$${boardData.totalPool.toLocaleString()} ARS`;

    // Sincronizar aviso de cobro en Leaderboard
    const unpaidNotice = document.getElementById("leaderboard-unpaid-notice");
    if (!activeUser.paid) {
      unpaidNotice.style.display = "flex";
    } else {
      unpaidNotice.style.display = "none";
    }

    const tbody = document.getElementById("leaderboard-tbody");
    tbody.innerHTML = "";

    if (boardData.rankings.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 30px;">No hay ningún usuario inscrito aún.</td></tr>`;
      return;
    }

    boardData.rankings.forEach((player, index) => {
      const isYou = player.email === activeUser.email;
      const rankNum = index + 1;
      
      let rankDisplay = `<span class="rank-badge">${rankNum}</span>`;
      let rowClass = "";
      if (rankNum === 1) {
        rankDisplay = `<span class="rank-badge"><i class="fa-solid fa-medal"></i></span>`;
        rowClass = "rank-1";
      } else if (rankNum === 2) {
        rankDisplay = `<span class="rank-badge"><i class="fa-solid fa-medal" style="color:#a0aec0;"></i></span>`;
        rowClass = "rank-2";
      } else if (rankNum === 3) {
        rankDisplay = `<span class="rank-badge"><i class="fa-solid fa-medal" style="color:#dd6b20;"></i></span>`;
        rowClass = "rank-3";
      }

      const emailInitial = player.name ? player.name.substring(0,2).toUpperCase() : "US";

      const isPaid = player.paid;
      const tr = document.createElement("tr");
      if (rowClass) tr.className = rowClass;
      
      // Aplicar estilos de fila según estado de pago y si es el usuario activo
      if (isPaid) {
        tr.style.borderLeft = "3px solid var(--primary-gold)";
        tr.style.background = isYou ? "rgba(212, 175, 55, 0.08)" : "rgba(212, 175, 55, 0.02)";
      } else if (isYou) {
        tr.style.borderLeft = "3px solid var(--text-muted)";
        tr.style.background = "rgba(255, 255, 255, 0.03)";
      }

      tr.innerHTML = `
        <td class="rank-cell">${rankDisplay}</td>
        <td>
          <div class="user-cell">
            <span class="user-avatar-lbl" ${isPaid ? 'style="border-color: var(--primary-gold); color: var(--primary-gold); background: rgba(212, 175, 55, 0.05);"' : ''}>${emailInitial}</span>
            <div>
              <span class="user-main-email" ${isPaid ? 'style="color: var(--primary-gold); font-weight: 700;"' : ''}>
                ${player.name}
                ${isPaid ? `<i class="fa-solid fa-crown" style="color: var(--primary-gold); margin-left: 4px; font-size: 0.8rem;" title="Inscripción Abonada"></i>` : ""}
              </span>
              ${isYou ? `<span class="user-is-you-tag">Tú</span>` : ""}
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${player.email}</div>
            </div>
          </div>
        </td>
        <td style="text-align: center;" class="hits-cell">${player.exactHits}</td>
        <td style="text-align: center;" class="hits-cell">${player.partialHits}</td>
        <td style="text-align: center;" class="points-cell" ${!isPaid ? 'style="color: var(--text-muted);"' : ''}>${player.points} pts</td>
      `;

      tbody.appendChild(tr);
    });
  },

  async downloadAllPredictionsCsv() {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) {
      this.showMicroNotification("Debes iniciar sesión para descargar el archivo.", "warning");
      return;
    }

    const boardData = await ProdeEngine.getLeaderboard();
    const activePlayers = boardData.rankings.filter(p => p.paid);
    
    if (activePlayers.length === 0) {
      this.showMicroNotification("No hay participantes activos con inscripción abonada.", "warning");
      return;
    }

    const matches = await ProdeAPI.getMatches();
    let csvRows = [];
    let header = ["Participante", "Email"];
    
    const sortedMatches = [...matches].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedMatches.forEach(m => {
      const label = `${m.teamA} vs ${m.teamB} (${m.stage})`;
      header.push(label);
    });
    csvRows.push(header.join(","));

    const sb = ProdeAPI.getSupabaseClient();
    let allPredictionsMap = {};
    
    if (sb) {
      try {
        const { data: dbPreds, error } = await sb.from("prode_predictions").select("*");
        if (error) throw error;
        
        if (dbPreds) {
          dbPreds.forEach(p => {
            if (!allPredictionsMap[p.user_email]) {
              allPredictionsMap[p.user_email] = {};
            }
            allPredictionsMap[p.user_email][p.match_id] = {
              goalsA: p.goals_a,
              goalsB: p.goals_b
            };
          });
        }
      } catch (e) {
        console.error("Error al descargar pronósticos de Supabase, usando local storage:", e);
        const localUsers = ProdeEngine.getUsers();
        Object.keys(localUsers).forEach(email => {
          allPredictionsMap[email] = localUsers[email].predictions || {};
        });
      }
    } else {
      const localUsers = ProdeEngine.getUsers();
      Object.keys(localUsers).forEach(email => {
        allPredictionsMap[email] = localUsers[email].predictions || {};
      });
    }

    activePlayers.forEach(player => {
      const emailClean = player.email.toLowerCase();
      let row = [
        `"${player.name.replace(/"/g, '""')}"`,
        `"${player.email.replace(/"/g, '""')}"`
      ];

      const userPreds = allPredictionsMap[emailClean] || {};

      sortedMatches.forEach(m => {
        const isLocked = ProdeEngine.isStageLocked(m.stage);
        
        if (isLocked) {
          const pred = userPreds[m.id];
          if (pred !== undefined && pred.goalsA !== null && pred.goalsB !== null && pred.goalsA !== undefined && pred.goalsB !== undefined) {
            row.push(`"${pred.goalsA} - ${pred.goalsB}"`);
          } else {
            row.push(`"-"`);
          }
        } else {
          row.push(`"Oculto (Apuestas abiertas)"`);
        }
      });

      csvRows.push(row.join(","));
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pronosticos_prode_mundial_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.showMicroNotification("Archivo de pronósticos descargado con éxito", "success");
  },

  // -------------------------------------------------------------
  // SECCIÓN 4: SIMULADOR DE API DE RESULTADOS (ADMIN PANEL)
  // -------------------------------------------------------------
  async renderAdminSimulator() {
    // Verificar PIN de Administrador (A1)
    const isAuth = sessionStorage.getItem("worldcup_prode_admin_authenticated") === "true";
    const promptEl = document.getElementById("admin-pin-prompt");
    const controlsEl = document.getElementById("admin-main-controls");
    
    if (!isAuth) {
      promptEl.style.display = "block";
      controlsEl.style.display = "none";
      
      const savedPin = ProdeEngine.getOrganizerConfig().adminPasswordHash;
      const isValidHash = savedPin && savedPin.length === 64 && /^[0-9a-fA-F]+$/.test(savedPin);
      const titleEl = document.getElementById("admin-pin-title");
      const descEl = document.getElementById("admin-pin-desc");
      const submitBtn = document.getElementById("btn-admin-pin-submit");
      
      if (!isValidHash) {
        titleEl.textContent = "Definir nueva Contraseña";
        descEl.textContent = "No se ha configurado una Contraseña de Administrador. Define una contraseña de al menos 8 caracteres para proteger este panel:";
        submitBtn.textContent = "Guardar Contraseña y Desbloquear";
      } else {
        titleEl.textContent = "Contraseña de Administrador";
        descEl.textContent = "Ingresa la contraseña de seguridad para acceder a la configuración de cobros y simulación.";
        submitBtn.textContent = "Desbloquear Panel";
      }
      return;
    } else {
      promptEl.style.display = "none";
      controlsEl.style.display = "block";
    }

    // Renderizar logs de actividad
    this.renderAdminLogs();

    // Sincronizar campos de cobros de Mercado Pago
    const config = ProdeEngine.getOrganizerConfig();
    document.getElementById("admin-mp-alias").value = config.alias;
    document.getElementById("admin-mp-cvu").value = config.cvu;
    document.getElementById("admin-mp-holder").value = config.holder;
    document.getElementById("admin-mp-link").value = config.paymentLink;
    document.getElementById("admin-mp-commission").value = config.commission !== undefined ? config.commission : 20;
    document.getElementById("admin-mp-entry-cost").value = config.entryCost !== undefined ? config.entryCost : 1000;

    // Calcular y renderizar resumen financiero del administrador
    const boardData = await ProdeEngine.getLeaderboard();
    document.getElementById("admin-fin-participants").textContent = boardData.participantsCount;
    document.getElementById("admin-fin-gross").textContent = `$${boardData.totalGrossPool.toLocaleString()}`;
    document.getElementById("admin-fin-commission").textContent = `$${boardData.adminCommissionAmount.toLocaleString()}`;
    document.getElementById("admin-fin-net").textContent = `$${boardData.totalPool.toLocaleString()}`;

    // Sincronizar estado de conexión a base de datos en nube
    const sb = ProdeAPI.getSupabaseClient();
    const dbStatusBadge = document.getElementById("db-connection-status-badge");
    
    if (sb) {
      dbStatusBadge.textContent = "Nube Sincronizada";
      dbStatusBadge.className = "pts-earned-badge";
      dbStatusBadge.style.cssText = "font-size: 0.75rem; text-transform: uppercase; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: var(--accent-green);";
    } else {
      dbStatusBadge.textContent = "Modo Demo Local";
      dbStatusBadge.className = "pts-earned-badge zero-pts";
      dbStatusBadge.style.cssText = "font-size: 0.75rem; text-transform: uppercase; background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: var(--accent-red);";
    }

    // Sincronizar valores en los inputs de credenciales
    document.getElementById("admin-sb-url").value = localStorage.getItem("worldcup_prode_supabase_url") || "https://serhuzweioduzrdlyywb.supabase.co";
    document.getElementById("admin-sb-key").value = localStorage.getItem("worldcup_prode_supabase_key") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcmh1endlaW9kdXpyZGx5eXdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMyMTcsImV4cCI6MjA5NjAxOTIxN30.PkhLiXy3ELj2tQQoMORSOEJysgvQE8HU0hNJ_CK6Xzk";

    // Renderizar Control de Aprobación de Pagos
    const paymentsPanel = document.getElementById("admin-payments-panel");
    const paymentsTbody = document.getElementById("admin-payments-tbody");
    paymentsTbody.innerHTML = "";

    if (sb) {
      paymentsPanel.style.display = "block";
      try {
        const { data: unpaidUsers, error } = await sb
          .from("prode_users")
          .select("*")
          .eq("paid", false)
          .not("transaction_id", "is", null);
        
        if (error) throw error;

        if (unpaidUsers && unpaidUsers.length > 0) {
          unpaidUsers.forEach(user => {
            const tr = document.createElement("tr");
            
            const dateStr = user.payment_date 
              ? new Date(user.payment_date).toLocaleDateString("es-ES", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) + " hs"
              : "-";

            tr.innerHTML = `
              <td>
                <div style="font-weight: 700; color: #fff;">${user.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${user.email}</div>
              </td>
              <td style="font-family: monospace; font-weight: 600; color: var(--primary-gold);">${user.transaction_id}</td>
              <td style="color: var(--text-muted);">${dateStr}</td>
              <td style="text-align: center;">
                <div style="display: flex; gap: 8px; justify-content: center;">
                  <button class="btn-sm-action btn-gold-action" style="padding: 4px 10px; font-size: 0.75rem; background: var(--accent-green); color: #000; font-weight: 700;" onclick="ProdeApp.approvePayment('${user.email}')">Aprobar</button>
                  <button class="btn-sm-action btn-gray-action" style="padding: 4px 10px; font-size: 0.75rem; background: rgba(239,68,68,0.1); color: var(--accent-red); border-color: rgba(239,68,68,0.2);" onclick="ProdeApp.rejectPayment('${user.email}')">Rechazar</button>
                </div>
              </td>
            `;
            paymentsTbody.appendChild(tr);
          });
        } else {
          paymentsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 15px;">No hay transferencias pendientes de verificación.</td></tr>`;
        }
      } catch (e) {
        console.error("Error al obtener transferencias pendientes:", e);
        paymentsTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--accent-red); padding: 15px;">Error al conectar con la base de datos de pagos.</td></tr>`;
      }
    } else {
      paymentsPanel.style.display = "none";
    }

    const container = document.getElementById("admin-matches-container");
    container.innerHTML = "";

    const matches = await ProdeAPI.getMatches();

    const realTeamKeys = Object.keys(WORLDCUP_TEAMS).filter(key => 
      !key.includes("1") && !key.includes("2") && !key.startsWith("W_")
    );

    matches.forEach(match => {
      const teamA = WORLDCUP_TEAMS[match.teamA];
      const teamB = WORLDCUP_TEAMS[match.teamB];

      const isFinished = match.status === "FINALIZADO";

      const goalsA = isFinished ? match.result.goalsA : "";
      const goalsB = isFinished ? match.result.goalsB : "";

      let teamSelectorsHtml = "";
      if (match.stage !== "Fase de Grupos" && !isFinished) {
        let optionsA = realTeamKeys.map(k => `<option value="${k}" ${match.teamA === k ? "selected" : ""}>${WORLDCUP_TEAMS[k].name}</option>`).join("");
        let optionsB = realTeamKeys.map(k => `<option value="${k}" ${match.teamB === k ? "selected" : ""}>${WORLDCUP_TEAMS[k].name}</option>`).join("");
        
        if (!realTeamKeys.includes(match.teamA)) {
          optionsA = `<option value="${match.teamA}" selected>${teamA.name}</option>` + optionsA;
        }
        if (!realTeamKeys.includes(match.teamB)) {
          optionsB = `<option value="${match.teamB}" selected>${teamB.name}</option>` + optionsB;
        }

        teamSelectorsHtml = `
          <div style="width: 100%; margin-top: 10px; padding-top: 10px; border-top: 1px dashed rgba(255,255,255,0.06); display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="font-size: 0.75rem; color: var(--primary-gold); font-weight:700;"><i class="fa-solid fa-pen"></i> Definir Cruce:</span>
            <select class="form-input" id="admin-select-a-${match.id}" style="width: auto; padding: 4px 8px; font-size: 0.8rem; height: auto; background:#000; border-color: rgba(255,255,255,0.15);">
              ${optionsA}
            </select>
            <span style="font-size: 0.75rem; color: var(--text-muted);">vs</span>
            <select class="form-input" id="admin-select-b-${match.id}" style="width: auto; padding: 4px 8px; font-size: 0.8rem; height: auto; background:#000; border-color: rgba(255,255,255,0.15);">
              ${optionsB}
            </select>
            <button class="btn-sm-action btn-gold-action" style="padding: 4px 10px; font-size: 0.75rem;" onclick="ProdeApp.updateKnockoutTeams('${match.id}')">Definir Equipos</button>
          </div>
        `;
      }

      const adminItem = document.createElement("div");
      adminItem.className = "admin-match-item";
      adminItem.style.flexDirection = "column";
      adminItem.style.alignItems = "stretch";

      adminItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 10px;">
          <div class="admin-match-info" style="flex: 1; min-width: 250px;">
            <span class="match-stage-badge" style="font-size: 0.75rem; margin-right: 10px; background: rgba(255,255,255,0.03); padding: 2px 6px; border-radius: 4px;">${match.group} (${match.stage})</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${teamA.flag}" alt="${teamA.name}" class="admin-team-logo">
              <strong style="font-size: 0.95rem;">${teamA.name}</strong>
            </div>
            <span style="color: var(--text-muted); font-size: 0.8rem; margin: 0 4px;">vs</span>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${teamB.flag}" alt="${teamB.name}" class="admin-team-logo">
              <strong style="font-size: 0.95rem;">${teamB.name}</strong>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 15px;">
            <div class="admin-score-inputs">
              <input type="number" class="admin-score-field" id="admin-goals-a-${match.id}" value="${goalsA}" placeholder="-" min="0" ${isFinished ? "disabled" : ""}>
              <span style="font-weight:800; color: var(--text-muted);">:</span>
              <input type="number" class="admin-score-field" id="admin-goals-b-${match.id}" value="${goalsB}" placeholder="-" min="0" ${isFinished ? "disabled" : ""}>
            </div>

            <div class="admin-actions">
              ${isFinished 
                ? `<span style="color: var(--accent-green); font-size: 0.8rem; font-weight: 700; display: flex; align-items: center; gap: 5px;"><i class="fa-solid fa-circle-check"></i> Reportado</span>`
                : `<button class="btn-sm-action btn-gold-action" onclick="ProdeApp.submitAdminScore('${match.id}')"><i class="fa-solid fa-circle-play"></i> Enviar</button>`
              }
            </div>
          </div>
        </div>
        ${teamSelectorsHtml}
      `;

      container.appendChild(adminItem);
    });
  },

  async submitAdminScore(matchId) {
    const gAVal = document.getElementById(`admin-goals-a-${matchId}`).value;
    const gBVal = document.getElementById(`admin-goals-b-${matchId}`).value;

    if (gAVal === "" || gBVal === "") {
      this.showMicroNotification("Ingresa goles oficiales", "warning");
      return;
    }

    try {
      await ProdeAPI.updateMatchResult(matchId, gAVal, gBVal);
      this.showMicroNotification("API actualizó el marcador del partido", "success");
      
      // Simular efecto de confeti si el usuario activo obtuvo un acierto exacto en este partido
      const activeUser = ProdeEngine.getActiveUser();
      if (activeUser) {
        const pred = activeUser.predictions[matchId];
        if (pred && parseInt(pred.goalsA) === parseInt(gAVal) && parseInt(pred.goalsB) === parseInt(gBVal)) {
          // Acierto exacto del usuario activo! Confeti de celebración
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#d4af37", "#10b981", "#ffffff"]
          });
          this.showMicroNotification("💥 ¡Acierto Exacto! +3 puntos", "success");
        }
      }

    } catch (e) {
      this.showMicroNotification("Error al actualizar resultado", "error");
    }
  },

  async updateKnockoutTeams(matchId) {
    const selectA = document.getElementById(`admin-select-a-${matchId}`);
    const selectB = document.getElementById(`admin-select-b-${matchId}`);
    
    if (!selectA || !selectB) return;

    const valA = selectA.value;
    const valB = selectB.value;

    try {
      let matches = await ProdeAPI.getMatches();
      let match = matches.find(m => m.id === matchId);
      if (match) {
        match.teamA = valA;
        match.teamB = valB;
        ProdeAPI.saveMatches(matches);

        // Guardar en Supabase si está conectado
        const sb = ProdeAPI.getSupabaseClient();
        if (sb) {
          const { error } = await sb.from("prode_matches").upsert({
            id: matchId,
            team_a: valA,
            team_b: valB,
            status: match.status,
            goals_a: match.status === "FINALIZADO" ? match.result.goalsA : null,
            goals_b: match.status === "FINALIZADO" ? match.result.goalsB : null,
            updated_at: new Date().toISOString()
          });
          if (error) throw error;
        }

        this.showMicroNotification("Equipos de la eliminatoria actualizados con éxito", "success");
        this.refreshAppViews();
      }
    } catch (e) {
      console.error(e);
      this.showMicroNotification("Error al definir equipos", "error");
    }
  },

  // -------------------------------------------------------------
  // MÉTODOS DE SALIDA (LOGOUT)
  // -------------------------------------------------------------
  async handleLogout() {
    // Cerrar sesión en Supabase Auth (Google OAuth) si hay un cliente activo
    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        await sb.auth.signOut();
      } catch (e) {
        console.warn("Error al cerrar sesión de Supabase Auth:", e);
      }
    }
    sessionStorage.removeItem("worldcup_prode_admin_authenticated");
    ProdeEngine.logout();
    this.checkSessionFlow();
    this.showMicroNotification("Sesión cerrada", "info");
  },

  // -------------------------------------------------------------
  // ALERTA DE MICRO-NOTIFICACIONES PREMIUM
  // -------------------------------------------------------------
  showMicroNotification(message, type = "success") {
    // Buscar si ya hay un contenedor de notificaciones
    let container = document.getElementById("prode-notification-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "prode-notification-container";
      container.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 30px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(container);
    }

    // Crear el bubble de notificación
    const toast = document.createElement("div");
    toast.style.cssText = `
      padding: 14px 20px;
      border-radius: var(--border-radius-md);
      background: rgba(17, 22, 33, 0.95);
      border: 1px solid var(--bg-card-border);
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      gap: 10px;
      transform: translateX(-120%);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      backdrop-filter: blur(10px);
      pointer-events: auto;
    `;

    let icon = `<i class="fa-solid fa-circle-check" style="color: var(--accent-green);"></i>`;
    if (type === "warning") {
      icon = `<i class="fa-solid fa-circle-exclamation" style="color: var(--primary-gold);"></i>`;
      toast.style.borderColor = "rgba(212, 175, 55, 0.3)";
    } else if (type === "error") {
      icon = `<i class="fa-solid fa-circle-xmark" style="color: var(--accent-red);"></i>`;
      toast.style.borderColor = "rgba(239, 68, 68, 0.3)";
    } else if (type === "info") {
      icon = `<i class="fa-solid fa-circle-info" style="color: var(--accent-blue);"></i>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Animación de entrada
    setTimeout(() => {
      toast.style.transform = "translateX(0)";
    }, 50);

    // Animación de salida
    setTimeout(() => {
      toast.style.transform = "translateX(-120%)";
      toast.style.opacity = "0";
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3500);
  },

  // -------------------------------------------------------------
  // CONFIGURACIÓN Y MÉTODOS DE BASE DE DATOS SUPABASE
  // -------------------------------------------------------------
  async saveAdminDbConfig() {
    const urlInput = document.getElementById("admin-sb-url");
    const keyInput = document.getElementById("admin-sb-key");
    let url = urlInput.value.trim();
    const key = keyInput.value.trim();

    const btn = document.querySelector("#admin-db-config-form button[type='submit']");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Conectando...`;

    if (!url || !key) {
      localStorage.removeItem("worldcup_prode_supabase_url");
      localStorage.removeItem("worldcup_prode_supabase_key");
      ProdeAPI._supabaseClient = null;
      this.showMicroNotification("Desconectado de la nube. Modo Demo Local activo.", "info");
      
      btn.disabled = false;
      btn.innerHTML = originalText;
      
      await ProdeEngine.syncActiveUser();
      this.refreshAppViews();
      return;
    }

    // Limpiar URL: eliminar /rest/v1 duplicado y barras finales
    if (url.endsWith("/rest/v1/")) url = url.slice(0, -9);
    else if (url.endsWith("/rest/v1")) url = url.slice(0, -8);
    if (url.endsWith("/")) url = url.slice(0, -1);

    try {
      const client = supabase.createClient(url, key);
      
      // Consultar tabla prode_config para probar conexión
      const { error } = await client.from("prode_config").select("id").limit(1);
      
      if (error && !error.message.includes("relation \"prode_config\" does not exist")) {
        throw error;
      }

      localStorage.setItem("worldcup_prode_supabase_url", url);
      localStorage.setItem("worldcup_prode_supabase_key", key);
      ProdeAPI._supabaseClient = client;

      this.showMicroNotification("¡Conexión a Supabase establecida con éxito!", "success");
      
      await ProdeEngine.syncActiveUser();
      await ProdeEngine.syncOrganizerConfig();
      
      this.refreshAppViews();
    } catch (e) {
      console.error(e);
      this.showMicroNotification("Error al conectar. Verifica credenciales y CORS en Supabase.", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  },

  showSqlScriptModal() {
    const modal = document.getElementById("mp-sql-script-modal");
    const codePre = document.getElementById("supabase-sql-code");
    
    const sqlText = `-- 1. Tabla de Configuración de Cobros del Organizador
CREATE TABLE IF NOT EXISTS prode_config (
  id INT PRIMARY KEY DEFAULT 1,
  alias TEXT DEFAULT 'prode.mundial.2026',
  cvu TEXT DEFAULT '0000003100019283746501',
  holder TEXT DEFAULT 'Juan Pérez (Organizador)',
  payment_link TEXT DEFAULT '',
  commission INT DEFAULT 20,
  admin_password_hash TEXT DEFAULT '',
  entry_cost INT DEFAULT 1000
);

-- Insertar configuración inicial predeterminada
INSERT INTO prode_config (id, alias, cvu, holder, payment_link, commission, admin_password_hash, entry_cost)
VALUES (1, 'prode.mundial.2026', '0000003100019283746501', 'Juan Pérez (Organizador)', '', 20, '', 1000)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla de Usuarios del Prode
CREATE TABLE IF NOT EXISTS prode_users (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  payment_date TIMESTAMPTZ,
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de Predicciones de Goles
CREATE TABLE IF NOT EXISTS prode_predictions (
  id TEXT PRIMARY KEY, -- Formato: email:match_id
  user_email TEXT REFERENCES prode_users(email) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  goals_a INT NOT NULL,
  goals_b INT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Partidos y Resultados Reales Oficiales
CREATE TABLE IF NOT EXISTS prode_matches (
  id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'PENDIENTE',
  goals_a INT,
  goals_b INT,
  team_a TEXT,
  team_b TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- POLITICAS DE SEGURIDAD RLS (Row Level Security) (A2)
-- =========================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE prode_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE prode_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prode_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prode_matches ENABLE ROW LEVEL SECURITY;

-- 1. Políticas de Configuración (Lectura para todos, Edición liberada en demo)
CREATE POLICY "Permitir lectura publica de config" ON prode_config FOR SELECT USING (true);
CREATE POLICY "Permitir edicion de config" ON prode_config FOR ALL USING (true);

-- 2. Políticas de Usuarios (Lectura pública para rankings, perfil propio para edición)
CREATE POLICY "Permitir lectura publica de usuarios" ON prode_users FOR SELECT USING (true);
CREATE POLICY "Permitir registro de usuarios" ON prode_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion de usuario propio" ON prode_users FOR UPDATE USING (true);

-- 3. Políticas de Predicciones (Lectura para ver puntos, inserción/edición para juego)
CREATE POLICY "Permitir lectura publica de predicciones" ON prode_predictions FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de predicciones propias" ON prode_predictions FOR ALL USING (true);

-- 4. Políticas de Partidos (Lectura general de resultados, edición autorizada)
CREATE POLICY "Permitir lectura publica de partidos" ON prode_matches FOR SELECT USING (true);
CREATE POLICY "Permitir gestion de partidos" ON prode_matches FOR ALL USING (true);`;

    codePre.textContent = sqlText;
    modal.classList.add("active");
  },

  closeSqlScriptModal() {
    document.getElementById("mp-sql-script-modal").classList.remove("active");
  },

  copySqlScriptCode() {
    const codePre = document.getElementById("supabase-sql-code");
    navigator.clipboard.writeText(codePre.textContent).then(() => {
      this.showMicroNotification("¡Script SQL + RLS copiado con éxito!", "success");
    }).catch(() => {
      this.showMicroNotification("Error al copiar script", "error");
    });
  },

  async approvePayment(email) {
    if (!confirm(`¿Estás seguro de que quieres aprobar el pago de inscripción para ${email}?`)) return;
    
    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb
          .from("prode_users")
          .update({ paid: true })
          .eq("email", email);
        
        if (error) throw error;
        
        this.addAdminLog(`Inscripción aprobada: ${email}`);
        this.showMicroNotification(`¡Inscripción de ${email} aprobada con éxito!`, "success");
        await ProdeEngine.syncActiveUser();
        this.refreshAppViews();
      } catch (e) {
        console.error(e);
        this.showMicroNotification("Error al aprobar pago", "error");
      }
    }
  },

  async rejectPayment(email) {
    if (!confirm(`¿Estás seguro de que quieres rechazar el pago de ${email}? El usuario deberá registrar sus datos de transferencia nuevamente.`)) return;
    
    const sb = ProdeAPI.getSupabaseClient();
    if (sb) {
      try {
        const { error } = await sb
          .from("prode_users")
          .update({
            transaction_id: null,
            payment_date: null,
            payment_method: null
          })
          .eq("email", email);
        
        if (error) throw error;
        
        this.addAdminLog(`Inscripción rechazada: ${email}`);
        this.showMicroNotification(`Pago de ${email} rechazado.`, "info");
        await ProdeEngine.syncActiveUser();
        this.refreshAppViews();
      } catch (e) {
        console.error(e);
        this.showMicroNotification("Error al rechazar pago", "error");
      }
    }
  },

  // -------------------------------------------------------------
  // MEJORAS DE FASE 7 IMPLEMENTADAS DINÁMICAMENTE
  // -------------------------------------------------------------

  // A1. Validar o registrar la contraseña de administrador
  async verifyAdminPin() {
    const input = document.getElementById("admin-pin-input");
    if (!input) return;
    
    const enteredPass = input.value.trim();
    if (!enteredPass) return;
    
    const savedPin = ProdeEngine.getOrganizerConfig().adminPasswordHash;
    const isValidHash = savedPin && savedPin.length === 64 && /^[0-9a-fA-F]+$/.test(savedPin);
    
    if (!isValidHash) {
      if (enteredPass.length < 8) {
        this.showMicroNotification("La contraseña debe tener al menos 8 caracteres.", "warning");
        return;
      }
      const hashed = await this.hashPassword(enteredPass);
      await ProdeEngine.saveAdminPassword(hashed);
      sessionStorage.setItem("worldcup_prode_admin_authenticated", "true");
      this.addAdminLog("Contraseña de administrador creada y activada.");
      this.fireConfetiEffect();
      this.showMicroNotification("¡Contraseña configurada y desbloqueada!", "success");
      this.refreshAppViews();
    } else {
      const enteredHash = await this.hashPassword(enteredPass);
      if (enteredHash === savedPin) {
        sessionStorage.setItem("worldcup_prode_admin_authenticated", "true");
        this.addAdminLog("Panel desbloqueado mediante contraseña.");
        this.showMicroNotification("¡Desbloqueo correcto!", "success");
        this.refreshAppViews();
      } else {
        this.showMicroNotification("Contraseña de seguridad incorrecta.", "error");
        input.value = "";
        input.focus();
      }
    }
  },

  // B1. Renderizar tabla de grupos en vivo
  async renderStandings() {
    const container = document.getElementById("groups-standings-container");
    if (!container) return;
    container.innerHTML = "";

    const GROUP_MAPPING = {
      "Grupo A": ["MX", "ZA", "KR", "CZ"],
      "Grupo B": ["CA", "BA", "QA", "CH"],
      "Grupo C": ["BR", "MA", "HT", "SC"],
      "Grupo D": ["US", "PY", "AU", "TR"],
      "Grupo E": ["DE", "CW", "CI", "EC"],
      "Grupo F": ["NL", "JP", "SE", "TN"],
      "Grupo G": ["BE", "EG", "IR", "NZ"],
      "Grupo H": ["ES", "CV", "SA", "UY"],
      "Grupo I": ["FR", "SN", "IQ", "NO"],
      "Grupo J": ["AT", "JO", "AR", "DZ"],
      "Grupo K": ["PT", "CD", "UZ", "CO"],
      "Grupo L": ["EN", "HR", "GH", "PA"]
    };

    const matches = await ProdeAPI.getMatches();

    Object.entries(GROUP_MAPPING).forEach(([groupName, teamCodes]) => {
      const standings = {};
      teamCodes.forEach(code => {
        standings[code] = { code, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, gd: 0, pts: 0 };
      });

      const groupMatches = matches.filter(m => m.stage === "Fase de Grupos" && m.group === groupName && m.status === "FINALIZADO");
      
      groupMatches.forEach(match => {
        const teamA = match.teamA;
        const teamB = match.teamB;
        const gA = parseInt(match.result.goalsA);
        const gB = parseInt(match.result.goalsB);

        if (standings[teamA] && standings[teamB]) {
          standings[teamA].pj++;
          standings[teamB].pj++;
          standings[teamA].gf += gA;
          standings[teamA].gc += gB;
          standings[teamB].gf += gB;
          standings[teamB].gc += gA;

          if (gA > gB) {
            standings[teamA].pg++;
            standings[teamA].pts += 3;
            standings[teamB].pp++;
          } else if (gA < gB) {
            standings[teamB].pg++;
            standings[teamB].pts += 3;
            standings[teamA].pp++;
          } else {
            standings[teamA].pe++;
            standings[teamA].pts += 1;
            standings[teamB].pe++;
            standings[teamB].pts += 1;
          }
        }
      });

      Object.values(standings).forEach(team => {
        team.gd = team.gf - team.gc;
      });

      const sortedTeams = Object.values(standings).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });

      const card = document.createElement("div");
      card.className = "glass-panel group-card staggered-fade-in";
      
      let rowsHtml = "";
      sortedTeams.forEach((team, idx) => {
        const teamData = WORLDCUP_TEAMS[team.code] || { name: team.code, flag: "" };
        const isQualifying = idx < 2;
        
        rowsHtml += `
          <tr class="${isQualifying ? "standings-row-qualify" : ""}">
            <td style="text-align:center; font-weight:700; color:${isQualifying ? "var(--accent-green)" : "var(--text-muted)"}">${idx + 1}</td>
            <td>
              <div class="standings-team-cell">
                <img src="${teamData.flag}" alt="${teamData.name}" class="standings-flag">
                <span class="bracket-team-name" style="font-size:0.8rem; font-weight:600;">${teamData.name}</span>
              </div>
            </td>
            <td class="standings-num-cell">${team.pj}</td>
            <td class="standings-num-cell">${team.pg}</td>
            <td class="standings-num-cell">${team.pe}</td>
            <td class="standings-num-cell">${team.pp}</td>
            <td class="standings-num-cell">${team.gf}:${team.gc}</td>
            <td class="standings-num-cell">${team.gd > 0 ? "+" + team.gd : team.gd}</td>
            <td class="standings-pts-cell">${team.pts}</td>
          </tr>
        `;
      });

      card.innerHTML = `
        <div class="group-card-header">
          <span class="group-card-title">${groupName}</span>
          <span style="font-size:0.75rem; color:var(--text-muted); font-weight:700;"><i class="fa-solid fa-ranking-star"></i> Posiciones</span>
        </div>
        <table class="standings-table">
          <thead>
            <tr>
              <th style="width:25px; text-align:center;">#</th>
              <th>Equipo</th>
              <th style="text-align:center; width:30px;">PJ</th>
              <th style="text-align:center; width:20px;">G</th>
              <th style="text-align:center; width:20px;">E</th>
              <th style="text-align:center; width:20px;">P</th>
              <th style="text-align:center; width:45px;">Goles</th>
              <th style="text-align:center; width:25px;">DG</th>
              <th style="text-align:center; width:35px;">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
      container.appendChild(card);
    });
  },

  // E2. Renderizado del Bracket de eliminatorias visual
  async renderBracketVisual() {
    const container = document.getElementById("matches-render-container");
    if (!container) return;
    container.innerHTML = "";

    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    const matches = await ProdeAPI.getMatches();
    const isStageLocked = ProdeEngine.isStageLocked("Bracket Visual");

    const rounds = {
      "Octavos de Final": ["o1", "o2", "o3", "o4"],
      "Semifinales": ["s1", "s2"],
      "Gran Final": ["f1"]
    };

    const wrapper = document.createElement("div");
    wrapper.className = "bracket-wrapper staggered-fade-in";

    Object.entries(rounds).forEach(([roundName, matchIds]) => {
      const col = document.createElement("div");
      col.className = "bracket-round";
      
      const roundTitle = document.createElement("div");
      roundTitle.className = "bracket-round-title";
      roundTitle.textContent = roundName;
      col.appendChild(roundTitle);

      matchIds.forEach(matchId => {
        const match = matches.find(m => m.id === matchId);
        if (!match) return;

        const teamA = WORLDCUP_TEAMS[match.teamA] || { name: match.teamA, flag: "https://flagcdn.com/un.svg" };
        const teamB = WORLDCUP_TEAMS[match.teamB] || { name: match.teamB, flag: "https://flagcdn.com/un.svg" };

        const userPred = activeUser.predictions[match.id] || { goalsA: null, goalsB: null };
        const isFinished = match.status === "FINALIZADO";
        const canEdit = !isFinished && !isStageLocked;

        const dateObj = new Date(match.date);
        const dateFormatted = dateObj.toLocaleDateString("es-ES", { day: "numeric", month: "short" }) + " - " + dateObj.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) + " hs";

        let winAClass = "";
        let winBClass = "";
        if (isFinished) {
          if (match.result.goalsA > match.result.goalsB) winAClass = "bracket-winner-row";
          else if (match.result.goalsA < match.result.goalsB) winBClass = "bracket-winner-row";
        }

        const matchCard = document.createElement("div");
        matchCard.className = "bracket-match-card";
        matchCard.innerHTML = `
          <div class="bracket-match-header">
            <span>${match.group || "Cruces"}</span>
            <span>${dateFormatted}</span>
          </div>
          
          <div class="bracket-team-row ${winAClass}" style="border-radius:4px; padding: 4px 8px;">
            <div class="bracket-team-info">
              <img src="${teamA.flag}" alt="${teamA.name}" class="bracket-team-flag">
              <span class="bracket-team-name">${teamA.name}</span>
            </div>
            <div class="bracket-team-score" style="display:flex; align-items:center;">
              ${isFinished ? `<span style="color:var(--text-muted); font-size:0.75rem; margin-right:8px; font-weight:500;">(${match.result.goalsA})</span>` : ""}
              <input 
                type="number" 
                class="goals-field match-pred-a" 
                id="pred-a-${match.id}" 
                value="${userPred.goalsA !== null && userPred.goalsA !== undefined ? userPred.goalsA : ""}" 
                placeholder="-" 
                min="0"
                style="width: 32px; height: 26px; padding: 2px; font-size: 0.85rem; border-radius: 4px; text-align: center;"
                ${!canEdit ? "disabled" : ""}
                data-match-id="${match.id}"
              >
            </div>
          </div>

          <div class="bracket-versus-line"></div>

          <div class="bracket-team-row ${winBClass}" style="border-radius:4px; padding: 4px 8px;">
            <div class="bracket-team-info">
              <img src="${teamB.flag}" alt="${teamB.name}" class="bracket-team-flag">
              <span class="bracket-team-name">${teamB.name}</span>
            </div>
            <div class="bracket-team-score" style="display:flex; align-items:center;">
              ${isFinished ? `<span style="color:var(--text-muted); font-size:0.75rem; margin-right:8px; font-weight:500;">(${match.result.goalsB})</span>` : ""}
              <input 
                type="number" 
                class="goals-field match-pred-b" 
                id="pred-b-${match.id}" 
                value="${userPred.goalsB !== null && userPred.goalsB !== undefined ? userPred.goalsB : ""}" 
                placeholder="-" 
                min="0"
                style="width: 32px; height: 26px; padding: 2px; font-size: 0.85rem; border-radius: 4px; text-align: center;"
                ${!canEdit ? "disabled" : ""}
              >
            </div>
          </div>

          ${isFinished 
            ? `<div style="text-align:right; margin-top:8px;">
                 <span class="pts-earned-badge ${ProdeEngine.calculateMatchPoints(userPred, match) === 0 ? "zero-pts" : ""}" style="font-size:0.7rem; padding: 3px 6px;">
                   +${ProdeEngine.calculateMatchPoints(userPred, match)} pts
                 </span>
               </div>`
            : ""
          }
        `;
        col.appendChild(matchCard);
      });
      wrapper.appendChild(col);
    });

    container.appendChild(wrapper);

    if (!isStageLocked) {
      const hint = document.createElement("p");
      hint.style.cssText = "color: var(--text-muted); font-size: 0.8rem; text-align: center; margin-top: 15px; width:100%; font-weight: 500;";
      hint.innerHTML = `<i class="fa-solid fa-circle-info"></i> Puedes completar los marcadores en el bracket y presionar **Guardar Pronósticos** abajo.`;
      container.appendChild(hint);
    }
  },

  // B3. Cuenta regresiva al próximo partido del mundial
  startCountdownTimer() {
    const display = document.getElementById("countdown-timer-display");
    if (!display) return;

    const updateTimer = async () => {
      const matches = await ProdeAPI.getMatches();
      const currentTime = ProdeEngine.getCurrentTime();

      const upcoming = matches
        .filter(m => m.status === "PENDIENTE")
        .map(m => ({ ...m, dateObj: new Date(m.date) }))
        .filter(m => m.dateObj > currentTime)
        .sort((a, b) => a.dateObj - b.dateObj)[0];

      if (!upcoming) {
        display.innerHTML = `<span style="color: var(--accent-green);"><i class="fa-solid fa-trophy"></i> Copa Concluida</span>`;
        return;
      }

      const diff = upcoming.dateObj - currentTime;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timerText = "";
      if (days > 0) timerText += `${days}d `;
      timerText += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      const teamA = WORLDCUP_TEAMS[upcoming.teamA]?.name || upcoming.teamA;
      const teamB = WORLDCUP_TEAMS[upcoming.teamB]?.name || upcoming.teamB;

      display.innerHTML = `
        <div style="font-size:1.15rem; font-weight:800; color:#fff; text-shadow:0 0 10px rgba(255,255,255,0.1);">${timerText}</div>
        <div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">${teamA} vs ${teamB}</div>
      `;
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  },

  // Cuenta regresiva para la sincronización automática de GitHub Actions (cada 10 min)
  startSyncCountdownTimer() {
    const display = document.getElementById("sync-countdown-timer-display");
    if (!display) return;

    const updateSyncTimer = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      // Cada 10 minutos (en los minutos: 0, 10, 20, 30, 40, 50)
      const currentSeconds = minutes * 60 + seconds;
      const intervalSeconds = 600; // 10 minutos en segundos
      const remainingSeconds = intervalSeconds - (currentSeconds % intervalSeconds);

      const min = Math.floor(remainingSeconds / 60);
      const sec = remainingSeconds % 60;

      const timerText = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

      display.innerHTML = `
        <div style="font-size:1.15rem; font-weight:800; color:#fff; text-shadow:0 0 10px rgba(255,255,255,0.1);">${timerText}</div>
        <div style="font-size:0.65rem; color:var(--text-muted); margin-top:2px;">Autosincronización en la nube</div>
      `;
    };

    updateSyncTimer();
    setInterval(updateSyncTimer, 1000);
  },

  // B4. Suscribirse en Realtime a Supabase para notificaciones
  setupRealtimeSubscription() {
    const sb = ProdeAPI.getSupabaseClient();
    if (!sb) return;

    try {
      sb.channel("live-prode-matches")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "prode_matches" }, (payload) => {
          const match = payload.new;
          if (match && match.status === "FINALIZADO") {
            const teamA = WORLDCUP_TEAMS[match.team_a]?.name || match.team_a;
            const teamB = WORLDCUP_TEAMS[match.team_b]?.name || match.team_b;
            
            // Toast de gol oficial
            this.showMicroNotification(`⚽ ¡FINAL! Oficial: ${teamA} ${match.goals_a} - ${match.goals_b} ${teamB}`, "info");
            
            // Sincronizar usuario y refrescar
            ProdeEngine.syncActiveUser().then(() => {
              this.refreshAppViews();
            });
          }
        })
        .subscribe();
    } catch (e) {
      console.error("Fallo al establecer realtime de Supabase:", e);
    }
  },

  // C2. Compartir estadísticas y predicciones por WhatsApp
  async sharePredictions(type) {
    const activeUser = ProdeEngine.getActiveUser();
    if (!activeUser) return;

    const boardData = await ProdeEngine.getLeaderboard();
    const rankIndex = boardData.rankings.findIndex(r => r.email === activeUser.email);
    
    const matches = await ProdeAPI.getMatches();
    let points = 0;
    matches.forEach(match => {
      if (match.status === "FINALIZADO") {
        const pred = activeUser.predictions[match.id];
        if (pred) {
          points += ProdeEngine.calculateMatchPoints(pred, match);
        }
      }
    });

    const rankText = activeUser.paid && rankIndex !== -1 ? `puesto #${rankIndex + 1} de la clasificación` : "pozo de premios";
    const shareText = `🏆 PRODE MUNDIAL 2026 🏆\n\n¡Estoy compitiendo en el Prode Oficial del Mundial 2026!\nLlevo acumulados ${points} puntos y estoy en el ${rankText}. ⚽💥\n\n¿Te animas a ganarme? ¡Regístrate, ingresa tus pronósticos y súmate al pozo! 🤑👇`;

    if (type === "whatsapp") {
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(url, "_blank");
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        this.showMicroNotification("¡Texto de invitación copiado con éxito!", "success");
      }).catch(() => {
        this.showMicroNotification("Error al copiar texto", "error");
      });
    }
  },

  // D1. Exportar Leaderboard a CSV
  async exportLeaderboardCsv() {
    const boardData = await ProdeEngine.getLeaderboard();
    if (!boardData || boardData.rankings.length === 0) {
      this.showMicroNotification("No hay clasificaciones para exportar.", "warning");
      return;
    }

    let csvContent = "\ufeff"; // BOM para soportar tildes y eñes
    csvContent += "Puesto,Nombre,Email,Exactos (3 pts),Parciales (1 pt),Puntos Totales\n";

    boardData.rankings.forEach((player, idx) => {
      csvContent += `${idx + 1},"${player.name}","${player.email}",${player.exactHits},${player.partialHits},${player.points}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "tabla-posiciones-prode-2026.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.addAdminLog("Leaderboard exportado a CSV.");
    this.showMicroNotification("Leaderboard CSV descargado correctamente", "success");
  },

  // D2. Logs de actividad administrativa de sesión
  addAdminLog(message) {
    const timeStr = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const entry = `[${timeStr}] ${message}`;
    
    let logs = JSON.parse(sessionStorage.getItem("worldcup_prode_admin_logs") || "[]");
    logs.unshift(entry);
    
    if (logs.length > 50) logs = logs.slice(0, 50);
    
    sessionStorage.setItem("worldcup_prode_admin_logs", JSON.stringify(logs));
    this.renderAdminLogs();
  },

  renderAdminLogs() {
    const container = document.getElementById("admin-logs-container");
    if (!container) return;
    
    const logs = JSON.parse(sessionStorage.getItem("worldcup_prode_admin_logs") || "[]");
    if (logs.length === 0) {
      container.innerHTML = `<div style="color: #555;">-- Sesión iniciada: Esperando eventos... --</div>`;
      return;
    }
    
    container.innerHTML = logs.map(log => {
      let style = "color: var(--text-muted);";
      if (log.includes("aprobada") || log.includes("PIN") || log.includes("creado") || log.includes("Contraseña") || log.includes("contraseña")) {
        style = "color: var(--accent-green); font-weight:700;";
      } else if (log.includes("rechazada") || log.includes("Reinicio")) {
        style = "color: var(--accent-red); font-weight:700;";
      }
      return `<div style="${style}">${log}</div>`;
    }).join("");
  },

  async hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  },

  // -------------------------------------------------------------
  // AUTENTICACIÓN CON GOOGLE OAUTH (SUPABASE)
  // -------------------------------------------------------------

  // Inicia el flujo de Google Sign-In con Supabase Auth
  async handleGoogleLogin() {
    if (window.location.protocol === "file:") {
      this.showMicroNotification("No se puede iniciar sesión con Google desde un archivo local (file://). Debes usar tu URL de Vercel o un servidor local (localhost).", "error");
      return;
    }

    const sb = ProdeAPI.getSupabaseClient();
    if (!sb) {
      this.showMicroNotification("Conectá la base de datos Supabase primero (Panel de Admin → Base de Datos en la Nube).", "warning");
      return;
    }

    const btn = document.getElementById("btn-google-login");
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Redirigiendo a Google...`;
    }

    try {
      let redirectUrl = window.location.origin + window.location.pathname;
      if (redirectUrl.endsWith("/")) redirectUrl = redirectUrl.slice(0, -1);

      const { error } = await sb.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      if (error) throw error;
      // El navegador se redirige automáticamente a Google
    } catch (e) {
      console.error("Error al iniciar Google Sign-In:", e);
      this.showMicroNotification("Error al conectar con Google. Intenta de nuevo.", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg class="google-icon" viewBox="0 0 24 24" width="22" height="22"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Iniciar sesión con Google`;
      }
    }
  },

  // Procesa la redirección de callback de Google OAuth
  async handleSupabaseAuthRedirect() {
    const sb = ProdeAPI.getSupabaseClient();
    if (!sb) return;

    try {
      // Detectar si hay un fragmento de hash con tokens de Supabase
      const hash = window.location.hash;
      if (hash && (hash.includes('access_token') || hash.includes('error'))) {
        // Supabase JS v2 procesa el hash automáticamente al llamar getSession
      }

      const { data: { session }, error } = await sb.auth.getSession();
      if (error) {
        console.warn("Error al obtener sesión de Supabase Auth:", error);
        return;
      }

      if (session && session.user) {
        const email = session.user.email;
        const name = session.user.user_metadata?.full_name || session.user.user_metadata?.name || null;

        console.log("Sesión OAuth detectada para:", email, name);

        // Registrar/sincronizar usuario en el PRODE
        await ProdeEngine.loginUserAfterOAuth(email, name);
        await ProdeEngine.syncActiveUser();

        // Limpiar el hash de la URL para que no quede visible
        if (window.location.hash.includes('access_token')) {
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }

        this.showMicroNotification(`¡Bienvenido/a, ${name || email}!`, "success");
      }
    } catch (e) {
      console.error("Error procesando redirección OAuth:", e);
    }
  },

  // Alterna entre Google Sign-In y el formulario clásico de admin
  toggleAdminLogin(event) {
    if (event) event.preventDefault();

    const googleSection = document.getElementById("google-login-section");
    const loginForm = document.getElementById("login-form");
    const divider = document.getElementById("login-divider");
    const toggleLink = document.getElementById("btn-toggle-admin-login");

    if (loginForm.style.display === "none") {
      // Mostrar formulario de admin
      loginForm.style.display = "block";
      divider.style.display = "flex";
      googleSection.style.display = "none";
      toggleLink.innerHTML = `<i class="fa-solid fa-arrow-left"></i> Volver a Google Sign-In`;
    } else {
      // Volver a Google Sign-In
      loginForm.style.display = "none";
      divider.style.display = "none";
      googleSection.style.display = "block";
      toggleLink.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Ingreso de Administrador`;
    }
  }
};
