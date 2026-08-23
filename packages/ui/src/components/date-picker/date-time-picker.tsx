"use client"

import * as React from "react"
import { CalendarClockIcon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { dateMatchModifiers, type Locale } from "react-day-picker"

import { Button } from "@workspace/ui/components/button"
import { Calendar } from "@workspace/ui/components/calendar"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Popover, PopoverContent } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

import {
  PickerActionBar,
  PickerTrigger,
  applyTimeInputValue,
  formatPickerDate,
  getTimeInputValue,
  getToday,
  mergeDateAndTime,
  useControllableValue,
  type CalendarPanelProps,
  type DatePickerTime,
} from "./date-picker-shared"

type DateTimePickerProps = {
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
  showSeconds?: boolean
  minuteStep?: number
  secondStep?: number
  minTime?: string
  maxTime?: string
  defaultTime?: DatePickerTime
  showNowAction?: boolean
  nowLabel?: string
  doneLabel?: string
  timeLabel?: string
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

function DateTimePicker(props: DateTimePickerProps) {
  const valueControlled = Object.prototype.hasOwnProperty.call(props, "value")
  const openControlled = Object.prototype.hasOwnProperty.call(props, "open")
  const {
    value,
    defaultValue,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    placeholder = "Pick a date and time",
    formatValue,
    formatOptions,
    locale,
    disabled,
    readOnly,
    required,
    clearable = true,
    showSeconds = false,
    minuteStep = 1,
    secondStep = 1,
    minTime,
    maxTime,
    defaultTime,
    showNowAction = true,
    nowLabel = "Now",
    doneLabel = "Done",
    timeLabel = "Time",
    clearLabel = "Clear date and time",
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

  const generatedTimeId = React.useId()
  const [selectedDateTime, setSelectedDateTime] = useControllableValue({
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

  const resolvedFormatOptions = formatOptions ?? {
    dateStyle: "medium",
    timeStyle: showSeconds ? "medium" : "short",
  }
  const valueLabel = selectedDateTime
    ? (formatValue?.(selectedDateTime, locale) ??
      formatPickerDate(selectedDateTime, locale, resolvedFormatOptions))
    : undefined
  const today = getToday()
  const todayDisabled = calendarProps?.disabled
    ? dateMatchModifiers(today, calendarProps.disabled)
    : false

  function selectDate(nextDate: Date | undefined) {
    if (disabled || readOnly || (required && !nextDate)) return

    setSelectedDateTime(
      nextDate
        ? mergeDateAndTime(nextDate, selectedDateTime, defaultTime)
        : undefined
    )
  }

  function selectTime(timeValue: string) {
    if (!timeValue || disabled || readOnly) return

    const baseDate =
      selectedDateTime ?? mergeDateAndTime(today, undefined, defaultTime)
    setSelectedDateTime(applyTimeInputValue(baseDate, timeValue))
  }

  function selectNow() {
    if (disabled || readOnly || todayDisabled) return

    const now = new Date()
    setSelectedDateTime(now)
  }

  function clearDateTime() {
    if (required) return
    setSelectedDateTime(undefined)
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PickerTrigger
        id={id}
        open={isOpen}
        icon={CalendarClockIcon}
        valueLabel={valueLabel}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        clearable={clearable && !required}
        clearLabel={clearLabel}
        onClear={clearDateTime}
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
          "max-h-[min(85vh,42rem)] w-auto max-w-[calc(100vw-1rem)] gap-0 overflow-auto p-0",
          contentClassName
        )}
      >
        <Calendar
          {...calendarProps}
          mode="single"
          selected={selectedDateTime}
          onSelect={selectDate}
          locale={locale}
          defaultMonth={calendarProps?.defaultMonth ?? selectedDateTime}
          autoFocus={calendarProps?.autoFocus ?? true}
          className={cn("bg-transparent", calendarProps?.className)}
        />

        <div className="space-y-2 border-t border-border/70 p-3">
          <Label
            htmlFor={generatedTimeId}
            className="text-xs text-muted-foreground"
          >
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            {timeLabel}
          </Label>
          <Input
            id={generatedTimeId}
            type="time"
            value={getTimeInputValue(selectedDateTime, showSeconds)}
            min={minTime}
            max={maxTime}
            step={showSeconds ? secondStep : minuteStep * 60}
            disabled={disabled}
            readOnly={readOnly}
            aria-label={timeLabel}
            onChange={(event) => selectTime(event.target.value)}
            className="h-10 bg-background tabular-nums"
          />
        </div>

        <PickerActionBar>
          <div className="flex items-center gap-1">
            {showNowAction ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={todayDisabled}
                onClick={selectNow}
              >
                {nowLabel}
              </Button>
            ) : null}
            {clearable && !required ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!selectedDateTime}
                onClick={clearDateTime}
              >
                {clearLabel}
              </Button>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            disabled={required && !selectedDateTime}
            onClick={() => setIsOpen(false)}
          >
            {doneLabel}
          </Button>
        </PickerActionBar>
      </PopoverContent>
    </Popover>
  )
}

export { DateTimePicker }
export type { DateTimePickerProps }
