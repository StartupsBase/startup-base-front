"use client"

import * as React from "react"
import { Calendar03Icon } from "@hugeicons/core-free-icons"
import { dateMatchModifiers, type Locale } from "react-day-picker"

import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Popover, PopoverContent } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import {
  PickerActionBar,
  PickerTrigger,
  formatPickerDate,
  getToday,
  useControllableValue,
  type CalendarPanelProps,
} from "./date-picker-shared"

type DatePickerProps = {
  value?: Date
  defaultValue?: Date
  onValueChange?: (value: Date | undefined) => void
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placeholder?: string
  formatValue?: (value: Date, locale?: Partial<Locale>) => string
  formatOptions?: Intl.DateTimeFormatOptions
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
  calendarProps?: CalendarPanelProps
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: React.AriaAttributes["aria-invalid"]
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  onFocus?: React.FocusEventHandler<HTMLButtonElement>
}

function DatePicker(props: DatePickerProps) {
  const valueControlled = Object.prototype.hasOwnProperty.call(props, "value")
  const openControlled = Object.prototype.hasOwnProperty.call(props, "open")
  const {
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    placeholder = "Pick a date",
    formatValue,
    formatOptions = { day: "numeric", month: "short", year: "numeric" },
    locale,
    disabled,
    readOnly,
    required,
    clearable = true,
    closeOnSelect = true,
    showTodayAction = true,
    todayLabel = "Today",
    clearLabel = "Clear date",
    className,
    contentClassName,
    align = "start",
    calendarProps,
    id,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    "aria-invalid": ariaInvalid,
    onBlur,
    onFocus,
  } = props

  const [selectedDate, setSelectedDate] = useControllableValue({
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

  const valueLabel = selectedDate
    ? (formatValue?.(selectedDate, locale) ??
      formatPickerDate(selectedDate, locale, formatOptions))
    : undefined
  const today = getToday()
  const todayDisabled = calendarProps?.disabled
    ? dateMatchModifiers(today, calendarProps.disabled)
    : false

  function selectDate(nextValue: Date | undefined) {
    if (disabled || readOnly || (required && !nextValue)) return

    setSelectedDate(nextValue)
    if (nextValue && closeOnSelect) setIsOpen(false)
  }

  function clearDate() {
    if (required) return
    setSelectedDate(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PickerTrigger
        id={id}
        open={isOpen}
        icon={Calendar03Icon}
        valueLabel={valueLabel}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        clearable={clearable && !required}
        clearLabel={clearLabel}
        onClear={clearDate}
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
          "max-h-[min(80vh,38rem)] w-auto max-w-[calc(100vw-1rem)] gap-0 overflow-auto p-0",
          contentClassName
        )}
      >
        <Calendar
          {...calendarProps}
          mode="single"
          selected={selectedDate}
          onSelect={selectDate}
          locale={locale}
          defaultMonth={calendarProps?.defaultMonth ?? selectedDate}
          autoFocus={calendarProps?.autoFocus ?? true}
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
                onClick={() => selectDate(today)}
              >
                {todayLabel}
              </Button>
            ) : null}
            {clearable && !required ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!selectedDate}
                onClick={clearDate}
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

export { DatePicker }
export type { DatePickerProps }
