
import { useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'

export interface ColumnDef<T> {
  header: string
  accessorKey: keyof T
  sortable?: boolean
}

export interface DataGridProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  onRowSelect?: (item: T) => void
  ariaLabel: string
}

type SortDirection = 'asc' | 'desc'
type ActiveCell = { row: number; col: number }

export default function DataGrid<T>({
  data,
  columns,
  onRowSelect,
  ariaLabel,
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState<T | null>(null)
  const [activeCell, setActiveCell] = useState<ActiveCell>({
    row: 0,
    col: 0,
  })

  const pageSize = 3
  const query = searchTerm.trim().toLowerCase()

  const filteredData = data.filter(item =>
    columns.some(column =>
      String(item[column.accessorKey] ?? '')
        .toLowerCase()
        .includes(query)
    )
  )

  const sortedData = [...filteredData]

  if (sortKey !== null) {
    sortedData.sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      const comparison =
        typeof aValue === 'number' &&
        typeof bValue === 'number'
          ? aValue - bValue
          : String(aValue ?? '').localeCompare(
              String(bValue ?? ''),
              'en',
              { sensitivity: 'base', numeric: true }
            )

      return sortDirection === 'asc'
        ? comparison
        : -comparison
    })
  }

  const totalPages = Math.max(
    1,
    Math.ceil(sortedData.length / pageSize)
  )

  const safePage = Math.min(currentPage, totalPages)

  const pageData = sortedData.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  )

  function handleSort(column: ColumnDef<T>) {
    if (column.sortable === false) return

    if (sortKey === column.accessorKey) {
      setSortDirection(current =>
        current === 'asc' ? 'desc' : 'asc'
      )
    } else {
      setSortKey(column.accessorKey)
      setSortDirection('asc')
    }

    setCurrentPage(1)
    setActiveCell({ row: 0, col: 0 })
  }

  function toggleSelection(item: T) {
    const next = selectedRow === item ? null : item
    setSelectedRow(next)

    if (next !== null) {
      onRowSelect?.(next)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTableElement>) {
    if (!(event.target instanceof HTMLElement)) return

    // Allow buttons to keep their native keyboard behavior.
    if (event.target instanceof HTMLButtonElement) return

    const cell = event.target.closest('th, td')
    if (!(cell instanceof HTMLTableCellElement)) return

    if (!event.currentTarget.contains(cell)) return

    const table = event.currentTarget
    const row = cell.parentElement

    if (!(row instanceof HTMLTableRowElement)) return

    const rowIndex = row.rowIndex
    const colIndex = cell.cellIndex

    const moves: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }

    if (Object.prototype.hasOwnProperty.call(moves, event.key)) {
      event.preventDefault()

      const [rowChange, colChange] = moves[event.key]

      const nextRow = Math.max(
        0,
        Math.min(table.rows.length - 1, rowIndex + rowChange)
      )

      const nextCol = Math.max(
        0,
        Math.min(
          table.rows[nextRow].cells.length - 1,
          colIndex + colChange
        )
      )

      table.rows[nextRow].cells[nextCol].focus()
      return
    }

    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()

    if (rowIndex === 0) {
      const column = columns[colIndex]
      if (column) handleSort(column)
      return
    }

    const item = pageData[rowIndex - 1]
    if (item !== undefined) toggleSelection(item)
  }

  function handleFocus(event: FocusEvent<HTMLTableElement>) {
    if (!(event.target instanceof HTMLElement)) return

    const cell = event.target.closest('th, td')
    if (!(cell instanceof HTMLTableCellElement)) return

    const row = cell.parentElement
    if (!(row instanceof HTMLTableRowElement)) return

    setActiveCell({
      row: row.rowIndex,
      col: cell.cellIndex,
    })
  }

  function cellTabIndex(row: number, col: number) {
    return activeCell.row === row && activeCell.col === col
      ? 0
      : -1
  }

  return (
    <section className="data-grid" aria-label={ariaLabel}>
      <section className="search-section" aria-label="Search controls">
        <label htmlFor="grid-search">Search students</label>
        <input
          id="grid-search"
          type="search"
          placeholder="Search by name, email, department or ID..."
          value={searchTerm}
          onChange={event => {
            setSearchTerm(event.target.value)
            setCurrentPage(1)
            setActiveCell({ row: 0, col: 0 })
          }}
        />

        <p aria-live="polite">
          Showing {sortedData.length} of {data.length} students
        </p>
      </section>

      <p id="grid-help" className="keyboard-help">
        Keyboard: Use arrow keys to navigate cells.
        Press Enter or Space to select a student.
        Press Enter on a column header to sort.
      </p>

      <section className="table-wrapper" aria-label="Student data">
        <table
          role="grid"
          aria-label={ariaLabel}
          aria-describedby="grid-help"
          aria-rowcount={sortedData.length + 1}
          onKeyDown={handleKeyDown}
          onFocusCapture={handleFocus}
        >
          <thead>
            <tr>
              {columns.map((column, colIndex) => (
                <th
                  key={String(column.accessorKey)}
                  scope="col"
                  tabIndex={cellTabIndex(0, colIndex)}
                  aria-sort={
                    sortKey === column.accessorKey
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {column.sortable === false ? (
                    column.header
                  ) : (
                    <button
                      type="button"
                      className="sort-button"
                      tabIndex={-1}
                      onClick={() => handleSort(column)}
                    >
                      {column.header}
                      <span aria-hidden="true">
                        {sortKey === column.accessorKey
                          ? sortDirection === 'asc'
                            ? ' ▲'
                            : ' ▼'
                          : ' ↕'}
                      </span>
                    </button>
                  )}
                </th>
              ))}

              <th
                scope="col"
                tabIndex={cellTabIndex(0, columns.length)}
              >
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {pageData.map((item, rowIndex) => (
              <tr
                key={data.indexOf(item)}
                aria-selected={selectedRow === item}
                className={
                  selectedRow === item ? 'selected-row' : ''
                }
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={String(column.accessorKey)}
                    tabIndex={cellTabIndex(rowIndex + 1, colIndex)}
                  >
                    {String(item[column.accessorKey] ?? '')}
                  </td>
                ))}

                <td
                  tabIndex={cellTabIndex(
                    rowIndex + 1,
                    columns.length
                  )}
                >
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-pressed={selectedRow === item}
                    aria-label={
                      selectedRow === item
                        ? `Deselect row ${rowIndex + 1}`
                        : `Select row ${rowIndex + 1}`
                    }
                    onClick={() => toggleSelection(item)}
                  >
                    {selectedRow === item ? 'Selected' : 'Select'}
                  </button>
                </td>
              </tr>
            ))}

            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1}>
                  No matching students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <nav className="pagination" aria-label="Table pagination">
        <button
          type="button"
          disabled={safePage === 1}
          onClick={() => {
            setCurrentPage(safePage - 1)
            setActiveCell({ row: 0, col: 0 })
          }}
        >
          Previous
        </button>

        <span aria-live="polite">
          Page {safePage} of {totalPages}
        </span>

        <button
          type="button"
          disabled={safePage === totalPages}
          onClick={() => {
            setCurrentPage(safePage + 1)
            setActiveCell({ row: 0, col: 0 })
          }}
        >
          Next
        </button>
      </nav>
    </section>
  )
}
