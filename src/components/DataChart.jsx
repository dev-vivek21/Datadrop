import { useMemo, useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { getNumericColumns, getCategoryColumns, buildChartData, formatNumber } from '../utils/dataUtils'
import styles from './DataChart.module.css'

/* Gradient palette for bars */
const BAR_COLORS = ['#a78bfa', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
  '#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#f472b6']

/* Custom recharts tooltip */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: entry.color }} />
          <span className={styles.tooltipKey}>{entry.dataKey}</span>
          <span className={styles.tooltipVal}>{formatNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function DataChart({ parsedData }) {
  const { headers, rows } = parsedData
  const [chartType, setChartType] = useState('bar')

  const numCols = useMemo(() => getNumericColumns(headers, rows), [headers, rows])
  const catCols = useMemo(() => getCategoryColumns(headers, rows), [headers, rows])

  // Primary value column (largest sum)
  const primaryCol = useMemo(() => {
    if (!numCols.length) return null
    return numCols.reduce((best, col) => {
      const sum = rows.reduce((a, r) => a + Number(r[col] || 0), 0)
      const bestSum = rows.reduce((a, r) => a + Number(r[best] || 0), 0)
      return sum > bestSum ? col : best
    })
  }, [numCols, rows])

  const extraCols = numCols.filter((c) => c !== primaryCol).slice(0, 2)
  const chartData  = useMemo(
    () => buildChartData(rows, numCols, primaryCol, catCols),
    [rows, numCols, primaryCol, catCols]
  )

  const allSeries = primaryCol ? [primaryCol, ...extraCols] : []

  if (!chartData.length || !allSeries.length) {
    return (
      <div className={styles.empty}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <p>No numeric data found to chart</p>
      </div>
    )
  }

  const groupLabel = catCols[0] ?? 'Category'

  /* Shared axis/grid props */
  const gridProps  = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '3 3' }
  const xAxisProps = {
    dataKey: 'name',
    tick: { fill: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' },
    axisLine: { stroke: 'rgba(255,255,255,0.06)' },
    tickLine: false,
    interval: 0,
    angle: chartData.length > 6 ? -35 : 0,
    textAnchor: chartData.length > 6 ? 'end' : 'middle',
    height: chartData.length > 6 ? 52 : 28,
  }
  const yAxisProps = {
    tick: { fill: '#64748b', fontSize: 11, fontFamily: 'Inter, sans-serif' },
    axisLine: false,
    tickLine: false,
    tickFormatter: formatNumber,
    width: 70,
  }

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>Data Visualization</h2>
          <span className={styles.sub}>
            Grouped by <code className={styles.code}>{groupLabel}</code>
            {' · '}Top {chartData.length} categories
          </span>
        </div>

        {/* Chart type switcher */}
        <div className={styles.switcher} role="group" aria-label="Chart type">
          <button
            id="chart-type-bar"
            className={`${styles.switchBtn} ${chartType === 'bar' ? styles.switchActive : ''}`}
            onClick={() => setChartType('bar')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Bar
          </button>
          <button
            id="chart-type-line"
            className={`${styles.switchBtn} ${chartType === 'line' ? styles.switchActive : ''}`}
            onClick={() => setChartType('line')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            </svg>
            Line
          </button>
        </div>
      </div>

      {/* Chart canvas */}
      <div className={styles.canvas}>
        <ResponsiveContainer width="100%" height={300}>
          {chartType === 'bar' ? (
            <BarChart data={chartData} barGap={4} barCategoryGap="20%">
              <CartesianGrid {...gridProps} vertical={false} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
              {allSeries.length > 1 && (
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8, fontFamily: 'Inter, sans-serif' }}
                />
              )}
              {allSeries.map((col, si) => (
                <Bar key={col} dataKey={col} radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((_, ci) => (
                    <Cell
                      key={ci}
                      fill={BAR_COLORS[(si * 3 + ci) % BAR_COLORS.length]}
                      fillOpacity={allSeries.length === 1 ? 0.85 : 0.75}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid {...gridProps} />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip content={<CustomTooltip />} />
              {allSeries.length > 1 && (
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#64748b', paddingTop: 8, fontFamily: 'Inter, sans-serif' }}
                />
              )}
              {allSeries.map((col, si) => (
                <Line
                  key={col}
                  type="monotone"
                  dataKey={col}
                  stroke={BAR_COLORS[si * 3 % BAR_COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: BAR_COLORS[si * 3 % BAR_COLORS.length], strokeWidth: 0 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
