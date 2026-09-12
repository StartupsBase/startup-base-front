"use client"

import * as React from "react"
import { ViewVerticalIcon } from "@radix-ui/react-icons"
import { type Table } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { type DataTableLabels } from "./data-table.types"

export function DataTableViewOptions<TData>({
  table,
  labels,
}: {
  table: Table<TData>
  labels: DataTableLabels
}) {
  const id = React.useId()
  const columns = table
    .getAllLeafColumns()
    .filter((column) => column.getCanHide())

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <ViewVerticalIcon aria-hidden="true" />
          {labels.columns}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        aria-labelledby={`${id}-title`}
        className="w-64 max-w-[calc(100vw-2rem)] gap-1 overflow-hidden border border-border p-1.5"
      >
        <div className="mb-1 flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
          <h2 id={`${id}-title`} className="text-sm font-medium">
            {labels.columns}
          </h2>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
            {columns.filter((column) => column.getIsVisible()).length}/
            {columns.length}
          </span>
        </div>
        <div className="max-h-72 space-y-0.5 overflow-y-auto">
          {columns.map((column) => (
            <label
              key={column.id}
              className="flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/70 has-[:focus-visible]:bg-muted"
            >
              <Checkbox
                checked={column.getIsVisible()}
                onCheckedChange={(checked) =>
                  column.toggleVisibility(checked === true)
                }
              />
              <span className="min-w-0 break-words">
                {column.columnDef.meta?.label ??
                  (typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id)}
              </span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
