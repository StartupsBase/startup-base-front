"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/input"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { cn } from "@workspace/ui/lib/utils"

const colorPresets = [
  "#111827",
  "#6B7280",
  "#F9FAFB",
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#D946EF",
  "#EC4899",
] as const

const hexPattern = /^#[0-9A-F]{6}$/

export function ColorPicker({
  disabled,
  onChange,
  value,
}: {
  disabled?: boolean
  onChange: (value: string) => void
  value: string
}) {
  const { t } = useTranslation()
  const normalizedValue = normalizeHex(value)
  const [draft, setDraft] = React.useState(value.toUpperCase())

  function selectColor(nextValue: string) {
    const normalizedColor = normalizeHex(nextValue)
    setDraft(normalizedColor)
    onChange(normalizedColor)
  }

  function updateDraft(nextValue: string) {
    const withHash = nextValue.startsWith("#") ? nextValue : `#${nextValue}`
    const nextDraft = withHash.slice(0, 7).toUpperCase()
    setDraft(nextDraft)
    if (hexPattern.test(nextDraft)) onChange(nextDraft)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="h-11 w-full justify-start gap-3 rounded-4xl px-3"
        >
          <span
            aria-hidden="true"
            className="size-7 shrink-0 rounded-full border border-black/10 shadow-inner"
            style={{ backgroundColor: normalizedValue }}
          />
          <span className="font-mono text-sm tracking-wide">
            {value.toUpperCase()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>{t("administration.colors.picker.title")}</PopoverTitle>
          <PopoverDescription>
            {t("administration.colors.picker.description")}
          </PopoverDescription>
        </PopoverHeader>

        <div className="grid grid-cols-6 gap-2">
          {colorPresets.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={preset}
              aria-pressed={normalizedValue === preset}
              className={cn(
                "aspect-square rounded-full border border-black/10 shadow-sm transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                normalizedValue === preset &&
                  "ring-2 ring-primary ring-offset-2 ring-offset-popover"
              )}
              style={{ backgroundColor: preset }}
              onClick={() => selectColor(preset)}
            />
          ))}
        </div>

        <label className="grid gap-2 text-xs font-medium">
          {t("administration.colors.picker.spectrum")}
          <input
            type="color"
            value={normalizedValue}
            onChange={(event) => selectColor(event.target.value)}
            className="h-12 w-full cursor-pointer rounded-xl border border-input bg-transparent p-1"
          />
        </label>

        <label className="grid gap-2 text-xs font-medium">
          {t("administration.colors.hex")}
          <Input
            value={draft}
            onChange={(event) => updateDraft(event.target.value)}
            className={cn(
              "font-mono capitalize",
              draft && !hexPattern.test(draft) && "border-destructive"
            )}
            placeholder="#000000"
            spellCheck={false}
          />
        </label>
      </PopoverContent>
    </Popover>
  )
}

function normalizeHex(value: string) {
  const capitalizeValue = value.toUpperCase()
  return hexPattern.test(capitalizeValue) ? capitalizeValue : "#000000"
}
