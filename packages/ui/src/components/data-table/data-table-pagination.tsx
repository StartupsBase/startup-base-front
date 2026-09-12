"use client"

import { type Table } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { type DataTableLabels } from "./data-table.types"

export function DataTablePagination<TData>({
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
              className="w-16 shrink-0 rounded-lg text-foreground"
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
            className="min-w-0 text-foreground"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="truncate">{labels.previous}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="min-w-0 text-foreground"
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
