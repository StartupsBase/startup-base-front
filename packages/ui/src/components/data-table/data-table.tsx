"use client"

import * as React from "react"
import {
  flexRender,
  functionalUpdate,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { getDataTableSelectionColumn } from "./data-table-selection"
import {
  defaultDataTableLabels,
  type DataTableProps,
  type DataTableFilterState,
  type ResolvedFilter,
} from "./data-table.types"
import {
  createDataTableFilterFn,
  normalizeFilter,
  normalizeFilterState,
  resolveFilters,
  SEARCH_FILTER_ID,
} from "./data-table.utils"

const EMPTY_FILTERS: never[] = []
const DEFAULT_PAGE_SIZES = [10, 20, 50]

function configureColumns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  filters: ResolvedFilter<TData>[]
): ColumnDef<TData, TValue>[] {
  return columns.map((column) => {
    if ("columns" in column)
      return {
        ...column,
        columns: configureColumns(column.columns ?? [], filters),
      }
    const id =
      column.id ??
      ("accessorKey" in column
        ? String(column.accessorKey).replaceAll(".", "_")
        : undefined)
    const filter = filters.find((item) => item.columnId === id)
    // Legacy definitions retain the column's original TanStack filter behavior.
    return filter && !filter.legacy
      ? { ...column, filterFn: createDataTableFilterFn(filter) }
      : column
  })
}

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  search: searchProp,
  searchColumn,
  searchPlaceholder,
  filters: definitions = EMPTY_FILTERS,
  filterState,
  defaultFilterState = EMPTY_FILTERS,
  onFiltersChange,
  manualFiltering = false,
  initialColumnVisibility = {},
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  enableRowSelection = false,
  getRowId,
  onRowSelectionChange,
  emptyMessage = "No results found.",
  labels: labelsProp,
  className,
}: DataTableProps<TData, TValue>) {
  const labels = { ...defaultDataTableLabels, ...labelsProp }
  const search =
    searchProp ??
    (searchColumn
      ? { columnId: searchColumn, placeholder: searchPlaceholder }
      : undefined)
  const filters = React.useMemo(
    () => resolveFilters(definitions),
    [definitions]
  )
  const [internalFilters, setInternalFilters] =
    React.useState<readonly DataTableFilterState[]>(defaultFilterState)
  const searchId = search?.columnId
  const activeFilters = React.useMemo(
    () => normalizeFilterState(filters, filterState ?? internalFilters, searchId ? { columnId: searchId } : undefined),
    [filters, filterState, internalFilters, searchId]
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState(
    initialColumnVisibility
  )
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const validPageSizes = [
    ...new Set(
      pageSizeOptions.filter((size) => Number.isInteger(size) && size > 0)
    ),
  ]
  if (!validPageSizes.length) validPageSizes.push(...DEFAULT_PAGE_SIZES)
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: validPageSizes[0] ?? 10,
  })
  const selectAllRows = labels.selectAllRows
  const selectRow = labels.selectRow
  const tableColumns = React.useMemo(() => {
    const configured = configureColumns(columns, filters)
    return enableRowSelection
      ? [
          getDataTableSelectionColumn<TData>({ selectAllRows, selectRow }),
          ...configured,
        ]
      : configured
  }, [columns, filters, enableRowSelection, selectAllRows, selectRow])
  const columnFilters = React.useMemo(() => activeFilters
    .filter((entry) => entry.id !== SEARCH_FILTER_ID)
    .map((entry) => ({ id: entry.columnId, value: entry.value })), [activeFilters])
  const searchValue = activeFilters.find(
    (entry) => entry.id === SEARCH_FILTER_ID
  )?.value

  function changeFilters(next: DataTableFilterState[]) {
    const normalized = normalizeFilterState(filters, next, search)
    if (filterState === undefined) setInternalFilters(normalized)
    setPagination((current) => ({ ...current, pageIndex: 0 }))
    onFiltersChange?.(normalized)
  }
  function changeFilter(id: string, value: unknown) {
    const config =
      id === SEARCH_FILTER_ID && search
        ? { id, columnId: search.columnId, title: "", type: "text" as const }
        : filters.find((filter) => filter.id === id)
    if (!config) return
    const next = normalizeFilter(config, value)
    changeFilters([
      ...activeFilters.filter((entry) => entry.id !== id),
      ...(next ? [next] : []),
    ])
  }

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack owns the stable table instance.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter: searchValue ?? "",
    },
    enableRowSelection,
    getRowId,
    manualFiltering,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnFiltersChange: (updater) => {
      const next = functionalUpdate(updater, columnFilters)
      const values = filters.flatMap((filter) => {
        const normalized = normalizeFilter(
          filter,
          next.find((entry) => entry.id === filter.columnId)?.value
        )
        return normalized ? [normalized] : []
      })
      changeFilters([
        ...values,
        ...activeFilters.filter((entry) => entry.id === SEARCH_FILTER_ID),
      ])
    },
    onGlobalFilterChange: (updater) =>
      changeFilter(
        SEARCH_FILTER_ID,
        functionalUpdate(updater, searchValue ?? "")
      ),
    getColumnCanGlobalFilter: (column) => column.id === search?.columnId,
    globalFilterFn: (row, columnId, value: unknown) => {
      const cell: unknown = row.getValue(columnId)
      return (
        cell != null &&
        String(cell)
          .toLocaleLowerCase()
          .includes(String(value).toLocaleLowerCase())
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  React.useEffect(() => {
    onRowSelectionChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original)
    )
  }, [onRowSelectionChange, rowSelection, data, table])

  return (
    <div className={cn("w-full max-w-full min-w-0 space-y-4", className)}>
      <DataTableToolbar
        table={table}
        search={search}
        filters={filters}
        activeFilters={activeFilters}
        onChange={changeFilter}
        onReset={() => changeFilters([])}
        labels={labels}
        manualFiltering={manualFiltering}
      />
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
        <Table className="min-w-[40rem] text-left">
          <TableHeader className="bg-muted/50 text-muted-foreground">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className="px-5 py-3"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  className="hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-5 py-4 whitespace-normal"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={Math.max(1, table.getVisibleLeafColumns().length)}
                  className="h-28 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        pageSizeOptions={[...new Set([...validPageSizes, pagination.pageSize])]}
        labels={labels}
      />
    </div>
  )
}
