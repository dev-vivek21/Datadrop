/**
 * dataDoctor.js
 * Principal Engineer Grade Automated Data Sanitation Engine for DataDrop
 * 
 * Performs an automated client-side data sanitation loop right after SheetJS parses
 * spreadsheets into raw JSON objects:
 * 1. Trims whitespace from all string keys and values.
 * 2. Scans columns for missing, empty, or null cells and replaces them with 'N/A'.
 * 3. Detects column types cleanly and automatically parses formatted numeric strings
 *    (e.g., "$1,200", "  450  ", "1,234.56", "15%", "-$500.00") into pure JavaScript floats/integers.
 */

/**
 * Attempts to parse a value into a pure JavaScript number if it represents a valid numeric string.
 * Strips currency symbols ($ € £ ¥ ₹), thousands separators (,), percentages (%), and outer whitespace.
 *
 * @param {any} value
 * @returns {number | string}
 */
export function cleanAndParseNumber(value) {
  if (typeof value === 'number') {
    return isNaN(value) ? 'N/A' : value
  }
  if (typeof value !== 'string') return value

  const trimmed = value.trim()
  if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
    return 'N/A'
  }

  // Remove currency signs, commas, and percentage characters
  const cleanStr = trimmed
    .replace(/^[\$€£¥₹\s]+/, '')    // Remove leading currency symbols
    .replace(/[\$€£¥₹\s%]+$/, '')    // Remove trailing currency/percentage
    .replace(/,/g, '')               // Remove thousands separators

  // Check if remainder is a pure valid integer or floating-point number
  if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    const num = parseFloat(cleanStr)
    return isNaN(num) ? trimmed : num
  }

  return trimmed
}

/**
 * Executes the full automated client-side data sanitation loop.
 *
 * @param {Array<string>} headers Column headers
 * @param {Array<Object>} rawRows Parsed JSON rows from SheetJS
 * @returns {{ headers: Array<string>, rows: Array<Object>, doctorReport: Object }}
 */
export function runDataDoctor(headers = [], rawRows = []) {
  if (!Array.isArray(rawRows) || !rawRows.length) {
    return {
      headers: [],
      rows: [],
      doctorReport: {
        totalRows: 0,
        trimmedCells: 0,
        missingReplaced: 0,
        numericParsed: 0,
        numericColumns: [],
      },
    }
  }

  let trimmedCount = 0
  let missingReplacedCount = 0
  let numericParsedCount = 0

  // 1. Trim whitespace from all column header keys
  const cleanHeaders = headers.map((h, idx) => {
    const trimmedHeader = String(h ?? '').trim()
    return trimmedHeader || `Column_${idx + 1}`
  })

  // 2. Identify column candidate data types by sampling rows
  const colNumericScore = {}
  cleanHeaders.forEach((h) => {
    colNumericScore[h] = { numCount: 0, nonEmptyCount: 0 }
  })

  const sampleLimit = Math.min(rawRows.length, 100)
  for (let i = 0; i < sampleLimit; i++) {
    const row = rawRows[i]
    if (!row) continue
    cleanHeaders.forEach((h, idx) => {
      const origHeader = headers[idx]
      const orig = row[origHeader]
      if (orig !== null && orig !== undefined && String(orig).trim() !== '') {
        colNumericScore[h].nonEmptyCount++
        const parsed = cleanAndParseNumber(orig)
        if (typeof parsed === 'number') {
          colNumericScore[h].numCount++
        }
      }
    })
  }

  const numericColumns = new Set()
  cleanHeaders.forEach((h) => {
    const { numCount, nonEmptyCount } = colNumericScore[h]
    // If at least 65% of populated values in this column are numeric, classify as Numeric
    if (nonEmptyCount > 0 && numCount / nonEmptyCount >= 0.65) {
      numericColumns.add(h)
    }
  })

  // 3. Transform and cleanse every row
  const sanitizedRows = rawRows.map((row) => {
    const cleanRow = {}
    cleanHeaders.forEach((h, idx) => {
      const origHeader = headers[idx]
      const rawVal = row[origHeader]

      // Handle null, undefined, or empty strings
      if (
        rawVal === null ||
        rawVal === undefined ||
        (typeof rawVal === 'string' && rawVal.trim() === '')
      ) {
        cleanRow[h] = 'N/A'
        missingReplacedCount++
        return
      }

      // Handle strings: trim whitespace
      let val = rawVal
      if (typeof val === 'string') {
        const trimmed = val.trim()
        if (trimmed !== val) trimmedCount++
        val = trimmed
      }

      // If column is numeric, convert formatted strings into pure JavaScript numbers
      if (numericColumns.has(h)) {
        const parsed = cleanAndParseNumber(val)
        if (typeof parsed === 'number') {
          cleanRow[h] = parsed
          if (typeof val === 'string') numericParsedCount++
        } else {
          cleanRow[h] = 'N/A'
          missingReplacedCount++
        }
      } else {
        cleanRow[h] = val
      }
    })
    return cleanRow
  })

  return {
    headers: cleanHeaders,
    rows: sanitizedRows,
    doctorReport: {
      totalRows: sanitizedRows.length,
      trimmedCells: trimmedCount,
      missingReplaced: missingReplacedCount,
      numericParsed: numericParsedCount,
      numericColumns: Array.from(numericColumns),
    },
  }
}
