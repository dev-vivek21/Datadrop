import { useState, useMemo, useCallback } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

import {
  TEMPLATES,
  recommendTemplate,
  mapTemplateCharts,
  mapTemplateKPIs,
  getDateColumns,
  toTitleCase,
} from '../../utils/fieldIntelligence'
import { computePivot, buildGroupedChartData, computeKPI } from '../../utils/pivotEngine'
import { getNumericColumns, getCategoryColumns, formatNumber, applyFilters } from '../../utils/dataUtils'

import p from './Panel.module.css'
import styles from './PivotPanel.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────
const PALETTE = [
  '#0066CC', '#7C3AED', '#10B981', '#F59E0B', '#EF4444',
  '#0284C7', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316',
]
const AGGS = [
  { id: 'sum',   label: 'Sum'   },
  { id: 'avg',   label: 'Avg'   },
  { id: 'count', label: 'Count' },
  { id: 'min',   label: 'Min'   },
  { id: 'max',   label: 'Max'   },
]
const DATE_LEVELS = [
  { id: 'year',    label: 'Year'    },
  { id: 'quarter', label: 'Quarter' },
  { id: 'month',   label: 'Month'   },
  { id: 'day',     label: 'Day'     },
]

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((e) => (
        <div key={e.dataKey ?? e.name} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: e.color || e.fill }} />
          <span className={styles.tooltipKey}>{e.dataKey ?? e.name}</span>
          <span className={styles.tooltipVal}>{formatNumber(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PivotPanel({ parsedData }) {
  const { headers = [], rows = [] } = parsedData ?? {}

  // Column classification
  const numCols  = useMemo(() => getNumericColumns(headers, rows),  [headers, rows])
  const catCols  = useMemo(() => getCategoryColumns(headers, rows), [headers, rows])
  const dateCols = useMemo(() => getDateColumns(headers, rows),     [headers, rows])

  // Template recommendation (run once)
  const recommendation = useMemo(() => recommendTemplate(headers, rows), [headers, rows])

  // ── UI State ────────────────────────────────────────────────────────────────
  const [subTab,           setSubTab]           = useState('dashboard')   // 'dashboard' | 'pivot'
  const [selectedTemplate, setSelectedTemplate] = useState(recommendation.template.id)
  const [editMode,         setEditMode]         = useState(false)

  // Dashboard chart type overrides: { chartIndex: 'bar'|'line'|'area'|'pie' }
  const [chartTypes, setChartTypes] = useState({})

  // Cross-filter state: [{ col, value }]
  const [crossFilters, setCrossFilters] = useState([])

  // Pivot Builder state
  const [pivotRowDim,   setPivotRowDim]   = useState(catCols[0]   ?? headers[0] ?? '')
  const [pivotColDim,   setPivotColDim]   = useState('')
  const [pivotValDim,   setPivotValDim]   = useState(numCols[0]   ?? '')
  const [pivotAgg,      setPivotAgg]      = useState('sum')
  const [pivotDateLevel, setPivotDateLevel] = useState('month')

  // ── Derived: active template definition ─────────────────────────────────────
  const template   = useMemo(() => TEMPLATES.find((t) => t.id === selectedTemplate) ?? TEMPLATES[0], [selectedTemplate])
  const fieldMap   = recommendation.fieldMap
  const kpiSlots   = useMemo(() => mapTemplateKPIs(template, fieldMap, numCols),   [template, fieldMap, numCols])
  const chartSlots = useMemo(() => mapTemplateCharts(template, fieldMap, numCols), [template, fieldMap, numCols])

  // ── Cross-filter application ─────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    if (!crossFilters.length) return rows
    return rows.filter((row) =>
      crossFilters.every(({ col, value }) => String(row[col] ?? '') === String(value))
    )
  }, [rows, crossFilters])

  // ── Cross-filter helpers ──────────────────────────────────────────────────────
  const addCrossFilter = useCallback((col, value) => {
    setCrossFilters((prev) => {
      const exists = prev.find((f) => f.col === col && f.value === value)
      if (exists) return prev
      return [...prev, { col, value }]
    })
  }, [])

  const removeCrossFilter = useCallback((col, value) => {
    setCrossFilters((prev) => prev.filter((f) => !(f.col === col && f.value === value)))
  }, [])

  const clearCrossFilters = useCallback(() => setCrossFilters([]), [])

  // ── Pivot computation ─────────────────────────────────────────────────────────
  const pivotResult = useMemo(() => {
    const rowIsDate = dateCols.includes(pivotRowDim)
    const colIsDate = dateCols.includes(pivotColDim)
    return computePivot({
      rows: filteredRows,
      rowDim: pivotRowDim,
      colDim: pivotColDim,
      valDim: pivotValDim,
      agg: pivotAgg,
      dateLevel: pivotDateLevel,
      rowIsDate,
      colIsDate,
    })
  }, [filteredRows, pivotRowDim, pivotColDim, pivotValDim, pivotAgg, pivotDateLevel, dateCols])

  // ── Render helpers ────────────────────────────────────────────────────────────
  const noData = !rows.length

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <div className={p.panel}>

      {/* ── Panel Header ── */}
      <div className={p.panelHeader}>
        <div>
          <h2 className={p.panelTitle}>
            <span className={p.panelTitleIcon} style={{ background: 'rgba(0,102,204,0.1)', color: '#0066CC' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
              </svg>
            </span>
            Pivot & BI
          </h2>
          <p className={p.panelSub}>
            {noData ? 'Upload data to begin' : `${rows.length.toLocaleString()} rows · ${headers.length} columns · ${numCols.length} numeric`}
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className={styles.subTabs}>
          <button
            id="pivot-tab-dashboard"
            className={`${styles.subTab} ${subTab === 'dashboard' ? styles.subTabActive : ''}`}
            onClick={() => setSubTab('dashboard')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            Template Dashboard
          </button>
          <button
            id="pivot-tab-builder"
            className={`${styles.subTab} ${subTab === 'pivot' ? styles.subTabActive : ''}`}
            onClick={() => setSubTab('pivot')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Pivot Builder
          </button>
        </div>
      </div>

      {noData ? (
        <div className={`${p.card} ${styles.emptyState}`}>
          <span className={styles.emptyIcon}>📊</span>
          <p className={styles.emptyTitle}>No data loaded</p>
          <p className={styles.emptyDesc}>Upload a CSV or Excel file to start building BI dashboards and pivot tables.</p>
        </div>
      ) : subTab === 'dashboard' ? (
        <DashboardView
          headers={headers}
          rows={rows}
          filteredRows={filteredRows}
          numCols={numCols}
          catCols={catCols}
          dateCols={dateCols}
          recommendation={recommendation}
          template={template}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          kpiSlots={kpiSlots}
          chartSlots={chartSlots}
          chartTypes={chartTypes}
          setChartTypes={setChartTypes}
          crossFilters={crossFilters}
          addCrossFilter={addCrossFilter}
          removeCrossFilter={removeCrossFilter}
          clearCrossFilters={clearCrossFilters}
          editMode={editMode}
          setEditMode={setEditMode}
          fieldMap={fieldMap}
          p={p}
        />
      ) : (
        <PivotBuilderView
          headers={headers}
          rows={filteredRows}
          numCols={numCols}
          catCols={catCols}
          dateCols={dateCols}
          pivotRowDim={pivotRowDim}  setPivotRowDim={setPivotRowDim}
          pivotColDim={pivotColDim}  setPivotColDim={setPivotColDim}
          pivotValDim={pivotValDim}  setPivotValDim={setPivotValDim}
          pivotAgg={pivotAgg}        setPivotAgg={setPivotAgg}
          pivotDateLevel={pivotDateLevel} setPivotDateLevel={setPivotDateLevel}
          pivotResult={pivotResult}
          p={p}
        />
      )}
    </div>
  )
}

// ─── Dashboard Sub-View ───────────────────────────────────────────────────────
function DashboardView({
  headers, rows, filteredRows, numCols, catCols, dateCols,
  recommendation, template, selectedTemplate, setSelectedTemplate,
  kpiSlots, chartSlots, chartTypes, setChartTypes,
  crossFilters, addCrossFilter, removeCrossFilter, clearCrossFilters,
  editMode, setEditMode, fieldMap, p,
}) {
  const isBlank = template.id === 'blank'

  return (
    <>
      {/* ── Recommendation Card ── */}
      <div className={`${p.card} ${styles.recCard}`}>
        <span className={styles.recIcon}>{recommendation.template.icon}</span>
        <div className={styles.recBody}>
          <p className={styles.recLabel}>✦ AI Recommendation</p>
          <p className={styles.recTitle}>{recommendation.template.label}</p>
          <p className={styles.recReason}>{recommendation.reason}</p>
        </div>
        <div className={styles.recActions}>
          <button
            id="btn-edit-dashboard"
            className={`${p.glassBtn} ${editMode ? p.glassBtnPrimary : ''}`}
            onClick={() => setEditMode((v) => !v)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            {editMode ? 'Done Editing' : 'Edit Dashboard'}
          </button>
        </div>
      </div>

      {/* ── Edit mode banner ── */}
      {editMode && (
        <div className={styles.editBanner}>
          <span className={styles.editBannerIcon}>✏️</span>
          <span className={styles.editBannerText}>
            Edit mode — change chart types using the buttons on each chart card. Select a different template below.
          </span>
        </div>
      )}

      {/* ── Template selector (shown in edit mode) ── */}
      {editMode && (
        <TemplatePicker
          templates={TEMPLATES}
          selected={selectedTemplate}
          recommended={recommendation.template.id}
          onSelect={setSelectedTemplate}
          p={p}
        />
      )}

      {/* ── Cross-filter chips ── */}
      {crossFilters.length > 0 && (
        <div className={`${p.card} ${styles.filtersBar}`}>
          <span className={styles.filtersBarLabel}>Active Filters</span>
          {crossFilters.map(({ col, value }) => (
            <div key={`${col}:${value}`} className={styles.filterChip}>
              <strong>{col}:</strong> {value}
              <button
                className={styles.filterChipRemove}
                onClick={() => removeCrossFilter(col, value)}
                aria-label={`Remove filter ${col}=${value}`}
              >✕</button>
            </div>
          ))}
          <button className={styles.clearFiltersBtn} onClick={clearCrossFilters}>Clear all</button>
        </div>
      )}

      {/* ── KPI Cards ── */}
      {kpiSlots.length > 0 ? (
        <KpiRow kpiSlots={kpiSlots} rows={filteredRows} styles={styles} p={p} />
      ) : (
        <MissingFieldWarn message="No numeric columns detected for KPI cards." styles={styles} />
      )}

      {/* ── Charts ── */}
      {isBlank ? (
        <BlankDashboardHint p={p} styles={styles} />
      ) : chartSlots.length > 0 ? (
        <div className={styles.chartsGrid}>
          {chartSlots.map((slot, i) => (
            <ChartCard
              key={i}
              index={i}
              slot={slot}
              rows={filteredRows}
              dateCols={dateCols}
              chartTypes={chartTypes}
              setChartTypes={setChartTypes}
              editMode={editMode}
              onBarClick={(dimCol, name) => addCrossFilter(dimCol, name)}
              styles={styles}
              p={p}
            />
          ))}
        </div>
      ) : (
        <MissingFieldWarn message="Not enough mapped fields to generate charts for this template." styles={styles} />
      )}

      {/* ── Pivot Summary Table ── */}
      {!isBlank && (
        <PivotSummaryTable
          template={template}
          fieldMap={fieldMap}
          rows={filteredRows}
          numCols={numCols}
          dateCols={dateCols}
          p={p}
          styles={styles}
        />
      )}

      {/* ── Template picker (shown only when not in edit mode = always visible at bottom) ── */}
      {!editMode && (
        <TemplatePicker
          templates={TEMPLATES}
          selected={selectedTemplate}
          recommended={recommendation.template.id}
          onSelect={setSelectedTemplate}
          p={p}
        />
      )}
    </>
  )
}

// ─── KPI Row ──────────────────────────────────────────────────────────────────
const KPI_COLORS = [
  { color: '#0066CC', bg: 'rgba(0,102,204,0.08)',   icon: '💰' },
  { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  icon: '📈' },
  { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',  icon: '🔢' },
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)',  icon: '📦' },
]

function KpiRow({ kpiSlots, rows, styles, p }) {
  return (
    <div className={styles.kpiRow}>
      {kpiSlots.map((kpi, i) => {
        const c     = KPI_COLORS[i % KPI_COLORS.length]
        const total = computeKPI(rows, kpi.col, 'sum')
        return (
          <div key={kpi.col} id={`bi-kpi-${i}`} className={`${p.card} ${styles.kpiCard}`}>
            <div className={styles.kpiIcon} style={{ background: c.bg }}>
              {c.icon}
            </div>
            <span className={styles.kpiLabel}>{kpi.label}</span>
            <span className={styles.kpiValue} style={{ color: c.color }}>
              {total !== null ? formatNumber(total) : '—'}
            </span>
            <span className={styles.kpiCol}>{kpi.col}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({ index, slot, rows, dateCols, chartTypes, setChartTypes, editMode, onBarClick, styles, p }) {
  const effectiveType = chartTypes[index] ?? slot.type
  const { dimCol, valCol, title } = slot

  const isDate = dateCols.includes(dimCol)

  const data = useMemo(() => {
    if (!dimCol || !valCol) return []
    return buildGroupedChartData({ rows, dimCol, valCol, isDate, dateLevel: 'month', limit: 15 })
  }, [rows, dimCol, valCol, isDate])

  if (!dimCol || !valCol) return null
  if (!data.length) {
    return (
      <div className={`${p.card} ${styles.chartCard}`}>
        <div className={styles.chartCardHeader}><span className={styles.chartCardTitle}>{title}</span></div>
        <div className={`${styles.chartBody} ${styles.emptyState}`} style={{ height: 180 }}>
          <span className={styles.emptyDesc}>No data for this chart</span>
        </div>
      </div>
    )
  }

  const gridProps  = { stroke: 'rgba(0,0,0,0.05)', strokeDasharray: '3 3' }
  const xProps     = {
    dataKey: 'name',
    tick: { fill: '#86868B', fontSize: 10, fontFamily: 'var(--font-sans)' },
    axisLine: { stroke: 'rgba(0,0,0,0.08)' },
    tickLine: false,
    interval: 0,
    angle: data.length > 6 ? -30 : 0,
    textAnchor: data.length > 6 ? 'end' : 'middle',
    height: data.length > 6 ? 48 : 22,
  }
  const yProps     = {
    tick: { fill: '#86868B', fontSize: 10, fontFamily: 'var(--font-sans)' },
    axisLine: false, tickLine: false,
    tickFormatter: formatNumber, width: 55,
  }
  const pieData    = data.map((d, i) => ({ name: d.name, value: d.value, fill: PALETTE[i % PALETTE.length] }))
  const handleClick = (entry) => { if (entry?.name && dimCol) onBarClick(dimCol, entry.name) }

  function renderChart(type) {
    switch (type) {
      case 'line': return (
        <LineChart data={data}>
          <CartesianGrid {...gridProps} />
          <XAxis {...xProps} /><YAxis {...yProps} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="value" stroke={PALETTE[0]} strokeWidth={2.5}
            dot={{ r: 3, fill: PALETTE[0], strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
        </LineChart>
      )
      case 'area': return (
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`ag${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={PALETTE[0]} stopOpacity={0.35} />
              <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis {...xProps} /><YAxis {...yProps} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="value" stroke={PALETTE[0]} fill={`url(#ag${index})`} strokeWidth={2.2} />
        </AreaChart>
      )
      case 'pie': return (
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={44}
            dataKey="value" paddingAngle={3} onClick={(d) => handleClick(d)}>
            {pieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, color: '#86868B', paddingTop: 4 }} />
        </PieChart>
      )
      default: return (
        <BarChart data={data} barCategoryGap="22%" onClick={(s) => s?.activePayload?.[0] && handleClick(s.activePayload[0].payload)}>
          <CartesianGrid {...gridProps} vertical={false} />
          <XAxis {...xProps} /><YAxis {...yProps} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,102,204,0.04)' }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}
            fill={PALETTE[0]} fillOpacity={0.9} cursor="pointer" />
        </BarChart>
      )
    }
  }

  return (
    <div className={`${p.card} ${styles.chartCard}`}>
      <div className={styles.chartCardHeader}>
        <span className={styles.chartCardTitle}>{title}</span>
        {editMode && (
          <div className={styles.chartTypeSelector}>
            {['bar','line','area','pie'].map((t) => (
              <button
                key={t}
                className={`${styles.chartTypeBtn} ${effectiveType === t ? styles.chartTypeBtnActive : ''}`}
                onClick={() => setChartTypes((prev) => ({ ...prev, [index]: t }))}
              >{t}</button>
            ))}
          </div>
        )}
      </div>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(effectiveType)}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Pivot Summary Table (within Dashboard) ───────────────────────────────────
function PivotSummaryTable({ template, fieldMap, rows, numCols, dateCols, p, styles }) {
  const def        = template.pivotDefault
  const rowDimRole = def.rows  ?? null
  const colDimRole = def.cols  ?? null
  const valRole    = def.val   ?? null

  const rowDim = rowDimRole ? (fieldMap[rowDimRole] ?? catColFallback(rowDimRole, rows)) : null
  const colDim = colDimRole ? (fieldMap[colDimRole] ?? null) : null
  const valDim = valRole    ? (fieldMap[valRole]    ?? numCols[0] ?? null) : null

  if (!rowDim || !valDim) {
    return (
      <div className={`${p.card} ${styles.emptyState}`}>
        <span className={styles.emptyIcon}>📋</span>
        <p className={styles.emptyTitle}>Pivot Summary Not Available</p>
        <p className={styles.emptyDesc}>Required fields not found in your dataset for this template.</p>
      </div>
    )
  }

  const rowIsDate = dateCols.includes(rowDim)
  const colIsDate = colDim ? dateCols.includes(colDim) : false

  const { rowKeys, colKeys, cells, totals, colTotals } = useMemo(() =>
    computePivot({ rows, rowDim, colDim: colDim ?? '', valDim, agg: 'sum', dateLevel: 'month', rowIsDate, colIsDate }),
    [rows, rowDim, colDim, valDim, rowIsDate, colIsDate]
  )

  const showCols = colDim ? colKeys.slice(0, 8) : ['__total__']

  return (
    <div className={p.card} style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Pivot Summary — {toTitleCase(valDim)} by {toTitleCase(rowDim)}{colDim ? ` × ${toTitleCase(colDim)}` : ''}
        </span>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Aggregation: Sum</span>
      </div>
      <div className={styles.pivotTableWrap}>
        <table className={styles.pivotTable}>
          <thead>
            <tr>
              <th>{toTitleCase(rowDim)}</th>
              {showCols.map((ck) => (
                <th key={ck} className="colHeader">{ck === '__total__' ? toTitleCase(valDim) : ck}</th>
              ))}
              {colDim && <th className="colHeader">Total</th>}
            </tr>
          </thead>
          <tbody>
            {rowKeys.slice(0, 20).map((rk) => (
              <tr key={rk}>
                <td className={styles.pivotRowKey}>{rk}</td>
                {showCols.map((ck) => {
                  const val = cells[rk]?.[ck]
                  return val !== null && val !== undefined ? (
                    <td key={ck} className={styles.numCell}>{formatNumber(val)}</td>
                  ) : (
                    <td key={ck} className={styles.nullCell}>—</td>
                  )
                })}
                {colDim && (
                  <td className={styles.numCell} style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                    {totals[rk] !== null ? formatNumber(totals[rk]) : '—'}
                  </td>
                )}
              </tr>
            ))}
            {/* Column totals row */}
            {colTotals && (
              <tr className={styles.totalRow}>
                <td style={{ fontWeight: 700 }}>Total</td>
                {showCols.map((ck) => (
                  <td key={ck} className={styles.numCell}>
                    {colTotals[ck] !== null ? formatNumber(colTotals[ck]) : '—'}
                  </td>
                ))}
                {colDim && <td />}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function catColFallback(role, rows) { return null }

// ─── Template Picker ──────────────────────────────────────────────────────────
function TemplatePicker({ templates, selected, recommended, onSelect, p }) {
  return (
    <div>
      <p className={styles.sectionTitle} style={{ marginBottom: 12 }}>Choose a Template</p>
      <div className={styles.templateGrid}>
        {templates.map((t) => (
          <div
            key={t.id}
            id={`template-card-${t.id}`}
            className={`${p.card} ${styles.templateCard} ${selected === t.id ? styles.templateCardActive : ''}`}
            onClick={() => onSelect(t.id)}
          >
            <div className={styles.templateCardTop}>
              <div className={styles.templateIconWrap} style={{ background: t.bg }}>
                {t.icon}
              </div>
              {t.id === recommended && t.id !== 'blank' && (
                <span className={styles.recBadge}>★ Recommended</span>
              )}
            </div>
            <p className={styles.templateName}>{t.label}</p>
            <p className={styles.templateDesc}>{t.description}</p>
            <button
              className={`${styles.templateSelectBtn} ${selected === t.id ? styles.templateSelectBtnActive : ''}`}
              onClick={(e) => { e.stopPropagation(); onSelect(t.id) }}
            >
              {selected === t.id ? '✓ Selected' : 'Use Template'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Pivot Builder Sub-View ───────────────────────────────────────────────────
function PivotBuilderView({
  headers, rows, numCols, catCols, dateCols,
  pivotRowDim, setPivotRowDim,
  pivotColDim, setPivotColDim,
  pivotValDim, setPivotValDim,
  pivotAgg,    setPivotAgg,
  pivotDateLevel, setPivotDateLevel,
  pivotResult, p,
}) {
  const rowIsDate = dateCols.includes(pivotRowDim)
  const colIsDate = dateCols.includes(pivotColDim)

  const { rowKeys, colKeys, cells, totals, colTotals } = pivotResult
  const hasResult = rowKeys.length > 0

  const showCols = pivotColDim ? colKeys.slice(0, 10) : ['__total__']

  return (
    <div className={styles.pivotLayout}>
      {/* ── Left: Field Wells ── */}
      <div className={styles.pivotSidebar}>

        {/* Rows */}
        <div className={`${p.card} ${styles.fieldWell}`}>
          <div className={styles.fieldWellLabel}>
            <span className={styles.fieldWellDot} style={{ background: '#0066CC' }} />
            Rows
          </div>
          <select
            id="pivot-row-dim"
            className={styles.pivotSelect}
            value={pivotRowDim}
            onChange={(e) => setPivotRowDim(e.target.value)}
          >
            <option value="">— Select field —</option>
            {headers.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
          {rowIsDate && (
            <div>
              <div className={styles.fieldWellLabel} style={{ marginTop: 8 }}>Date Hierarchy</div>
              <div className={styles.dateHierarchyRow}>
                {DATE_LEVELS.map((dl) => (
                  <button
                    key={dl.id}
                    className={`${styles.dateHierBtn} ${pivotDateLevel === dl.id ? styles.dateHierBtnActive : ''}`}
                    onClick={() => setPivotDateLevel(dl.id)}
                  >{dl.label}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columns */}
        <div className={`${p.card} ${styles.fieldWell}`}>
          <div className={styles.fieldWellLabel}>
            <span className={styles.fieldWellDot} style={{ background: '#7C3AED' }} />
            Columns (optional)
          </div>
          <select
            id="pivot-col-dim"
            className={styles.pivotSelect}
            value={pivotColDim}
            onChange={(e) => setPivotColDim(e.target.value)}
          >
            <option value="">— None —</option>
            {headers.filter((h) => h !== pivotRowDim).map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {colIsDate && (
            <div className={styles.dateHierarchyRow}>
              {DATE_LEVELS.map((dl) => (
                <button
                  key={dl.id}
                  className={`${styles.dateHierBtn} ${pivotDateLevel === dl.id ? styles.dateHierBtnActive : ''}`}
                  onClick={() => setPivotDateLevel(dl.id)}
                >{dl.label}</button>
              ))}
            </div>
          )}
        </div>

        {/* Values */}
        <div className={`${p.card} ${styles.fieldWell}`}>
          <div className={styles.fieldWellLabel}>
            <span className={styles.fieldWellDot} style={{ background: '#10B981' }} />
            Values
          </div>
          {numCols.length === 0 ? (
            <div className={styles.missingWarn}>⚠ No numeric columns found in your dataset.</div>
          ) : (
            <select
              id="pivot-val-dim"
              className={styles.pivotSelect}
              value={pivotValDim}
              onChange={(e) => setPivotValDim(e.target.value)}
            >
              <option value="">— Select value —</option>
              {numCols.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          )}
        </div>

        {/* Aggregation */}
        <div className={`${p.card} ${styles.fieldWell}`}>
          <div className={styles.fieldWellLabel}>
            <span className={styles.fieldWellDot} style={{ background: '#F59E0B' }} />
            Aggregation
          </div>
          <div className={styles.aggRow}>
            {AGGS.map((ag) => (
              <button
                key={ag.id}
                id={`pivot-agg-${ag.id}`}
                className={`${styles.aggBtn} ${pivotAgg === ag.id ? styles.aggBtnActive : ''}`}
                onClick={() => setPivotAgg(ag.id)}
              >{ag.label}</button>
            ))}
          </div>
        </div>

        {/* Summary info */}
        {hasResult && (
          <div style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{rowKeys.length}</strong> row groups
            {pivotColDim && <> · <strong style={{ color: 'var(--text-secondary)' }}>{colKeys.length}</strong> col groups</>}
          </div>
        )}
      </div>

      {/* ── Right: Pivot Table ── */}
      <div>
        {!pivotRowDim || !pivotValDim ? (
          <div className={`${p.card} ${styles.emptyState}`}>
            <span className={styles.emptyIcon}>⬛</span>
            <p className={styles.emptyTitle}>Configure your pivot</p>
            <p className={styles.emptyDesc}>Select at least a Row dimension and a Value field on the left to generate a pivot table.</p>
          </div>
        ) : !hasResult ? (
          <div className={`${p.card} ${styles.emptyState}`}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyTitle}>No results</p>
            <p className={styles.emptyDesc}>The current filter combination returned no data.</p>
          </div>
        ) : (
          <div className={p.card} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px 10px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {toTitleCase(pivotValDim)} by {toTitleCase(pivotRowDim)}
                {pivotColDim ? ` × ${toTitleCase(pivotColDim)}` : ''}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {AGGS.find((a) => a.id === pivotAgg)?.label}
              </span>
            </div>
            <div className={styles.pivotTableWrap}>
              <table className={styles.pivotTable}>
                <thead>
                  <tr>
                    <th>{toTitleCase(pivotRowDim)}</th>
                    {showCols.map((ck) => (
                      <th key={ck} className="colHeader">
                        {ck === '__total__' ? toTitleCase(pivotValDim) : ck}
                      </th>
                    ))}
                    {pivotColDim && <th className="colHeader" style={{ color: 'var(--accent-blue)' }}>Total</th>}
                  </tr>
                </thead>
                <tbody>
                  {rowKeys.slice(0, 50).map((rk) => (
                    <tr key={rk}>
                      <td className={styles.pivotRowKey}>{rk}</td>
                      {showCols.map((ck) => {
                        const val = cells[rk]?.[ck]
                        return val !== null && val !== undefined ? (
                          <td key={ck} className={styles.numCell}>{formatNumber(val)}</td>
                        ) : (
                          <td key={ck} className={styles.nullCell}>—</td>
                        )
                      })}
                      {pivotColDim && (
                        <td className={styles.numCell} style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>
                          {totals[rk] !== null ? formatNumber(totals[rk]) : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Column totals */}
                  {colTotals && (
                    <tr className={styles.totalRow}>
                      <td style={{ fontWeight: 700 }}>Total</td>
                      {showCols.map((ck) => (
                        <td key={ck} className={styles.numCell}>
                          {colTotals[ck] !== null ? formatNumber(colTotals[ck]) : '—'}
                        </td>
                      ))}
                      {pivotColDim && <td />}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {rowKeys.length > 50 && (
              <div style={{ padding: '10px 20px', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.04)' }}>
                Showing 50 of {rowKeys.length} row groups
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Small helpers ─────────────────────────────────────────────────────────────
function MissingFieldWarn({ message, styles }) {
  return (
    <div className={styles.missingWarn}>⚠ {message}</div>
  )
}

function BlankDashboardHint({ p, styles }) {
  return (
    <div className={`${p.card} ${styles.emptyState}`}>
      <span className={styles.emptyIcon}>✦</span>
      <p className={styles.emptyTitle}>Blank Dashboard</p>
      <p className={styles.emptyDesc}>
        Select a template above or switch to the <strong>Pivot Builder</strong> tab to create a custom analysis.
      </p>
    </div>
  )
}
