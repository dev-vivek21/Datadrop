import { useMemo } from 'react'
import { getNumericColumns, getCategoryColumns, formatNumber } from '../../utils/dataUtils'
import p from './Panel.module.css'
import styles from './ExplorePanel.module.css'

export default function ExplorePanel({ parsedData }) {
  const { headers = [], rows = [] } = parsedData ?? {}
  const numCols = useMemo(() => new Set(getNumericColumns(headers, rows)), [headers, rows])

  const colProfiles = useMemo(() => headers.map((col) => {
    const values = rows.map((r) => r[col])
    const nonEmpty = values.filter((v) => v !== '' && v != null && String(v).trim() !== '')
    const empty    = values.length - nonEmpty.length
    const unique   = new Set(values.map(String)).size
    const fillRate = values.length ? Math.round((nonEmpty.length / values.length) * 100) : 0
    const isNum    = numCols.has(col)

    let stats = {}
    if (isNum) {
      const nums = nonEmpty.map(Number).filter((n) => !isNaN(n))
      if (nums.length) {
        stats.min = Math.min(...nums)
        stats.max = Math.max(...nums)
        stats.sum = nums.reduce((a, b) => a + b, 0)
        stats.avg = stats.sum / nums.length
      }
    } else {
      // Top 5 values by frequency
      const freq = {}
      values.forEach((v) => { const k = String(v ?? ''); freq[k] = (freq[k] || 0) + 1 })
      stats.topValues = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }

    return { col, isNum, unique, empty, fillRate, values: values.length, stats }
  }), [headers, rows, numCols])

  return (
    <div className={p.panel}>
      {/* Header */}
      <div className={p.panelHeader}>
        <div>
          <h2 className={p.panelTitle}>
            <span className={p.panelTitleIcon} style={{ background: 'rgba(56,189,248,0.12)', color: '#38BDF8' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            Data Explorer
          </h2>
          <p className={p.panelSub}>{headers.length} columns · {rows.length.toLocaleString()} rows</p>
        </div>
      </div>

      {/* Column profiles grid */}
      <div className={styles.grid}>
        {colProfiles.map((profile, i) => (
          <div
            key={profile.col}
            className={`${p.card} ${styles.colCard}`}
            style={{ animationDelay: `${i * 0.04}s` }}
          >
            {/* Col header */}
            <div className={styles.colHeader}>
              <div className={styles.colMeta}>
                <span className={`${styles.typeChip} ${profile.isNum ? styles.typeNum : styles.typeStr}`}>
                  {profile.isNum ? '123' : 'Aa'}
                </span>
                <span className={styles.colName}>{profile.col}</span>
              </div>
              <span className={styles.uniqueCount}>{profile.unique.toLocaleString()} unique</span>
            </div>

            {/* Fill rate bar */}
            <div className={styles.fillRow}>
              <div className={styles.fillBar}>
                <div
                  className={styles.fillFill}
                  style={{
                    width: `${profile.fillRate}%`,
                    background: profile.fillRate > 80
                      ? 'linear-gradient(90deg,#34D399,#10b981)'
                      : profile.fillRate > 50
                        ? 'linear-gradient(90deg,#FBBF24,#F59E0B)'
                        : 'linear-gradient(90deg,#F87171,#EF4444)',
                  }}
                />
              </div>
              <span className={styles.fillPct}>{profile.fillRate}%</span>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              {profile.isNum ? (
                <>
                  <StatItem label="Min"   value={formatNumber(profile.stats.min ?? 0)} />
                  <StatItem label="Max"   value={formatNumber(profile.stats.max ?? 0)} />
                  <StatItem label="Avg"   value={formatNumber(profile.stats.avg ?? 0)} />
                  <StatItem label="Sum"   value={formatNumber(profile.stats.sum ?? 0)} />
                  <StatItem label="Empty" value={profile.empty.toLocaleString()} dim />
                </>
              ) : (
                <div className={styles.topValues}>
                  {(profile.stats.topValues ?? []).map(([val, cnt]) => (
                    <div key={val} className={styles.topRow}>
                      <span className={styles.topVal}>{val || <em>empty</em>}</span>
                      <div className={styles.topBar}>
                        <div
                          className={styles.topBarFill}
                          style={{ width: `${Math.round((cnt / rows.length) * 100)}%` }}
                        />
                      </div>
                      <span className={styles.topCount}>{cnt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatItem({ label, value, dim }) {
  return (
    <div className={styles.statItem}>
      <span className={styles.statLabel}>{label}</span>
      <span className={`${styles.statVal} ${dim ? styles.statDim : ''}`}>{value}</span>
    </div>
  )
}
