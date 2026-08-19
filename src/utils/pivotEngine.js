/**
 * pivotEngine.js
 * Efficient single-pass pivot table computation.
 * No external dependencies.
 */

import { extractDatePart } from './fieldIntelligence.js'

const MAX_KEYS = 200  // cap row/col keys to prevent DOM flooding

/**
 * Aggregate a list of numeric values using the chosen function.
 */
export function aggregate(values, agg) {
  const nums = values.filter((v) => v !== null && !isNaN(v))
  if (!nums.length) return null
  switch (agg) {
    case 'sum':   return nums.reduce((a, b) => a + b, 0)
    case 'avg':   return nums.reduce((a, b) => a + b, 0) / nums.length
    case 'count': return nums.length
    case 'min':   return Math.min(...nums)
    case 'max':   return Math.max(...nums)
    default:      return nums.reduce((a, b) => a + b, 0)
  }
}

/**
 * Compute a pivot table in a single pass over the rows.
 *
 * @param {object}   opts
 * @param {object[]} opts.rows         - all data rows
 * @param {string}   opts.rowDim       - column name for row dimension
 * @param {string}   opts.colDim       - column name for col dimension ('' = none)
 * @param {string}   opts.valDim       - column name for value to aggregate
 * @param {string}   opts.agg          - 'sum'|'avg'|'count'|'min'|'max'
 * @param {string}   opts.dateLevel    - 'year'|'quarter'|'month'|'day' (when rowDim/colDim is date)
 * @param {boolean}  opts.rowIsDate    - true if rowDim is a date column
 * @param {boolean}  opts.colIsDate    - true if colDim is a date column
 * @returns {{ rowKeys: string[], colKeys: string[], cells: Record<string,Record<string,number|null>>, totals: Record<string,number|null> }}
 */
export function computePivot({
  rows,
  rowDim,
  colDim,
  valDim,
  agg = 'sum',
  dateLevel = 'month',
  rowIsDate = false,
  colIsDate = false,
}) {
  if (!rows.length || !rowDim || !valDim) {
    return { rowKeys: [], colKeys: [], cells: {}, totals: {} }
  }

  // Accumulate raw values per [rowKey][colKey]
  // Structure: acc[rowKey][colKey] = number[]
  const acc = {}
  const colKeySet = new Set()

  const hasColDim = Boolean(colDim)

  rows.forEach((row) => {
    let rk = String(row[rowDim] ?? 'Unknown')
    if (rowIsDate) rk = extractDatePart(row[rowDim], dateLevel)

    let ck = hasColDim ? String(row[colDim] ?? 'Unknown') : '__total__'
    if (colIsDate && hasColDim) ck = extractDatePart(row[colDim], dateLevel)

    const rawVal = row[valDim]
    const num    = rawVal !== undefined && rawVal !== null && rawVal !== ''
      ? (typeof rawVal === 'number' ? rawVal : Number(rawVal))
      : null

    if (!acc[rk]) acc[rk] = {}
    if (!acc[rk][ck]) acc[rk][ck] = []
    if (num !== null && !isNaN(num)) acc[rk][ck].push(num)

    colKeySet.add(ck)
  })

  // Build sorted key lists (cap at MAX_KEYS)
  let rowKeys = Object.keys(acc).slice(0, MAX_KEYS)
  let colKeys = hasColDim
    ? Array.from(colKeySet).slice(0, MAX_KEYS)
    : ['__total__']

  // Sort row keys: try numeric, fall back to alphabetic
  rowKeys = sortKeys(rowKeys)
  colKeys = hasColDim ? sortKeys(colKeys) : colKeys

  // Build aggregated cells
  const cells = {}
  const totals = {}

  rowKeys.forEach((rk) => {
    cells[rk] = {}
    const rowVals = []
    colKeys.forEach((ck) => {
      const vals = acc[rk]?.[ck] ?? []
      const result = vals.length ? aggregate(vals, agg) : null
      cells[rk][ck] = result
      if (result !== null) rowVals.push(...vals)
    })
    totals[rk] = rowVals.length ? aggregate(rowVals, agg) : null
  })

  // Column totals
  const colTotals = {}
  colKeys.forEach((ck) => {
    const allVals = rowKeys.flatMap((rk) => acc[rk]?.[ck] ?? [])
    colTotals[ck] = allVals.length ? aggregate(allVals, agg) : null
  })

  return { rowKeys, colKeys, cells, totals, colTotals }
}

function sortKeys(keys) {
  // If all keys are parseable as numbers, sort numerically
  if (keys.every((k) => !isNaN(Number(k)))) {
    return keys.sort((a, b) => Number(a) - Number(b))
  }
  // If they look like dates (YYYY-...), sort lexicographically (ISO-safe)
  return keys.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

/**
 * Build simple grouped chart data (one dimension → one value).
 * Used by BI dashboard template charts.
 *
 * @param {object[]} rows
 * @param {string}   dimCol       - category or date column
 * @param {string}   valCol       - numeric column
 * @param {string}   agg          - aggregation
 * @param {boolean}  isDate
 * @param {string}   dateLevel
 * @param {number}   limit
 * @returns {{ name: string, value: number }[]}
 */
export function buildGroupedChartData({
  rows,
  dimCol,
  valCol,
  agg = 'sum',
  isDate = false,
  dateLevel = 'month',
  limit = 15,
}) {
  if (!rows.length || !dimCol || !valCol) return []

  const acc = {}

  rows.forEach((row) => {
    let key = String(row[dimCol] ?? 'Unknown')
    if (isDate) key = extractDatePart(row[dimCol], dateLevel)

    const rawVal = row[valCol]
    const num = rawVal !== undefined && rawVal !== null && rawVal !== ''
      ? (typeof rawVal === 'number' ? rawVal : Number(rawVal))
      : null

    if (!acc[key]) acc[key] = []
    if (num !== null && !isNaN(num)) acc[key].push(num)
  })

  return Object.entries(acc)
    .map(([name, vals]) => ({ name, value: vals.length ? aggregate(vals, agg) : 0 }))
    .sort((a, b) => {
      if (isDate) return a.name.localeCompare(b.name, undefined, { numeric: true })
      return b.value - a.value
    })
    .slice(0, limit)
}

/**
 * Compute a simple KPI total for one column.
 */
export function computeKPI(rows, col, agg = 'sum') {
  const vals = rows
    .map((r) => r[col])
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => (typeof v === 'number' ? v : Number(v)))
    .filter((n) => !isNaN(n))

  if (!vals.length) return null
  return aggregate(vals, agg)
}
