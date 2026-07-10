"use client"

import * as React from "react"
import PhoneNumberInput from "react-phone-number-input"

import { Input } from "@workspace/ui/components/input"
import { cn } from "@workspace/ui/lib/utils"

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
      value={value || undefined}
      onChange={(phoneNumber) => onChange(phoneNumber ?? "")}
      className={cn(
        "flex h-11 w-full items-center gap-2 rounded-4xl border border-input bg-input/30 px-3 transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
        "[&_.PhoneInputCountry]:mr-1 [&_.PhoneInputCountryIcon--border]:shadow-none [&_.PhoneInputCountrySelectArrow]:opacity-70 [&_.PhoneInputInput]:h-auto [&_.PhoneInputInput]:border-0 [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:px-0 [&_.PhoneInputInput]:focus-visible:ring-0",
        className
      )}
    />
  )
}

export { PhoneInput }
