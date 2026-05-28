# 🌌 Reservate

**Reservate** es una plataforma operativa ultra-premium y moderna con diseño translúcido (Glassmorphism) diseñada específicamente para la administración de clubes deportivos, canchas y reservas en tiempo real. 

El sistema cuenta con un monorepo altamente escalable estructurado con **TurboRepo**, combinando un backend robusto en **NestJS** y un frontend de última generación en **Next.js** impulsado por Tailwind CSS.

---

## 🎨 Principios de Diseño y Estética Ultra-Premium

La interfaz de administración de **Reservate** ha sido diseñada bajo estrictas directrices estéticas inspiradas en iOS, Playtomic y Airbnb:
- **Glassmorphism de Alta Fidelidad:** Paneles translúcidos (`backdrop-blur-md` a `xl`) sobre fondos oscuros profundos con globos de luz ambient vibrantes (Verde Neón y Violeta) flotando sutilmente en el fondo.
- **Bordes y Biseles Cristalin:** Reemplazo de bordes opacos por biseles translúcidos (`border-white/5` o `border-white/10`) y estados de foco activos iluminados en verde neón (`#39FF14`).
- **Micro-interacciones Fluidas:** Transiciones de hover dinámicas con curvas `cubic-bezier` que añaden relieve, escala suave y un brillo neón sutil.
- **Menús Contextuales Inteligentes:** Los menús de acciones contextuales detectan dinámicamente el borde de la pantalla (viewport); si el espacio inferior es menor a 280px (ej. al final de la agenda), se despliegan automáticamente hacia arriba de forma fluida para evitar solaparse o cortarse.

---

## ⚙️ Características Principales

### 📅 Control Operativo Avanzado (Dashboard)
- **Grilla de Turnos (Scheduler Grid):** Vista interactiva en formato agenda horaria (por cancha) con ranuras rápidas para agregar reservas (`NewReservationButton`).
- **Vista de Lista Inteligente:** Alternancia de vista rápida estilo slider para listar las reservas del día con filtros de fecha y club.
- **Estados Visuales en Tiempo Real:** Colores neón selectivos basados en el estado del pago ("DEBE", "SEÑADO", "PAGADO") y la confirmación.

### 🔁 Gestión Completa de Turnos Fijos (Recurrentes)
- **Turnos Fijos Indeterminados:** Los turnos fijos no tienen fecha de fin restrictiva, permitiendo que la agenda fluya sin inconvenientes.
- **Bloques Mensuales con Pago del Total:** El sistema agrupa los turnos fijos en bloques de 4 semanas. 
- **10% de Descuento Automático:** Al abonar el total del mes corriente (bloque de 4 semanas), el sistema aplica automáticamente un 10% de descuento sobre el precio de alquiler.
- **Renovación Automática en Cascada:** Al registrarse el pago del total del bloque actual, el sistema reserva de forma automática las siguientes 4 semanas en estado 'pending' para asegurar el espacio.
- **Edición de Nombre con Propagación Futura:** Permite corregir erratas en el nombre del jugador. Si el turno es fijo, el cambio se propaga de forma inteligente a esa fecha y a todas las futuras citas programadas en la serie.

### 🛡️ Seguridad y Roles de Staff
- **Administrador General:** Acceso a toda la suite y configuraciones sensibles del sistema.
- **Staff (Operador del Club):** Acceso al panel de reservas y facturación diaria, con bloqueo automático del menú de **Configuración de Sedes** para proteger claves API privadas y configuraciones de Mercado Pago.

---

## 🏗️ Arquitectura del Monorepo

El proyecto está organizado de la siguiente manera:
```text
reservate/
├── apps/
│   ├── frontend/         # Aplicación web de administración (Next.js con App Router)
│   └── backend/          # API REST corporativa (NestJS con Mongoose/MongoDB)
├── packages/
│   ├── shared-types/     # Tipados TypeScript comunes para Front y Back
│   └── config/           # Configuraciones compartidas (eslint, tsconfig)
├── render.yaml           # Especificación de infraestructura para Render Blueprints
└── docker-compose.yml    # MongoDB local listo para desarrollo
```

---

## 🚀 Despliegue en Render (Backend)

Hacé clic en el siguiente botón para desplegar automáticamente el **Backend (NestJS)** con su base de datos MongoDB en Render:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/jmasciar82/reservate)

---

## 🛠️ Puesta en Marcha Local

### Requisitos Previos
- **Node.js** v18 o superior
- **Docker & Docker Compose** (para la base de datos)

### Instrucciones de Instalación

1. **Clonar el repositorio y configurar variables de entorno:**
   Crea y edita los archivos de configuración local en base a las plantillas `.example`:
   - En **apps/backend/**: Copia `.env.example` como `.env`
   - En **apps/frontend/**: Copia `.env.local.example` como `.env.local`

2. **Levantar base de datos local (MongoDB):**
   ```bash
   docker compose up -d
   ```

3. **Instalar dependencias y poblar la base de datos:**
   ```bash
   npm install
   npm run db:seed
   ```
   *Nota: `db:seed` creará clubes, sedes y canchas por defecto para empezar a operar inmediatamente.*

4. **Iniciar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   - El **Frontend** estará disponible en: `http://localhost:3000`
   - El **Backend (API)** estará disponible en: `http://localhost:3001`

---

## 📜 Scripts Útiles del Monorepo

- `npm run dev`: Inicia todo el monorepo en modo desarrollo.
- `npm run build`: Compila frontend, backend y dependencias de tipos de forma estricta.
- `npm run lint`: Ejecuta el análisis estático de código en todo el monorepo.
- `npm run test`: Ejecuta los tests unitarios y de integración del backend.
- `npm run db:seed`: Resetea y vuelve a inyectar la información demo a MongoDB (clubes, sedes y canchas).
