import Link from "next/link"
import Image from "next/image"
import type { ComponentProps } from "react"

import { cn } from "@workspace/ui/lib/utils"

function Logo({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block shrink-0 overflow-hidden", className)}
      {...props}
    >
      <Image
        src="/brand/humayroLight.svg"
        alt=""
        fill
        sizes="(min-width: 1536px) 68px, (min-width: 640px) 58px, 48px"
        quality={100}
        className="scale-[1.42] object-cover dark:hidden"
      />

      <Image
        src="/brand/humayroDark.svg"
        alt=""
        fill
        sizes="(min-width: 1536px) 68px, (min-width: 640px) 58px, 48px"
        quality={100}
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
      <span className="xs:ml-2 xs:text-[15px] 2xs:text-base 3xl:text-[22px] ml-1.5 truncate text-sm font-bold tracking-tight sm:text-lg lg:text-base xl:text-lg 2xl:text-xl">
        Humayro
      </span>
    </Link>
  )
}

export { Logo, LogoBrand }
