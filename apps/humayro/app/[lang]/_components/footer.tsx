"use client"

import {
  InstagramIcon,
  TelegramIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import type { Language } from "@/i18n/config"

const Footer = ({ language }: { language: Language }) => {
  const pathname = usePathname()

  if (
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  ) {
    return null
  }
  return (
    <div className="bottom-0 block w-full rounded-t-[45px] border">
      <div className="mx-auto flex w-full max-w-6xl justify-between px-6 py-5 md:px-10">
        <div className="flex items-start gap-3">
          <Link href={"/blogs"}>Blogs</Link>
          <Link href={"/privacy-policy"}>Privacy Policy</Link>
          <Link href={"/support"}>Support</Link>
        </div>
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={TelegramIcon} className="size-5" />
          <HugeiconsIcon icon={InstagramIcon} className="size-5" />
          <HugeiconsIcon icon={WhatsappIcon} className="size-5" />
        </div>
      </div>
    </div>
  )
}

export default Footer
