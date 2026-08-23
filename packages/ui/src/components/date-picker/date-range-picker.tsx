"use client"

import * as React from "react"
import { CalendarRangeIcon } from "@hugeicons/core-free-icons"
import {
  dateMatchModifiers,
  type DateRange,
  type Locale,
} from "react-day-picker"

import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Popover, PopoverContent } from "@workspace/ui/components/popover"
import { useIsMobile } from "@workspace/ui/hooks/use-mobile"
import { cn } from "@workspace/ui/lib/utils"

import {
  PickerActionBar,
  PickerTrigger,
  formatPickerDate,
  getToday,
  useControllableValue,
  type CalendarPanelProps,
} from "./date-picker-shared"

type RangeCalendarProps = CalendarPanelProps & {
  excludeDisabled?: boolean
  max?: number
  min?: number
  resetOnSelect?: boolean
}

type DateRangePickerProps = {
  value?: DateRange
  defaultValue?: DateRange
  onValueChange?: (value: DateRange | undefined) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  formatValue?: (value: DateRange, locale?: Partial<Locale>) => string
  formatOptions?: Intl.DateTimeFormatOptions
  rangeSeparator?: string
  locale?: Partial<Locale>
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  clearable?: boolean
  closeOnSelect?: boolean
  showTodayAction?: boolean
  todayLabel?: string
  clearLabel?: string
  className?: string
  contentClassName?: string
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  numberOfMonths?: number
  calendarProps?: RangeCalendarProps
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  onFocus?: React.FocusEventHandler<HTMLButtonElement>
}

function DateRangePicker(props: DateRangePickerProps) {
  const valueControlled = Object.prototype.hasOwnProperty.call(props, "value")
  const openControlled = Object.prototype.hasOwnProperty.call(props, "open")
  const {
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    placeholder = "Pick a date range",
    formatValue,
    formatOptions = { day: "numeric", month: "short", year: "numeric" },
    rangeSeparator = " – ",
    locale,
    disabled,
    readOnly,
    required,
    clearable = true,
    closeOnSelect = true,
    showTodayAction = true,
    todayLabel = "Today",
    clearLabel = "Clear dates",
    className,
    contentClassName,
    align = "start",
    numberOfMonths,
    calendarProps,
    id,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    onBlur,
    onFocus,
  } = props

  const isMobile = useIsMobile()
  const [selectedRange, setSelectedRange] = useControllableValue({
    controlled: valueControlled,
    value,
    defaultValue,
    onValueChange,
  })
  const [isOpen, setIsOpen] = useControllableValue({
    controlled: openControlled,
    value: open ?? false,
    defaultValue: defaultOpen,
    onValueChange: onOpenChange,
  })

  const valueLabel = selectedRange?.from
    ? (formatValue?.(selectedRange, locale) ??
      [
        formatPickerDate(selectedRange.from, locale, formatOptions),
        selectedRange.to
          ? formatPickerDate(selectedRange.to, locale, formatOptions)
          : "…",
      ].join(rangeSeparator))
    : undefined
  const today = getToday()
  const todayDisabled = calendarProps?.disabled
    ? dateMatchModifiers(today, calendarProps.disabled)
    : false

  function selectRange(nextValue: DateRange | undefined) {
    if (disabled || readOnly || (required && !nextValue)) return

    const wasSelectingEnd = Boolean(selectedRange?.from && !selectedRange.to)
    setSelectedRange(nextValue)

    if (closeOnSelect && wasSelectingEnd && nextValue?.from && nextValue.to) {
      setIsOpen(false)
    }
  }

  function selectToday() {
    selectRange({ from: today, to: today })
    if (closeOnSelect) setIsOpen(false)
  }

  function clearRange() {
    if (required) return
    setSelectedRange(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PickerTrigger
        id={id}
        open={isOpen}
        icon={CalendarRangeIcon}
        valueLabel={valueLabel}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        clearable={clearable && !required}
        clearLabel={clearLabel}
        onClear={clearRange}
        className={className}
        ariaLabel={ariaLabel}
        ariaDescribedBy={ariaDescribedBy}
        ariaInvalid={ariaInvalid}
        onBlur={onBlur}
        onFocus={onFocus}
      />

      <PopoverContent
        align={align}
        sideOffset={8}
        className={cn(
          "max-h-[min(80vh,42rem)] w-auto max-w-[calc(100vw-1rem)] gap-0 overflow-auto p-0",
          contentClassName
        )}
      >
        <Calendar
          {...calendarProps}
          mode="range"
          selected={selectedRange}
          onSelect={selectRange}
          locale={locale}
          numberOfMonths={numberOfMonths ?? (isMobile ? 1 : 2)}
          defaultMonth={calendarProps?.defaultMonth ?? selectedRange?.from}
          autoFocus={calendarProps?.autoFocus ?? true}
          pagedNavigation={calendarProps?.pagedNavigation ?? true}
          resetOnSelect={calendarProps?.resetOnSelect ?? true}
          className={cn("bg-transparent", calendarProps?.className)}
        />

        {showTodayAction || (clearable && !required) ? (
          <PickerActionBar className={cn(!showTodayAction && "justify-end")}>
            {showTodayAction ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={todayDisabled}
                onClick={selectToday}
              >
                {todayLabel}
              </Button>
            ) : null}
            {clearable && !required ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!selectedRange?.from}
                onClick={clearRange}
              >
                {clearLabel}
              </Button>
            ) : null}
          </PickerActionBar>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

export { DateRangePicker }
export type { DateRangePickerProps }
