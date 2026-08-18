import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import DropZone from './DropZone'
import KpiCards from './KpiCards'
import DataChart from './DataChart'
import DataTable from './DataTable'
import AboutModal from './AboutModal'
import ExplorePanel from './panels/ExplorePanel'
import ChartsPanel from './panels/ChartsPanel'
import FilterPanel from './panels/FilterPanel'
import ExportPanel from './panels/ExportPanel'
import { applyFilters } from '../utils/dataUtils'
import styles from './Dashboard.module.css'

export default function Dashboard({
  uploadedFile, parsedData,
  activeTab, filters,
  onTabChange, onFiltersChange,
  onFileAccepted, onReset, onError, onToast,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const hasData = !!uploadedFile && !!parsedData

  const toggleSidebar = () => setSidebarOpen((prev) => !prev)
  const openAbout = () => setAboutOpen(true)
  const closeAbout = () => setAboutOpen(false)

  /* Apply active filters to rows for the Overview table */
  const filteredRows = hasData ? applyFilters(parsedData.rows, filters) : []

  function renderPanel() {
    switch (activeTab) {
      case 'explore': return <ExplorePanel parsedData={parsedData} />
      case 'charts':  return <ChartsPanel  parsedData={parsedData} />
      case 'filter':  return (
        <FilterPanel
          parsedData={parsedData}
          filters={filters}
          onFiltersChange={onFiltersChange}
        />
      )
      case 'export':  return (
        <ExportPanel
          parsedData={parsedData}
          uploadedFile={uploadedFile}
          filters={filters}
          onToast={onToast}
        />
      )
      default: return (
        <>
          <KpiCards parsedData={{ ...parsedData, rows: filteredRows }} />
          <DataChart parsedData={{ ...parsedData, rows: filteredRows }} />
          <DataTable parsedData={{ ...parsedData, rows: filteredRows }} filters={filters} />
        </>
      )
    }
  }

  return (
    <div className={styles.shell}>
      <Sidebar
        hasData={hasData}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        onOpenAbout={openAbout}
      />

      <div className={styles.main}>
        <Header
          uploadedFile={uploadedFile}
          onReset={onReset}
          hasData={hasData}
          activeTab={activeTab}
          filterCount={filters.length}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
          onOpenAbout={openAbout}
        />

        <main className={styles.content} id="main-content">
          {!hasData ? (
            <div className={styles.centerStage}>
              <div className={styles.heroText}>
                <h1 className={styles.heroTitle}>
                  Your Data,{' '}
                  <span className={styles.heroGradient}>Instantly Visualized</span>
                </h1>
                <p className={styles.heroSub}>
                  Drop a CSV or XLSX file below and watch your data come to life.
                  No account. No signup. Just results.
                </p>
              </div>
              <DropZone onFileAccepted={onFileAccepted} onError={onError} />
              <div className={styles.supportedFormats}>
                <span className={styles.formatTag}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  .CSV
                </span>
                <span className={styles.divider}>·</span>
                <span className={styles.formatTag}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  .XLSX
                </span>
                <span className={styles.divider}>·</span>
                <span className={styles.formatTagMuted}>Up to 20 MB</span>
              </div>
            </div>
          ) : (
            <div className={styles.dataView} key={activeTab}>
              {renderPanel()}
            </div>
          )}
        </main>
      </div>

      {/* About Modal */}
      <AboutModal isOpen={aboutOpen} onClose={closeAbout} />
    </div>
  )
}
