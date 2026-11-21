# FITLOOM Backend Architecture & Route Handlers

All FITLOOM server-side application logic, database migrations, and route handlers are integrated inside the Next.js application workspace (`frontend/`).

## Project Layout

- **API Route Handlers:** [`frontend/src/app/api/`](../frontend/src/app/api/)
  - `GET /api/health` - Health check & DB connectivity
  - `GET`, `PATCH /api/users/me` - Profile & session capability management
  - `GET`, `PUT /api/body-profile` - Strict anthropometric profile management
  - `ALL /api/auth/[...all]` - Better Auth authentication endpoints
  - Future domain routes: catalog, checkout, orders, partners, customfit, avatar engine proxy
- **Server-Only Modules:** [`frontend/src/server/`](../frontend/src/server/)
  - `env.ts` - Zod-validated lazy server environment configuration
  - `db/` - Drizzle ORM client, Neon serverless HTTP driver, and schema definition
  - `auth/` - Better Auth server configuration and capability/role guards
  - `api/` - Universal route handler wrapper (`handler.ts`) enforcing CSRF, rate limits, DB roles, size caps, and standard JSON envelope
  - `avatar/` - Avatar engine client connecting to the FastAPI 3D avatar service (`port 8010`)
- **Database Migrations:** [`frontend/drizzle/`](../frontend/drizzle/)
  - Managed via Drizzle Kit (`npm run db:generate`, `npm run db:migrate`)

See [`../docs/DB_AND_API_CONTRACTS.md`](../docs/DB_AND_API_CONTRACTS.md), [`../docs/SECURITY_PRIVACY_STORAGE.md`](../docs/SECURITY_PRIVACY_STORAGE.md), and [`../docs/SYSTEM_ARCHITECTURE.md`](../docs/SYSTEM_ARCHITECTURE.md) for architectural and security standards.
