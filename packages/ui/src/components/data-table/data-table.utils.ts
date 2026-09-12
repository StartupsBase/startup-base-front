import type { FilterFn } from "@tanstack/react-table"
import type {
  DataTableFilterConfig,
  DataTableFilterDefinition,
  DataTableFilterState,
  DataTableSearch,
  ResolvedFilter,
} from "./data-table.types"

export const SEARCH_FILTER_ID = "$search"

export function resolveFilters<TData>(
  definitions: readonly DataTableFilterDefinition<TData>[]
): ResolvedFilter<TData>[] {
  return definitions.map((filter) =>
    filter.type
      ? filter
      : { ...filter, id: filter.columnId, type: "select", legacy: true }
  )
}

export function numberValue(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null
  if (typeof value === "string" && !value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

/** Calendar days and timestamps are compared by UTC day, independent of the browser timezone. */
export function dateValue(value: unknown): string | null {
  if (
    !(value instanceof Date) &&
    typeof value !== "string" &&
    typeof value !== "number"
  )
    return null
  if (typeof value === "string" && !value.trim()) return null
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const day = date.toISOString().slice(0, 10)
  // Reject impossible date-only inputs rather than accepting Date's overflow normalization.
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    value !== day
  )
    return null
  return day
}

export function normalizeFilter<TData>(
  filter: DataTableFilterConfig<TData>,
  value: unknown
): DataTableFilterState | undefined {
  const base = { id: filter.id, columnId: filter.columnId }
  switch (filter.type) {
    case "text":
      return typeof value === "string" && value.length
        ? { ...base, type: "text", operator: "contains", value }
        : undefined
    case "select":
      return typeof value === "string" && value.length
        ? { ...base, type: "select", operator: "eq", value }
        : undefined
    case "multi-select": {
      const values = Array.isArray(value)
        ? [
            ...new Set(
              value.filter((item): item is string => typeof item === "string")
            ),
          ]
        : []
      return values.length
        ? { ...base, type: "multi-select", operator: "in", value: values }
        : undefined
    }
    case "boolean":
      return typeof value === "boolean"
        ? { ...base, type: "boolean", operator: "eq", value }
        : undefined
    case "date": {
      const date = dateValue(value)
      return date
        ? { ...base, type: "date", operator: "on", value: date }
        : undefined
    }
    case "date-range": {
      const range: [string | null, string | null] = Array.isArray(value)
        ? [dateValue(value[0]), dateValue(value[1])]
        : [null, null]
      return range.some((bound) => bound !== null)
        ? { ...base, type: "date-range", operator: "between", value: range }
        : undefined
    }
    case "number-range": {
      const range: [number | null, number | null] = Array.isArray(value)
        ? [numberValue(value[0]), numberValue(value[1])]
        : [null, null]
      return range.some((bound) => bound !== null)
        ? { ...base, type: "number-range", operator: "between", value: range }
        : undefined
    }
  }
}

/** Revalidate external state; drop removed definitions and duplicate/invalid entries. */
export function normalizeFilterState<TData>(
  filters: readonly DataTableFilterConfig<TData>[],
  state: readonly { id: string; value: unknown }[],
  search?: DataTableSearch
): DataTableFilterState[] {
  const result: DataTableFilterState[] = []
  for (const filter of filters) {
    const entry = state.find((item) => item.id === filter.id)
    const normalized = normalizeFilter(filter, entry?.value)
    if (normalized) result.push(normalized)
  }
  if (search) {
    const entry = state.find((item) => item.id === SEARCH_FILTER_ID)
    const normalized = normalizeFilter(
      {
        id: SEARCH_FILTER_ID,
        columnId: search.columnId,
        title: "",
        type: "text",
      },
      entry?.value
    )
    if (normalized) result.push(normalized)
  }
  return result
}

export function createDataTableFilterFn<TData>(
  filter: DataTableFilterConfig<TData>
): FilterFn<TData> {
  const predicate: FilterFn<TData> = (row, columnId, raw: unknown) => {
    const state = normalizeFilter(filter, raw)
    if (!state) return true
    const cell: unknown = row.getValue(columnId)
    switch (state.type) {
      case "text":
        return (
          cell != null &&
          String(cell)
            .toLocaleLowerCase()
            .includes(state.value.toLocaleLowerCase())
        )
      case "select":
        return (Array.isArray(cell) ? cell : [cell]).some(
          (value: unknown) => value != null && String(value) === state.value
        )
      case "multi-select":
        return (Array.isArray(cell) ? cell : [cell]).some(
          (value: unknown) =>
            value != null && state.value.includes(String(value))
        )
      case "boolean":
        return cell === state.value
      case "date":
        return dateValue(cell) === state.value
      case "date-range": {
        const date = dateValue(cell)
        const [from, to] = state.value
        return (
          date !== null &&
          (from === null || date >= from) &&
          (to === null || date <= to)
        )
      }
      case "number-range": {
        const number = numberValue(cell)
        const [min, max] = state.value
        return (
          number !== null &&
          (min === null || number >= min) &&
          (max === null || number <= max)
        )
      }
    }
  }
  predicate.autoRemove = (value: unknown) => !normalizeFilter(filter, value)
  return predicate
}

/** Adapt normalized state to an existing query string without a router dependency. */
export function writeDataTableFilters(
  params: URLSearchParams,
  state: readonly DataTableFilterState[],
  key = "filters"
): URLSearchParams {
  const next = new URLSearchParams(params)
  if (state.length)
    next.set(key, JSON.stringify(state.map(({ id, value }) => ({ id, value }))))
  else next.delete(key)
  return next
}

export function readDataTableFilters<TData>(
  params: URLSearchParams,
  definitions: readonly DataTableFilterDefinition<TData>[],
  search?: DataTableSearch,
  key = "filters"
): DataTableFilterState[] {
  try {
    const parsed: unknown = JSON.parse(params.get(key) ?? "[]")
    if (!Array.isArray(parsed)) return []
    const entries = parsed.filter(
      (entry: unknown): entry is { id: string; value: unknown } =>
        typeof entry === "object" &&
        entry !== null &&
        "id" in entry &&
        typeof entry.id === "string" &&
        "value" in entry
    )
    return normalizeFilterState(resolveFilters(definitions), entries, search)
  } catch {
    return []
  }
}
