const fallbackApiUrl = "https://swagger.humayro.uz"

export function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? fallbackApiUrl
  const cleanedUrl = configuredUrl
    .replace(/;+$/, "")
    .replace(/^['"]|['"]$/g, "")

  try {
    const url = new URL(cleanedUrl)
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : fallbackApiUrl
  } catch {
    return fallbackApiUrl
  }
}
