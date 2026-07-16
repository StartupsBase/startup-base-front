import React from "react"
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@workspace/ui/components/scroll-based-velocity"
import { HugeiconsIcon } from "@hugeicons/react"
import { RecordIcon } from "@hugeicons/core-free-icons"

const InfiniteScroll = () => {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden pt-3">
      <ScrollVelocityContainer className="text-4xl font-bold tracking-[-0.02em] md:text-7xl md:leading-20">
        <ScrollVelocityRow
          baseVelocity={20}
          direction={1}
          scrollReactivity={true}
          className="text-primary"
        >
          Бесплатная поддержка{" "}
          <HugeiconsIcon icon={RecordIcon} className="opacity-0" />
        </ScrollVelocityRow>
      </ScrollVelocityContainer>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-background"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-linear-to-l from-background"></div>
    </div>
  )
}

export default InfiniteScroll
