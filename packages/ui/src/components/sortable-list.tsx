"use client"

import * as React from "react"
import { DragDropVerticalIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@workspace/ui/lib/utils"

export type SortableListMovement<T> = {
  item: T
  fromIndex: number
  toIndex: number
}

type SortableListProps<T> = {
  items: T[]
  getId: (item: T) => string | number
  renderItem: (item: T, index: number) => React.ReactNode
  onReorder: (
    items: T[],
    movement: SortableListMovement<T>
  ) => void | Promise<void>
  disabled?: boolean
  className?: string
  itemClassName?: string
  moveLabel?: string
  onDragStateChange?: (item: T | null) => void
}

export function SortableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  disabled = false,
  className,
  itemClassName,
  moveLabel = "Drag to reorder",
  onDragStateChange,
}: SortableListProps<T>) {
  const [draggedId, setDraggedId] = React.useState<string | number | null>(null)
  const [overId, setOverId] = React.useState<string | number | null>(null)

  function move(dragId: string | number, targetId: string | number) {
    if (dragId === targetId || disabled) return
    const from = items.findIndex((item) => getId(item) === dragId)
    const to = items.findIndex((item) => getId(item) === targetId)
    if (from < 0 || to < 0) return
    const reordered = [...items]
    const [moved] = reordered.splice(from, 1)
    if (!moved) return
    reordered.splice(to, 0, moved)
    void onReorder(reordered, { item: moved, fromIndex: from, toIndex: to })
  }

  function moveByKeyboard(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= items.length || disabled) return
    const reordered = [...items]
    const [moved] = reordered.splice(index, 1)
    if (!moved) return
    reordered.splice(target, 0, moved)
    void onReorder(reordered, {
      item: moved,
      fromIndex: index,
      toIndex: target,
    })
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {items.map((item, index) => {
        const id = getId(item)
        const dragging = draggedId === id
        const over = overId === id && draggedId !== id

        return (
          <div
            key={id}
            className={cn(
              "group/sortable flex items-stretch rounded-2xl border bg-card transition",
              dragging && "scale-[.99] opacity-50",
              over && "border-primary bg-primary/5 ring-2 ring-primary/15",
              itemClassName
            )}
            onDragEnter={(event) => {
              event.stopPropagation()
              setOverId(id)
            }}
            onDragOver={(event) => {
              event.preventDefault()
              event.stopPropagation()
              event.dataTransfer.dropEffect = "move"
            }}
            onDrop={(event) => {
              event.preventDefault()
              event.stopPropagation()
              if (draggedId !== null) move(draggedId, id)
              setDraggedId(null)
              setOverId(null)
              onDragStateChange?.(null)
            }}
          >
            <button
              type="button"
              draggable={!disabled}
              className="grid w-12 shrink-0 cursor-grab place-items-center rounded-l-2xl border-r text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={moveLabel}
              disabled={disabled}
              onDragStart={(event) => {
                event.stopPropagation()
                setDraggedId(id)
                onDragStateChange?.(item)
                event.dataTransfer.effectAllowed = "move"
                event.dataTransfer.setData("text/plain", String(id))
              }}
              onDragEnd={(event) => {
                event.stopPropagation()
                setDraggedId(null)
                setOverId(null)
                onDragStateChange?.(null)
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowUp") {
                  event.preventDefault()
                  moveByKeyboard(index, -1)
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  moveByKeyboard(index, 1)
                }
              }}
            >
              <HugeiconsIcon icon={DragDropVerticalIcon} className="size-5" />
            </button>
            <div className="min-w-0 flex-1">{renderItem(item, index)}</div>
          </div>
        )
      })}
    </div>
  )
}
