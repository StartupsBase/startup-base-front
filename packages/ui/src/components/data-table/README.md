# Shared DataTable

Import from `@workspace/ui/components/data-table`. The public entry point and
TanStack Table **8.21.3** are unchanged. Existing `searchColumn`,
`searchPlaceholder`, legacy `{ columnId, title, options }` filters, selection
callbacks, column headers, and label overrides remain supported.

## Configure filters

```tsx
import {
  DataTable,
  type DataTableFilterConfig,
} from "@workspace/ui/components/data-table"

const filters = [
  {
    id: "role",
    columnId: "roles",
    title: t("dashboard.roles"),
    type: "multi-select",
    options: roleOptions,
    searchable: true,
  },
  {
    id: "verified",
    columnId: "verified",
    title: t("users.verified"),
    type: "boolean",
    trueLabel: t("users.verified"),
    falseLabel: t("users.notVerified"),
  },
] satisfies DataTableFilterConfig<User>[]

<DataTable
  columns={columns}
  data={users}
  search={{ columnId: "name", placeholder: t("users.search") }}
  filters={filters}
  initialColumnVisibility={{ roles: false }}
  enableRowSelection
  getRowId={(user) => String(user.id)}
  onRowSelectionChange={setSelectedUsers}
/>
```

A filter references an existing accessor column, including hidden columns and
columns nested in groups. IDs must be unique; configure one filter per column.
`$search` is reserved for toolbar search. Toolbar search uses TanStack global
filtering restricted to its configured column, so search can also combine with a
filter on that same column. `hidden` hides a menu entry; it does not silently
remove an active filter.

New typed definitions install the predicate associated with their type. Legacy
select definitions retain the column's existing TanStack predicate, including
custom `filterFn` behavior. For exact matching, migrate a legacy definition to
`type: "select"` with an `id`.

| Type | Normalized value | Matching |
| --- | --- | --- |
| `text` | `string` | Case-insensitive substring |
| `select` | `string` | Exact scalar match or array membership |
| `multi-select` | `string[]` | Any selected value matches (OR) |
| `boolean` | `boolean` | Strict boolean equality, including `false` |
| `date` | `YYYY-MM-DD` | Same UTC calendar day |
| `date-range` | `[string \| null, string \| null]` | Inclusive UTC days |
| `number-range` | `[number \| null, number \| null]` | Inclusive numeric bounds |

Different fields combine with AND. Numeric option IDs compare with their string
option values. For array-valued columns such as roles, return the actual array
from the accessor and format it only in the cell renderer. Facet counts then
include each distinct value once per row and respond to other active filters.

Ranges may have either bound empty. Empty ranges and empty multi-selects remove
the filter. Reversed ranges return no rows until corrected. Invalid cell values
and nulls do not match active range filters; numeric zero remains valid. Dates
are interpreted in UTC so the end date includes its entire day consistently
across browsers. Use `getOptionLabel` for custom chip formatting.

The toolbar's clear-all action resets both search and configured filters. The
search clear button only resets search. Chips remove an entire field or one
multi-select value. Client pagination resets when filters change. Selection
survives filtering; provide `getRowId` for stable identity when data is reordered
or refreshed.

## Controlled state and server filtering

```tsx
const [filterState, setFilterState] = useState<DataTableFilterState[]>([])

<DataTable
  columns={columns}
  data={filteredDataFromApi}
  filters={filters}
  filterState={filterState}
  onFiltersChange={setFilterState}
  manualFiltering
/>
```

`defaultFilterState` initializes uncontrolled tables. `filterState` opts into
controlled mode; the parent must commit changes from `onFiltersChange`.
The callback also works in uncontrolled mode. It emits serializable entries:

```ts
[
  { id: "role", columnId: "roles", type: "multi-select", operator: "in", value: ["ADMIN"] },
  { id: "price", columnId: "price", type: "number-range", operator: "between", value: [0, 500000] },
]
```

Toolbar search emits `{ id: "$search", columnId, type: "text", operator:
"contains", value }`. This representation is separate from TanStack's internal
state. Adapt it to your API in the page or data hook. `manualFiltering` skips
local filtering and hides facet counts; incoming data is assumed already
filtered. Sorting and pagination still operate on supplied rows; this is not a
server pagination API. Selection callbacks return selected rows present in the
supplied data.

Keep controlled state and filter definitions consistent when options/configuration
change. Invalid values and state for removed definitions are excluded from the
table's effective state. Missing options remain removable chips, which supports
options loaded asynchronously.

## Optional URL adapter

```tsx
const search = { columnId: "name" }
const initial = readDataTableFilters(new URLSearchParams(location.search), filters, search)
const nextParams = writeDataTableFilters(new URLSearchParams(location.search), nextFilters)
// Pass nextParams to your router/history adapter in the consuming application.
```

The helpers encode IDs and typed values as JSON in a namespaced query parameter
(`filters` by default; the final argument overrides it). They preserve unrelated
parameters and do not navigate. Parsing validates values against current filter
definitions and safely ignores malformed input. An application's adapter can
use the normalized state to produce a different URL schema, and should reset
its own page parameter when changing filters.

## Labels and examples

Every shared control has a label override in `DataTableLabels`, including
`filters`, `searchFilters`, `searchOptions`, `clearFilters`, `clearFilter`, `back`,
`from`, `to`, `min`, `max`, `noOptions`, boolean defaults, remove-button label
functions, and selection checkbox labels. Domain labels always come from filter
configuration. Old label overrides continue to work; new labels default to English.

`data-table.examples.tsx` provides typed Products (status, category, availability,
price) and Users (role, status, verified, created date) examples. These are example
fixtures only, not part of the shared component's runtime imports. Both render
exactly the same DataTable.

Interactive examples and browser regression coverage live in
`../data-table.stories.tsx` under **Patterns / Data table** in Storybook.

```sh
pnpm nx run @workspace/ui:storybook:test src/components/data-table.stories.tsx
pnpm nx run @workspace/ui:typecheck
pnpm nx run @workspace/ui:lint src/components/data-table.tsx src/components/data-table.stories.tsx src/components/data-table
```

## Date pickers and mobile filters

Date fields use the shared shadcn DatePicker and DateRangePicker on desktop,
with month/year dropdowns and a Today shortcut. Add `locale` to a date filter
(e.g. `datePickerUzLocale` from `@workspace/ui/components/date-picker`) to localize
the calendar. The normalized `YYYY-MM-DD` values and UTC filtering semantics are
unchanged; selecting a calendar date never serializes local midnight as UTC.
The From/To summary lets users clear either range endpoint independently.

Below 768px, Filters opens a bottom sheet with a scrollable body, larger touch
targets, selected-value summaries, and a fixed footer above the device safe area.
Calendars render inline so users don't have to manage overlapping popovers.
The keyboard opens only when users tap a search/text field. Changes apply
immediately; Show results closes the sheet, while Clear all resets search and
filters. In manual-filtering mode the close action is labeled Done.

Additional label overrides: `chooseDate`, `chooseDateRange`, `today`, `clearDate`,
`dateRangeHint`, `done`, `showResults(count)`, and `filtersDescription`.
