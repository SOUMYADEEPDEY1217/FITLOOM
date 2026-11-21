# FITLOOM Production Deployment Guide (Vercel + Neon + Engine Tunnel)

This guide documents the exact architecture, environment variables, database branching, and tunnel topology required to deploy FITLOOM to Vercel and Neon PostgreSQL, with the 3D avatar engine daemon connected via a secure tunnel.

---

## 1. Vercel Deployment Configuration

### 1.1 Project Settings
- **Root Directory:** `frontend`
- **Framework Preset:** Next.js
- **Build Command:** `next build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Node.js Version:** `20.x` or `22.x`

### 1.2 Required Environment Variables
Set each of the following server-only environment variables in the Vercel Project Dashboard (**Settings -> Environment Variables**).

> [!CAUTION]
> Never set `NEXT_PUBLIC_` prefixes on secrets. Never commit actual secret values to git.

| Variable | Description | Example / Format (Placeholder) |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon Serverless PostgreSQL connection string (pooled connection recommended). | `postgresql://<user>:<password>@ep-<branch>-pooler.region.neon.tech/fitloom?sslmode=require` |
| `BETTER_AUTH_SECRET` | 32+ character high-entropy cryptographically secure string for session token hashing and cookie signing. | `generate-random-32-character-secret-minimum` |
| `BETTER_AUTH_URL` | Canonical public HTTPS URL of your deployed application. Enforces HTTPS cookie security. | `https://your-project.vercel.app` |
| `ALLOWED_ORIGINS` | Comma-separated list of trusted origins validated during mutating API requests (CSRF protection). | `https://your-project.vercel.app,https://www.fitloom.app` |
| `AVATAR_SERVICE_URL` | HTTPS URL of the secure tunnel exposing the local 3D avatar engine daemon. | `https://<tunnel-subdomain>.trycloudflare.com` |
| `AVATAR_SERVICE_TOKEN` | Shared secret bearer token validated by the engine daemon for authorized backend proxy calls. | `engine-auth-token-shared-secret` |
| `AVATAR_SERVICE_TIMEOUT_MS` | Timeout for avatar engine HTTP requests in milliseconds (default: `5000`). | `5000` |
| `NODE_ENV` | Runtime environment mode. Set automatically by Vercel to `production`. | `production` |

---

## 2. Neon Database Branching & Safe Production Seeding

### 2.1 Branch Isolation Strategy
Neon provides zero-copy database branching. Always isolate environments:
1. **Production Branch (`main` / `production`):** Dedicated exclusively to production traffic.
2. **Developer Branches (`dev-<developer-name>`):** Ephemeral branches for local testing and migrations.

### 2.2 Schema Synchronization
Push the current Drizzle ORM schema to the production Neon branch from your local terminal:
```bash
cd frontend
DATABASE_URL="<your-neon-production-url>" npm run db:push
```

### 2.3 Safe Production Seeding (`SEED_CATALOGUE_ONLY=1`)
Never seed mock user credentials, demo passwords, or test body profiles into a production database.
FITLOOM's seed script supports the `SEED_CATALOGUE_ONLY=1` flag:
```bash
cd frontend
SEED_CATALOGUE_ONLY=1 DATABASE_URL="<your-neon-production-url>" npm run db:seed
```

**What this flag does:**
- ✅ Seeds the 14 verified catalogue garments with complete anthropometric size charts (S, M, L, XL in metric cm).
- ✅ Seeds the verified partner records (Verve Studio seller, master tailor workshops) so catalogue products link to active partners.
- 🚫 **Skips** the demo customer account (`riya@fitloom.com`).
- 🚫 **Skips** the demo admin account (`admin@fitloom.com`).
- 🚫 **Skips** demo body profiles and mock measurement logs.

---

## 3. 3D Avatar Engine Tunnel Setup (Laptop / GPU Host)

The FITLOOM 3D Avatar Engine (`avatar-engine/`) runs as a specialized FastAPI service requiring CUDA or MPS acceleration. During live deployments or demos, the engine is hosted on a laptop and tunneled securely to Vercel.

### 3.1 Start the Engine Daemon Locally
1. Navigate to the engine directory and activate the Python virtual environment:
   ```bash
   cd avatar-engine
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   ```
2. Export the security environment variables:
   ```bash
   export FITLOOM_REQUIRE_TOKEN=1
   export AVATAR_SERVICE_TOKEN="<choose-a-secure-shared-token>"
   export ALLOWED_ORIGINS="https://your-project.vercel.app,http://localhost:3000"
   ```
3. Launch the engine on port 8010:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8010
   ```

### 3.2 Expose via Cloudflare Tunnel (Recommended)
Using Cloudflare Tunnel avoids port-forwarding and dynamic DNS:
```bash
cloudflared tunnel --url http://127.0.0.1:8010
```
`cloudflared` will print a public HTTPS URL (e.g. `https://random-words.trycloudflare.com`).
Copy this URL and set `AVATAR_SERVICE_URL` in your Vercel Project Settings.

*(Alternative via ngrok: `ngrok http 8010`)*

### 3.3 Engine Offline Resilience
The Next.js backend proxy route `GET /api/avatar/status` monitors engine connectivity:
- When the tunnel or engine is offline, `/api/avatar/status` honestly returns HTTP `503 Service Unavailable`.
- The frontend UI displays a non-intrusive status pill and cleanly falls back to standard garment charts without crashing.
- Keep the laptop awake and running during live demo presentations.

---

## 4. Production Security Headers & Cookie Policies

### 4.1 Enforced Response Headers
Every response emitted by the Next.js production server carries security headers configured in `next.config.ts`:
- **`X-Content-Type-Options: nosniff`**: Prevents MIME-sniffing exploits.
- **`X-Frame-Options: DENY`**: Protects against clickjacking.
- **`Referrer-Policy: strict-origin-when-cross-origin`**: Limits referrer disclosure.
- **`Permissions-Policy: camera=(), microphone=(), geolocation=()`**: Disables unneeded browser APIs.
- **`Strict-Transport-Security: max-age=63072000; includeSubDomains`**: Forces HTTPS on modern browsers in production.
- **`Content-Security-Policy-Report-Only`**: Reports violations without breaking WebGL or model canvas rendering.

### 4.2 Session Cookie Hardening
Session management powered by Better Auth automatically secures authentication cookies when `BETTER_AUTH_URL` is configured with `https://`:
- **`HttpOnly`**: Cookie is inaccessible to client-side scripts, mitigating XSS token theft.
- **`SameSite=Lax`**: Protects against cross-site request forgery while preserving smooth navigation from external links.
- **`Secure`**: Cookie is transmitted strictly over TLS/HTTPS encrypted connections.

---

## 5. Deployment Verification & Smoke Testing

After deploying to Vercel, run the automated smoke test script from the repository root:
```powershell
./scripts/smoke-deploy.ps1 -BaseUrl "https://your-project.vercel.app"
```

The script validates:
1. `GET /api/health` — Verifies database connection and application responsiveness.
2. `GET /api/products` — Confirms catalogue items and measurements are populated.
3. `GET /api/avatar/status` — Checks tunnel reachability to the 3D avatar engine.
4. `POST /api/auth/sign-up/email` — Verifies CSRF protection and account creation.
5. `GET /api/users/me` — Verifies session cookie propagation and capability mapping.

---

## 6. Known Limitations & Production Roadmap

1. **In-Memory Rate Limiting:**
   `frontend/src/server/api/handler.ts` uses an in-memory sliding window rate limiter. In a Vercel serverless environment, memory is isolated per lambda instance and resets upon scale-down. While this is sufficient for hackathon demonstrations, production deployments should transition to a centralized store (e.g. `@upstash/ratelimit` with Redis).
2. **Tunnel Bandwidth for 3D Assets:**
   Serving high-resolution GLB avatar meshes through home broadband tunnels introduces latency. For large-scale production, pre-generated 3D assets should be cached in an S3-compatible private object store (e.g. Cloudflare R2) with short-lived pre-signed URLs.
