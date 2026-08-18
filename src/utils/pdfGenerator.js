import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getNumericColumns, getCategoryColumns, computeKPIs, formatNumber } from './dataUtils'

/**
 * Generate a comprehensive executive PDF report containing ALL chart types:
 * - Figure 1: Category Distribution Bar Chart
 * - Figure 2: Comparative Performance Breakdown
 * - Figure 3: Trend & Volume Progression Curve (Line/Area)
 * - Figure 4: Proportional Distribution & Share Matrix
 * - Detailed Dataset Records Table with pagination
 *
 * @param {Object} options
 * @param {Array<string>} options.headers Column headers
 * @param {Array<Object>} options.rows Data rows
 * @param {string} options.fileName Source file name
 * @param {Array<Object>} options.filters Active filters if any
 * @param {string} options.title Optional custom report title
 * @returns {jsPDF} The jsPDF document instance
 */
export function generatePDFReport({
  headers = [],
  rows = [],
  fileName = 'dataset',
  filters = [],
  title = 'Data Analytics & Executive Report',
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const numCols = getNumericColumns(headers, rows)
  const catCols = getCategoryColumns(headers, rows)
  const kpis = computeKPIs(rows, numCols)
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width

  const primaryCat = catCols[0] || headers[0] || 'Category'
  const secondaryCat = catCols[1] || primaryCat
  const primaryNum = kpis.primaryCol || numCols[0] || headers[1] || 'Value'
  const secondaryNum = numCols.find((c) => c !== primaryNum) || primaryNum

  const palette = [
    [0, 102, 204],   // Mac Blue
    [124, 58, 237],  // Purple
    [16, 185, 129],  // Emerald
    [245, 158, 11],  // Amber
    [239, 68, 68],   // Coral Red
    [2, 132, 199],   // Cyan
  ]

  /* ══════════════════════════════════════════════════════════════
     PAGE 1: EXECUTIVE DASHBOARD & COMPARISON CHARTS
  ══════════════════════════════════════════════════════════════ */

  /* ── 1. Top Header Banner ── */
  doc.setFillColor(245, 245, 247)
  doc.rect(0, 0, pageWidth, 28, 'F')

  // Top Accent Stripe
  doc.setFillColor(0, 102, 204)
  doc.rect(0, 0, pageWidth, 3, 'F')

  // Brand & Title
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(29, 29, 31)
  doc.text('DataDrop', 14, 13)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(134, 134, 139)
  doc.text('Executive Intelligence & Complete Visual Report', 14, 19)

  const dateStr = new Date().toLocaleString()
  doc.setFontSize(8)
  doc.setTextColor(81, 81, 84)
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 13, { align: 'right' })
  doc.text(`Source: ${fileName}`, pageWidth - 14, 19, { align: 'right' })

  /* ── 2. Report Overview & Filter Info ── */
  let currentY = 36
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(29, 29, 31)
  doc.text(title, 14, currentY)

  currentY += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(81, 81, 84)
  const filterInfo = filters.length > 0
    ? `Active Filters: ${filters.map((f) => `${f.col} ${f.op} "${f.value || ''}"`).join(', ')}`
    : 'All records included (No active filters)'
  doc.text(filterInfo, 14, currentY)

  currentY += 7

  /* ── 3. KPI Stat Cards (Top Summary) ── */
  const cardWidth = (pageWidth - 28 - (3 * 4)) / 4
  const cardHeight = 16

  const kpiItems = [
    { label: 'TOTAL RECORDS', value: rows.length.toLocaleString(), color: [0, 102, 204] },
    { label: 'COLUMNS', value: headers.length.toString(), color: [124, 58, 237] },
    {
      label: primaryNum ? `SUM (${primaryNum.toUpperCase()})` : 'TOTAL SUM',
      value: formatNumber(kpis.sum),
      color: [16, 185, 129],
    },
    {
      label: primaryNum ? `AVG (${primaryNum.toUpperCase()})` : 'AVERAGE',
      value: formatNumber(kpis.avg),
      color: [245, 158, 11],
    },
  ]

  kpiItems.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 4)
    doc.setFillColor(250, 250, 252)
    doc.setDrawColor(229, 231, 235)
    doc.roundedRect(x, currentY, cardWidth, cardHeight, 2, 2, 'FD')

    doc.setFillColor(...kpi.color)
    doc.roundedRect(x, currentY, 1.8, cardHeight, 1, 1, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.5)
    doc.setTextColor(134, 134, 139)
    doc.text(kpi.label, x + 4.5, currentY + 5)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(29, 29, 31)
    doc.text(kpi.value, x + 4.5, currentY + 12)
  })

  currentY += cardHeight + 8

  /* ── 4. FIGURE 1: Primary Category Distribution Bar Chart ── */
  const chartWidth = pageWidth - 28
  const chart1Height = 84

  const groups1 = {}
  rows.forEach((r) => {
    const key = String(r[primaryCat] ?? 'Unknown')
    const val = Number(r[primaryNum] || 0)
    groups1[key] = (groups1[key] || 0) + (isNaN(val) ? 1 : val)
  })

  const sortedGroups1 = Object.entries(groups1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const maxVal1 = Math.max(...sortedGroups1.map((g) => g[1]), 1)
  const totalValSum1 = sortedGroups1.reduce((acc, g) => acc + g[1], 0) || 1

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(14, currentY, chartWidth, chart1Height, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(29, 29, 31)
  doc.text(`Figure 1: Bar Chart — Distribution by ${primaryCat} (${primaryNum})`, 20, currentY + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(134, 134, 139)
  doc.text(`Category comparison ranked by total volume`, 20, currentY + 14)

  const barMaxLen = chartWidth - 75
  const barThickness = 5.5
  const barGap = 9.5
  let bar1StartY = currentY + 20

  sortedGroups1.forEach(([catName, val], idx) => {
    const yPos = bar1StartY + idx * barGap
    const barLen = Math.max((val / maxVal1) * barMaxLen, 3)
    const pct = ((val / totalValSum1) * 100).toFixed(1)
    const color = palette[idx % palette.length]

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(51, 51, 54)
    const truncatedCat = catName.length > 16 ? `${catName.substring(0, 15)}…` : catName
    doc.text(truncatedCat, 20, yPos + 4.2)

    doc.setFillColor(243, 244, 246)
    doc.roundedRect(56, yPos, barMaxLen, barThickness, 1.5, 1.5, 'F')

    doc.setFillColor(...color)
    doc.roundedRect(56, yPos, barLen, barThickness, 1.5, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(29, 29, 31)
    doc.text(`${formatNumber(val)} (${pct}%)`, 56 + barMaxLen + 3, yPos + 4.2)
  })

  currentY += chart1Height + 8

  /* ── 5. FIGURE 2: Performance Breakdown Chart ── */
  const chart2Height = 84
  const groups2 = {}
  rows.forEach((r) => {
    const key = String(r[secondaryCat] ?? 'Unknown')
    const val = Number(r[secondaryNum] || 0)
    groups2[key] = (groups2[key] || 0) + (isNaN(val) ? 1 : val)
  })

  const sortedGroups2 = Object.entries(groups2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const maxVal2 = Math.max(...sortedGroups2.map((g) => g[1]), 1)
  const totalValSum2 = sortedGroups2.reduce((acc, g) => acc + g[1], 0) || 1

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(14, currentY, chartWidth, chart2Height, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(29, 29, 31)
  doc.text(`Figure 2: Performance Breakdown by ${secondaryCat} (${secondaryNum})`, 20, currentY + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(134, 134, 139)
  doc.text(`Comparative secondary metric distributions`, 20, currentY + 14)

  const palette2 = [
    [79, 70, 229],  // Indigo
    [14, 165, 233], // Sky
    [16, 185, 129], // Emerald
    [236, 72, 153], // Pink
    [245, 158, 11], // Amber
    [100, 116, 139],// Slate
  ]

  let bar2StartY = currentY + 20

  sortedGroups2.forEach(([catName, val], idx) => {
    const yPos = bar2StartY + idx * barGap
    const barLen = Math.max((val / maxVal2) * barMaxLen, 3)
    const pct = ((val / totalValSum2) * 100).toFixed(1)
    const color = palette2[idx % palette2.length]

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(51, 51, 54)
    const truncatedCat = catName.length > 16 ? `${catName.substring(0, 15)}…` : catName
    doc.text(truncatedCat, 20, yPos + 4.2)

    doc.setFillColor(243, 244, 246)
    doc.roundedRect(56, yPos, barMaxLen, barThickness, 1.5, 1.5, 'F')

    doc.setFillColor(...color)
    doc.roundedRect(56, yPos, barLen, barThickness, 1.5, 1.5, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(29, 29, 31)
    doc.text(`${formatNumber(val)} (${pct}%)`, 56 + barMaxLen + 3, yPos + 4.2)
  })

  // Page 1 Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(134, 134, 139)
  doc.text(`DataDrop Executive Report • ${fileName} • Page 1`, pageWidth / 2, pageHeight - 6, { align: 'center' })

  /* ══════════════════════════════════════════════════════════════
     PAGE 2: TREND, AREA & PROPORTIONAL SHARE CHARTS
  ══════════════════════════════════════════════════════════════ */
  doc.addPage()

  // Page 2 Header Banner
  doc.setFillColor(245, 245, 247)
  doc.rect(0, 0, pageWidth, 20, 'F')
  doc.setFillColor(124, 58, 237)
  doc.rect(0, 0, pageWidth, 2.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(29, 29, 31)
  doc.text('Advanced Trend & Proportional Analytics', 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(134, 134, 139)
  doc.text(`Multi-format visual matrix • ${fileName}`, pageWidth - 14, 12, { align: 'right' })

  let p2CurrentY = 28

  /* ── 6. FIGURE 3: Line Trend & Volume Area Curve ── */
  const chart3Height = 110
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(14, p2CurrentY, chartWidth, chart3Height, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(29, 29, 31)
  doc.text(`Figure 3: Line & Area Progression — ${primaryCat} Progression`, 20, p2CurrentY + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(134, 134, 139)
  doc.text(`Monotone progression and cumulative area dynamics`, 20, p2CurrentY + 14)

  // Draw Grid Lines & Axes for Curve
  const plotLeft = 24
  const plotRight = pageWidth - 24
  const plotTop = p2CurrentY + 24
  const plotBottom = p2CurrentY + chart3Height - 16
  const plotHeight = plotBottom - plotTop
  const plotWidth = plotRight - plotLeft

  // Horizontal Grid Lines
  doc.setDrawColor(240, 240, 243)
  doc.setLineWidth(0.2)
  for (let i = 0; i <= 4; i++) {
    const gridY = plotTop + (plotHeight / 4) * i
    doc.line(plotLeft, gridY, plotRight, gridY)
    const labelVal = maxVal1 * (1 - i / 4)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(156, 163, 175)
    doc.text(formatNumber(labelVal), plotLeft - 2, gridY + 1, { align: 'right' })
  }

  // Draw Line and Filled Area
  if (sortedGroups1.length > 1) {
    const points = sortedGroups1.map(([catName, val], idx) => {
      const px = plotLeft + (plotWidth / (sortedGroups1.length - 1)) * idx
      const py = plotBottom - (val / maxVal1) * plotHeight
      return { x: px, y: py, name: catName, val }
    })

    // Draw Line Segments
    doc.setDrawColor(0, 102, 204)
    doc.setLineWidth(1.2)
    for (let i = 0; i < points.length - 1; i++) {
      doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y)
    }

    // Draw Data Point Circles & Bottom Labels
    points.forEach((pt) => {
      // Circle dot
      doc.setFillColor(0, 102, 204)
      doc.circle(pt.x, pt.y, 1.8, 'F')
      doc.setFillColor(255, 255, 255)
      doc.circle(pt.x, pt.y, 0.9, 'F')

      // Value label on top
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(0, 102, 204)
      doc.text(formatNumber(pt.val), pt.x, pt.y - 3, { align: 'center' })

      // Bottom Category label
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(81, 81, 84)
      const trunc = pt.name.length > 10 ? `${pt.name.substring(0, 9)}…` : pt.name
      doc.text(trunc, pt.x, plotBottom + 5, { align: 'center' })
    })
  }

  p2CurrentY += chart3Height + 8

  /* ── 7. FIGURE 4: Proportional Distribution & Donut Breakdown Cards ── */
  const chart4Height = 110
  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(229, 231, 235)
  doc.roundedRect(14, p2CurrentY, chartWidth, chart4Height, 3, 3, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(29, 29, 31)
  doc.text(`Figure 4: Proportional Distribution Breakdown — ${primaryCat} Share`, 20, p2CurrentY + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(134, 134, 139)
  doc.text(`Categorical share ranking and proportion cards`, 20, p2CurrentY + 14)

  // Render 6 Share Cards inside Figure 4
  const gridCardW = (chartWidth - 24) / 3
  const gridCardH = 34
  let cardStartY = p2CurrentY + 22

  sortedGroups1.forEach(([catName, val], idx) => {
    const colIdx = idx % 3
    const rowIdx = Math.floor(idx / 3)
    const cardX = 20 + colIdx * (gridCardW + 4)
    const cardY = cardStartY + rowIdx * (gridCardH + 6)
    const color = palette[idx % palette.length]
    const pct = ((val / totalValSum1) * 100).toFixed(1)

    // Mini card
    doc.setFillColor(250, 250, 252)
    doc.setDrawColor(235, 235, 238)
    doc.roundedRect(cardX, cardY, gridCardW, gridCardH, 2, 2, 'FD')

    // Left color bar
    doc.setFillColor(...color)
    doc.roundedRect(cardX, cardY, 2.5, gridCardH, 1, 1, 'F')

    // Name
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(81, 81, 84)
    const trunc = catName.length > 18 ? `${catName.substring(0, 17)}…` : catName
    doc.text(trunc, cardX + 5, cardY + 7)

    // Percentage Pill
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...color)
    doc.text(`${pct}%`, cardX + 5, cardY + 18)

    // Value
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(134, 134, 139)
    doc.text(`Total: ${formatNumber(val)}`, cardX + 5, cardY + 26)
  })

  // Page 2 Footer
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(134, 134, 139)
  doc.text(`DataDrop Executive Report • ${fileName} • Page 2`, pageWidth / 2, pageHeight - 6, { align: 'center' })

  /* ══════════════════════════════════════════════════════════════
     PAGE 3+: DETAILED DATASET RECORDS TABLE
  ══════════════════════════════════════════════════════════════ */
  doc.addPage()

  // Page 3 Header Banner
  doc.setFillColor(245, 245, 247)
  doc.rect(0, 0, pageWidth, 18, 'F')
  doc.setFillColor(0, 102, 204)
  doc.rect(0, 0, pageWidth, 2.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(29, 29, 31)
  doc.text('Detailed Dataset Records', 14, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(134, 134, 139)
  doc.text(`Total Records: ${rows.length.toLocaleString()} • Columns: ${headers.length}`, pageWidth - 14, 11, { align: 'right' })

  const tableData = rows.map((row, rIdx) => {
    return [
      (rIdx + 1).toString(),
      ...headers.map((h) => {
        const v = row[h]
        if (v == null || v === '') return '—'
        if (numCols.includes(h) && typeof v === 'number') {
          return formatNumber(v)
        }
        return String(v)
      }),
    ]
  })

  const tableHeaders = [['#', ...headers]]

  autoTable(doc, {
    startY: 23,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 2.0,
      textColor: [29, 29, 31],
      lineColor: [235, 235, 238],
      lineWidth: 0.15,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [245, 245, 247],
      textColor: [51, 51, 54],
      fontStyle: 'bold',
      fontSize: 7.2,
      halign: 'left',
      lineWidth: 0.2,
      lineColor: [220, 220, 225],
    },
    alternateRowStyles: {
      fillColor: [253, 253, 254],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 7, textColor: [134, 134, 139] },
    },
    margin: { left: 14, right: 14, bottom: 14 },
    didDrawPage: (data) => {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber
      const totalPages = doc.internal.getNumberOfPages()

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(134, 134, 139)
      doc.text(
        `DataDrop Report • ${fileName} • Page ${pageNum} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      )
    },
  })

  return doc
}
