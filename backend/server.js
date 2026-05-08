// DRAS — Express API Server
// Connects to XAMPP MySQL on localhost:3306, database: DRAS
// Change `password` below if your XAMPP root has a password set.

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const QUERIES = require('./queries');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── DB Pool ───────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',        // ← set your XAMPP MySQL root password here if needed
  database: 'DRAS',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: false,
});

const q = (sql, params = []) => pool.execute(sql, params);

// ── Health ────────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await q('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Stats (admin overview) ────────────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const [[{ ae }]] = await q('SELECT COUNT(*) AS ae FROM Disaster_Event WHERE Status = "Active"');
    const [[{ pr }]] = await q('SELECT COUNT(*) AS pr FROM Request WHERE Status = "Pending"');
    const [[{ it }]] = await q('SELECT COUNT(*) AS it FROM Dispatch_Log WHERE Status = "In_Transit"');
    const [[{ oa }]] = await q('SELECT COUNT(*) AS oa FROM Stock_Alert WHERE Resolved = FALSE');
    const [[{ hi }]] = await q('SELECT COUNT(*) AS hi FROM Disaster_Event WHERE Status = "Active" AND Level IN ("High","Critical")');
    res.json({ activeEvents: ae, pendingRequests: pr, inTransit: it, openAlerts: oa, highEvents: hi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Disaster Events ───────────────────────────────────────────────────────
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await q(`
      SELECT e.*,
        (SELECT COUNT(*) FROM Relief_Camp WHERE Event_ID = e.Event_ID) AS camp_count
      FROM Disaster_Event e
      ORDER BY FIELD(e.Level,'Critical','High','Medium','Low'), e.Start_Date DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Requests ──────────────────────────────────────────────────────────────
app.get('/api/requests', async (req, res) => {
  const { status, campId } = req.query;
  try {
    let sql = `
      SELECT
        r.Req_ID, r.Priority, r.Status, r.Request_Time,
        c.Name AS Camp_Name, c.Camp_ID,
        e.Name AS Event_Name, e.Level AS Event_Level,
        cc.Name AS CC_Name,
        (SELECT GROUP_CONCAT(CONCAT(res.Name,' (',rd.Requested_Qty,')') SEPARATOR ', ')
         FROM Request_Details rd JOIN Resource res ON rd.Res_ID = res.Res_ID
         WHERE rd.Req_ID = r.Req_ID) AS Resource_Summary,
        (SELECT COUNT(*) FROM Request_Details WHERE Req_ID = r.Req_ID) AS Total_Items
      FROM Request r
      JOIN Relief_Camp c ON r.Camp_ID = c.Camp_ID
      JOIN Disaster_Event e ON c.Event_ID = e.Event_ID
      JOIN Control_Center cc ON r.CC_ID = cc.CC_ID
      WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'all') { sql += ' AND r.Status = ?'; params.push(status); }
    if (campId) { sql += ' AND r.Camp_ID = ?'; params.push(campId); }
    sql += ' ORDER BY r.Request_Time DESC LIMIT 50';
    const [rows] = await q(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single request with full details + dispatch info
app.get('/api/requests/:id', async (req, res) => {
  try {
    const [[row]] = await q(`
      SELECT r.*, c.Name AS Camp_Name, e.Name AS Event_Name, cc.Name AS CC_Name
      FROM Request r
      JOIN Relief_Camp c ON r.Camp_ID = c.Camp_ID
      JOIN Disaster_Event e ON c.Event_ID = e.Event_ID
      JOIN Control_Center cc ON r.CC_ID = cc.CC_ID
      WHERE r.Req_ID = ?
    `, [req.params.id]);

    if (!row) return res.status(404).json({ error: 'Request not found' });

    const [items] = await q(`
      SELECT rd.*, res.Name AS Resource_Name, res.Unit
      FROM Request_Details rd
      JOIN Resource res ON rd.Res_ID = res.Res_ID
      WHERE rd.Req_ID = ?
    `, [req.params.id]);

    const [dispatch] = await q(`
      SELECT dl.*, w.Name AS Warehouse_Name,
        ds.Actual_Arrival, ds.Confirmation, ds.Received_By
      FROM Dispatch_Log dl
      JOIN Warehouse w ON dl.W_ID = w.W_ID
      LEFT JOIN Delivery_Status ds ON dl.Dispatch_ID = ds.Dispatch_ID
      WHERE dl.Req_ID = ?
    `, [req.params.id]);

    res.json({ ...row, items, dispatch: dispatch[0] || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new request (direct insert — procedure only handles approval/dispatch)
app.post('/api/requests', async (req, res) => {
  const { campId, ccId, priority, items } = req.body;
  if (!campId || !ccId || !priority || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'campId, ccId, priority and items[] are required' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute(
      'INSERT INTO Request (CC_ID, Camp_ID, Priority) VALUES (?, ?, ?)',
      [ccId, campId, priority]
    );
    const reqId = result.insertId;
    for (const item of items) {
      await conn.execute(
        'INSERT INTO Request_Details (Req_ID, Res_ID, Requested_Qty) VALUES (?, ?, ?)',
        [reqId, item.resId, item.qty]
      );
    }
    await conn.commit();
    res.json({ ok: true, reqId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// Approve request via stored procedure
app.post('/api/requests/:id/approve', async (req, res) => {
  try {
    await pool.query('CALL sp_Approve_Request(?)', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

// ── Dispatch ──────────────────────────────────────────────────────────────
app.get('/api/dispatches', async (req, res) => {
  const { warehouseId, status } = req.query;
  try {
    let sql = `
      SELECT dl.Dispatch_ID, dl.Req_ID, dl.W_ID, dl.Dispatch_Time,
        dl.Estimated_Arrival, dl.Status,
        w.Name AS Warehouse_Name,
        r.Priority, r.Status AS Req_Status,
        c.Name AS Camp_Name,
        ds.Actual_Arrival, ds.Confirmation, ds.Received_By,
        (SELECT GROUP_CONCAT(CONCAT(res.Name,' (',rd.Approved_Qty,')') SEPARATOR ', ')
         FROM Request_Details rd JOIN Resource res ON rd.Res_ID = res.Res_ID
         WHERE rd.Req_ID = r.Req_ID) AS Resource_Summary
      FROM Dispatch_Log dl
      JOIN Warehouse w ON dl.W_ID = w.W_ID
      JOIN Request r ON dl.Req_ID = r.Req_ID
      JOIN Relief_Camp c ON r.Camp_ID = c.Camp_ID
      LEFT JOIN Delivery_Status ds ON dl.Dispatch_ID = ds.Dispatch_ID
      WHERE 1=1
    `;
    const params = [];
    if (warehouseId) { sql += ' AND dl.W_ID = ?'; params.push(warehouseId); }
    if (status) { sql += ' AND dl.Status = ?'; params.push(status); }
    sql += ' ORDER BY dl.Dispatch_Time DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests/:id/dispatch', async (req, res) => {
  const { warehouseId } = req.body;
  if (!warehouseId) return res.status(400).json({ error: 'warehouseId required' });
  try {
    await pool.query('CALL sp_Dispatch_Request(?, ?)', [req.params.id, warehouseId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

app.post('/api/dispatches/:id/confirm', async (req, res) => {
  const { receivedBy } = req.body;
  try {
    await pool.query('CALL sp_Confirm_Delivery(?, ?)', [req.params.id, receivedBy || 'Camp Officer']);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

// ── Inventory ─────────────────────────────────────────────────────────────
app.get('/api/inventory', async (req, res) => {
  const { warehouseId } = req.query;
  try {
    let sql, params = [];
    if (warehouseId) {
      sql = `
        SELECT w.Name AS Warehouse_Name, r.Name AS Resource_Name, r.Type AS Resource_Type,
          wi.Quantity, wi.Min_Threshold, wi.Inv_ID, wi.W_ID, wi.Res_ID,
          CASE
            WHEN wi.Quantity <= 0 THEN 'OUT OF STOCK'
            WHEN wi.Quantity < wi.Min_Threshold THEN 'LOW STOCK'
            ELSE 'OK'
          END AS Stock_Status
        FROM Warehouse_Inventory wi
        JOIN Warehouse w ON wi.W_ID = w.W_ID
        JOIN Resource r ON wi.Res_ID = r.Res_ID
        WHERE wi.W_ID = ?
        ORDER BY (wi.Quantity / GREATEST(wi.Min_Threshold, 1)) ASC
      `;
      params = [warehouseId];
    } else {
      sql = 'SELECT * FROM vw_Current_Inventory';
    }
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Stock Alerts ──────────────────────────────────────────────────────────
app.get('/api/alerts', async (req, res) => {
  const { warehouseId } = req.query;
  try {
    let sql = `
      SELECT sa.Alert_ID, sa.W_ID, sa.Res_ID, sa.Alert_Time, sa.Resolved,
        w.Name AS Warehouse_Name, r.Name AS Resource_Name,
        wi.Quantity, wi.Min_Threshold
      FROM Stock_Alert sa
      JOIN Warehouse w ON sa.W_ID = w.W_ID
      JOIN Resource r ON sa.Res_ID = r.Res_ID
      JOIN Warehouse_Inventory wi ON sa.W_ID = wi.W_ID AND sa.Res_ID = wi.Res_ID
      WHERE sa.Resolved = FALSE
    `;
    const params = [];
    if (warehouseId) { sql += ' AND sa.W_ID = ?'; params.push(warehouseId); }
    sql += ' ORDER BY sa.Alert_Time DESC LIMIT 10';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Warehouses ────────────────────────────────────────────────────────────
app.get('/api/warehouses', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Warehouse ORDER BY Name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/warehouses/:id/stats', async (req, res) => {
  const wid = req.params.id;
  try {
    const [[{ skus }]] = await q('SELECT COUNT(*) AS skus FROM Warehouse_Inventory WHERE W_ID = ?', [wid]);
    const [[{ below }]] = await q('SELECT COUNT(*) AS below FROM Warehouse_Inventory WHERE W_ID = ? AND Quantity < Min_Threshold', [wid]);
    const [[{ queue }]] = await q('SELECT COUNT(*) AS queue FROM Request WHERE Status = "Approved"');
    const [[{ transit }]] = await q('SELECT COUNT(*) AS transit FROM Dispatch_Log WHERE W_ID = ? AND Status = "In_Transit"', [wid]);
    const [[{ alerts }]] = await q('SELECT COUNT(*) AS alerts FROM Stock_Alert WHERE W_ID = ? AND Resolved = FALSE', [wid]);
    res.json({ skus, belowThreshold: below, approvedQueue: queue, inTransit: transit, openAlerts: alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Resources ─────────────────────────────────────────────────────────────
app.get('/api/resources', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Resource ORDER BY Name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Camps ─────────────────────────────────────────────────────────────────
app.get('/api/camps', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.*, e.Name AS Event_Name, e.Level AS Event_Level
      FROM Relief_Camp c
      JOIN Disaster_Event e ON c.Event_ID = e.Event_ID
      ORDER BY c.Name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/camps/:id/stats', async (req, res) => {
  const cid = req.params.id;
  try {
    const [[{ active }]] = await q(
      "SELECT COUNT(*) AS active FROM Request WHERE Camp_ID = ? AND Status NOT IN ('Delivered','Cancelled')",
      [cid]
    );
    const [[{ awaiting }]] = await q(
      "SELECT COUNT(*) AS awaiting FROM Request r JOIN Dispatch_Log dl ON r.Req_ID = dl.Req_ID WHERE r.Camp_ID = ? AND dl.Status = 'In_Transit'",
      [cid]
    );
    const [[{ delivered }]] = await q(
      "SELECT COUNT(*) AS delivered FROM Request WHERE Camp_ID = ? AND Status = 'Delivered' AND Request_Time >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
      [cid]
    );
    const [[{ pending_confirm }]] = await q(
      "SELECT COUNT(*) AS pending_confirm FROM Request r JOIN Dispatch_Log dl ON r.Req_ID = dl.Req_ID WHERE r.Camp_ID = ? AND dl.Status = 'Delivered' AND NOT EXISTS (SELECT 1 FROM Delivery_Status ds WHERE ds.Dispatch_ID = dl.Dispatch_ID)",
      [cid]
    );
    res.json({ active, awaiting, delivered, pendingConfirm: pending_confirm });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Restock ───────────────────────────────────────────────────────────────
app.post('/api/restock', async (req, res) => {
  const { warehouseId, resourceId, qty, supplier } = req.body;
  if (!warehouseId || !resourceId || !qty) {
    return res.status(400).json({ error: 'warehouseId, resourceId and qty required' });
  }
  try {
    await pool.query('CALL sp_Restock(?, ?, ?, ?)', [warehouseId, resourceId, qty, supplier || null]);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.sqlMessage || err.message });
  }
});

app.get('/api/restock-log', async (req, res) => {
  const { warehouseId } = req.query;
  try {
    let sql = `
      SELECT rl.*, w.Name AS Warehouse_Name, r.Name AS Resource_Name
      FROM Restock_Log rl
      JOIN Warehouse w ON rl.W_ID = w.W_ID
      JOIN Resource r ON rl.Res_ID = r.Res_ID
      WHERE 1=1
    `;
    const params = [];
    if (warehouseId) { sql += ' AND rl.W_ID = ?'; params.push(warehouseId); }
    sql += ' ORDER BY rl.Restock_Date DESC LIMIT 20';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Query Console ─────────────────────────────────────────────────────────
// Returns the full query catalog (metadata only, no execution).
app.get('/api/query-console/catalog', (req, res) => {
  res.json(QUERIES);
});

// Runs a predefined read-only query by ID and returns rows + metadata.
app.get('/api/query-console/run/:id', async (req, res) => {
  const entry = QUERIES.find(q => q.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Query not found' });

  if (entry.type === 'PROCEDURE') {
    return res.json({
      columns: [],
      rows: [],
      executionTime: 0,
      note: 'Stored procedures modify data and cannot be executed from the query console.',
    });
  }

  const start = Date.now();
  try {
    const [rows] = await pool.query(entry.sql);
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    res.json({ columns, rows, executionTime: Date.now() - start });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Audit Log ─────────────────────────────────────────────────────────────
app.get('/api/audit', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Audit_Log ORDER BY Changed_At DESC LIMIT 20'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✓ DRAS backend running → http://localhost:${PORT}`);
  console.log(`  Connected to MySQL database: DRAS`);
});
