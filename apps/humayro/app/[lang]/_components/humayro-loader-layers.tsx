"use client"

import { useEffect, useRef, useState } from "react"

type RasterLayerProps = {
  src: string
  className: string
  tone?: "gradient" | "white"
}

function RasterLayer({ src, className, tone }: RasterLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const image = new Image()
    let cancelled = false

    image.decoding = "async"
    image.src = src

    image.onload = () => {
      const canvas = canvasRef.current

      if (!canvas || cancelled) return

      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext("2d", { willReadFrequently: true })

      if (!context) return

      context.drawImage(image, 0, 0)

      const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
      const { data } = pixels

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index] ?? 0
        const green = data[index + 1] ?? 0
        const blue = data[index + 2] ?? 0
        const brightness = (red + green + blue) / 3
        const chroma = Math.max(red, green, blue) - Math.min(red, green, blue)

        // The supplied source files have a baked-in neutral checkerboard.
        // Remove only neutral, bright pixels so the green illustration remains intact.
        if (brightness > 145 && chroma < 25) {
          data[index + 3] = 0
          continue
        }

        if ((data[index + 3] ?? 0) > 0 && tone) {
          if (tone === "white") {
            data[index] = 255
            data[index + 1] = 255
            data[index + 2] = 255
            continue
          }

          const pixelY = Math.floor(index / 4 / canvas.width)
          const progress = pixelY / Math.max(canvas.height - 1, 1)
          const start: [number, number, number] = [40, 91, 55]
          const end: [number, number, number] = [145, 174, 85]

          data[index] = Math.round(start[0] + (end[0] - start[0]) * progress)
          data[index + 1] = Math.round(
            start[1] + (end[1] - start[1]) * progress
          )
          data[index + 2] = Math.round(
            start[2] + (end[2] - start[2]) * progress
          )
        }
      }

      context.putImageData(pixels, 0, 0)
      setReady(true)
    }

    return () => {
      cancelled = true
      image.onload = null
    }
  }, [src, tone])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`${className} ${ready ? "opacity-100" : "opacity-0"}`}
    />
  )
}

export function HumayroLoaderLayers() {
  return (
    <div
      className="relative h-[min(82vw,360px)] w-[min(82vw,360px)] overflow-visible"
      role="img"
      aria-label="Humayro bezak belgisi"
    >
      <RasterLayer
        src="/loader-layers/moon.png"
        className="humayro-source-layer humayro-source-moon absolute inset-0 z-40 h-full w-full"
      />
      <RasterLayer
        src="/loader-layers/branch.png"
        className="humayro-source-layer humayro-source-branch absolute inset-0 z-20 h-full w-full"
      />
      <RasterLayer
        src="/loader-layers/profile.png"
        className="humayro-source-layer humayro-source-profile absolute inset-0 z-30 h-full w-full"
      />
      <RasterLayer
        src="/loader-layers/star.png"
        tone="gradient"
        className="humayro-source-layer humayro-source-star absolute top-[3%] left-[54%] z-50 h-[53%] w-[53%] dark:hidden"
      />
      <RasterLayer
        src="/loader-layers/star.png"
        tone="white"
        className="humayro-source-layer humayro-source-star absolute top-[3%] left-[54%] z-50 hidden h-[53%] w-[53%] dark:block"
      />
    </div>
  )
}
