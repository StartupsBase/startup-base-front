"use client"

import { ArrowDown01Icon, ArrowUp01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { type CategoryDTO } from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  SortableList,
  type SortableListMovement,
} from "@workspace/ui/components/sortable-list"
import { CategoryActions } from "./category-actions"
import {
  ROOT_CATEGORY,
  isCategoryDescendant,
  sameCategoryParent,
  compareCategoryOrder,
} from "./category-helpers"
export function CategoryHierarchyList({
  categories,
  disabled,
  onReorder,
  onMoveToParent,
}: {
  categories: CategoryDTO[]
  disabled: boolean
  onReorder: (
    items: CategoryDTO[],
    movement: SortableListMovement<CategoryDTO>
  ) => void | Promise<void>
  onMoveToParent: (
    category: CategoryDTO,
    parentId: number | undefined,
    sortOrder: number
  ) => void | Promise<void>
}) {
  const { t } = useTranslation()
  const [draggedCategory, setDraggedCategory] = useState<CategoryDTO | null>(
    null
  )
  const [moveDialogCategory, setMoveDialogCategory] =
    useState<CategoryDTO | null>(null)
  const [destinationParent, setDestinationParent] = useState(ROOT_CATEGORY)
  const [destinationPosition, setDestinationPosition] = useState<
    "first" | "last"
  >("last")
  const roots = categories.filter((category) => category.parentId == null)

  function canUseCategoryAsParent(
    movingCategory: CategoryDTO,
    destinationCategory: CategoryDTO
  ) {
    if (movingCategory.id === undefined || destinationCategory.id === undefined)
      return false
    if (movingCategory.id === destinationCategory.id) return false
    return !isCategoryDescendant(
      categories,
      movingCategory.id,
      destinationCategory.id
    )
  }

  function canMoveInside(category: CategoryDTO) {
    return draggedCategory
      ? draggedCategory.parentId !== category.id &&
          canUseCategoryAsParent(draggedCategory, category)
      : false
  }

  function handlePointerDrop(category: CategoryDTO, target: Element | null) {
    const dropZone = target?.closest<HTMLElement>("[data-category-drop-parent]")
    const destination = dropZone?.dataset.categoryDropParent
    if (!destination) return false

    if (destination === "root") {
      if (category.parentId == null) return false
      void onMoveToParent(category, undefined, roots.length)
      setDraggedCategory(null)
      return true
    }

    const destinationId = Number(destination)
    const destinationCategory = categories.find(
      (item) => item.id === destinationId
    )
    if (
      !destinationCategory ||
      category.parentId === destinationCategory.id ||
      !canUseCategoryAsParent(category, destinationCategory)
    ) {
      return false
    }

    const destinationChildren = categories.filter(
      (item) => item.parentId === destinationId
    )
    void onMoveToParent(category, destinationId, destinationChildren.length)
    setDraggedCategory(null)
    return true
  }

  function reorderWithinSiblings(
    category: CategoryDTO,
    siblings: CategoryDTO[],
    targetIndex: number
  ) {
    const fromIndex = siblings.findIndex((item) => item.id === category.id)
    if (
      fromIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= siblings.length ||
      fromIndex === targetIndex
    ) {
      return
    }

    const reordered = [...siblings]
    const [moved] = reordered.splice(fromIndex, 1)
    if (!moved) return
    reordered.splice(targetIndex, 0, moved)
    void onReorder(reordered, {
      item: moved,
      fromIndex,
      toIndex: targetIndex,
    })
  }

  function openMoveDialog(category: CategoryDTO) {
    setMoveDialogCategory(category)
    setDestinationParent(
      category.parentId == null ? ROOT_CATEGORY : category.parentId.toString()
    )
    setDestinationPosition("last")
  }

  function categoryPath(category: CategoryDTO) {
    const path = [category.name || t("category.unnamed")]
    const visited = new Set<number>()
    let parentId = category.parentId

    while (parentId != null && !visited.has(parentId)) {
      visited.add(parentId)
      const parent = categories.find((item) => item.id === parentId)
      if (!parent) break
      path.unshift(parent.name || t("category.unnamed"))
      parentId = parent.parentId
    }

    return path.join(" / ")
  }

  function applyButtonMove() {
    if (!moveDialogCategory) return
    const parentId =
      destinationParent === ROOT_CATEGORY
        ? undefined
        : Number(destinationParent)
    const destinationSiblings = categories
      .filter(
        (item) =>
          sameCategoryParent(item.parentId, parentId) &&
          item.id !== moveDialogCategory.id
      )
      .sort(compareCategoryOrder)
    const targetIndex =
      destinationPosition === "first" ? 0 : destinationSiblings.length

    if (sameCategoryParent(moveDialogCategory.parentId, parentId)) {
      const currentSiblings = categories
        .filter((item) => sameCategoryParent(item.parentId, parentId))
        .sort(compareCategoryOrder)
      reorderWithinSiblings(
        moveDialogCategory,
        currentSiblings,
        destinationPosition === "first" ? 0 : currentSiblings.length - 1
      )
    } else {
      void onMoveToParent(moveDialogCategory, parentId, targetIndex)
    }
    setMoveDialogCategory(null)
  }

  function categoryRow(
    category: CategoryDTO,
    depth: number,
    siblingIndex: number,
    siblings: CategoryDTO[]
  ) {
    const children = categories.filter((item) => item.parentId === category.id)

    return (
      <div className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="size-12 shrink-0 overflow-hidden rounded-xl border bg-muted">
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold">{category.name || "—"}</p>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {depth === 0
                    ? t("category.rootCategory")
                    : t("category.childCategory")}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("category.products")}: {category.productCount ?? 0} ·{" "}
                {t("category.sortOrder")}: {category.sortOrder ?? 0} ·{" "}
                {category.sizeType === "NUMBER"
                  ? t("category.number")
                  : t("category.letter")}
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-[2.75rem_2.75rem_minmax(0,1fr)] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-11 sm:size-8"
              disabled={disabled || siblingIndex === 0}
              title={t("category.moveUp")}
              aria-label={t("category.moveUp")}
              onClick={() =>
                reorderWithinSiblings(category, siblings, siblingIndex - 1)
              }
            >
              <HugeiconsIcon icon={ArrowUp01Icon} className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-11 sm:size-8"
              disabled={disabled || siblingIndex === siblings.length - 1}
              title={t("category.moveDown")}
              aria-label={t("category.moveDown")}
              onClick={() =>
                reorderWithinSiblings(category, siblings, siblingIndex + 1)
              }
            >
              <HugeiconsIcon icon={ArrowDown01Icon} className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11 w-full px-3 sm:h-8 sm:w-auto"
              disabled={disabled}
              onClick={() => openMoveDialog(category)}
            >
              {t("category.moveCategory")}
            </Button>
            <div className="col-span-3 flex justify-end sm:col-auto">
              <CategoryActions category={category} categories={categories} />
            </div>
          </div>
        </div>

        {draggedCategory && canMoveInside(category) ? (
          <button
            type="button"
            data-category-drop-parent={category.id}
            className="mt-3 flex min-h-12 w-full touch-none items-center justify-center rounded-xl border border-dashed border-primary/60 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/15"
            onDragEnter={(event) => event.stopPropagation()}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              event.dataTransfer.dropEffect = "move"
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (category.id !== undefined) {
                void onMoveToParent(
                  draggedCategory,
                  category.id,
                  children.length
                )
              }
              setDraggedCategory(null)
            }}
          >
            {t("category.dropInside", {
              name: category.name || t("category.unnamed"),
            })}
          </button>
        ) : null}

        {children.length ? (
          <div className="mt-3 border-l-2 border-primary/20 pl-4">
            <SortableList
              items={children}
              getId={(item) => item.id ?? `child-${item.name}`}
              disabled={disabled}
              moveLabel={t("category.dragToReorder")}
              onDragStateChange={setDraggedCategory}
              onPointerDrop={handlePointerDrop}
              onReorder={onReorder}
              renderItem={(item, index) =>
                categoryRow(item, depth + 1, index, children)
              }
            />
          </div>
        ) : null}
      </div>
    )
  }

  if (!roots.length) {
    return (
      <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
        {t("category.empty")}
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {t("category.dragDescription")}
        </p>
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
          {categories.length} {t("category.categoriesCount")}
        </span>
      </div>
      {draggedCategory && draggedCategory.parentId != null ? (
        <button
          type="button"
          data-category-drop-parent="root"
          className="mb-3 flex min-h-12 w-full touch-none items-center justify-center rounded-xl border border-dashed border-primary/60 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/15"
          onDragEnter={(event) => event.stopPropagation()}
          onDragOver={(event) => {
            event.preventDefault()
            event.stopPropagation()
            event.dataTransfer.dropEffect = "move"
          }}
          onDrop={(event) => {
            event.preventDefault()
            event.stopPropagation()
            void onMoveToParent(draggedCategory, undefined, roots.length)
            setDraggedCategory(null)
          }}
        >
          {t("category.moveToRoot")}
        </button>
      ) : null}
      <SortableList
        items={roots}
        getId={(item) => item.id ?? `root-${item.name}`}
        disabled={disabled}
        moveLabel={t("category.dragToReorder")}
        onDragStateChange={setDraggedCategory}
        onPointerDrop={handlePointerDrop}
        onReorder={onReorder}
        renderItem={(item, index) => categoryRow(item, 0, index, roots)}
      />

      <Dialog
        open={moveDialogCategory !== null}
        onOpenChange={(open) => {
          if (!open) setMoveDialogCategory(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("category.moveCategoryTitle")}</DialogTitle>
            <DialogDescription>
              {t("category.moveCategoryDescription", {
                name: moveDialogCategory?.name || t("category.unnamed"),
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("category.destinationParent")}
              </label>
              <Select
                empty={
                  !categories.some(
                    (category) =>
                      moveDialogCategory &&
                      canUseCategoryAsParent(moveDialogCategory, category)
                  )
                }
                noOptions={t("select.noCategories")}
                value={destinationParent}
                onValueChange={setDestinationParent}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROOT_CATEGORY}>
                    {t("category.root")}
                  </SelectItem>
                  {categories
                    .filter(
                      (category) =>
                        moveDialogCategory &&
                        canUseCategoryAsParent(moveDialogCategory, category)
                    )
                    .sort((first, second) =>
                      categoryPath(first).localeCompare(categoryPath(second))
                    )
                    .map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id!.toString()}
                      >
                        {categoryPath(category)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">
                {t("category.destinationPosition")}
              </label>
              <Select
                noOptions={t("select.noPositions")}
                value={destinationPosition}
                onValueChange={(value) =>
                  setDestinationPosition(value as "first" | "last")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">
                    {t("category.positionFirst")}
                  </SelectItem>
                  <SelectItem value="last">
                    {t("category.positionLast")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMoveDialogCategory(null)}
            >
              {t("category.cancelMove")}
            </Button>
            <Button type="button" disabled={disabled} onClick={applyButtonMove}>
              {t("category.applyMove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
