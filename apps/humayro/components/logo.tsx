import Link from "next/link"
import Image from "next/image"
import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

function Logo({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-[30%] bg-[#f7f3ea] shadow-[0_4px_12px_rgba(32,49,31,.18)] dark:bg-[#14261b] dark:shadow-[0_4px_12px_rgba(0,0,0,.3)]",
        className
      )}
      {...props}
    >
      <Image
        src="/brand/humayroLight.png"
        alt=""
        fill
        sizes="40px"
        className="scale-[1.42] object-cover dark:hidden"
      />
      <Image
        src="/brand/humayroDark.png"
        alt=""
        fill
        sizes="40px"
        className="hidden scale-[1.42] object-cover dark:block"
      />
    </span>
  )
}

function LogoBrand({ className, ...props }: ComponentProps<"span">) {
  return (
    <Link
      href="/"
      aria-label="Humayro"
      className="flex items-center font-semibold tracking-tight"
    >
      {/* <Logo className={cn("h-10 w-10", className)} {...props} /> */}
      <span className="ml-2 text-lg font-bold tracking-tight">Humayro</span>
    </Link>
  )
}

export { Logo, LogoBrand }
