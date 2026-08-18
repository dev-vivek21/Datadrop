import * as XLSX from 'xlsx'
import { runDataDoctor } from '../utils/dataDoctor'

/** Parse CSV robustly using a simple state machine to handle quoted fields */
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (!lines.length) return { headers: [], rows: [] }

  const parseRow = (line) => {
    const fields = []
    let cur = '', inQuote = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++ }
        else inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        fields.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    fields.push(cur.trim())
    return fields
  }

  const headers = parseRow(lines[0])
  const rows = lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const vals = parseRow(line)
      const row = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    })
  return { headers, rows }
}

/** Parse XLSX/XLS using SheetJS — reads first sheet */
function parseXLSX(buffer) {
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  const ws = wb.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' })
  if (!rawRows.length) return { headers: [], rows: [] }
  const headers = Object.keys(rawRows[0])
  return { headers, rows: rawRows }
}

self.addEventListener('message', async (e) => {
  try {
    const { type, payload } = e.data
    let rawData

    if (type === 'csv') {
      rawData = parseCSV(payload)
    } else if (type === 'xlsx') {
      rawData = parseXLSX(payload)
    } else {
      throw new Error(`Unsupported file type: ${type}`)
    }

    if (!rawData.headers.length || !rawData.rows.length) {
      throw new Error('File appears to be empty or has no readable data.')
    }

    // Run the pristine Data Doctor sanitation loop completely off the main thread
    const sanitized = runDataDoctor(rawData.headers, rawData.rows)
    
    self.postMessage({
      success: true,
      data: {
        headers: sanitized.headers,
        rows: sanitized.rows,
        doctorReport: sanitized.doctorReport,
      }
    })
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message
    })
  }
})
