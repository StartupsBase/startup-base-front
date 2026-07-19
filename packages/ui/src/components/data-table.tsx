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
import { cn } from "@workspace/ui/lib/utils"

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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
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
    onRowSelectionChange?.(table.getSelectedRowModel().rows.map((row) => row.original))
  }, [onRowSelectionChange, rowSelection, table])

  return (
    <div className={cn("space-y-4", className)}>
      <DataTableToolbar
        table={table}
        searchColumn={searchColumn}
        searchPlaceholder={searchPlaceholder}
        filters={filters}
        labels={labels}
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-5 py-3 font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-5 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} labels={labels} />
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {searchColumn ? (
          <Input
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn(searchColumn)?.setFilterValue(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full sm:w-64"
          />
        ) : null}
        {filters.map((filter) => (
          <DataTableFacetFilter key={filter.columnId} table={table} filter={filter} />
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
    <select
      aria-label={filter.title}
      value={value}
      onChange={(event) => column?.setFilterValue(event.target.value || undefined)}
      className="h-9 rounded-4xl border border-input bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <option value="">{filter.title}</option>
      {filter.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function DataTableViewOptions<TData>({ table, labels }: { table: Table<TData>; labels: DataTableLabels }) {
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
            <label key={column.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="checkbox"
                checked={column.getIsVisible()}
                onChange={(event) => column.toggleVisibility(event.target.checked)}
              />
              {typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}
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
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>{labels.selectedRows(table.getFilteredSelectedRowModel().rows.length, table.getFilteredRowModel().rows.length)}</p>
      <div className="flex items-center gap-2">
        <label className="hidden sm:block">{labels.rowsPerPage}</label>
        <select
          value={table.getState().pagination.pageSize}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
          className="h-8 rounded-lg border border-input bg-input/30 px-2 text-sm"
        >
          {pageSizeOptions.map((pageSize) => (
            <option key={pageSize} value={pageSize}>{pageSize}</option>
          ))}
        </select>
        <span>{labels.page(table.getState().pagination.pageIndex + 1, table.getPageCount() || 1)}</span>
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          {labels.previous}
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          {labels.next}
        </Button>
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
    <Button variant="ghost" size="sm" className="-ml-3" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
      {title}{column.getIsSorted() === "asc" ? " ↑" : column.getIsSorted() === "desc" ? " ↓" : ""}
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
