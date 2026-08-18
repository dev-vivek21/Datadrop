import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getNumericColumns, getCategoryColumns, formatNumber } from '../../utils/dataUtils'
import p from './Panel.module.css'
import styles from './ChartsPanel.module.css'

const PALETTE = [
  '#0066CC', '#7C3AED', '#10B981', '#F59E0B', '#EF4444',
  '#0284C7', '#EC4899', '#8B5CF6', '#14B8A6', '#F97316',
]

const CHART_TYPES = [
  { id: 'all',     label: 'All Charts (Grid View)', icon: '❖' },
  { id: 'bar',     label: 'Bar',                   icon: '▊' },
  { id: 'line',    label: 'Line',                  icon: '↗' },
  { id: 'area',    label: 'Area',                  icon: '◤' },
  { id: 'pie',     label: 'Pie',                   icon: '◕' },
  { id: 'scatter', label: 'Scatter',               icon: '⋮' },
]

function CustomTooltip({ active, payload, label }) {
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

export default function ChartsPanel({ parsedData }) {
  const { headers = [], rows = [] } = parsedData ?? {}

  const numCols = useMemo(() => getNumericColumns(headers, rows), [headers, rows])
  const catCols = useMemo(() => getCategoryColumns(headers, rows), [headers, rows])

  const [chartType, setChartType] = useState('all')
  const [xCol, setXCol]           = useState(catCols[0] ?? headers[0] ?? '')
  const [yCol, setYCol]           = useState(numCols[0] ?? '')
  const [y2Col, setY2Col]         = useState('')
  const [limit, setLimit]         = useState(10)

  /* Build aggregated chart data */
  const chartData = useMemo(() => {
    if (!xCol || !yCol) return []
    const groups = {}
    rows.forEach((row) => {
      const key = String(row[xCol] ?? 'Unknown')
      if (!groups[key]) groups[key] = { name: key, [yCol]: 0 }
      if (y2Col) groups[key][y2Col] = groups[key][y2Col] || 0
      groups[key][yCol] += Number(row[yCol] || 0)
      if (y2Col) groups[key][y2Col] += Number(row[y2Col] || 0)
    })
    return Object.values(groups)
      .sort((a, b) => b[yCol] - a[yCol])
      .slice(0, limit)
  }, [rows, xCol, yCol, y2Col, limit])

  /* Scatter: raw x/y pairs */
  const scatterData = useMemo(() => {
    if (!xCol || !yCol) return []
    return rows.slice(0, 150).map((r) => ({
      x: Number(r[xCol] || 0),
      y: Number(r[yCol] || 0),
    }))
  }, [rows, xCol, yCol])

  /* Shared axis/grid props */
  const gridProps  = { stroke: 'rgba(0,0,0,0.05)', strokeDasharray: '3 3' }
  const xAxisProps = {
    dataKey: 'name',
    tick: { fill: '#86868B', fontSize: 11, fontFamily: 'var(--font-sans)' },
    axisLine: { stroke: 'rgba(0,0,0,0.08)' },
    tickLine: false,
    interval: 0,
    angle: chartData.length > 5 ? -25 : 0,
    textAnchor: chartData.length > 5 ? 'end' : 'middle',
    height: chartData.length > 5 ? 42 : 24,
  }
  const yAxisProps = {
    tick: { fill: '#86868B', fontSize: 11, fontFamily: 'var(--font-sans)' },
    axisLine: false,
    tickLine: false,
    tickFormatter: formatNumber,
    width: 65,
  }

  const tooltip = <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,102,204,0.04)' }} />

  /* ── 1. Individual Chart Components ── */
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} barCategoryGap="20%">
        <CartesianGrid {...gridProps} vertical={false} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        {tooltip}
        {y2Col && <Legend wrapperStyle={{ fontSize: 11, color: '#86868B', paddingTop: 6 }} />}
        <Bar dataKey={yCol} radius={[5, 5, 0, 0]} maxBarSize={48} fill={PALETTE[0]} fillOpacity={0.9} />
        {y2Col && <Bar dataKey={y2Col} radius={[5, 5, 0, 0]} maxBarSize={48} fill={PALETTE[1]} fillOpacity={0.85} />}
      </BarChart>
    </ResponsiveContainer>
  )

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid {...gridProps} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        {tooltip}
        {y2Col && <Legend wrapperStyle={{ fontSize: 11, color: '#86868B', paddingTop: 6 }} />}
        <Line type="monotone" dataKey={yCol} stroke={PALETTE[0]} strokeWidth={2.5} dot={{ r: 4, fill: PALETTE[0], strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
        {y2Col && <Line type="monotone" dataKey={y2Col} stroke={PALETTE[1]} strokeWidth={2.5} dot={{ r: 4, fill: PALETTE[1], strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />}
      </LineChart>
    </ResponsiveContainer>
  )

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="areaGrad1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PALETTE[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0.02} />
          </linearGradient>
          {y2Col && (
            <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={PALETTE[1]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={PALETTE[1]} stopOpacity={0.02} />
            </linearGradient>
          )}
        </defs>
        <CartesianGrid {...gridProps} />
        <XAxis {...xAxisProps} />
        <YAxis {...yAxisProps} />
        {tooltip}
        {y2Col && <Legend wrapperStyle={{ fontSize: 11, color: '#86868B', paddingTop: 6 }} />}
        <Area type="monotone" dataKey={yCol} stroke={PALETTE[0]} fill="url(#areaGrad1)" strokeWidth={2.2} />
        {y2Col && <Area type="monotone" dataKey={y2Col} stroke={PALETTE[1]} fill="url(#areaGrad2)" strokeWidth={2.2} />}
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => {
    const pieData = chartData.map((d, i) => ({ name: d.name, value: d[yCol], fill: PALETTE[i % PALETTE.length] }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={105} innerRadius={52} dataKey="value" paddingAngle={3}>
            {pieData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#86868B', paddingTop: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart>
        <CartesianGrid {...gridProps} />
        <XAxis type="number" dataKey="x" name={xCol} tick={{ fill: '#86868B', fontSize: 11 }} axisLine={{ stroke: 'rgba(0,0,0,0.08)' }} tickLine={false} tickFormatter={formatNumber} />
        <YAxis type="number" dataKey="y" name={yCol} tick={{ fill: '#86868B', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatNumber} width={65} />
        <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'rgba(0,0,0,0.1)' }} content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          const d = payload[0]?.payload
          return (
            <div className={styles.tooltip}>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipKey}>{xCol}</span>
                <span className={styles.tooltipVal}>{formatNumber(d?.x)}</span>
              </div>
              <div className={styles.tooltipRow}>
                <span className={styles.tooltipKey}>{yCol}</span>
                <span className={styles.tooltipVal}>{formatNumber(d?.y)}</span>
              </div>
            </div>
          )
        }} />
        <Scatter data={scatterData} fill={PALETTE[0]} fillOpacity={0.75} />
      </ScatterChart>
    </ResponsiveContainer>
  )

  return (
    <div className={p.panel}>
      {/* Header */}
      <div className={p.panelHeader}>
        <div>
          <h2 className={p.panelTitle}>
            <span className={p.panelTitleIcon} style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </span>
            Chart Studio & Multi-View
          </h2>
          <p className={p.panelSub}>Analyze data across all chart formats simultaneously or focus on a single visualization</p>
        </div>
      </div>

      {/* Controls Card */}
      <div className={`${p.card} ${styles.controls}`}>
        {/* Chart type selection buttons */}
        <div className={styles.controlGroup}>
          <div className={styles.controlHeaderRow}>
            <label className={styles.controlLabel}>Chart View</label>
            <span className={styles.activeModeTag}>
              {chartType === 'all' ? 'All 5 Charts Active' : `${chartType.toUpperCase()} View`}
            </span>
          </div>
          <div className={styles.typePicker}>
            {CHART_TYPES.map((ct) => (
              <button
                key={ct.id}
                id={`chart-type-${ct.id}`}
                className={`${styles.typeBtn} ${chartType === ct.id ? styles.typeBtnActive : ''}`}
                onClick={() => setChartType(ct.id)}
              >
                <span className={styles.typeIcon}>{ct.icon}</span>
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Axis Selectors */}
        <div className={styles.axisRow}>
          {/* X Axis */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="x-axis-select">
              {chartType === 'scatter' ? 'X Axis (numeric)' : 'Dimension (X Axis)'}
            </label>
            <select
              id="x-axis-select"
              className={p.glassSelect}
              value={xCol}
              onChange={(e) => setXCol(e.target.value)}
            >
              {headers.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Y Axis */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="y-axis-select">Metric (Y Axis)</label>
            <select
              id="y-axis-select"
              className={p.glassSelect}
              value={yCol}
              onChange={(e) => setYCol(e.target.value)}
            >
              {numCols.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>

          {/* Secondary Y2 Axis */}
          {!['pie', 'scatter'].includes(chartType) && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="y2-axis-select">Secondary Metric (Y2)</label>
              <select
                id="y2-axis-select"
                className={p.glassSelect}
                value={y2Col}
                onChange={(e) => setY2Col(e.target.value)}
              >
                <option value="">— None —</option>
                {numCols.filter((c) => c !== yCol).map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          )}

          {/* Max items limit */}
          {chartType !== 'scatter' && (
            <div className={styles.controlGroup}>
              <label className={styles.controlLabel} htmlFor="limit-select">Max Groups</label>
              <select
                id="limit-select"
                className={p.glassSelect}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
              >
                {[5, 10, 15, 20, 25].map((n) => <option key={n} value={n}>{n} items</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Render Charts: Grid View vs Single View ── */}
      {chartType === 'all' ? (
        <div className={styles.allChartsGrid}>

          {/* 1. Bar Chart Card */}
          <div className={`${p.card} ${styles.gridChartCard}`}>
            <div className={styles.gridChartHeader}>
              <div className={styles.gridChartTitleArea}>
                <span className={styles.gridIcon} style={{ background: 'rgba(0,102,204,0.1)', color: '#0066CC' }}>▊</span>
                <span className={styles.gridChartTitle}>Bar Chart — {xCol} vs {yCol}</span>
              </div>
              <span className={styles.gridBadge}>Comparison</span>
            </div>
            <div className={styles.gridChartBody}>
              {renderBarChart()}
            </div>
          </div>

          {/* 2. Line Chart Card */}
          <div className={`${p.card} ${styles.gridChartCard}`}>
            <div className={styles.gridChartHeader}>
              <div className={styles.gridChartTitleArea}>
                <span className={styles.gridIcon} style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED' }}>↗</span>
                <span className={styles.gridChartTitle}>Line Trend — {xCol} vs {yCol}</span>
              </div>
              <span className={styles.gridBadge}>Progression</span>
            </div>
            <div className={styles.gridChartBody}>
              {renderLineChart()}
            </div>
          </div>

          {/* 3. Area Chart Card */}
          <div className={`${p.card} ${styles.gridChartCard}`}>
            <div className={styles.gridChartHeader}>
              <div className={styles.gridChartTitleArea}>
                <span className={styles.gridIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>◤</span>
                <span className={styles.gridChartTitle}>Area Volume — {xCol} vs {yCol}</span>
              </div>
              <span className={styles.gridBadge}>Cumulative</span>
            </div>
            <div className={styles.gridChartBody}>
              {renderAreaChart()}
            </div>
          </div>

          {/* 4. Pie Chart Card */}
          <div className={`${p.card} ${styles.gridChartCard}`}>
            <div className={styles.gridChartHeader}>
              <div className={styles.gridChartTitleArea}>
                <span className={styles.gridIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}>◕</span>
                <span className={styles.gridChartTitle}>Donut Share — {xCol} Breakdown</span>
              </div>
              <span className={styles.gridBadge}>Distribution</span>
            </div>
            <div className={styles.gridChartBody}>
              {renderPieChart()}
            </div>
          </div>

          {/* 5. Scatter Plot Card */}
          <div className={`${p.card} ${styles.gridChartCard} ${styles.fullWidthScatter}`}>
            <div className={styles.gridChartHeader}>
              <div className={styles.gridChartTitleArea}>
                <span className={styles.gridIcon} style={{ background: 'rgba(2,132,199,0.1)', color: '#0284C7' }}>⋮</span>
                <span className={styles.gridChartTitle}>Scatter Matrix — {xCol} vs {yCol} Distribution</span>
              </div>
              <span className={styles.gridBadge}>Correlation</span>
            </div>
            <div className={styles.gridChartBody}>
              {renderScatterChart()}
            </div>
          </div>

        </div>
      ) : (
        /* Single Full-Focus Chart */
        <div className={`${p.card} ${styles.canvas}`}>
          <div className={styles.singleChartHeader}>
            <span className={styles.singleChartTitle}>
              {chartType.toUpperCase()} Chart • {xCol} vs {yCol} {y2Col ? `& ${y2Col}` : ''}
            </span>
          </div>
          <div style={{ width: '100%', height: 420 }}>
            {chartType === 'bar' && renderBarChart()}
            {chartType === 'line' && renderLineChart()}
            {chartType === 'area' && renderAreaChart()}
            {chartType === 'pie' && renderPieChart()}
            {chartType === 'scatter' && renderScatterChart()}
          </div>
        </div>
      )}
    </div>
  )
}
