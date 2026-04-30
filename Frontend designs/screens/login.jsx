// login.jsx — login page

const LoginPage = () => (
  <div className="dras-app" style={{display: "flex", height: "100%"}}>
    {/* left: form */}
    <div style={{flex: "0 0 460px", padding: "40px 56px", display: "flex", flexDirection: "column", background: "var(--surface)"}}>
      <div className="brand" style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 56}}>
        <div className="brand-mark">DR</div>
        <div>
          <div style={{fontWeight: 600, fontSize: 13}}>DRAS</div>
          <div style={{fontSize: 10.5, color: "var(--text-faint)"}}>Disaster Resource Allocation</div>
        </div>
      </div>

      <div style={{flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 340}}>
        <div className="mono" style={{fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12}}>Sign in</div>
        <h1 style={{fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, marginBottom: 6}}>Welcome back.</h1>
        <p style={{fontSize: 13, color: "var(--text-muted)", margin: 0, marginBottom: 28}}>
          Use the credentials issued to your control center, camp or warehouse.
        </p>

        <div style={{display: "flex", flexDirection: "column", gap: 14}}>
          <div className="field">
            <label className="field-label">User ID <span className="req">*</span></label>
            <input className="input" defaultValue="r.patel@drr.gov" />
            <span className="field-hint">Email or 6-digit operator ID</span>
          </div>
          <div className="field">
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline"}}>
              <label className="field-label">Password <span className="req">*</span></label>
              <span style={{fontSize: 11, color: "var(--accent-text)"}}>Forgot?</span>
            </div>
            <input className="input" type="password" defaultValue="••••••••••••" />
          </div>

          <div className="field">
            <label className="field-label">Sign in as</label>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6}}>
              {[
                {k: "admin", l: "Control Admin"},
                {k: "camp", l: "Camp Officer", active: true},
                {k: "warehouse", l: "Warehouse Mgr"},
              ].map(r => (
                <div key={r.k} style={{
                  padding: "8px 6px",
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: 500,
                  border: "1px solid " + (r.active ? "var(--accent)" : "var(--border)"),
                  borderRadius: 4,
                  background: r.active ? "var(--accent-soft)" : "var(--surface)",
                  color: r.active ? "var(--accent-text)" : "var(--text-muted)",
                  cursor: "pointer",
                }}>{r.l}</div>
              ))}
            </div>
          </div>

          <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)", marginTop: 4}}>
            <span style={{
              width: 14, height: 14, border: "1px solid var(--border-strong)", borderRadius: 3,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "var(--accent)", color: "white",
            }}><Icon name="check" size={10} stroke={2.5}/></span>
            Trust this device for 30 days
          </div>

          <button className="btn btn-primary" style={{justifyContent: "center", padding: "9px 14px", marginTop: 6}}>
            Sign in <Icon name="arrow" size={12}/>
          </button>

          <div style={{display: "flex", alignItems: "center", gap: 12, margin: "8px 0 4px"}}>
            <div style={{flex: 1, height: 1, background: "var(--border)"}}/>
            <span style={{fontSize: 10.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.08em"}}>or</span>
            <div style={{flex: 1, height: 1, background: "var(--border)"}}/>
          </div>

          <button className="btn" style={{justifyContent: "center", padding: "8px 12px"}}>
            Continue with NIC SSO
          </button>
        </div>
      </div>

      <div style={{fontSize: 11, color: "var(--text-faint)", display: "flex", justifyContent: "space-between"}}>
        <span>© 2026 DRAS · Sem 4 DBMS Project</span>
        <span>v0.4.1</span>
      </div>
    </div>

    {/* right: status panel — operational/government feel */}
    <div style={{flex: 1, padding: "40px 56px", background: "var(--bg)", display: "flex", flexDirection: "column"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32}}>
        <div className="mono" style={{fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em", textTransform: "uppercase"}}>System Status · Live</div>
        <div style={{display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--status-delivered)"}}>
          <span style={{width: 6, height: 6, borderRadius: 3, background: "var(--status-delivered)"}}/>
          All systems operational
        </div>
      </div>

      <div className="card" style={{padding: 24, marginBottom: 16}}>
        <div style={{fontSize: 13, fontWeight: 600, marginBottom: 4}}>Active disaster events</div>
        <div style={{fontSize: 11, color: "var(--text-faint)", marginBottom: 16}}>Pulled from Disaster_Event WHERE Status = 'Active'</div>
        <div style={{display: "flex", flexDirection: "column", gap: 10}}>
          {[
            {id: "EVT-014", name: "Cyclone Megha · Andhra coastal", level: "high", camps: 12},
            {id: "EVT-013", name: "Floods · Assam Brahmaputra basin", level: "high", camps: 8},
            {id: "EVT-011", name: "Landslide · Idukki district", level: "medium", camps: 3},
          ].map(e => (
            <div key={e.id} style={{display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 4}}>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <span className="mono" style={{fontSize: 10, color: "var(--text-faint)"}}>{e.id}</span>
                <span style={{fontSize: 12, fontWeight: 500}}>{e.name}</span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 12}}>
                <span style={{fontSize: 11, color: "var(--text-muted)"}}>{e.camps} camps</span>
                <span className={"priority " + e.level}>
                  <span className="bar"/><span className="bar" style={{opacity: e.level === "low" ? 0.25 : 1}}/><span className="bar" style={{opacity: e.level === "high" ? 1 : 0.25}}/>
                  {e.level.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16}}>
        {[
          {l: "Pending requests", v: "47", d: "8 high priority"},
          {l: "Dispatched today", v: "23", d: "avg ETA 38h"},
          {l: "Stock alerts", v: "6", d: "2 unresolved", warn: true},
          {l: "Active warehouses", v: "4 / 4", d: "all reachable"},
        ].map((s, i) => (
          <div key={i} className="card" style={{padding: 14}}>
            <div className="stat-label">{s.l}</div>
            <div className="stat-value">{s.v}</div>
            <div className="stat-delta" style={s.warn ? {color: "var(--status-pending)"} : {}}>{s.d}</div>
          </div>
        ))}
      </div>

      <div style={{flex: 1}}/>

      <div className="card" style={{padding: 16, background: "var(--surface-2)"}}>
        <div style={{fontSize: 11, color: "var(--text-faint)", marginBottom: 6, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em"}}>Notice</div>
        <div style={{fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5}}>
          This is a reference build for an academic database project. Data shown is seeded — see <span className="mono" style={{color: "var(--text)"}}>08_seed_data.sql</span>. Production deployments require NIC SSO + on-prem MySQL 8.
        </div>
      </div>
    </div>
  </div>
);

window.LoginPage = LoginPage;
