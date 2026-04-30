import { useState, useEffect } from 'react';
import Icon from '../components/Icon';

// Demo credentials — maps role to DB IDs
const CREDENTIALS = {
  admin:     { id: 'admin',     pass: 'admin123',  ccId: 1 },
  camp:      { id: 'camp',      pass: 'camp123',   campId: 1 },
  warehouse: { id: 'warehouse', pass: 'wh123',     wId: 1 },
};

export default function Login({ onNavigate }) {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setEvents(data.slice(0, 3));
    }).catch(() => {});
  }, []);

  const handleLogin = () => {
    const cred = CREDENTIALS[selectedRole];
    if (!cred) return;
    if (password !== cred.pass) {
      setError('Wrong password. Hint: admin123 / camp123 / wh123');
      return;
    }
    sessionStorage.setItem('dras_role', selectedRole);
    sessionStorage.setItem('dras_cc_id', '1');
    sessionStorage.setItem('dras_camp_id', String(cred.campId || 1));
    sessionStorage.setItem('dras_w_id', String(cred.wId || 1));
    onNavigate(selectedRole);
  };

  const levelColor = { Critical: 'var(--status-critical)', High: 'var(--status-critical)', Medium: 'var(--status-pending)', Low: 'var(--status-delivered)' };

  return (
    <div className="dras-app" style={{ display: 'flex', height: '100vh' }}>
      {/* left: form */}
      <div style={{ flex: '0 0 460px', padding: '40px 56px', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56 }}>
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-mark">DR</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>DRAS</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>Disaster Resource Allocation</div>
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, color: 'var(--text-faint)' }}
            onClick={() => onNavigate('landing')}
          >
            ← Home
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 340 }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>Sign in</div>
          <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', margin: 0, marginBottom: 6 }}>Welcome back.</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, marginBottom: 28 }}>
            Use the credentials issued to your control center, camp or warehouse.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label className="field-label">User ID</label>
              <input className="input" value={userId} onChange={e => setUserId(e.target.value)} />
              <span className="field-hint">admin / camp / warehouse</span>
            </div>
            <div className="field">
              <label className="field-label">Password <span className="req">*</span></label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="••••••••" />
            </div>

            <div className="field">
              <label className="field-label">Sign in as</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                {[
                  { k: 'admin', l: 'Control Admin' },
                  { k: 'camp', l: 'Camp Officer' },
                  { k: 'warehouse', l: 'Warehouse Mgr' },
                ].map(r => (
                  <div
                    key={r.k}
                    onClick={() => { setSelectedRole(r.k); setUserId(r.k); }}
                    style={{
                      padding: '8px 6px', textAlign: 'center', fontSize: 11, fontWeight: 500,
                      border: '1px solid ' + (selectedRole === r.k ? 'var(--accent)' : 'var(--border)'),
                      borderRadius: 4,
                      background: selectedRole === r.k ? 'var(--accent-soft)' : 'var(--surface)',
                      color: selectedRole === r.k ? 'var(--accent-text)' : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >{r.l}</div>
                ))}
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 11.5, color: 'var(--status-critical)', background: 'var(--status-critical-bg)', padding: '8px 10px', borderRadius: 4 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '9px 14px', marginTop: 6 }} onClick={handleLogin}>
              Sign in <Icon name="arrow" size={12} />
            </button>

            <div style={{ fontSize: 11, color: 'var(--text-faint)', textAlign: 'center', padding: '4px 0' }}>
              Demo passwords: <span className="mono">admin123</span> · <span className="mono">camp123</span> · <span className="mono">wh123</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)' }}>
          <span>© 2026 DRAS · Sem 4 DBMS Project</span>
          <span>v0.4.1</span>
        </div>
      </div>

      {/* right: live system status */}
      <div style={{ flex: 1, padding: '40px 56px', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>System Status · Live</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--status-delivered)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--status-delivered)' }} />
            All systems operational
          </div>
        </div>

        <div className="card" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Active disaster events</div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 16 }}>Live · Disaster_Event WHERE Status = 'Active'</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Loading events…</div>
              : events.map(e => (
                <div key={e.Event_ID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-faint)' }}>EVT-{String(e.Event_ID).padStart(3, '0')}</span>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{e.Name} · {e.Location}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.camp_count} camps</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: levelColor[e.Level] || 'var(--text-muted)' }}>{e.Level}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card" style={{ padding: 16, background: 'var(--surface-2)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Notice</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            This is a reference build for an academic database project. Data shown is seeded — see <span className="mono" style={{ color: 'var(--text)' }}>08_seed_data.sql</span>. All mutations go through stored procedures.
          </div>
        </div>
      </div>
    </div>
  );
}
