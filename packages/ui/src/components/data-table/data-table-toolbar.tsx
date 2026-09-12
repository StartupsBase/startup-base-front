"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import type { Table } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFilterMenu } from "./filters/data-table-filter-menu"
import { DataTableActiveFilters } from "./filters/data-table-active-filters"
import type {
  DataTableFilterState,
  DataTableLabels,
  DataTableSearch,
  ResolvedFilter,
} from "./data-table.types"
import { SEARCH_FILTER_ID } from "./data-table.utils"

export function DataTableToolbar<TData>({
  table,
  search,
  filters,
  activeFilters,
  onChange,
  onReset,
  labels,
  manualFiltering,
}: {
  table: Table<TData>
  search?: DataTableSearch
  filters: ResolvedFilter<TData>[]
  activeFilters: DataTableFilterState[]
  onChange: (id: string, value: unknown) => void
  onReset: () => void
  labels: DataTableLabels
  manualFiltering: boolean
}) {
  const searchState = activeFilters.find(
    (entry) => entry.id === SEARCH_FILTER_ID
  )
  const searchValue = searchState?.type === "text" ? searchState.value : ""
  const hasActiveFields = activeFilters.some(
    (entry) => entry.id !== SEARCH_FILTER_ID
  )
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      {search && (
        <div className="relative w-full min-w-0 sm:w-auto sm:basis-64">
          <Input
            aria-label={search.placeholder ?? labels.search}
            placeholder={search.placeholder ?? labels.search}
            className="w-full pr-9"
            value={searchValue}
            onChange={(event) => onChange(SEARCH_FILTER_ID, event.target.value)}
          />
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-1/2 right-2 -translate-y-1/2"
              aria-label={labels.resetSearch}
              onClick={() => onChange(SEARCH_FILTER_ID, undefined)}
            >
              <Cross2Icon aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
      {filters.some((filter) => !filter.hidden) && (
        <DataTableFilterMenu
          table={table}
          filters={filters}
          activeFilters={activeFilters}
          onChange={onChange}
          labels={labels}
          manualFiltering={manualFiltering}
        />
      )}
      <div className="order-3 flex min-w-0 basis-full flex-wrap items-center gap-2 lg:order-none lg:flex-1 lg:basis-0">
        <DataTableActiveFilters
          filters={filters}
          activeFilters={activeFilters}
          onChange={onChange}
          labels={labels}
        />
        {activeFilters.length > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            {hasActiveFields ? labels.clearFilters : labels.resetFilters}
          </Button>
        )}
      </div>
      <div className="ml-auto">
        <DataTableViewOptions table={table} labels={labels} />
      </div>
    </div>
  )
}
