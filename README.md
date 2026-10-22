# Atitlán Rest. & Café — Menú digital con pedidos por QR

Menú digital para un restaurante en San Juan La Laguna, Lago de Atitlán (Guatemala): el cliente escanea el QR de su mesa, pide desde el celular y la orden llega en tiempo real a la pantalla de cocina.

> **Estado: demo.** Los platillos, precios y datos del local son de ejemplo. La construcción formal sigue la puerta de aprobación del kit (`kit-agentes-menu-qr/.../docs/APROBACIONES.md`).

## Contenido

| Carpeta | Qué es |
|---|---|
| `demo-menu-qr/app` | App en **Expo / React Native** (web + móvil): menú del cliente, pantalla de cocina, panel de mesas |
| `demo-menu-qr/backend` | API en **Node + Express + PostgreSQL**: menú, órdenes con idempotencia, tiempo real (SSE), auth por rol |
| `demo-menu-qr/nginx`, `docker-compose.yml` | Entorno local con Postgres + API + nginx |
| `kit-agentes-menu-qr` | Kit de agentes de diseño (requisitos, arquitectura, diseño UI, etc.) y reglas del proyecto |
| `fotos` | Fotos originales del local y de platillos |

## Correr el demo en local

```bash
# API (sin DATABASE_URL usa PostgreSQL en memoria con PGlite)
cd demo-menu-qr/backend
npm install
npm start            # http://localhost:4000/api/health
npm run smoke        # pruebas de humo (con el API corriendo)

# App web
cd demo-menu-qr/app
npm install
npx expo start --web
```

Con Docker: `cd demo-menu-qr && docker compose up --build` → API en http://localhost:8080/api/health.

Usuarios de demo: `admin/1234`, `cocina/1111`, `mesero/2222`. Mesa de prueba: `/m/demo-m4-t5n1`.

## Despliegue previsto

- **Backend:** Railway (Dockerfile + `railway.json`), PostgreSQL de Railway.
- **Frontend:** Vercel (`vercel.json`, `npx expo export -p web`).
- **Fotos de platillos:** Supabase Storage (bucket público); en el demo las sirve el API en `/fotos`.
