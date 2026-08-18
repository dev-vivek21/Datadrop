import { useEffect } from 'react'
import styles from './AboutModal.module.css'

export default function AboutModal({ isOpen, onClose }) {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.window} onClick={(e) => e.stopPropagation()}>

        {/* Mac-style Window Header */}
        <div className={styles.windowHeader}>
          <div className={styles.trafficLights}>
            <button className={`${styles.light} ${styles.closeLight}`} onClick={onClose} aria-label="Close modal" />
            <span className={`${styles.light} ${styles.minimizeLight}`} />
            <span className={`${styles.light} ${styles.zoomLight}`} />
          </div>
          <div className={styles.windowTitle}>About DataDrop</div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className={styles.content}>

          {/* 1. Hero Section */}
          <div className={styles.heroSection}>
            <span className={styles.heroBadge}>Privacy-First Analytics</span>
            <h2 className={styles.heroTitle}>
              Analytics Without Sending <br />
              <span className={styles.gradientText}>Your Data Anywhere.</span>
            </h2>
            <p className={styles.heroDescription}>
              DataDrop turns raw spreadsheets into interactive visual intelligence directly inside your browser — with zero setup, no mandatory accounts, and absolute client-side privacy.
            </p>
          </div>

          {/* 2. What is DataDrop? */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon} style={{ background: 'rgba(0, 102, 204, 0.1)', color: '#0066CC' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div>
                <h3 className={styles.sectionTitle}>What is DataDrop?</h3>
                <p className={styles.sectionSub}>Instant spreadsheet intelligence for professionals and teams</p>
              </div>
            </div>
            <p className={styles.bodyText}>
              DataDrop is built for anyone who needs fast, reliable data exploration without the complexity of traditional business intelligence platforms or cloud subscriptions. Simply drop a CSV or Excel spreadsheet into the workspace to immediately explore key metrics, multi-chart visualizations, dynamic filtering rules, and executive reports.
            </p>
          </div>

          {/* 3. Privacy First Engine */}
          <div className={`${styles.cardSection} ${styles.privacyCard}`}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon} style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h3 className={styles.sectionTitle}>Privacy First: Your Files Stay on Your Device</h3>
                <p className={styles.sectionSub}>Designed with privacy and data protection in mind</p>
              </div>
            </div>
            <p className={styles.bodyText}>
              Unlike conventional analytics tools that require uploading your sensitive spreadsheets to third-party cloud servers, DataDrop performs <strong>100% of its parsing, calculations, and rendering locally</strong> within your browser session. Your data is never uploaded, stored, or analyzed remotely.
            </p>
            <div className={styles.trustBadgesRow}>
              <span className={styles.trustBadge}>
                <span className={styles.badgeDot} style={{ background: '#10B981' }} />
                100% In-Browser Execution
              </span>
              <span className={styles.trustBadge}>
                <span className={styles.badgeDot} style={{ background: '#0066CC' }} />
                Zero Telemetry & No Data Uploads
              </span>
              <span className={styles.trustBadge}>
                <span className={styles.badgeDot} style={{ background: '#7C3AED' }} />
                No Cloud Dependencies
              </span>
            </div>
          </div>

          {/* 4. Built for Instant Analysis (Workflow) */}
          <div className={styles.workflowSection}>
            <div className={styles.workflowHeader}>
              <h3 className={styles.workflowTitle}>Built for Instant Analysis</h3>
              <p className={styles.workflowSub}>From raw spreadsheet to executive insight in seconds</p>
            </div>

            <div className={styles.pipelineGrid}>
              <div className={styles.pipelineStep}>
                <span className={styles.stepNum}>01</span>
                <h4 className={styles.pipelineStepTitle}>Upload</h4>
                <p className={styles.pipelineStepDesc}>Drop any .csv or .xlsx file up to 50 MB.</p>
              </div>
              <div className={styles.pipelineStep}>
                <span className={styles.stepNum}>02</span>
                <h4 className={styles.pipelineStepTitle}>Explore</h4>
                <p className={styles.pipelineStepDesc}>Inspect column data types, fill rates, and statistics.</p>
              </div>
              <div className={styles.pipelineStep}>
                <span className={styles.stepNum}>03</span>
                <h4 className={styles.pipelineStepTitle}>Filter</h4>
                <p className={styles.pipelineStepDesc}>Isolate subsets with reactive multi-rule filters.</p>
              </div>
              <div className={styles.pipelineStep}>
                <span className={styles.stepNum}>04</span>
                <h4 className={styles.pipelineStepTitle}>Visualize</h4>
                <p className={styles.pipelineStepDesc}>Compare metrics across all chart types simultaneously.</p>
              </div>
              <div className={styles.pipelineStep}>
                <span className={styles.stepNum}>05</span>
                <h4 className={styles.pipelineStepTitle}>Report</h4>
                <p className={styles.pipelineStepDesc}>Download verified datasets and executive PDF reports.</p>
              </div>
            </div>
          </div>

          {/* 5. Why DataDrop? (Value Cards) */}
          <div className={styles.whySection}>
            <div className={styles.workflowHeader}>
              <h3 className={styles.workflowTitle}>Why DataDrop?</h3>
              <p className={styles.workflowSub}>A streamlined workspace for modern data workflows</p>
            </div>

            <div className={styles.whyGrid}>
              <div className={styles.whyCard}>
                <div className={styles.whyIcon} style={{ background: 'rgba(0, 102, 204, 0.08)', color: '#0066CC' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <h4 className={styles.whyCardTitle}>Zero Setup</h4>
                <p className={styles.whyCardText}>No signups, subscriptions, or complex setup. Open the page and begin analyzing immediately.</p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon} style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#059669' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4 className={styles.whyCardTitle}>Complete Privacy</h4>
                <p className={styles.whyCardText}>Files stay securely on your local device. Analysis runs in memory without remote data storage.</p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon} style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7C3AED' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h4 className={styles.whyCardTitle}>Interactive Analytics</h4>
                <p className={styles.whyCardText}>Seamlessly toggle between single-chart deep dives and multi-chart studio grids with live tooltips.</p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon} style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#D97706' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </div>
                <h4 className={styles.whyCardTitle}>Multi-Rule Filtering</h4>
                <p className={styles.whyCardText}>Chain multiple conditions with live match metrics to segment and isolate key records easily.</p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon} style={{ background: 'rgba(2, 132, 199, 0.08)', color: '#0284C7' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <h4 className={styles.whyCardTitle}>Fast Performance</h4>
                <p className={styles.whyCardText}>Engineered for responsive client-side calculations and instant visual updates across large datasets.</p>
              </div>

              <div className={styles.whyCard}>
                <div className={styles.whyIcon} style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#DC2626' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h4 className={styles.whyCardTitle}>Executive Reports</h4>
                <p className={styles.whyCardText}>Generate structured, multi-page PDF executive reports complete with vector charts and data tables.</p>
              </div>
            </div>
          </div>

          {/* 6. Technology & Engineering */}
          <div className={styles.cardSection}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIcon} style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#4F46E5' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div>
                <h3 className={styles.sectionTitle}>Technology & Engineering</h3>
                <p className={styles.sectionSub}>Modern client-side architecture built for speed and reliability</p>
              </div>
            </div>

            <div className={styles.techStackList}>
              <div className={styles.techItem}>
                <div className={styles.techHeader}>
                  <span className={styles.techName}>React 19 & Vite</span>
                  <span className={styles.techBadge}>Core Engine</span>
                </div>
                <p className={styles.techDesc}>Provides sub-millisecond reactive state updates, efficient DOM reconciliation, and instant panel transitions.</p>
              </div>

              <div className={styles.techItem}>
                <div className={styles.techHeader}>
                  <span className={styles.techName}>SheetJS (xlsx)</span>
                  <span className={styles.techBadge}>Data Parsing</span>
                </div>
                <p className={styles.techDesc}>Parses and streams binary .xlsx and .csv files in memory with UTF-8 BOM encoding for complete Excel compatibility.</p>
              </div>

              <div className={styles.techItem}>
                <div className={styles.techHeader}>
                  <span className={styles.techName}>Recharts & Vector SVG</span>
                  <span className={styles.techBadge}>Visualizations</span>
                </div>
                <p className={styles.techDesc}>Renders responsive, hardware-accelerated charts with fluid animations, custom tooltips, and multi-axis support.</p>
              </div>

              <div className={styles.techItem}>
                <div className={styles.techHeader}>
                  <span className={styles.techName}>jsPDF & AutoTable</span>
                  <span className={styles.techBadge}>Report Engine</span>
                </div>
                <p className={styles.techDesc}>Generates publication-quality PDF reports with embedded vector charts and auto-paginated record tables entirely in the browser.</p>
              </div>

              <div className={styles.techItem}>
                <div className={styles.techHeader}>
                  <span className={styles.techName}>Vanilla CSS Design System</span>
                  <span className={styles.techBadge}>Design Language</span>
                </div>
                <p className={styles.techDesc}>Implements an Apple-inspired glassmorphic aesthetic with custom design tokens for optimal rendering performance.</p>
              </div>
            </div>
          </div>


          {/* Footer */}
          <div className={styles.modalFooter}>
            <div className={styles.footerInfo}>
              <span className={styles.versionTag}>DataDrop v2.4</span>
              <span className={styles.footerDot}>·</span>
              <span className={styles.authorTag}>Designed with privacy and precision</span>
            </div>
            <button className={styles.doneBtn} onClick={onClose}>
              Back to Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
