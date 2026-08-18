/**
 * dataUtils.js
 * Pure utility functions for analysing parsed row/column data.
 */

/** Return all numeric-valued column names from rows */
export function getNumericColumns(headers, rows) {
  if (!rows.length) return []
  return headers.filter((h) => {
    const sample = rows
      .slice(0, 50)
      .map((r) => r[h])
      .filter((v) => v !== '' && v !== 'N/A' && v !== null && v !== undefined)
    return (
      sample.length > 0 &&
      sample.every((v) => typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== ''))
    )
  })
}

/** Return all string/categorical column names */
export function getCategoryColumns(headers, rows) {
  const numCols = new Set(getNumericColumns(headers, rows))
  return headers.filter((h) => !numCols.has(h))
}

/** Compute KPI stats for the first numeric column */
export function computeKPIs(rows, numericCols) {
  if (!rows.length || !numericCols.length) {
    return { rowCount: rows.length, sum: 0, avg: 0, primaryCol: null }
  }

  // Pick the column with the largest total as "primary"
  const colTotals = numericCols.map((col) => ({
    col,
    total: rows.reduce((acc, r) => {
      const v = r[col]
      const num = typeof v === 'number' ? v : Number(v)
      return acc + (isNaN(num) ? 0 : num)
    }, 0),
  }))
  colTotals.sort((a, b) => b.total - a.total)
  const primaryCol = colTotals[0].col
  const sum = colTotals[0].total
  const avg = sum / (rows.length || 1)

  return { rowCount: rows.length, sum, avg, primaryCol }
}

/**
 * Build chart data: group rows by the first category column,
 * summing up to 3 numeric columns per group.
 * Returns top 10 groups by primary numeric value.
 */
export function buildChartData(rows, numericCols, primaryCol, catCols) {
  if (!rows.length || !numericCols.length || !catCols.length) return []

  const groupCol = catCols[0]
  const valueCol = primaryCol || numericCols[0]
  const extraCols = numericCols.filter((c) => c !== valueCol).slice(0, 2)

  const groups = {}
  rows.forEach((row) => {
    const rawKey = row[groupCol]
    const key = rawKey === null || rawKey === undefined || rawKey === '' ? 'N/A' : String(rawKey)
    if (!groups[key]) {
      groups[key] = { name: key, [valueCol]: 0 }
      extraCols.forEach((c) => { groups[key][c] = 0 })
    }
    const val = typeof row[valueCol] === 'number' ? row[valueCol] : Number(row[valueCol])
    groups[key][valueCol] += isNaN(val) ? 0 : val

    extraCols.forEach((c) => {
      const extraVal = typeof row[c] === 'number' ? row[c] : Number(row[c])
      groups[key][c] += isNaN(extraVal) ? 0 : extraVal
    })
  })

  return Object.values(groups)
    .sort((a, b) => b[valueCol] - a[valueCol])
    .slice(0, 10)
}

/** Format large numbers nicely */
export function formatNumber(n) {
  if (n === null || n === undefined || n === '' || n === 'N/A') return 'N/A'
  const num = typeof n === 'number' ? n : Number(n)
  if (isNaN(num)) return String(n)

  if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  if (Number.isInteger(num)) return num.toLocaleString()
  return Number(num).toFixed(2)
}

/** Apply filter rules to data rows */
export function applyFilters(rows, filters) {
  if (!filters || !filters.length) return rows
  return rows.filter((row) =>
    filters.every(({ col, op, value }) => {
      const cell = String(row[col] ?? '').toLowerCase()
      const val  = String(value ?? '').toLowerCase()
      const num  = typeof row[col] === 'number' ? row[col] : parseFloat(row[col])
      const numV = parseFloat(value)

      switch (op) {
        case 'equals':       return cell === val
        case 'not_equals':   return cell !== val
        case 'contains':     return cell.includes(val)
        case 'not_contains': return !cell.includes(val)
        case 'starts_with':  return cell.startsWith(val)
        case 'ends_with':    return cell.endsWith(val)
        case 'gt':           return !isNaN(num) && !isNaN(numV) && num > numV
        case 'gte':          return !isNaN(num) && !isNaN(numV) && num >= numV
        case 'lt':           return !isNaN(num) && !isNaN(numV) && num < numV
        case 'lte':          return !isNaN(num) && !isNaN(numV) && num <= numV
        case 'is_empty':     return cell === '' || cell === 'null' || cell === 'undefined' || cell === 'n/a'
        case 'not_empty':    return cell !== '' && cell !== 'null' && cell !== 'undefined' && cell !== 'n/a'
        default:             return true
      }
    })
  )
}
