import { useEffect, useState } from 'react'
import styles from './Toast.module.css'

/**
 * Toast — floating error/info notification at bottom-right.
 * Props:
 *   message  {string}   — text to display
 *   type     {string}   — 'error' | 'success' | 'info'
 *   onClose  {function} — called when toast should be dismissed
 *   duration {number}   — auto-dismiss ms (default 4500)
 */
export default function Toast({ message, type = 'error', onClose, duration = 4500 }) {
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    // Mount → animate in
    const tIn = setTimeout(() => setVisible(true), 10)
    // Auto-dismiss
    const tOut = setTimeout(() => dismiss(), duration)
    return () => { clearTimeout(tIn); clearTimeout(tOut) }
  }, [duration])

  const dismiss = () => {
    setLeaving(true)
    setTimeout(() => onClose?.(), 320)
  }

  const icons = {
    error: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    success: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    info: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        styles.toast,
        styles[type],
        visible && !leaving ? styles.visible : '',
        leaving ? styles.leaving : '',
      ].filter(Boolean).join(' ')}
    >
      <span className={styles.icon}>{icons[type]}</span>
      <span className={styles.message}>{message}</span>
      <button
        id="toast-close"
        className={styles.close}
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
