"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import type {
  DataTableFilterState,
  DataTableLabels,
  ResolvedFilter,
} from "../data-table.types"

function valueLabel<TData>(
  filter: ResolvedFilter<TData>,
  value: unknown,
  labels: DataTableLabels
): string {
  if (filter.getOptionLabel) return filter.getOptionLabel(value)
  if (filter.type === "select" || filter.type === "multi-select")
    return (
      filter.options.find((option) => option.value === value)?.label ??
      String(value)
    )
  if (filter.type === "boolean")
    return value
      ? (filter.trueLabel ?? labels.trueLabel)
      : (filter.falseLabel ?? labels.falseLabel)
  return String(value)
}

export function DataTableActiveFilters<TData>({
  filters,
  activeFilters,
  onChange,
  labels,
}: {
  filters: ResolvedFilter<TData>[]
  activeFilters: DataTableFilterState[]
  onChange: (id: string, value: unknown) => void
  labels: DataTableLabels
}) {
  return (
    <>
      {activeFilters.map((state) => {
        const filter = filters.find((item) => item.id === state.id)
        if (!filter) return null
        const rangeLabels =
          state.type === "number-range"
            ? [labels.min, labels.max]
            : [labels.from, labels.to]
        const display =
          state.type === "multi-select"
            ? null
            : state.type === "date-range" || state.type === "number-range"
              ? state.value
                  .map((value, index) =>
                    value === null
                      ? null
                      : `${rangeLabels[index]}: ${valueLabel(filter, value, labels)}`
                  )
                  .filter(Boolean)
                  .join(" – ")
              : valueLabel(filter, state.value, labels)
        return (
          <Badge
            key={state.id}
            variant="outline"
            className="max-w-full gap-1 rounded-lg py-1 pr-1 whitespace-normal"
          >
            <span className="min-w-0 font-medium wrap-anywhere">
              {filter.title}:
            </span>
            {state.type === "multi-select" ? (
              <span className="flex min-w-0 flex-wrap gap-1">
                {state.value.map((value) => (
                  <Button
                    type="button"
                    key={value}
                    variant="secondary"
                    size="xs"
                    className="h-auto min-h-6 max-w-full rounded-md py-0.5 text-xs whitespace-normal"
                    aria-label={labels.removeValue(
                      filter.title,
                      valueLabel(filter, value, labels)
                    )}
                    onClick={() =>
                      onChange(
                        state.id,
                        state.value.filter((item) => item !== value)
                      )
                    }
                  >
                    <span className="min-w-0 wrap-anywhere">
                      {valueLabel(filter, value, labels)}
                    </span>
                    <Cross2Icon aria-hidden="true" />
                  </Button>
                ))}
              </span>
            ) : (
              <span className="min-w-0 font-normal wrap-anywhere">
                {display}
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={labels.removeFilter(filter.title)}
              onClick={() => onChange(state.id, undefined)}
            >
              <Cross2Icon aria-hidden="true" />
            </Button>
          </Badge>
        )
      })}
    </>
  )
}
