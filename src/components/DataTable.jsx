import { useMemo, useState } from 'react';
import EditableHtml from './EditableHtml';
import AutoTextarea from './AutoTextarea';

function badgeClass(c) {
  const k = (c || '').replace('+', 'plus').trim();
  return 'badge badge-' + (k || 'D');
}

export default function DataTable({
  tableKey,
  config,
  rows,
  estatico,
  onHeaderChange,
  onCellChange,
  onDeleteRow,
  onAddRow,
}) {
  const [search, setSearch] = useState('');

  const visibleIdx = useMemo(() => {
    const idxs = rows.map((_, i) => i);
    if (!search.trim()) return idxs;
    const q = search.trim().toLowerCase();
    return idxs.filter((i) =>
      config.columns.some((c) => String(rows[i][c.key] ?? '').toLowerCase().includes(q))
    );
  }, [rows, search, config.columns]);

  return (
    <>
      <div className="table-search">
        <input
          type="text"
          placeholder="Buscar en esta tabla…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="count">{search.trim() ? `${visibleIdx.length} / ${rows.length}` : ''}</span>
      </div>
      <div className="table-wrap">
        <table id={`tbl-${tableKey}`}>
          <thead>
            <tr>
              {config.columns.map((c, i) => (
                <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                  <EditableHtml
                    as="span"
                    singleLine
                    className="tab-label"
                    html={estatico[`th-tbl-${tableKey}-${i}`] ?? c.label}
                    onChange={(html) => onHeaderChange(`th-tbl-${tableKey}-${i}`, html)}
                  />
                </th>
              ))}
              <th className="col-actions" />
            </tr>
          </thead>
          <tbody>
            {visibleIdx.map((idx) => {
              const row = rows[idx];
              return (
                <tr key={idx}>
                  {config.columns.map((c) => (
                    <td key={c.key}>
                      {config.badgeCol === c.key ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
                          <span className={badgeClass(row[c.key])}>{row[c.key] || ''}</span>
                          <input
                            className="cell-input"
                            style={{ width: 46 }}
                            value={row[c.key] || ''}
                            onChange={(e) => onCellChange(idx, c.key, e.target.value)}
                          />
                        </div>
                      ) : (
                        <AutoTextarea value={row[c.key]} onChange={(v) => onCellChange(idx, c.key, v)} />
                      )}
                    </td>
                  ))}
                  <td className="col-actions">
                    <button
                      className="tiny danger ghost"
                      title="Eliminar fila"
                      onClick={() => {
                        if (window.confirm('¿Seguro que quieres eliminar esta fila? Se puede recuperar desde el backup, pero no hay deshacer inmediato.')) {
                          onDeleteRow(idx);
                        }
                      }}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="row-tools">
        <button className="tiny" onClick={onAddRow}>
          {config.addLabel}
        </button>
      </div>
    </>
  );
}
