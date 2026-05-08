import { useState, useEffect, useCallback } from 'react';
import Icon from '../components/Icon';

// ── SQL syntax highlighter ─────────────────────────────────────────────────
const KW = new Set([
  'SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','OUTER','CROSS',
  'ON','GROUP','ORDER','BY','HAVING','LIMIT','AND','OR','NOT','IN',
  'EXISTS','AS','CASE','WHEN','THEN','ELSE','END','INSERT','INTO',
  'VALUES','UPDATE','SET','DELETE','CALL','SHOW','CREATE','PROCEDURE',
  'FUNCTION','NULL','TRUE','FALSE','DISTINCT','WITH','DESC','ASC',
  'INTERVAL','HOUR','DAY','SEPARATOR','DUPLICATE','KEY','TABLE',
  'TRIGGER','VIEW','INDEX','PRIMARY','FOREIGN','REFERENCES','UNIQUE',
  'COMMIT','ROLLBACK','BEGIN','TRANSACTION','START',
]);
const FN = new Set([
  'COUNT','SUM','AVG','MIN','MAX','ROUND','NULLIF','COALESCE',
  'TIMESTAMPDIFF','DATE_SUB','DATE_ADD','GROUP_CONCAT','CONCAT',
  'FIELD','NOW','GREATEST','IFNULL','IF','SIGNAL','CONCAT_WS',
]);

const TOKEN_RE = /'[^']*'|\b([A-Z_][A-Z_0-9]*)\b|\b(\d+)\b/g;

function tokenizeLine(line) {
  const tokens = [];
  let last = 0;
  let m;
  const re = new RegExp(TOKEN_RE.source, 'g');
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) tokens.push({ t: 'plain', v: line.slice(last, m.index) });
    const raw = m[0];
    let type;
    if (raw.startsWith("'")) type = 'str';
    else if (m[2] !== undefined)  type = 'num';
    else if (KW.has(m[1]))        type = 'kw';
    else if (FN.has(m[1]))        type = 'fn';
    else                          type = 'plain';
    tokens.push({ t: type, v: raw });
    last = m.index + raw.length;
  }
  if (last < line.length) tokens.push({ t: 'plain', v: line.slice(last) });
  return tokens;
}

const C = {
  kw:    '#60a5fa',
  fn:    '#f59e0b',
  str:   '#86efac',
  num:   '#fb923c',
  plain: '#e2e8f0',
  cmt:   '#6b7280',
};

function SQLBlock({ sql }) {
  const lines = sql.split('\n');
  return (
    <pre style={{
      margin: 0,
      padding: '16px 20px',
      background: '#0d1117',
      borderRadius: 6,
      fontSize: 12.5,
      lineHeight: 1.65,
      overflowX: 'auto',
      fontFamily: 'var(--font-mono)',
      color: C.plain,
      border: '1px solid #30363d',
    }}>
      {lines.map((line, i) => {
        const trimmed = line.trimStart();
        if (trimmed.startsWith('--')) {
          return (
            <div key={i}>
              <span style={{ color: C.cmt }}>{line}</span>
            </div>
          );
        }
        const tokens = tokenizeLine(line);
        return (
          <div key={i}>
            {tokens.map((tok, j) => (
              <span key={j} style={{ color: C[tok.t] }}>{tok.v}</span>
            ))}
          </div>
        );
      })}
    </pre>
  );
}

// ── Category metadata ──────────────────────────────────────────────────────
const CAT_META = {
  'Views':                  { icon: 'eye',       color: '#a78bfa' },
  'Core Data':              { icon: 'dashboard', color: '#60a5fa' },
  'Filtered Queries':       { icon: 'filter',    color: '#34d399' },
  'Aggregation & Analytics':{ icon: 'alert',     color: '#f59e0b' },
  'SQL Functions':          { icon: 'package',   color: '#fb923c' },
  'Stored Procedures':      { icon: 'settings',  color: '#f472b6' },
  'Joins & Subqueries':     { icon: 'arrow',     color: '#38bdf8' },
  'Audit & Logs':           { icon: 'log',       color: '#94a3b8' },
};

const TYPE_LABEL = {
  SELECT:    { label: 'SELECT',    bg: '#1e3a5f', fg: '#60a5fa' },
  PROCEDURE: { label: 'PROCEDURE', bg: '#3b1a3a', fg: '#f472b6' },
};

// ── Results table ──────────────────────────────────────────────────────────
function ResultsTable({ columns, rows }) {
  if (columns.length === 0) {
    return (
      <div style={{ padding: '20px 0', color: 'var(--text-faint)', fontSize: 12 }}>
        No rows returned.
      </div>
    );
  }
  return (
    <div style={{ overflowX: 'auto', borderRadius: 6, border: '1px solid var(--border)' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
      }}>
        <thead>
          <tr style={{ background: 'var(--surface-sunken)' }}>
            {columns.map(col => (
              <th key={col} style={{
                padding: '7px 12px',
                textAlign: 'left',
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontSize: 11,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                borderBottom: '1px solid var(--border)',
                position: 'sticky',
                top: 0,
                background: 'var(--surface-sunken)',
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {columns.map(col => {
                const val = row[col];
                const display = val === null ? 'NULL' : String(val);
                const isNull = val === null;
                const isNum  = typeof val === 'number';
                return (
                  <td key={col} style={{
                    padding: '7px 12px',
                    color: isNull ? 'var(--text-faint)' : isNum ? '#fb923c' : 'var(--text)',
                    fontStyle: isNull ? 'italic' : 'normal',
                    whiteSpace: 'pre-wrap',
                    maxWidth: 320,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {display.length > 200 ? display.slice(0, 200) + '…' : display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function QueryConsole({ onNavigate }) {
  const [catalog, setCatalog]     = useState([]);
  const [selectedId, setSelected] = useState(null);
  const [collapsed, setCollapsed] = useState(new Set());
  const [result, setResult]       = useState(null);   // { columns, rows, executionTime, note }
  const [running, setRunning]     = useState(false);
  const [runError, setRunError]   = useState('');

  useEffect(() => {
    fetch('/api/query-console/catalog')
      .then(r => r.json())
      .then(setCatalog)
      .catch(() => {});
  }, []);

  // Group by category in order
  const categories = [];
  const seen = new Set();
  for (const q of catalog) {
    if (!seen.has(q.category)) {
      seen.add(q.category);
      categories.push(q.category);
    }
  }

  const selected = catalog.find(q => q.id === selectedId) || null;

  const toggleCategory = (cat) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const runQuery = useCallback(async (id) => {
    setRunning(true);
    setRunError('');
    setResult(null);
    try {
      const r = await fetch(`/api/query-console/run/${id}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Unknown error');
      setResult(data);
    } catch (err) {
      setRunError(err.message);
    } finally {
      setRunning(false);
    }
  }, []);

  const selectQuery = (id) => {
    setSelected(id);
    setResult(null);
    setRunError('');
  };

  // Count per category
  const catCount = {};
  for (const q of catalog) catCount[q.category] = (catCount[q.category] || 0) + 1;

  return (
    <div className="dras-app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 48,
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-mark" style={{ fontSize: 11 }}>DR</div>
          <span style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>DRAS</span>
          <span style={{ color: 'var(--border-strong)', fontSize: 18, lineHeight: 1 }}>/</span>
          <span style={{ fontWeight: 500, fontSize: 13 }}>Query Console</span>
          <span style={{
            background: '#1e3a5f',
            color: '#60a5fa',
            borderRadius: 4,
            padding: '2px 7px',
            fontSize: 10.5,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.04em',
          }}>
            {catalog.length} queries · 8 categories
          </span>
        </div>
        <button
          className="btn"
          onClick={() => onNavigate('landing')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
        >
          <Icon name="chevronLeft" size={12} /> Back to home
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left sidebar ── */}
        <div style={{
          width: 272,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '10px 12px 6px',
            fontSize: 10.5,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}>
            Query Library
          </div>

          {categories.map(cat => {
            const meta = CAT_META[cat] || { icon: 'file', color: '#94a3b8' };
            const isCollapsed = collapsed.has(cat);
            const items = catalog.filter(q => q.category === cat);
            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    textAlign: 'left',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <Icon name={meta.icon} size={13} stroke={1.5} />
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 12 }}>{cat}</span>
                  <span style={{
                    fontSize: 10,
                    color: 'var(--text-faint)',
                    background: 'var(--surface-sunken)',
                    borderRadius: 10,
                    padding: '1px 6px',
                  }}>
                    {catCount[cat]}
                  </span>
                  <Icon name="chevronDown" size={11}
                    style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s' }} />
                </button>

                {/* Query items */}
                {!isCollapsed && items.map(q => {
                  const isActive = q.id === selectedId;
                  return (
                    <button
                      key={q.id}
                      onClick={() => selectQuery(q.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '7px 12px 7px 28px',
                        background: isActive ? 'var(--accent-soft)' : 'none',
                        border: 'none',
                        borderLeft: isActive ? `2px solid ${meta.color}` : '2px solid transparent',
                        cursor: 'pointer',
                        color: isActive ? 'var(--text)' : 'var(--text-muted)',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: isActive ? 600 : 400, lineHeight: 1.35 }}>
                          {q.title}
                        </div>
                        <div style={{
                          marginTop: 2,
                          fontSize: 10,
                          color: q.type === 'PROCEDURE' ? '#f472b6' : meta.color,
                          fontFamily: 'var(--font-mono)',
                          letterSpacing: '0.04em',
                        }}>
                          {q.type}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* ── Main content ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--bg)' }}>

          {/* Empty state */}
          {!selected && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: 'var(--text-faint)',
              paddingBottom: 48,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Icon name="search" size={20} stroke={1.2} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Select a query to get started
                </div>
                <div style={{ fontSize: 12 }}>
                  {catalog.length} queries across 8 categories — all live queries from the DRAS backend.
                </div>
              </div>
              {/* Category overview cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginTop: 24,
                width: '100%',
                maxWidth: 800,
              }}>
                {categories.map(cat => {
                  const meta = CAT_META[cat] || { icon: 'file', color: '#94a3b8' };
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const first = catalog.find(q => q.category === cat);
                        if (first) selectQuery(first.id);
                      }}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '14px 16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ color: meta.color }}>
                        <Icon name={meta.icon} size={16} />
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>{cat}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-faint)' }}>
                        {catCount[cat]} {catCount[cat] === 1 ? 'query' : 'queries'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected query */}
          {selected && (() => {
            const meta = CAT_META[selected.category] || { icon: 'file', color: '#94a3b8' };
            const typeStyle = TYPE_LABEL[selected.type] || TYPE_LABEL.SELECT;
            const isProcedure = selected.type === 'PROCEDURE';
            const catItems = catalog.filter(q => q.category === selected.category);
            const idx = catItems.findIndex(q => q.id === selected.id);

            return (
              <div style={{ maxWidth: 960, margin: '0 auto' }}>

                {/* Breadcrumb */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
                  <span style={{ color: meta.color, display: 'flex', alignItems: 'center' }}>
                    <Icon name={meta.icon} size={13} />
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{selected.category}</span>
                  <Icon name="chevron" size={11} stroke={1.5} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{idx + 1} of {catItems.length}</span>
                </div>

                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', flex: 1 }}>
                    {selected.title}
                  </h2>
                  <span style={{
                    background: typeStyle.bg,
                    color: typeStyle.fg,
                    borderRadius: 4,
                    padding: '3px 10px',
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                    marginTop: 4,
                  }}>
                    {typeStyle.label}
                  </span>
                </div>

                {/* Description */}
                <p style={{
                  margin: '0 0 20px',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  maxWidth: 720,
                }}>
                  {selected.description}
                </p>

                {/* SQL block */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--text-faint)',
                    }}>
                      SQL
                    </span>
                    {!isProcedure && (
                      <button
                        className="btn btn-primary"
                        onClick={() => runQuery(selected.id)}
                        disabled={running}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                      >
                        {running ? (
                          <>Running…</>
                        ) : (
                          <><Icon name="arrow" size={12} /> Run Query</>
                        )}
                      </button>
                    )}
                    {isProcedure && (
                      <span style={{
                        fontSize: 11,
                        color: '#f472b6',
                        background: '#3b1a3a',
                        borderRadius: 4,
                        padding: '3px 10px',
                      }}>
                        Definition only — modifies data
                      </span>
                    )}
                  </div>
                  <SQLBlock sql={selected.sql} />
                </div>

                {/* Procedure note */}
                {isProcedure && (
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderLeft: '3px solid #f472b6',
                    borderRadius: 6,
                    padding: '14px 16px',
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                  }}>
                    <strong style={{ color: 'var(--text)' }}>Why this can't be run here:</strong>{' '}
                    Stored procedures perform DML (INSERT / UPDATE) inside ACID transactions
                    and fire triggers that write to the Audit_Log. Executing them through a
                    read-only console would mutate live data. Use the main dashboards (Admin →
                    approve a request, Warehouse → dispatch / restock) to invoke these procedures
                    in their proper workflow context.
                  </div>
                )}

                {/* Run error */}
                {runError && (
                  <div style={{
                    background: 'var(--status-critical-bg)',
                    color: 'var(--status-critical)',
                    border: '1px solid var(--status-critical)',
                    borderRadius: 6,
                    padding: '10px 14px',
                    fontSize: 12.5,
                    marginBottom: 16,
                  }}>
                    <strong>Error:</strong> {runError}
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div>
                    {/* Stats bar */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      marginBottom: 10,
                    }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--text-faint)',
                      }}>
                        Results
                      </span>
                      <span style={{
                        background: 'var(--status-delivered-bg)',
                        color: 'var(--status-delivered)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {result.rows.length} row{result.rows.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{
                        background: 'var(--surface-sunken)',
                        color: 'var(--text-faint)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {result.executionTime} ms
                      </span>
                      {result.columns.length > 0 && (
                        <span style={{
                          background: 'var(--surface-sunken)',
                          color: 'var(--text-faint)',
                          borderRadius: 4,
                          padding: '2px 8px',
                          fontSize: 11,
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {result.columns.length} column{result.columns.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {result.note ? (
                      <div style={{ color: 'var(--text-faint)', fontSize: 12 }}>{result.note}</div>
                    ) : (
                      <ResultsTable columns={result.columns} rows={result.rows} />
                    )}
                  </div>
                )}

                {/* Prev / Next nav */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 32,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)',
                }}>
                  {idx > 0 ? (
                    <button
                      className="btn"
                      onClick={() => selectQuery(catItems[idx - 1].id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      <Icon name="chevronLeft" size={12} />
                      {catItems[idx - 1].title}
                    </button>
                  ) : <div />}

                  {idx < catItems.length - 1 && (
                    <button
                      className="btn"
                      onClick={() => selectQuery(catItems[idx + 1].id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
                    >
                      {catItems[idx + 1].title}
                      <Icon name="chevron" size={12} />
                    </button>
                  )}
                </div>

              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
