// chrome.jsx — shared icons, topbar, sidebar

const Icon = ({ name, size = 14, stroke = 1.5 }) => {
  const paths = {
    dashboard: <><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/></>,
    inbox: <><path d="M2 9l2-6h8l2 6"/><path d="M2 9v4h12V9"/><path d="M5 9h6"/></>,
    package: <><path d="M2 5l6-3 6 3v6l-6 3-6-3z"/><path d="M2 5l6 3 6-3"/><path d="M8 8v6"/></>,
    truck: <><rect x="1" y="5" width="9" height="6"/><path d="M10 7h3l2 2v2h-5"/><circle cx="4" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/></>,
    alert: <><path d="M8 2l6 11H2z"/><path d="M8 7v3M8 11.5v.5"/></>,
    map: <><path d="M2 4l4-1 4 1 4-1v10l-4 1-4-1-4 1z"/><path d="M6 3v10M10 4v10"/></>,
    settings: <><circle cx="8" cy="8" r="2"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3"/></>,
    chevron: <path d="M5 3l4 5-4 5"/>,
    chevronDown: <path d="M3 5l5 4 5-4"/>,
    chevronLeft: <path d="M10 3l-4 5 4 5"/>,
    plus: <path d="M8 3v10M3 8h10"/>,
    search: <><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></>,
    user: <><circle cx="8" cy="6" r="2.5"/><path d="M3 14c1-3 3-4 5-4s4 1 5 4"/></>,
    bell: <><path d="M4 7a4 4 0 018 0v4l1 2H3l1-2z"/><path d="M6.5 13.5a1.5 1.5 0 003 0"/></>,
    download: <><path d="M8 2v8M4 7l4 4 4-4M2 13h12"/></>,
    filter: <path d="M2 3h12l-4.5 5.5V13l-3-1V8.5z"/>,
    check: <path d="M3 8l3 3 7-7"/>,
    x: <path d="M3 3l10 10M13 3L3 13"/>,
    file: <><path d="M3 1h7l3 3v11H3z"/><path d="M10 1v3h3"/></>,
    warehouse: <><path d="M1 6l7-4 7 4v8H1z"/><path d="M5 14V9h6v5"/></>,
    camp: <><path d="M2 13L8 3l6 10z"/><path d="M5.5 13V8h5v5"/></>,
    log: <><path d="M3 2h10v12H3z"/><path d="M5 5h6M5 8h6M5 11h4"/></>,
    arrow: <path d="M3 8h10M9 4l4 4-4 4"/>,
    ellipsis: <><circle cx="3" cy="8" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="13" cy="8" r="1"/></>,
    eye: <><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/></>,
  };
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
};

const TopBar = ({ role = "admin", crumbs = [], onRoleClick }) => {
  const roleMap = {
    admin: { name: "S. Iyer", role: "Control Admin", initials: "SI" },
    camp: { name: "R. Patel", role: "Camp Officer", initials: "RP" },
    warehouse: { name: "M. Khan", role: "Warehouse Mgr", initials: "MK" },
  };
  const u = roleMap[role];
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">DR</div>
        <span>DRAS</span>
      </div>
      {crumbs.length > 0 && (
        <div className="crumb">
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="sep">/</span>}
              <span className={i === crumbs.length - 1 ? "here" : ""}>{c}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="spacer" />
      <span className="env-pill">Prod · v0.4.1</span>
      <button className="btn btn-ghost btn-sm" style={{padding: "5px 7px"}}><Icon name="bell" size={14}/></button>
      <button className="user-chip" style={{border: "none", background: "transparent", cursor: "pointer"}} onClick={onRoleClick}>
        <span className="avatar">{u.initials}</span>
        <span style={{display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.1}}>
          <span style={{fontWeight: 500}}>{u.name}</span>
          <span className="role-tag">{u.role}</span>
        </span>
      </button>
    </div>
  );
};

const Sidebar = ({ items, collapsed, onToggle, footerLabel }) => (
  <div className={"sidebar" + (collapsed ? " collapsed" : "")}>
    {items.map((sec, si) => (
      <React.Fragment key={si}>
        {sec.label && <div className="nav-section-label">{sec.label}</div>}
        {sec.items.map((it, i) => (
          <div key={i} className={"nav-item" + (it.active ? " active" : "")} title={it.label}>
            <Icon name={it.icon} size={14} />
            <span className="label">{it.label}</span>
            {it.badge != null && <span className="badge">{it.badge}</span>}
          </div>
        ))}
      </React.Fragment>
    ))}
    <div className="collapse-toggle" onClick={onToggle}>
      <Icon name={collapsed ? "chevron" : "chevronLeft"} size={11} />
      <span className="label">{footerLabel || "Collapse"}</span>
    </div>
  </div>
);

Object.assign(window, { Icon, TopBar, Sidebar });
