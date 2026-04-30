// admin.jsx — Control Admin dashboard

const StatusBadge = ({ s }) => {
  const map = {
    Pending: "pending", Approved: "approved", Dispatched: "dispatched",
    Delivered: "delivered", Cancelled: "cancelled", Rejected: "cancelled",
  };
  return <span className={"badge " + (map[s] || "")}><span className="dot"/>{s}</span>;
};

const PriorityCell = ({ p }) => {
  const k = p.toLowerCase();
  return (
    <span className={"priority " + k}>
      <span className="bar"/>
      <span className="bar" style={{opacity: k === "low" ? 0.25 : 1}}/>
      <span className="bar" style={{opacity: k === "high" ? 1 : 0.25}}/>
      {p}
    </span>
  );
};

// Tiny SVG map of India with disaster markers
const MiniMap = () => (
  <svg viewBox="0 0 220 240" style={{width: "100%", height: "auto"}}>
    {/* abstract India outline — simplified blob */}
    <path d="M70 30 L100 22 L130 28 L155 40 L170 60 L168 90 L180 115 L172 145 L150 175 L130 200 L110 215 L92 218 L80 200 L70 175 L55 150 L48 120 L52 90 L60 60 Z"
      fill="var(--surface-sunken)" stroke="var(--border-strong)" strokeWidth="0.8"/>
    {/* state lines as faint */}
    <g stroke="var(--border)" strokeWidth="0.5" fill="none">
      <path d="M70 80 L165 85"/>
      <path d="M65 130 L175 130"/>
      <path d="M110 30 L110 215"/>
    </g>
    {/* event markers */}
    {[
      {x: 155, y: 110, level: "high", label: "Megha"},
      {x: 145, y: 60, level: "high", label: "Assam"},
      {x: 78, y: 165, level: "medium", label: "Idukki"},
      {x: 92, y: 90, level: "low"},
      {x: 130, y: 175, level: "low"},
    ].map((m, i) => {
      const c = m.level === "high" ? "var(--status-critical)"
              : m.level === "medium" ? "var(--status-pending)" : "var(--status-delivered)";
      return (
        <g key={i}>
          <circle cx={m.x} cy={m.y} r="8" fill={c} fillOpacity="0.18"/>
          <circle cx={m.x} cy={m.y} r="3.5" fill={c}/>
          {m.label && (
            <text x={m.x + 8} y={m.y + 3} fontSize="8" fill="var(--text-muted)" fontFamily="var(--font-mono)">{m.label}</text>
          )}
        </g>
      );
    })}
  </svg>
);

const AdminDashboard = () => {
  const adminNav = [
    {label: "Operations", items: [
      {icon: "dashboard", label: "Overview", active: true},
      {icon: "alert", label: "Disaster Events", badge: "3"},
      {icon: "camp", label: "Relief Camps", badge: 23},
      {icon: "inbox", label: "Requests", badge: 47},
    ]},
    {label: "Resources", items: [
      {icon: "warehouse", label: "Warehouses"},
      {icon: "package", label: "Inventory"},
      {icon: "truck", label: "Dispatches"},
    ]},
    {label: "Admin", items: [
      {icon: "user", label: "Users & Roles"},
      {icon: "log", label: "Audit Log"},
      {icon: "settings", label: "Settings"},
    ]},
  ];

  const [tab, setTab] = React.useState("pending");

  const requests = [
    {id: "REQ-1042", camp: "Camp Vizag-7", res: "Water (200), Tarpaulin (40)", priority: "High", status: "Pending", time: "12 min ago"},
    {id: "REQ-1041", camp: "Camp Guwahati-3", res: "Medical Kit (15)", priority: "High", status: "Pending", time: "28 min ago"},
    {id: "REQ-1040", camp: "Camp Vizag-2", res: "Rice (500kg), Dal (150kg)", priority: "Medium", status: "Approved", time: "1h ago"},
    {id: "REQ-1039", camp: "Camp Idukki-1", res: "Blankets (80), Torch (20)", priority: "Medium", status: "Dispatched", time: "3h ago"},
    {id: "REQ-1038", camp: "Camp Guwahati-1", res: "Shelter Kit (30)", priority: "High", status: "Dispatched", time: "5h ago"},
    {id: "REQ-1037", camp: "Camp Vizag-4", res: "Water (150), Cooking Oil (40L)", priority: "Low", status: "Delivered", time: "yesterday"},
  ];

  return (
    <div className="dras-app" style={{display: "flex", flexDirection: "column"}}>
      <TopBar role="admin" crumbs={["DRAS", "Operations", "Overview"]} />
      <div className="shell">
        <Sidebar items={adminNav} collapsed={false} onToggle={()=>{}} />
        <div className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">National Operations Overview</h1>
              <div className="page-subtitle">All control centers · Last sync <span className="mono">2026-04-30 14:32 IST</span></div>
            </div>
            <div className="page-actions">
              <button className="btn"><Icon name="download" size={12}/>Export</button>
              <button className="btn"><Icon name="filter" size={12}/>Filters</button>
              <button className="btn btn-primary"><Icon name="plus" size={12}/>New event</button>
            </div>
          </div>

          {/* stats */}
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-label">Active events</div>
              <div className="stat-value">3</div>
              <div className="stat-delta">2 high · 1 medium</div>
            </div>
            <div className="stat">
              <div className="stat-label">Pending requests</div>
              <div className="stat-value">47</div>
              <div className="stat-delta up">↓ 12 since yesterday</div>
            </div>
            <div className="stat">
              <div className="stat-label">In-transit dispatches</div>
              <div className="stat-value">23</div>
              <div className="stat-delta">avg ETA 38h</div>
            </div>
            <div className="stat">
              <div className="stat-label">Critical stock alerts</div>
              <div className="stat-value">6</div>
              <div className="stat-delta down">↑ 2 unresolved</div>
            </div>
          </div>

          {/* row: requests + map */}
          <div style={{display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 16}}>
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Request queue</div>
                  <div className="card-subtitle">Triage and approve incoming relief requests</div>
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                  <span style={{fontSize: 11, color: "var(--text-faint)"}}>auto-refresh</span>
                  <span style={{width: 6, height: 6, borderRadius: 3, background: "var(--status-delivered)"}}/>
                </div>
              </div>
              <div style={{padding: "0 14px"}}>
                <div className="tabs">
                  {[
                    {k: "pending", l: "Pending", c: 8},
                    {k: "approved", l: "Approved", c: 12},
                    {k: "dispatched", l: "In transit", c: 23},
                    {k: "delivered", l: "Delivered", c: 156},
                  ].map(t => (
                    <div key={t.k} className={"tab" + (tab === t.k ? " active" : "")} onClick={()=>setTab(t.k)}>
                      {t.l}<span className="count">{t.c}</span>
                    </div>
                  ))}
                </div>
              </div>
              <table className="tbl">
                <thead><tr>
                  <th>Request</th><th>Camp</th><th>Resources</th>
                  <th>Priority</th><th>Status</th><th></th>
                </tr></thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div className="id">{r.id}</div>
                        <div style={{fontSize: 10.5, color: "var(--text-faint)", marginTop: 1}}>{r.time}</div>
                      </td>
                      <td>{r.camp}</td>
                      <td style={{maxWidth: 220}}><span style={{fontSize: 12, color: "var(--text-muted)"}}>{r.res}</span></td>
                      <td><PriorityCell p={r.priority}/></td>
                      <td><StatusBadge s={r.status}/></td>
                      <td style={{textAlign: "right"}}>
                        {r.status === "Pending"
                          ? <button className="btn btn-accent btn-sm">Approve</button>
                          : <button className="btn btn-ghost btn-sm"><Icon name="ellipsis" size={12}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Active events · map</div>
                    <div className="card-subtitle">Disaster_Event WHERE Status='Active'</div>
                  </div>
                  <button className="btn btn-ghost btn-sm">Open <Icon name="arrow" size={11}/></button>
                </div>
                <div style={{padding: 14, background: "var(--bg)"}}>
                  <MiniMap/>
                </div>
                <div style={{padding: 12, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-faint)"}}>
                  <span><span style={{color: "var(--status-critical)"}}>●</span> High &nbsp;<span style={{color: "var(--status-pending)"}}>●</span> Medium &nbsp;<span style={{color: "var(--status-delivered)"}}>●</span> Low</span>
                  <span className="mono">5 markers</span>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Stock alerts</div>
                  <button className="btn btn-ghost btn-sm">View all (6)</button>
                </div>
                <div style={{padding: "4px 14px 12px"}}>
                  {[
                    {res: "Medical Kit", wh: "WH-Vizag", q: 8, t: 25, crit: true},
                    {res: "Water", wh: "WH-Guwahati", q: 320, t: 800, crit: true},
                    {res: "Tarpaulin", wh: "WH-Vizag", q: 24, t: 50},
                  ].map((a, i) => (
                    <div key={i} style={{padding: "10px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none"}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6}}>
                        <span style={{fontSize: 12, fontWeight: 500}}>{a.res} · <span className="mono" style={{color: "var(--text-faint)", fontWeight: 400, fontSize: 11}}>{a.wh}</span></span>
                        <span className="mono" style={{fontSize: 11}}>{a.q} / {a.t}</span>
                      </div>
                      <div className="bar-track">
                        <div className={"bar-fill " + (a.crit ? "crit" : "warn")} style={{width: (a.q / a.t * 100) + "%"}}/>
                        <div className="bar-marker" style={{left: "100%"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* bottom row: audit + procedure activity */}
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
            <div className="card">
              <div className="card-header"><div className="card-title">Recent audit log</div><span className="mono" style={{fontSize: 10.5, color: "var(--text-faint)"}}>Audit_Log · last 24h</span></div>
              <div style={{padding: "8px 14px"}}>
                {[
                  {a: "UPDATE", t: "Request", who: "S. Iyer", det: "REQ-1040 status Pending → Approved", time: "14:28"},
                  {a: "UPDATE", t: "Warehouse_Inventory", who: "sp_Dispatch_Request", det: "WH-2 Water 1200→1000", time: "14:21"},
                  {a: "INSERT", t: "Stock_Alert", who: "trg_after_inventory_update", det: "Medical Kit @ WH-Vizag", time: "14:15"},
                  {a: "INSERT", t: "Request", who: "R. Patel", det: "REQ-1042 from Camp Vizag-7", time: "14:20"},
                ].map((l, i) => (
                  <div key={i} style={{display: "grid", gridTemplateColumns: "60px 130px 1fr 50px", gap: 10, padding: "7px 0", fontSize: 11.5, alignItems: "center", borderBottom: i < 3 ? "1px solid var(--border)" : "none"}}>
                    <span className="mono" style={{color: l.a === "INSERT" ? "var(--status-delivered)" : "var(--accent-text)", fontSize: 10}}>{l.a}</span>
                    <span className="mono" style={{color: "var(--text-muted)", fontSize: 10.5}}>{l.t}</span>
                    <span style={{color: "var(--text-muted)"}}><span style={{color: "var(--text)"}}>{l.who}</span> · {l.det}</span>
                    <span className="mono" style={{color: "var(--text-faint)", fontSize: 10.5, textAlign: "right"}}>{l.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Stored procedure activity · 24h</div></div>
              <div style={{padding: "12px 14px"}}>
                {[
                  {p: "sp_Approve_Request", n: 18, ok: 17, fail: 1},
                  {p: "sp_Dispatch_Request", n: 23, ok: 23, fail: 0},
                  {p: "sp_Confirm_Delivery", n: 19, ok: 19, fail: 0},
                  {p: "sp_Restock", n: 6, ok: 6, fail: 0},
                ].map((p, i) => (
                  <div key={i} style={{padding: "8px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none"}}>
                    <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5}}>
                      <span className="mono" style={{fontSize: 11.5, color: "var(--text)"}}>{p.p}</span>
                      <span style={{fontSize: 11, color: "var(--text-muted)"}}>
                        <span className="mono">{p.ok}</span>/<span className="mono">{p.n}</span> ok
                        {p.fail > 0 && <span style={{color: "var(--status-critical)", marginLeft: 6}} className="mono">· {p.fail} signal</span>}
                      </span>
                    </div>
                    <div style={{display: "flex", gap: 2, height: 8}}>
                      {Array.from({length: p.n}).map((_, j) => (
                        <div key={j} style={{flex: 1, background: j < p.ok ? "var(--status-delivered-bg)" : "var(--status-critical-bg)", borderTop: "2px solid", borderColor: j < p.ok ? "var(--status-delivered)" : "var(--status-critical)"}}/>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { AdminDashboard, StatusBadge, PriorityCell });
