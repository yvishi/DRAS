import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';
import { StatusBadge, PriorityCell, Spinner, ErrorMsg, timeAgo, fmtDate } from '../components/shared';
import { getStats, getRequests, getRequest, approveRequest, getAlerts, getAuditLog, getEvents, getWarehouses, getInventory, getDispatches } from '../api';

const TABS = [
  { k: 'Pending',    l: 'Pending' },
  { k: 'Approved',   l: 'Approved' },
  { k: 'Dispatched', l: 'In transit' },
  { k: 'Delivered',  l: 'Delivered' },
];

const NAV = [
  { label: 'Operations', items: [
    { key: 'overview',   icon: 'dashboard', label: 'Overview' },
    { key: 'events',     icon: 'alert',     label: 'Disaster Events' },
    { key: 'requests',   icon: 'inbox',     label: 'Requests' },
  ]},
  { label: 'Resources', items: [
    { key: 'warehouses', icon: 'warehouse', label: 'Warehouses' },
    { key: 'inventory',  icon: 'package',   label: 'Inventory' },
    { key: 'dispatches', icon: 'truck',     label: 'Dispatches' },
  ]},
  { label: 'Admin', items: [
    { key: 'audit',      icon: 'log',       label: 'Audit Log' },
  ]},
];

const PAGE_TITLES = {
  overview:   'National Operations Overview',
  events:     'Disaster Events',
  requests:   'All Requests',
  warehouses: 'Warehouses',
  inventory:  'Full Inventory',
  dispatches: 'Dispatch Log',
  audit:      'Audit Log',
};

const levelColor = {
  Critical: 'var(--status-critical)',
  High:     'var(--status-critical)',
  Medium:   'var(--status-pending)',
  Low:      'var(--status-delivered)',
};

export default function Admin({ onLogout }) {
  const [activeNav, setActiveNav]       = useState('overview');
  const [tab, setTab]                   = useState('Pending');
  const [stats, setStats]               = useState(null);
  const [requests, setRequests]         = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [audit, setAudit]               = useState([]);
  const [events, setEvents]             = useState([]);
  const [warehouses, setWarehouses]     = useState([]);
  const [allInventory, setAllInventory] = useState([]);
  const [allDispatches, setAllDispatches] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [approving, setApproving]       = useState(null);
  const [reqDetail, setReqDetail]       = useState(null);

  const loadRequests = useCallback(() => {
    return getRequests({ status: tab }).then(setRequests);
  }, [tab]);

  const loadAll = useCallback(() => {
    return Promise.all([
      getStats().then(setStats),
      loadRequests(),
      getAlerts().then(setAlerts),
      getAuditLog().then(setAudit),
      getEvents().then(setEvents),
      getWarehouses().then(setWarehouses),
      getInventory().then(setAllInventory),
      getDispatches().then(setAllDispatches),
    ]);
  }, [loadRequests]);

  useEffect(() => {
    setLoading(true);
    loadAll().catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [loadAll]);

  const handleApprove = async (reqId) => {
    setApproving(reqId);
    try {
      await approveRequest(reqId);
      await Promise.all([loadRequests(), getStats().then(setStats)]);
    } catch (e) {
      alert('Approval failed: ' + e.message);
    } finally {
      setApproving(null);
    }
  };

  const openReqDetail = async (reqId) => {
    try {
      const d = await getRequest(reqId);
      setReqDetail(d);
    } catch { /* ignore */ }
  };

  // Shared request table used by both Overview and Requests nav
  const RequestTable = () => (
    <>
      <div style={{ padding: '0 14px' }}>
        <div className="tabs">
          {TABS.map(t => (
            <div key={t.k} className={'tab' + (tab === t.k ? ' active' : '')} onClick={() => setTab(t.k)}>
              {t.l}
              <span className="count">{tab === t.k ? requests.length : ''}</span>
            </div>
          ))}
        </div>
      </div>
      {loading ? <Spinner /> : (
        <table className="tbl">
          <thead><tr>
            <th>Request</th><th>Camp</th><th>Resources</th><th>Priority</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            {requests.length === 0
              ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 20 }}>No {tab.toLowerCase()} requests</td></tr>
              : requests.map(r => (
                <tr key={r.Req_ID}>
                  <td>
                    <div className="id">REQ-{r.Req_ID}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{timeAgo(r.Request_Time)}</div>
                  </td>
                  <td>
                    <div>{r.Camp_Name}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{r.Event_Name}</div>
                  </td>
                  <td style={{ maxWidth: 200 }}>
                    <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{r.Resource_Summary || '—'}</span>
                  </td>
                  <td><PriorityCell p={r.Priority} /></td>
                  <td><StatusBadge s={r.Status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    {r.Status === 'Pending'
                      ? <button
                          className="btn btn-accent btn-sm"
                          disabled={approving === r.Req_ID}
                          onClick={() => handleApprove(r.Req_ID)}
                        >
                          {approving === r.Req_ID ? '…' : 'Approve'}
                        </button>
                      : <button className="btn btn-ghost btn-sm" onClick={() => openReqDetail(r.Req_ID)}>
                          <Icon name="eye" size={12} />
                        </button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </>
  );

  return (
    <div className="dras-app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar role="admin" crumbs={['DRAS', 'Operations', PAGE_TITLES[activeNav] || activeNav]} onLogout={onLogout} />
      <div className="shell">
        <Sidebar items={NAV} activeKey={activeNav} onSelect={setActiveNav} />
        <div className="main">

          <div className="page-header">
            <div>
              <h1 className="page-title">{PAGE_TITLES[activeNav]}</h1>
              <div className="page-subtitle">All control centers · Last sync <span className="mono">{new Date().toLocaleString('en-IN')}</span></div>
            </div>
            <div className="page-actions">
              <button className="btn" onClick={() => { setLoading(true); loadAll().finally(() => setLoading(false)); }}>
                <Icon name="arrow" size={12} /> Refresh
              </button>
            </div>
          </div>

          {error && <ErrorMsg msg={error} />}

          {/* ── Overview ── */}
          {activeNav === 'overview' && (
            <>
              <div className="stat-grid">
                <div className="stat">
                  <div className="stat-label">Active events</div>
                  <div className="stat-value">{stats?.activeEvents ?? '—'}</div>
                  <div className="stat-delta">{stats?.highEvents ?? 0} high / critical</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Pending requests</div>
                  <div className="stat-value">{stats?.pendingRequests ?? '—'}</div>
                  <div className="stat-delta">awaiting approval</div>
                </div>
                <div className="stat">
                  <div className="stat-label">In-transit dispatches</div>
                  <div className="stat-value">{stats?.inTransit ?? '—'}</div>
                  <div className="stat-delta">shipments on the way</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Open stock alerts</div>
                  <div className="stat-value" style={stats?.openAlerts > 0 ? { color: 'var(--status-critical)' } : {}}>
                    {stats?.openAlerts ?? '—'}
                  </div>
                  <div className="stat-delta down" style={stats?.openAlerts > 0 ? { color: 'var(--status-critical)' } : {}}>
                    {stats?.openAlerts > 0 ? 'unresolved' : 'all clear'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="card card-pad-tight">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Request queue</div>
                      <div className="card-subtitle">Triage and approve incoming relief requests</div>
                    </div>
                  </div>
                  <RequestTable />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="card">
                    <div className="card-header">
                      <div>
                        <div className="card-title">Active events</div>
                        <div className="card-subtitle">Disaster_Event WHERE Status='Active'</div>
                      </div>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{stats?.activeEvents ?? 0} active</span>
                    </div>
                    <div style={{ padding: '4px 14px 12px' }}>
                      {events.filter(e => e.Status === 'Active').length === 0
                        ? <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-faint)' }}>No active events</div>
                        : events.filter(e => e.Status === 'Active').slice(0, 5).map((e, i, arr) => (
                          <div key={e.Event_ID} style={{ padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 500 }}>{e.Name}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: levelColor[e.Level] || 'var(--text-muted)' }}>{e.Level}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{e.Location}</span>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.camp_count} camp{e.camp_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Stock alerts</div>
                      <span style={{ fontSize: 11, color: alerts.length > 0 ? 'var(--status-critical)' : 'var(--text-faint)' }}>{alerts.length} open</span>
                    </div>
                    <div style={{ padding: '4px 14px 12px' }}>
                      {alerts.length === 0
                        ? <div style={{ padding: '12px 0', fontSize: 12, color: 'var(--text-faint)' }}>No open alerts</div>
                        : alerts.slice(0, 4).map((a, i) => (
                          <div key={a.Alert_ID} style={{ padding: '10px 0', borderBottom: i < Math.min(alerts.length, 4) - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 500 }}>{a.Resource_Name} · <span className="mono" style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 11 }}>{a.Warehouse_Name}</span></span>
                              <span className="mono" style={{ fontSize: 11 }}>{a.Quantity} / {a.Min_Threshold}</span>
                            </div>
                            <div className="bar-track">
                              <div className="bar-fill crit" style={{ width: Math.min(100, (a.Quantity / Math.max(a.Min_Threshold, 1)) * 100) + '%' }} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Recent audit log</div>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>last 6 entries</span>
                  </div>
                  <div style={{ padding: '8px 14px' }}>
                    {audit.length === 0
                      ? <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-faint)' }}>No audit entries yet</div>
                      : audit.slice(0, 6).map((l, i) => {
                        const oldV = typeof l.Old_Value === 'string' ? JSON.parse(l.Old_Value || '{}') : (l.Old_Value || {});
                        const newV = typeof l.New_Value === 'string' ? JSON.parse(l.New_Value || '{}') : (l.New_Value || {});
                        const detail = oldV.Status ? `${oldV.Status} → ${newV.Status}` : JSON.stringify(newV).slice(0, 40);
                        return (
                          <div key={l.Log_ID} style={{ display: 'grid', gridTemplateColumns: '50px 120px 1fr 55px', gap: 10, padding: '7px 0', fontSize: 11.5, alignItems: 'center', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                            <span className="mono" style={{ color: l.Action === 'INSERT' ? 'var(--status-delivered)' : 'var(--accent-text)', fontSize: 10 }}>{l.Action}</span>
                            <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{l.Table_Name}</span>
                            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ color: 'var(--text)' }}>{l.Changed_By}</span> · {detail}
                            </span>
                            <span className="mono" style={{ color: 'var(--text-faint)', fontSize: 10.5, textAlign: 'right' }}>{timeAgo(l.Changed_At)}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header"><div className="card-title">Stored procedures</div></div>
                  <div style={{ padding: '12px 14px' }}>
                    {[
                      { p: 'sp_Approve_Request',  desc: 'Validates global stock, sets status = Approved' },
                      { p: 'sp_Dispatch_Request', desc: 'Deducts warehouse stock, creates Dispatch_Log row' },
                      { p: 'sp_Confirm_Delivery', desc: 'Creates Delivery_Status, sets Request = Delivered' },
                      { p: 'sp_Restock',          desc: 'UPSERT inventory, resolves open Stock_Alerts' },
                    ].map((p, i) => (
                      <div key={i} style={{ padding: '10px 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
                        <div className="mono" style={{ fontSize: 11.5, fontWeight: 500, marginBottom: 4 }}>{p.p}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Disaster Events ── */}
          {activeNav === 'events' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div className="card-title">Disaster events</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{events.length} total</span>
              </div>
              {loading ? <Spinner /> : events.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No events found</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>ID</th><th>Name</th><th>Location</th><th>Type</th><th>Level</th><th>Status</th><th style={{ textAlign: 'right' }}>Camps</th><th>Started</th></tr></thead>
                    <tbody>
                      {events.map(e => (
                        <tr key={e.Event_ID}>
                          <td className="mono" style={{ color: 'var(--text-faint)', fontSize: 11 }}>EVT-{String(e.Event_ID).padStart(3, '0')}</td>
                          <td style={{ fontWeight: 500 }}>{e.Name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{e.Location}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{e.Type}</td>
                          <td><span style={{ fontWeight: 600, color: levelColor[e.Level] || 'var(--text-muted)' }}>{e.Level}</span></td>
                          <td><StatusBadge s={e.Status} /></td>
                          <td className="num">{e.camp_count}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(e.Start_Date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* ── All Requests ── */}
          {activeNav === 'requests' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">All requests</div>
                  <div className="card-subtitle">Full pipeline across all camps</div>
                </div>
              </div>
              <RequestTable />
            </div>
          )}

          {/* ── Warehouses ── */}
          {activeNav === 'warehouses' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div className="card-title">Warehouses</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{warehouses.length} registered</span>
              </div>
              {loading ? <Spinner /> : warehouses.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No warehouses found</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>ID</th><th>Name</th><th>Location</th><th style={{ textAlign: 'right' }}>Capacity (m³)</th></tr></thead>
                    <tbody>
                      {warehouses.map(w => (
                        <tr key={w.W_ID}>
                          <td className="mono" style={{ color: 'var(--text-faint)', fontSize: 11 }}>WH-{String(w.W_ID).padStart(2, '0')}</td>
                          <td style={{ fontWeight: 500 }}>{w.Name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{w.Location}</td>
                          <td className="num">{w.Capacity_m3?.toLocaleString() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* ── Full Inventory ── */}
          {activeNav === 'inventory' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Full inventory</div>
                  <div className="card-subtitle">All warehouses · Warehouse_Inventory</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{allInventory.length} records</span>
              </div>
              {loading ? <Spinner /> : allInventory.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No inventory records</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>Resource</th><th>Warehouse</th><th style={{ textAlign: 'right' }}>Qty</th><th style={{ textAlign: 'right' }}>Min</th><th>Status</th></tr></thead>
                    <tbody>
                      {allInventory.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{r.Resource_Name}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>{r.Resource_Type}</div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.Warehouse_Name || '—'}</td>
                          <td className="num">{r.Quantity?.toLocaleString()}</td>
                          <td className="num" style={{ color: 'var(--text-faint)' }}>{r.Min_Threshold}</td>
                          <td>
                            {r.Stock_Status === 'OUT OF STOCK' && <span className="badge critical"><span className="dot" />Out of stock</span>}
                            {r.Stock_Status === 'LOW STOCK'   && <span className="badge pending"><span className="dot" />Low stock</span>}
                            {r.Stock_Status === 'OK'          && <span className="badge delivered"><span className="dot" />Healthy</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* ── Dispatch Log ── */}
          {activeNav === 'dispatches' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div className="card-title">Dispatch log</div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{allDispatches.length} entries</span>
              </div>
              {loading ? <Spinner /> : allDispatches.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No dispatches yet</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>Dispatch</th><th>Request</th><th>Warehouse</th><th>Dispatched</th><th>ETA</th><th>Arrived</th><th>Status</th></tr></thead>
                    <tbody>
                      {allDispatches.map(d => (
                        <tr key={d.Dispatch_ID}>
                          <td className="mono" style={{ fontSize: 11 }}>DSP-{String(d.Dispatch_ID).padStart(3, '0')}</td>
                          <td><span className="id">REQ-{d.Req_ID}</span></td>
                          <td style={{ color: 'var(--text-muted)' }}>{d.Warehouse_Name || '—'}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(d.Dispatch_Time)}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(d.Estimated_Arrival)}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{d.Actual_Arrival ? fmtDate(d.Actual_Arrival) : '—'}</td>
                          <td><StatusBadge s={d.Actual_Arrival ? 'Delivered' : 'Dispatched'} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* ── Audit Log ── */}
          {activeNav === 'audit' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div className="card-title">Audit log</div>
                <span className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>last 20 entries</span>
              </div>
              <div style={{ padding: '8px 14px' }}>
                {audit.length === 0
                  ? <div style={{ padding: '8px 0', fontSize: 12, color: 'var(--text-faint)' }}>No audit entries yet</div>
                  : audit.map((l, i) => {
                    const oldV = typeof l.Old_Value === 'string' ? JSON.parse(l.Old_Value || '{}') : (l.Old_Value || {});
                    const newV = typeof l.New_Value === 'string' ? JSON.parse(l.New_Value || '{}') : (l.New_Value || {});
                    const detail = oldV.Status ? `${oldV.Status} → ${newV.Status}` : JSON.stringify(newV).slice(0, 60);
                    return (
                      <div key={l.Log_ID} style={{ display: 'grid', gridTemplateColumns: '50px 130px 1fr 80px', gap: 10, padding: '8px 0', fontSize: 11.5, alignItems: 'center', borderBottom: i < audit.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <span className="mono" style={{ color: l.Action === 'INSERT' ? 'var(--status-delivered)' : 'var(--accent-text)', fontSize: 10 }}>{l.Action}</span>
                        <span className="mono" style={{ color: 'var(--text-muted)', fontSize: 10.5 }}>{l.Table_Name}</span>
                        <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ color: 'var(--text)' }}>{l.Changed_By}</span> · {detail}
                        </span>
                        <span className="mono" style={{ color: 'var(--text-faint)', fontSize: 10.5, textAlign: 'right' }}>{timeAgo(l.Changed_At)}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Request Detail Modal ── */}
          {reqDetail && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="card" style={{ width: 600, maxHeight: '80vh', overflow: 'auto' }}>
                <div className="card-header">
                  <div>
                    <div className="card-title">REQ-{reqDetail.Req_ID} · lifecycle</div>
                    <div className="card-subtitle">{reqDetail.Camp_Name} · {reqDetail.Event_Name}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setReqDetail(null)}><Icon name="x" size={12} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 0 }}>
                  <div style={{ padding: 16, borderRight: '1px solid var(--border)' }}>
                    <div className="timeline">
                      {[
                        { t: 'Request raised',             m: fmtDate(reqDetail.Request_Time), state: 'done' },
                        { t: 'Control center review',      m: reqDetail.Status === 'Pending' ? 'Awaiting approval' : 'Approved', state: reqDetail.Status !== 'Pending' ? 'done' : 'active' },
                        { t: 'Dispatched from warehouse',  m: reqDetail.dispatch ? `From ${reqDetail.dispatch.Warehouse_Name} · ${fmtDate(reqDetail.dispatch.Dispatch_Time)}` : 'Waiting for dispatch', state: reqDetail.dispatch ? 'done' : (reqDetail.Status === 'Approved' ? 'active' : 'pending') },
                        { t: 'Delivery confirmation',      m: reqDetail.dispatch?.Actual_Arrival ? fmtDate(reqDetail.dispatch.Actual_Arrival) : 'Awaiting receipt', state: reqDetail.dispatch?.Actual_Arrival ? 'done' : 'pending' },
                      ].map((s, i) => (
                        <div key={i} className="timeline-item">
                          <div className={'timeline-dot ' + (s.state === 'done' ? 'done' : s.state === 'active' ? 'active' : '')} />
                          <div className="timeline-content">
                            <div className="timeline-title">{s.t}</div>
                            <div className="timeline-meta">{s.m}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Line items</div>
                    <table className="tbl" style={{ fontSize: 11.5 }}>
                      <thead><tr><th>Resource</th><th style={{ textAlign: 'right' }}>Req</th><th style={{ textAlign: 'right' }}>Apr</th></tr></thead>
                      <tbody>
                        {reqDetail.items?.map(it => (
                          <tr key={it.Req_Detail_ID}>
                            <td>{it.Resource_Name}</td>
                            <td className="num">{it.Requested_Qty}</td>
                            <td className="num">{it.Approved_Qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reqDetail.dispatch && (
                      <>
                        <div className="divider" />
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Dispatch</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-faint)' }}>From</span><span>{reqDetail.dispatch.Warehouse_Name}</span>
                          <span style={{ color: 'var(--text-faint)' }}>Dispatched</span><span className="mono">{fmtDate(reqDetail.dispatch.Dispatch_Time)}</span>
                          <span style={{ color: 'var(--text-faint)' }}>ETA</span><span className="mono">{fmtDate(reqDetail.dispatch.Estimated_Arrival)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
