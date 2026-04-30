// camp.jsx — Camp Officer dashboard

const CampDashboard = () => {
  const nav = [
    {label: "My camp", items: [
      {icon: "dashboard", label: "Overview"},
      {icon: "inbox", label: "My Requests", active: true, badge: 5},
      {icon: "plus", label: "New Request"},
    ]},
    {label: "Track", items: [
      {icon: "truck", label: "Incoming"},
      {icon: "check", label: "Confirm Delivery", badge: 2},
    ]},
    {label: "Reference", items: [
      {icon: "package", label: "Resources"},
      {icon: "file", label: "Camp profile"},
    ]},
  ];

  const myRequests = [
    {id: "REQ-1042", res: "Water · Tarpaulin", status: "Pending", priority: "High", placed: "14:20", lines: 2},
    {id: "REQ-1040", res: "Rice · Dal", status: "Approved", priority: "Medium", placed: "13:12", lines: 2},
    {id: "REQ-1036", res: "Medical Kit", status: "Dispatched", priority: "High", placed: "11:48", lines: 1, eta: "in 36h"},
    {id: "REQ-1031", res: "Blankets · Torch · Batteries", status: "Dispatched", priority: "Low", placed: "yesterday", lines: 3, eta: "in 12h"},
    {id: "REQ-1028", res: "Shelter Kit", status: "Delivered", priority: "High", placed: "2d ago", lines: 1},
  ];

  return (
    <div className="dras-app" style={{display: "flex", flexDirection: "column"}}>
      <TopBar role="camp" crumbs={["Camp Vizag-7", "Requests"]} />
      <div className="shell">
        <Sidebar items={nav} collapsed={false} onToggle={()=>{}} />
        <div className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">Camp Vizag-7 · Request inbox</h1>
              <div className="page-subtitle">
                Linked event <span className="mono" style={{color: "var(--text)"}}>EVT-014 · Cyclone Megha</span> · 1,240 occupants · Capacity 1,500
              </div>
            </div>
            <div className="page-actions">
              <button className="btn btn-primary"><Icon name="plus" size={12}/>Raise request</button>
            </div>
          </div>

          {/* mini stats */}
          <div className="stat-grid" style={{gridTemplateColumns: "repeat(4, 1fr)"}}>
            <div className="stat"><div className="stat-label">Active requests</div><div className="stat-value">5</div><div className="stat-delta">2 awaiting approval</div></div>
            <div className="stat"><div className="stat-label">Awaiting delivery</div><div className="stat-value">2</div><div className="stat-delta">earliest in 12h</div></div>
            <div className="stat"><div className="stat-label">Delivered · 7d</div><div className="stat-value">14</div><div className="stat-delta up">98% on time</div></div>
            <div className="stat"><div className="stat-label">Pending confirmations</div><div className="stat-value" style={{color: "var(--status-pending)"}}>2</div><div className="stat-delta">action needed</div></div>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16}}>
            {/* request composer / new request panel */}
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">My requests</div>
                  <div className="card-subtitle">Lifecycle of every request raised from this camp</div>
                </div>
                <div style={{display: "flex", gap: 4, alignItems: "center"}}>
                  <input className="input" placeholder="Search…" style={{padding: "5px 10px", width: 180, fontSize: 11.5}}/>
                </div>
              </div>
              <table className="tbl">
                <thead><tr>
                  <th>Request</th><th>Items</th><th>Priority</th><th>Status</th><th>ETA</th><th></th>
                </tr></thead>
                <tbody>
                  {myRequests.map(r => (
                    <tr key={r.id}>
                      <td><div className="id">{r.id}</div><div style={{fontSize: 10.5, color: "var(--text-faint)", marginTop: 1}}>{r.placed}</div></td>
                      <td>
                        <div style={{fontSize: 12, color: "var(--text-muted)"}}>{r.res}</div>
                        <div style={{fontSize: 10.5, color: "var(--text-faint)", marginTop: 1}} className="mono">{r.lines} line{r.lines>1?"s":""}</div>
                      </td>
                      <td><PriorityCell p={r.priority}/></td>
                      <td><StatusBadge s={r.status}/></td>
                      <td className="mono" style={{fontSize: 11, color: "var(--text-muted)"}}>{r.eta || "—"}</td>
                      <td style={{textAlign: "right"}}>
                        {r.status === "Dispatched"
                          ? <button className="btn btn-accent btn-sm">Confirm</button>
                          : <button className="btn btn-ghost btn-sm"><Icon name="eye" size={12}/></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* new request inline form */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Raise new request</div>
                  <div className="card-subtitle">Inserts into <span className="mono" style={{color: "var(--text)"}}>Request</span> + <span className="mono" style={{color: "var(--text)"}}>Request_Details</span></div>
                </div>
              </div>
              <div className="card-body" style={{display: "flex", flexDirection: "column", gap: 12}}>
                <div className="field">
                  <label className="field-label">Priority</label>
                  <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6}}>
                    {["Low", "Medium", "High"].map((p, i) => (
                      <div key={p} style={{
                        padding: "6px", textAlign: "center", fontSize: 11, fontWeight: 500,
                        border: "1px solid " + (i === 2 ? "var(--accent)" : "var(--border)"),
                        background: i === 2 ? "var(--accent-soft)" : "var(--surface)",
                        color: i === 2 ? "var(--accent-text)" : "var(--text-muted)",
                        borderRadius: 4, cursor: "pointer",
                      }}>{p}</div>
                    ))}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label">Line items <span className="req">*</span></label>
                  <div style={{border: "1px solid var(--border)", borderRadius: 4}}>
                    {[
                      {res: "Water (20L)", q: 200, stock: "ok"},
                      {res: "Tarpaulin", q: 40, stock: "low"},
                    ].map((l, i) => (
                      <div key={i} style={{display: "grid", gridTemplateColumns: "1fr 70px 60px 24px", gap: 8, padding: "6px 8px", borderBottom: i < 1 ? "1px solid var(--border)" : "none", alignItems: "center"}}>
                        <span style={{fontSize: 12}}>{l.res}</span>
                        <input className="input" defaultValue={l.q} style={{padding: "3px 6px", fontSize: 11, height: 24, textAlign: "right"}} />
                        <span style={{fontSize: 10.5, color: l.stock === "ok" ? "var(--status-delivered)" : "var(--status-pending)", textAlign: "right"}} className="mono">{l.stock === "ok" ? "in stock" : "limited"}</span>
                        <button className="btn btn-ghost btn-sm" style={{padding: "2px 4px"}}><Icon name="x" size={10}/></button>
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{marginTop: 4, alignSelf: "flex-start"}}>
                    <Icon name="plus" size={11}/>Add item
                  </button>
                </div>

                <div className="field">
                  <label className="field-label">Note (optional)</label>
                  <textarea className="textarea" placeholder="Field conditions, urgency context…" defaultValue="Coastal flooding rising; tarp critical for 40 families along Sector C." />
                </div>

                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, borderTop: "1px solid var(--border)"}}>
                  <span style={{fontSize: 11, color: "var(--text-faint)"}}>2 line items</span>
                  <div style={{display: "flex", gap: 6}}>
                    <button className="btn btn-sm">Save draft</button>
                    <button className="btn btn-primary btn-sm">Submit request <Icon name="arrow" size={11}/></button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* request detail expanded */}
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">REQ-1036 · Medical Kit · lifecycle</div>
                <div className="card-subtitle">From <span className="mono" style={{color: "var(--text)"}}>vw_Request_Lifecycle</span></div>
              </div>
              <button className="btn btn-ghost btn-sm">Open full view <Icon name="arrow" size={11}/></button>
            </div>
            <div style={{display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 0}}>
              <div style={{padding: 16, borderRight: "1px solid var(--border)"}}>
                <div className="timeline">
                  {[
                    {t: "Request raised", m: "by R. Patel · 11:48 IST", state: "done"},
                    {t: "Approved by Control Center", m: "by S. Iyer · sp_Approve_Request · 12:04", state: "done"},
                    {t: "Dispatched from WH-Vizag", m: "Truck TR-08 · sp_Dispatch_Request · 13:32", state: "done"},
                    {t: "In transit · ETA 14h remaining", m: "Auto-updated by fn_Calculate_ETA", state: "active"},
                    {t: "Delivery confirmation", m: "Awaiting on-site receipt", state: "pending"},
                  ].map((s, i) => (
                    <div key={i} className="timeline-item">
                      <div className={"timeline-dot " + (s.state === "done" ? "done" : s.state === "active" ? "active" : "")}/>
                      <div className="timeline-content">
                        <div className="timeline-title">{s.t}</div>
                        <div className="timeline-meta">{s.m}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{padding: 16}}>
                <div className="mono" style={{fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8}}>Line items</div>
                <table className="tbl" style={{fontSize: 11.5}}>
                  <thead><tr><th>Resource</th><th style={{textAlign: "right"}}>Req</th><th style={{textAlign: "right"}}>Apr</th></tr></thead>
                  <tbody>
                    <tr><td>Medical Kit</td><td className="num">15</td><td className="num">15</td></tr>
                    <tr><td>Blankets</td><td className="num">20</td><td className="num">20</td></tr>
                  </tbody>
                </table>
                <div className="divider"/>
                <div className="mono" style={{fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8}}>Dispatch</div>
                <div style={{display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 12px", fontSize: 12}}>
                  <span style={{color: "var(--text-faint)"}}>From</span><span>WH-Vizag</span>
                  <span style={{color: "var(--text-faint)"}}>Vehicle</span><span className="mono">TR-08</span>
                  <span style={{color: "var(--text-faint)"}}>Dispatched</span><span className="mono">2026-04-30 13:32</span>
                  <span style={{color: "var(--text-faint)"}}>ETA</span><span className="mono">2026-05-02 01:32</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CampDashboard = CampDashboard;
