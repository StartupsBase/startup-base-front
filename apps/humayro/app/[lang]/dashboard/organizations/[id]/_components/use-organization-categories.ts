"use client"

import { useEffect, useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { type CategoryDTO } from "@/lib/api"
import {
  getGetAll5QueryKey,
  useGetAll5,
  useMove,
} from "@/lib/api/generated/category/category"
import { type SortableListMovement } from "@workspace/ui/components/sortable-list"
import {
  compareCategoryOrder,
  sameCategoryParent,
  isCategoryDescendant,
  reparentCategory,
} from "./category-helpers"
export function useOrganizationCategories(organizationId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const categoriesQuery = useGetAll5(undefined, { query: { retry: false } })
  const [orderedCategories, setOrderedCategories] = useState<CategoryDTO[]>([])
  const moveCategory = useMove()
  const categories = useMemo(
    () =>
      (categoriesQuery.data ?? []).filter(
        (category) => category.organizationId === organizationId
      ),
    [categoriesQuery.data, organizationId]
  )

  useEffect(() => {
    setOrderedCategories([...categories].sort(compareCategoryOrder))
  }, [categories])

  async function reorderCategorySiblings(
    items: CategoryDTO[],
    movement: SortableListMovement<CategoryDTO>
  ) {
    const movedCategory = movement.item
    if (movedCategory.id === undefined) return

    const previousCategories = orderedCategories
    const nextOrder = new Map(
      items.flatMap((item, index) =>
        item.id === undefined ? [] : [[item.id, index] as const]
      )
    )
    setOrderedCategories((current) =>
      current
        .map((item) =>
          item.id !== undefined && nextOrder.has(item.id)
            ? { ...item, sortOrder: nextOrder.get(item.id) }
            : item
        )
        .sort(compareCategoryOrder)
    )

    try {
      await moveCategory.mutateAsync({
        id: movedCategory.id,
        data: {
          ...(movedCategory.parentId != null
            ? { parentId: movedCategory.parentId }
            : {}),
          sortOrder: movement.toIndex,
        },
      })
      await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
      toast.success(t("category.orderSaved"))
    } catch {
      setOrderedCategories(previousCategories)
      void queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
      toast.error(t("category.orderFailed"))
    }
  }

  async function moveCategoryToParent(
    category: CategoryDTO,
    parentId: number | undefined,
    sortOrder: number
  ) {
    if (category.id === undefined) return
    const categoryId = category.id

    if (
      parentId === categoryId ||
      (parentId !== undefined &&
        isCategoryDescendant(orderedCategories, categoryId, parentId))
    ) {
      toast.error(t("category.cannotMoveIntoDescendant"))
      return
    }
    if (sameCategoryParent(category.parentId, parentId)) return

    const previousCategories = orderedCategories
    const destinationCount = orderedCategories.filter(
      (item) =>
        item.id !== categoryId && sameCategoryParent(item.parentId, parentId)
    ).length
    const destinationOrder = Math.min(Math.max(sortOrder, 0), destinationCount)
    setOrderedCategories((current) =>
      reparentCategory(current, categoryId, parentId, destinationOrder)
    )

    try {
      await moveCategory.mutateAsync({
        id: categoryId,
        data: {
          ...(parentId !== undefined ? { parentId } : {}),
          sortOrder: destinationOrder,
        },
      })
      await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
      toast.success(t("category.moveSaved"))
    } catch {
      setOrderedCategories(previousCategories)
      void queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
      toast.error(t("category.orderFailed"))
    }
  }
  return {
    categoriesQuery,
    categories,
    orderedCategories,
    moveCategory,
    reorderCategorySiblings,
    moveCategoryToParent,
  }
}
