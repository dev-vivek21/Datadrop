import { useMemo } from 'react'
import { computeKPIs, getNumericColumns, getCategoryColumns, formatNumber } from '../utils/dataUtils'
import styles from './KpiCards.module.css'

const CARD_DEFS = [
  {
    id: 'kpi-total',
    label: 'Total Sum',
    key: 'sum',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    color: '#a78bfa',
    bg:    'rgba(139,92,246,0.1)',
    border:'rgba(139,92,246,0.2)',
    trend: '+12.4%',
    trendUp: true,
  },
  {
    id: 'kpi-avg',
    label: 'Average',
    key: 'avg',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    color: '#06b6d4',
    bg:    'rgba(6,182,212,0.1)',
    border:'rgba(6,182,212,0.2)',
    trend: '+5.7%',
    trendUp: true,
  },
  {
    id: 'kpi-rows',
    label: 'Row Count',
    key: 'rowCount',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    ),
    color: '#10b981',
    bg:    'rgba(16,185,129,0.1)',
    border:'rgba(16,185,129,0.2)',
    trend: null,
    trendUp: null,
  },
]

export default function KpiCards({ parsedData }) {
  const { headers, rows } = parsedData

  const numCols = useMemo(() => getNumericColumns(headers, rows), [headers, rows])
  const catCols = useMemo(() => getCategoryColumns(headers, rows), [headers, rows])
  const kpi     = useMemo(() => computeKPIs(rows, numCols), [rows, numCols])

  const values = {
    sum:      kpi.sum,
    avg:      kpi.avg,
    rowCount: kpi.rowCount,
  }

  return (
    <section className={styles.grid} aria-label="Key performance indicators">
      {CARD_DEFS.map((card, i) => (
        <div
          key={card.id}
          id={card.id}
          className={styles.card}
          style={{
            '--c':  card.color,
            '--bg': card.bg,
            '--br': card.border,
            animationDelay: `${i * 0.1}s`,
          }}
        >
          {/* Glow blob */}
          <div className={styles.blob} aria-hidden="true" />

          {/* Icon */}
          <div className={styles.iconWrap} style={{ color: card.color }}>
            {card.icon}
          </div>

          {/* Body */}
          <div className={styles.body}>
            <span className={styles.label}>{card.label}</span>
            {card.key === 'rowCount' ? (
              <span className={styles.value}>{values[card.key].toLocaleString()}</span>
            ) : (
              <>
                <span className={styles.value}>{formatNumber(values[card.key])}</span>
                {kpi.primaryCol && (
                  <span className={styles.colName}>{kpi.primaryCol}</span>
                )}
              </>
            )}
          </div>

          {/* Trend badge */}
          {card.trend && (
            <div className={`${styles.trend} ${card.trendUp ? styles.trendUp : styles.trendDown}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {card.trendUp
                  ? <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  : <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />}
              </svg>
              {card.trend}
            </div>
          )}
        </div>
      ))}

      {/* Extra numeric cols (up to 2 more) */}
      {numCols.filter((c) => c !== kpi.primaryCol).slice(0, 2).map((col, i) => {
        const total = rows.reduce((a, r) => a + Number(r[col] || 0), 0)
        const extraColors = [
          { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
          { color: '#ec4899', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.2)' },
        ]
        const ec = extraColors[i]
        return (
          <div
            key={col}
            id={`kpi-extra-${i}`}
            className={styles.card}
            style={{
              '--c': ec.color, '--bg': ec.bg, '--br': ec.border,
              animationDelay: `${(i + 3) * 0.1}s`,
            }}
          >
            <div className={styles.blob} aria-hidden="true" />
            <div className={styles.iconWrap} style={{ color: ec.color }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
            </div>
            <div className={styles.body}>
              <span className={styles.label}>Sum · {col}</span>
              <span className={styles.value}>{formatNumber(total)}</span>
              <span className={styles.colName}>{col}</span>
            </div>
          </div>
        )
      })}
    </section>
  )
}
