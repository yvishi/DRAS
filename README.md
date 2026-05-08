# DRAS — Disaster Resource Allocation System

A coordinated supply-chain platform for disaster relief. DRAS connects control centers, relief camps, and warehouses through a single requesting, approval, and dispatch pipeline — built on MySQL 8 with full ACID guarantees, role-based access control, and a stored-procedure-only mutation surface.

---

## What it does

When a disaster event is active, relief camps can raise resource requests (water, food, medicine, etc.). A control center admin reviews and approves them. The warehouse manager dispatches the approved goods. The camp officer confirms receipt. Every state change routes through a stored procedure so triggers and the audit log always fire correctly.

### Request lifecycle

```
Camp Officer  →  raises Request
Control Admin →  sp_Approve_Request  (locks stock, validates availability)
Warehouse Mgr →  sp_Dispatch_Request (deducts inventory, creates dispatch log)
Camp Officer  →  sp_Confirm_Delivery (records arrival, closes request)
```

### Key database features

| Feature | Detail |
|---------|--------|
| Tables | 13 tables, fully normalized to BCNF |
| Stored procedures | 4 — all mutations go through procedures |
| Triggers | Auto-fires `Stock_Alert` when inventory drops below threshold |
| Views | 6 operational views (`vw_Active_Requests`, `vw_Current_Inventory`, …) |
| Audit log | Every state change is recorded in `Audit_Log` via trigger |
| RBAC | 3 MySQL users with least-privilege grants |
| ACID safety | `sp_Approve_Request` uses `SELECT … FOR UPDATE` to prevent double-spend |

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Database | MySQL 8.0+ |
| Backend | Node.js + Express 4 |
| Frontend | React 18 + Vite 5 |
| API | REST JSON, proxied through Vite dev server |

---

## Project structure

```
DRAS/
├── sql/
│   ├── 01_ddl_tables.sql     — all 13 CREATE TABLE statements
│   ├── 02_indexes.sql        — indexes for query performance
│   ├── 03_functions.sql      — scalar SQL functions
│   ├── 04_procedures.sql     — 4 stored procedures
│   ├── 05_triggers.sql       — audit + stock-alert triggers
│   ├── 06_views.sql          — 6 operational views
│   ├── 07_security.sql       — MySQL users & GRANT statements
│   ├── 08_seed_data.sql      — demo dataset
│   └── 09_test_cases.sql     — manual test queries
├── backend/
│   ├── server.js             — Express app + all /api routes
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx            — client-side router (sessionStorage-based)
    │   ├── api.js             — fetch helpers for every endpoint
    │   ├── screens/           — Landing, Login, Admin, Camp, Warehouse
    │   └── components/        — TopBar, Sidebar, Icon, shared utilities
    ├── vite.config.js         — proxies /api → localhost:3001
    └── package.json
```

---

## Prerequisites

- **MySQL 8.0+** installed and running
- **Node.js 18+** (comes with npm)
- A terminal / command prompt

---

## Setup & run

### Step 1 — Clone or download the project

```bash
git clone <repo-url>
cd DRAS
```

### Step 2 — Set up the database

Open a MySQL session as root (or any user with CREATE privileges):

```bash
mysql -u root -p
```

Then run each SQL file in order:

```sql
SOURCE /path/to/DRAS/sql/01_ddl_tables.sql;
SOURCE /path/to/DRAS/sql/02_indexes.sql;
SOURCE /path/to/DRAS/sql/03_functions.sql;
SOURCE /path/to/DRAS/sql/04_procedures.sql;
SOURCE /path/to/DRAS/sql/05_triggers.sql;
SOURCE /path/to/DRAS/sql/06_views.sql;
SOURCE /path/to/DRAS/sql/07_security.sql;
SOURCE /path/to/DRAS/sql/08_seed_data.sql;
```

> On Windows use forward slashes or double backslashes in the path.  
> `07_security.sql` creates the three MySQL application users. Skip it if you only want the schema and data.

### Step 3 — Configure the backend

Open `backend/server.js` and find the database connection config near the top. Update it to match your local MySQL credentials:

```js
const db = mysql.createPool({
  host:     'localhost',
  user:     'root',       // or 'cc_admin' if you ran 07_security.sql
  password: 'yourpassword',
  database: 'DRAS',
});
```

### Step 4 — Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (open a second terminal)
cd frontend
npm install
```

### Step 5 — Start both servers

**Terminal 1 — backend** (runs on port 3001):

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend** (runs on port 5173):

```bash
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Login credentials

The frontend uses demo credentials. The password hint is always shown on the login page.

| Role | User ID | Password | Access |
|------|---------|----------|--------|
| Control Admin | `admin` | `admin123` | Full dashboard — approve requests, view all data |
| Camp Officer | `camp` | `camp123` | Raise requests, track incoming, confirm delivery |
| Warehouse Mgr | `warehouse` | `wh123` | Manage inventory, dispatch requests, restock |

> These are frontend-only demo credentials. The actual MySQL application users created by `07_security.sql` are `cc_admin / cc_pass123`, `camp_officer / camp_pass123`, and `warehouse_mgr / wh_pass123`.

---

## Features by role

### Control Admin
- **Overview** — live stats (active events, pending requests, in-transit dispatches, open stock alerts)
- **Disaster Events** — full table of all events with level, status, and camp count
- **Requests** — tabbed view (Pending / Approved / In transit / Delivered) with one-click Approve and lifecycle detail modal
- **Warehouses** — list of all registered warehouses and capacities
- **Inventory** — full cross-warehouse stock view with status badges
- **Dispatches** — complete dispatch log
- **Audit Log** — every state change recorded with actor, table, old/new values, timestamp

### Camp Officer
- **Overview** — camp details (name, linked event, occupancy, capacity) and request breakdown by status
- **My Requests** — full request list with ETA and one-click Confirm for dispatched items
- **New Request** — form to raise a request: choose priority (Low / Medium / High / Urgent), add line items (resource + quantity), submit
- **Incoming** — dispatch table for this camp's requests with Confirm button

### Warehouse Manager
- **Inventory** — live stock table with progress bar vs threshold and quick-Restock button
- **Alerts** — open stock alerts fired by trigger when stock crosses minimum threshold
- **Approved queue** — approved requests waiting to be dispatched; one-click Dispatch button
- **Dispatches** — history of all dispatches from this warehouse
- **Restock** — form to add stock for any resource (calls `sp_Restock`, resolves open alerts automatically)
- **Restock log** — history of all restock operations

---

## API endpoints

All endpoints are served by Express on `localhost:3001` and proxied through Vite at `/api/…`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | DB connection check |
| GET | `/api/stats` | Aggregate stats for admin overview |
| GET | `/api/events` | All disaster events |
| GET | `/api/requests` | All requests (filter: `?status=`, `?campId=`) |
| GET | `/api/requests/:id` | Single request with items, dispatch, delivery |
| POST | `/api/requests` | Create new request + line items |
| POST | `/api/requests/:id/approve` | Calls `sp_Approve_Request` |
| POST | `/api/requests/:id/dispatch` | Calls `sp_Dispatch_Request` |
| GET | `/api/dispatches` | All dispatches (filter: `?warehouseId=`, `?status=`) |
| POST | `/api/dispatches/:id/confirm` | Calls `sp_Confirm_Delivery` |
| GET | `/api/inventory` | Inventory (filter: `?warehouseId=`) |
| GET | `/api/alerts` | Open stock alerts (filter: `?warehouseId=`) |
| GET | `/api/warehouses` | All warehouses |
| GET | `/api/warehouses/:id/stats` | Stats for a single warehouse |
| GET | `/api/resources` | All resource types |
| GET | `/api/camps` | All camps with event info |
| GET | `/api/camps/:id/stats` | Stats for a single camp |
| POST | `/api/restock` | Calls `sp_Restock` |
| GET | `/api/restock-log` | Restock history (filter: `?warehouseId=`) |
| GET | `/api/audit` | Last 20 audit log entries |

---

## Notes

- **No real authentication** — credentials are hardcoded in the frontend for demo purposes. In a production system these would be replaced with proper auth tokens.
- **Seed data** — `08_seed_data.sql` populates the database with sample events, camps, warehouses, resources, and inventory so the dashboards are non-empty on first run.
- **Stored procedures are mandatory** — `camp_officer` and `warehouse_mgr` MySQL users cannot directly `UPDATE Warehouse_Inventory` or `Request.Status`. Every mutation must go through a procedure so triggers and audit log always fire.

---


