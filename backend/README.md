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
  - `db/schema/` - Modular Drizzle schema partitioned by domain:
    - `auth.ts` - Users, sessions, accounts, verifications, user roles
    - `partners.ts` - Seller/tailor partners, workshop profiles
    - `body.ts` - Anthropometric body profiles, measurement history, avatar engine ownership
    - `commerce.ts` - Catalog products, garment dimensions, saved looks, wishlist, cart, orders, order items, customfit
    - `vton.ts` - Virtual try-on jobs, admin audit logs, contact inquiries
    - `index.ts` - Re-exports all schemas for unified access
  - `auth/` - Better Auth server configuration and capability/role guards
  - `api/` - Universal route handler wrapper (`handler.ts`) enforcing CSRF, rate limits, DB roles, size caps, and standard JSON envelope
  - `avatar/` - Avatar engine client connecting to the FastAPI 3D avatar service (`port 8010`)
- **Database Migrations & Database Workflows:** [`frontend/drizzle/`](../frontend/drizzle/)
  - `npm run db:generate` - Generates timestamped SQL migrations from `frontend/src/server/db/schema/`
  - `npm run db:push` - Directly prototypes and synchronizes schema with your database (use ONLY on personal development branches)
  - `npm run db:migrate` - Executes audited migration scripts against the target database

> [!IMPORTANT]
> **Neon Database Branching Policy:**
> Every developer must use their **OWN isolated Neon branch** for local development and testing. Never target personal feature branches or push ad-hoc schema changes (`npm run db:push`) to a shared or production database. Schema changes must be committed as generated migration files in `frontend/drizzle/` and reviewed via Pull Request.

See [`../docs/DB_AND_API_CONTRACTS.md`](../docs/DB_AND_API_CONTRACTS.md), [`../docs/SECURITY_PRIVACY_STORAGE.md`](../docs/SECURITY_PRIVACY_STORAGE.md), and [`../docs/SYSTEM_ARCHITECTURE.md`](../docs/SYSTEM_ARCHITECTURE.md) for architectural and security standards.
