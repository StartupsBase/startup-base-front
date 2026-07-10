import { create } from "zustand"

export type CatalogSort = "newest" | "price-low" | "price-high"

type CatalogState = {
  categoryId: number | null
  sort: CatalogSort
  setCategoryId: (categoryId: number | null) => void
  setSort: (sort: CatalogSort) => void
  reset: () => void
}

export const useCatalogStore = create<CatalogState>((set) => ({
  categoryId: null,
  sort: "newest",
  setCategoryId: (categoryId) => set({ categoryId }),
  setSort: (sort) => set({ sort }),
  reset: () => set({ categoryId: null, sort: "newest" }),
}))
