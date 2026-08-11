# Nirantar — Phase 1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a real, working end-to-end slice of the Nirantar vendor-monitoring app — login → vendors list → vendor profile with a live "Re-verify against GST" button that hits Setu's sandbox — backed by the real Supabase Postgres, with secrets held server-side only.

**Architecture:** A Vite + React + TypeScript frontend that talks only to our own Node/Fastify backend. The backend holds `DATABASE_URL` and the Setu credentials, exposes a small REST API, connects to Supabase Postgres via `pg`, and calls the Setu sandbox (`/api/verify/gst`, already verified working). Auth is app-level: a `public.app_users` table with bcrypt-hashed passwords and JWT bearer tokens. The 14 mock vendors from the design are migrated into `public.vendors` so the UI renders real rows.

**Tech Stack:** Node 20 + Fastify + TypeScript (tsx), `pg`, `bcryptjs`, `jsonwebtoken`, native `fetch` for Setu; Vite + React 18 + TypeScript + react-router-dom on the frontend; Vitest + Fastify `inject` for backend tests.

## Global Constraints

- Secrets (`DATABASE_URL`, `SETU_CLIENT_SECRET`, `SETU_CLIENT_ID`, product IDs, `JWT_SECRET`) live only in `nirantar/.env`, loaded by the **server** via `dotenv`. They must never appear in any `web/` code or `VITE_*` variable.
- `.env` is git-ignored; `.env.example` documents keys with placeholder values only.
- `DATABASE_URL` uses the `%40`-encoded password form: `postgresql://postgres:Amberabhay%402026@db.svlljfvgnfmduylyzzip.supabase.co:5432/postgres`.
- App tables live in `public`; our users table is `public.app_users` (never touch Supabase's `auth.*`).
- Setu GST endpoint: `POST https://dg-sandbox.setu.co/api/verify/gst`, headers `x-client-id`, `x-client-secret`, `x-product-instance-id` (GSTIN product), JSON body `{"gstin":"..."}`. A `200` with `{"verification":"success"}` means verified.
- Money is stored in paise-free rupee integers (as in the mock data) and formatted with the design's `fmtINR` (Cr / L / en-IN).
- Design status vocabulary is fixed: `Verified | Changed | Conflict | Stale | Unavailable | Review required`.

---

## File Structure

```
nirantar/
  .env                     # secrets (gitignored) — moved here
  .env.example             # documented placeholders
  .gitignore
  package.json             # root: workspaces [server, web], dev script runs both
  docs/superpowers/plans/  # this plan
  design/
    Nirantar.dc.html       # imported design, kept for reference
    support.js
  server/
    package.json
    tsconfig.json
    src/
      env.ts               # loads + validates process.env
      db.ts                # pg Pool from DATABASE_URL
      setu.ts              # verifyGst(gstin) -> {ok, raw}
      auth.ts              # hash/verify password, sign/verify JWT, requireAuth hook
      app.ts               # buildApp(): Fastify instance + routes (exported for tests)
      index.ts             # start server
      routes/
        auth.routes.ts     # POST /api/auth/login, GET /api/auth/me
        vendors.routes.ts  # GET /api/vendors, GET /api/vendors/:id, POST /api/vendors/:id/verify
    db/
      001_init.sql         # schema
      seed.ts              # upsert plants, app_users, vendors from design data
      vendors.seed.json    # the 14 vendors, extracted from the design
    test/
      auth.test.ts
      vendors.test.ts
  web/
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    src/
      main.tsx
      api.ts               # typed fetch client, attaches bearer token
      auth.tsx             # AuthContext: token in localStorage, login(), logout()
      types.ts             # Vendor, User, VerifyResult
      App.tsx              # router + AppShell (sidebar) 
      components/
        Sidebar.tsx
        StatusBadge.tsx
      screens/
        Login.tsx
        Vendors.tsx
        VendorProfile.tsx
        Dashboard.tsx       # minimal placeholder for nav target this phase
```

---

### Task 1: Project scaffold, env hygiene, git

**Files:**
- Create: `nirantar/.gitignore`, `nirantar/.env.example`, `nirantar/package.json`
- Move: existing `nirantar/.env` stays in place (already correct); ensure `%40` form
- Create: `nirantar/design/Nirantar.dc.html`, `nirantar/design/support.js` (copied from scratchpad for reference)

**Interfaces:**
- Produces: a git repo rooted at `nirantar/`, npm workspaces `server` and `web`, root scripts `dev`, `test`.

- [ ] **Step 1: Init git and workspaces**
  - `git init` in `nirantar/`.
  - Root `package.json`:
    ```json
    {
      "name": "nirantar",
      "private": true,
      "workspaces": ["server", "web"],
      "scripts": {
        "dev": "npm run dev --workspace server & npm run dev --workspace web",
        "test": "npm run test --workspace server"
      }
    }
    ```
- [ ] **Step 2: `.gitignore`** — extend the existing one to also ignore `node_modules/`, `dist/`, `.env`, keep `!.env.example`.
- [ ] **Step 3: `.env.example`** (placeholders only):
    ```
    SETU_CLIENT_ID=your-setu-client-id
    SETU_CLIENT_SECRET=your-setu-client-secret
    SETU_GSTIN_PRODUCT_ID=your-gstin-product-instance-id
    SETU_PENNY_DROP_PRODUCT_ID=your-penny-drop-product-instance-id
    DATABASE_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres
    JWT_SECRET=generate-a-long-random-string
    ```
- [ ] **Step 4: Add `JWT_SECRET`** to the real `.env` (a freshly generated random 48-byte hex string).
- [ ] **Step 5: Copy** `Nirantar.dc.html` and `support.js` into `nirantar/design/` for reference.
- [ ] **Step 6: Commit** `chore: scaffold nirantar workspace and env hygiene`.

---

### Task 2: Database schema

**Files:**
- Create: `server/db/001_init.sql`

**Interfaces:**
- Produces tables `public.plants`, `public.app_users`, `public.vendors`, `public.audit_log` consumed by seed + routes.

- [ ] **Step 1: Write `001_init.sql`**
    ```sql
    create table if not exists public.plants (
      name text primary key
    );

    create table if not exists public.app_users (
      id            bigserial primary key,
      email         text unique not null,
      password_hash text not null,
      name          text not null,
      role          text not null check (role in ('cfo','compliance','plant')),
      plant_scope   text references public.plants(name),
      created_at    timestamptz not null default now()
    );

    create table if not exists public.vendors (
      id             bigint primary key,
      name           text not null,
      plant          text not null references public.plants(name),
      category       text,
      gstin          text,
      pan            text,
      status         text not null check (status in
                       ('Verified','Changed','Conflict','Stale','Unavailable','Review required')),
      entity_status  text,
      gst_status     text,
      registered     boolean not null default false,
      udyam_no       text,
      msme_cat       text,
      address        text,
      open_invoices  int not null default 0,
      invoice_value  bigint not null default 0,
      payment_status text,
      payment_terms  text,
      exposure       bigint not null default 0,
      has_alert      boolean not null default false,
      last_verified  timestamptz
    );

    create table if not exists public.audit_log (
      id         bigserial primary key,
      at         timestamptz not null default now(),
      actor      text not null,
      action     text not null,
      vendor_id  bigint references public.vendors(id),
      vendor     text,
      plant      text
    );
    ```
- [ ] **Step 2: Commit** `feat(db): add core schema`.

---

### Task 3: Server env + db + Setu client (with test)

**Files:**
- Create: `server/src/env.ts`, `server/src/db.ts`, `server/src/setu.ts`, `server/test/setu.test.ts`
- Create: `server/package.json`, `server/tsconfig.json`

**Interfaces:**
- Produces:
  - `env`: `{ DATABASE_URL, SETU_CLIENT_ID, SETU_CLIENT_SECRET, SETU_GSTIN_PRODUCT_ID, SETU_PENNY_DROP_PRODUCT_ID, JWT_SECRET }` (throws if any missing).
  - `pool: pg.Pool`.
  - `verifyGst(gstin: string): Promise<{ ok: boolean; verification: string | null; raw: unknown }>`.

- [ ] **Step 1: `server/package.json`** deps: `fastify`, `pg`, `bcryptjs`, `jsonwebtoken`, `dotenv`; dev: `typescript`, `tsx`, `vitest`, `@types/*`. Scripts: `dev` (`tsx watch src/index.ts`), `test` (`vitest run`), `migrate` (`tsx db/migrate.ts`), `seed` (`tsx db/seed.ts`).
- [ ] **Step 2: `env.ts`** — `dotenv.config({ path: '../.env' })`, read + assert each key, export typed `env`.
- [ ] **Step 3: `db.ts`** — `export const pool = new Pool({ connectionString: env.DATABASE_URL })`.
- [ ] **Step 4: `setu.ts`**
    ```ts
    import { env } from './env.js';
    export async function verifyGst(gstin: string) {
      const res = await fetch('https://dg-sandbox.setu.co/api/verify/gst', {
        method: 'POST',
        headers: {
          'x-client-id': env.SETU_CLIENT_ID,
          'x-client-secret': env.SETU_CLIENT_SECRET,
          'x-product-instance-id': env.SETU_GSTIN_PRODUCT_ID,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ gstin }),
      });
      const raw = await res.json().catch(() => null);
      const verification = (raw as any)?.verification ?? null;
      return { ok: res.status === 200 && verification === 'success', verification, raw };
    }
    ```
- [ ] **Step 5: Write failing test `setu.test.ts`** — a live sandbox smoke test (network), guarded so it only runs when `RUN_LIVE=1`:
    ```ts
    import { describe, it, expect } from 'vitest';
    import { verifyGst } from '../src/setu.js';
    describe.runIf(process.env.RUN_LIVE === '1')('setu live', () => {
      it('verifies a known sandbox GSTIN', async () => {
        const r = await verifyGst('29AAICP2912R1ZS');
        expect(r.ok).toBe(true);
      }, 30000);
    });
    ```
- [ ] **Step 6: Run** `RUN_LIVE=1 npm test --workspace server` → PASS (confirms creds + endpoint from Node, mirroring the earlier curl check).
- [ ] **Step 7: Commit** `feat(server): env, db pool, Setu GST client`.

---

### Task 4: Migrate + seed real data

**Files:**
- Create: `server/db/migrate.ts`, `server/db/seed.ts`, `server/db/vendors.seed.json`

**Interfaces:**
- Consumes: `pool`, `001_init.sql`. Produces: 4 plants, 3 app_users, 14 vendors, in Supabase.

- [ ] **Step 1: `vendors.seed.json`** — the 14 `VENDORS_RAW` objects from `design/Nirantar.dc.html` (snake_cased keys matching the schema; `last_verified` left null — it becomes real on first Setu verify).
- [ ] **Step 2: `migrate.ts`** — read `001_init.sql`, `await pool.query(sql)`. Idempotent (`if not exists`).
- [ ] **Step 3: `seed.ts`**:
  - Insert plants `Pune, Nashik, Chennai, Rajkot` (`on conflict do nothing`).
  - Insert `app_users` (upsert by email): Arjun Mehta `arjun@suryodaya-auto.com` role `compliance`; Rohan Kapoor `rohan@suryodaya-auto.com` role `cfo`; Priya Nair `priya.nair@suryodaya-auto.com` role `plant` scope `Nashik`. All with `bcrypt.hash('nirantar123', 10)` (dev password; documented in README).
  - Upsert 14 vendors from JSON (`on conflict (id) do update`).
- [ ] **Step 4: Run** `npm run migrate --workspace server && npm run seed --workspace server`.
- [ ] **Step 5: Verify** with a one-off query: `select count(*) from vendors;` → 14; `select count(*) from app_users;` → 3.
- [ ] **Step 6: Commit** `feat(db): migration runner and seed from design data`.

---

### Task 5: Auth (hashing, JWT, login route) — with tests

> **Note (2026-08-11):** Tasks 1–4 were actually implemented against the normalized schema in `docs/spec.md` (`public.users`, `public.companies`, `public.plants`, roles `plant_finance/group_compliance/group_procurement/cfo/admin`), not the flat `app_users`/`vendors` schema this plan originally sketched. Task 5 below was built against that real schema: JWT payload is `{sub, email, role, company_id, plant_id}` (per spec.md's `/auth/login` response), routes stay under Fastify's `/api` prefix. Treat the code snippets in Tasks 5–8 below as directional, not literal — verify against the actual schema in `server/db/001_init.sql` before using them.

**Files:**
- Create: `server/src/auth.ts`, `server/src/app.ts`, `server/src/index.ts`, `server/src/routes/auth.routes.ts`, `server/test/auth.test.ts`

**Interfaces:**
- Produces:
  - `signToken(user): string`, `verifyToken(t): {sub,email,role,plant_scope}`, `requireAuth` (Fastify preHandler putting `req.user`).
  - `buildApp(): FastifyInstance`.
  - `POST /api/auth/login {email,password} -> {token, user}` (401 on bad creds).
  - `GET /api/auth/me -> {user}` (401 without valid bearer).

- [x] **Step 1: `auth.ts`** — `bcryptjs.compare`, `jsonwebtoken.sign/verify` with `env.JWT_SECRET`, `requireAuth` hook reading `Authorization: Bearer`.
- [x] **Step 2: `auth.routes.ts`** — login looks up `app_users` by email, compares hash, returns token + safe user (no hash). `/me` returns `req.user`.
- [x] **Step 3: `app.ts`/`index.ts`** — `buildApp` registers routes + CORS (allow `http://localhost:5173`); `index.ts` listens on `:8787`.
- [x] **Step 4: Write failing `auth.test.ts`** using `app.inject`:
    ```ts
    it('rejects bad password', async () => {
      const app = buildApp();
      const r = await app.inject({ method:'POST', url:'/api/auth/login',
        payload:{ email:'rohan@suryodaya-auto.com', password:'nope' }});
      expect(r.statusCode).toBe(401);
    });
    it('logs in and /me works', async () => {
      const app = buildApp();
      const login = await app.inject({ method:'POST', url:'/api/auth/login',
        payload:{ email:'rohan@suryodaya-auto.com', password:'nirantar123' }});
      expect(login.statusCode).toBe(200);
      const { token } = login.json();
      const me = await app.inject({ method:'GET', url:'/api/auth/me',
        headers:{ authorization:`Bearer ${token}` }});
      expect(me.json().user.role).toBe('cfo');
    });
    ```
- [x] **Step 5: Run** `npm test --workspace server` → PASS (requires seed from Task 4).
- [x] **Step 6: Commit** `feat(server): app-level auth with JWT`.

---

### Task 6: Vendors API — list, detail, verify (with tests)

> **Note (2026-08-11):** Built against the real schema — `vendors` + `vendor_records` + `verification_attributes`, not a flat `vendors` table. Status is derived per attribute severity (never stored), list/detail are scoped by `company_id` from the JWT, and the query params follow `docs/spec.md` (`q`, `plant_id`, `status`) rather than the plan's `?q=&plant=&status=`.

**Files:**
- Create: `server/src/routes/vendors.routes.ts`, `server/test/vendors.test.ts`

**Interfaces:**
- Consumes: `pool`, `verifyGst`, `requireAuth`.
- Produces (all require auth):
  - `GET /api/vendors -> Vendor[]` (ordered by attention rank then name; supports `?q=&plant=&status=`).
  - `GET /api/vendors/:id -> Vendor` (404 if absent).
  - `POST /api/vendors/:id/verify -> { verification, vendor }` — calls `verifyGst(vendor.gstin)`, on success sets `last_verified = now()`, and writes an `audit_log` row `('You','Re-verified GST', ...)`.

- [x] **Step 1: `vendors.routes.ts`** — parameterized SQL for list/filter; detail by id; verify handler as above (wrap Setu failure → return `{verification:'failed'}` with 200, do not 500 on a clean "not verified").
- [x] **Step 2: Write failing `vendors.test.ts`** — auth required (401 without token); list returns 14 with token; detail returns known vendor name.
    ```ts
    it('lists vendors when authed', async () => {
      const token = await loginToken(app); // helper logs in rohan
      const r = await app.inject({ method:'GET', url:'/api/vendors',
        headers:{ authorization:`Bearer ${token}` }});
      expect(r.statusCode).toBe(200);
      expect(r.json().length).toBe(14);
    });
    ```
- [x] **Step 3: Run** `npm test --workspace server` → PASS.
- [x] **Step 4: Live verify check** (guarded `RUN_LIVE=1`): POST verify for vendor id 1 (`Shree Balaji Fasteners`), expect `verification` present and an audit row inserted.
- [x] **Step 5: Commit** `feat(server): vendors list/detail/verify endpoints`.

---

### Task 7: Frontend scaffold + auth + login screen

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/index.html`, `web/src/{main,App,api,auth,types}.tsx/.ts`, `web/src/screens/Login.tsx`

**Interfaces:**
- Consumes: backend `/api/auth/*`. Produces: `AuthProvider`/`useAuth()`, `api` client, a working `/login` route that stores the token and redirects to `/vendors`.

- [ ] **Step 1: Scaffold** Vite React-TS in `web/`; add `react-router-dom`. `vite.config.ts` proxies `/api` → `http://localhost:8787`.
- [ ] **Step 2: `types.ts`** — `Vendor`, `User`, `VerifyResult` matching server JSON.
- [ ] **Step 3: `api.ts`** — `apiFetch(path, opts)` attaching `Authorization` from stored token; `login()`, `getVendors()`, `getVendor(id)`, `verifyVendor(id)`.
- [ ] **Step 4: `auth.tsx`** — context storing token in `localStorage`, `login/logout`, `user` from `/me` on load.
- [ ] **Step 5: `Login.tsx`** — reproduce the design's login card (navy background, Inter, the exact copy "Welcome back" / "Your Finance & Compliance workspace"); on submit call `login()`, show inline "That password doesn't match." on 401.
- [ ] **Step 6: Manual check** — `npm run dev`, log in as `rohan@suryodaya-auto.com` / `nirantar123`, land on `/vendors`.
- [ ] **Step 7: Commit** `feat(web): scaffold, auth context, login screen`.

---

### Task 8: Frontend Vendors list + Vendor profile with live GST re-verify

**Files:**
- Create: `web/src/components/{Sidebar,StatusBadge}.tsx`, `web/src/screens/{Vendors,VendorProfile,Dashboard}.tsx`; modify `App.tsx` for the authed shell + routes.

**Interfaces:**
- Consumes: `api.getVendors/getVendor/verifyVendor`, `useAuth`.
- Produces: authed routes `/vendors`, `/vendors/:id`, `/dashboard` inside the navy `Sidebar` shell; redirect to `/login` when unauthenticated.

- [ ] **Step 1: `StatusBadge.tsx`** — the design's `STATUS_META` (bg/fg/border/icon) as a lookup; renders the pill.
- [ ] **Step 2: `Sidebar.tsx`** — navy sidebar with the `NAV_DEFS` items (Dashboard/Vendors/Alerts/... — non-slice items render but route to a "coming soon" placeholder this phase), current user footer from `useAuth`.
- [ ] **Step 3: `Vendors.tsx`** — search + plant + status filters (client-side over fetched rows), the table layout from the design (`VENDOR / PLANT / STATUS / LAST VERIFIED`), rows clickable to profile; pagination (page size 8).
- [ ] **Step 4: `VendorProfile.tsx`** — Identity + Compliance + Finance-context cards from the design; a **"Re-verify against GST"** button that calls `verifyVendor(id)`, shows a spinner, then updates `last_verified` and surfaces the returned `verification` result via a toast.
- [ ] **Step 5: `App.tsx`** — router, `RequireAuth` wrapper, the shell; `/dashboard` minimal (KPI tiles reading from `/api/vendors` aggregates or a simple placeholder — full dashboard is Phase 2).
- [ ] **Step 6: Manual end-to-end check** — log in → see 14 real vendors from Supabase → open `Anand Precision Tools` → click "Re-verify against GST" → observe a live Setu round-trip and a new `audit_log` row (`select * from audit_log order by at desc limit 1;`).
- [ ] **Step 7: Commit** `feat(web): vendors list and profile with live GST re-verify`.

---

## Phase 2+ backlog (not in this slice)

Remaining screens and behaviors, each its own task set later: **Alerts** (list + resolve/assign/escalate/snooze/override, persisted to `audit_log`), **MSME Deadlines**, **Audit Trail** (read the real `audit_log`), **Duplicate compare** + merge/dismiss, **Dashboard** (full KPI tiles, role toggle CFO/Plant, plant breakdown), **Reports** (export), **Settings**, **Style Guide**. Real **bank/IFSC verification** via the penny-drop product (`SETU_PENNY_DROP_PRODUCT_ID`). **Connect / Building** onboarding flow (simulated build steps can stay simulated, or become a real background job). PAN verification remains display-only until a PAN product instance is provisioned.

## Self-Review notes

- Spec coverage: slice = auth + vendors + one live Setu path; matches the approved "thin vertical slice." Broader screens explicitly deferred to Phase 2 backlog.
- Secrets constraint enforced by having no DB/Setu access in `web/` and a Vite proxy to the server.
- Types consistent: `Vendor` shape flows schema → seed JSON → server JSON → `web/types.ts`.
- Non-empty-DB risk handled: `public` confirmed empty of app tables; all DDL is `if not exists`; seed upserts.
