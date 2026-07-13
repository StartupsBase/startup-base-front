import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

type EmptyStateProps = {
  title: string
  description: string
  actionLabel: string
  actionHref: string
  icon?: "cart" | "heart" | "order"
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon = "cart",
}: EmptyStateProps) {
  return (
    <section className="mx-auto flex min-h-[520px] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="grid size-36 place-items-center rounded-full bg-[linear-gradient(145deg,#f7fafb,#dbe5e8)] text-5xl text-[#637078] shadow-inner dark:bg-[linear-gradient(145deg,#253236,#162126)] dark:text-[#a6b5ba]">
        <span aria-hidden="true">
          {icon === "heart" ? "♡" : icon === "order" ? "▣" : "♧"}
        </span>
      </div>
      <h1 className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground">{description}</p>
      <Button asChild size="lg" className="mt-9 h-14 min-w-72 rounded-2xl px-8 text-base font-bold">
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    </section>
  )
}
