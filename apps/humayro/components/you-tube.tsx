"use client"

import { PlayIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import YouTube, { type YouTubeProps } from "react-youtube"

const VIDEO_ID = "dQw4w9WgXcQ"

const YouTubeVideo = () => {
  const [isPlaying, setIsPlaying] = useState(false)

  const opts: YouTubeProps["opts"] = {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1,
    },
  }

  return (
    <div className="mx-auto w-full max-w-268">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-[0_24px_70px_-48px_rgba(0,0,0,.9)] sm:rounded-2xl">
        {!isPlaying ? (
          <button
            type="button"
            onClick={() => setIsPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label="Videoni ko‘rish"
          >
            <img
              src={`https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`}
              alt="Video rasmi"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-black/25 transition-colors duration-300 group-hover:bg-black/35" />

            <div className="absolute top-1/2 left-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 shadow-xl transition-all duration-300 group-hover:scale-110 sm:size-20">
              <HugeiconsIcon icon={PlayIcon} className="size-5 sm:size-7" />
            </div>
          </button>
        ) : (
          <YouTube
            videoId={VIDEO_ID}
            opts={opts}
            className="absolute inset-0 h-full w-full"
            iframeClassName="h-full w-full"
          />
        )}
      </div>
    </div>
  )
}

export default YouTubeVideo
