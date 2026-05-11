# Helix — Oficina Virtual ONANO

<p align="left">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite 8" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/Supabase-3FCF8E?logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Zustand-5-443E38?logo=react&logoColor=white" alt="Zustand 5" />
  <img src="https://img.shields.io/badge/TanStack_Query-5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query 5" />
  <img src="https://img.shields.io/badge/TanStack_Router-1-CED4DA?logo=reactrouter&logoColor=white" alt="TanStack Router" />
  <img src="https://img.shields.io/badge/status-active- success" alt="Status: Active" />
</p>

---

## Description

**ONANO Global** is a multinational wellness company with a multi-level marketing (MLM) compensation model, operating across Latin America with physical products, a structured distributor network, and a 12-rank career plan.

**Helix** is the official virtual office platform for ONANO distributors. It replaces fragmented spreadsheets, manual commission tracking, and paper-based enrollment with a unified web application where distributors manage their entire business: enroll new members, place e-commerce orders, track commissions across eight bonus types, navigate the unilevel and sponsorship trees, monitor rank advancement, and manage their virtual wallet.

The platform serves two audience types: **distributors** (socios) who build a network and earn commissions, and **preferred customers** (clientes preferentes) who purchase products at wholesale pricing. An administrative panel provides backoffice control for commission configuration, user management, compensation simulation, and business auditing.

Built from the ground up with a database-first architecture, Helix offloads all commission calculation logic — 60+ PL/pgSQL functions, 20 triggers, 8 Edge Functions, and 5 scheduled pg_cron jobs — directly into PostgreSQL. The React frontend is purely a presentation layer, with data fetching orchestrated through TanStack Query and local UI state managed by Zustand.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend Framework | React 19 + TypeScript 5.9 + Vite 8 |
| Styling | Tailwind CSS 4 + ONANO Design System (`#062A63` / `#0CBCE5`) |
| State (Server) | TanStack Query 5 (caching, invalidation, staleTime) |
| State (Client) | Zustand 5 (persisted cart + layout in localStorage) |
| Routing | TanStack Router 1 (type-safe, nested layouts, auth guards) |
| Backend / Database | Supabase (PostgreSQL 15+) |
| Auth | Supabase Auth (email/password, auto-confirm on register) |
| Edge Functions | Deno / TypeScript (8 deployed functions) |
| Tree Structure | `ltree` extension (unilevel tree queries) |
| Scheduling | `pg_cron` (monthly/biweekly closures) |
| Cryptography | `pgcrypto` (bcrypt hashing) |
| Charts | D3.js + d3-org-chart (genealogy tree visualization) |
| PDF Generation | @react-pdf/renderer (commission reports, sandbox export) |
| Validation | Zod 4 |
| Notifications | sonner (toast system) |

**Supabase Project Ref:** `elqonjnniophqdnwhtbo`

---

## Architecture

### Screaming Architecture — 6 Business Domains

Helix follows a **screaming architecture** organized by business capability, not technical layers. The `src/modules/` directory structure reads like a table of contents for the product:

```
src/
├── modules/
│   ├── auth/           Login, Register, Auth hooks (useAuth)
│   ├── network/        Dashboard, Genealogy Tree, Business Metrics, Enrollments
│   ├── e-commerce/     Store, Cart, Checkout, Orders, Order Detail
│   ├── finances/       Wallet, Commissions, Earnings, Withdrawals, Awards
│   ├── admin/          Admin Panel, Commission Simulator (sandbox)
│   └── support/        Help Center (placeholder)
├── layouts/            Sidebar, TopBar, BottomNav, DashboardLayout
├── components/
│   ├── ui/             Shared primitives (buttons, cards, sheets, inputs)
│   └── dashboard/      Dashboard-specific widgets
├── hooks/              Shared hooks (useMediaQuery, useNavigateWithTransition)
└── lib/                Supabase client, router, types, ranks constants
```

### Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Database-first commission logic** | All MLM bonus calculation is PL/pgSQL — 60+ functions, 20 triggers. The frontend calls RPCs. This guarantees consistency and avoids race conditions in distributed systems. |
| **SECURITY DEFINER functions** | Core commission RPCs bypass RLS entirely and run with definer permissions. This is intentional: commission math must never be gated by row-level policies. |
| **RPC for complex reads** | Multi-table aggregations (`get_user_dashboard`, `get_network_orders`) are encapsulated as Postgres functions with pagination, not assembled client-side. |
| **TanStack Query as server state** | Every API call is a `useQuery` with explicit `queryKey`, `staleTime`, and cache invalidation. No direct `useEffect` + `fetch` patterns. |
| **Zustand for transient UI state** | Cart and layout sidebar collapse state live in Zustand with localStorage persistence. Cart survives page refreshes. |
| **Auth guard at router level** | `beforeLoad: requireAuth` throws a TanStack Router redirect before any component renders. Guest routes use `requireGuest`. |
| **Admin amplification pattern** | Hooks like `useTopRankos(userId, isAdmin)` share the same query key structure — the `isAdmin` flag changes the query scope without duplicating logic. |

### Route Tree (22 routes)

```
/login                          (public)
/registro/$username             (public — referral link)
/                               Dashboard
/red                            Negocio (business overview)
/network                        Genealogy tree (unilevel / sponsorship)
/ordenes                        Orders history
/ordenes/$orderId               Order detail
/tienda                         Store
/checkout                       Checkout (3-step: review → payment → confirm)
/tienda/metodos-pago            Payment methods
/tienda/direcciones             Shipping addresses
/register                       New member enrollment (authenticated)
/admin                          Admin panel
/admin/ordenes                  Admin orders
/simulador                      Commission simulator (sandbox)
/viaje                          Leadership trip (LTP tracking)
/billetera                      Virtual wallet
/retiros                        Withdrawals
/comisiones                     Commission breakdown by level
/ganancias                      Earnings history
/ganancias/$bonoType            Bonus-type detail drilldown
/historial-volumen              Volume history
/inscripciones                  Holding tank (pending unilevel placement)
```

---

## Database Architecture

27 tables in `public` schema, powered by PostgreSQL 15+ on Supabase with three extensions: `ltree`, `pgcrypto`, and `pg_cron`.

### Schema Highlights

| Schema Component | Count | Notes |
|-----------------|-------|-------|
| Tables | 27 | Core: `users`, `orders`, `order_items`, `products`, `commissions`, `wallets`, `wallet_transactions`, `unilevel_tree`, `holding_tank`, `periodos`, `ranks`, `rank_advance_bonus_claims`, `categorias`, `direcciones`, `shipments`, `cedis`, `taxes`, `exchange_rates`, `internal_transfers`, `fidelity_ledger`, `ltp_entries`, `ltp_semester_rewards`, `promotor_bonus_tracking`, `commission_payout_batches`, `product_private_access`, `admin_settings`, `monthly_closure`, `holding_tank_reset_config` |
| PL/pgSQL Functions | 60+ | Commission calculation, tree traversal, volume propagation, membership upgrades |
| Triggers | 20 | Auto-create profile on signup, process instant commissions, propagate PV up the tree, recalc ranks on VG change |
| Edge Functions | 8 | `register-user`, `create-admin-user`, `monthly-closure`, `payout-commissions`, `wallet-deposit`, `get-wallet-details`, `admin-assign-order`, `reset-test-passwords` |
| pg_cron Jobs | 5 | Mid-month unilevel, monthly closure (12 steps), fidelity expiry, semester bonus H1/H2 |
| RLS Policies | 16 | Per-table policies with admin amplification via `is_admin()` helper |

### Core Data Flow

```
Order placed (paid)
  → Trigger: process_instant_commissions()  [BEFORE UPDATE]
    → Bono Patrocinio (3 levels: 25/15/5%)
    → Bono Infinito Patrocinio (L4+, rank-differential)
    → Bono Venta Directa (20% of CV)
  → Trigger: update_user_personal_pv_cv()
  → Trigger: recalc_rank()
  → Trigger: propagate_pv_up_tree()

Mid-month (pg_cron, day 15)
  → calculate_unilevel_bonus() [9 levels: 6/8/10/12/5/4/3/2/2%]

Month end (pg_cron, day 1, 12 steps)
  → calculate_unilevel_bonus + calculate_infinito_unilevel_bonus
  → calculate_match_bonus + calculate_diferencial_patrocinio
  → calculate_infinito_patrocinio + calculate_promotor_bonus
  → calculate_rank_advance_bonus + recalc_group_vg + recalc_rank
  → Close period + log to monthly_closure
```

### Unilevel Tree (ltree extension)

The unilevel tree uses PostgreSQL's `ltree` extension for hierarchical path queries:

```sql
-- All descendants of a user
SELECT * FROM unilevel_tree WHERE path <@ 'root.A.B';
-- All ancestors
SELECT * FROM unilevel_tree WHERE 'root.A.B.C' <@ path;
-- Depth level
SELECT nlevel(path) FROM unilevel_tree;
```

The sponsorship tree is stored via `users.sponsor_id` (self-referential FK) and queried with recursive CTEs. New registrants enter a `holding_tank` table and are placed into the unilevel tree via `place_user_from_tank()` after their first qualifying purchase.

### Enums (7)

`rank_type` (12 values: Socio through Triple Diamante Embajador), `order_status` (5), `kit_type` (3), `wallet_type` (2), `price_type` (2), `country_type`, `product_status` (2).

---

## Compensation Plan

Eight bonus types. All calculation logic lives in PL/pgSQL — the frontend only reads results.

| # | Bonus | Type | Frequency | Details |
|---|-------|------|-----------|---------|
| 1 | **Bono Patrocinio** | Instant | On order | 25% (L1) / 15% (L2) / 5% (L3) of CV, sponsorship tree |
| 2 | **Bono Uninivel** | Batch | Biweekly + Monthly | 6-2% across 9 levels (6/8/10/12/5/4/3/2/2) |
| 3 | **Bono Match** | Batch | Monthly | Rank-based matching on direct sponsor's unilevel (5 levels, Plata+) |
| 4 | **Bono Infinito Patrocinio** | Batch | Monthly | Differential on L4+ sponsorship, rank-based percentages |
| 5 | **Bono Infinito Uninivel** | Batch | Monthly | Differential on L10+ unilevel, Platino+ required (0.5%-2%) |
| 6 | **Bono Venta Directa** | Instant | On order | 20% of CV when buyer is Cliente Preferente |
| 7 | **Bono Promotor** | Tracking | Monthly | 1 bonus per 200 CV accumulated (no cash value, tracked for awards) |
| 8 | **Bono Avance de Rango** | One-time | On rank-up | $100-$25,000 USD depending on rank level (12 ranks) |

### Bonus Timing

- **Instant triggers:** Bono Patrocinio and Bono Venta Directa fire on order `status → paid` via BEFORE UPDATE trigger.
- **Biweekly:** Bono Uninivel calculated on day 15 via `pg_cron → run_midmonth_unilevel()`.
- **Monthly:** All remaining batch bonuses calculated on day 1 via `pg_cron → process_monthly_closure()` (12-step pipeline).
- **One-time:** Bono Avance de Rango fires when `recalc_rank()` detects a new rank achievement, logged to `rank_advance_bonus_claims` with a UNIQUE(user_id, rank_name) constraint.

### Rank Progression (12 ranks)

| Rank | PV | Group VG | Longest Leg | Other Legs | Bonus (USD) |
|------|----|----------|-------------|------------|-------------|
| Socio | 0 | — | — | — | — |
| Ejecutivo | 100 | — | — | — | — |
| Bronce | 100 | 1,000 | — | — | $100 |
| Plata | 100 | 3,000 | 1,800 | 1,200 | $200 |
| Oro | 100 | 5,000 | 3,000 | 2,000 | $400 |
| Platino | 100 | 10,000 | 6,000 | 4,000 | $800 |
| Diamante | 100 | 25,000 | 15,000 | 10,000 | $1,500 |
| Doble Diamante | 100 | 50,000 | 30,000 | 20,000 | $3,000 |
| Triple Diamante | 100 | 100,000 | 60,000 | 40,000 | $5,000 |
| Diamante Embajador | 100 | 250,000 | 150,000 | 100,000 | $10,000 |
| Doble Diamante Embajador | 100 | 500,000 | 300,000 | 200,000 | $15,000 |
| Triple Diamante Embajador | 100 | 1,000,000 | 600,000 | 400,000 | $25,000 |

---

## Commission Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER PLACES ORDER                                                  │
│  place_order_with_membership() — ACID transaction                   │
│    → order.status = 'pending_payment'                               │
│    → order_items created                                            │
│    → wallet debited (if wallet payment)                             │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AFTER INSERT TRIGGER                                               │
│  process_instant_commissions_after()                                │
│    → Sponsor chain DFS (3 levels)                                   │
│    → Insert into commissions (bono_type='patrocinio')               │
│    → Credit wallet via credit_wallet()                              │
│                                                                     │
│  update_user_personal_pv_cv()                                       │
│    → Sum order PV/CV to user.personal_pv/personal_cv               │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BEFORE UPDATE OF status (to 'paid')                                │
│  process_instant_commissions()                                      │
│    → Bono Patrocinio (3 levels)                                     │
│    → Bono Infinito Patrocinio (L4+, rank-based %)                  │
│    → Bono Venta Directa (20% CV, if CP)                            │
│    → Preferred Customer activation (50% attributable CV)           │
│                                                                     │
│  orders_after_update_handler()                                      │
│    → Upgrade membership if kit purchase                             │
│    → Release accumulated wallet                                     │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PV/CV PROPAGATION                                                  │
│  propagate_pv_up_tree()                                             │
│    → Walk sponsor chain up → update group_vg on each ancestor      │
│                                                                     │
│  recalc_rank() (triggered by VG change)                            │
│    → Compare current VG against rank thresholds                    │
│    → If new rank → insert into rank_advance_bonus_claims           │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  BIWEEKLY CLOSURE (Day 15 — pg_cron)                               │
│  run_midmonth_unilevel()                                            │
│    → calculate_unilevel_bonus(9 levels)                             │
│      6% | 8% | 10% | 12% | 5% | 4% | 3% | 2% | 2%                 │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│  MONTHLY CLOSURE (Day 1 — pg_cron, 12 steps)                       │
│  process_monthly_closure()                                          │
│    Step  1: Create/ensure period                                    │
│    Step  2: Bono Uninivel (full month)                              │
│    Step  3: Bono Infinito Uninivel (Platino+)                      │
│    Step  4: Bono Match (rank-based, 5 levels)                      │
│    Step  5: Diferencial Patrocinio                                  │
│    Step  6: Infinito Patrocinio                                     │
│    Step  7: Bono Promotor (200 CV = 1)                             │
│    Step  8: Bono Avance de Rango (one-time claim)                  │
│    Step  9: Recalc group VG (all users)                            │
│    Step 10: Recalc rank (all users)                                │
│    Step 11: Close period                                           │
│    Step 12: Log to monthly_closure                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

### Installation

```bash
git clone https://github.com/bradrezdev/helix.git
cd helix
npm install
```

### Configuration

Copy the environment template and populate it with your Supabase project credentials:

```bash
cp .env.example .env
```

`.env` should contain:

```env
VITE_SUPABASE_URL=https://elqonjnniophqdnwhtbo.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

The anon key is public-safe (RLS enforces row-level security server-side). Never expose the `service_role` key in the frontend.

### Run Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173` (or next available port). The dev server supports HMR via Vite.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (public, safe for client-side use) |

Both values are available in the Supabase dashboard under Project Settings → API. Stored in `.env` (excluded from git via `.gitignore`).

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start development server with HMR |
| `build` | `tsc -b && vite build` | Full TypeScript type check + production build |
| `lint` | `eslint .` | Run ESLint across the entire project |
| `preview` | `vite preview` | Serve production build locally for verification |

---

## Project Status

| Attribute | Value |
|-----------|-------|
| Active branch | `natural-workflow-test` |
| Refactor branch | `project-restructure` |
| Database | Production — Supabase ref `elqonjnniophqdnwhtbo` |
| Known issues | See `docs/projects/helix-implementation-status.md` |
| RLS gaps | Tables `shipments`, `fidelity_ledger`, `ltp_semester_rewards` lack RLS policies |
| Edge Functions | Deployed to Supabase — no local source files in `supabase/functions/` |

---

## Contributing

Helix is a private project under **ONANO Global**, maintained by the **ATLAS Engineering Team**:

- **Jazmin** — Backend Architect (PL/pgSQL, database design, commission engine)
- **Adrian** — Full-Stack Developer (React, TypeScript, Supabase integration)
- **Bryan** — UI/UX Architect (ONANO Design System, component architecture)
- **Dayana** — DevOps Engineer (CI/CD, Supabase management)
- **Giovann** — QA Engineer (testing, verification)
- **Alex** — FinTech Architect (payment gateways, compliance)
- **Cesar** — MLM Expert (compensation plan, rank structure)
- **Michell** — Financial QA (commission auditing, reconciliation)

### Development Conventions

- **Branch strategy:** Work on feature branches. No direct pushes to `main`.
- **Supabase migrations:** Use `supabase db diff` + `supabase migration new` for schema changes.
- **TypeScript types:** Regenerate with `supabase gen types typescript --linked` after schema changes.
- **Frontend state:** Server data goes through TanStack Query. UI-only state goes through Zustand.
- **Naming:** `PascalCase` for components, `camelCase` for hooks/variables, `kebab-case` for component files.

---

*Maintained by ATLAS Engineering Team — ONANO Global*
