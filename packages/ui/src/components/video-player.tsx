"use client"

import { PlayIcon, Video01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type VideoPlayerProps = Omit<
  React.ComponentProps<"video">,
  "children" | "controls"
> & {
  title?: string
}

function VideoPlayer({
  className,
  title,
  onEnded,
  onPause,
  onPlay,
  poster,
  preload = "metadata",
  src,
  ...props
}: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  async function playVideo() {
    try {
      await videoRef.current?.play()
    } catch {
      setIsPlaying(false)
    }
  }

  return (
    <figure
      data-slot="video-player"
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm",
        className
      )}
    >
      <div className="relative aspect-video min-h-0 overflow-hidden bg-foreground/95">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          controls
          playsInline
          preload={preload}
          className="size-full object-contain accent-primary"
          onPlay={(event) => {
            setIsPlaying(true)
            onPlay?.(event)
          }}
          onPause={(event) => {
            setIsPlaying(false)
            onPause?.(event)
          }}
          onEnded={(event) => {
            setIsPlaying(false)
            onEnded?.(event)
          }}
          {...props}
        />
        {!isPlaying ? (
          <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-linear-to-t from-black/35 via-transparent to-black/10">
            <button
              type="button"
              className="pointer-events-auto grid size-16 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-xl ring-8 ring-background/20 transition-transform hover:scale-105 focus-visible:ring-[10px] focus-visible:ring-primary/35 focus-visible:outline-none sm:size-20"
              aria-label={title ? `Play ${title}` : "Play video"}
              onClick={playVideo}
            >
              <HugeiconsIcon
                icon={PlayIcon}
                className="ml-1 size-7 sm:size-8"
              />
            </button>
          </div>
        ) : null}
      </div>
      {title ? (
        <figcaption className="flex min-w-0 items-center gap-2 border-t bg-card px-4 py-3 text-sm font-semibold text-card-foreground">
          <HugeiconsIcon
            icon={Video01Icon}
            className="size-5 shrink-0 text-primary"
          />
          <span className="truncate">{title}</span>
        </figcaption>
      ) : null}
    </figure>
  )
}

export { VideoPlayer }
