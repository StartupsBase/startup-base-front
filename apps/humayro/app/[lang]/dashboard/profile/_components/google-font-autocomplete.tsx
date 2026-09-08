"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import catalog from "@/lib/google-font-catalog.json"
import { GOOGLE_FONT_PRESETS } from "@/lib/google-fonts"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"

export function GoogleFontAutocomplete({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string
  onChange: (value: string) => void
  disabled: boolean
  invalid: boolean
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const query = value.trim().toLowerCase()
  const matches = query
    ? catalog.families
        .filter((name) => name.toLowerCase().includes(query))
        .sort(
          (a, b) =>
            Number(b.toLowerCase().startsWith(query)) -
            Number(a.toLowerCase().startsWith(query))
        )
        .slice(0, 10)
    : [
        ...GOOGLE_FONT_PRESETS,
        "Lato",
        "Nunito",
        "Montserrat",
        "Poppins",
        "Roboto Mono",
      ]
  const expanded = open && !disabled

  return (
    <Command
      shouldFilter={false}
      loop
      label={t("profilePreferences.fontSuggestions")}
      className="relative h-auto min-w-0 flex-1 overflow-visible rounded-xl border bg-background"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <CommandInput
        id="google-font-name"
        value={value}
        onValueChange={(nextValue) => {
          onChange(nextValue)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
          } else if (
            event.key === "Enter" &&
            (!expanded || matches.length === 0)
          ) {
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.form?.requestSubmit()
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            setOpen(true)
          }
        }}
        placeholder={t("profilePreferences.searchFonts")}
        maxLength={80}
        disabled={disabled}
        aria-label={t("profilePreferences.importGoogleFont")}
        aria-describedby="google-font-hint"
        aria-invalid={invalid}
        aria-expanded={expanded}
        autoComplete="off"
        spellCheck={false}
      />
      {expanded ? (
        <CommandList
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 rounded-xl border bg-popover p-1 shadow-lg"
          aria-label={t("profilePreferences.fontSuggestions")}
          onMouseDown={(event) => event.preventDefault()}
        >
          {matches.length ? (
            matches.map((name) => (
              <CommandItem
                key={name}
                value={name}
                onSelect={() => {
                  onChange(name)
                  setOpen(false)
                }}
              >
                {name}
              </CommandItem>
            ))
          ) : (
            <p
              className="px-3 py-4 text-xs text-muted-foreground"
              role="status"
            >
              {t("profilePreferences.noFontSuggestions")}
            </p>
          )}
        </CommandList>
      ) : null}
    </Command>
  )
}
