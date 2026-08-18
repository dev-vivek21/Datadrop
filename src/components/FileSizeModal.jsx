import { useEffect } from 'react'
import styles from './FileSizeModal.module.css'

export default function FileSizeModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        
        <div className={styles.iconWrap}>
          <span className={styles.icon}>⚠️</span>
        </div>
        
        <h2 className={styles.title}>File Size Limit Exceeded</h2>
        
        <p className={styles.description}>
          To maintain optimal client-side privacy and performance, DataDrop accepts spreadsheets up to <strong>20MB</strong>.
        </p>
        <p className={styles.description}>
          Please filter your data or upload a smaller file.
        </p>
        
        <button className={styles.actionBtn} onClick={onClose}>
          Understood
        </button>
      </div>
    </div>
  )
}
