"use client"

// Stable public entry point: existing dashboard imports do not need to change.
export { DataTable } from "./data-table/data-table"
export { DataTableColumnHeader } from "./data-table/data-table-column-header"
export { getDataTableSelectionColumn } from "./data-table/data-table-selection"
export type { ColumnDef } from "@tanstack/react-table"
export type {
  DataTableProps,
  DataTableFilter,
  DataTableFilterConfig,
  DataTableFilterDefinition,
  DataTableFilterOption,
  DataTableFilterType,
  DataTableFilterState,
  DataTableLabels,
  DataTableSearch,
} from "./data-table/data-table.types"
export {
  readDataTableFilters,
  writeDataTableFilters,
  createDataTableFilterFn,
} from "./data-table/data-table.utils"
