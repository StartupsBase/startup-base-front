import Link from "next/link"
import { notFound } from "next/navigation"

import {
  Item,
  ItemContent,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@workspace/ui/components/item"

import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { createTranslatedPageMetadata } from "@/lib/seo"

import { privacyPolicy, type PolicyBlock } from "./privacy-policy-content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "privacy",
    path: "/privacy-policy",
  })
}

function PolicyContent({ block }: { block: PolicyBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h3 className="pt-4 text-lg leading-7 font-semibold text-foreground sm:text-xl">
          {block.text}
        </h3>
      )
    case "paragraph":
      return <p>{block.text}</p>
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-5 marker:text-primary sm:pl-6">
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      )
    case "table":
      return (
        <dl className="divide-y divide-border rounded-2xl border border-border bg-background/70 px-4 sm:px-6">
          {block.rows.map(({ label, value, href }) => (
            <div
              key={label}
              className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6"
            >
              <dt className="font-semibold text-foreground">{label}</dt>
              <dd className="min-w-0 wrap-break-word">
                {href ? (
                  <a
                    href={href}
                    className="rounded-sm text-primary underline underline-offset-4 hover:decoration-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )
  }
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!isLanguage(lang)) notFound()

  const { t } = await getTranslation(lang)

  return (
    <main
      lang="uz"
      id="privacy-policy"
      className="humayro-top-background scroll-mt-28 text-foreground"
    >
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-16 sm:px-6 sm:pt-8 lg:px-10">
        <nav
          lang={lang}
          aria-label={t("privacyPolicy.navigation")}
          className="text-sm"
        >
          <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-muted-foreground">
            <li>
              <Link
                href={`/${lang}`}
                className="rounded-sm transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                {t("privacyPolicy.home")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              {t("privacyPolicy.breadcrumb")}
            </li>
          </ol>
        </nav>

        <header className="py-12 sm:py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="mb-5 text-xs font-bold tracking-[0.24em] text-primary">
              {privacyPolicy.brand}
            </p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {privacyPolicy.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {privacyPolicy.subtitle}
            </p>
            {lang === "ru" && (
              <p lang="ru" className="mt-4 text-sm text-muted-foreground">
                {t("privacyPolicy.languageNotice")}
              </p>
            )}
          </div>

          <dl className="mt-8 grid gap-5 rounded-2xl border border-border/70 bg-card/80 p-5 sm:grid-cols-2 sm:p-6 lg:mt-10 lg:grid-cols-4">
            {privacyPolicy.metadata.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-muted-foreground">
                  {label}
                </dt>
                <dd className="mt-1.5 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10">
          <aside className="min-w-0 lg:sticky lg:top-28">
            <nav
              lang={lang}
              aria-labelledby="policy-contents"
              className="rounded-2xl border border-border/70 bg-card p-5"
            >
              <h2 id="policy-contents" className="text-lg font-semibold">
                {t("privacyPolicy.contents")}
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t("privacyPolicy.contentsHint")}
              </p>
              <ol
                lang="uz"
                className="mt-4 max-h-72 space-y-1 overflow-y-auto overscroll-contain pr-2 lg:max-h-[calc(100svh-16rem)]"
              >
                {privacyPolicy.sections.map((section) => (
                  <li key={section.id}>
                    <Item
                      render={<a href={`#${section.id}`} />}
                      size="sm"
                      className="min-h-11 flex-nowrap items-start gap-3 px-2 text-muted-foreground hover:bg-primary/8 hover:text-foreground"
                    >
                      <ItemMedia className="w-5 justify-start text-xs leading-5 font-semibold text-primary tabular-nums">
                        {section.number}.
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="line-clamp-none block w-full text-sm leading-5 font-normal">
                          {section.title}
                        </ItemTitle>
                      </ItemContent>
                    </Item>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article aria-label={privacyPolicy.title} className="min-w-0">
            <Item
              variant="outline"
              className="mb-6 rounded-2xl border-primary/20 bg-primary/5 p-6 sm:p-8"
            >
              <ItemContent className="gap-3">
                {privacyPolicy.introduction.map((paragraph, index) => (
                  <p
                    key={paragraph}
                    className={
                      index === 0
                        ? "text-lg leading-8 font-semibold"
                        : "text-base leading-8 text-muted-foreground"
                    }
                  >
                    {paragraph}
                  </p>
                ))}
              </ItemContent>
            </Item>

            <div className="space-y-6">
              {privacyPolicy.sections.map((section) => (
                <Item
                  key={section.id}
                  render={<section />}
                  variant="outline"
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="scroll-mt-28 gap-5 rounded-2xl border-border/70 bg-card p-5 target:border-primary/60 sm:p-8"
                >
                  <ItemHeader className="border-b border-border/70 pb-5">
                    <h2
                      id={`${section.id}-title`}
                      className="flex items-start gap-3 text-xl leading-8 font-semibold tracking-tight sm:gap-4 sm:text-2xl"
                    >
                      <span className="shrink-0 text-primary tabular-nums">
                        {section.number}.
                      </span>
                      <span>{section.title}</span>
                    </h2>
                  </ItemHeader>
                  <ItemContent className="block min-w-0 basis-full space-y-4 text-base leading-8 wrap-break-word text-muted-foreground">
                    {section.blocks.map((block, index) => (
                      <PolicyContent key={index} block={block} />
                    ))}
                  </ItemContent>
                </Item>
              ))}
            </div>

            <a
              lang={lang}
              href="#privacy-policy"
              className="mt-8 inline-flex min-h-11 items-center rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              {t("privacyPolicy.backToTop")}{" "}
              <span aria-hidden="true" className="ml-3">
                ↑
              </span>
            </a>
          </article>
        </div>
      </div>
    </main>
  )
}
