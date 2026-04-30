import { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import Icon from '../components/Icon';
import { StatusBadge, PriorityCell, Spinner, ErrorMsg, timeAgo, fmtDate } from '../components/shared';
import { getRequests, getRequest, getCampStats, createRequest, confirmDelivery, getResources, getCamps, getDispatches } from '../api';

const NAV = [
  { label: 'My camp', items: [
    { key: 'overview',  icon: 'dashboard', label: 'Overview' },
    { key: 'requests',  icon: 'inbox',     label: 'My Requests' },
    { key: 'new',       icon: 'plus',      label: 'New Request' },
  ]},
  { label: 'Track', items: [
    { key: 'incoming',  icon: 'truck',     label: 'Incoming' },
  ]},
];

const levelColor = {
  Critical: 'var(--status-critical)',
  High:     'var(--status-critical)',
  Medium:   'var(--status-pending)',
  Low:      'var(--status-delivered)',
};

export default function Camp({ onLogout }) {
  const campId = Number(sessionStorage.getItem('dras_camp_id') || 1);
  const ccId   = Number(sessionStorage.getItem('dras_cc_id')   || 1);

  const [activeNav, setActiveNav] = useState('requests');
  const [camp, setCamp]           = useState(null);
  const [stats, setStats]         = useState(null);
  const [requests, setRequests]   = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  // New request form state
  const [priority, setPriority]   = useState('Medium');
  const [items, setItems]         = useState([{ resId: '', qty: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  // Selected request for detail view
  const [detail, setDetail]       = useState(null);
  const [confirming, setConfirming] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [reqs, campStats, disps, res, campsData] = await Promise.all([
        getRequests({ campId }),
        getCampStats(campId),
        getDispatches(),
        getResources(),
        getCamps(),
      ]);
      setRequests(reqs);
      setStats(campStats);
      const campDisps = disps.filter(d => reqs.some(r => r.Req_ID === d.Req_ID));
      setDispatches(campDisps);
      setResources(res);
      const found = campsData.find(c => c.Camp_ID === campId);
      setCamp(found || null);
    } catch (e) {
      setError(e.message);
    }
  }, [campId]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const addItem    = () => setItems(prev => [...prev, { resId: '', qty: '' }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, j) => j !== i));
  const setItem    = (i, key, val) => setItems(prev => prev.map((it, j) => j === i ? { ...it, [key]: val } : it));

  const handleSubmit = async () => {
    const valid = items.filter(it => it.resId && it.qty > 0);
    if (!valid.length) { setSubmitMsg('Add at least one item with quantity > 0'); return; }
    setSubmitting(true); setSubmitMsg('');
    try {
      const { reqId } = await createRequest({ campId, ccId, priority, items: valid.map(it => ({ resId: Number(it.resId), qty: Number(it.qty) })) });
      setSubmitMsg(`Request REQ-${reqId} submitted successfully!`);
      setItems([{ resId: '', qty: '' }]);
      setPriority('Medium');
      await loadData();
      setActiveNav('requests');
    } catch (e) {
      setSubmitMsg('Error: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (dispatchId) => {
    setConfirming(dispatchId);
    try {
      await confirmDelivery(dispatchId, camp?.Name || 'Camp Officer');
      await loadData();
    } catch (e) {
      alert('Confirm failed: ' + e.message);
    } finally {
      setConfirming(null);
    }
  };

  const openDetail = async (reqId) => {
    try {
      const d = await getRequest(reqId);
      setDetail(d);
    } catch { /* ignore */ }
  };

  return (
    <div className="dras-app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar role="camp" crumbs={[camp?.Name || 'Camp', activeNav === 'new' ? 'New Request' : activeNav === 'overview' ? 'Overview' : activeNav === 'incoming' ? 'Incoming' : 'Requests']} onLogout={onLogout} />
      <div className="shell">
        <Sidebar items={NAV} activeKey={activeNav} onSelect={setActiveNav} />
        <div className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">{camp?.Name || 'Camp'} · {activeNav === 'overview' ? 'Overview' : activeNav === 'new' ? 'New Request' : activeNav === 'incoming' ? 'Incoming shipments' : 'Request inbox'}</h1>
              <div className="page-subtitle">
                Linked event <span className="mono" style={{ color: 'var(--text)' }}>{camp?.Event_Name}</span>
                {camp && ` · ${camp.Current_Occupancy} occupants · Capacity ${camp.Max_Capacity}`}
              </div>
            </div>
            <div className="page-actions">
              <button className="btn btn-primary" onClick={() => setActiveNav('new')}>
                <Icon name="plus" size={12} /> Raise request
              </button>
            </div>
          </div>

          {error && <ErrorMsg msg={error} />}

          {/* Stats always visible */}
          <div className="stat-grid">
            <div className="stat"><div className="stat-label">Active requests</div><div className="stat-value">{stats?.active ?? '—'}</div><div className="stat-delta">not yet delivered</div></div>
            <div className="stat"><div className="stat-label">Awaiting delivery</div><div className="stat-value">{stats?.awaiting ?? '—'}</div><div className="stat-delta">in transit</div></div>
            <div className="stat"><div className="stat-label">Delivered · 7d</div><div className="stat-value">{stats?.delivered ?? '—'}</div><div className="stat-delta up">this week</div></div>
            <div className="stat">
              <div className="stat-label">Pending confirmations</div>
              <div className="stat-value" style={stats?.pendingConfirm > 0 ? { color: 'var(--status-pending)' } : {}}>
                {stats?.pendingConfirm ?? '—'}
              </div>
              <div className="stat-delta">{stats?.pendingConfirm > 0 ? 'action needed' : 'all confirmed'}</div>
            </div>
          </div>

          {/* ── Overview ── */}
          {activeNav === 'overview' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Camp details</div></div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: 13, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Name</span>
                  <span style={{ fontWeight: 500 }}>{camp?.Name || '—'}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Event</span>
                  <span>{camp?.Event_Name || '—'}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Occupancy</span>
                  <span>{camp?.Current_Occupancy ?? '—'} / {camp?.Max_Capacity ?? '—'}</span>
                  {camp?.Event_Level && (
                    <>
                      <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Event level</span>
                      <span style={{ fontWeight: 600, color: levelColor[camp.Event_Level] || 'var(--text)' }}>{camp.Event_Level}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="card">
                <div className="card-header"><div className="card-title">Request summary</div></div>
                <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 20px', fontSize: 13, alignItems: 'baseline' }}>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Total requests</span>
                  <span style={{ fontWeight: 500 }}>{requests.length}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Pending</span>
                  <span>{requests.filter(r => r.Status === 'Pending').length}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Approved</span>
                  <span>{requests.filter(r => r.Status === 'Approved').length}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Dispatched</span>
                  <span>{requests.filter(r => r.Status === 'Dispatched').length}</span>
                  <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Delivered</span>
                  <span style={{ color: 'var(--status-delivered)' }}>{requests.filter(r => r.Status === 'Delivered').length}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── My Requests ── */}
          {activeNav === 'requests' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div><div className="card-title">My requests</div><div className="card-subtitle">Lifecycle of every request raised from this camp</div></div>
              </div>
              {loading ? <Spinner /> : (
                <table className="tbl">
                  <thead><tr><th>Request</th><th>Items</th><th>Priority</th><th>Status</th><th>ETA</th><th></th></tr></thead>
                  <tbody>
                    {requests.length === 0
                      ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 20 }}>No requests yet. Click "Raise request" to start.</td></tr>
                      : requests.map(r => {
                        const disp = dispatches.find(d => d.Req_ID === r.Req_ID);
                        const eta  = disp?.Estimated_Arrival ? fmtDate(disp.Estimated_Arrival) : '—';
                        return (
                          <tr key={r.Req_ID}>
                            <td>
                              <div className="id">REQ-{r.Req_ID}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{timeAgo(r.Request_Time)}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.Resource_Summary || '—'}</div>
                              <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }} className="mono">{r.Total_Items} item{r.Total_Items !== 1 ? 's' : ''}</div>
                            </td>
                            <td><PriorityCell p={r.Priority} /></td>
                            <td><StatusBadge s={r.Status} /></td>
                            <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{eta}</td>
                            <td style={{ textAlign: 'right' }}>
                              {disp && !disp.Actual_Arrival && (disp.Status === 'Delivered' || r.Status === 'Dispatched')
                                ? <button className="btn btn-accent btn-sm" disabled={confirming === disp?.Dispatch_ID} onClick={() => disp && handleConfirm(disp.Dispatch_ID)}>
                                    {confirming === disp?.Dispatch_ID ? '…' : 'Confirm'}
                                  </button>
                                : <button className="btn btn-ghost btn-sm" onClick={() => openDetail(r.Req_ID)}>
                                    <Icon name="eye" size={12} />
                                  </button>}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ── New Request Form ── */}
          {activeNav === 'new' && (
            <div className="card" style={{ maxWidth: 560 }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Raise new request</div>
                  <div className="card-subtitle">Inserts into <span className="mono" style={{ color: 'var(--text)' }}>Request</span> + <span className="mono" style={{ color: 'var(--text)' }}>Request_Details</span></div>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label className="field-label">Priority</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6 }}>
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                      <div
                        key={p}
                        onClick={() => setPriority(p)}
                        style={{
                          padding: '6px', textAlign: 'center', fontSize: 11, fontWeight: 500, borderRadius: 4, cursor: 'pointer',
                          border: '1px solid ' + (priority === p ? 'var(--accent)' : 'var(--border)'),
                          background: priority === p ? 'var(--accent-soft)' : 'var(--surface)',
                          color: priority === p ? 'var(--accent-text)' : 'var(--text-muted)',
                        }}
                      >{p}</div>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Line items <span className="req">*</span></label>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 4 }}>
                    {items.map((it, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 28px', gap: 6, padding: '6px 8px', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                        <select
                          className="input" value={it.resId}
                          onChange={e => setItem(i, 'resId', e.target.value)}
                          style={{ padding: '4px 6px', fontSize: 12, height: 28 }}
                        >
                          <option value="">Select resource…</option>
                          {resources.map(r => <option key={r.Res_ID} value={r.Res_ID}>{r.Name} ({r.Unit})</option>)}
                        </select>
                        <input
                          className="input" type="number" min="1" value={it.qty}
                          onChange={e => setItem(i, 'qty', e.target.value)}
                          placeholder="Qty" style={{ padding: '4px 6px', fontSize: 12, height: 28, textAlign: 'right' }}
                        />
                        <button className="btn btn-ghost btn-sm" style={{ padding: '2px 4px' }} onClick={() => removeItem(i)}>
                          <Icon name="x" size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 4, alignSelf: 'flex-start' }} onClick={addItem}>
                    <Icon name="plus" size={11} /> Add item
                  </button>
                </div>

                {submitMsg && (
                  <div style={{ padding: '8px 10px', borderRadius: 4, fontSize: 12, background: submitMsg.startsWith('Error') ? 'var(--status-critical-bg)' : 'var(--status-delivered-bg)', color: submitMsg.startsWith('Error') ? 'var(--status-critical)' : 'var(--status-delivered)' }}>
                    {submitMsg}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{items.filter(i => i.resId).length} line item{items.filter(i => i.resId).length !== 1 ? 's' : ''}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => setActiveNav('requests')}>Cancel</button>
                    <button className="btn btn-primary btn-sm" disabled={submitting} onClick={handleSubmit}>
                      {submitting ? 'Submitting…' : 'Submit request'} <Icon name="arrow" size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Incoming shipments ── */}
          {activeNav === 'incoming' && (
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Incoming shipments</div>
                  <div className="card-subtitle">Dispatches linked to this camp's requests</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>{dispatches.length} record{dispatches.length !== 1 ? 's' : ''}</span>
              </div>
              {loading ? <Spinner /> : dispatches.length === 0
                ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>No dispatches yet.</div>
                : (
                  <table className="tbl">
                    <thead><tr><th>Request</th><th>Dispatched</th><th>ETA</th><th>Arrived</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {dispatches.map(d => (
                        <tr key={d.Dispatch_ID}>
                          <td><span className="id">REQ-{d.Req_ID}</span></td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmtDate(d.Dispatch_Time)}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(d.Estimated_Arrival)}</td>
                          <td className="mono" style={{ fontSize: 11, color: 'var(--text-faint)' }}>{d.Actual_Arrival ? fmtDate(d.Actual_Arrival) : '—'}</td>
                          <td><StatusBadge s={d.Actual_Arrival ? 'Delivered' : 'Dispatched'} /></td>
                          <td style={{ textAlign: 'right' }}>
                            {!d.Actual_Arrival && (
                              <button className="btn btn-accent btn-sm" disabled={confirming === d.Dispatch_ID} onClick={() => handleConfirm(d.Dispatch_ID)}>
                                {confirming === d.Dispatch_ID ? '…' : 'Confirm'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* ── Request Detail Modal ── */}
          {detail && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
              <div className="card" style={{ width: 600, maxHeight: '80vh', overflow: 'auto' }}>
                <div className="card-header">
                  <div>
                    <div className="card-title">REQ-{detail.Req_ID} · lifecycle</div>
                    <div className="card-subtitle">{detail.Camp_Name} · {detail.Event_Name}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setDetail(null)}><Icon name="x" size={12} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 0 }}>
                  <div style={{ padding: 16, borderRight: '1px solid var(--border)' }}>
                    <div className="timeline">
                      {[
                        { t: 'Request raised',            m: fmtDate(detail.Request_Time), state: 'done' },
                        { t: 'Control center review',     m: detail.Status === 'Pending' ? 'Awaiting approval' : 'Approved', state: detail.Status !== 'Pending' ? 'done' : 'active' },
                        { t: 'Dispatched from warehouse', m: detail.dispatch ? `From ${detail.dispatch.Warehouse_Name} · ${fmtDate(detail.dispatch.Dispatch_Time)}` : 'Waiting for dispatch', state: detail.dispatch ? 'done' : (detail.Status === 'Approved' ? 'active' : 'pending') },
                        { t: 'Delivery confirmation',     m: detail.dispatch?.Actual_Arrival ? fmtDate(detail.dispatch.Actual_Arrival) : 'Awaiting receipt', state: detail.dispatch?.Actual_Arrival ? 'done' : 'pending' },
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
                        {detail.items?.map(it => (
                          <tr key={it.Req_Detail_ID}>
                            <td>{it.Resource_Name}</td>
                            <td className="num">{it.Requested_Qty}</td>
                            <td className="num">{it.Approved_Qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {detail.dispatch && (
                      <>
                        <div className="divider" />
                        <div className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Dispatch</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px', fontSize: 12 }}>
                          <span style={{ color: 'var(--text-faint)' }}>From</span><span>{detail.dispatch.Warehouse_Name}</span>
                          <span style={{ color: 'var(--text-faint)' }}>Dispatched</span><span className="mono">{fmtDate(detail.dispatch.Dispatch_Time)}</span>
                          <span style={{ color: 'var(--text-faint)' }}>ETA</span><span className="mono">{fmtDate(detail.dispatch.Estimated_Arrival)}</span>
                          {detail.dispatch.Confirmation && <>
                            <span style={{ color: 'var(--text-faint)' }}>Status</span><span>{detail.dispatch.Confirmation}</span>
                          </>}
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
