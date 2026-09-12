"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons"
import type { Table } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import type {
  DataTableFilterState,
  DataTableLabels,
  ResolvedFilter,
} from "../data-table.types"
import { DataTableFilterField } from "./data-table-filter-field"

export function DataTableFilterMenu<TData>({
  table,
  filters,
  activeFilters,
  onChange,
  labels,
  manualFiltering,
}: {
  table: Table<TData>
  filters: ResolvedFilter<TData>[]
  activeFilters: DataTableFilterState[]
  onChange: (id: string, value: unknown) => void
  labels: DataTableLabels
  manualFiltering: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const selected = filters.find(
    (filter) => filter.id === selectedId && !filter.hidden
  )
  const active = activeFilters.find((state) => state.id === selected?.id)
  const count = activeFilters.filter((state) =>
    filters.some((filter) => filter.id === state.id)
  ).length
  React.useEffect(() => {
    if (open)
      contentRef.current
        ?.querySelector<HTMLElement>(
          "[data-filter-body] input, [data-filter-body] button"
        )
        ?.focus()
  }, [selectedId, open])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setSelectedId(null)
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="gap-2">
          <MixerHorizontalIcon aria-hidden="true" />
          {labels.filters}
          {count > 0 && (
            <Badge
              variant="secondary"
              className="rounded-md px-1.5 tabular-nums"
            >
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        align="start"
        className="w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
        aria-labelledby={titleId}
      >
        <div className="flex min-h-12 items-center gap-2 border-b px-3 py-2">
          {selected && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={labels.back}
              onClick={() => setSelectedId(null)}
            >
              <ArrowLeftIcon aria-hidden="true" />
            </Button>
          )}
          <h2 id={titleId} className="text-sm font-medium">
            {selected?.title ?? labels.filters}
          </h2>
          {selected && active && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => onChange(selected.id, undefined)}
            >
              {labels.clearFilter}
            </Button>
          )}
        </div>
        <div data-filter-body>
          {selected ? (
            <div className="p-3">
              <DataTableFilterField
                key={selected.id}
                filter={selected}
                state={active}
                column={table
                  .getAllLeafColumns()
                  .find((column) => column.id === selected.columnId)}
                onChange={(value) => onChange(selected.id, value)}
                labels={labels}
                manualFiltering={manualFiltering}
              />
            </div>
          ) : (
            <Command>
              <CommandInput
                placeholder={labels.searchFilters}
                aria-label={labels.searchFilters}
              />
              <CommandList>
                <CommandEmpty>{labels.noOptions}</CommandEmpty>
                <CommandGroup>
                  {filters
                    .filter((filter) => !filter.hidden)
                    .map((filter) => {
                      const Icon = filter.icon
                      const isActive = activeFilters.some(
                        (state) => state.id === filter.id
                      )
                      return (
                        <CommandItem
                          key={filter.id}
                          value={filter.id}
                          keywords={[filter.title]}
                          onSelect={() => setSelectedId(filter.id)}
                        >
                          {Icon && <Icon className="size-4" />}
                          <span className="min-w-0 flex-1 wrap-anywhere">
                            {filter.title}
                          </span>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="size-1.5 rounded-full bg-primary"
                            />
                          )}
                          <ChevronRightIcon aria-hidden="true" />
                        </CommandItem>
                      )
                    })}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
