"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons"
import type { Table } from "@tanstack/react-table"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import type {
  DataTableFilterState,
  DataTableLabels,
  ResolvedFilter,
} from "../data-table.types"
import { DataTableFilterField } from "./data-table-filter-field"

function selectionLabel<TData>(
  filter: ResolvedFilter<TData>,
  state: DataTableFilterState,
  labels: DataTableLabels
) {
  const valueLabel = (value: unknown) =>
    filter.getOptionLabel?.(value) ??
    (filter.type === "select" || filter.type === "multi-select"
      ? filter.options.find((option) => option.value === value)?.label
      : undefined) ??
    String(value)
  if (state.type === "boolean")
    return state.value
      ? ((filter.type === "boolean" ? filter.trueLabel : undefined) ??
          labels.trueLabel)
      : ((filter.type === "boolean" ? filter.falseLabel : undefined) ??
          labels.falseLabel)
  if (state.type === "multi-select")
    return state.value.map(valueLabel).join(", ")
  if (state.type === "date-range" || state.type === "number-range")
    return state.value
      .map((value, index) =>
        value === null
          ? null
          : `${state.type === "date-range" ? (index === 0 ? labels.from : labels.to) : index === 0 ? labels.min : labels.max}: ${valueLabel(value)}`
      )
      .filter(Boolean)
      .join(" – ")
  return valueLabel(state.value)
}

export function DataTableFilterMenu<TData>({
  table,
  filters,
  activeFilters,
  onChange,
  onReset,
  labels,
  manualFiltering,
}: {
  table: Table<TData>
  filters: ResolvedFilter<TData>[]
  activeFilters: DataTableFilterState[]
  onChange: (id: string, value: unknown) => void
  onReset: () => void
  labels: DataTableLabels
  manualFiltering: boolean
}) {
  const mobile = useIsMobile()
  const [open, setOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const headingRef = React.useRef<HTMLHeadingElement>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const selected = filters.find(
    (filter) => filter.id === selectedId && !filter.hidden
  )
  const active = activeFilters.find((state) => state.id === selected?.id)
  const count = activeFilters.filter((state) =>
    filters.some((filter) => filter.id === state.id)
  ).length
  React.useEffect(() => {
    if (!open) return
    // On phones, don't summon the keyboard just by opening filters or navigating.
    if (mobile) headingRef.current?.focus()
    else
      contentRef.current
        ?.querySelector<HTMLElement>(
          "[data-filter-body] input, [data-filter-body] button"
        )
        ?.focus()
  }, [selectedId, open, mobile])
  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setSelectedId(null)
  }
  const Title = mobile ? SheetTitle : "h2"
  const trigger = (
    <Button type="button" variant="outline" className="h-11 gap-2 md:h-9">
      <MixerHorizontalIcon aria-hidden="true" />
      {labels.filters}
      {count > 0 && (
        <Badge variant="secondary" className="rounded-md px-1.5 tabular-nums">
          {count}
        </Badge>
      )}
    </Button>
  )
  const content = (
    <>
      <div className="flex min-h-16 shrink-0 items-center gap-2 border-b px-4 py-2 md:min-h-12 md:px-3">
        {selected && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-11 md:size-8"
            aria-label={labels.back}
            onClick={() => setSelectedId(null)}
          >
            <ArrowLeftIcon aria-hidden="true" />
          </Button>
        )}
        <Title
          ref={headingRef}
          id={titleId}
          tabIndex={-1}
          className="min-w-0 flex-1 font-medium outline-none"
        >
          {selected?.title ?? labels.filters}
        </Title>
        {selected && active && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 md:min-h-8"
            onClick={() => onChange(selected.id, undefined)}
          >
            {labels.clearFilter}
          </Button>
        )}
      </div>
      <div
        data-filter-body
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {selected ? (
          <div className="p-4 md:p-3">
            <DataTableFilterField
              key={selected.id}
              filter={selected}
              state={active}
              column={table
                .getAllLeafColumns()
                .find((column) => column.id === selected.columnId)}
              onChange={(value) => onChange(selected.id, value)}
              labels={labels}
              manualFiltering={manualFiltering}
              mobile={mobile}
            />
          </div>
        ) : (
          <Command label={labels.searchFilters}>
            <CommandInput
              placeholder={labels.searchFilters}
              aria-label={labels.searchFilters}
              className="h-11 text-base md:h-10 md:text-sm"
            />
            <CommandList
              aria-label={labels.filters}
              className={mobile ? "max-h-none" : undefined}
            >
              <CommandEmpty>{labels.noOptions}</CommandEmpty>
              <CommandGroup>
                {filters
                  .filter((filter) => !filter.hidden)
                  .map((filter) => {
                    const Icon = filter.icon
                    const state = activeFilters.find(
                      (entry) => entry.id === filter.id
                    )
                    return (
                      <CommandItem
                        key={filter.id}
                        value={filter.id}
                        aria-label={filter.title}
                        aria-description={
                          mobile && state
                            ? selectionLabel(filter, state, labels)
                            : undefined
                        }
                        keywords={[filter.title]}
                        onSelect={() => setSelectedId(filter.id)}
                        className="min-h-14 px-3 md:min-h-10 md:px-2"
                      >
                        {Icon && <Icon className="size-4" />}
                        <span className="min-w-0 flex-1">
                          <span className="block wrap-anywhere">
                            {filter.title}
                          </span>
                          {mobile && state && (
                            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                              {selectionLabel(filter, state, labels)}
                            </span>
                          )}
                        </span>
                        {state && (
                          <span
                            aria-hidden="true"
                            className="size-1.5 rounded-full bg-primary"
                          />
                        )}
                        <ChevronRightIcon aria-hidden="true" />
                      </CommandItem>
                    )
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </div>
    </>
  )

  if (mobile)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          ref={contentRef}
          side="bottom"
          showCloseButton={false}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            headingRef.current?.focus()
          }}
          className="max-h-[90dvh] overflow-hidden rounded-t-3xl data-[side=bottom]:h-[min(85dvh,46rem)]"
        >
          <SheetDescription id={descriptionId} className="sr-only">
            {labels.filtersDescription}
          </SheetDescription>
          {content}
          <div className="flex shrink-0 items-center gap-3 border-t bg-popover px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="button"
              variant="outline"
              className="h-12"
              disabled={activeFilters.length === 0}
              onClick={onReset}
            >
              {labels.clearFilters}
            </Button>
            <Button
              type="button"
              className="h-12 min-w-0 flex-1"
              onClick={() => onOpenChange(false)}
            >
              {manualFiltering
                ? labels.done
                : labels.showResults(table.getFilteredRowModel().rows.length)}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    )

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        ref={contentRef}
        align="start"
        className="max-h-[min(80dvh,38rem)] w-80 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
        aria-labelledby={titleId}
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
