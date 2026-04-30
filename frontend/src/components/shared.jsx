// Shared UI primitives used across all dashboards

export function StatusBadge({ s }) {
  const map = {
    Pending: 'pending',
    Approved: 'approved',
    Dispatched: 'dispatched',
    Partially_Dispatched: 'dispatched',
    In_Transit: 'dispatched',
    Delivered: 'delivered',
    Cancelled: 'cancelled',
    Packed: 'approved',
    Delayed: 'pending',
  };
  return (
    <span className={'badge ' + (map[s] || '')}>
      <span className="dot" />
      {s?.replace('_', ' ')}
    </span>
  );
}

export function PriorityCell({ p }) {
  const k = (p || '').toLowerCase();
  const display = k === 'urgent' ? 'high' : k;
  return (
    <span className={'priority ' + display}>
      <span className="bar" />
      <span className="bar" style={{ opacity: k === 'low' ? 0.25 : 1 }} />
      <span className="bar" style={{ opacity: k === 'high' || k === 'urgent' ? 1 : 0.25 }} />
      {p}
    </span>
  );
}

export function Spinner() {
  return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-faint)', fontSize: 12 }}>
      Loading…
    </div>
  );
}

export function ErrorMsg({ msg }) {
  return (
    <div style={{
      padding: '10px 14px', margin: 12,
      background: 'var(--status-critical-bg)',
      color: 'var(--status-critical)',
      borderRadius: 4, fontSize: 12,
    }}>
      {msg}
    </div>
  );
}

export function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function fmtDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}
