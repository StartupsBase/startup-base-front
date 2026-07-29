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
  onPointerDrop?: (item: T, target: Element | null) => boolean
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
  onPointerDrop,
}: SortableListProps<T>) {
  const [draggedId, setDraggedId] = React.useState<string | number | null>(null)
  const [overId, setOverId] = React.useState<string | number | null>(null)
  const listId = React.useId().replaceAll(":", "")
  const pointerDrag = React.useRef<{
    id: string | number
    item: T
    pointerId: number
  } | null>(null)
  const pointerOverId = React.useRef<string | number | null>(null)

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

  function clearPointerDrag() {
    pointerDrag.current = null
    pointerOverId.current = null
    setDraggedId(null)
    setOverId(null)
    onDragStateChange?.(null)
  }

  function updatePointerTarget(clientX: number, clientY: number) {
    const target = document.elementFromPoint(clientX, clientY)
    const sortableItem = target?.closest<HTMLElement>(
      `[data-sortable-list="${listId}"][data-sortable-index]`
    )
    const targetIndex = sortableItem
      ? Number(sortableItem.dataset.sortableIndex)
      : -1
    const targetItem = Number.isInteger(targetIndex)
      ? items[targetIndex]
      : undefined
    const targetId = targetItem === undefined ? null : getId(targetItem)

    pointerOverId.current = targetId
    setOverId(targetId)

    const edgeSize = Math.min(96, window.innerHeight * 0.18)
    if (clientY < edgeSize) {
      window.scrollBy({ top: -18 })
    } else if (clientY > window.innerHeight - edgeSize) {
      window.scrollBy({ top: 18 })
    }
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
            data-sortable-list={listId}
            data-sortable-index={index}
            className={cn(
              "group/sortable flex min-w-0 items-stretch rounded-2xl border bg-card transition",
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
              className="grid w-14 shrink-0 touch-none place-items-center rounded-l-2xl border-r text-muted-foreground select-none hover:bg-muted hover:text-foreground active:bg-muted active:text-foreground disabled:cursor-not-allowed disabled:opacity-40 lg:w-12 lg:cursor-grab lg:active:cursor-grabbing"
              aria-label={moveLabel}
              disabled={disabled}
              onPointerDown={(event) => {
                if (disabled || event.pointerType === "mouse") return
                event.preventDefault()
                event.stopPropagation()
                event.currentTarget.setPointerCapture(event.pointerId)
                pointerDrag.current = { id, item, pointerId: event.pointerId }
                pointerOverId.current = id
                setDraggedId(id)
                setOverId(id)
                onDragStateChange?.(item)
              }}
              onPointerMove={(event) => {
                if (pointerDrag.current?.pointerId !== event.pointerId) return
                event.preventDefault()
                event.stopPropagation()
                updatePointerTarget(event.clientX, event.clientY)
              }}
              onPointerUp={(event) => {
                const active = pointerDrag.current
                if (!active || active.pointerId !== event.pointerId) return
                event.preventDefault()
                event.stopPropagation()

                const target = document.elementFromPoint(
                  event.clientX,
                  event.clientY
                )
                const handledExternally =
                  onPointerDrop?.(active.item, target) ?? false
                const targetId = pointerOverId.current
                if (!handledExternally && targetId !== null) {
                  move(active.id, targetId)
                }
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId)
                }
                clearPointerDrag()
              }}
              onPointerCancel={(event) => {
                if (pointerDrag.current?.pointerId !== event.pointerId) return
                event.stopPropagation()
                clearPointerDrag()
              }}
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
