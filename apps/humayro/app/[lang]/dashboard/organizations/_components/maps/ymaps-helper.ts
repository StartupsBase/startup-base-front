// The subset of the JavaScript API 2.1 used by the location picker.
export type YandexCoordinates = [latitude: number, longitude: number]

type YandexEvent = { get(name: string): unknown }
type EventManager = {
  add(name: string, handler: (event: YandexEvent) => void): void
  remove(name: string, handler: (event: YandexEvent) => void): void
}

export type YandexPlacemark = {
  geometry: {
    getCoordinates(): YandexCoordinates
    setCoordinates(coordinates: YandexCoordinates): void
  }
  events: EventManager
}

export type YandexMap = {
  events: EventManager
  geoObjects: { add(marker: YandexPlacemark): void }
  behaviors: { disable(behavior: string): void }
  container: { fitToViewport(): void }
  setCenter(coordinates: YandexCoordinates, zoom?: number): unknown
  destroy(): void
}

export type YandexMapsApi = {
  ready(success: () => void, error: (cause: unknown) => void): unknown
  Map: new (
    element: HTMLElement,
    state: { center: YandexCoordinates; zoom: number; controls: string[] }
  ) => YandexMap
  Placemark: new (
    coordinates: YandexCoordinates,
    properties: Record<string, unknown>,
    options: { draggable: boolean; preset: string }
  ) => YandexPlacemark
}

let yandexMapsPromise: Promise<YandexMapsApi> | null = null

export function loadYandexMaps(apiKey: string): Promise<YandexMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Yandex Maps requires a browser."))
  }
  if (yandexMapsPromise) return yandexMapsPromise

  const getApi = () => (window as unknown as { ymaps?: YandexMapsApi }).ymaps

  yandexMapsPromise = new Promise<YandexMapsApi>((resolve, reject) => {
    const script = getApi()?.ready ? undefined : document.createElement("script")
    let settled = false
    const timeout = window.setTimeout(
      () => finish(new Error("Yandex Maps loading timed out.")),
      20_000
    )

    function finish(error?: Error, api?: YandexMapsApi) {
      if (settled) return
      settled = true
      window.clearTimeout(timeout)
      if (script) {
        script.onload = null
        script.onerror = null
      }
      if (error) {
        script?.remove()
        reject(error)
      } else if (api) {
        resolve(api)
      }
    }

    function waitUntilReady() {
      const api = getApi()
      if (!api?.ready) {
        finish(new Error("Yandex Maps API did not initialize."))
        return
      }
      try {
        api.ready(
          () => {
            if (!api.Map || !api.Placemark) {
              finish(new Error("Yandex Maps API 2.1 is unavailable."))
              return
            }
            finish(undefined, api)
          },
          () => finish(new Error("Yandex Maps initialization failed."))
        )
      } catch {
        finish(new Error("Yandex Maps initialization failed."))
      }
    }

    if (!script) {
      waitUntilReady()
      return
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      lang: "ru_RU",
      coordorder: "latlong",
    })
    script.src = `https://api-maps.yandex.ru/2.1/?${params}`
    script.async = true
    script.onload = waitUntilReady
    script.onerror = () => finish(new Error("Yandex Maps could not be loaded."))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    // A rejected load must not poison subsequent attempts or reopened dialogs.
    yandexMapsPromise = null
    throw error
  })

  return yandexMapsPromise
}
