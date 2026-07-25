"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type Table,
  useReactTable,
} from "@tanstack/react-table"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

const ALL_FILTER_VALUES = "__all_filter_values__"

type DataTableFilter = {
  columnId: string
  title: string
  options: Array<{ label: string; value: string }>
}

type DataTableLabels = {
  resetFilters: string
  columns: string
  rowsPerPage: string
  selectedRows: (selected: number, total: number) => string
  page: (page: number, total: number) => string
  previous: string
  next: string
}

const defaultLabels: DataTableLabels = {
  resetFilters: "Reset filters",
  columns: "Columns",
  rowsPerPage: "Rows per page",
  selectedRows: (selected, total) => `${selected} of ${total} row(s) selected`,
  page: (page, total) => `Page ${page} of ${total}`,
  previous: "Previous",
  next: "Next",
}

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchColumn?: string
  searchPlaceholder?: string
  filters?: DataTableFilter[]
  pageSizeOptions?: number[]
  enableRowSelection?: boolean
  onRowSelectionChange?: (rows: TData[]) => void
  emptyMessage?: string
  labels?: Partial<DataTableLabels>
  className?: string
}

function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  filters = [],
  pageSizeOptions = [10, 20, 50],
  enableRowSelection = false,
  onRowSelectionChange,
  emptyMessage = "No results found.",
  labels: labelsProp,
  className,
}: DataTableProps<TData, TValue>) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const tableColumns = React.useMemo(
    () =>
      enableRowSelection
        ? [getDataTableSelectionColumn<TData>(), ...columns]
        : columns,
    [columns, enableRowSelection]
  )
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table manages its own stable table instance.
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, columnFilters, columnVisibility, rowSelection },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  React.useEffect(() => {
    onRowSelectionChange?.(
      table.getSelectedRowModel().rows.map((row) => row.original)
    )
  }, [onRowSelectionChange, rowSelection, table])

  return (
    <div className={cn("w-full max-w-full min-w-0 space-y-4", className)}>
      <DataTableToolbar
        table={table}
        searchColumn={searchColumn}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        labels={labels}
      />
      <div className="w-full max-w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="w-full max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-border hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={table.getVisibleLeafColumns().length}
                    className="h-28 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
        labels={labels}
      />
    </div>
  )
}

function DataTableToolbar<TData>({
  table,
  searchColumn,
  searchPlaceholder,
  filters,
  labels,
}: {
  table: Table<TData>
  searchColumn?: string
  searchPlaceholder: string
  filters: DataTableFilter[]
  labels: DataTableLabels
}) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {searchColumn ? (
          <Input
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            placeholder={searchPlaceholder}
            className="w-full sm:w-64"
          />
        ) : null}
        {filters.map((filter) => (
          <DataTableFacetFilter
            key={filter.columnId}
            table={table}
            filter={filter}
          />
        ))}
        {isFiltered ? (
          <Button variant="ghost" onClick={() => table.resetColumnFilters()}>
            {labels.resetFilters}
          </Button>
        ) : null}
      </div>
      <DataTableViewOptions table={table} labels={labels} />
    </div>
  )
}

function DataTableFacetFilter<TData>({
  table,
  filter,
}: {
  table: Table<TData>
  filter: DataTableFilter
}) {
  const column = table.getColumn(filter.columnId)
  const value = (column?.getFilterValue() as string) ?? ""

  return (
    <Select
      value={value || ALL_FILTER_VALUES}
      onValueChange={(nextValue) =>
        column?.setFilterValue(
          nextValue === ALL_FILTER_VALUES ? undefined : nextValue
        )
      }
    >
      <SelectTrigger aria-label={filter.title} className="max-w-full sm:w-auto">
        <SelectValue placeholder={filter.title} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_FILTER_VALUES}>{filter.title}</SelectItem>
        {filter.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DataTableViewOptions<TData>({
  table,
  labels,
}: {
  table: Table<TData>
  labels: DataTableLabels
}) {
  return (
    <details className="relative">
      <summary className="h-9 cursor-pointer list-none rounded-4xl border border-input bg-input/30 px-3 py-2 text-sm hover:bg-muted [&::-webkit-details-marker]:hidden">
        {labels.columns}
      </summary>
      <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border border-border bg-popover p-2 shadow-xl">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <label
              key={column.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={(event) =>
                  column.toggleVisibility(event.target.checked)
                }
              />
              {typeof column.columnDef.header === "string"
                ? column.columnDef.header
                : column.id}
            </label>
          ))}
      </div>
    </details>
  )
}

function DataTablePagination<TData>({
  table,
  pageSizeOptions,
  labels,
}: {
  table: Table<TData>
  pageSizeOptions: number[]
  labels: DataTableLabels
}) {
  return (
    <div className="grid min-w-0 gap-3 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <p className="min-w-0 break-words">
        {labels.selectedRows(
          table.getFilteredSelectedRowModel().rows.length,
          table.getFilteredRowModel().rows.length
        )}
      </p>
      <div className="grid min-w-0 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <label className="hidden lg:block">{labels.rowsPerPage}</label>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(nextValue) => table.setPageSize(Number(nextValue))}
          >
            <SelectTrigger
              size="sm"
              aria-label={labels.rowsPerPage}
              className="w-16 shrink-0 rounded-lg"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="min-w-0 flex-1 break-words sm:flex-none">
            {labels.page(
              table.getState().pagination.pageIndex + 1,
              table.getPageCount() || 1
            )}
          </span>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="min-w-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="truncate">{labels.previous}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="truncate">{labels.next}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: {
  column: Column<TData, TValue>
  title: string
}) {
  if (!column.getCanSort()) {
    return <span>{title}</span>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      {column.getIsSorted() === "asc"
        ? " ↑"
        : column.getIsSorted() === "desc"
          ? " ↓"
          : ""}
    </Button>
  )
}

function getDataTableSelectionColumn<TData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows"
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(checked === true)
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label="Select row"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}

export {
  DataTable,
  DataTableColumnHeader,
  getDataTableSelectionColumn,
  type DataTableFilter,
  type DataTableLabels,
  type ColumnDef,
}
