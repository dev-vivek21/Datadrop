/**
 * fileSaver.js
 * Bulletproof client-side file download engine.
 * Solves premature URL revocation and detached anchor bugs in Chrome/Windows.
 */

export const MIME_TYPES = {
  csv:  'text/csv;charset=utf-8;',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf:  'application/pdf',
  json: 'application/json;charset=utf-8;',
  txt:  'text/plain;charset=utf-8;',
}

/**
 * Triggers a client-side file download by constructing a dynamic Blob with an explicit MIME type,
 * creating a temporary <a> anchor element with the exact file extension in the download attribute,
 * and dispatching a native click without premature DOM detachment.
 *
 * @param {Blob | ArrayBuffer | Uint8Array | string} content Raw file content
 * @param {string} baseName Target file base name
 * @param {'csv' | 'xlsx' | 'pdf' | 'json' | 'txt'} extension File extension (e.g. 'csv', 'xlsx', 'pdf')
 * @param {string} [explicitMimeType] Explicit MIME type for the Blob
 * @returns {Promise<string|null>} The full filename that was downloaded, or null if cancelled
 */
export async function triggerBlobDownload(content, baseName, extension, explicitMimeType) {
  const cleanExt = extension.replace(/^\./, '').toLowerCase()
  const mime = explicitMimeType || MIME_TYPES[cleanExt] || 'application/octet-stream'

  // 1. Sanitize base filename and explicitly append extension
  const cleanBase = (baseName || 'export')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .replace(/_+/g, '_') || 'export'
  const fullFileName = `${cleanBase}.${cleanExt}`

  // 2. Construct dynamic Blob
  let blob
  if (content instanceof Blob) {
    blob = content
  } else if (content instanceof ArrayBuffer) {
    blob = new Blob([new Uint8Array(content)], { type: mime })
  } else if (content instanceof Uint8Array) {
    blob = new Blob([content], { type: mime })
  } else if (typeof content === 'string') {
    blob = new Blob([content], { type: mime })
  } else {
    blob = new Blob([JSON.stringify(content, null, 2)], { type: mime })
  }
  // 3. Modern Chrome/Edge: File System Access API (Native Save Dialog)
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fullFileName,
        types: [{
          description: `${extension.toUpperCase()} File`,
          accept: { [mime]: [`.${cleanExt}`] }
        }]
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return handle.name
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled the native save dialog
        return null
      }
      // If it fails for another reason, fallback to anchor method
      console.warn('File System API failed, falling back to anchor download:', err)
    }
  }

  // 4. Fallback for IE / Legacy Edge
  if (typeof window !== 'undefined' && window.navigator && typeof window.navigator.msSaveOrOpenBlob === 'function') {
    window.navigator.msSaveOrOpenBlob(blob, fullFileName)
    return fullFileName
  }

  // 5. Create Object URL
  const blobUrl = window.URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.style.display = 'none'
  anchor.href = blobUrl
  anchor.download = fullFileName
  
  document.body.appendChild(anchor)
  anchor.click()

  // Cleanup
  setTimeout(() => {
    try {
      if (anchor.parentNode) {
        anchor.parentNode.removeChild(anchor)
      }
      window.URL.revokeObjectURL(blobUrl)
    } catch (e) {
      console.error(e)
    }
  }, 100)

  return fullFileName
}
