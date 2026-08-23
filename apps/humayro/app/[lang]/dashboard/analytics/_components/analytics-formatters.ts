import type { DateRange } from "@workspace/ui/components/date-picker"

const MONTH_NAMES = {
  ru: {
    long: [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ],
    short: [
      "янв.",
      "февр.",
      "мар.",
      "апр.",
      "мая",
      "июн.",
      "июл.",
      "авг.",
      "сент.",
      "окт.",
      "нояб.",
      "дек.",
    ],
  },
  uz: {
    long: [
      "yanvar",
      "fevral",
      "mart",
      "aprel",
      "may",
      "iyun",
      "iyul",
      "avgust",
      "sentabr",
      "oktabr",
      "noyabr",
      "dekabr",
    ],
    short: [
      "yan",
      "fev",
      "mar",
      "apr",
      "may",
      "iyun",
      "iyul",
      "avg",
      "sen",
      "okt",
      "noy",
      "dek",
    ],
  },
} as const

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

  return formatDateWithMonthName(date, language, "short", false)
}

export function formatLongDate(value: string, language: string) {
  const date = parseInputDate(value)
  if (!date) return value

  return formatDateWithMonthName(date, language, "long", true)
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
  return formatDateWithMonthName(date, language, "long", true)
}

function formatDateWithMonthName(
  date: Date,
  language: string,
  width: "long" | "short",
  includeYear: boolean
) {
  const normalizedLanguage = language === "uz" ? "uz" : "ru"
  const month = MONTH_NAMES[normalizedLanguage][width][date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()

  if (normalizedLanguage === "uz") {
    return `${day}-${month}${includeYear ? ` ${year}` : ""}`
  }

  return `${day} ${month}${includeYear ? ` ${year} г.` : ""}`
}

function getLocale(language: string) {
  return language === "uz" ? "uz-UZ" : "ru-RU"
}
