# Reservate

Panel operativo para administrar clubes deportivos, canchas y reservas.

## Requisitos

- Node.js compatible con el `packageManager` del repo
- Docker para levantar MongoDB local

## Puesta en marcha

1. Revisá los ejemplos de entorno:
   - `apps/backend/.env.example` para la API.
   - `apps/frontend/.env.local.example` para el frontend.
2. Levantá MongoDB:

```bash
docker compose up -d
```

3. Instalá dependencias y cargá datos iniciales:

```bash
npm install
npm run db:seed
```

4. Iniciá frontend y backend:

```bash
npm run dev
```

El frontend corre en `http://localhost:3000` y el backend en `http://localhost:3001`.

## Scripts útiles

- `npm run dev`: inicia el monorepo en modo desarrollo.
- `npm run build`: compila frontend y backend.
- `npm run lint`: ejecuta ESLint.
- `npm run test`: ejecuta tests del backend.
- `npm run db:seed`: reinicia datos demo de clubes y canchas.
