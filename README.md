<div align="center">

<img src=".github/assets/shopli-hero.webp" alt="ShopLI POS & BI Platform Showcase" width="100%" style="border-radius: 8px;" />

<br />
<br />

### **Offline-First POS & Business Intelligence Platform**

*Sell with zero latency. Guarantee transactional integrity offline. Auditable financial metrics. Always.*

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=flat-square&logo=turborepo&logoColor=white)](https://turbo.build/)
[![PWA](https://img.shields.io/badge/PWA-Offline--First-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![CI Suite](https://img.shields.io/github/actions/workflow/status/PatoCrazy2/shopli/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/PatoCrazy2/shopli/actions)

</div>

---

## System Topology

ShopLI separates administrative reporting and configuration from edge sales execution. The admin dashboard leverages server-side rendering (RSC) and Server Actions, while the POS runs as a highly resilient Progressive Web App (PWA) using an offline-first transactional engine.

```
                               ┌──────────────────┐
                               │    PostgreSQL    │
                               │ (Neon / Cloud)   │
                               └────────▲─────────┘
                                        │
                                        │ Prisma Client
                                        │
                         ┌──────────────┴──────────────┐
                         │         packages/db         │
                         └──────────────▲──────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         │       Next.js API &         │
                         │      Server Actions         │
                         └──────────────▲──────────────┘
                                        │
                  ┌─────────────────────┴─────────────────────┐
                  │                                           │
         HTTPS / JSON                                Background Sync
                  │                                  (Outbox Push)
                  ▼                                           ▼
       ┌─────────────────────┐                     ┌─────────────────────┐
       │     apps/admin      │                     │      apps/pos       │
       │ (Next.js Dashboard) │                     │ (Vite React PWA)    │
       └─────────────────────┘                     └──────────┬──────────┘
                                                              │
                                                              ▼
                                                        ┌───────────┐
                                                        │ IndexedDB │
                                                        │ (Local DB)│
                                                        └───────────┘
```

---

## Distributed Systems & Offline-First Engineering

### Logical Multi-Tenant Segregation
The database partition model enforces tenant separation at the query layer. 
* All core relations (User, Producto, Sucursal, Venta, Gasto, DynamicAudit) maintain an `empresa_id` foreign key.
* Server-side database clients append `empresa_id` filters dynamically derived from secure, server-signed JWT session contexts.
* During client synchronization, endpoints partition and stream catalogs specific to the tenant company.

### Idempotent Sync Protocol (Outbox Pattern)
Transactions completed at the edge are buffered locally in an IndexedDB write-ahead outbox.
* **UUID-V4 Resolution:** The POS client assigns immutable client-side UUIDs to all entities immediately.
* **Native Sync API:** The PWA Service Worker leverages the browser's native Background Sync API (`self.addEventListener('sync')`). When connectivity drops and returns, the browser executes the sync callback in the background, ensuring outbox payloads are delivered even if the user closes the PWA tab.
* **Idempotency Guard:** The server deduplicates incoming payloads using database unique constraints on transaction IDs. Re-transmitted payloads are processed cleanly without duplicating sales or expense logs.

### Delta-Based Incremental Sync (Pull Strategy)
To optimize data transfers and minimize bandwidth consumption in mobile or high-latency environments:
* **Timestamp Delta Tracking:** Catalog pulls do not fetch full tables. Instead, the POS requests record mutations using a `lastSyncedAt` timestamp.
* **Server-Side Filtering:** The API filters database queries using Prisma `updatedAt > lastSyncedAt` conditions, returning only creation, updates, or deletion deltas.
* **Incremental Local Updates:** The PWA applies these incoming deltas on IndexedDB tables, maintaining database synchronization without downloading redudant data.

### Service Worker Periodic Refresh
* **Daily catalog updates:** The Service Worker registers a native `periodicsync` task (`pull-catalog-daily`) with the browser's periodic sync scheduler. The browser wakes up the Service Worker in the background once a day to refresh the localized price lists and product catalogs automatically.

### Eventual Inventory Consistency
Offline sales decrement local stock immediately to provide instant UI feedback. During online reconciliation:
* **Asynchronous Reordering:** The database processes offline sales using their client-originated transaction timestamps.
* **Reconciliation handshakes:** Inventory counts are reconciled downstream during catalog pulls by comparing local schema states with server modification logs.

### Monorepo Schema & Package Segregation
* **Single Source of Truth:** All PostgreSQL schemas, custom types, and seed workflows reside in the `@shopli/db` workspace package.
* **Strict Type Safety:** Next.js Server Components and REST APIs consume this typed database package. The POS client matches these types to Dexie.js interfaces, providing compile-time type safety across database operations.

---

## Algorithmic & Business Core Highlights

### Blind Count & Dynamic Inventory Reconciliation
To allow inventory counts without interrupting cashier sales, ShopLI uses a dynamic reconciliation algorithm.

During a count, live sales continue to mutate stock levels. The system captures the state at start time $T_0$ and reconciles physical inputs using the transaction delta:

$$\text{Discrepancy} = Q_{\text{counted}} - \left( Q_{\text{expected at } T_0} - \sum Q_{\text{sold during } [T_0, T_{\text{end}}]} \right)$$

* **Zero-Bias Interface:** The cashier interface displays products sequentially, hiding the expected stock figures to enforce an objective physical count.
* **Time-Series Matching:** The server calculates the exact discrepancy by analyzing transaction logs created between the audit initialization and completion timestamps.
* **Retroactive Reconciliation & 72-Hour Hard Cutoff:** When late offline sales sync after an audit has been recorded or closed (`CLOSED`), the server retroactively recalculates `expectedAtCount` and `difference` for non-applied audits (`isApplied: false`) started within the last 72 hours (`startedAt >= now - 72h`).
* **Audit Trail Traceability:** Any retroactive discrepancy shift on closed audits automatically writes an immutable log to `MovimientoInventario` with `tipo: 'AJUSTE'` and detailed descriptive motivation referencing the sale ID and discrepancy delta, preventing silent data overwrites.
* **Strict Nonnegative Input Validation:** The Zod API boundary enforces `countedQuantity: z.number().int().nonnegative().nullable()`, blocking negative physical counts at the schema layer.

### Cross-Variant Grouped Wholesale Rules
Discounts are computed dynamically on variant families. If a product group exceeds a wholesale threshold, the pricing engine adjusts all variants of that family present in the cart:

```typescript
const familyQuantity = cart
  .filter(item => item.parent_id === targetParentId)
  .reduce((sum, item) => sum + item.quantity, 0);

if (familyQuantity >= minQuantityForWholesale) {
  cart.forEach(item => {
    if (item.parent_id === targetParentId) {
      item.price = item.precio_mayoreo;
    }
  });
}
```

### Client-Side QR Code & PDF Label Generation
To eliminate server load and avoid external microservice/render dependencies, ShopLI generates QR codes and compiles high-definition print-ready PDFs 100% on the client side using `jspdf` and `qrcode`.

* **Avery 5160 Grid Layout:** Compiles a standard Letter-sized sheet (3 columns x 10 rows, 30 labels total) with precise grid spacing. Automatically handles pagination and overflows.
* **Thermal Roll Layout:** Generates a continuous, single-label landscape PDF (50mm x 25mm) customized for standard barcode and thermal roll printers.
* **Metadata Overlay:** Each label embeds a generated vector QR code mapped to the product's unique SKU, alongside wrapped text including the product name, variant name, and price.

---

## Security Architecture

### Zero-Trust Client Verification
POS client computations are treated as untrusted input. The server enforces the following invariants on every sync:
* **Price recalculation:** For each incoming sale, the server fetches the official `precio_publico` and wholesale pricing rules (`precio_mayoreo`, `min_cantidad_mayoreo`) directly from the `Producto` catalog table and recalculates the expected total server-side. Any payload where the client-reported `total` deviates by more than ±$0.01 from the server-recalculated total is rejected with `422 Unprocessable Entity`.
* **Discount cap enforcement:** The server validates that each line-item `descuento_manual` does not exceed the item's subtotal (`precio × cantidad`). Negative totals from over-discounting are rejected at the API boundary.
* **Tenant isolation:** All product lookups during recalculation are scoped to the authenticated `empresaId`, preventing cross-tenant price spoofing.

### Offline Bcrypt Verification & Defense-in-Depth
For cashier authentication without cloud access:
* **6-Digit PIN & Tenant Uniqueness:** All cashiers and store managers use a 6-digit numeric PIN, validated for uniqueness across active users of the tenant company via salted Bcrypt comparisons during creation and reset workflows.
* **Direct 1:1 User Resolution:** The POS interface provides a visual cashier selector, executing targeted 1:1 `bcrypt.compare` checks against IndexedDB records instead of blind iterative loops.
* **72-Hour Offline Session TTL:** Disconnected devices verify credentials locally against a `lastOnlineVerification` timestamp refreshed on every successful synchronization. If offline continuously for > 72 hours, the POS locks access and requests network connectivity.
* **2-Tier Lockout Protection:**
  * *Tier 1 (Per-User Anti-DoS):* 3 consecutive failures trigger a 30s penalty; 5 failures trigger a 5min penalty; 10 failures permanently lock the cashier profile until online revalidation or manager assistance.
  * *Tier 2 (Global Terminal Anti-Spraying):* A 5-minute sliding window accumulates terminal-wide failures. Reaching 10 global failures freezes the login screen for 2 minutes, preventing horizontal brute-force attacks across cached employee profiles.
  * *Sync Isolation:* Network synchronization updates TTL verification timestamps without resetting active lockouts.

### Diagnostic & Rescue Module
An embedded settings drawer allows troubleshooting browser-level storage and caching:
* **Update Engine:** Triggers registration updates to force newer Service Worker iterations.
* **Account Separation:** Clears the local IndexedDB metadata scope and resets local state pointers.
* **Hard Reset:** Deletes the local IndexedDB schema, clears browser-level caches, unregisters Service Workers, and empties local storage to return the app to a clean state.

---

## Development Environment Setup

### Workspace Architecture
* `apps/admin`: Next.js 14+ Application Dashboard.
* `apps/pos`: Vite + React Progressive Web App.
* `packages/db`: Prisma schema and database utility module.

### Prerequisites
* Node.js 20+
* pnpm 9+
* Docker

### 1. Initialize Workspace
Clone the repository and install workspace dependencies:
```bash
git clone https://github.com/your-org/shopli.git
cd shopli
pnpm install
```

### 2. Configure Infrastructure
Start the development database instance:
```bash
docker-compose up -d
```

Configure environment files:

**`apps/admin/.env`**
```env
DATABASE_URL="postgresql://shopli:shopli@localhost:5432/shoplidb"
NEXTAUTH_SECRET="development-secret-key"
NEXTAUTH_URL="http://localhost:3000"
POS_SYNC_SECRET="development-sync-handshake"
```

**`apps/pos/.env`**
```env
VITE_API_BASE_URL="http://localhost:3000"
VITE_SYNC_SECRET="development-sync-handshake"
```

### 3. Generate Database Client & Seeds
Generate Prisma schemas and apply local migrations:
```bash
# Generate client artifacts
pnpm --filter @shopli/db db:generate

# Apply migrations
pnpm --filter @shopli/db exec prisma migrate dev

# Seed database with initial dataset
pnpm --filter @shopli/db db:seed
```

### 4. Start Development Servers
Run dev servers in parallel using Turborepo:
```bash
pnpm dev
```

* **Admin Dashboard:** http://localhost:3000
* **POS Client:** http://localhost:5173

### 5. Utility & Test Scripts
To run maintenance and custom development tests on the database and utility features:

* **SKU Batch Migration Script:** Generates unique sequential SKUs for all existing products and variants without a SKU:
  ```bash
  pnpm --filter @shopli/db run db:migrate-skus
  ```
* **Offline Auth & Security Suite:** Runs automated tests for 72-hour TTL expiration, 2-tier progressive lockout, and targeted 6-digit Bcrypt verification:
  ```bash
  pnpm --filter pos test:auth
  ```
* **Financial Logic Unit Suite:** Runs pure unit tests for cart financial calculations including wholesale family grouping, boundary conditions (familyQty === threshold), cross-family isolation, negative discount guards, and the roundCustom rounding function:
  ```bash
  pnpm --filter pos test
  ```
* **Dynamic Inventory Audit & Reconciliation Test Suites:** Runs pure unit tests for blind count discrepancy calculations, boundary conditions, limits rejection ($Q_{counted} < 0$), late sale retroactive reconciliation, 72h window cutoff, and idempotent retransmissions:
  ```bash
  pnpm --filter pos test src/__tests__/unit/inventory-audit.test.ts
  pnpm --filter pos test src/__tests__/unit/inventory-reconciliation.test.ts
  ```
* **Zero-Trust Integration Suite:** Runs end-to-end integration tests that verify the server rejects price-manipulated payloads with 422 Unprocessable Entity:
  ```bash
  pnpm --filter pos test
  ```
* **PDF Label Generator Layout Test:** Runs a local dry-run generation of PDF labels (Avery 3x10 grid and Thermal rolls) using mock data, saving them locally as `test-carta.pdf` and `test-termico.pdf` (both are git-ignored):
  ```bash
  pnpm --filter @shopli/db run db:test-pdf
  ```

---

## Continuous Integration & Branch Protection

ShopLI uses a strict GitHub Actions pipeline ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) executing on every `push` and `pull_request` against `main`:

```
┌─────────────────┐     ┌──────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│ Production Mode │ ──> │ Lint Codebase│ ──> │ Background Server    │ ──> │ POS Test Suite       │
│ Monorepo Build  │     │ (ESLint 9)   │     │ (Postgres + Next.js) │     │ (Unit & Integration) │
└─────────────────┘     └──────────────┘     └──────────────────────┘     └──────────────────────┘
```

1. **Production-Grade Monorepo Build:** Executes `pnpm build` with `NODE_ENV: production` to guarantee zero bundling or TypeScript errors under strict Vercel deployment conditions.
2. **ESLint 9 Flat Config Linting:** Runs unified linting across all monorepo packages (`@shopli/db`, `apps/admin`, `apps/pos`, `@repo/ui`).
3. **Ephemeral PostgreSQL Service:** Provisions an isolated `postgres:16-alpine` instance with healthchecks and runs Prisma migrations (`prisma db push`).
4. **Deterministic Server Bootstrap & Healthcheck:** Launches the Next.js API in the background (`NODE_ENV: test`) and polls the OPTIONS sync endpoint before running tests.
5. **Full Test Execution:** Runs all unit suites (financial calculations, inventory audit discrepancy formulas, asynchronous 72h reconciliation, and offline auth) along with end-to-end sync integration tests.
6. **Required Branch Checks:** Direct pushes to `main` are guarded; PRs require the `Build, Lint & Test` status check to pass before merging.

---

## Engineering Standards

* **RSC Dominance:** All backend operations in the Admin dashboard must use React Server Components and Server Actions. Avoid API endpoints except for POS synchronization.
* **State Decoupling:** Keep business logic separated from the layout layer. Use custom hooks for reactivity.
* **Strict Auditing:** sales modifications, stock transactions, and inventory transfers must write audit trails to the database.
* **Unit Testing & CI Compliance:** Write unit tests for all financial calculations, wholesale rule applications, and audit calculations. All tests must pass in CI before PR merge.
