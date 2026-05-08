// DRAS Query Console — complete query catalog
// 37 queries across 8 categories covering every SQL feature in the project.

const QUERIES = [

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 1 — VIEWS
  // Pre-built views that join / aggregate multiple tables into readable shapes.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'view_current_inventory',
    category: 'Views',
    title: 'vw_Current_Inventory — Stock Status',
    description:
      'Shows every warehouse × resource combination with a CASE-derived status label ' +
      '(OK / LOW STOCK / OUT OF STOCK). Joins Warehouse_Inventory ⟶ Warehouse ⟶ Resource. ' +
      'Used by the Warehouse dashboard and by camp_officer / warehouse_mgr via RBAC grants.',
    sql:
`SELECT *
FROM   vw_Current_Inventory
ORDER  BY Stock_Status, Warehouse_Name, Resource_Name`,
    type: 'SELECT',
  },

  {
    id: 'view_active_requests',
    category: 'Views',
    title: 'vw_Active_Requests — In-Flight Requests',
    description:
      'Exposes only Pending, Approved, and Dispatched requests. ' +
      'Joins Request ⟶ Relief_Camp ⟶ Disaster_Event. ' +
      'A correlated subquery counts line-items per request without a separate round-trip. ' +
      'Restricted view granted to camp_officer and warehouse_mgr.',
    sql:
`SELECT *
FROM   vw_Active_Requests
ORDER  BY Request_Time DESC`,
    type: 'SELECT',
  },

  {
    id: 'view_warehouse_utilization',
    category: 'Views',
    title: 'vw_Warehouse_Utilization — Storage Summary',
    description:
      'Aggregates total unique resource SKUs and total item count per warehouse. ' +
      'Uses LEFT JOIN so warehouses with zero inventory still appear in the result. ' +
      'GROUP BY on the primary key (W_ID) satisfies ONLY_FULL_GROUP_BY.',
    sql:
`SELECT *
FROM   vw_Warehouse_Utilization
ORDER  BY Total_Items_Stored DESC`,
    type: 'SELECT',
  },

  {
    id: 'view_delivery_performance',
    category: 'Views',
    title: 'vw_Delivery_Performance — Transit Time',
    description:
      'Calculates door-to-door transit hours for every completed delivery using ' +
      'TIMESTAMPDIFF(HOUR, Dispatch_Time, Actual_Arrival). ' +
      'Only dispatches with a Delivery_Status entry appear (inner join on Dispatch_ID).',
    sql:
`SELECT *
FROM   vw_Delivery_Performance
ORDER  BY Dispatch_Time DESC`,
    type: 'SELECT',
  },

  {
    id: 'view_crisis_demand',
    category: 'Views',
    title: 'vw_Crisis_Demand — Demand by Severity',
    description:
      'Aggregates resource demand (SUM of Requested_Qty and Approved_Qty) grouped by ' +
      'disaster severity level. Joins five tables: Disaster_Event ⟶ Relief_Camp ⟶ Request ' +
      '⟶ Request_Details ⟶ Resource. Reveals fulfillment gaps per crisis level.',
    sql:
`SELECT *
FROM   vw_Crisis_Demand
ORDER  BY FIELD(Crisis_Level, 'Critical', 'High', 'Medium', 'Low'),
          Resource_Name`,
    type: 'SELECT',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 2 — CORE DATA
  // Direct SELECTs on the 13 base tables — the raw facts of the system.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'core_events',
    category: 'Core Data',
    title: 'Disaster Events — Priority-Ordered',
    description:
      'Lists all disaster events sorted by severity (Critical first) using FIELD() for ' +
      'custom enum ordering, then chronologically. A correlated subquery counts the ' +
      'number of relief camps linked to each event without a JOIN + GROUP BY.',
    sql:
`SELECT e.*,
       (SELECT COUNT(*)
        FROM   Relief_Camp
        WHERE  Event_ID = e.Event_ID) AS Camp_Count
FROM   Disaster_Event e
ORDER  BY FIELD(e.Level, 'Critical', 'High', 'Medium', 'Low'),
          e.Start_Date DESC`,
    type: 'SELECT',
  },

  {
    id: 'core_requests',
    category: 'Core Data',
    title: 'All Requests — with Resource Summary',
    description:
      'The main admin request list. Uses a correlated subquery with GROUP_CONCAT to build ' +
      'a comma-separated resource summary string per request ("Water (50L), Food (30kg)"). ' +
      'Joins four tables: Request ⟶ Relief_Camp ⟶ Disaster_Event ⟶ Control_Center.',
    sql:
`SELECT r.Req_ID,
       r.Priority,
       r.Status,
       r.Request_Time,
       c.Name  AS Camp_Name,
       e.Name  AS Event_Name,
       e.Level AS Event_Level,
       cc.Name AS Control_Center,
       (SELECT GROUP_CONCAT(
                 CONCAT(res.Name, ' (', rd.Requested_Qty, ')')
                 SEPARATOR ', ')
        FROM   Request_Details rd
        JOIN   Resource res ON rd.Res_ID = res.Res_ID
        WHERE  rd.Req_ID = r.Req_ID)   AS Resource_Summary,
       (SELECT COUNT(*)
        FROM   Request_Details
        WHERE  Req_ID = r.Req_ID)      AS Total_Items
FROM   Request r
JOIN   Relief_Camp    c  ON r.Camp_ID = c.Camp_ID
JOIN   Disaster_Event e  ON c.Event_ID = e.Event_ID
JOIN   Control_Center cc ON r.CC_ID   = cc.CC_ID
ORDER  BY r.Request_Time DESC
LIMIT  50`,
    type: 'SELECT',
  },

  {
    id: 'core_camps',
    category: 'Core Data',
    title: 'Relief Camps with Event Info',
    description:
      'All registered relief camps joined with their parent disaster event. ' +
      'Shows occupancy vs capacity so over-capacity camps are visible at a glance.',
    sql:
`SELECT c.Camp_ID,
       c.Name              AS Camp_Name,
       c.Location,
       c.Current_Occupancy,
       c.Max_Capacity,
       e.Name  AS Event_Name,
       e.Level AS Event_Level,
       e.Status AS Event_Status
FROM   Relief_Camp    c
JOIN   Disaster_Event e ON c.Event_ID = e.Event_ID
ORDER  BY FIELD(e.Level, 'Critical', 'High', 'Medium', 'Low'), c.Name`,
    type: 'SELECT',
  },

  {
    id: 'core_warehouses',
    category: 'Core Data',
    title: 'All Warehouses',
    description:
      'Master list of storage warehouses with physical location and volume capacity (m³). ' +
      'Simple SELECT — warehouse_mgr and camp_officer can read this via the RBAC views.',
    sql:
`SELECT *
FROM   Warehouse
ORDER  BY Name`,
    type: 'SELECT',
  },

  {
    id: 'core_resources',
    category: 'Core Data',
    title: 'Resource Catalogue',
    description:
      'Every resource type in the system with its category (Food / Medical / Shelter / Utility) ' +
      'and unit of measure (kg, L, boxes, units). This is the dimension table that ' +
      'Request_Details and Warehouse_Inventory reference.',
    sql:
`SELECT *
FROM   Resource
ORDER  BY Type, Name`,
    type: 'SELECT',
  },

  {
    id: 'core_control_centers',
    category: 'Core Data',
    title: 'Control Centers',
    description:
      'Regional command nodes that create and approve requests. ' +
      'Each Request row carries a CC_ID foreign key back to this table.',
    sql:
`SELECT *
FROM   Control_Center
ORDER  BY Name`,
    type: 'SELECT',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 3 — FILTERED QUERIES
  // Targeted SELECTs that use WHERE clauses to isolate operationally relevant rows.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'filter_pending',
    category: 'Filtered Queries',
    title: 'Pending Requests — Approval Queue',
    description:
      'Control Admin approval queue: only Pending requests, sorted by priority then ' +
      'request time (oldest Urgent first). Uses FIELD() for enum-aware sorting — standard ' +
      'ORDER BY would sort alphabetically, which is wrong for priority.',
    sql:
`SELECT r.Req_ID,
       r.Priority,
       r.Request_Time,
       c.Name  AS Camp_Name,
       e.Level AS Severity,
       (SELECT COUNT(*) FROM Request_Details WHERE Req_ID = r.Req_ID) AS Item_Count
FROM   Request r
JOIN   Relief_Camp    c ON r.Camp_ID  = c.Camp_ID
JOIN   Disaster_Event e ON c.Event_ID = e.Event_ID
WHERE  r.Status = 'Pending'
ORDER  BY FIELD(r.Priority, 'Urgent', 'High', 'Medium', 'Low'),
          r.Request_Time ASC`,
    type: 'SELECT',
  },

  {
    id: 'filter_in_transit',
    category: 'Filtered Queries',
    title: 'In-Transit Dispatches',
    description:
      'All shipments currently on the road. TIMESTAMPDIFF shows how many hours each ' +
      'dispatch has already been travelling as of query time (NOW()). ' +
      'Sorted oldest-first so overdue deliveries surface at the top.',
    sql:
`SELECT dl.Dispatch_ID,
       dl.Req_ID,
       w.Name  AS From_Warehouse,
       c.Name  AS To_Camp,
       r.Priority,
       dl.Dispatch_Time,
       dl.Estimated_Arrival,
       TIMESTAMPDIFF(HOUR, dl.Dispatch_Time, NOW()) AS Hours_En_Route
FROM   Dispatch_Log  dl
JOIN   Warehouse     w  ON dl.W_ID      = w.W_ID
JOIN   Request       r  ON dl.Req_ID    = r.Req_ID
JOIN   Relief_Camp   c  ON r.Camp_ID    = c.Camp_ID
WHERE  dl.Status = 'In_Transit'
ORDER  BY dl.Dispatch_Time ASC`,
    type: 'SELECT',
  },

  {
    id: 'filter_low_stock',
    category: 'Filtered Queries',
    title: 'Low-Stock Items — Below Threshold',
    description:
      'All warehouse × resource rows where Quantity < Min_Threshold (or zero). ' +
      'Deficit column shows the shortfall. Sorted by (Quantity / Min_Threshold) ascending ' +
      'so the most critical shortages appear first. ' +
      'These rows trigger trg_after_inventory_update to fire a Stock_Alert.',
    sql:
`SELECT w.Name  AS Warehouse_Name,
       r.Name  AS Resource_Name,
       r.Type,
       wi.Quantity,
       wi.Min_Threshold,
       wi.Min_Threshold - wi.Quantity AS Deficit,
       CASE
         WHEN wi.Quantity <= 0 THEN 'OUT OF STOCK'
         ELSE                       'LOW STOCK'
       END AS Status
FROM   Warehouse_Inventory wi
JOIN   Warehouse w ON wi.W_ID   = w.W_ID
JOIN   Resource  r ON wi.Res_ID = r.Res_ID
WHERE  wi.Quantity < wi.Min_Threshold
ORDER  BY (wi.Quantity / GREATEST(wi.Min_Threshold, 1)) ASC`,
    type: 'SELECT',
  },

  {
    id: 'filter_open_alerts',
    category: 'Filtered Queries',
    title: 'Open Stock Alerts (Resolved = FALSE)',
    description:
      'All auto-generated stock alerts not yet resolved by a restock. ' +
      'These rows are written by trg_after_inventory_update the moment Quantity crosses ' +
      'Min_Threshold downward. They auto-resolve via trg_after_inventory_restock ' +
      'when sp_Restock pushes quantity back above the threshold.',
    sql:
`SELECT sa.Alert_ID,
       sa.Alert_Time,
       w.Name  AS Warehouse_Name,
       r.Name  AS Resource_Name,
       wi.Quantity,
       wi.Min_Threshold,
       wi.Min_Threshold - wi.Quantity AS Deficit
FROM   Stock_Alert         sa
JOIN   Warehouse           w  ON sa.W_ID   = w.W_ID
JOIN   Resource            r  ON sa.Res_ID = r.Res_ID
JOIN   Warehouse_Inventory wi ON sa.W_ID   = wi.W_ID
                              AND sa.Res_ID = wi.Res_ID
WHERE  sa.Resolved = FALSE
ORDER  BY sa.Alert_Time DESC`,
    type: 'SELECT',
  },

  {
    id: 'filter_recent_deliveries',
    category: 'Filtered Queries',
    title: 'Deliveries in the Last 7 Days',
    description:
      'Completed and confirmed deliveries within a rolling 7-day window. ' +
      'DATE_SUB(NOW(), INTERVAL 7 DAY) is evaluated at query time — no hard-coded dates. ' +
      'Joins Request ⟶ Dispatch_Log ⟶ Delivery_Status for the full confirmation record.',
    sql:
`SELECT r.Req_ID,
       c.Name      AS Camp_Name,
       r.Priority,
       dl.Dispatch_Time,
       ds.Actual_Arrival,
       ds.Received_By,
       ds.Confirmation,
       TIMESTAMPDIFF(HOUR, dl.Dispatch_Time, ds.Actual_Arrival) AS Transit_Hours
FROM   Request         r
JOIN   Relief_Camp     c  ON r.Camp_ID       = c.Camp_ID
JOIN   Dispatch_Log    dl ON r.Req_ID        = dl.Req_ID
JOIN   Delivery_Status ds ON dl.Dispatch_ID  = ds.Dispatch_ID
WHERE  r.Status      = 'Delivered'
  AND  r.Request_Time >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER  BY ds.Actual_Arrival DESC`,
    type: 'SELECT',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 4 — AGGREGATION & ANALYTICS
  // GROUP BY, COUNT, SUM, AVG, ROUND, NULLIF — report-style queries.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'agg_dashboard_stats',
    category: 'Aggregation & Analytics',
    title: 'System-Wide Dashboard Stats',
    description:
      'Five scalar subqueries in a single SELECT — the five tiles on the Admin overview. ' +
      'No joins required; each subquery is an independent COUNT on its target table. ' +
      'This pattern avoids a slow UNION and returns one compact row.',
    sql:
`SELECT
  (SELECT COUNT(*) FROM Disaster_Event
   WHERE  Status = 'Active')                                       AS Active_Events,
  (SELECT COUNT(*) FROM Request
   WHERE  Status = 'Pending')                                      AS Pending_Requests,
  (SELECT COUNT(*) FROM Dispatch_Log
   WHERE  Status = 'In_Transit')                                   AS In_Transit,
  (SELECT COUNT(*) FROM Stock_Alert
   WHERE  Resolved = FALSE)                                        AS Open_Alerts,
  (SELECT COUNT(*) FROM Disaster_Event
   WHERE  Status = 'Active'
     AND  Level IN ('High', 'Critical'))                           AS High_Severity_Events`,
    type: 'SELECT',
  },

  {
    id: 'agg_request_status_dist',
    category: 'Aggregation & Analytics',
    title: 'Request Status Distribution',
    description:
      'Breaks down total requests by status with a calculated percentage share. ' +
      'ROUND(..., 1) formats the ratio. FIELD() in ORDER BY gives pipeline-order sorting ' +
      'instead of alphabetical — a common pattern when statuses have logical sequence.',
    sql:
`SELECT Status,
       COUNT(*) AS Count,
       ROUND(COUNT(*) * 100.0 /
             (SELECT COUNT(*) FROM Request), 1) AS Pct
FROM   Request
GROUP  BY Status
ORDER  BY FIELD(Status,
               'Pending', 'Approved', 'Dispatched',
               'Delivered', 'Cancelled')`,
    type: 'SELECT',
  },

  {
    id: 'agg_resource_demand',
    category: 'Aggregation & Analytics',
    title: 'Resource Demand vs Fulfillment',
    description:
      'SUM of requested and approved quantities per resource across all requests. ' +
      'Fulfillment_Rate_Pct uses NULLIF to guard against division-by-zero when no requests ' +
      'exist for a resource. Highlights supply-demand gaps across the system.',
    sql:
`SELECT r.Name                      AS Resource_Name,
       r.Type,
       r.Unit,
       SUM(rd.Requested_Qty)        AS Total_Requested,
       SUM(rd.Approved_Qty)         AS Total_Fulfilled,
       ROUND(
         SUM(rd.Approved_Qty) * 100.0 /
         NULLIF(SUM(rd.Requested_Qty), 0),
       1)                           AS Fulfillment_Rate_Pct
FROM   Request_Details rd
JOIN   Resource        r ON rd.Res_ID = r.Res_ID
GROUP  BY r.Res_ID
ORDER  BY Total_Requested DESC`,
    type: 'SELECT',
  },

  {
    id: 'agg_warehouse_stock_summary',
    category: 'Aggregation & Analytics',
    title: 'Stock Summary by Warehouse',
    description:
      'Aggregates unique SKU count, total items, below-threshold SKU count, and open alert ' +
      'count per warehouse. Uses a CASE inside SUM (the "conditional aggregate" pattern) ' +
      'to count low-stock rows without a subquery. A correlated subquery handles alerts.',
    sql:
`SELECT w.Name        AS Warehouse_Name,
       w.Location,
       COUNT(wi.Inv_ID)                                           AS Unique_SKUs,
       SUM(wi.Quantity)                                           AS Total_Items,
       SUM(CASE WHEN wi.Quantity < wi.Min_Threshold THEN 1
                ELSE 0 END)                                       AS SKUs_Below_Threshold,
       (SELECT COUNT(*) FROM Stock_Alert sa
        WHERE  sa.W_ID = w.W_ID AND sa.Resolved = FALSE)         AS Open_Alerts
FROM   Warehouse           w
LEFT   JOIN Warehouse_Inventory wi ON w.W_ID = wi.W_ID
GROUP  BY w.W_ID
ORDER  BY Total_Items DESC`,
    type: 'SELECT',
  },

  {
    id: 'agg_avg_transit',
    category: 'Aggregation & Analytics',
    title: 'Delivery Transit Time Statistics',
    description:
      'Computes AVG, MIN, and MAX transit hours for all completed deliveries using ' +
      'TIMESTAMPDIFF(HOUR, Dispatch_Time, Actual_Arrival). ' +
      'Only inner-joined rows (confirmed deliveries) are included.',
    sql:
`SELECT COUNT(*)                                                         AS Total_Deliveries,
       ROUND(AVG(TIMESTAMPDIFF(HOUR,
             dl.Dispatch_Time, ds.Actual_Arrival)), 1)                  AS Avg_Hours,
       MIN(TIMESTAMPDIFF(HOUR,
             dl.Dispatch_Time, ds.Actual_Arrival))                      AS Min_Hours,
       MAX(TIMESTAMPDIFF(HOUR,
             dl.Dispatch_Time, ds.Actual_Arrival))                      AS Max_Hours
FROM   Dispatch_Log    dl
JOIN   Delivery_Status ds ON dl.Dispatch_ID = ds.Dispatch_ID`,
    type: 'SELECT',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 5 — SQL FUNCTIONS
  // fn_Check_Stock, fn_Total_Stock, fn_Calculate_ETA — all pure, deterministic.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'func_check_stock',
    category: 'SQL Functions',
    title: 'fn_Check_Stock(Res_ID, W_ID)',
    description:
      'Returns the current quantity of one resource at one warehouse. ' +
      'Called inside sp_Dispatch_Request before deducting inventory — if the result is ' +
      'less than Approved_Qty the procedure rolls back. ' +
      'Example: check Resource 1 at Warehouse 1.',
    sql:
`SELECT fn_Check_Stock(1, 1) AS Stock_At_W1_R1`,
    type: 'SELECT',
  },

  {
    id: 'func_total_stock',
    category: 'SQL Functions',
    title: 'fn_Total_Stock(Res_ID)',
    description:
      'Sums quantity of a resource across ALL warehouses using SUM(). ' +
      'Called by sp_Approve_Request to validate system-wide availability before committing ' +
      'an approval — ensures at least one warehouse can cover the request. ' +
      'Example: total stock for Resource 1.',
    sql:
`SELECT fn_Total_Stock(1) AS Global_Total_Stock_R1`,
    type: 'SELECT',
  },

  {
    id: 'func_calculate_eta',
    category: 'SQL Functions',
    title: 'fn_Calculate_ETA(distance_km)',
    description:
      'Returns CURRENT_TIMESTAMP + INTERVAL ((distance / 25) + 2) HOUR. ' +
      'Assumes 25 km/h average speed plus a 2-hour loading buffer. ' +
      'Called by sp_Dispatch_Request when inserting into Dispatch_Log. ' +
      'Example: ETA for a 150 km dispatch.',
    sql:
`SELECT fn_Calculate_ETA(150)  AS ETA_For_150km,
       fn_Calculate_ETA(50)   AS ETA_For_50km,
       fn_Calculate_ETA(300)  AS ETA_For_300km`,
    type: 'SELECT',
  },

  {
    id: 'func_stock_matrix',
    category: 'SQL Functions',
    title: 'Global Stock per Resource (fn_Total_Stock loop)',
    description:
      'Calls fn_Total_Stock for every resource in the catalogue in one query. ' +
      'Demonstrates that functions are pure and can be used inside SELECT lists alongside ' +
      'regular columns — no temporary tables or application-side loops needed.',
    sql:
`SELECT r.Res_ID,
       r.Name  AS Resource_Name,
       r.Type,
       r.Unit,
       fn_Total_Stock(r.Res_ID) AS Global_Stock
FROM   Resource r
ORDER  BY r.Res_ID`,
    type: 'SELECT',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 6 — STORED PROCEDURES
  // These modify data — shown as definitions, not executed via the console.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'proc_approve',
    category: 'Stored Procedures',
    title: 'sp_Approve_Request(p_Req_ID)',
    description:
      'Approves a Pending request if system-wide stock covers every line item. ' +
      'Uses SELECT … FOR UPDATE to lock the request row and prevent double-approval. ' +
      'On success: sets Approved_Qty = Requested_Qty for each detail row, ' +
      'updates Request.Status → Approved, and fires trg_after_request_status_update (Audit_Log). ' +
      'Any failure rolls back the entire transaction.',
    sql:
`-- ─────────────────────────────────────────────────────────────────────────
-- CALL sp_Approve_Request(p_Req_ID  INT);
-- ─────────────────────────────────────────────────────────────────────────
-- Step 1  SELECT … FOR UPDATE  — lock request row, prevent race conditions
-- Step 2  Signal if Status ≠ 'Pending'
-- Step 3  For each line item:
--           IF fn_Total_Stock(Res_ID) < Requested_Qty → SIGNAL / ROLLBACK
-- Step 4  UPDATE Request_Details SET Approved_Qty = Requested_Qty
-- Step 5  UPDATE Request       SET Status = 'Approved'
-- Step 6  COMMIT
-- Trigger: trg_after_request_status_update → INSERT INTO Audit_Log
-- ─────────────────────────────────────────────────────────────────────────`,
    type: 'PROCEDURE',
    procName: 'sp_Approve_Request',
  },

  {
    id: 'proc_dispatch',
    category: 'Stored Procedures',
    title: 'sp_Dispatch_Request(p_Req_ID, p_W_ID)',
    description:
      'Dispatches an Approved request from a specified warehouse. ' +
      'Validates warehouse-level stock with fn_Check_Stock, deducts Warehouse_Inventory ' +
      '(this may trip trg_after_inventory_update → Stock_Alert), ' +
      'inserts a Dispatch_Log row with fn_Calculate_ETA(150), and updates Request.Status → Dispatched.',
    sql:
`-- ─────────────────────────────────────────────────────────────────────────
-- CALL sp_Dispatch_Request(p_Req_ID INT, p_W_ID INT);
-- ─────────────────────────────────────────────────────────────────────────
-- Step 1  SELECT … FOR UPDATE  — lock request row
-- Step 2  Signal if Status NOT IN ('Approved', 'Partially_Dispatched')
-- Step 3  For each item:
--           IF fn_Check_Stock(Res_ID, W_ID) < Approved_Qty → SIGNAL / ROLLBACK
-- Step 4  UPDATE Warehouse_Inventory wi
--           JOIN Request_Details rd ON wi.Res_ID = rd.Res_ID
--           SET  wi.Quantity = wi.Quantity - rd.Approved_Qty
--           WHERE rd.Req_ID = ? AND wi.W_ID = ?
-- Step 5  INSERT INTO Dispatch_Log (Estimated_Arrival = fn_Calculate_ETA(150))
-- Step 6  UPDATE Request SET Status = 'Dispatched'
-- Step 7  COMMIT
-- Trigger: trg_after_inventory_update → may INSERT INTO Stock_Alert
-- ─────────────────────────────────────────────────────────────────────────`,
    type: 'PROCEDURE',
    procName: 'sp_Dispatch_Request',
  },

  {
    id: 'proc_confirm',
    category: 'Stored Procedures',
    title: 'sp_Confirm_Delivery(p_Dispatch_ID, p_Received_By)',
    description:
      'Confirms receipt of a dispatched shipment. ' +
      'Inserts into Delivery_Status (Actual_Arrival = NOW(), Confirmation = Received), ' +
      'updates Dispatch_Log.Status → Delivered, and Request.Status → Delivered. ' +
      'Fires trg_after_request_status_update for the final audit trail entry.',
    sql:
`-- ─────────────────────────────────────────────────────────────────────────
-- CALL sp_Confirm_Delivery(p_Dispatch_ID INT, p_Received_By VARCHAR(100));
-- ─────────────────────────────────────────────────────────────────────────
-- Step 1  SELECT Req_ID FROM Dispatch_Log … FOR UPDATE
-- Step 2  UPDATE Dispatch_Log  SET Status = 'Delivered'
-- Step 3  INSERT INTO Delivery_Status
--           (Dispatch_ID, Actual_Arrival = NOW(),
--            Received_By, Confirmation = 'Received')
-- Step 4  UPDATE Request SET Status = 'Delivered'
-- Step 5  COMMIT
-- Trigger: trg_after_request_status_update → INSERT INTO Audit_Log
-- ─────────────────────────────────────────────────────────────────────────`,
    type: 'PROCEDURE',
    procName: 'sp_Confirm_Delivery',
  },

  {
    id: 'proc_restock',
    category: 'Stored Procedures',
    title: 'sp_Restock(p_W_ID, p_Res_ID, p_Qty, p_Supplier)',
    description:
      'Adds stock to a warehouse. Inserts a Restock_Log entry for traceability, then ' +
      'upserts Warehouse_Inventory with ON DUPLICATE KEY UPDATE — works whether the ' +
      'resource already exists in that warehouse or not. ' +
      'If Quantity crosses Min_Threshold upward, trg_after_inventory_restock auto-resolves ' +
      'the open Stock_Alert.',
    sql:
`-- ─────────────────────────────────────────────────────────────────────────
-- CALL sp_Restock(p_W_ID INT, p_Res_ID INT, p_Qty INT, p_Supplier VARCHAR(100));
-- ─────────────────────────────────────────────────────────────────────────
-- Step 1  INSERT INTO Restock_Log
--           (W_ID, Res_ID, Quantity, Restock_Date = NOW(), Supplier)
-- Step 2  INSERT INTO Warehouse_Inventory (W_ID, Res_ID, Quantity)
--           VALUES (?, ?, ?)
--           ON DUPLICATE KEY UPDATE Quantity = Quantity + VALUES(Quantity)
-- Step 3  COMMIT
-- Trigger: trg_after_inventory_restock
--           → UPDATE Stock_Alert SET Resolved = TRUE, Resolved_At = NOW()
--             WHERE W_ID = ? AND Res_ID = ? AND Resolved = FALSE
--             (fires only if Quantity crosses Min_Threshold upward)
-- ─────────────────────────────────────────────────────────────────────────`,
    type: 'PROCEDURE',
    procName: 'sp_Restock',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 7 — JOINS & SUBQUERIES
  // Advanced multi-table queries, NOT EXISTS, correlated subqueries.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'join_full_lifecycle',
    category: 'Joins & Subqueries',
    title: 'Full Request Lifecycle — 6-Table LEFT JOIN',
    description:
      'Traces each request from creation through dispatch to final delivery confirmation. ' +
      'Six tables joined in a single statement. LEFT JOINs on Dispatch_Log, Warehouse, ' +
      'and Delivery_Status let requests that have not been dispatched or confirmed yet ' +
      'still appear in the result (with NULL in those columns).',
    sql:
`SELECT r.Req_ID,
       r.Priority,
       r.Status                AS Request_Status,
       cc.Name                 AS Control_Center,
       c.Name                  AS Camp,
       e.Name                  AS Event,
       e.Level,
       r.Request_Time,
       dl.Dispatch_Time,
       dl.Status               AS Dispatch_Status,
       w.Name                  AS Dispatched_From,
       ds.Actual_Arrival,
       ds.Confirmation,
       ds.Received_By
FROM   Request         r
JOIN   Control_Center  cc ON r.CC_ID        = cc.CC_ID
JOIN   Relief_Camp     c  ON r.Camp_ID      = c.Camp_ID
JOIN   Disaster_Event  e  ON c.Event_ID     = e.Event_ID
LEFT   JOIN Dispatch_Log    dl ON r.Req_ID  = dl.Req_ID
LEFT   JOIN Warehouse       w  ON dl.W_ID   = w.W_ID
LEFT   JOIN Delivery_Status ds ON dl.Dispatch_ID = ds.Dispatch_ID
ORDER  BY r.Request_Time DESC`,
    type: 'SELECT',
  },

  {
    id: 'join_camp_activity',
    category: 'Joins & Subqueries',
    title: 'Camp Activity Summary — Correlated Subqueries',
    description:
      'Counts active requests, in-transit dispatches, and total delivered requests per camp ' +
      'using three correlated subqueries in the SELECT list. ' +
      'Avoids a complex GROUP BY + CASE structure — each subquery is independently readable.',
    sql:
`SELECT c.Camp_ID,
       c.Name              AS Camp_Name,
       c.Location,
       c.Current_Occupancy,
       c.Max_Capacity,
       e.Name  AS Event_Name,
       e.Level,
       (SELECT COUNT(*) FROM Request
        WHERE  Camp_ID = c.Camp_ID
          AND  Status NOT IN ('Delivered', 'Cancelled'))          AS Active_Requests,
       (SELECT COUNT(*) FROM Request r2
        JOIN   Dispatch_Log dl ON r2.Req_ID = dl.Req_ID
        WHERE  r2.Camp_ID = c.Camp_ID
          AND  dl.Status  = 'In_Transit')                         AS In_Transit,
       (SELECT COUNT(*) FROM Request
        WHERE  Camp_ID = c.Camp_ID
          AND  Status  = 'Delivered')                             AS Total_Delivered
FROM   Relief_Camp    c
JOIN   Disaster_Event e ON c.Event_ID = e.Event_ID
ORDER  BY Active_Requests DESC, c.Name`,
    type: 'SELECT',
  },

  {
    id: 'join_dispatch_resources',
    category: 'Joins & Subqueries',
    title: 'Dispatch Log with GROUP_CONCAT Resource Detail',
    description:
      'Each dispatch row includes a human-readable resource manifest built with GROUP_CONCAT ' +
      '("Water × 50 L | Food × 30 kg"). Demonstrates combining a correlated aggregate ' +
      'subquery with multi-table JOINs in one statement.',
    sql:
`SELECT dl.Dispatch_ID,
       dl.Status           AS Dispatch_Status,
       w.Name              AS Warehouse_Name,
       c.Name              AS Camp_Name,
       dl.Dispatch_Time,
       dl.Estimated_Arrival,
       r.Priority,
       (SELECT GROUP_CONCAT(
                 CONCAT(res.Name, ' × ', rd.Approved_Qty, ' ', res.Unit)
                 SEPARATOR ' | ')
        FROM   Request_Details rd
        JOIN   Resource res ON rd.Res_ID = res.Res_ID
        WHERE  rd.Req_ID = r.Req_ID)  AS Resources_Sent,
       ds.Confirmation
FROM   Dispatch_Log    dl
JOIN   Warehouse       w  ON dl.W_ID      = w.W_ID
JOIN   Request         r  ON dl.Req_ID    = r.Req_ID
JOIN   Relief_Camp     c  ON r.Camp_ID    = c.Camp_ID
LEFT   JOIN Delivery_Status ds ON dl.Dispatch_ID = ds.Dispatch_ID
ORDER  BY dl.Dispatch_Time DESC`,
    type: 'SELECT',
  },

  {
    id: 'join_not_exists',
    category: 'Joins & Subqueries',
    title: 'Delivered-but-Unconfirmed (NOT EXISTS)',
    description:
      'Finds dispatches where the warehouse marked the shipment Delivered but no matching ' +
      'Delivery_Status row exists — i.e., the camp officer has not yet confirmed receipt. ' +
      'NOT EXISTS is semantically cleaner than LEFT JOIN … WHERE ds.Dispatch_ID IS NULL ' +
      'and is used in the /api/camps/:id/stats endpoint.',
    sql:
`SELECT dl.Dispatch_ID,
       r.Req_ID,
       c.Name  AS Camp_Name,
       w.Name  AS Warehouse_Name,
       dl.Dispatch_Time,
       dl.Status
FROM   Dispatch_Log  dl
JOIN   Request       r ON dl.Req_ID  = r.Req_ID
JOIN   Relief_Camp   c ON r.Camp_ID  = c.Camp_ID
JOIN   Warehouse     w ON dl.W_ID    = w.W_ID
WHERE  dl.Status = 'Delivered'
  AND  NOT EXISTS (
         SELECT 1 FROM Delivery_Status ds
         WHERE  ds.Dispatch_ID = dl.Dispatch_ID
       )
ORDER  BY dl.Dispatch_Time DESC`,
    type: 'SELECT',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORY 8 — AUDIT & LOGS
  // Immutable trail: Audit_Log, Restock_Log, Delivery_Status, Stock_Alert history.
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'audit_log',
    category: 'Audit & Logs',
    title: 'Audit Log — Last 20 Entries',
    description:
      'The immutable change log written by trg_after_request_status_update. ' +
      'Old_Value and New_Value are stored as JSON_OBJECT strings. ' +
      'Changed_By captures the MySQL session user via USER(). ' +
      'Admin cannot UPDATE or DELETE this table — inserts only, via trigger.',
    sql:
`SELECT Log_ID,
       Table_Name,
       Action,
       Changed_By,
       Changed_At,
       Old_Value,
       New_Value
FROM   Audit_Log
ORDER  BY Changed_At DESC
LIMIT  20`,
    type: 'SELECT',
  },

  {
    id: 'restock_log',
    category: 'Audit & Logs',
    title: 'Restock History',
    description:
      'Every inventory replenishment event logged by sp_Restock. ' +
      'Joined with Warehouse and Resource for readable names. ' +
      'Supplier column is optional (nullable VARCHAR) — NULL when internal.',
    sql:
`SELECT rl.Restock_ID,
       rl.Restock_Date,
       rl.Quantity,
       rl.Supplier,
       w.Name AS Warehouse_Name,
       r.Name AS Resource_Name
FROM   Restock_Log rl
JOIN   Warehouse   w ON rl.W_ID   = w.W_ID
JOIN   Resource    r ON rl.Res_ID = r.Res_ID
ORDER  BY rl.Restock_Date DESC`,
    type: 'SELECT',
  },

  {
    id: 'delivery_confirmations',
    category: 'Audit & Logs',
    title: 'Delivery Confirmation Log',
    description:
      'All camp confirmations with receiver names, actual arrival times, and confirmation ' +
      'codes (Received / Damaged / Missing / Refused). ' +
      'Written by sp_Confirm_Delivery; camp officers cannot edit these rows.',
    sql:
`SELECT ds.Delivery_ID,
       ds.Actual_Arrival,
       ds.Received_By,
       ds.Confirmation,
       ds.Remarks,
       c.Name      AS Camp_Name,
       r.Req_ID,
       r.Priority
FROM   Delivery_Status ds
JOIN   Dispatch_Log    dl ON ds.Dispatch_ID = dl.Dispatch_ID
JOIN   Request         r  ON dl.Req_ID      = r.Req_ID
JOIN   Relief_Camp     c  ON r.Camp_ID      = c.Camp_ID
ORDER  BY ds.Actual_Arrival DESC`,
    type: 'SELECT',
  },

  {
    id: 'resolved_alerts',
    category: 'Audit & Logs',
    title: 'Resolved Stock Alerts — Auto-Closed by Trigger',
    description:
      'Stock alerts that were automatically resolved by trg_after_inventory_restock when ' +
      'a restock pushed Quantity back above Min_Threshold. ' +
      'Hours_Until_Resolved shows how long the warehouse was in a deficit state.',
    sql:
`SELECT sa.Alert_ID,
       sa.Alert_Time,
       sa.Resolved_At,
       TIMESTAMPDIFF(HOUR, sa.Alert_Time, sa.Resolved_At) AS Hours_Until_Resolved,
       w.Name AS Warehouse_Name,
       r.Name AS Resource_Name
FROM   Stock_Alert sa
JOIN   Warehouse   w ON sa.W_ID   = w.W_ID
JOIN   Resource    r ON sa.Res_ID = r.Res_ID
WHERE  sa.Resolved = TRUE
ORDER  BY sa.Resolved_At DESC`,
    type: 'SELECT',
  },

];

module.exports = QUERIES;
