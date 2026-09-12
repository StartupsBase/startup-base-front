Refactor the existing shared `DataTable` component into a production-ready, reusable, advanced data-table system using:

* React
* TypeScript
* shadcn/ui
* `@tanstack/react-table`
* Tailwind CSS
* the existing project UI components from `@workspace/ui`

Start by inspecting the current DataTable implementation and the installed `@tanstack/react-table` version.

IMPORTANT:

* Do NOT upgrade TanStack Table just to implement this task.
* Preserve the currently installed TanStack version and its API.
* Preserve existing DataTable usages as much as possible.
* Avoid breaking current tables.
* Keep the implementation generic and reusable across the whole dashboard.
* Do not create ProductTable, UserTable, OrderTable-specific filtering logic inside the shared DataTable.

## Main goal

The current table supports:

* sorting
* pagination
* column visibility
* row selection
* search
* basic single-select filters

Upgrade it so filters are completely dynamic and driven by configuration.

For example:

Product table:

* Status
* Category
* Organization
* Availability
* Price range

Users table:

* Role
* Status
* Organization
* Verified
* Created date

Orders table:

* Status
* Payment status
* Organization
* Customer
* Date range
* Amount range

The shared DataTable must know nothing about these domain-specific values.

Each page should only provide filter configuration.

---

# 1. Create a typed dynamic filter system

Replace the current simple:

`DataTableFilter`

with a reusable typed configuration similar conceptually to:

```ts
type DataTableFilterType =
  | "text"
  | "select"
  | "multi-select"
  | "boolean"
  | "date"
  | "date-range"
  | "number-range"

type DataTableFilterOption = {
  label: string
  value: string
  icon?: React.ComponentType
}

type DataTableFilterConfig<TData> = {
  id: string
  columnId: string
  title: string
  type: DataTableFilterType

  options?: DataTableFilterOption[]

  placeholder?: string
  searchable?: boolean
  multiple?: boolean

  icon?: React.ComponentType

  getOptionLabel?: (value: unknown) => string

  hidden?: boolean
}
```

You may improve this type design if there is a cleaner TypeScript architecture.

Do not use `any`.

Use discriminated unions if they provide better type safety.

For example, a `select` filter may require `options`, while a `date-range` filter should not.

---

# 2. Add an advanced Filters button

Do not render every filter directly in the toolbar.

Create a shadcn-style:

`+ Filter`

or:

`Filters`

button.

Opening it should display available filters.

Example:

Filters

* Status
* Category
* Organization
* Availability
* Created date
* Price

Use shadcn components such as:

* Popover
* Command
* CommandInput
* CommandList
* CommandItem
* Checkbox
* Badge
* Button
* Calendar where appropriate

Reuse components already installed in the project whenever possible.

---

# 3. Add drill-down / sub-filter navigation

The filter popover should support internal navigation.

Example:

First level:

Filters
→ Status
→ Category
→ Organization
→ Price
→ Created date

When clicking `Status`, navigate inside the same filter UI to:

← Status

[ ] Active
[ ] Draft
[ ] Archived

For Users:

Filters
→ Role

Then:

← Role

[ ] Owner
[ ] Admin
[ ] Manager
[ ] Seller

The user should be able to go back to the main filter list without closing the filter popover.

Create this as reusable filter navigation, not table-specific JSX.

---

# 4. Multi-select filters

`select` and `multi-select` must be separate concepts.

For filters such as:

Product Status

allow:

✓ Active
✓ Draft
Archived

The filter value should be represented correctly in TanStack Table.

Implement an appropriate reusable filter function for multi-select arrays.

Example behavior:

Selected:

Status = Active OR Draft

Other active filters should combine normally with it:

Status = Active/Draft
AND
Category = Clothing

---

# 5. Active filter chips

After applying filters, display them in the toolbar as removable chips/badges.

Example:

[ Status: Active × ]
[ Role: Admin × ]
[ Created: Sep 1 - Sep 12 × ]

Each chip must be removable independently.

Also provide:

`Clear all`

when at least one filter is active.

The UI should remain clean when many filters are active.

Allow horizontal wrapping or scrolling where appropriate.

---

# 6. Dynamic Product configuration

A Product page should be able to configure filters approximately like:

```ts
const productFilters = [
  {
    id: "status",
    columnId: "status",
    title: t("common.status"),
    type: "multi-select",
    options: PRODUCT_STATUSES.map((status) => ({
      label: t(`product.status.${status}`),
      value: status,
    })),
  },
  {
    id: "category",
    columnId: "categoryId",
    title: t("product.category"),
    type: "multi-select",
    options: categories.map((category) => ({
      label: category.name,
      value: String(category.id),
    })),
    searchable: true,
  },
]
```

Do not hardcode `status` or `category` inside DataTable.

---

# 7. Dynamic Users configuration

The same DataTable should support:

```ts
const userFilters = [
  {
    id: "role",
    columnId: "role",
    title: t("user.role"),
    type: "multi-select",
    options: roles.map((role) => ({
      label: t(`roles.${role}`),
      value: role,
    })),
  },
  {
    id: "status",
    columnId: "status",
    title: t("common.status"),
    type: "multi-select",
    options: userStatuses,
  },
]
```

The shared DataTable must not require modifications when these filters are added.

---

# 8. Searchable filter options

Filters with many options such as:

* organization
* category
* user
* branch

must support searching inside the filter.

Example:

Organization

Search organization...

[ ] Kanz
[ ] Nike Uzbekistan
[ ] Store Group

Use shadcn `Command` or an equivalent project component.

Do not add search inputs for small option sets unless configured.

---

# 9. Faceted counts

When client-side filtering is being used, integrate TanStack faceting where appropriate.

Example:

Status

Active      124
Draft        18
Archived      7

Counts should react to other filters where TanStack's faceted row model supports it.

Use the appropriate APIs for the installed TanStack version, such as faceted unique values if available.

Do not manually recalculate the entire dataset unnecessarily.

---

# 10. Date range filter

Support:

Created date
Updated date
Order date

UI:

From
To

or a shadcn date-range calendar.

The filter must correctly check values inside the selected date range.

Handle empty start/end values gracefully.

---

# 11. Number range filter

Support fields such as:

* price
* order amount
* stock
* rating

Example:

Price

Min: 100000
Max: 500000

The filter should work correctly with numeric values and avoid string comparisons.

---

# 12. Boolean filter

Support boolean values cleanly.

For example:

Availability

* Available
* Unavailable

User:

* Verified
* Not verified

Do not force pages to convert every boolean field to arbitrary strings just to make filtering work.

---

# 13. Filter definitions and table columns

Design the architecture so a filter can reference:

`columnId`

without requiring the actual column to be visible.

Filtering should continue working even if the user hides that column.

If appropriate, extend TanStack `ColumnMeta` so columns can optionally declare metadata such as:

```ts
meta: {
  label: "Status"
}
```

But do not force filter definitions into `ColumnDef` if keeping a separate filter configuration creates a cleaner reusable API.

Choose the architecture that keeps domain-specific configuration outside the shared DataTable.

---

# 14. DataTable API

The final DataTable usage should stay simple.

Target API:

```tsx
<DataTable
  columns={columns}
  data={data}
  search={{
    columnId: "name",
    placeholder: t("product.search"),
  }}
  filters={productFilters}
  enableRowSelection
/>
```

or another similarly clean typed API.

Avoid adding dozens of unrelated props directly to `DataTable`.

Group related configuration into objects where appropriate.

---

# 15. Client-side and server-side compatibility

Architect filters so they can eventually be used with API/server-side filtering.

Support a controlled mode such as:

```ts
onFiltersChange?: (filters) => void
```

The table should expose a normalized filter representation suitable for converting into query params.

Example conceptually:

```ts
[
  {
    id: "status",
    operator: "in",
    value: ["ACTIVE", "DRAFT"],
  },
  {
    id: "price",
    operator: "between",
    value: [100000, 500000],
  },
]
```

Do not tightly couple the UI to a specific backend API format.

Keep TanStack's internal state and the external normalized filter representation clearly separated if necessary.

Do not implement actual backend endpoints.

---

# 16. URL synchronization architecture

Prepare the component architecture so filters can optionally be synchronized with URL query parameters.

Example:

`?status=ACTIVE,DRAFT&role=ADMIN&page=2`

This does not need to be mandatory for every table.

If implemented, make it opt-in.

Do not tightly couple the shared DataTable to Next.js router unless necessary.

Prefer hooks/adapters so the core table remains reusable.

---

# 17. Better toolbar layout

Create a toolbar approximately structured as:

Desktop:

[ Search products... ] [ Filters 3 ] [Active chips...]     [ Columns ]

Mobile:

[ Search........................ ]
[ Filters 3 ] [ Columns ]
[ Status: Active × ] [Category: Shoes ×]

It must remain responsive.

Avoid fixed widths that cause layout problems.

---

# 18. Filter counter

When filters are active:

`Filters 3`

where `3` represents the number of active filter fields, not necessarily the total selected values.

For example:

Status = Active + Draft
Role = Admin

should show:

`Filters 2`

---

# 19. Clear/reset behavior

Support:

* remove individual value
* remove individual filter
* clear all filters
* reset search
* reset table filters

Avoid stale filter values.

When filters change and pagination is client-side, make sure the user does not remain on a now-invalid page.

Reset the page index when appropriate.

---

# 20. Preserve existing functionality

Do not regress:

* sorting
* pagination
* page-size selection
* row selection
* column visibility
* responsive horizontal table scrolling
* empty state
* localization labels
* generic column rendering
* `DataTableColumnHeader`

Keep existing behavior unless a refactor is needed.

---

# 21. Selection

Continue supporting:

```tsx
enableRowSelection
```

and:

```tsx
onRowSelectionChange
```

Keep the checkbox selection column generic.

Filtering should not corrupt selected row state.

---

# 22. Table UI

Where possible, use the project's shadcn Table components:

```tsx
<Table>
<TableHeader>
<TableBody>
<TableRow>
<TableHead>
<TableCell>
```

instead of raw HTML if the project already exposes these components.

Keep existing visual design:

* rounded container
* border
* responsive overflow
* hover rows
* muted header
* consistent spacing

Do not redesign unrelated dashboard UI.

---

# 23. Component architecture

Do not keep everything inside one huge `data-table.tsx`.

Refactor into maintainable components.

Suggested architecture:

```text
data-table/
  data-table.tsx
  data-table-toolbar.tsx
  data-table-pagination.tsx
  data-table-view-options.tsx

  filters/
    data-table-filter-menu.tsx
    data-table-active-filters.tsx
    data-table-filter-field.tsx

    data-table-multi-select-filter.tsx
    data-table-select-filter.tsx
    data-table-date-range-filter.tsx
    data-table-number-range-filter.tsx
    data-table-boolean-filter.tsx

  data-table-column-header.tsx
  data-table.types.ts
  data-table.utils.ts
```

Adapt this to the existing repository conventions instead of blindly creating folders.

---

# 24. Reusable filter renderer

Create a central renderer based on the filter type.

Conceptually:

```tsx
switch (filter.type) {
  case "select":
    ...
  case "multi-select":
    ...
  case "date-range":
    ...
  case "number-range":
    ...
  case "boolean":
    ...
}
```

The main toolbar should not know implementation details for each filter type.

---

# 25. Type safety

Keep the solution strongly typed.

Requirements:

* no unnecessary `any`
* avoid unsafe casting
* generic `TData`
* typed filter configurations
* typed option values where practical
* use discriminated unions
* reuse TanStack types
* keep external normalized filters typed

---

# 26. Performance

Use memoization only where it provides value.

Avoid:

* recreating expensive option arrays unnecessarily
* scanning all rows manually on every render
* duplicating TanStack filtering logic
* excessive effects
* unnecessary controlled state

Use TanStack's built-in filtering/faceting APIs where applicable.

---

# 27. Accessibility

Ensure:

* filter controls have accessible labels
* keyboard navigation works
* checkboxes are keyboard accessible
* popovers/commands follow shadcn accessibility conventions
* buttons have proper labels
* selected state is exposed correctly

---

# 28. Localization

Do not hardcode user-facing strings when the existing DataTable already supports customizable labels.

Expand the labels/configuration where necessary.

For example:

```ts
filters
addFilter
clearFilters
searchFilters
back
from
to
min
max
noOptions
```

Domain labels such as:

Status
Role
Category

must come from the page/filter configuration.

---

# 29. Example implementations

After refactoring, create or show example configurations for at least:

### Products

* status
* category
* availability
* price range

### Users

* role
* status
* verified
* created date

Do not duplicate DataTable implementation between them.

They should differ only by:

* columns
* data
* search configuration
* filters

---

# 30. Final verification

Before finishing:

1. Run TypeScript checks.
2. Run ESLint if configured.
3. Verify current DataTable consumers still compile.
4. Test zero filters.
5. Test one filter.
6. Test multiple filters.
7. Test multi-select.
8. Test clearing one filter.
9. Test clear-all.
10. Test search + filters together.
11. Test sorting after filtering.
12. Test pagination after filtering.
13. Test row selection with filters.
14. Test hidden filtered columns.
15. Test mobile toolbar layout.
16. Verify Product and Users use the exact same shared DataTable.
17. Do not leave duplicated or dead filtering code.

## Expected result

I want one advanced reusable DataTable system where adding filters to a new dashboard page only requires configuration.

Adding this:

```ts
{
  id: "role",
  columnId: "role",
  title: "Role",
  type: "multi-select",
  options: roleOptions,
}
```

should be enough for a Users table to gain a Role filter.

Adding:

```ts
{
  id: "status",
  columnId: "status",
  title: "Status",
  type: "multi-select",
  options: productStatusOptions,
}
```

should give Products a Status filter.

The shared DataTable itself must not be edited each time a new filter is introduced.

Prioritize:

1. reusable architecture
2. type safety
3. clean UX
4. shadcn consistency
5. TanStack-native behavior
6. backward compatibility
7. maintainability

First inspect the current implementation and existing project conventions, then implement the refactor rather than replacing the component blindly.
