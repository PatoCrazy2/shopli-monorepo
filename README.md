<div align="center">

<br />

```
 ███████╗██╗  ██╗ ██████╗ ██████╗ ██╗     ██╗
 ██╔════╝██║  ██║██╔═══██╗██╔══██╗██║     ██║
 ███████╗███████║██║   ██║██████╔╝██║     ██║
 ╚════██║██╔══██║██║   ██║██╔═══╝ ██║     ██║
 ███████║██║  ██║╚██████╔╝██║     ███████╗██║
 ╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝
```

### **Offline-First POS & Business Intelligence Platform**

*Sell with or without internet. Know your real profit. Always.*

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

</div>

---
## Live Demo

- Admin Dashboard: https://...
- POS (PWA): https://...

## Demo Video

https://...

## Problem

Small businesses often rely on unstable internet connections and lack tools to:

- Operate without connectivity
- Track real profitability (sales - expenses - COGS)
- Manage inventory, finances, and operational costs in one place

Most POS systems fail in offline scenarios or lack comprehensive expense tracking.

## Solution

ShopLI is an **offline-first POS system** that:

- ✅ Allows sales & expense records **without internet connection**
- 🔄 **Syncs data automatically** when online
- 📊 Provides **real-time financial insights** (net profit, costs, gastos)
- 🏪 Supports **multi-branch operations**

---

## Architecture

ShopLI is built as a **Turborepo monorepo** with two distinct frontends and a shared backend layer.

```
shopli/
├── apps/
│   ├── admin/          → Next.js 14 (App Router)  — Dashboard & Analytics
│   └── pos/            → Vite + React (PWA)        — Cashier Point of Sale
│
└── packages/
    ├── db/             → Prisma schema, migrations, PrismaClient export
    ├── ui/             → Shared Shadcn/UI components (Geist font)
    ├── typescript-config/
    └── eslint-config/
```

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    apps/pos  (PWA)                       │
│  ┌──────────────┐    ┌────────────────────────────────┐ │
│  │  Dexie.js    │◄───│  React Hooks + Service Worker  │ │
│  │ (Local DB)   │    │  (Offline-First Logic)         │ │
│  └──────┬───────┘    └────────────────────────────────┘ │
│         │  Background Sync (when online)                 │
└─────────┼───────────────────────────────────────────────┘
          │  POST /api/sync-push
          ▼
┌─────────────────────────────────────────────────────────┐
│                  apps/admin  (Next.js)                   │
│  ┌──────────────┐    ┌────────────────────────────────┐ │
│  │  Server      │    │  REST API  /api/...            │ │
│  │  Actions     │    │  (serves POS exclusively)      │ │
│  └──────┬───────┘    └────────────────────────────────┘ │
└─────────┼───────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────┐
│  packages/db  (Prisma + Neon PG) │
│  Single source of truth          │
└──────────────────────────────────┘
```

### Conflict Resolution & Sync Rules

| Rule | Behavior |
|---|---|
| **Authority** | Server is always the final source of truth |
| **Sale IDs** | UUIDs are generated client-side (offline safe) |
| **Inventory conflict** | First synced record wins |
| **Idempotency** | All sync operations are safe to retry |
| **Offline session** | Cashier operates with a locally stored valid token |

---

## Core Flow

### Cashier — Sell Without Internet

```
1. Open shift (Turno)  →  2. Scan / search product
        ↓
3. Add to cart          →  4. Confirm payment
        ↓
5. Sale written to Dexie.js (UUID assigned)
        ↓
6. Service Worker detects connectivity
        ↓
7. POST /api/sync-push  →  Server validates & persists
        ↓
8. Inventory deducted at branch level (Inventario_Sucursal)
```

### Cashier — Sequential Blind Audit

```
1. Start Dynamic Audit  →  2. Sequential product display
        ↓
3. "Blind" counting (no expected stock shown)
        ↓
4. Finalize local count  →  5. Sync to server
        ↓
6. Server reconciles counts vs. local sales during audit period
        ↓
7. Owner reviews discrepancies & applies stock adjustments
```

### Owner — Real-Time Business Intelligence

```
Admin Dashboard  →  Financial Reports & Balance (all branches)
                →  Net Profit Calculation (Sales - Expenses - COGS)
                →  Inventory audit trail (InventoryAudit + AuditItem)
                →  Expense categorization (Nomina, Renta, Variable)
                →  User & supplier management
```

---

## Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Monorepo** | Turborepo + pnpm | Workspace orchestration & task caching |
| **Admin Dashboard** | Next.js 14+ (App Router) | RSC, Server Actions, REST API host |
| **POS Client** | Vite + React + PWA | Offline-first cashier interface |
| **Database** | PostgreSQL via Neon | Cloud-hosted production database |
| **ORM** | Prisma | Type-safe schema, migrations, client |
| **Local DB (POS)** | Dexie.js | IndexedDB wrapper for offline storage |
| **Auth** | NextAuth.js (Auth.js) | Session management, role-based access |
| **UI Components** | Shadcn/UI + Tailwind CSS | Shared, accessible component system |
| **Typography** | Geist Sans | Clean, Apple-inspired typeface |
| **Local Dev DB** | Docker + PostgreSQL | Mirror production schema locally |

---

## Features

### 🛒 Point of Sale (POS)
- **Offline-first sales & expenses** — operate when internet is down
- **Petty cash management** — track small daily outgoings (caja chica)
- **Barcode / internal code search** — fast product lookup
- **Shift management** — open/close cash register with initial float
- **Multi-cashier on single device** — PIN-based quick session switching
- **Sequential Dynamic Audit** — blind counting flow for forced accuracy
- **Subtle connectivity indicator** — traffic-light dot (🟢 / 🟡 / 🔴)
- **Blocking success modal** — cashier must confirm each completed sale

### 📊 Admin Dashboard
- **Consolidated balance & utility** — net profit tracking across all branches
- **Operational expense registry** — log rent, payroll, and fixed costs
- **Real profit tracking** — `price - cost - expenses` margin calc
- **Inventory management** — per-branch stock levels via `Inventario_Sucursal`
- **Dynamic Audit Reporting** — KPI tracking (Product precision, financial impact)
- **Inventory audit log** — discrepancy tracking with reason codes
- **User management** — create cashiers, managers; assign PINs
- **Supplier directory** — contact info linked to products
- **Bulk price updates** — owner-level batch operations

### 🔐 Role-Based Access Control

| Action | DUEÑO | ENCARGADO | CAJERO |
|---|:---:|:---:|:---:|
| Create / View Sales | ✅ | ✅ | ✅ |
| Cancel / Delete Sale | ✅ | ✅ *(audit log required)* | ❌ |
| Adjust Inventory | ✅ | ✅ *(audit log required)* | ❌ |
| Create / Edit Products | ✅ | ✅ | ❌ |
| Financial Reports | Global | Global | Own shift only |
| User Management | ✅ | ❌ | ❌ |
| Access Admin Dashboard | ✅ | ✅ | ❌ |

---

## Data Model (Key Entities)

```prisma
User           → Role: DUENO | ENCARGADO | CAJERO
Sucursal       → Branch location
Producto       → costo + precio_publico (profit = price - cost)
Inventario_Sucursal → Stock per branch per product (@@unique)
Turno          → Cashier shift (ABIERTO | CERRADO)
Venta          → Sale (sync_status: PENDING | SYNCED)
Detalle_Venta  → Line items with historical unit price
Gasto          → Operational expenses (fixed or variable)
DynamicAudit   → Offline-initiated inventory reconciliation
DynamicAuditItem → Counted vs Expected vs Differences
InventoryAudit → Static audit session per shift
AuditItem      → Discrepancy record per product
Proveedor      → Supplier contact linked to products
```

---

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 9+](https://pnpm.io/installation)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) *(for local PostgreSQL)*

### 1. Clone & Install

```bash
git clone https://github.com/your-org/shopli.git
cd shopli
pnpm install
```

### 2. Start Local Database

```bash
docker-compose up -d
```

### 3. Configure Environment

```bash
# apps/admin/.env
DATABASE_URL="postgresql://shopli:shopli@localhost:5432/shoplidb"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
POS_SYNC_SECRET="your-sync-secret"

# apps/pos/.env
VITE_API_URL="http://localhost:3000"
VITE_SYNC_SECRET="your-sync-secret"
```

### 4. Run Migrations & Seed

```bash
# Generate Prisma client
pnpm --filter @shopli/db db:generate

# Push schema to local Docker DB
pnpm --filter @shopli/db db:push

# (Optional) Seed initial data
pnpm --filter @shopli/db db:seed
```

### 5. Start Development

```bash
pnpm dev
```

| App | URL |
|---|---|
| Admin Dashboard | http://localhost:3000 |
| POS Client | http://localhost:5173 |

---

## Development Principles

- **No business logic in JSX** — hooks handle state, abstractions handle complexity
- **Server is source of truth** — all financial calculations validated server-side
- **UUID-first** — no sequential IDs exposed publicly
- **Audit everything** — sale deletions, price changes, and inventory adjustments are always logged
- **Migrations in Docker first** — never apply untested migrations to Neon production
- **Financial logic must have unit tests** — no exceptions

---

## Project Team

> Built with ❤️ for small businesses that deserve enterprise-grade tools.

---

<div align="center">

**ShopLI** — *Your store never stops. Neither do you.*

</div>
