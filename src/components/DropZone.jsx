import { useState, useRef, useCallback } from 'react'
import { SAMPLE_DATA } from '../data/sampleData'
import FileSizeModal from './FileSizeModal'
import styles from './DropZone.module.css'

const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls']
const ACCEPTED_MIME = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]

function isValidFile(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase()
  return ACCEPTED_MIME.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext)
}


export default function DropZone({ onFileAccepted, onError }) {
  const [isDragOver, setIsDragOver]       = useState(false)
  const [isDragInvalid, setIsDragInvalid] = useState(false)
  const [isProcessing, setIsProcessing]   = useState(false)
  const [success, setSuccess]             = useState(false)
  const [showSizeError, setShowSizeError] = useState(false)
  const inputRef = useRef(null)

  const processFile = useCallback(async (file) => {
    if (!isValidFile(file)) {
      onError('Unsupported format. Please upload a .csv or .xlsx file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) { // 20MB Limit
      setShowSizeError(true)
      return
    }

    setIsProcessing(true)
    try {
      const ext = file.name.split('.').pop().toLowerCase()
      const isCSV = ext === 'csv'
      
      const payload = isCSV ? await file.text() : await file.arrayBuffer()
      
      const worker = new Worker(new URL('../workers/excelWorker.js', import.meta.url), { type: 'module' })
      
      const cleanData = await new Promise((resolve, reject) => {
        worker.onmessage = (e) => {
          if (e.data.success) {
            resolve(e.data.data)
          } else {
            reject(new Error(e.data.error))
          }
          worker.terminate()
        }
        worker.onerror = (e) => {
          reject(e)
          worker.terminate()
        }
        
        worker.postMessage({ type: isCSV ? 'csv' : 'xlsx', payload })
      })

      await new Promise((r) => setTimeout(r, 450)) // Smooth out animation
      setSuccess(true)
      await new Promise((r) => setTimeout(r, 400))
      onFileAccepted(file, cleanData)
    } catch (err) {
      console.error('File parse error:', err)
      onError('Failed to parse the file. Please check the format and try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [onFileAccepted, onError])

  const loadSample = useCallback(async () => {
    setIsProcessing(true)
    
    try {
      const fakeFile = { name: 'sample-sales-data.xlsx', size: 4096 }
      
      // We still need to process the sample data, so we can do it directly or via worker
      // For simplicity with the sample data, let's just use the worker structure simulation
      // Actually, since DataDoctor was moved to the worker, we should just dynamically import it here for the sample data or send it to the worker.
      // But a dynamic import is cleaner so we don't block the main thread for the sample either.
      const { runDataDoctor } = await import('../utils/dataDoctor.js')
      const sanitized = runDataDoctor(SAMPLE_DATA.headers, SAMPLE_DATA.rows)
      
      await new Promise((r) => setTimeout(r, 500))
      setSuccess(true)
      await new Promise((r) => setTimeout(r, 400))
      
      onFileAccepted(fakeFile, {
        headers: sanitized.headers,
        rows: sanitized.rows,
        doctorReport: sanitized.doctorReport,
      })
    } catch (e) {
      onError('Failed to load sample data')
    } finally {
      setIsProcessing(false)
    }
  }, [onFileAccepted, onError])

  /* ─── Drag handlers ────────────────────────────────────── */
  const onDragEnter = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    const items = Array.from(e.dataTransfer.items)
    const hasInvalid = items.some((it) => it.kind === 'file' && it.type && !ACCEPTED_MIME.includes(it.type))
    setIsDragInvalid(hasInvalid)
    setIsDragOver(true)
  }, [])

  const onDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation() }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false); setIsDragInvalid(false)
    }
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation()
    setIsDragOver(false); setIsDragInvalid(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  const onInputChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }, [processFile])

  /* ─── Derived class ────────────────────────────────────── */
  const zoneClass = [
    styles.zone,
    isDragOver && !isDragInvalid ? styles.zoneOver : '',
    isDragInvalid               ? styles.zoneInvalid : '',
    isProcessing                ? styles.zoneProcessing : '',
    success                     ? styles.zoneSuccess : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.wrapper}>
      <div
        id="drop-zone"
        className={zoneClass}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isProcessing && !success && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop your data file, or press Enter to browse"
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        {/* Corner accents */}
        <span className={`${styles.corner} ${styles.cornerTL}`} />
        <span className={`${styles.corner} ${styles.cornerTR}`} />
        <span className={`${styles.corner} ${styles.cornerBL}`} />
        <span className={`${styles.corner} ${styles.cornerBR}`} />
        <div className={styles.pulseRing} aria-hidden="true" />

        <input
          ref={inputRef}
          id="file-input"
          type="file"
          accept=".csv,.xlsx,.xls"
          className={styles.hiddenInput}
          onChange={onInputChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        {isProcessing ? (
          <ProcessingState />
        ) : success ? (
          <SuccessState />
        ) : isDragOver && isDragInvalid ? (
          <InvalidState />
        ) : isDragOver ? (
          <DragActiveState />
        ) : (
          <IdleState />
        )}
      </div>

      {/* Sample data CTA */}
      {!isProcessing && !success && (
        <button
          id="btn-sample-data"
          className={styles.sampleBtn}
          onClick={loadSample}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Don't have a file? Try Sample Sales Data
        </button>
      )}

      {/* Strict 20MB Limit Modal */}
      <FileSizeModal isOpen={showSizeError} onClose={() => setShowSizeError(false)} />
    </div>
  )
}

/* ─── State sub-components ─────────────────────────────── */

function IdleState() {
  return (
    <div className={styles.inner}>
      <div className={styles.iconWrap} aria-hidden="true">
        <svg className={styles.mainIcon} viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="38" stroke="url(#iconGrad)" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M40 52V28" stroke="url(#iconGrad)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 40l12-13 12 13" stroke="url(#iconGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="24" y="54" width="32" height="4" rx="2" fill="url(#iconGrad)" opacity="0.5" />
          <defs>
            <linearGradient id="iconGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className={styles.title}>Drag &amp; Drop Your Data File</p>
      <p className={styles.subtitle}>
        Drop a <code className={styles.code}>.csv</code> or{' '}
        <code className={styles.code}>.xlsx</code> file here, or{' '}
        <span className={styles.browseLink}>click to browse</span>
      </p>
    </div>
  )
}

function DragActiveState() {
  return (
    <div className={`${styles.inner} ${styles.innerActive}`}>
      <div className={styles.iconWrapActive} aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="url(#dropGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
          <defs>
            <linearGradient id="dropGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <p className={styles.titleActive}>Release to Upload</p>
      <p className={styles.subtitleActive}>Looking good — drop it!</p>
    </div>
  )
}

function InvalidState() {
  return (
    <div className={`${styles.inner} ${styles.innerInvalid}`}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      <p className={styles.titleInvalid}>Unsupported File Type</p>
      <p className={styles.subtitleInvalid}>Only .csv and .xlsx files are accepted</p>
    </div>
  )
}

function ProcessingState() {
  return (
    <div className={`${styles.inner} ${styles.innerProcessing}`}>
      <svg className={styles.spinner} width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke="var(--bg-elevated)" strokeWidth="3" />
        <circle className={styles.spinnerArc} cx="26" cy="26" r="22" fill="none"
          stroke="url(#spinGrad)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray="138" strokeDashoffset="100" />
        <defs>
          <linearGradient id="spinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <p className={styles.processingText}>Sanitizing with Data Doctor…</p>
      <div className={styles.dots}>
        <span className={styles.dot} style={{ animationDelay: '0s' }} />
        <span className={styles.dot} style={{ animationDelay: '0.15s' }} />
        <span className={styles.dot} style={{ animationDelay: '0.3s' }} />
      </div>
    </div>
  )
}

function SuccessState() {
  return (
    <div className={`${styles.inner} ${styles.innerSuccess}`}>
      <div className={styles.successIcon}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className={styles.successText}>Data sanitized &amp; ready</p>
    </div>
  )
}
