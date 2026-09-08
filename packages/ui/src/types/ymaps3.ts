type YMapCoordinates = [longitude: number, latitude: number]

type YMapLocation = {
    center: YMapCoordinates
    zoom: number
}

type YMapMarkerProps = {
    coordinates: YMapCoordinates
}

type YMapClickEvent = {
    coordinates?: YMapCoordinates
}

type YMapListenerProps = {
    layer?: "any" | string
    onClick?: (event: YMapClickEvent) => void
}

interface YMapInstance {
    addChild(child: unknown): YMapInstance
    destroy(): void
}

interface YMapMarkerInstance {
    update(props: Partial<YMapMarkerProps>): void
}

interface YMapConstructor {
    new(
        container: HTMLElement,
        props: {
            location: YMapLocation
        }
    ): YMapInstance
}

interface YMapDefaultSchemeLayerConstructor {
    new(): unknown
}

interface YMapMarkerConstructor {
    new(
        props: YMapMarkerProps,
        element: HTMLElement
    ): YMapMarkerInstance
}

interface YMapListenerConstructor {
    new(props: YMapListenerProps): unknown
}

type YmapsReady = (callback: () => void) => void

export interface YMaps3 {
    ready: YmapsReady

    YMap: YMapConstructor
    YMapDefaultSchemeLayer: YMapDefaultSchemeLayerConstructor
    YMapMarker: YMapMarkerConstructor;
    Map: new (
        container: string | HTMLElement,
        options: Record<string, unknown>
    ) => unknown
    YMapListener: YMapListenerConstructor
}
