"use client"

import { useId, useState } from "react"
import { Input } from "@/components/input"
import { useTranslation } from "react-i18next"
import catalog from "@/lib/google-font-catalog.json"
import { GOOGLE_FONT_PRESETS } from "@/lib/google-fonts"

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
  const [activeIndex, setActiveIndex] = useState(0)
  const listId = useId()
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

  function choose(name: string) {
    onChange(name)
    setOpen(false)
  }

  return (
    <div
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <Input
        id="google-font-name"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? listId : undefined}
        aria-activedescendant={
          expanded && matches[activeIndex]
            ? `${listId}-${activeIndex}`
            : undefined
        }
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setActiveIndex(0)
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return
          if (event.key === "Escape") {
            event.preventDefault()
            event.stopPropagation()
            setOpen(false)
          } else if (event.key === "Enter") {
            if (expanded && matches[activeIndex]) {
              event.preventDefault()
              choose(matches[activeIndex])
            }
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault()
            const next = !expanded
              ? 0
              : (activeIndex +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  matches.length) %
                Math.max(matches.length, 1)
            setActiveIndex(next)
            setOpen(true)
            document
              .getElementById(`${listId}-${next}`)
              ?.scrollIntoView({ block: "nearest" })
          }
        }}
        placeholder={t("profilePreferences.searchFonts")}
        maxLength={80}
        disabled={disabled}
        aria-label={t("profilePreferences.importGoogleFont")}
        aria-describedby="google-font-hint"
        aria-invalid={invalid}
        autoComplete="off"
        spellCheck={false}
      />
      {expanded ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t("profilePreferences.fontSuggestions")}
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border bg-popover p-1 shadow-lg"
          onMouseDown={(event) => event.preventDefault()}
        >
          {matches.length ? (
            matches.map((name, index) => (
              <div
                key={name}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm ${index === activeIndex ? "bg-accent text-accent-foreground" : "text-popover-foreground"}`}
                onMouseMove={() => setActiveIndex(index)}
                onClick={() => choose(name)}
              >
                {name}
              </div>
            ))
          ) : (
            <p
              className="px-3 py-4 text-xs text-muted-foreground"
              role="status"
            >
              {t("profilePreferences.noFontSuggestions")}
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}
