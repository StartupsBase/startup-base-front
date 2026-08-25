import { languages } from "@/i18n/config"

export function getSafeNextPath(value: string | null | undefined) {
  const hasControlCharacter = Array.from(value ?? "").some((character) => {
    const code = character.charCodeAt(0)
    return code <= 31 || code === 127
  })

  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    hasControlCharacter
  ) {
    return "/"
  }

  return value
}

export function localizeInternalPath(language: string, path: string) {
  const safePath = getSafeNextPath(path)
  const hasLanguagePrefix = languages.some(
    (item) => safePath === `/${item}` || safePath.startsWith(`/${item}/`)
  )

  if (hasLanguagePrefix) {
    return safePath
  }

  return `/${language}${safePath === "/" ? "" : safePath}`
}
