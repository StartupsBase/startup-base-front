import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { createTranslatedPageMetadata } from "@/lib/seo"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { BookDemoStepper, type BookDemoStepperCopy } from "./book-demo-stepper"

type BookDemoPageProps = {
  params: Promise<{ lang: string }>
}

type BookDemoPageCopy = BookDemoStepperCopy & {
  eyebrow: string
  title: string
  description: string
  benefits: [string, string][]
  stepsTitle: string
  steps: string[]
  back: string
}

export async function generateMetadata({ params }: BookDemoPageProps) {
  const { lang } = await params
  return createTranslatedPageMetadata({
    language: lang,
    page: "bookDemo",
    path: "/book-demo",
  })
}

export default async function BookDemoPage({ params }: BookDemoPageProps) {
  const { lang } = await params

  if (!isLanguage(lang)) {
    notFound()
  }

  const { t } = await getTranslation(lang)
  const copy = t("bookDemo", { returnObjects: true }) as BookDemoPageCopy

  return (
    <main className="min-h-screen bg-muted/20">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <Button asChild variant="ghost" className="mb-8 -ml-3">
          <Link href={`/${lang}`}>
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
            {copy.back}
          </Link>
        </Button>

        <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="space-y-8 lg:sticky lg:top-24">
            <div>
              <p className="text-sm font-semibold tracking-wider text-primary">
                {copy.eyebrow}
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {copy.benefits.map(([value, label]) => (
                <Card key={value} size="sm" className="text-center shadow-none">
                  <CardContent>
                    <p className="font-semibold sm:text-lg">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">{copy.stepsTitle}</CardTitle>
                <CardDescription>{copy.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {copy.steps.map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        className="size-5"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        0{index + 1}
                      </p>
                      <p className="mt-0.5 text-sm leading-6">{item}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <BookDemoStepper language={lang} copy={copy} />
        </section>
      </div>
    </main>
  )
}
