"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import {
  DatePicker,
  DateRangePicker,
} from "@workspace/ui/components/date-picker"
import type {
  DataTableFilterConfig,
  DataTableFilterState,
  DataTableLabels,
} from "../data-table.types"

// DayPicker works in local calendar days. Keep the filter's YYYY-MM-DD value
// unchanged across timezones instead of serializing local midnight as UTC.
function calendarDate(value: string | null | undefined): Date | undefined {
  return value ? new Date(`${value}T12:00:00`) : undefined
}
function filterDate(value: Date | undefined): string | null {
  return value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
    : null
}

type DateFilter<TData> = Extract<
  DataTableFilterConfig<TData>,
  { type: "date" | "date-range" }
>

export function DataTableDateFilter<TData>({
  filter,
  state,
  onChange,
  labels,
  mobile,
}: {
  filter: DateFilter<TData>
  state?: DataTableFilterState
  onChange: (value: unknown) => void
  labels: DataTableLabels
  mobile: boolean
}) {
  const calendarProps = { captionLayout: "dropdown" as const, autoFocus: false }
  const calendarClassName =
    "mx-auto w-full bg-transparent p-0 [--cell-size:clamp(2rem,calc((100vw_-_3.5rem)/7),2.75rem)]"
  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(filter.locale?.code, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(value)
  if (filter.type === "date") {
    const date = calendarDate(state?.type === "date" ? state.value : undefined)
    return mobile ? (
      <div className="space-y-4">
        <Calendar
          {...calendarProps}
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(next) => onChange(filterDate(next))}
          locale={filter.locale}
          className={calendarClassName}
        />
        <Button
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => onChange(filterDate(new Date()))}
        >
          {labels.today}
        </Button>
      </div>
    ) : (
      <DatePicker
        value={date}
        onValueChange={(next) => onChange(filterDate(next))}
        aria-label={filter.title}
        placeholder={filter.placeholder ?? labels.chooseDate}
        todayLabel={labels.today}
        clearLabel={labels.clearDate}
        locale={filter.locale}
        calendarProps={calendarProps}
      />
    )
  }

  const range = state?.type === "date-range" ? state.value : [null, null]
  const from = calendarDate(range[0])
  const to = calendarDate(range[1])
  const selected = from || to ? { from, to } : undefined
  const onSelect = (next: { from?: Date; to?: Date } | undefined) =>
    onChange([filterDate(next?.from), filterDate(next?.to)])
  return (
    <div className="space-y-4">
      {!mobile && (
        <DateRangePicker
          value={selected}
          onValueChange={onSelect}
          numberOfMonths={1}
          aria-label={filter.title}
          placeholder={filter.placeholder ?? labels.chooseDateRange}
          todayLabel={labels.today}
          clearLabel={labels.clearDate}
          locale={filter.locale}
          calendarProps={calendarProps}
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        {[from, to].map((date, index) => (
          <div
            key={index}
            className="flex min-w-0 items-center gap-1 rounded-xl border bg-muted/20 py-2 pl-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">
                {index === 0 ? labels.from : labels.to}
              </p>
              <p className="truncate text-sm font-medium">
                {date ? formatDate(date) : "—"}
              </p>
            </div>
            {date && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-11 shrink-0 md:size-8"
                aria-label={labels.removeValue(
                  filter.title,
                  index === 0 ? labels.from : labels.to
                )}
                onClick={() =>
                  onChange(index === 0 ? [null, range[1]] : [range[0], null])
                }
              >
                <Cross2Icon aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {mobile && (
        <>
          <p className="text-sm text-muted-foreground">
            {labels.dateRangeHint}
          </p>
          <Calendar
            {...calendarProps}
            mode="range"
            selected={selected}
            defaultMonth={from ?? to}
            onSelect={onSelect}
            resetOnSelect
            min={0}
            locale={filter.locale}
            className={calendarClassName}
          />
          <Button
            variant="outline"
            className="min-h-11 w-full"
            onClick={() => {
              const today = filterDate(new Date())
              onChange([today, today])
            }}
          >
            {labels.today}
          </Button>
        </>
      )}
    </div>
  )
}
