import type { ComponentType } from "react"
import type {
  ColumnDef,
  RowData,
  TableOptions,
  VisibilityState,
} from "@tanstack/react-table"

declare module "@tanstack/react-table" {
  // These parameters must match TanStack's declaration.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    label?: string
  }
}

export type DataTableFilterOption = {
  label: string
  value: string
  icon?: ComponentType<{ className?: string }>
}

type FilterBase<TData> = {
  /** Unique within this table; "$search" is reserved for toolbar search. */
  id: string
  /** Accessor key or explicit column ID. The column may be hidden. */
  columnId: Extract<keyof TData, string> | (string & {})
  title: string
  placeholder?: string
  icon?: ComponentType<{ className?: string }>
  getOptionLabel?: (value: unknown) => string
  /** Hides the menu entry, without disabling an already active filter. */
  hidden?: boolean
}

export type DataTableFilterConfig<TData = unknown> = FilterBase<TData> &
  (
    | { type: "text" }
    | {
        type: "select" | "multi-select"
        options: readonly DataTableFilterOption[]
        searchable?: boolean
      }
    | { type: "boolean"; trueLabel?: string; falseLabel?: string }
    | { type: "date" | "date-range" }
    | { type: "number-range"; step?: number }
  )
export type DataTableFilterType = DataTableFilterConfig["type"]

/** @deprecated Use DataTableFilterConfig. Existing select filters remain supported. */
export type DataTableFilter = {
  columnId: string
  title: string
  options: Array<{ label: string; value: string }>
  type?: never
  id?: never
}
export type DataTableFilterDefinition<TData> =
  | DataTableFilterConfig<TData>
  | DataTableFilter
export type ResolvedFilter<TData> = DataTableFilterConfig<TData> & {
  legacy?: boolean
}

/** Serializable state, independent of TanStack's ColumnFiltersState. */
export type DataTableFilterState = { id: string; columnId: string } & (
  | { type: "text"; operator: "contains"; value: string }
  | { type: "select"; operator: "eq"; value: string }
  | { type: "multi-select"; operator: "in"; value: string[] }
  | { type: "boolean"; operator: "eq"; value: boolean }
  | { type: "date"; operator: "on"; value: string }
  | {
      type: "date-range"
      operator: "between"
      value: [string | null, string | null]
    }
  | {
      type: "number-range"
      operator: "between"
      value: [number | null, number | null]
    }
)

export type DataTableSearch = { columnId: string; placeholder?: string }
export type DataTableLabels = {
  resetFilters: string
  columns: string
  rowsPerPage: string
  selectedRows: (selected: number, total: number) => string
  page: (page: number, total: number) => string
  previous: string
  next: string
  filters: string
  clearFilters: string
  clearFilter: string
  searchFilters: string
  searchOptions: string
  search: string
  resetSearch: string
  back: string
  from: string
  to: string
  min: string
  max: string
  noOptions: string
  trueLabel: string
  falseLabel: string
  removeFilter: (title: string) => string
  removeValue: (title: string, value: string) => string
  selectAllRows: string
  selectRow: string
}
export const defaultDataTableLabels: DataTableLabels = {
  resetFilters: "Reset filters",
  columns: "Columns",
  rowsPerPage: "Rows per page",
  selectedRows: (selected, total) => `${selected} of ${total} row(s) selected`,
  page: (page, total) => `Page ${page} of ${total}`,
  previous: "Previous",
  next: "Next",
  filters: "Filters",
  clearFilters: "Clear all",
  clearFilter: "Clear filter",
  searchFilters: "Search filters...",
  searchOptions: "Search options...",
  search: "Search...",
  resetSearch: "Reset search",
  back: "Back",
  from: "From",
  to: "To",
  min: "Min",
  max: "Max",
  noOptions: "No options found.",
  trueLabel: "Yes",
  falseLabel: "No",
  removeFilter: (title) => `Remove ${title} filter`,
  removeValue: (title, value) => `Remove ${title}: ${value}`,
  selectAllRows: "Select all rows",
  selectRow: "Select row",
}

export type DataTableProps<TData, TValue = unknown> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  search?: DataTableSearch
  /** @deprecated Use search. */
  searchColumn?: string
  /** @deprecated Use search.placeholder. */
  searchPlaceholder?: string
  filters?: readonly DataTableFilterDefinition<TData>[]
  /** Controlled normalized state, including toolbar search with id "$search". */
  filterState?: readonly DataTableFilterState[]
  defaultFilterState?: readonly DataTableFilterState[]
  onFiltersChange?: (filters: DataTableFilterState[]) => void
  /** Incoming data is already filtered. Facet counts are hidden in this mode. */
  manualFiltering?: boolean
  initialColumnVisibility?: VisibilityState
  pageSizeOptions?: number[]
  enableRowSelection?: boolean
  getRowId?: TableOptions<TData>["getRowId"]
  onRowSelectionChange?: (rows: TData[]) => void
  emptyMessage?: string
  labels?: Partial<DataTableLabels>
  className?: string
}
