import { useState, useMemo } from 'react'
import { getNumericColumns, formatNumber } from '../utils/dataUtils'
import styles from './DataTable.module.css'

const PAGE_SIZES = [10, 25, 50, 100]

export default function DataTable({ parsedData }) {
  const { headers = [], rows = [] } = parsedData ?? {}

  const [search,   setSearch]   = useState('')
  const [sortCol,  setSortCol]  = useState(null)
  const [sortDir,  setSortDir]  = useState('asc')
  const [page,     setPage]     = useState(0)
  const [pageSize, setPageSize] = useState(10)

  const numCols = useMemo(() => new Set(getNumericColumns(headers, rows)), [headers, rows])

  /* ─── Filter ─────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter((row) =>
      Object.values(row).some((v) => String(v).toLowerCase().includes(q))
    )
  }, [rows, search])

  /* ─── Sort ───────────────────────────────────────────── */
  const sorted = useMemo(() => {
    if (!sortCol) return filtered
    return [...filtered].sort((a, b) => {
      const av = a[sortCol], bv = b[sortCol]
      let cmp
      if (numCols.has(sortCol)) {
        cmp = Number(av || 0) - Number(bv || 0)
      } else {
        cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortCol, sortDir, numCols])

  /* ─── Paginate ───────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages - 1)
  const pageRows   = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(0)
  }

  const handleSearch = (e) => { setSearch(e.target.value); setPage(0) }
  const handlePageSize = (e) => { setPageSize(Number(e.target.value)); setPage(0) }

  const startRow = sorted.length ? safePage * pageSize + 1 : 0
  const endRow   = Math.min((safePage + 1) * pageSize, sorted.length)

  return (
    <div className={styles.wrapper}>
      {/* ─── Toolbar ─────────────────────────────────── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <h2 className={styles.tableTitle}>Data Table</h2>
          <span className={styles.rowCount}>
            {search
              ? `${sorted.length.toLocaleString()} of ${rows.length.toLocaleString()} rows`
              : `${rows.length.toLocaleString()} rows`}
          </span>
        </div>

        <div className={styles.toolbarRight}>
          {/* Global search */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              id="table-search"
              type="text"
              className={styles.searchInput}
              placeholder="Search all columns…"
              value={search}
              onChange={handleSearch}
              aria-label="Search data table"
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* Rows per page */}
          <div className={styles.pageSizeWrap}>
            <label htmlFor="page-size" className={styles.pageSizeLabel}>Rows</label>
            <select id="page-size" className={styles.pageSizeSelect} value={pageSize} onChange={handlePageSize}>
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ─── Table ───────────────────────────────────── */}
      <div className={styles.tableScroll}>
        <table className={styles.table} aria-label="Data table">
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.thIndex}`} aria-label="Row number">#</th>
              {headers.map((h) => (
                <th
                  key={h}
                  id={`col-header-${h}`}
                  className={`${styles.th} ${sortCol === h ? styles.thSorted : ''}`}
                  onClick={() => handleSort(h)}
                  aria-sort={sortCol === h ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span className={styles.thContent}>
                    <span className={`${styles.typeTag} ${numCols.has(h) ? styles.typeNum : styles.typeStr}`}>
                      {numCols.has(h) ? '123' : 'Aa'}
                    </span>
                    {h}
                    <svg
                      className={`${styles.sortArrow} ${sortCol === h ? styles.sortActive : ''} ${sortDir === 'desc' && sortCol === h ? styles.sortDesc : ''}`}
                      width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className={styles.empty}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  No rows match your search
                </td>
              </tr>
            ) : (
              pageRows.map((row, ri) => (
                <tr key={safePage * pageSize + ri} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdIndex}`}>
                    {safePage * pageSize + ri + 1}
                  </td>
                  {headers.map((h) => {
                    const val = row[h]
                    const isNum = numCols.has(h)
                    return (
                      <td key={h} className={`${styles.td} ${isNum ? styles.tdNum : ''}`} title={String(val ?? '')}>
                        {val === '' || val == null
                          ? <span className={styles.nullVal}>—</span>
                          : isNum
                            ? <span className={styles.numVal}>{formatNumber(Number(val))}</span>
                            : <span className={styles.strVal}>{String(val)}</span>
                        }
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Pagination ──────────────────────────────── */}
      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          {sorted.length > 0 ? `${startRow}–${endRow} of ${sorted.length.toLocaleString()}` : 'No results'}
        </span>

        <div className={styles.pageButtons} role="navigation" aria-label="Pagination">
          <button id="btn-page-first" className={styles.pageBtn} onClick={() => setPage(0)} disabled={safePage === 0} aria-label="First page">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
          </button>
          <button id="btn-page-prev" className={styles.pageBtn} onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} aria-label="Previous page">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>

          {/* Page number pills */}
          <div className={styles.pagePills}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p
              if (totalPages <= 5) p = i
              else if (safePage <= 2) p = i
              else if (safePage >= totalPages - 3) p = totalPages - 5 + i
              else p = safePage - 2 + i
              return (
                <button
                  key={p}
                  id={`btn-page-${p}`}
                  className={`${styles.pagePill} ${p === safePage ? styles.pagePillActive : ''}`}
                  onClick={() => setPage(p)}
                  aria-current={p === safePage ? 'page' : undefined}
                >
                  {p + 1}
                </button>
              )
            })}
          </div>

          <button id="btn-page-next" className={styles.pageBtn} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={safePage === totalPages - 1} aria-label="Next page">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button id="btn-page-last" className={styles.pageBtn} onClick={() => setPage(totalPages - 1)} disabled={safePage === totalPages - 1} aria-label="Last page">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
