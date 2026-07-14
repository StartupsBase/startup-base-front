import { TelegramIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@workspace/ui/components/button"
import React from "react"

const Support = () => {
  return (

      <Button className="fixed bottom-25 right-5 h-[56px] z-10 w-[56px] cursor-pointer place-items-center justify-center rounded-full border bg-[#0088cc] text-white transition-colors hover:bg-[#0088cc]/80 animate-bounce ">
        <HugeiconsIcon icon={TelegramIcon} />
      </Button>
  )
}

export default Support
