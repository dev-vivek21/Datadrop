import { useState, useCallback } from 'react'
import { applyFilters } from '../../utils/dataUtils'
import p from './Panel.module.css'
import styles from './FilterPanel.module.css'

const OPERATORS = [
  { value: 'contains',     label: 'contains' },
  { value: 'not_contains', label: 'not contains' },
  { value: 'equals',       label: 'equals' },
  { value: 'not_equals',   label: 'not equals' },
  { value: 'starts_with',  label: 'starts with' },
  { value: 'ends_with',    label: 'ends with' },
  { value: 'gt',           label: '>' },
  { value: 'gte',          label: '>=' },
  { value: 'lt',           label: '<' },
  { value: 'lte',          label: '<=' },
  { value: 'is_empty',     label: 'is empty' },
  { value: 'not_empty',    label: 'not empty' },
]

const NO_VALUE_OPS = ['is_empty', 'not_empty']

let nextId = 1

export default function FilterPanel({ parsedData, filters, onFiltersChange }) {
  const { headers = [], rows = [] } = parsedData ?? {}
  const [draft, setDraft] = useState({ col: headers[0] ?? '', op: 'contains', value: '' })

  const addFilter = useCallback(() => {
    if (!draft.col) return
    onFiltersChange([...filters, { id: nextId++, ...draft }])
    setDraft((d) => ({ ...d, value: '' }))
  }, [draft, filters, onFiltersChange])

  const removeFilter = useCallback((id) => {
    onFiltersChange(filters.filter((f) => f.id !== id))
  }, [filters, onFiltersChange])

  const clearAll = useCallback(() => onFiltersChange([]), [onFiltersChange])

  const previewRows = applyFilters(rows, filters)
  const removed = rows.length - previewRows.length

  const noValueOp = NO_VALUE_OPS.includes(draft.op)

  return (
    <div className={p.panel}>
      {/* Header */}
      <div className={p.panelHeader}>
        <div>
          <h2 className={p.panelTitle}>
            <span className={p.panelTitleIcon} style={{ background: 'rgba(251,191,36,0.12)', color: '#FBBF24' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            </span>
            Filter Rules
          </h2>
          <p className={p.panelSub}>
            {filters.length
              ? `${filters.length} active filter${filters.length > 1 ? 's' : ''} · ${previewRows.length.toLocaleString()} / ${rows.length.toLocaleString()} rows match`
              : `No filters active · showing all ${rows.length.toLocaleString()} rows`}
          </p>
        </div>
        {filters.length > 0 && (
          <button className={`${p.glassBtn} ${p.glassBtnDanger}`} onClick={clearAll}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            Clear all
          </button>
        )}
      </div>

      {/* Add filter */}
      <div className={`${p.card} ${styles.addCard}`}>
        <p className={styles.addLabel}>Add Filter Rule</p>
        <div className={styles.addRow}>
          {/* Column */}
          <select
            id="filter-col"
            className={p.glassSelect}
            value={draft.col}
            onChange={(e) => setDraft((d) => ({ ...d, col: e.target.value }))}
          >
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>

          {/* Operator */}
          <select
            id="filter-op"
            className={p.glassSelect}
            value={draft.op}
            onChange={(e) => setDraft((d) => ({ ...d, op: e.target.value, value: '' }))}
          >
            {OPERATORS.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
          </select>

          {/* Value */}
          {!noValueOp && (
            <input
              id="filter-value"
              type="text"
              className={p.glassInput}
              placeholder="Value…"
              value={draft.value}
              onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && addFilter()}
              style={{ flex: 1, minWidth: 120 }}
            />
          )}

          <button
            id="btn-add-filter"
            className={`${p.glassBtn} ${p.glassBtnPrimary}`}
            onClick={addFilter}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {filters.length > 0 ? (
        <div className={`${p.card} ${styles.filtersCard}`}>
          <p className={styles.filtersTitle}>Active Filters</p>
          <div className={styles.chips}>
            {filters.map((f) => (
              <div key={f.id} id={`filter-chip-${f.id}`} className={styles.chip}>
                <span className={styles.chipCol}>{f.col}</span>
                <span className={styles.chipOp}>{OPERATORS.find((o) => o.value === f.op)?.label ?? f.op}</span>
                {!NO_VALUE_OPS.includes(f.op) && (
                  <span className={styles.chipVal}>"{f.value}"</span>
                )}
                <button
                  className={styles.chipRemove}
                  onClick={() => removeFilter(f.id)}
                  aria-label={`Remove filter on ${f.col}`}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`${p.card} ${styles.emptyCard}`}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.3">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <p>No filters added yet. Use the form above to add filter rules.</p>
          <p className={styles.emptyHint}>Filters apply to the Overview table and Export.</p>
        </div>
      )}

      {/* Result preview */}
      {filters.length > 0 && (
        <div className={styles.resultBar}>
          <div className={styles.resultFill} style={{ width: `${(previewRows.length / rows.length) * 100}%` }} />
          <span className={styles.resultText}>
            <strong style={{ color: 'var(--accent-cyan)' }}>{previewRows.length.toLocaleString()}</strong> rows pass · <span style={{ color: '#F87171' }}>{removed.toLocaleString()} filtered out</span>
          </span>
        </div>
      )}
    </div>
  )
}
