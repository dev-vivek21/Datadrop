import styles from './StatsBar.module.css'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function getFileType(name) {
  return '.' + name.split('.').pop().toUpperCase()
}

export default function StatsBar({ parsedData, uploadedFile }) {
  const rowCount    = parsedData?.rows?.length ?? 0
  const colCount    = parsedData?.headers?.length ?? 0
  const fileSize    = formatBytes(uploadedFile?.size)
  const fileType    = getFileType(uploadedFile?.name ?? 'file.csv')
  const emptyCells  = parsedData?.rows?.reduce((acc, row) => {
    return acc + Object.values(row).filter((v) => v === '' || v == null).length
  }, 0) ?? 0
  const fillRate = rowCount && colCount
    ? Math.round(((rowCount * colCount - emptyCells) / (rowCount * colCount)) * 100)
    : 100

  const stats = [
    {
      id: 'stat-rows',
      label: 'Total Rows',
      value: rowCount.toLocaleString(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      ),
      color: '#a78bfa',
    },
    {
      id: 'stat-columns',
      label: 'Columns',
      value: colCount.toLocaleString(),
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
      ),
      color: '#06b6d4',
    },
    {
      id: 'stat-size',
      label: 'File Size',
      value: fileSize,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      ),
      color: '#f59e0b',
    },
    {
      id: 'stat-fill',
      label: 'Fill Rate',
      value: `${fillRate}%`,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      ),
      color: '#10b981',
    },
    {
      id: 'stat-type',
      label: 'Format',
      value: fileType,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
      ),
      color: '#ec4899',
    },
  ]

  return (
    <div className={styles.bar} role="region" aria-label="File statistics">
      {stats.map((stat, i) => (
        <div
          key={stat.id}
          id={stat.id}
          className={styles.card}
          style={{ '--accent': stat.color, animationDelay: `${i * 0.07}s` }}
        >
          <div className={styles.cardIcon} style={{ color: stat.color }}>
            {stat.icon}
          </div>
          <div className={styles.cardBody}>
            <span className={styles.cardValue}>{stat.value}</span>
            <span className={styles.cardLabel}>{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
