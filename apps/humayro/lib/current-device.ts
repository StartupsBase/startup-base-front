export type CurrentDevice = {
  browser: string | null
  operatingSystem: string | null
  type: "desktop" | "mobile" | "tablet"
  language: string
  timezone: string
}

let currentDevice: CurrentDevice | null = null

export function getCurrentDevice(): CurrentDevice {
  if (currentDevice) return currentDevice
  const agent = navigator.userAgent
  const isIPad =
    /iPad/.test(agent) ||
    (/Macintosh/.test(agent) && navigator.maxTouchPoints > 1)
  const browsers: [string, RegExp][] = [
    ["Microsoft Edge", /(?:Edg|EdgA|EdgiOS)\/([\d.]+)/],
    ["Opera", /(?:OPR|OPiOS)\/([\d.]+)/],
    ["Samsung Internet", /SamsungBrowser\/([\d.]+)/],
    ["Firefox", /(?:Firefox|FxiOS)\/([\d.]+)/],
    ["Chrome", /(?:Chrome|CriOS)\/([\d.]+)/],
    ["Safari", /Version\/([\d.]+).*Safari/],
  ]
  let browser: string | null = null
  for (const [name, pattern] of browsers) {
    const match = agent.match(pattern)
    if (match) {
      browser = `${name} ${match[1]}`
      break
    }
  }
  const operatingSystem = isIPad
    ? "iPadOS"
    : /iPhone|iPod/.test(agent)
      ? "iOS"
      : /Android/.test(agent)
        ? "Android"
        : /Windows/.test(agent)
          ? "Windows"
          : /CrOS/.test(agent)
            ? "ChromeOS"
            : /Macintosh|Mac OS X/.test(agent)
              ? "macOS"
              : /Linux/.test(agent)
                ? "Linux"
                : null

  currentDevice = {
    browser,
    operatingSystem,
    type:
      isIPad || /Tablet|Android(?!.*Mobile)/i.test(agent)
        ? "tablet"
        : /Mobi|iPhone|iPod/i.test(agent)
          ? "mobile"
          : "desktop",
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }
  return currentDevice
}
