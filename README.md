# DRAS — Disaster Resource Allocation System

> B.Tech CS · Semester 4 · DBMS Mini-Project · 2026

A coordinated supply-chain platform for disaster relief. DRAS connects control centers, relief camps, and warehouses through a single requesting, approval, and dispatch pipeline — built on MySQL 8 with full ACID guarantees, role-based access control, and a stored-procedure-only mutation surface.

---

## Purpose

During a disaster event, relief operations fail not because resources are unavailable — but because there is no coordinated system to track *what is where*, *who asked for what*, and *whether it arrived*. DRAS solves this by providing:

- A **structured request pipeline**: Camp Officer raises → Control Admin approves → Warehouse dispatches → Camp confirms
- A **live inventory layer**: every dispatch deducts stock; every restock replenishes it; triggers fire alerts the moment stock drops below threshold
- A **complete audit trail**: every state change is immutably logged with old/new values and the actor's identity
- A **query console**: a standalone browser page (no login needed) to inspect and run all 37 SQL queries used in the system — useful for demonstrations and database reviews

---

## Request lifecycle

```
Camp Officer  →  raises Request
                    ↓
Control Admin →  sp_Approve_Request
                 • locks row with SELECT … FOR UPDATE
                 • validates system-wide stock via fn_Total_Stock()
                 • sets Approved_Qty on each line item
                    ↓
Warehouse Mgr →  sp_Dispatch_Request
                 • validates warehouse-level stock via fn_Check_Stock()
                 • deducts Warehouse_Inventory
                 • may fire trg_after_inventory_update → Stock_Alert
                 • inserts Dispatch_Log with fn_Calculate_ETA()
                    ↓
Camp Officer  →  sp_Confirm_Delivery
                 • inserts Delivery_Status (Actual_Arrival = NOW())
                 • closes the request
                 • fires trg_after_request_status_update → Audit_Log
```

---

## Key database features

| Feature | Detail |
|---------|--------|
| **Tables** | 13 tables, normalized to BCNF |
| **Stored Procedures** | 4 — `sp_Approve_Request`, `sp_Dispatch_Request`, `sp_Confirm_Delivery`, `sp_Restock` |
| **SQL Functions** | 3 — `fn_Check_Stock`, `fn_Total_Stock`, `fn_Calculate_ETA` |
| **Triggers** | `trg_after_inventory_update` auto-fires `Stock_Alert`; `trg_after_request_status_update` writes `Audit_Log` |
| **Views** | 6 — `vw_Current_Inventory`, `vw_Active_Requests`, `vw_Warehouse_Utilization`, `vw_Delivery_Performance`, `vw_Crisis_Demand` |
| **Audit Log** | Every state change recorded with actor, table, old/new values (JSON), timestamp |
| **RBAC** | 3 MySQL users (`cc_admin`, `camp_officer`, `warehouse_mgr`) with least-privilege grants |
| **ACID safety** | `sp_Approve_Request` uses `SELECT … FOR UPDATE` inside a transaction to prevent double-spend |

---

## Tech stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Database | MySQL | 8.0+ |
| Backend | Node.js + Express | Express 4.18, mysql2 3.6 |
| Frontend | React + Vite | React 18, Vite 5 |
| API | REST / JSON | 22 endpoints, proxied through Vite |

---

## Project structure

```
DRAS/
├── sql/
│   ├── 01_ddl_tables.sql     — 13 CREATE TABLE statements with FKs, checks, UNIQUE constraints
│   ├── 02_indexes.sql        — performance indexes on status, priority, time columns
│   ├── 03_functions.sql      — fn_Check_Stock, fn_Total_Stock, fn_Calculate_ETA
│   ├── 04_procedures.sql     — sp_Approve_Request, sp_Dispatch_Request, sp_Confirm_Delivery, sp_Restock
│   ├── 05_triggers.sql       — stock-alert trigger, audit-log trigger, request guard trigger
│   ├── 06_views.sql          — 6 reporting views
│   ├── 07_security.sql       — MySQL user creation and GRANT statements
│   ├── 08_seed_data.sql      — demo events, camps, warehouses, inventory, requests
│   └── 09_test_cases.sql     — manual test queries
│
├── backend/
│   ├── server.js             — Express app with all /api routes
│   ├── queries.js            — catalog of 37 classified queries (used by Query Console)
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── App.jsx            — client-side router (sessionStorage-based, no library)
    │   ├── api.js             — typed fetch helpers for every endpoint
    │   ├── screens/
    │   │   ├── Landing.jsx    — project homepage with feature overview
    │   │   ├── Login.jsx      — demo role selector
    │   │   ├── Admin.jsx      — control center dashboard
    │   │   ├── Camp.jsx       — camp officer dashboard
    │   │   ├── Warehouse.jsx  — warehouse manager dashboard
    │   │   └── QueryConsole.jsx — standalone SQL query browser
    │   └── components/
    │       ├── TopBar.jsx
    │       ├── Sidebar.jsx
    │       ├── Icon.jsx
    │       └── shared.jsx     — StatusBadge, PriorityCell, Spinner, time helpers
    ├── vite.config.js         — proxies /api → localhost:3001
    └── package.json
```

---

## Prerequisites

- **XAMPP** (or any MySQL 8.0+ installation) running on port 3306
- **Node.js 18+** with npm
- A browser (Chrome / Firefox / Edge)

---

## Setup & run

### Step 1 — Database setup

Start MySQL (e.g. via XAMPP Control Panel → Start MySQL). Open a MySQL session:

```bash
mysql -u root -p
```

Run each SQL file in order (replace the path with the absolute path on your machine):

```sql
SOURCE C:/path/to/DRAS/sql/01_ddl_tables.sql;
SOURCE C:/path/to/DRAS/sql/02_indexes.sql;
SOURCE C:/path/to/DRAS/sql/03_functions.sql;
SOURCE C:/path/to/DRAS/sql/04_procedures.sql;
SOURCE C:/path/to/DRAS/sql/05_triggers.sql;
SOURCE C:/path/to/DRAS/sql/06_views.sql;
SOURCE C:/path/to/DRAS/sql/07_security.sql;
SOURCE C:/path/to/DRAS/sql/08_seed_data.sql;
```

> **Windows tip:** Use forward slashes (`C:/...`) or escaped backslashes (`C:\\...`) inside MySQL's SOURCE command.  
> `07_security.sql` creates the three application users. Skip it if you only need the schema and seed data.

### Step 2 — Configure the backend password (if needed)

Open `backend/server.js`. If your MySQL root has a password, set it on line ~18:

```js
const pool = mysql.createPool({
  host:     'localhost',
  port:     3306,
  user:     'root',
  password: 'yourpassword',   // ← change this
  database: 'DRAS',
});
```

### Step 3 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open a second terminal)
cd frontend
npm install
```

### Step 4 — Start both servers

**Terminal 1 — backend** (port 3001):
```bash
cd backend
node server.js
```

**Terminal 2 — frontend** (port 5173):
```bash
cd frontend
npm run dev
```

### Step 5 — Open in browser

| URL | What you get |
|-----|-------------|
| `http://localhost:5173` | Main application (login required) |
| `http://localhost:5173` → Query Console button | SQL query browser (no login needed) |

---

## Login credentials

Credentials are shown as hints on the login page. No real authentication is used — this is a demo system.

| Role | Username | Password | Access |
|------|----------|----------|--------|
| Control Admin | `admin` | `admin123` | Full dashboard — approve requests, view all data, audit log |
| Camp Officer | `camp` | `camp123` | Raise requests, track deliveries, confirm receipt |
| Warehouse Manager | `warehouse` | `wh123` | Manage inventory, dispatch requests, restock |

> The MySQL application users created by `07_security.sql` are: `cc_admin / cc_pass123`, `camp_officer / camp_pass123`, `warehouse_mgr / wh_pass123`. These enforce row-level access restrictions independent of the frontend.

---

## Features

### Query Console

A built-in SQL browser accessible without logging in. Click **Query Console** on the home page or in the Admin sidebar.

- **37 queries** organized into **8 categories**
- Each query shows: title, description of what it demonstrates, syntax-highlighted SQL
- Click **Run Query** to execute it live against the database and see results in a table with row count and execution time
- Stored procedure definitions are shown but not executed (they modify data)

| Category | Queries | Demonstrates |
|----------|---------|-------------|
| Views | 5 | Pre-built reporting views, CASE expressions, GROUP BY |
| Core Data | 6 | Direct SELECTs, correlated subqueries, FIELD() ordering |
| Filtered Queries | 5 | WHERE, DATE_SUB, TIMESTAMPDIFF |
| Aggregation & Analytics | 5 | GROUP BY, COUNT/SUM/AVG, ROUND, NULLIF |
| SQL Functions | 4 | fn_Check_Stock, fn_Total_Stock, fn_Calculate_ETA |
| Stored Procedures | 4 | Transaction logic, FOR UPDATE, ON DUPLICATE KEY |
| Joins & Subqueries | 4 | 6-table LEFT JOIN, NOT EXISTS, GROUP_CONCAT |
| Audit & Logs | 4 | Audit trail, restock log, delivery confirmations |

### Control Admin dashboard

- **Overview** — live stats: active events, pending requests, in-transit dispatches, open stock alerts, high-severity events
- **Disaster Events** — full event table ordered by severity (Critical → High → Medium → Low) with camp count
- **Requests** — tabbed view (Pending / Approved / In transit / Delivered) with one-click Approve and full lifecycle detail modal
- **Warehouses** — all registered warehouses with location and capacity
- **Inventory** — cross-warehouse stock view with OK / LOW STOCK / OUT OF STOCK badges
- **Dispatches** — complete dispatch log with resource manifests
- **Audit Log** — immutable change history: actor, table, old value, new value, timestamp

### Camp Officer dashboard

- **Overview** — camp name, linked disaster event, occupancy vs capacity, request status breakdown
- **My Requests** — all requests for this camp with current status and ETA
- **New Request** — form to raise a request: select priority (Low / Medium / High / Urgent), add resource line items, submit
- **Incoming** — dispatch tracker; Confirm delivery button writes to Delivery_Status via `sp_Confirm_Delivery`

### Warehouse Manager dashboard

- **Inventory** — live stock per resource with progress bar vs minimum threshold; quick Restock button inline
- **Stock Alerts** — open alerts auto-created by trigger when quantity drops below threshold
- **Approved Queue** — requests approved and waiting to be dispatched; one-click Dispatch
- **Dispatch History** — all dispatches from this warehouse with status and resource detail
- **Restock** — form to add stock (calls `sp_Restock`; auto-resolves related alert if threshold is crossed)
- **Restock Log** — full replenishment history with supplier info

---

## API endpoints

All endpoints are served by Express on port 3001. The Vite dev server proxies `/api/…` so the frontend can call them with relative URLs.

### Application endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | DB connection check |
| GET | `/api/stats` | Aggregate stats for the admin overview tiles |
| GET | `/api/events` | All disaster events (ordered by severity) |
| GET | `/api/requests` | All requests with resource summary (`?status=`, `?campId=`) |
| GET | `/api/requests/:id` | Single request with line items, dispatch info, delivery status |
| POST | `/api/requests` | Create new request + line items (transaction) |
| POST | `/api/requests/:id/approve` | Calls `sp_Approve_Request` |
| POST | `/api/requests/:id/dispatch` | Calls `sp_Dispatch_Request` (body: `{ warehouseId }`) |
| GET | `/api/dispatches` | All dispatches (`?warehouseId=`, `?status=`) |
| POST | `/api/dispatches/:id/confirm` | Calls `sp_Confirm_Delivery` |
| GET | `/api/inventory` | Stock levels (`?warehouseId=` for single warehouse) |
| GET | `/api/alerts` | Open stock alerts (`?warehouseId=`) |
| GET | `/api/warehouses` | All warehouses |
| GET | `/api/warehouses/:id/stats` | SKU count, low-stock count, queue, alerts for one warehouse |
| GET | `/api/resources` | All resource types |
| GET | `/api/camps` | All relief camps with event info |
| GET | `/api/camps/:id/stats` | Active, awaiting, delivered, pending-confirm counts for one camp |
| POST | `/api/restock` | Calls `sp_Restock` (body: `{ warehouseId, resourceId, qty, supplier }`) |
| GET | `/api/restock-log` | Restock history (`?warehouseId=`) |
| GET | `/api/audit` | Last 20 audit log entries |

### Query Console endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/query-console/catalog` | Full catalog of 37 predefined queries (metadata + SQL) |
| GET | `/api/query-console/run/:id` | Execute a query by ID; returns `{ columns, rows, executionTime }` |

---

## Database schema overview

```
Control_Center ──┐
                 ├──► Request ──► Request_Details ──► Resource
Relief_Camp ─────┘       │                              │
    │                    ▼                              │
Disaster_Event      Dispatch_Log ◄──────────────────────┤
                         │                              │
                    Delivery_Status              Warehouse_Inventory
                                                        │
                                                    Stock_Alert
                                                    Restock_Log
                                                    Audit_Log
```

### Table descriptions

| Table | Purpose |
|-------|---------|
| `Disaster_Event` | Active or past disaster events with severity level |
| `Control_Center` | Regional command nodes that manage requests |
| `Relief_Camp` | Camps linked to a disaster event |
| `Warehouse` | Storage facilities with location and capacity |
| `Resource` | Resource types (Food / Medical / Shelter / Utility) |
| `Request` | A camp's resource request; tracks lifecycle status |
| `Request_Details` | Line items per request (resource + qty) |
| `Warehouse_Inventory` | Current stock per warehouse per resource |
| `Dispatch_Log` | Shipments from warehouse to camp |
| `Delivery_Status` | Camp confirmation of a received shipment |
| `Restock_Log` | Record of every inventory replenishment |
| `Stock_Alert` | Auto-created when inventory crosses Min_Threshold downward |
| `Audit_Log` | Immutable log of all state changes (JSON old/new values) |

---

## Role-based access (MySQL RBAC)

Three MySQL users are created by `07_security.sql`, each with the minimum permissions needed:

| User | Permissions |
|------|------------|
| `cc_admin` | `ALL PRIVILEGES` on `DRAS.*` |
| `camp_officer` | SELECT on views, INSERT on Request/Request_Details, EXECUTE on `sp_Confirm_Delivery` |
| `warehouse_mgr` | SELECT on views, EXECUTE on `sp_Dispatch_Request` and `sp_Restock` |

`camp_officer` and `warehouse_mgr` **cannot** directly `UPDATE Warehouse_Inventory` or `Request.Status`. All mutations go through stored procedures so triggers and the audit log always fire.

---

## Notes

- **No real authentication** — credentials are hardcoded in the frontend for demo purposes. Production would replace this with JWT or session-based auth.
- **Seed data** — `08_seed_data.sql` inserts sample events, camps, warehouses, resources, and inventory records so all dashboards are populated on first run.
- **Procedure-only mutations** — the system is designed so no business logic bypasses stored procedures. This guarantees triggers fire on every state change, which keeps the audit log and stock alerts accurate.
- **Concurrent safety** — `sp_Approve_Request` uses `SELECT … FOR UPDATE` inside a `START TRANSACTION` block. Two simultaneous approvals for the same stock cannot both succeed.
