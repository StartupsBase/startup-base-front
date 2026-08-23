"use client"

import * as React from "react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Locale, PropsBase } from "react-day-picker"

import { Button } from "@workspace/ui/components/button"
import { PopoverTrigger } from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

type CalendarPanelProps = Omit<PropsBase, "locale" | "mode"> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}

type PickerTriggerProps = {
  id?: string
  open: boolean
  icon: React.ComponentProps<typeof HugeiconsIcon>["icon"]
  valueLabel?: string
  placeholder: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  clearable?: boolean
  clearLabel: string
  onClear: () => void
  className?: string
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaInvalid?: React.AriaAttributes["aria-invalid"]
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  onFocus?: React.FocusEventHandler<HTMLButtonElement>
}

type UseControllableValueOptions<T> = {
  controlled: boolean
  value: T
  defaultValue: T
  onValueChange?: (value: T) => void
}

function useControllableValue<T>({
  controlled,
  value,
  defaultValue,
  onValueChange,
}: UseControllableValueOptions<T>) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const currentValue = controlled ? value : uncontrolledValue

  const setValue = React.useCallback(
    (nextValue: T) => {
      if (!controlled) {
        setUncontrolledValue(nextValue)
      }

      onValueChange?.(nextValue)
    },
    [controlled, onValueChange]
  )

  return [currentValue, setValue] as const
}

function PickerTrigger({
  id,
  open,
  icon,
  valueLabel,
  placeholder,
  disabled,
  readOnly,
  required,
  clearable,
  clearLabel,
  onClear,
  className,
  ariaLabel,
  ariaDescribedBy,
  ariaInvalid,
  onBlur,
  onFocus,
}: PickerTriggerProps) {
  const hasValue = Boolean(valueLabel)
  const isDisabled = disabled || readOnly

  return (
    <div data-slot="date-picker-trigger-wrapper" className="relative min-w-0">
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-invalid={ariaInvalid}
          aria-readonly={readOnly}
          aria-required={required}
          disabled={isDisabled}
          onBlur={onBlur}
          onFocus={onFocus}
          className={cn(
            "h-10 w-full min-w-0 justify-start gap-2 px-3 text-left font-normal",
            !hasValue && "text-muted-foreground",
            hasValue && clearable && !isDisabled && "pr-10",
            className
          )}
        >
          <HugeiconsIcon
            icon={icon}
            strokeWidth={2}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <span className="min-w-0 flex-1 truncate">
            {valueLabel || placeholder}
          </span>
        </Button>
      </PopoverTrigger>

      {hasValue && clearable && !isDisabled ? (
        <button
          type="button"
          aria-label={clearLabel}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation()
            onClear()
          }}
          className="absolute inset-y-0 right-1.5 my-auto inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <HugeiconsIcon
            icon={Cancel01Icon}
            strokeWidth={2}
            className="size-3.5"
          />
        </button>
      ) : null}
    </div>
  )
}

function PickerActionBar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="date-picker-actions"
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-t border-border/70 p-3",
        className
      )}
      {...props}
    />
  )
}

function formatPickerDate(
  date: Date,
  locale: Partial<Locale> | undefined,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(locale?.code, options).format(date)
}

function getToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function mergeDateAndTime(
  date: Date,
  timeSource?: Date,
  fallbackTime?: DatePickerTime
) {
  const nextValue = new Date(date)

  nextValue.setHours(
    timeSource?.getHours() ?? fallbackTime?.hours ?? 0,
    timeSource?.getMinutes() ?? fallbackTime?.minutes ?? 0,
    timeSource?.getSeconds() ?? fallbackTime?.seconds ?? 0,
    0
  )

  return nextValue
}

function getTimeInputValue(date: Date | undefined, showSeconds: boolean) {
  if (!date) return ""

  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")

  return showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`
}

function applyTimeInputValue(date: Date, timeValue: string) {
  const [hours, minutes, seconds = "0"] = timeValue.split(":")
  const nextValue = new Date(date)

  nextValue.setHours(Number(hours), Number(minutes), Number(seconds), 0)
  return nextValue
}

type DatePickerTime = {
  hours?: number
  minutes?: number
  seconds?: number
}

export {
  PickerActionBar,
  PickerTrigger,
  applyTimeInputValue,
  formatPickerDate,
  getTimeInputValue,
  getToday,
  mergeDateAndTime,
  useControllableValue,
}
export type { CalendarPanelProps, DatePickerTime }
