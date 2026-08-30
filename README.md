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
POS client computations are treated as untrusted. 
* All sales details, costs, and discounts are re-calculated on the server using secure database metrics before database insertion.
* Transactions with invalid recalculation parameters are rejected.

### Offline Bcrypt Verification
For cashier authentication without cloud access:
* Salted Bcrypt hashes of cashiers' PINs are securely synced to the local client's IndexedDB during initial online pairing.
* Local authentication compares PIN inputs against local hashes using a client-side Bcrypt implementation.

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
* **PDF Label Generator Layout Test:** Runs a local dry-run generation of PDF labels (Avery 3x10 grid and Thermal rolls) using mock data, saving them locally as `test-carta.pdf` and `test-termico.pdf` (both are git-ignored):
  ```bash
  pnpm --filter @shopli/db run db:test-pdf
  ```

---

## Engineering Standards

* **RSC Dominance:** All backend operations in the Admin dashboard must use React Server Components and Server Actions. Avoid API endpoints except for POS synchronization.
* **State Decoupling:** Keep business logic separated from the layout layer. Use custom hooks for reactivity.
* **Strict Auditing:** sales modifications, stock transactions, and inventory transfers must write audit trails to the database.
* **Unit Testing:** Write unit tests for all financial calculations, wholesale rule applications, and audit calculations.
