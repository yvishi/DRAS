import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';
import { PriorityCell, Spinner, ErrorMsg, fmtDate, timeAgo } from '../components/shared';
import { getInventory, getAlerts, getWarehouseStats, getRequests, dispatchRequest, restock, getRestockLog, getWarehouses, getResources, getDispatches } from '../api';

const NAV = [
  { label: 'Warehouse', items: [
    { key: 'inventory', icon: 'package',   label: 'Inventory' },
    { key: 'alerts',    icon: 'alert',     label: 'Alerts' },
  ]},
  { label: 'Operations', items: [
    { key: 'dispatch',  icon: 'inbox',     label: 'Approved queue' },
    { key: 'transits',  icon: 'truck',     label: 'Dispatches' },
    { key: 'restock',   icon: 'plus',      label: 'Restock' },
  ]},
  { label: 'Reference', items: [
    { key: 'log',       icon: 'log',       label: 'Restock log' },
  ]},
];

export default function Warehouse({ onLogout }) {
  const wId = Number(sessionStorage.getItem('dras_w_id') || 1);

  const [activeNav, setActiveNav] = useState('inventory');
  const [warehouse, setWarehouse] = useState(null);
  const [stats, setStats] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [approvedReqs, setApprovedReqs] = useState([]);
  const [restockLog, setRestockLog] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dispatch queue and log
  const [dispatching, setDispatching] = useState(null);
  const [dispatchLog, setDispatchLog] = useState([]);

  // Restock form
  const [rstResId, setRstResId] = useState('');
  const [rstQty, setRstQty] = useState('');
  const [rstSupplier, setRstSupplier] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [rstMsg, setRstMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [inv, al, whStats, reqs, rl, whs, res, disps] = await Promise.all([
        getInventory(wId),
        getAlerts(wId),
        getWarehouseStats(wId),
        getRequests({ status: 'Approved' }),
        getRestockLog(wId),
        getWarehouses(),
        getResources(),
        getDispatches({ warehouseId: wId }),
      ]);
      setInventory(inv);
      setAlerts(al);
      setStats(whStats);
      setApprovedReqs(reqs);
      setRestockLog(rl);
      setResources(res);
      setDispatchLog(disps);
      const found = whs.find(w => w.W_ID === wId);
      setWarehouse(found || null);
    } catch (e) {
      setError(e.message);
    }
  }, [wId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleDispatch = async (reqId) => {
    setDispatching(reqId);
    try {
      await dispatchRequest(reqId, wId);
      await loadData();
    } catch (e) {
      alert('Dispatch failed: ' + e.message);
    } finally {
      setDispatching(null);
    }
  };

  const handleRestock = async () => {
    if (!rstResId || !rstQty) { setRstMsg('Select a resource and enter quantity'); return; }
    setRestocking(true); setRstMsg('');
    try {
      await restock({ warehouseId: wId, resourceId: Number(rstResId), qty: Number(rstQty), supplier: rstSupplier || null });
      setRstMsg('Restocked successfully!');
      setRstResId(''); setRstQty(''); setRstSupplier('');
      await loadData();
    } catch (e) {
      setRstMsg('Error: ' + e.message);
    } finally {
      setRestocking(false);
    }
  };

  const statusColor = { 'OUT OF STOCK': 'crit', 'LOW STOCK': 'warn', 'OK': 'ok' };

  return (
    <div className="dras-app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar role="warehouse" crumbs={[warehouse?.Name || 'Warehouse', 'Inventory']} onLogout={onLogout} />
      <div className="shell">
        <Sidebar items={NAV} activeKey={activeNav} onSelect={setActiveNav} />
        <div className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">{warehouse?.Name || 'Warehouse'} · Inventory & dispatch</h1>
              <div className="page-subtitle">
                {warehouse?.Location} · <span className="mono" style={{ color: 'var(--text)' }}>Capacity {warehouse?.Capacity_m3 ? warehouse.Capacity_m3 + ' m³' : '—'}</span>
              </div>
            </div>
            <div className="page-actions">
              <button className="btn btn-primary" onClick={() => setActiveNav('restock')}><Icon name="plus" size={12} /> Restock</button>
            </div>
          </div>

          {error && <ErrorMsg msg={error} />}

          {/* Stats */}
          <div className="stat-grid">
            <div className="stat"><div className="stat-label">SKUs tracked</div><div className="stat-value">{stats?.skus ?? '—'}</div><div className="stat-delta">{stats?.belowThreshold ?? 0} below threshold</div></div>
            <div className="stat"><div className="stat-label">Approved queue</div><div className="stat-value">{stats?.approvedQueue ?? '—'}</div><div className="stat-delta">awaiting dispatch</div></div>
            <div className="stat"><div className="stat-label">In transit</div><div className="stat-value">{stats?.inTransit ?? '—'}</div><div className="stat-delta">from this warehouse</div></div>
            <div className="stat">
              <div className="stat-label">Open alerts</div>
              <div className="stat-value" style={stats?.openAlerts > 0 ? { color: 'var(--status-critical)' } : {}}>
                {stats?.openAlerts ?? '—'}
              </div>
              <div className="stat-delta down" style={stats?.openAlerts > 0 ? { color: 'var(--status-critical)' } : {}}>
                {stats?.openAlerts > 0 ? 'critical' : 'all clear'}
              </div>
            </div>
          </div>

          {/* Inventory */}
          {activeNav === 'inventory' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Live inventory</div>
                  <div className="card-subtitle"><span className="mono" style={{ color: 'var(--text-muted)' }}>Warehouse_Inventory</span> vs <span className="mono" style={{ color: 'var(--text-muted)' }}>Min_Threshold</span></div>
                </div>
              </div>
              {loading ? <Spinner /> : (
                <table className="tbl">
                  <thead><tr><th>Resource</th><th style={{ textAlign: 'right' }}>Qty</th><th>vs threshold</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {inventory.length === 0
                      ? <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 20 }}>No inventory records</td></tr>
                      : inventory.map(r => {
                        const pct = Math.min(150, (r.Quantity / Math.max(r.Min_Threshold, 1)) * 100);
                        const sc = statusColor[r.Stock_Status] || 'ok';
                        return (
                          <tr key={r.Res_ID}>
                            <td>
                              <div style={{ fontSize: 12, fontWeight: 500 }}>{r.Resource_Name}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{r.Resource_Type}</div>
                            </td>
                            <td className="num"><span style={{ fontSize: 13, fontWeight: 500 }}>{r.Quantity?.toLocaleString()}</span></td>
                            <td style={{ minWidth: 180 }}>
                              <div className="bar-track">
                                <div className={'bar-fill ' + sc} style={{ width: Math.min(100, pct / 1.5) + '%' }} />
                                <div className="bar-marker" style={{ left: (100 / 1.5) + '%' }} />
                              </div>
                              <div className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', marginTop: 3 }}>min {r.Min_Threshold}</div>
                            </td>
                            <td>
                              {r.Stock_Status === 'OUT OF STOCK' && <span className="badge critical"><span className="dot" />Out of stock</span>}
                              {r.Stock_Status === 'LOW STOCK' && <span className="badge pending"><span className="dot" />Low stock</span>}
                              {r.Stock_Status === 'OK' && <span className="badge delivered"><span className="dot" />Healthy</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setActiveNav('restock'); setRstResId(String(r.Res_ID)); }}>Restock</button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Alerts */}
          {activeNav === 'alerts' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div className="card-title">Open stock alerts</div>
                <span style={{ fontSize: 11, color: alerts.length > 0 ? 'var(--status-critical)' : 'var(--status-delivered)' }}>{alerts.length} unresolved</span>
              </div>
              {loading ? <Spinner /> : alerts.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No open alerts — all stock is healthy.</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>Resource</th><th style={{ textAlign: 'right' }}>Current</th><th style={{ textAlign: 'right' }}>Min</th><th>Fill %</th><th>Fired</th><th></th></tr></thead>
                    <tbody>
                      {alerts.map(a => (
                        <tr key={a.Alert_ID}>
                          <td><div style={{ fontWeight: 500 }}>{a.Resource_Name}</div><div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{a.Warehouse_Name}</div></td>
                          <td className="num" style={{ color: 'var(--status-critical)' }}>{a.Quantity}</td>
                          <td className="num">{a.Min_Threshold}</td>
                          <td style={{ minWidth: 120 }}>
                            <div className="bar-track">
                              <div className="bar-fill crit" style={{ width: Math.min(100, (a.Quantity / Math.max(a.Min_Threshold, 1)) * 100) + '%' }} />
                            </div>
                          </td>
                          <td style={{ fontSize: 11, color: 'var(--text-faint)' }}>{timeAgo(a.Alert_Time)}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-accent btn-sm" onClick={() => { setActiveNav('restock'); setRstResId(String(a.Res_ID)); }}>
                              Restock
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* Approved dispatch queue */}
          {activeNav === 'dispatch' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Approved → ready to dispatch</div>
                  <div className="card-subtitle">Calls <span className="mono" style={{ color: 'var(--text)' }}>sp_Dispatch_Request(Req_ID, {wId})</span></div>
                </div>
              </div>
              {loading ? <Spinner /> : approvedReqs.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No approved requests waiting for dispatch.</div>
                : approvedReqs.map((r, i) => (
                  <div key={r.Req_ID} style={{ padding: '14px', borderBottom: i < approvedReqs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="id">REQ-{r.Req_ID}</span>
                        <PriorityCell p={r.Priority} />
                      </div>
                      <span style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{timeAgo(r.Request_Time)}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500, marginTop: 4 }}>{r.Camp_Name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{r.Resource_Summary || '—'}</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 10 }}>
                      <button className="btn btn-accent btn-sm" disabled={dispatching === r.Req_ID} onClick={() => handleDispatch(r.Req_ID)}>
                        <Icon name="truck" size={11} /> {dispatching === r.Req_ID ? 'Dispatching…' : 'Dispatch'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Dispatch log */}
          {activeNav === 'transits' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Dispatch history</div>
                  <div className="card-subtitle">All dispatches from this warehouse</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{dispatchLog.length} entries</span>
              </div>
              {loading ? <Spinner /> : dispatchLog.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No dispatches from this warehouse yet.</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>Dispatch</th><th>Request</th><th>Dispatched</th><th>ETA</th><th>Arrived</th><th>Status</th></tr></thead>
                    <tbody>
                      {dispatchLog.map(d => (
                        <tr key={d.Dispatch_ID}>
                          <td className="mono" style={{ fontSize: 11 }}>DSP-{String(d.Dispatch_ID).padStart(3, '0')}</td>
                          <td><span className="id">REQ-{d.Req_ID}</span></td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(d.Dispatch_Time)}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.Estimated_Arrival)}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{d.Actual_Arrival ? fmtDate(d.Actual_Arrival) : '—'}</td>
                          <td><span className={'badge ' + (d.Actual_Arrival ? 'delivered' : 'pending')}><span className="dot" />{d.Actual_Arrival ? 'Delivered' : 'In transit'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* Restock form */}
          {activeNav === 'restock' && (
            <div className="card" style={{ maxWidth: 480 }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Restock inventory</div>
                  <div className="card-subtitle">Calls <span className="mono" style={{ color: 'var(--text)' }}>sp_Restock</span> · resolves open alerts automatically</div>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label className="field-label">Resource <span className="req">*</span></label>
                  <select className="select" value={rstResId} onChange={e => setRstResId(e.target.value)}>
                    <option value="">Select resource…</option>
                    {resources.map(r => <option key={r.Res_ID} value={r.Res_ID}>{r.Name} ({r.Unit})</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field-label">Quantity <span className="req">*</span></label>
                  <input className="input" type="number" min="1" value={rstQty} onChange={e => setRstQty(e.target.value)} placeholder="e.g. 500" />
                </div>
                <div className="field">
                  <label className="field-label">Supplier</label>
                  <input className="input" value={rstSupplier} onChange={e => setRstSupplier(e.target.value)} placeholder="e.g. AquaPure Ltd" />
                </div>
                {rstMsg && (
                  <div style={{ padding: '8px 10px', borderRadius: 4, fontSize: 12, background: rstMsg.startsWith('Error') ? 'var(--status-critical-bg)' : 'var(--status-delivered-bg)', color: rstMsg.startsWith('Error') ? 'var(--status-critical)' : 'var(--status-delivered)' }}>
                    {rstMsg}
                  </div>
                )}
                <button className="btn btn-primary" disabled={restocking} onClick={handleRestock}>
                  {restocking ? 'Restocking…' : 'Confirm restock'}
                </button>
              </div>
            </div>
          )}

          {/* Restock log */}
          {activeNav === 'log' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div className="card-title">Restock log</div>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Restock_Log · last 20</span>
              </div>
              {loading ? <Spinner /> : restockLog.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No restock history yet.</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>Resource</th><th style={{ textAlign: 'right' }}>Qty added</th><th>Supplier</th><th>Date</th></tr></thead>
                    <tbody>
                      {restockLog.map(r => (
                        <tr key={r.Restock_ID}>
                          <td style={{ fontWeight: 500 }}>{r.Resource_Name}</td>
                          <td className="num" style={{ color: 'var(--status-delivered)' }}>+{r.Quantity}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{r.Supplier || '—'}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(r.Restock_Date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
