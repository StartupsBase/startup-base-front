import { create } from "zustand"
import { devtools } from "zustand/middleware"

export type CatalogSort = "newest" | "price-low" | "price-high"

type CatalogState = {
  categoryId: number | null
  sort: CatalogSort
  setCategoryId: (categoryId: number | null) => void
  setSort: (sort: CatalogSort) => void
  reset: () => void
}

export const useCatalogStore = create<CatalogState>()(
  devtools(
    (set) => ({
      categoryId: null,
      sort: "newest",
      setCategoryId: (categoryId) =>
        set({ categoryId }, undefined, "catalog/setCategoryId"),
      setSort: (sort) => set({ sort }, undefined, "catalog/setSort"),
      reset: () =>
        set(
          { categoryId: null, sort: "newest" },
          undefined,
          "catalog/reset"
        ),
    }),
    {
      name: "Humayro",
      store: "catalog",
    }
  )
)
