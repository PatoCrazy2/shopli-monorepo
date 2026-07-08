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

## Architecture & Multi-Tenancy

ShopLI is built as a **Turborepo monorepo** with strict logical isolation and two distinct frontends serving a shared backend layer.

### 🏢 Multi-Tenant Isolation Model
The platform implements a **Logical Multi-Tenant Architecture** scoped at the `Empresa` (Company) level:
* **Strict Data Isolation:** All core entities (`User`, `Producto`, `Sucursal`, `Venta`, `Gasto`, `Proveedor`, `DynamicAudit`) are strictly tied to an `empresa_id` in the database.
* **API & Action Scoping:** The backend (`apps/admin`) automatically scopes all Server Actions and REST API endpoints using the authenticated user's session `empresa_id`. Data leaks across different companies are physically impossible.
* **POS Client Partitioning:** When a cashier logs in, the POS client (`apps/pos`) downloads *only* the catalog, sucursales, and users corresponding to their company, partitioning the local IndexedDB (`Dexie.js`) dynamically.

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    apps/pos  (PWA)                       │
│  ┌──────────────┐    ┌────────────────────────────────┐ │
│  │  Dexie.js    │◄───│  React Hooks + Service Worker  │ │
│  │ (Local DB    │    │  (Scoped to Empresa & Offline) │ │
│  │  by Empresa) │    │                                │ │
│  └──────┬───────┘    └────────────────────────────────┘ │
│         │  Background Sync (when online with Empresa ID) │
└─────────┼───────────────────────────────────────────────┘
          │  POST /api/pos/sync/push
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

### 🛒 Cashier — Sell Without Internet (Offline-First)

```
1. Open shift (Turno)  →  2. Scan / search product (offline DB)
        ↓
3. Add to cart          →  4. Confirm payment (local transaction)
        ↓
5. Sale written to Dexie.js (UUID & Timestamp assigned)
        ↓
6. Service Worker detects connectivity (automatically)
        ↓
7. POST /api/pos/sync/push  →  Server validates, saves, and resolves conflicts
        ↓
8. Inventory deducted at branch level (Inventario_Sucursal)
```

### 🔍 Cashier — Sequential Dynamic Audit (A Puertas Abiertas)
The POS allows cashiers to perform audits **without closing the store or pausing sales**:

```
1. Start Dynamic Audit  →  POS saves local timestamp (Start of Audit)
        ↓
2. Sequential Blind Counting  →  POS displays products one-by-one
                              →  No expected stock shown (forces physical count)
        ↓
3. Local sales continue  →  Cashier continues processing sales
                         →  All sales during audit are flagged locally
        ↓
4. Finish count & Sync   →  POS sends count data + sales log to server
        ↓
5. Server Reconciliation  →  Server queries expected stock at Start Timestamp
                          →  Deducts sales processed *during* the audit interval
                          →  Calculates true discrepancy: Counted vs (Expected - Sales)
        ↓
6. Owner Review & Adjust  →  Owner views financial impact & applies adjustments
```

### 📊 Owner — Real-Time Business Intelligence & Advanced Analytics

```
Admin Dashboard  →  Financial Reports: Filter by branch, shifts, and date ranges
                 →  Net Profit Calculation: Price - acquisition cost (COGS) - operational expenses
                 →  Operational Expense Registry: Scoped fixed/variable costs (payroll, rent)
                 →  Audit Trail: Track every stock modification (entries, transfers, adjustments)
                 →  Discrepancy Metrics: Precision % & total currency lost due to inventory shrinkage
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
- **Offline-First Sales & Expenses** — operate dynamically without internet connection.
- **Online Tenant Handshake** — login initial online to link the physical device with the target `Empresa` (Company) and fetch the isolated catalog database.
- **Multi-Cashier On Single Device** — PIN-based quick session switching, signing each transaction with the cashier's UUID.
- **Petty Cash Management** — track small daily outgoings (caja chica) at branch level.
- **Sequential Dynamic Audit (Blind Count)** — open-door inventory verification. The interface presents products sequentially without showing expected stock, enforcing forced accuracy.
- **Connectivity Traffic-Light (🟢 / 🟡 / 🔴)** — visual cue showing live connection status.
- **Blocking Success Modal** — prevents double-tapping and forces the cashier to visually confirm each completed sale.

### 📊 Admin Dashboard
- **Logical Multi-Tenant Scoping** — secure data access. Owners only see resources of their registered company; cashiers/managers are restricted to their assigned branch.
- **Advanced Net Profit Analytics** — computes dynamic net profit: `Price - Acquisition Cost (COGS) - Operational Expenses`.
- **Advanced Inventory Analytics** — detailed stock tracking per branch, discrepancy metrics (shrinkage percentage), and financial impact of missing items.
- **Centralized Stock History** — comprehensive audit logs of all entries, adjustments, and branch-to-branch transfers.
- **Operational Expense Registry** — log payroll, rent, and other fixed or variable costs.
- **Intelligent CSV Catalog Import** — smart parser with header auto-detection, schema verification, and automated mapping.
- **User & Role Management** — create users (Owners, Managers, Cashiers) and manage their security PINs.
- **Supplier Directory** — contact book linked directly to product acquisition.

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
MovimientoInventario → Centralized log for entry, adjustment, and transfer
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
VITE_API_BASE_URL="http://localhost:3000"
VITE_SYNC_SECRET="your-sync-secret"
```

### 4. Run Migrations & Initial Setup

```bash
# Generate Prisma client
pnpm --filter @shopli/db db:generate

# Apply migrations locally (Docker DB)
pnpm --filter @shopli/db exec prisma migrate dev

# (Optional) Seed initial demo data
pnpm --filter @shopli/db db:seed
```

### 5. Start Development & Register
1. Run the dev servers:
   ```bash
   pnpm dev
   ```
2. Navigate to `http://localhost:3000/register` to register your initial **Dueño (Owner)** account and create your **Empresa (Company)**.
3. Use those credentials to access the Dashboard and configure your sucursales/products, then log in on the POS client.

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

<div align="center">

**ShopLI** — *Your store never stops. Neither do you.*

</div>
