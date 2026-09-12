import * as React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, fn, userEvent, waitFor, within } from "storybook/test"
import {
  createTable,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type ColumnDef,
} from "@tanstack/react-table"
import { Button } from "./button"
import {
  DataTable,
  readDataTableFilters,
  writeDataTableFilters,
  type DataTableFilterState,
  type DataTableFilterConfig,
} from "./data-table"
import {
  ProductsExample,
  UsersExample,
  exampleProducts,
  exampleUsers,
  productColumns,
  userColumns,
} from "./data-table/data-table.examples"
import {
  createDataTableFilterFn,
  normalizeFilter,
  normalizeFilterState,
} from "./data-table/data-table.utils"

const meta = {
  title: "Patterns/Data table",
  component: ProductsExample,
  parameters: { layout: "fullscreen", a11y: { test: "error" } },
} satisfies Meta<typeof ProductsExample>
export default meta
type Story = StoryObj<typeof meta>

async function openFilter(canvasElement: HTMLElement, title: string) {
  const canvas = within(canvasElement)
  const screen = within(canvasElement.ownerDocument.body)
  await userEvent.click(canvas.getByRole("button", { name: /^Filters/ }))
  await userEvent.click(await screen.findByRole("option", { name: title }))
  return screen
}
async function september2026(screen: ReturnType<typeof within>) {
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Choose the Year" }),
    "2026"
  )
  await userEvent.selectOptions(
    screen.getByRole("combobox", { name: "Choose the Month" }),
    "8"
  )
}

async function closeFilter() {
  await userEvent.keyboard("{Escape}")
}

export const Products: Story = {
  render: () => <ProductsExample pageSizeOptions={[2, 10]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText("Cotton shirt")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Next" }))
    await expect(canvas.getByText("Leather shoes")).toBeVisible()
    let screen = await openFilter(canvasElement, "Status")
    await userEvent.click(screen.getByRole("checkbox", { name: /^Active/ }))
    await closeFilter()
    await expect(canvas.getByText("Page 1 of 1")).toBeVisible()
    await expect(canvas.getByText("Cotton shirt")).toBeVisible()
    await expect(canvas.queryByText("Linen shirt")).not.toBeInTheDocument()
    screen = await openFilter(canvasElement, "Status")
    await expect(
      screen.queryByRole("textbox", { name: "Search options..." })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: /^Draft/ }))
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    await userEvent.click(screen.getByRole("option", { name: "Category" }))
    await userEvent.type(
      screen.getByRole("textbox", { name: "Search options..." }),
      "cloth"
    )
    await expect(
      screen.queryByRole("checkbox", { name: /^Shoes/ })
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("checkbox", { name: /^Clothing/ }))
    await closeFilter()
    await expect(
      canvas.getByRole("button", { name: "Filters 2" })
    ).toBeVisible()
    await expect(canvas.getByText("Linen shirt")).toBeVisible()
    await expect(canvas.queryByText("Leather shoes")).not.toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Status: Draft" })
    )
    await expect(canvas.queryByText("Linen shirt")).not.toBeInTheDocument()
    await userEvent.click(
      canvas.getByRole("button", { name: "Remove Category filter" })
    )
    await expect(canvas.getByText("Leather shoes")).toBeVisible()
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Search products..." }),
      "cotton"
    )
    await expect(canvas.queryByText("Leather shoes")).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Reset search" }))
    await userEvent.click(canvas.getByRole("button", { name: "Price" }))
    await userEvent.click(canvas.getByRole("button", { name: /Price/ }))
    await expect(canvas.getAllByRole("row")[1]).toHaveTextContent(
      "Leather shoes"
    )
    await userEvent.click(canvas.getByRole("button", { name: "Clear all" }))
    await expect(canvas.getByText("Page 1 of 3")).toBeVisible()
    await expect(
      canvas.queryByRole("button", { name: "Clear all" })
    ).not.toBeInTheDocument()
  },
}

export const Users: Story = {
  render: () => <UsersExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const screen = await openFilter(canvasElement, "Role")
    await expect(
      screen.getByRole("checkbox", { name: "Admin 2" })
    ).toBeVisible()
    await userEvent.click(screen.getByRole("checkbox", { name: /^Admin/ }))
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    await userEvent.click(screen.getByRole("option", { name: "Verified" }))
    await userEvent.click(screen.getByRole("button", { name: /^Not verified/ }))
    await closeFilter()
    await expect(canvas.getByText("Malika Usmonova")).toBeVisible()
    await expect(canvas.queryByText("Aziza Karimova")).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Clear all" }))
    await openFilter(canvasElement, "Status")
    await userEvent.click(screen.getByRole("button", { name: /^Invited/ }))
    await closeFilter()
    await expect(canvas.getByText("Malika Usmonova")).toBeVisible()
    await expect(canvas.queryByText("Jasur Aliyev")).not.toBeInTheDocument()
  },
}

export const Ranges: Story = {
  render: () => (
    <>
      <UsersExample />
      <div className="mt-10" data-testid="products">
        <ProductsExample />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const users = canvas.getAllByRole("table")[0]?.closest(".space-y-4")
    if (!(users instanceof HTMLElement)) throw new Error("Missing user table")
    const screen = await openFilter(users, "Created date")
    await userEvent.click(
      screen.getByRole("combobox", { name: "Created date" })
    )
    await september2026(screen)
    await userEvent.click(
      screen.getByRole("button", { name: /September 1st, 2026/ })
    )
    await userEvent.click(
      screen.getByRole("button", { name: /September 12th, 2026/ })
    )
    await waitFor(() =>
      expect(screen.queryByRole("grid")).not.toBeInTheDocument()
    )
    await closeFilter()
    await expect(canvas.getByText("Jasur Aliyev")).toBeVisible()
    await expect(canvas.queryByText("Malika Usmonova")).not.toBeInTheDocument()
    await userEvent.click(
      within(users).getByRole("button", { name: "Clear all" })
    )
    const products = canvas.getByTestId("products")
    await openFilter(products, "Price")
    await userEvent.type(screen.getByLabelText("Min"), "180000")
    await userEvent.type(screen.getByLabelText("Max"), "240000")
    await closeFilter()
    await expect(within(products).getByText("Linen shirt")).toBeVisible()
    await expect(within(products).getByText("Canvas shoes")).toBeVisible()
    await expect(
      within(products).queryByText("Cotton shirt")
    ).not.toBeInTheDocument()
  },
}

const selectionChanged = fn()
export const SelectionAndHiddenColumns: Story = {
  render: () => <ProductsExample onRowSelectionChange={selectionChanged} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(
      within(canvas.getAllByRole("row")[1]!).getByRole("checkbox")
    )
    await expect(selectionChanged).toHaveBeenLastCalledWith([
      exampleProducts[0],
    ])
    const screen = await openFilter(canvasElement, "Status")
    await userEvent.click(screen.getByRole("checkbox", { name: /^Draft/ }))
    await closeFilter()
    await expect(canvas.getByText("0 of 2 row(s) selected")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Columns" }))
    await userEvent.click(screen.getByRole("checkbox", { name: "Status" }))
    await closeFilter()
    await expect(
      canvas.queryByRole("columnheader", { name: "Status" })
    ).not.toBeInTheDocument()
    await expect(canvas.getByText("Linen shirt")).toBeVisible()
    await expect(canvas.queryByText("Cotton shirt")).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole("button", { name: "Clear all" }))
    await expect(canvas.getByText("1 of 5 row(s) selected")).toBeVisible()
    await expect(
      within(canvas.getAllByRole("row")[1]!).getByRole("checkbox")
    ).toBeChecked()
  },
}

function ControlledExample() {
  const [state, setState] = React.useState<DataTableFilterState[]>([])
  return (
    <>
      <ProductsExample
        filterState={state}
        onFiltersChange={setState}
        manualFiltering
      />
      <output aria-label="Normalized filters">{JSON.stringify(state)}</output>
      <Button onClick={() => setState([])}>External reset</Button>
    </>
  )
}
export const ControlledServer: Story = {
  render: () => <ControlledExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const screen = await openFilter(canvasElement, "Availability")
    await userEvent.click(screen.getByRole("button", { name: "Unavailable" }))
    await closeFilter()
    await expect(canvas.getByLabelText("Normalized filters")).toHaveTextContent(
      '"value":false'
    )
    await expect(canvas.getByLabelText("Normalized filters")).toHaveTextContent(
      '"operator":"eq"'
    )
    await expect(canvas.getByText("Cotton shirt")).toBeVisible()
    await userEvent.click(
      canvas.getByRole("button", { name: "External reset" })
    )
    await expect(
      canvas.queryByRole("button", { name: "Clear all" })
    ).not.toBeInTheDocument()
  },
}

export const LegacyAndNoFilters: Story = {
  render: () => (
    <>
      <div data-testid="legacy">
        <DataTable
          columns={userColumns}
          data={exampleUsers}
          searchColumn="name"
          filters={[
            {
              columnId: "status",
              title: "Status",
              options: [{ label: "Invited", value: "INVITED" }],
            },
          ]}
        />
      </div>
      <div data-testid="plain" className="mt-8">
        <DataTable columns={productColumns} data={exampleProducts} />
      </div>
    </>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      within(canvas.getByTestId("plain")).queryByRole("button", {
        name: /^Filters/,
      })
    ).not.toBeInTheDocument()
    const screen = await openFilter(canvas.getByTestId("legacy"), "Status")
    await userEvent.click(screen.getByRole("button", { name: /^Invited/ }))
    await closeFilter()
    await expect(canvas.getByText("Malika Usmonova")).toBeVisible()
    await expect(canvas.queryByText("Aziza Karimova")).not.toBeInTheDocument()
  },
}

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => (
    <div style={{ width: 320, maxWidth: "100%" }} data-testid="mobile-table">
      <ProductsExample
        defaultFilterState={[
          {
            id: "status",
            columnId: "status",
            type: "multi-select",
            operator: "in",
            value: ["ACTIVE", "DRAFT"],
          },
          {
            id: "category",
            columnId: "categoryId",
            type: "multi-select",
            operator: "in",
            value: ["1", "2"],
          },
        ]}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const wrapper = canvas.getByTestId("mobile-table")
    await waitFor(() =>
      expect(wrapper.scrollWidth).toBeLessThanOrEqual(wrapper.clientWidth + 1)
    )
    const screen = await openFilter(canvasElement, "Status")
    await expect(
      screen.getByRole("checkbox", { name: /^Active/ })
    ).toBeChecked()
    await closeFilter()
  },
}

export const FilterSemantics: Story = {
  render: () => <ProductsExample />,
  play: async () => {
    type Item = {
      status: string
      roles: string[]
      amount: number | string | null
      day: string | null
      verified: boolean
    }
    const data: Item[] = [
      {
        status: "ACTIVE",
        roles: ["ADMIN", "OWNER"],
        amount: 0,
        day: "2026-09-01T00:00:00Z",
        verified: false,
      },
      {
        status: "DRAFT",
        roles: ["SELLER"],
        amount: "20",
        day: "2026-09-12T23:59:59Z",
        verified: true,
      },
      {
        status: "ARCHIVED",
        roles: ["ADMIN"],
        amount: 100,
        day: "2026-09-13T00:00:00Z",
        verified: true,
      },
      { status: "ACTIVE", roles: [], amount: null, day: null, verified: false },
    ]
    const configs: DataTableFilterConfig<Item>[] = [
      {
        id: "status",
        columnId: "status",
        title: "Status",
        type: "multi-select",
        options: [],
      },
      {
        id: "roles",
        columnId: "roles",
        title: "Roles",
        type: "multi-select",
        options: [],
      },
      {
        id: "amount",
        columnId: "amount",
        title: "Amount",
        type: "number-range",
      },
      { id: "day", columnId: "day", title: "Date", type: "date-range" },
      {
        id: "verified",
        columnId: "verified",
        title: "Verified",
        type: "boolean",
      },
    ]
    function rows(values: Record<string, unknown>) {
      const table = createTable({
        data,
        columns: configs.map(
          (config): ColumnDef<Item> => ({
            accessorKey: config.columnId,
            filterFn: createDataTableFilterFn(config),
          })
        ),
        state: {
          columnFilters: Object.entries(values).map(([id, value]) => ({
            id,
            value,
          })),
          sorting: [],
          pagination: { pageIndex: 0, pageSize: 10 },
        },
        onStateChange: () => {},
        renderFallbackValue: null,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
      })
      return table.getRowModel().rows.map((row) => row.original)
    }
    await expect(rows({})).toHaveLength(4)
    await expect(rows({ status: ["ACTIVE", "DRAFT"] })).toHaveLength(3)
    await expect(
      rows({ status: ["ACTIVE", "DRAFT"], roles: ["ADMIN"] })
    ).toEqual([data[0]])
    await expect(rows({ amount: [0, 20] })).toEqual(data.slice(0, 2))
    await expect(rows({ amount: [null, 20] })).toEqual(data.slice(0, 2))
    await expect(rows({ amount: [20, null] })).toEqual(data.slice(1, 3))
    await expect(rows({ amount: [100, 20] })).toEqual([])
    await expect(rows({ verified: false })).toEqual([data[0], data[3]])
    await expect(rows({ day: ["2026-09-01", "2026-09-12"] })).toEqual(
      data.slice(0, 2)
    )
    await expect(rows({ day: [null, "2026-09-12"] })).toEqual(data.slice(0, 2))
    await expect(rows({ day: ["2026-09-12", null] })).toEqual(data.slice(1, 3))
    await expect(
      normalizeFilter(
        { id: "date", columnId: "day", title: "", type: "date" },
        "2026-02-30"
      )
    ).toBeUndefined()
    await expect(normalizeFilter(configs[0]!, [])).toBeUndefined()
    const state = normalizeFilterState(configs, [
      { id: "verified", value: false },
      { id: "amount", value: [0, 20] },
    ])
    const params = writeDataTableFilters(new URLSearchParams("page=2"), state)
    await expect(params.get("page")).toBe("2")
    await expect(readDataTableFilters(params, configs)).toEqual(state)
    await expect(
      readDataTableFilters(new URLSearchParams("filters=broken"), configs)
    ).toEqual([])
    await expect(writeDataTableFilters(params, []).has("filters")).toBe(false)
    await expect(
      normalizeFilterState(configs, [{ id: "removed", value: "x" }])
    ).toEqual([])
  },
}

export const TextDateAndKeyboard: Story = {
  render: () => (
    <UsersExample
      filters={[
        { id: "name", columnId: "name", title: "Name contains", type: "text" },
        { id: "day", columnId: "createdAt", title: "On date", type: "date" },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole("button", { name: "Filters" }))
    await userEvent.type(
      screen.getByRole("combobox", { name: "Search filters..." }),
      "Name"
    )
    await userEvent.keyboard("{Enter}")
    await userEvent.type(
      screen.getByRole("textbox", { name: "Name contains" }),
      "Aziza"
    )
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    await userEvent.click(screen.getByRole("option", { name: "On date" }))
    await userEvent.click(screen.getByRole("combobox", { name: "On date" }))
    await september2026(screen)
    await userEvent.click(
      screen.getByRole("button", { name: /September 1st, 2026/ })
    )
    await waitFor(() =>
      expect(screen.queryByRole("grid")).not.toBeInTheDocument()
    )
    await closeFilter()
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Filters 2" })).toHaveFocus()
    )
    await expect(canvas.getByText("Aziza Karimova")).toBeVisible()
    await expect(canvas.queryByText("Jasur Aliyev")).not.toBeInTheDocument()
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Search users..." }),
      "Jasur"
    )
    await expect(canvas.getByText("No results found.")).toBeVisible()
    await userEvent.click(canvas.getByRole("button", { name: "Clear all" }))
    await expect(
      canvas.getByRole("textbox", { name: "Search users..." })
    ).toHaveValue("")
    await expect(canvas.getByText("Jasur Aliyev")).toBeVisible()
  },
}

export const FacetedCounts: Story = {
  render: () => <ProductsExample />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const screen = await openFilter(canvasElement, "Category")
    await userEvent.click(screen.getByRole("checkbox", { name: /^Shoes/ }))
    await userEvent.click(screen.getByRole("button", { name: "Back" }))
    await userEvent.click(screen.getByRole("option", { name: "Status" }))
    await expect(
      screen.getByRole("checkbox", { name: "Active 1" })
    ).toBeVisible()
    await expect(
      screen.getByRole("checkbox", { name: "Draft 1" })
    ).toBeVisible()
    await expect(
      screen.getByRole("checkbox", { name: "Archived 0" })
    ).toBeVisible()
    await userEvent.click(screen.getByRole("checkbox", { name: "Active 1" }))
    await expect(
      screen.getByRole("checkbox", { name: "Draft 1" })
    ).toBeVisible()
    await userEvent.click(screen.getByRole("button", { name: "Clear filter" }))
    await closeFilter()
    await expect(
      canvas.getByRole("button", { name: "Filters 1" })
    ).toBeVisible()
    await expect(canvas.getByText("Canvas shoes")).toBeVisible()
  },
}

export const OpenFilterAccessibility: Story = {
  render: () => <ProductsExample />,
  play: async ({ canvasElement }) => {
    const screen = await openFilter(canvasElement, "Status")
    await userEvent.click(screen.getByRole("checkbox", { name: /^Active/ }))
    await expect(
      screen.getByRole("checkbox", { name: /^Active/ })
    ).toBeChecked()
  },
}

export const MobileCalendar: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  render: () => <UsersExample />,
  play: async ({ canvasElement }) => {
    // Storybook's viewport toolbar changes the preview; Vitest needs an explicit
    // browser viewport to exercise matchMedia and the real bottom sheet.
    const browser =
      "__vitest_browser__" in globalThis
        ? await import("vitest/browser")
        : undefined
    await browser?.page.viewport(375, 812)
    const canvas = within(canvasElement)
    const screen = within(canvasElement.ownerDocument.body)
    try {
      await waitFor(() => expect(window.innerWidth).toBeLessThan(768))
      await userEvent.click(canvas.getByRole("button", { name: "Filters" }))
      const sheet = await screen.findByRole("dialog", { name: "Filters" })
      await expect(sheet).toHaveAttribute("data-slot", "sheet-content")
      await expect(
        screen.getByRole("heading", { name: "Filters" })
      ).toHaveFocus()
      await userEvent.click(
        screen.getByRole("option", { name: "Created date" })
      )
      await september2026(screen)
      await userEvent.click(
        screen.getByRole("button", { name: /September 1st, 2026/ })
      )
      await userEvent.click(
        screen.getByRole("button", { name: /September 12th, 2026/ })
      )
      await expect(
        screen.getByRole("button", { name: "Show 2 results" })
      ).toBeVisible()
      await expect(sheet.scrollWidth).toBeLessThanOrEqual(sheet.clientWidth)
      await userEvent.click(
        screen.getByRole("button", { name: "Remove Created date: From" })
      )
      await expect(
        screen.getByRole("button", { name: "Show 3 results" })
      ).toBeVisible()
      await userEvent.click(screen.getByRole("button", { name: "Back" }))
      await expect(
        screen.getByRole("option", { name: /Created date/ })
      ).toHaveTextContent("2026-09-12")
      await userEvent.click(
        within(sheet).getByRole("button", { name: "Clear all" })
      )
      await userEvent.click(
        screen.getByRole("button", { name: "Show 3 results" })
      )
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      )
      await expect(
        canvas.getByRole("button", { name: "Filters" })
      ).toHaveFocus()
    } finally {
      await browser?.page.viewport(1280, 720)
    }
  },
}

export const DatePickerAccessibility: Story = {
  render: () => (
    <UsersExample
      filters={[
        { id: "date", columnId: "createdAt", title: "On date", type: "date" },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    const screen = await openFilter(canvasElement, "On date")
    await userEvent.click(screen.getByRole("combobox", { name: "On date" }))
    await waitFor(() => expect(screen.getByRole("grid")).toBeVisible())
  },
}
