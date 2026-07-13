"use client"

import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type MarqueeProps = React.HTMLAttributes<HTMLDivElement> & {
  reverse?: boolean
  pauseOnHover?: boolean
  duration?: number
  copies?: number
}

function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = false,
  duration = 35,
  copies = 6,
  style,
  onMouseEnter,
  onMouseLeave,
  ...props
}: MarqueeProps) {
  const [isPaused, setIsPaused] = React.useState(false)
  const totalCopies = Math.max(2, copies)

  return (
    <div
      data-slot="marquee"
      className={cn("group flex w-full overflow-hidden", className)}
      onMouseEnter={(event) => {
        onMouseEnter?.(event)
        if (pauseOnHover) setIsPaused(true)
      }}
      onMouseLeave={(event) => {
        onMouseLeave?.(event)
        if (pauseOnHover) setIsPaused(false)
      }}
      {...props}
    >
      <style>{`
        @keyframes workspace-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% / var(--marquee-copies))); }
        }
      `}</style>
      <div
        className="flex w-max shrink-0 items-stretch"
        style={
          {
            ...style,
            "--marquee-copies": totalCopies,
            animation: `workspace-marquee ${duration}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
            animationPlayState: isPaused ? "paused" : "running",
          } as React.CSSProperties & { "--marquee-copies": number }
        }
      >
        {Array.from({ length: totalCopies }).map((_, index) => (
          <div
            key={index}
            aria-hidden={index !== 0}
            className="flex shrink-0 items-stretch"
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  )
}

export { Marquee }
