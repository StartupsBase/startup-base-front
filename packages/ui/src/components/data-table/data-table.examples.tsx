"use client"

// Domain configuration belongs to the consumer. These fixtures are shared by stories/tests only.
import {
  DataTable,
  DataTableColumnHeader,
  type ColumnDef,
  type DataTableFilterConfig,
  type DataTableProps,
} from "../data-table"

export type ExampleProduct = {
  id: string
  name: string
  status: string
  categoryId: number
  available: boolean
  price: number
}
export const exampleProducts: ExampleProduct[] = [
  {
    id: "p1",
    name: "Cotton shirt",
    status: "ACTIVE",
    categoryId: 1,
    available: true,
    price: 120000,
  },
  {
    id: "p2",
    name: "Linen shirt",
    status: "DRAFT",
    categoryId: 1,
    available: false,
    price: 240000,
  },
  {
    id: "p3",
    name: "Leather shoes",
    status: "ACTIVE",
    categoryId: 2,
    available: true,
    price: 500000,
  },
  {
    id: "p4",
    name: "Wool coat",
    status: "ARCHIVED",
    categoryId: 1,
    available: false,
    price: 800000,
  },
  {
    id: "p5",
    name: "Canvas shoes",
    status: "DRAFT",
    categoryId: 2,
    available: true,
    price: 180000,
  },
]
export const productFilters = [
  {
    id: "status",
    columnId: "status",
    title: "Status",
    type: "multi-select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Draft", value: "DRAFT" },
      { label: "Archived", value: "ARCHIVED" },
    ],
  },
  {
    id: "category",
    columnId: "categoryId",
    title: "Category",
    type: "multi-select",
    searchable: true,
    options: [
      { label: "Clothing", value: "1" },
      { label: "Shoes", value: "2" },
    ],
  },
  {
    id: "availability",
    columnId: "available",
    title: "Availability",
    type: "boolean",
    trueLabel: "Available",
    falseLabel: "Unavailable",
  },
  { id: "price", columnId: "price", title: "Price", type: "number-range" },
] satisfies DataTableFilterConfig<ExampleProduct>[]
export const productColumns: ColumnDef<ExampleProduct>[] = [
  {
    accessorKey: "name",
    meta: { label: "Product" },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product" />
    ),
  },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "categoryId",
    header: "Category",
    cell: ({ row }) => (row.original.categoryId === 1 ? "Clothing" : "Shoes"),
  },
  {
    accessorKey: "available",
    header: "Availability",
    cell: ({ row }) => (row.original.available ? "Available" : "Unavailable"),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Price" />
    ),
    meta: { label: "Price" },
  },
]
export function ProductsExample(
  props: Partial<DataTableProps<ExampleProduct>>
) {
  return (
    <DataTable
      columns={productColumns}
      data={exampleProducts}
      search={{ columnId: "name", placeholder: "Search products..." }}
      filters={productFilters}
      getRowId={(row) => row.id}
      enableRowSelection
      {...props}
    />
  )
}

export type ExampleUser = {
  id: string
  name: string
  role: string[]
  status: string
  verified: boolean
  createdAt: string
}
export const exampleUsers: ExampleUser[] = [
  {
    id: "u1",
    name: "Aziza Karimova",
    role: ["OWNER", "ADMIN"],
    status: "ACTIVE",
    verified: true,
    createdAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "u2",
    name: "Jasur Aliyev",
    role: ["SELLER"],
    status: "ACTIVE",
    verified: false,
    createdAt: "2026-09-12T23:59:59Z",
  },
  {
    id: "u3",
    name: "Malika Usmonova",
    role: ["ADMIN"],
    status: "INVITED",
    verified: false,
    createdAt: "2026-08-31T12:00:00Z",
  },
]
export const userFilters = [
  {
    id: "role",
    columnId: "role",
    title: "Role",
    type: "multi-select",
    options: [
      { label: "Owner", value: "OWNER" },
      { label: "Admin", value: "ADMIN" },
      { label: "Seller", value: "SELLER" },
    ],
  },
  {
    id: "status",
    columnId: "status",
    title: "Status",
    type: "select",
    options: [
      { label: "Active", value: "ACTIVE" },
      { label: "Invited", value: "INVITED" },
    ],
  },
  {
    id: "verified",
    columnId: "verified",
    title: "Verified",
    type: "boolean",
    trueLabel: "Verified",
    falseLabel: "Not verified",
  },
  {
    id: "created",
    columnId: "createdAt",
    title: "Created date",
    type: "date-range",
  },
] satisfies DataTableFilterConfig<ExampleUser>[]
export const userColumns: ColumnDef<ExampleUser>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: { label: "Name" },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => row.original.role.join(", "),
  },
  { accessorKey: "status", header: "Status" },
  {
    accessorKey: "verified",
    header: "Verified",
    cell: ({ row }) => (row.original.verified ? "Verified" : "Not verified"),
  },
  { accessorKey: "createdAt", header: "Created date" },
]
export function UsersExample(props: Partial<DataTableProps<ExampleUser>>) {
  return (
    <DataTable
      columns={userColumns}
      data={exampleUsers}
      search={{ columnId: "name", placeholder: "Search users..." }}
      filters={userFilters}
      getRowId={(row) => row.id}
      enableRowSelection
      {...props}
    />
  )
}
