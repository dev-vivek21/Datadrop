/**
 * fieldIntelligence.js
 * Fuzzy field-role detection, template recommendation and column mapping.
 * No external dependencies — pure regex-based pattern matching.
 */

// ─── Field Role Patterns ──────────────────────────────────────────────────────
const FIELD_PATTERNS = {
  sales:    /sale|revenue|amount|income|net.*(sale|rev)|gross|turnover|receipts|proceeds/i,
  profit:   /profit|margin|earning|net.*(income|profit|earn)|gain|ebit|ebitda/i,
  cost:     /cost|expense|spend|expenditure|overhead|outlay|cogs|budget/i,
  quantity: /qty|quantity|count|unit|volume|number.*of|num|pieces|items.*sold/i,
  date:     /date|time|period|week|month|year|day|quarter|created|updated|order.*date|sale.*date/i,
  region:   /region|territory|area|location|zone|city|state|country|province|district|geo/i,
  product:  /product|item|sku|name|title|description|model|article|goods/i,
  customer: /customer|client|user|account|buyer|consumer|member|patron/i,
  category: /category|segment|type|group|class|division|department|brand|subcategory/i,
  order:    /order|invoice|transaction|ticket|reference|record/i,
}

/**
 * Detect the most likely role for a single column header.
 * Returns the role string or null if no pattern matches.
 */
export function detectFieldRole(header) {
  for (const [role, pattern] of Object.entries(FIELD_PATTERNS)) {
    if (pattern.test(header)) return role
  }
  return null
}

/**
 * Build a field-role map for all headers.
 * Returns: { sales: 'Sales', date: 'Order Date', region: 'Region', ... }
 * First match per role wins. Multiple columns can share a role;
 * only the first found is stored in the primary map.
 */
export function buildFieldMap(headers) {
  const map = {}
  const allMatches = {}

  headers.forEach((h) => {
    const role = detectFieldRole(h)
    if (role) {
      if (!map[role]) map[role] = h          // primary mapping
      if (!allMatches[role]) allMatches[role] = []
      allMatches[role].push(h)
    }
  })

  return { primary: map, all: allMatches }
}

// ─── Template Definitions ─────────────────────────────────────────────────────
export const TEMPLATES = [
  {
    id: 'sales',
    label: 'Sales Dashboard',
    description: 'Revenue, orders, profit, and product performance over time.',
    icon: '📈',
    color: '#0066CC',
    bg: 'rgba(0,102,204,0.08)',
    requiredRoles: ['sales'],
    bonusRoles:    ['profit', 'date', 'region', 'product', 'category', 'quantity'],
    kpis:          ['sales', 'profit', 'quantity', 'order'],
    charts: [
      { type: 'bar',  dim: 'product',  val: 'sales',  title: 'Sales by Product' },
      { type: 'area', dim: 'date',     val: 'sales',  title: 'Revenue Trend' },
      { type: 'pie',  dim: 'region',   val: 'sales',  title: 'Sales by Region' },
    ],
    pivotDefault: { rows: 'region', cols: 'date', val: 'sales' },
  },
  {
    id: 'customer',
    label: 'Customer Dashboard',
    description: 'Customer counts, segments, regions and growth trends.',
    icon: '👥',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.08)',
    requiredRoles: ['customer'],
    bonusRoles:    ['region', 'date', 'category', 'sales'],
    kpis:          ['customer', 'sales', 'quantity'],
    charts: [
      { type: 'bar',  dim: 'customer', val: 'sales',    title: 'Top Customers' },
      { type: 'area', dim: 'date',     val: 'customer', title: 'Customer Trend' },
      { type: 'pie',  dim: 'region',   val: 'customer', title: 'Customers by Region' },
    ],
    pivotDefault: { rows: 'region', cols: 'date', val: 'customer' },
  },
  {
    id: 'inventory',
    label: 'Inventory Dashboard',
    description: 'Stock levels, categories, and inventory value analysis.',
    icon: '📦',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.08)',
    requiredRoles: ['quantity'],
    bonusRoles:    ['product', 'category', 'cost', 'sales'],
    kpis:          ['quantity', 'cost', 'sales'],
    charts: [
      { type: 'bar',  dim: 'category', val: 'quantity', title: 'Stock by Category' },
      { type: 'bar',  dim: 'product',  val: 'quantity', title: 'Top Products by Stock' },
      { type: 'pie',  dim: 'category', val: 'cost',     title: 'Inventory Value by Category' },
    ],
    pivotDefault: { rows: 'category', cols: 'product', val: 'quantity' },
  },
  {
    id: 'finance',
    label: 'Finance Dashboard',
    description: 'Revenue, expenses, profit margins, and financial trends.',
    icon: '💰',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.08)',
    requiredRoles: ['sales', 'cost'],
    bonusRoles:    ['profit', 'date', 'category'],
    kpis:          ['sales', 'cost', 'profit'],
    charts: [
      { type: 'bar',  dim: 'category', val: 'sales',  title: 'Revenue by Category' },
      { type: 'area', dim: 'date',     val: 'profit', title: 'Profit Trend' },
      { type: 'pie',  dim: 'category', val: 'cost',   title: 'Expenses by Category' },
    ],
    pivotDefault: { rows: 'category', cols: 'date', val: 'profit' },
  },
  {
    id: 'blank',
    label: 'Blank Dashboard',
    description: 'Start from scratch — build your own custom BI dashboard.',
    icon: '✦',
    color: '#86868B',
    bg: 'rgba(134,134,139,0.08)',
    requiredRoles: [],
    bonusRoles:    [],
    kpis:          [],
    charts:        [],
    pivotDefault:  { rows: null, cols: null, val: null },
  },
]

/**
 * Score a template against the detected field map.
 * Returns a number 0–100.
 */
function scoreTemplate(template, fieldMap) {
  if (template.id === 'blank') return 0

  const required = template.requiredRoles.filter((r) => fieldMap[r]).length
  const bonus    = template.bonusRoles.filter((r) => fieldMap[r]).length

  const reqWeight  = 60
  const bonusWeight = 40

  const reqScore  = template.requiredRoles.length
    ? (required / template.requiredRoles.length) * reqWeight
    : 0
  const bonusScore = template.bonusRoles.length
    ? (bonus / template.bonusRoles.length) * bonusWeight
    : 0

  // If required fields are not met at all, score 0
  if (template.requiredRoles.length > 0 && required === 0) return 0

  return Math.round(reqScore + bonusScore)
}

/**
 * Recommend the best template and provide a human-readable reason.
 * Returns: { template, score, reason, fieldMap }
 */
export function recommendTemplate(headers, rows) {
  const { primary: fieldMap, all: allMatches } = buildFieldMap(headers)

  const scored = TEMPLATES
    .filter((t) => t.id !== 'blank')
    .map((t) => ({ template: t, score: scoreTemplate(t, fieldMap) }))
    .sort((a, b) => b.score - a.score)

  const best  = scored[0]
  const found = Object.keys(fieldMap).join(', ')

  let reason = ''
  if (best && best.score > 0) {
    const matchedCols = Object.values(fieldMap).slice(0, 5).join(', ')
    reason = `We detected ${matchedCols} and other fields that match this template.`
  } else {
    reason = 'No specific fields detected. Try the Blank Dashboard to build your own.'
  }

  return {
    template: best?.score > 0 ? best.template : TEMPLATES.find((t) => t.id === 'blank'),
    score:    best?.score ?? 0,
    reason,
    fieldMap,
  }
}

/**
 * Map a template's required chart dimensions to actual column names.
 * Returns chart configs with real column names substituted.
 */
export function mapTemplateCharts(template, fieldMap, numericCols) {
  return template.charts.map((chart) => {
    const dimCol = fieldMap[chart.dim] || null
    const valCol = fieldMap[chart.val] || numericCols[0] || null
    return { ...chart, dimCol, valCol }
  })
}

/**
 * Map KPI slots to real column names and labels.
 */
export function mapTemplateKPIs(template, fieldMap, numericCols) {
  const kpiCols = []

  // Primary mapped KPIs from template definition
  template.kpis.forEach((role) => {
    const col = fieldMap[role]
    if (col) {
      kpiCols.push({ role, col, label: toTitleCase(col) })
    }
  })

  // Fill with any remaining numeric columns (up to 4 total)
  numericCols.forEach((col) => {
    if (kpiCols.length >= 4) return
    if (!kpiCols.find((k) => k.col === col)) {
      kpiCols.push({ role: 'numeric', col, label: toTitleCase(col) })
    }
  })

  return kpiCols.slice(0, 4)
}

/** Title-case a column name */
export function toTitleCase(str) {
  return String(str)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Detect columns that contain date-like values.
 * Samples the first 30 rows.
 */
export function getDateColumns(headers, rows) {
  if (!rows.length) return []
  return headers.filter((h) => {
    const sample = rows.slice(0, 30).map((r) => r[h]).filter(Boolean)
    if (!sample.length) return false
    const parseable = sample.filter((v) => {
      if (typeof v === 'number') return false  // numeric-only = not a date col
      const d = new Date(v)
      return !isNaN(d.getTime())
    })
    return parseable.length / sample.length >= 0.6
  })
}

/**
 * Parse a value into a Date, returning null on failure.
 */
export function safeParseDate(v) {
  if (!v && v !== 0) return null
  const d = new Date(v)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Extract date part according to hierarchy level.
 */
export function extractDatePart(v, level) {
  const d = safeParseDate(v)
  if (!d) return 'Unknown'
  const yr  = d.getFullYear()
  const mo  = d.getMonth() + 1
  const day = d.getDate()
  switch (level) {
    case 'year':    return String(yr)
    case 'quarter': return `Q${Math.ceil(mo / 3)} ${yr}`
    case 'month':   return `${yr}-${String(mo).padStart(2, '0')}`
    case 'day':     return `${yr}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    default:        return String(v)
  }
}
