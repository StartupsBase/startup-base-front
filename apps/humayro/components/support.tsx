import { TelegramIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import React from "react"

const Support = () => {
  return (
    <Button asChild className="fixed right-5 bottom-25 z-10 h-[56px] w-[56px] animate-bounce cursor-pointer place-items-center justify-center rounded-full border bg-[#0088cc] text-white transition-colors hover:bg-[#0088cc]/80">
      <Link
        href="tg://resolve?domain=Akmalov_07_01"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Telegram"
      >
        <HugeiconsIcon icon={TelegramIcon} />
      </Link>
    </Button>
  )
}

export default Support
