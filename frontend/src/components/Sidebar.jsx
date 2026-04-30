import { useState } from 'react';
import Icon from './Icon';

export default function Sidebar({ items, activeKey, onSelect }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={'sidebar' + (collapsed ? ' collapsed' : '')}>
      {items.map((sec, si) => (
        <div key={si}>
          {sec.label && <div className="nav-section-label">{sec.label}</div>}
          {sec.items.map((it) => (
            <div
              key={it.key}
              className={'nav-item' + (activeKey === it.key ? ' active' : '')}
              title={it.label}
              onClick={() => onSelect?.(it.key)}
              style={{ cursor: 'pointer' }}
            >
              <Icon name={it.icon} size={14} />
              <span className="label">{it.label}</span>
              {it.badge != null && <span className="badge">{it.badge}</span>}
            </div>
          ))}
        </div>
      ))}
      <div className="collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
        <Icon name={collapsed ? 'chevron' : 'chevronLeft'} size={11} />
        <span className="label">Collapse</span>
      </div>
    </div>
  );
}
