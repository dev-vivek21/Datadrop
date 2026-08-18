import { useCallback, useState } from 'react'
import * as XLSX from 'xlsx'
import { applyFilters, formatNumber } from '../../utils/dataUtils'
import { generatePDFReport } from '../../utils/pdfGenerator'
import { triggerBlobDownload, MIME_TYPES } from '../../utils/fileSaver'
import p from './Panel.module.css'
import styles from './ExportPanel.module.css'

export default function ExportPanel({ parsedData, uploadedFile, filters, onToast }) {
  const { headers = [], rows = [] } = parsedData ?? {}
  const [useFiltered, setUseFiltered] = useState(true)
  const [copying, setCopying] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null)

  const sourceRows = useFiltered ? applyFilters(rows, filters) : rows
  const hasFilters = filters && filters.length > 0
  const baseName   = (uploadedFile?.name || 'dataset').replace(/\.[^.]+$/, '')

  /* ── 1. CSV Download ── */
  const exportCSV = useCallback(async () => {
    try {
      const cleanRows = sourceRows.map((r) => {
        const item = {}
        headers.forEach((h) => { item[h] = r[h] ?? '' })
        return item
      })
      const ws = XLSX.utils.json_to_sheet(cleanRows, { header: headers })
      const csvRaw = XLSX.utils.sheet_to_csv(ws)
      // Prepend UTF-8 Byte Order Mark (\uFEFF)
      const csvContent = '\uFEFF' + csvRaw

      const downloadedName = await triggerBlobDownload(
        csvContent,
        `${baseName}_export`,
        'csv',
        MIME_TYPES.csv
      )
      if (downloadedName) {
        onToast?.(`Downloaded "${downloadedName}" (${sourceRows.length.toLocaleString()} rows)`, 'success')
      }
    } catch (err) {
      console.error('CSV Export Error:', err)
      onToast?.('Failed to download CSV file', 'error')
    }
  }, [headers, sourceRows, baseName, onToast])

  /* ── 2. Excel Workbook (.xlsx) Download ── */
  const exportXLSX = useCallback(async () => {
    try {
      const cleanRows = sourceRows.map((r) => {
        const item = {}
        headers.forEach((h) => { item[h] = r[h] ?? '' })
        return item
      })
      const ws = XLSX.utils.json_to_sheet(cleanRows, { header: headers })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Data')

      const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

      const downloadedName = await triggerBlobDownload(
        xlsxBuffer,
        `${baseName}_export`,
        'xlsx',
        MIME_TYPES.xlsx
      )
      if (downloadedName) {
        onToast?.(`Downloaded "${downloadedName}" (${sourceRows.length.toLocaleString()} rows)`, 'success')
      }
    } catch (err) {
      console.error('XLSX Export Error:', err)
      onToast?.('Failed to download Excel file', 'error')
    }
  }, [headers, sourceRows, baseName, onToast])

  /* ── 3. PDF Executive Report Download (Binary ArrayBuffer) ── */
  const exportPDF = useCallback(async () => {
    try {
      const doc = generatePDFReport({
        headers,
        rows: sourceRows,
        fileName: uploadedFile?.name ?? 'dataset',
        filters: hasFilters && useFiltered ? filters : [],
        title: `${baseName.toUpperCase()} — Executive Report`,
      })
      const pdfBuffer = doc.output('arraybuffer')

      const downloadedName = await triggerBlobDownload(
        pdfBuffer,
        `${baseName}_report`,
        'pdf',
        MIME_TYPES.pdf
      )
      if (downloadedName) {
        onToast?.(`Downloaded "${downloadedName}"`, 'success')
      }
    } catch (err) {
      console.error('PDF Export Error:', err)
      onToast?.('Failed to generate and download PDF report', 'error')
    }
  }, [headers, sourceRows, uploadedFile, hasFilters, useFiltered, filters, baseName, onToast])

  /* ── 4. JSON Download ── */
  const exportJSON = useCallback(async () => {
    try {
      const cleanRows = sourceRows.map((r) => {
        const item = {}
        headers.forEach((h) => { item[h] = r[h] ?? '' })
        return item
      })
      const jsonStr = JSON.stringify(cleanRows, null, 2)

      const downloadedName = await triggerBlobDownload(
        jsonStr,
        `${baseName}_export`,
        'json',
        MIME_TYPES.json
      )
      if (downloadedName) {
        onToast?.(`Downloaded "${downloadedName}" (${sourceRows.length.toLocaleString()} records)`, 'success')
      }
    } catch (err) {
      console.error('JSON Export Error:', err)
      onToast?.('Failed to download JSON file', 'error')
    }
  }, [headers, sourceRows, baseName, onToast])

  /* ── 5. Preview PDF in Modal ── */
  const previewPDF = useCallback(() => {
    try {
      const doc = generatePDFReport({
        headers,
        rows: sourceRows,
        fileName: uploadedFile?.name ?? 'dataset',
        filters: hasFilters && useFiltered ? filters : [],
        title: `${baseName.toUpperCase()} — Executive Report`,
      })
      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)
      setPdfPreviewUrl(url)
      onToast?.('PDF preview ready', 'info')
    } catch (err) {
      console.error('PDF Preview Error:', err)
      onToast?.('Failed to open PDF preview', 'error')
    }
  }, [headers, sourceRows, uploadedFile, hasFilters, useFiltered, filters, baseName, onToast])

  /* ── 6. Copy CSV to Clipboard ── */
  const copyCSV = useCallback(async () => {
    setCopying(true)
    try {
      const cleanRows = sourceRows.map((r) => {
        const item = {}
        headers.forEach((h) => { item[h] = r[h] ?? '' })
        return item
      })
      const ws = XLSX.utils.json_to_sheet(cleanRows, { header: headers })
      const csvOutput = XLSX.utils.sheet_to_csv(ws)
      await navigator.clipboard.writeText(csvOutput)
      onToast?.('CSV data copied to clipboard!', 'success')
    } catch {
      onToast?.('Clipboard access denied', 'error')
    }
    setTimeout(() => setCopying(false), 1200)
  }, [headers, sourceRows, onToast])

  const fmtRows = (n) => `${n.toLocaleString()} row${n !== 1 ? 's' : ''}`

  return (
    <div className={p.panel}>
      {/* Header */}
      <div className={p.panelHeader}>
        <div>
          <h2 className={p.panelTitle}>
            <span className={p.panelTitleIcon} style={{ background: 'rgba(0,102,204,0.1)', color: '#0066CC' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            Export & Reports
          </h2>
          <p className={p.panelSub}>Download verified data formats with guaranteed extensions (.pdf, .csv, .xlsx, .json)</p>
        </div>
      </div>

      {/* Row scope toggle if filters active */}
      {hasFilters && (
        <div className={`${p.card} ${styles.scopeCard}`}>
          <p className={styles.scopeLabel}>Which rows to export?</p>
          <div className={styles.scopeButtons}>
            <button
              id="export-scope-filtered"
              className={`${styles.scopeBtn} ${useFiltered ? styles.scopeBtnActive : ''}`}
              onClick={() => setUseFiltered(true)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filtered rows
              <span className={styles.scopeCount}>{applyFilters(rows, filters).length.toLocaleString()}</span>
            </button>
            <button
              id="export-scope-all"
              className={`${styles.scopeBtn} ${!useFiltered ? styles.scopeBtnActive : ''}`}
              onClick={() => setUseFiltered(false)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              All rows
              <span className={styles.scopeCount}>{rows.length.toLocaleString()}</span>
            </button>
          </div>
        </div>
      )}

      {/* Export Format Cards Grid */}
      <div className={styles.formatGrid}>

        {/* 1. PDF Executive Report */}
        <div className={`${p.card} ${styles.formatCard} ${styles.highlightCard}`}>
          <div className={styles.formatIcon} style={{ background: 'rgba(239,68,68,0.1)', color: '#DC2626' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div className={styles.formatInfo}>
            <div className={styles.cardHeaderWithBadge}>
              <p className={styles.formatName}>PDF Executive Report</p>
              <span className={styles.featuredBadge}>Full Report</span>
            </div>
            <p className={styles.formatDesc}>Complete structured document with executive KPI summary, header branding, and formatted tabular records.</p>
            <p className={styles.formatMeta}>{fmtRows(sourceRows.length)} • Guaranteed .pdf file</p>
          </div>
          <div className={styles.buttonGroup}>
            <button id="btn-export-pdf" className={`${p.glassBtn} ${p.glassBtnPrimary} ${styles.formatBtn}`} onClick={exportPDF}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </button>
            <button id="btn-preview-pdf" className={`${p.glassBtn} ${styles.formatBtn}`} onClick={previewPDF} title="View report in browser">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              </svg>
              Preview
            </button>
          </div>
        </div>

        {/* 2. CSV File */}
        <div className={`${p.card} ${styles.formatCard}`}>
          <div className={styles.formatIcon} style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div className={styles.formatInfo}>
            <p className={styles.formatName}>CSV Spreadsheet</p>
            <p className={styles.formatDesc}>Clean UTF-8 format with Excel BOM for 100% compatible parsing in Excel, Sheets & PowerBI.</p>
            <p className={styles.formatMeta}>{fmtRows(sourceRows.length)} • Guaranteed .csv file</p>
          </div>
          <button id="btn-export-csv" className={`${p.glassBtn} ${styles.formatBtn}`} onClick={exportCSV}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download .csv
          </button>
        </div>

        {/* 3. Excel (.xlsx) */}
        <div className={`${p.card} ${styles.formatCard}`}>
          <div className={styles.formatIcon} style={{ background: 'rgba(2,132,199,0.1)', color: '#0284C7' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </div>
          <div className={styles.formatInfo}>
            <p className={styles.formatName}>Excel Workbook (.xlsx)</p>
            <p className={styles.formatDesc}>Native Microsoft Excel open XML format with typed rows and column headers.</p>
            <p className={styles.formatMeta}>{fmtRows(sourceRows.length)} • Guaranteed .xlsx file</p>
          </div>
          <button id="btn-export-xlsx" className={`${p.glassBtn} ${styles.formatBtn}`} onClick={exportXLSX}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download .xlsx
          </button>
        </div>

        {/* 4. JSON Array */}
        <div className={`${p.card} ${styles.formatCard}`}>
          <div className={styles.formatIcon} style={{ background: 'rgba(245,158,11,0.1)', color: '#D97706' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div className={styles.formatInfo}>
            <p className={styles.formatName}>JSON Data</p>
            <p className={styles.formatDesc}>Strict JSON array of objects, verified structure ready for APIs and code consumption.</p>
            <p className={styles.formatMeta}>{fmtRows(sourceRows.length)} • Guaranteed .json file</p>
          </div>
          <button id="btn-export-json" className={`${p.glassBtn} ${styles.formatBtn}`} onClick={exportJSON}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download .json
          </button>
        </div>

        {/* 5. Copy to Clipboard */}
        <div className={`${p.card} ${styles.formatCard}`}>
          <div className={styles.formatIcon} style={{ background: 'rgba(0,102,204,0.1)', color: '#0066CC' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          </div>
          <div className={styles.formatInfo}>
            <p className={styles.formatName}>Copy CSV to Clipboard</p>
            <p className={styles.formatDesc}>Quickly paste dataset into spreadsheets, text editors, or documentation.</p>
            <p className={styles.formatMeta}>{fmtRows(sourceRows.length)}</p>
          </div>
          <button id="btn-copy-csv" className={`${p.glassBtn} ${styles.formatBtn}`} onClick={copyCSV} disabled={copying}>
            {copying ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg> Copied!</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> Copy CSV</>
            )}
          </button>
        </div>

      </div>

      {/* Dataset Summary */}
      <div className={`${p.card} ${styles.summaryCard}`}>
        <p className={styles.summaryTitle}>Dataset Summary</p>
        <div className={styles.summaryGrid}>
          <Stat label="Total Rows" value={rows.length.toLocaleString()} color="#0066CC" />
          <Stat label="Columns" value={headers.length.toLocaleString()} color="#7C3AED" />
          {hasFilters && <Stat label="After Filters" value={applyFilters(rows, filters).length.toLocaleString()} color="#059669" />}
          <Stat label="Source File" value={uploadedFile?.name ?? '—'} color="#D97706" small />
        </div>
      </div>

      {/* PDF Preview Modal */}
      {pdfPreviewUrl && (
        <div className={styles.modalOverlay} onClick={() => setPdfPreviewUrl(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleArea}>
                <span className={styles.pdfBadge}>PDF</span>
                <h3 className={styles.modalTitle}>{baseName} — Report Preview</h3>
              </div>
              <div className={styles.modalActions}>
                <button
                  className={`${p.glassBtn} ${p.glassBtnPrimary}`}
                  onClick={exportPDF}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download PDF
                </button>
                <button
                  id="btn-close-pdf-modal"
                  className={styles.modalCloseBtn}
                  onClick={() => setPdfPreviewUrl(null)}
                  aria-label="Close preview"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              <iframe
                id="pdf-preview-iframe"
                src={pdfPreviewUrl}
                title="PDF Report Preview"
                className={styles.pdfIframe}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color, small }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#86868B' }}>{label}</span>
      <span style={{ fontSize: small ? '0.85rem' : '1.35rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color, letterSpacing: '-0.03em', lineHeight: 1.1 }}>{value}</span>
    </div>
  )
}
