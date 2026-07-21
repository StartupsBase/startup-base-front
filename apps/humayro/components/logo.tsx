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
      className={cn(
        "flex min-w-0 shrink-0 items-center font-semibold tracking-tight",
        className
      )}
    >
      <Logo
        className="xs:size-8 2xs:size-9 3xl:size-12 size-7 sm:size-10 lg:size-9 xl:size-10 2xl:size-11"
        {...props}
      />
      <span className="xs:ml-2 xs:text-[15px] 2xs:text-base 3xl:text-[22px] ml-1.5 truncate text-sm font-bold tracking-tight sm:text-lg lg:text-base xl:text-lg 2xl:text-xl">
        Humayro
      </span>
    </Link>
  )
}

export { Logo, LogoBrand }
