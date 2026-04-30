import Icon from './Icon';

const roleMap = {
  admin:     { name: 'S. Iyer',  role: 'Control Admin',  initials: 'SI' },
  camp:      { name: 'R. Patel', role: 'Camp Officer',    initials: 'RP' },
  warehouse: { name: 'M. Khan',  role: 'Warehouse Mgr',   initials: 'MK' },
};

export default function TopBar({ role = 'admin', crumbs = [], onLogout }) {
  const u = roleMap[role] || roleMap.admin;
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">DR</div>
        <span>DRAS</span>
      </div>
      {crumbs.length > 0 && (
        <div className="crumb">
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === crumbs.length - 1 ? 'here' : ''}>{c}</span>
            </span>
          ))}
        </div>
      )}
      <div className="spacer" />
      <span className="env-pill">Prod · v0.4.1</span>
      <div className="user-chip" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="avatar">{u.initials}</span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontWeight: 500 }}>{u.name}</span>
          <span className="role-tag">{u.role}</span>
        </span>
      </div>
      {onLogout && (
        <button
          className="btn btn-ghost btn-sm"
          style={{ padding: '5px 7px', color: 'var(--text-faint)' }}
          onClick={onLogout}
          title="Sign out"
        >
          <Icon name="logout" size={14} />
        </button>
      )}
    </div>
  );
}
