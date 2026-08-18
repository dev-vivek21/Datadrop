import { useState } from 'react'
import styles from './DataPreview.module.css'

const PAGE_SIZE = 15

export default function DataPreview({ parsedData, uploadedFile, onReset }) {
  const [page, setPage]         = useState(0)
  const [search, setSearch]     = useState('')
  const [sortCol, setSortCol]   = useState(null)
  const [sortDir, setSortDir]   = useState('asc')

  const { headers = [], rows = [], _xlsxNote } = parsedData ?? {}

  // Filter
  const filtered = rows.filter((row) =>
    search === '' ||
    Object.values(row).some((v) =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  )

  // Sort
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const av = a[sortCol], bv = b[sortCol]
        const an = parseFloat(av), bn = parseFloat(bv)
        const compare = !isNaN(an) && !isNaN(bn) ? an - bn : String(av).localeCompare(String(bv))
        return sortDir === 'asc' ? compare : -compare
      })
    : filtered

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const pageRows   = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const handleSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortCol(col); setSortDir('asc') }
    setPage(0)
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(0)
  }

  function detectType(col) {
    const vals = rows.slice(0, 20).map((r) => r[col]).filter(Boolean)
    if (vals.every((v) => !isNaN(parseFloat(v)))) return 'number'
    return 'string'
  }

  return (
    <div className={styles.wrapper}>
      {/* Table header bar */}
      <div className={styles.tableBar}>
        <div className={styles.tableBarLeft}>
          <span className={styles.tableTitle}>Data Preview</span>
          <span className={styles.tableCount}>
            {filtered.length.toLocaleString()} rows
            {search && ` matching "${search}"`}
          </span>
        </div>

        <div className={styles.tableBarRight}>
          {/* Search */}
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              id="table-search"
              type="text"
              className={styles.searchInput}
              placeholder="Search data…"
              value={search}
              onChange={handleSearch}
              aria-label="Search table data"
            />
          </div>

          {/* Upload new */}
          <button id="btn-preview-new" className={styles.btnNew} onClick={onReset}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            New File
          </button>
        </div>
      </div>

      {/* XLSX note */}
      {_xlsxNote && (
        <div className={styles.xlsxNote} role="note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {_xlsxNote}
        </div>
      )}

      {/* Table scroll area */}
      <div className={styles.tableScroll}>
        <table className={styles.table} aria-label="Data preview table">
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.thIndex}`}>#</th>
              {headers.map((h) => (
                <th
                  key={h}
                  id={`col-${h}`}
                  className={`${styles.th} ${sortCol === h ? styles.thSorted : ''}`}
                  onClick={() => handleSort(h)}
                  aria-sort={sortCol === h ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  title={`Sort by ${h}`}
                >
                  <span className={styles.thContent}>
                    {h}
                    <span className={styles.typeTag}>{detectType(h) === 'number' ? '123' : 'Aa'}</span>
                    <svg
                      className={`${styles.sortIcon} ${sortCol === h ? styles.sortIconActive : ''} ${sortDir === 'desc' && sortCol === h ? styles.sortIconDesc : ''}`}
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
                  No rows match your search.
                </td>
              </tr>
            ) : (
              pageRows.map((row, ri) => (
                <tr key={ri} className={styles.tr}>
                  <td className={`${styles.td} ${styles.tdIndex}`}>
                    {page * PAGE_SIZE + ri + 1}
                  </td>
                  {headers.map((h) => (
                    <td key={h} className={styles.td} title={String(row[h] ?? '')}>
                      <span className={styles.cellValue}>{row[h] ?? <span className={styles.nullVal}>—</span>}</span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination} role="navigation" aria-label="Table pagination">
          <button
            id="btn-page-prev"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Prev
          </button>

          <div className={styles.pageInfo}>
            <span className={styles.pageCurrent}>{page + 1}</span>
            <span className={styles.pageOf}>of</span>
            <span>{totalPages}</span>
          </div>

          <button
            id="btn-page-next"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
