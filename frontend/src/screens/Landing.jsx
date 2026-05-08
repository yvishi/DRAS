import Icon from '../components/Icon';

export default function Landing({ onNavigate }) {
  return (
    <div className="dras-app" style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: '100vh' }}>
      {/* top bar */}
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div className="brand">
          <div className="brand-mark">DR</div>
          <span>DRAS</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', marginLeft: 4, fontWeight: 400 }}>
            · Disaster Resource Allocation System
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="btn" onClick={() => onNavigate('queryconsole')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Icon name="search" size={12} /> Query Console
          </button>
          <button className="btn btn-primary" onClick={() => onNavigate('login')}>
            Sign in
          </button>
        </div>
      </div>

      {/* hero */}
      <div style={{ padding: '56px 64px 48px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              B.Tech CS · Sem 4 · DBMS Mini-project · 2026
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0, marginBottom: 18 }}>
              A coordinated supply chain<br />for disaster relief.
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 520, lineHeight: 1.55, margin: 0, marginBottom: 24 }}>
              DRAS connects control centers, relief camps and warehouses through a
              single requesting, approval and dispatch pipeline — built on MySQL 8
              with full ACID guarantees, role-based access, and a stored-procedure-only
              mutation surface.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={() => onNavigate('login')}>
                Open dashboard <Icon name="arrow" size={12} />
              </button>
              <button className="btn" onClick={() => onNavigate('queryconsole')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="search" size={12} /> Query Console
              </button>
            </div>
            <div style={{ display: 'flex', gap: 32, marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              {[['13', 'tables, fully BCNF'], ['4', 'stored procedures'], ['6', 'operational views'], ['3', 'role-based users']].map(([n, l]) => (
                <div key={n}>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>{n}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* flow diagram */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--surface-2)' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>system.flow</span>
              <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>req → approve → dispatch → deliver</span>
            </div>
            <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { from: 'Relief Camp', to: 'Control Admin', action: 'raises Request', side: 'left' },
                { from: 'Control Admin', to: '—', action: 'sp_Approve_Request → locks stock', side: 'right' },
                { from: 'Warehouse Mgr', to: 'Camp', action: 'sp_Dispatch_Request', side: 'left' },
                { from: 'Camp Officer', to: '—', action: 'sp_Confirm_Delivery', side: 'right' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: s.side === 'left' ? 'flex-start' : 'flex-end' }}>
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', fontSize: 11, fontWeight: 500, display: 'flex', flexDirection: 'column', minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: '0.04em' }}>STEP {String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <span>{s.from}</span>
                      <Icon name="arrow" size={10} />
                      <span style={{ color: 'var(--text-muted)' }}>{s.to}</span>
                    </div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--accent-text)', marginTop: 4 }}>{s.action}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* features */}
      <div style={{ padding: '48px 64px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {[
          { n: '01', t: 'ACID-safe approvals', b: 'sp_Approve_Request locks every Warehouse_Inventory row with FOR UPDATE before deciding. Two simultaneous approvals on the same stock can never both succeed.' },
          { n: '02', t: 'Procedure-only mutations', b: 'camp_officer and warehouse_mgr cannot directly UPDATE Warehouse_Inventory or Request.Status. Every state change routes through a procedure so triggers and audit always fire.' },
          { n: '03', t: 'Auto-fired stock alerts', b: 'trg_after_inventory_update writes a Stock_Alert row the instant Warehouse_Inventory.Quantity crosses Min_Threshold downward. No polling, no missed dips.' },
        ].map((f) => (
          <div key={f.n} className="card" style={{ padding: 20 }}>
            <div className="mono" style={{ fontSize: 11, color: 'var(--accent-text)', letterSpacing: '0.06em' }}>{f.n}</div>
            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginTop: 8, marginBottom: 6 }}>{f.t}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.55 }}>{f.b}</div>
          </div>
        ))}
      </div>

      {/* roles */}
      <div style={{ padding: '0 64px 48px' }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>Three roles, one pipeline</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: 'var(--surface)' }}>
          {[
            { role: 'Control Admin', scope: 'ALL on DRAS.*', does: ['Approve / reject requests', 'Manage events & camps', 'Audit log review'] },
            { role: 'Camp Officer', scope: 'INSERT Request, EXEC sp_Confirm_Delivery', does: ['Raise requests for camps', 'Track lifecycle', 'Confirm deliveries'] },
            { role: 'Warehouse Mgr', scope: 'EXEC sp_Dispatch_Request, sp_Restock', does: ['Manage inventory', 'Dispatch approved requests', 'Resolve stock alerts'] },
          ].map((r, i) => (
            <div key={i} style={{ padding: 20, borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{r.role}</div>
              <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 4, marginBottom: 12 }}>{r.scope}</div>
              {r.does.map((d, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>
                  <span style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--accent)' }} />
                  {d}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{ padding: '20px 64px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)' }}>
        <span>DRAS · Reference Frontend · Spring 2026</span>
        <span className="mono">MySQL 8.0+ · 13 tables · 4 procedures · 6 views</span>
      </div>
    </div>
  );
}
