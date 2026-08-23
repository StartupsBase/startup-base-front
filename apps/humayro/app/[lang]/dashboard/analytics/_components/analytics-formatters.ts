import type { DateRange } from "@workspace/ui/components/date-picker"

export function formatCurrency(value: number, language: string) {
  const currency = language === "uz" ? "so‘m" : "сум"
  return `${formatNumber(value, language)} ${currency}`
}

export function formatNumber(value: number, language: string) {
  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDecimal(value: number, language: string) {
  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number, language: string) {
  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatCompactNumber(value: number, language: string) {
  return new Intl.NumberFormat(getLocale(language), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatChartDate(value: string, language: string) {
  const date = parseInputDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat(getLocale(language), {
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function formatLongDate(value: string, language: string) {
  const date = parseInputDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat(getLocale(language), {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

export function formatDateRange(from: string, to: string, language: string) {
  if (!from || !to) return "—"
  return `${formatLongDate(from, language)} — ${formatLongDate(to, language)}`
}

export function formatPickerRange(range: DateRange, language: string) {
  if (!range.from) return ""
  const from = formatShortDate(range.from, language)
  const to = range.to ? formatShortDate(range.to, language) : "…"
  return `${from} — ${to}`
}

export function parseInputDate(value?: string) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined

  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export function toInputDate(date?: Date) {
  if (!date) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function clampScore(value?: number) {
  return Math.min(100, Math.max(0, Math.round(value ?? 0)))
}

function formatShortDate(date: Date, language: string) {
  return new Intl.DateTimeFormat(getLocale(language), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function getLocale(language: string) {
  return language === "uz" ? "uz-UZ" : "ru-RU"
}
