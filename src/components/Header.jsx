import styles from './Header.module.css'


function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const TAB_LABELS = {
  overview: 'Overview',
  explore:  'Explore Data',
  charts:   'Chart Builder',
  filter:   'Filter Rules',
  export:   'Export Data',
}

export default function Header({
  uploadedFile,
  onReset,
  hasData,
  activeTab,
  filterCount,
  sidebarOpen = true,
  onOpenAbout,
}) {
  const pageTitle = hasData ? (TAB_LABELS[activeTab] ?? 'Dashboard') : 'Dashboard'

  return (
    <header
      className={`${styles.header} ${!sidebarOpen ? styles.headerShifted : ''}`}
      role="banner"
    >
      <div className={styles.left}>
        <span className={styles.pageTitle}>{pageTitle}</span>

        {hasData && (
          <div className={styles.filePill}>
            <span className={styles.filePillDot} />
            <span className={styles.fileName}>{uploadedFile.name}</span>
            <span className={styles.fileSize}>{formatBytes(uploadedFile.size)}</span>
          </div>
        )}

        {/* Active filter count badge */}
        {hasData && filterCount > 0 && (
          <div className={styles.filterBadge} title={`${filterCount} active filter${filterCount > 1 ? 's' : ''}`}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            {filterCount} filter{filterCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className={styles.right}>
        {/* Action Buttons */}

        {hasData && (
          <button
            id="btn-upload-new"
            className={styles.btnReset}
            onClick={onReset}
            title="Upload a new file"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3.5" />
            </svg>
            Clear & New File
          </button>
        )}

        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span className={styles.badgeText}>Live</span>
        </div>
      </div>
    </header>
  )
}
