"use client"

import { type CategoryDTO } from "@/lib/api"

export const ROOT_CATEGORY = "__root_category__"

type CategoryWithImageId = CategoryDTO & { imageId?: number }

export function imageStorageKey(categoryId: number) {
  return `humayro:category-image:${categoryId}`
}

export function readImageAttachmentId(category: CategoryDTO) {
  const apiImageId = (category as CategoryWithImageId).imageId
  if (typeof apiImageId === "number") return apiImageId
  if (category.id === undefined) return undefined

  const savedImageId = window.localStorage.getItem(imageStorageKey(category.id))
  const imageId = savedImageId ? Number(savedImageId) : undefined
  return Number.isSafeInteger(imageId) ? imageId : undefined
}

export function compareCategoryOrder(a: CategoryDTO, b: CategoryDTO) {
  return (
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
    (a.name ?? "").localeCompare(b.name ?? "")
  )
}

export function sameCategoryParent(first?: number, second?: number) {
  return (first ?? null) === (second ?? null)
}

export function isCategoryDescendant(
  categories: CategoryDTO[],
  ancestorId: number,
  possibleDescendantId: number
) {
  const categoriesById = new Map(
    categories.flatMap((category) =>
      category.id === undefined ? [] : [[category.id, category] as const]
    )
  )
  const visited = new Set<number>()
  let current = categoriesById.get(possibleDescendantId)

  while (current?.parentId != null && !visited.has(current.parentId)) {
    if (current.parentId === ancestorId) return true
    visited.add(current.parentId)
    current = categoriesById.get(current.parentId)
  }

  return false
}

export function reparentCategory(
  categories: CategoryDTO[],
  categoryId: number,
  destinationParentId: number | undefined,
  destinationIndex: number
) {
  const movedCategory = categories.find(
    (category) => category.id === categoryId
  )
  if (!movedCategory) return categories

  const sourceSiblings = categories
    .filter(
      (category) =>
        category.id !== categoryId &&
        sameCategoryParent(category.parentId, movedCategory.parentId)
    )
    .sort(compareCategoryOrder)
  const destinationSiblings = categories
    .filter(
      (category) =>
        category.id !== categoryId &&
        sameCategoryParent(category.parentId, destinationParentId)
    )
    .sort(compareCategoryOrder)
  const insertionIndex = Math.min(
    Math.max(destinationIndex, 0),
    destinationSiblings.length
  )
  destinationSiblings.splice(insertionIndex, 0, {
    ...movedCategory,
    parentId: destinationParentId,
  })

  const placements = new Map<
    number,
    { parentId: number | undefined; sortOrder: number }
  >()
  sourceSiblings.forEach((category, sortOrder) => {
    if (category.id !== undefined) {
      placements.set(category.id, {
        parentId: movedCategory.parentId,
        sortOrder,
      })
    }
  })
  destinationSiblings.forEach((category, sortOrder) => {
    if (category.id !== undefined) {
      placements.set(category.id, { parentId: destinationParentId, sortOrder })
    }
  })

  return categories
    .map((category) => {
      if (category.id === undefined) return category
      const placement = placements.get(category.id)
      return placement ? { ...category, ...placement } : category
    })
    .sort(compareCategoryOrder)
}
