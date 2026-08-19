import { useState } from 'react'
import styles from './Sidebar.module.css'

const navItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'charts',
    label: 'Charts',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: 'filter',
    label: 'Filter',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
      </svg>
    ),
  },
  {
    id: 'export',
    label: 'Export',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    id: 'pivot',
    label: 'Pivot & BI',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
]

export default function Sidebar({
  hasData,
  activeTab,
  onTabChange,
  isOpen: controlledIsOpen,
  onToggle: controlledOnToggle,
  onOpenAbout,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(true)
  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen
  const handleToggle = isControlled ? controlledOnToggle : () => setInternalIsOpen((prev) => !prev)

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
      {/* The Border Edge Button */}
      <button
        id="sidebar-toggle-btn"
        className={styles.edgeToggleBtn}
        onClick={handleToggle}
        aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isOpen ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </button>

      {/* Inner Content Area */}
      <div className={styles.innerContent}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="url(#logoGrad2)" />
              <path d="M2 17l10 5 10-5" stroke="url(#logoGrad2)" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M2 12l10 5 10-5" stroke="url(#logoGrad2)" strokeWidth="2" strokeLinecap="round" fill="none" />
              <defs>
                <linearGradient id="logoGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#93C5FD" />
                  <stop offset="100%" stopColor="#0066CC" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className={styles.logoText}>DataDrop</span>
        </div>

        {/* Nav */}
        <nav className={styles.nav} aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive   = activeTab === item.id
            const isDisabled = !hasData && item.id !== 'overview'

            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={[
                  styles.navItem,
                  isActive   ? styles.navActive   : '',
                  isDisabled ? styles.navDisabled : '',
                ].filter(Boolean).join(' ')}
                onClick={() => !isDisabled && onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={isDisabled ? 'Upload a file to enable' : item.label}
                disabled={isDisabled}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {isActive && <span className={styles.activeDot} />}
              </button>
            )
          })}
        </nav>

        {/* Footer with Status & About Trigger */}
        <div className={styles.sidebarFooter}>
          <div className={styles.statusRow}>
            <div className={styles.statusDot} />
            <span className={styles.statusText}>{hasData ? 'Data loaded' : 'Ready'}</span>
          </div>
          <button
            id="btn-sidebar-about"
            className={styles.aboutBtn}
            onClick={onOpenAbout}
            title="About DataDrop & AI Architecture Details"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            About
          </button>
        </div>
      </div>
    </aside>
  )
}
