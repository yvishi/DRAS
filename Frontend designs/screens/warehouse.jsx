// warehouse.jsx — Warehouse Manager dashboard

const WarehouseDashboard = () => {
  const nav = [
    {label: "Warehouse", items: [
      {icon: "dashboard", label: "Overview"},
      {icon: "package", label: "Inventory", active: true, badge: 10},
      {icon: "alert", label: "Alerts", badge: 3},
    ]},
    {label: "Operations", items: [
      {icon: "inbox", label: "Approved queue", badge: 6},
      {icon: "truck", label: "Dispatches"},
      {icon: "plus", label: "Restock"},
    ]},
    {label: "Reference", items: [
      {icon: "log", label: "Restock log"},
      {icon: "file", label: "Procedures"},
    ]},
  ];

  const inventory = [
    {res: "Water (20L)", code: "RES-001", q: 1840, t: 800, status: "ok"},
    {res: "Tarpaulin", code: "RES-002", q: 24, t: 50, status: "crit"},
    {res: "Shelter Kit", code: "RES-003", q: 142, t: 100, status: "ok"},
    {res: "Medical Kit", code: "RES-004", q: 8, t: 25, status: "crit"},
    {res: "Blankets", code: "RES-005", q: 380, t: 200, status: "ok"},
    {res: "Rice (50kg)", code: "RES-006", q: 95, t: 80, status: "warn"},
    {res: "Dal (10kg)", code: "RES-007", q: 220, t: 150, status: "ok"},
    {res: "Cooking Oil (5L)", code: "RES-008", q: 64, t: 40, status: "ok"},
    {res: "Torch", code: "RES-009", q: 180, t: 100, status: "ok"},
    {res: "Batteries (AA)", code: "RES-010", q: 28, t: 60, status: "warn"},
  ];

  const approvedQueue = [
    {id: "REQ-1040", camp: "Camp Vizag-2", items: "Rice (500kg) · Dal (150kg)", priority: "Medium", appr: "1h ago"},
    {id: "REQ-1042", camp: "Camp Vizag-7", items: "Water (200) · Tarpaulin (40)", priority: "High", appr: "just now", flag: "low-stock"},
  ];

  return (
    <div className="dras-app" style={{display: "flex", flexDirection: "column"}}>
      <TopBar role="warehouse" crumbs={["WH-Vizag", "Inventory"]} />
      <div className="shell">
        <Sidebar items={nav} collapsed={false} onToggle={()=>{}} />
        <div className="main">
          <div className="page-header">
            <div>
              <h1 className="page-title">WH-Vizag · Inventory & dispatch</h1>
              <div className="page-subtitle">
                Capacity <span className="mono" style={{color: "var(--text)"}}>12,000 units</span> · Util. 67% · 4 dispatches in transit
              </div>
            </div>
            <div className="page-actions">
              <button className="btn"><Icon name="download" size={12}/>Export inventory</button>
              <button className="btn btn-primary"><Icon name="plus" size={12}/>Restock</button>
            </div>
          </div>

          <div className="stat-grid">
            <div className="stat"><div className="stat-label">SKUs</div><div className="stat-value">10</div><div className="stat-delta">3 below threshold</div></div>
            <div className="stat"><div className="stat-label">Approved queue</div><div className="stat-value">6</div><div className="stat-delta">awaiting dispatch</div></div>
            <div className="stat"><div className="stat-label">In transit</div><div className="stat-value">4</div><div className="stat-delta">avg ETA 38h</div></div>
            <div className="stat"><div className="stat-label">Open alerts</div><div className="stat-value" style={{color: "var(--status-critical)"}}>3</div><div className="stat-delta down">2 critical</div></div>
          </div>

          <div style={{display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16}}>
            <div className="card card-pad-tight">
              <div className="card-header">
                <div>
                  <div className="card-title">Live inventory</div>
                  <div className="card-subtitle"><span className="mono" style={{color: "var(--text-muted)"}}>Warehouse_Inventory</span> · vs <span className="mono" style={{color: "var(--text-muted)"}}>Min_Threshold</span></div>
                </div>
                <div style={{display: "flex", gap: 4}}>
                  <button className="btn btn-ghost btn-sm">All</button>
                  <button className="btn btn-sm" style={{borderColor: "var(--status-critical)", color: "var(--status-critical)"}}>Below threshold (3)</button>
                </div>
              </div>
              <table className="tbl">
                <thead><tr>
                  <th>Resource</th><th style={{textAlign: "right"}}>Qty</th>
                  <th>vs threshold</th><th></th><th></th>
                </tr></thead>
                <tbody>
                  {inventory.map(r => {
                    const pct = Math.min(150, (r.q / r.t) * 100);
                    return (
                      <tr key={r.code}>
                        <td>
                          <div style={{fontSize: 12, fontWeight: 500}}>{r.res}</div>
                          <div className="id">{r.code}</div>
                        </td>
                        <td className="num"><span style={{fontSize: 13, fontWeight: 500}}>{r.q.toLocaleString()}</span></td>
                        <td style={{minWidth: 180}}>
                          <div className="bar-track">
                            <div className={"bar-fill " + r.status} style={{width: Math.min(100, pct/1.5) + "%"}}/>
                            <div className="bar-marker" style={{left: (100/1.5) + "%"}}/>
                          </div>
                          <div className="mono" style={{fontSize: 10, color: "var(--text-faint)", marginTop: 3}}>min {r.t}</div>
                        </td>
                        <td>
                          {r.status === "crit" && <span className="badge critical"><span className="dot"/>Below min</span>}
                          {r.status === "warn" && <span className="badge pending"><span className="dot"/>Near min</span>}
                          {r.status === "ok" && <span className="badge delivered"><span className="dot"/>Healthy</span>}
                        </td>
                        <td style={{textAlign: "right"}}>
                          <button className="btn btn-ghost btn-sm">Restock</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{display: "flex", flexDirection: "column", gap: 16}}>
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Approved → ready to dispatch</div>
                    <div className="card-subtitle">Calls <span className="mono" style={{color: "var(--text)"}}>sp_Dispatch_Request</span></div>
                  </div>
                </div>
                <div style={{padding: 0}}>
                  {approvedQueue.map((r, i) => (
                    <div key={r.id} style={{padding: "12px 14px", borderBottom: i < approvedQueue.length - 1 ? "1px solid var(--border)" : "none"}}>
                      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                        <div style={{display: "flex", gap: 10, alignItems: "center"}}>
                          <span className="id">{r.id}</span>
                          <PriorityCell p={r.priority}/>
                        </div>
                        <span style={{fontSize: 10.5, color: "var(--text-faint)"}}>{r.appr}</span>
                      </div>
                      <div style={{fontSize: 12, fontWeight: 500, marginTop: 4}}>{r.camp}</div>
                      <div style={{fontSize: 11.5, color: "var(--text-muted)", marginTop: 2}}>{r.items}</div>
                      {r.flag && (
                        <div style={{marginTop: 6, padding: "5px 8px", background: "var(--status-critical-bg)", color: "var(--status-critical)", fontSize: 11, borderRadius: 3, display: "flex", alignItems: "center", gap: 6}}>
                          <Icon name="alert" size={11}/> Tarpaulin will fall below threshold after dispatch
                        </div>
                      )}
                      <div style={{display: "flex", justifyContent: "flex-end", gap: 6, marginTop: 8}}>
                        <button className="btn btn-sm">Hold</button>
                        <button className="btn btn-accent btn-sm"><Icon name="truck" size={11}/>Dispatch</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-title">Restock log · 7d</div>
                  <span className="mono" style={{fontSize: 10.5, color: "var(--text-faint)"}}>Restock_Log</span>
                </div>
                <div style={{padding: "8px 14px"}}>
                  {[
                    {res: "Water", q: 600, when: "2026-04-29 10:14"},
                    {res: "Medical Kit", q: 50, when: "2026-04-28 16:02"},
                    {res: "Tarpaulin", q: 100, when: "2026-04-26 09:45"},
                  ].map((r, i) => (
                    <div key={i} style={{display: "grid", gridTemplateColumns: "1fr auto auto", gap: 10, padding: "6px 0", fontSize: 12, alignItems: "center", borderBottom: i < 2 ? "1px solid var(--border)" : "none"}}>
                      <span>+ {r.res}</span>
                      <span className="mono" style={{color: "var(--accent-text)"}}>+{r.q}</span>
                      <span className="mono" style={{fontSize: 10.5, color: "var(--text-faint)"}}>{r.when}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.WarehouseDashboard = WarehouseDashboard;
