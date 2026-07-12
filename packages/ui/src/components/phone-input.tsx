"use client"

import * as React from "react"
import { ArrowDown01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import PhoneNumberInput, {
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input"

import { Input } from "@workspace/ui/components/input"
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
import { cn } from "@workspace/ui/lib/utils"

type CountryOption = {
  value?: Country
  label: string
  divider?: boolean
}

type CountrySelectProps = {
  value?: Country
  onChange: (country?: Country) => void
  options: CountryOption[]
  disabled?: boolean
  readOnly?: boolean
  name?: string
  onBlur?: React.FocusEventHandler<HTMLButtonElement>
  onFocus?: React.FocusEventHandler<HTMLButtonElement>
  "aria-label"?: string
  iconComponent: React.ElementType<{
    country?: Country
    label?: string
    "aria-hidden"?: boolean
  }>
}

function CountrySelect({
  value,
  onChange,
  options,
  disabled,
  readOnly,
  name,
  onBlur,
  onFocus,
  "aria-label": ariaLabel,
  iconComponent: CountryIcon,
}: CountrySelectProps) {
  const [open, setOpen] = React.useState(false)
  const selectedOption = options.find(
    (option) => !option.divider && option.value === value
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls="phone-country-options"
          disabled={disabled || readOnly}
          name={name}
          onBlur={onBlur}
          onFocus={onFocus}
          className="flex h-auto w-auto shrink-0 items-center gap-1 rounded-md bg-transparent p-0 outline-none disabled:cursor-not-allowed cursor-pointer disabled:opacity-50"
        >
          <CountryIcon
            aria-hidden
            country={value}
            label={selectedOption?.label}
          />

          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className={cn(
              "size-3.5 text-muted-foreground transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-0 p-0">
        <Command>
          <CommandInput placeholder="Search country..." autoFocus />
          <CommandList id="phone-country-options">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((option) => !option.divider)
                .map((option) => {
                  const optionValue = option.value ?? "ZZ"
                  const callingCode = option.value
                    ? getCountryCallingCode(option.value)
                    : ""

                  return (
                    <CommandItem
                      key={optionValue}
                      value={`${option.label} ${optionValue} ${callingCode}`}
                      onSelect={() => {
                        onChange(option.value)
                        setOpen(false)
                      }}
                    >
                      <CountryIcon
                        aria-hidden
                        country={option.value}
                        label={option.label}
                      />
                      <span className="flex-1">{option.label}</span>
                      {option.value ? (
                        <span className="text-muted-foreground">
                          +{callingCode}
                        </span>
                      ) : null}
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        strokeWidth={2}
                        className={cn(
                          "size-4",
                          option.value === value ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  )
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

type PhoneInputProps = Omit<
  React.ComponentProps<typeof PhoneNumberInput>,
  "className" | "defaultCountry" | "onChange" | "value"
> & {
  className?: string
  value?: string
  onChange: (value: string) => void
}

function PhoneInput({ className, onChange, value, ...props }: PhoneInputProps) {
  return (
    <PhoneNumberInput
      {...props}
      defaultCountry="UZ"
      international
      countryCallingCodeEditable={false}
      limitMaxLength
      inputComponent={Input}
      countrySelectComponent={CountrySelect}
      value={value || undefined}
      onChange={(phoneNumber) => onChange(phoneNumber ?? "")}
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-4xl border border-input bg-input/30 px-3 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "[&_.PhoneInputCountryIcon--border]:shadow-none [&_.PhoneInputInput]:h-auto [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-0 [&_.PhoneInputInput]:focus-visible:ring-0",
        className
      )}
    />
  )
}

export { PhoneInput }
