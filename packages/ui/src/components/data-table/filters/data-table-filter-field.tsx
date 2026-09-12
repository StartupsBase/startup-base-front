"use client"

import * as React from "react"
import type { Column } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import type {
  DataTableFilterState,
  DataTableLabels,
  ResolvedFilter,
} from "../data-table.types"

export function DataTableFilterField<TData>({
  filter,
  state,
  column,
  onChange,
  labels,
  manualFiltering,
}: {
  filter: ResolvedFilter<TData>
  state?: DataTableFilterState
  column?: Column<TData>
  onChange: (value: unknown) => void
  labels: DataTableLabels
  manualFiltering: boolean
}) {
  const [query, setQuery] = React.useState("")
  const id = React.useId()
  const facets = manualFiltering ? undefined : column?.getFacetedUniqueValues()
  const counts = React.useMemo(() => {
    const result = new Map<string, number>()
    facets?.forEach((count, value: unknown) => {
      const key = String(value)
      result.set(key, (result.get(key) ?? 0) + count)
    })
    return result
  }, [facets])

  switch (filter.type) {
    case "select":
    case "multi-select": {
      const selected =
        state?.type === "multi-select"
          ? state.value
          : state?.type === "select"
            ? [state.value]
            : []
      const options = filter.options.filter((option) =>
        option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase())
      )
      return (
        <div className="space-y-2">
          {filter.searchable && (
            <Input
              aria-label={labels.searchOptions}
              placeholder={filter.placeholder ?? labels.searchOptions}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          )}
          <div
            className="max-h-64 space-y-1 overflow-y-auto"
            role="group"
            aria-label={filter.title}
          >
            {options.length ? (
              options.map((option) => {
                const checked = selected.includes(option.value)
                const Icon = option.icon
                const content = (
                  <>
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="min-w-0 flex-1 wrap-anywhere">
                      {option.label}
                    </span>
                    {!manualFiltering && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {counts.get(option.value) ?? 0}
                      </span>
                    )}
                  </>
                )
                return filter.type === "multi-select" ? (
                  <label
                    key={option.value}
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        onChange(
                          checked
                            ? selected.filter((value) => value !== option.value)
                            : [...selected, option.value]
                        )
                      }
                    />
                    {content}
                  </label>
                ) : (
                  <Button
                    key={option.value}
                    type="button"
                    variant={checked ? "secondary" : "ghost"}
                    aria-pressed={checked}
                    className="h-auto min-h-10 w-full justify-start rounded-lg px-2 py-2 text-left whitespace-normal"
                    onClick={() => onChange(checked ? undefined : option.value)}
                  >
                    {content}
                  </Button>
                )
              })
            ) : (
              <p className="p-3 text-sm text-muted-foreground">
                {labels.noOptions}
              </p>
            )}
          </div>
        </div>
      )
    }
    case "boolean":
      return (
        <div className="grid gap-1" role="group" aria-label={filter.title}>
          {[true, false].map((value) => (
            <Button
              key={String(value)}
              type="button"
              variant={state?.value === value ? "secondary" : "ghost"}
              aria-pressed={state?.value === value}
              className="justify-start"
              onClick={() =>
                onChange(state?.value === value ? undefined : value)
              }
            >
              {value
                ? (filter.trueLabel ?? labels.trueLabel)
                : (filter.falseLabel ?? labels.falseLabel)}
              {!manualFiltering && (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {counts.get(String(value)) ?? 0}
                </span>
              )}
            </Button>
          ))}
        </div>
      )
    case "text":
    case "date":
      return (
        <div className="space-y-2">
          <label htmlFor={id} className="text-xs text-muted-foreground">
            {filter.title}
          </label>
          <Input
            id={id}
            type={filter.type === "date" ? "date" : "text"}
            placeholder={filter.placeholder}
            value={typeof state?.value === "string" ? state.value : ""}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      )
    case "date-range":
    case "number-range": {
      const range =
        state?.type === "date-range" || state?.type === "number-range"
          ? state.value
          : [null, null]
      const bounds =
        filter.type === "date-range"
          ? [labels.from, labels.to]
          : [labels.min, labels.max]
      return (
        <div className="grid min-w-0 grid-cols-2 gap-3">
          {bounds.map((label, index) => (
            <div key={label} className="min-w-0 space-y-2">
              <label
                htmlFor={`${id}-${index}`}
                className="text-xs text-muted-foreground"
              >
                {label}
              </label>
              <Input
                id={`${id}-${index}`}
                className="min-w-0"
                type={filter.type === "date-range" ? "date" : "number"}
                step={
                  filter.type === "number-range"
                    ? (filter.step ?? "any")
                    : undefined
                }
                value={range[index] ?? ""}
                onChange={(event) => {
                  const next = [...range]
                  next[index] = event.target.value || null
                  onChange(next)
                }}
              />
            </div>
          ))}
        </div>
      )
    }
  }
}
