"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@workspace/ui/components/checkbox"
import {
  defaultDataTableLabels,
  type DataTableLabels,
} from "./data-table.types"

export function getDataTableSelectionColumn<TData>(
  labels: Pick<
    DataTableLabels,
    "selectAllRows" | "selectRow"
  > = defaultDataTableLabels
): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label={labels.selectAllRows}
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
        aria-label={labels.selectRow}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(checked) => row.toggleSelected(checked === true)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}
