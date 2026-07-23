import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { isLanguage } from "@/i18n/config"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { TextAnimate } from "@workspace/ui/components/text-animate"
import { createTranslatedPageMetadata } from "@/lib/seo"

type BookDemoPageProps = {
  params: Promise<{ lang: string }>
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

  const copy =
    lang === "ru"
      ? {
          eyebrow: "БЕСПЛАТНАЯ КОНСУЛЬТАЦИЯ · 15 МИНУТ",
          title: "Одежда, в которой\nвы чувствуете себя собой.",
          description:
            "Познакомимся с Humayro, подберём вещи под ваш стиль и покажем, как собрать образ без долгих поисков.",
          cardLabel: "Ваш образ на сегодня",
          cardTitle: "Теплая классика",
          cardNote: "Удобно. Уверенно. По-вашему.",
          bookingEyebrow: "ВСТРЕЧА С HUMAYRO",
          bookingTitle: "Выберите удобное время",
          bookingDescription:
            "Оставьте контакты — наш стилист подтвердит консультацию в течение дня.",
          name: "Как вас зовут?",
          phone: "Номер телефона",
          style: "Что хотите подобрать?",
          stylePlaceholder: "Выберите направление",
          styles: [
            "Повседневный образ",
            "Образ для события",
            "Обновить гардероб",
          ],
          day: "Предпочтительный день",
          time: "Удобное время",
          times: ["10:00", "13:00", "16:00", "19:00"],
          submit: "Записаться на консультацию",
          privacy: "Никакого спама — только подтверждение выбранного времени.",
          benefits: [
            ["15 минут", "онлайн-знакомство"],
            ["Бесплатно", "без обязательств"],
            ["1 на 1", "с консультантом"],
          ],
          stepsTitle: "За 15 минут вы",
          steps: [
            "расскажете, какой образ ищете",
            "увидите подборки Humayro для себя",
            "получите совет по следующему шагу",
          ],
          back: "Вернуться на главную",
        }
      : {
          eyebrow: "BEPUL KONSULTATSIYA · 15 DAQIQA",
          title: "O‘zingizni o‘zingizdek\nhis qiladigan liboslar.",
          description:
            "Humayro bilan tanishamiz, uslubingizga mos kiyimlarni saralaymiz va obrazni uzoq qidirmasdan yig‘ishni ko‘rsatamiz.",
          cardLabel: "Bugungi obraziingiz",
          cardTitle: "Iliq klassika",
          cardNote: "Qulay. Ishonchli. Sizniki.",
          bookingEyebrow: "HUMAYRO BILAN UCHRASHUV",
          bookingTitle: "Sizga qulay vaqtni tanlang",
          bookingDescription:
            "Kontaktlaringizni qoldiring — stilistimiz kun davomida konsultatsiyani tasdiqlaydi.",
          name: "Ismingiz qanday?",
          phone: "Telefon raqamingiz",
          style: "Nima tanlamoqchisiz?",
          stylePlaceholder: "Yo‘nalishni tanlang",
          styles: [
            "Kundalik obraz",
            "Tadbir uchun obraz",
            "Garderobni yangilash",
          ],
          day: "Qulay kun",
          time: "Qulay vaqt",
          times: ["10:00", "13:00", "16:00", "19:00"],
          submit: "Konsultatsiyaga yozilish",
          privacy: "Spam yo‘q — faqat tanlagan vaqtingizni tasdiqlaymiz.",
          benefits: [
            ["15 daqiqa", "onlayn tanishuv"],
            ["Bepul", "majburiyatsiz"],
            ["1 ga 1", "konsultant bilan"],
          ],
          stepsTitle: "15 daqiqada siz",
          steps: [
            "qanday obraz izlayotganingizni aytasiz",
            "o‘zingiz uchun Humayro tanlovlarini ko‘rasiz",
            "keyingi qadam uchun maslahat olasiz",
          ],
          back: "Bosh sahifaga qaytish",
        }

  return (
    <main className="relative isolate overflow-hidden text-[#20311f] dark:text-[#edf2e8]">
      <div className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(#759574_0.7px,transparent_0.7px)] [background-size:18px_18px] opacity-40 dark:opacity-15" />

      <div className="mx-auto w-full max-w-[1440px] px-4 pt-8 pb-16 sm:px-6 lg:px-10 lg:pb-24">
        <Link
          href={`/${lang}`}
          className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-[#526551] transition-colors hover:text-[#20311f] dark:text-[#b8cdb8] dark:hover:text-white"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ←
          </span>
          {copy.back}
        </Link>

        <section className="grid items-center gap-12 pt-10 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(430px,0.82fr)] lg:gap-20 lg:pt-16 lg:pb-20">
          <div className="max-w-2xl">
            <TextAnimate
              animation="blurInUp"
              by="character"
              duration={1.5}
              className="text-5xl leading-[0.98] font-bold tracking-[-0.065em] whitespace-pre-line sm:text-6xl lg:text-7xl xl:text-[5.3rem]"
            >
              {copy.title}
            </TextAnimate>
            <p className="mt-7 max-w-xl text-base leading-7 text-[#5a6b58] sm:text-lg sm:leading-8 dark:text-[#b1c2b0]">
              {copy.description}
            </p>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 sm:gap-4">
              {copy.benefits.map(([value, label]) => (
                <div
                  key={value}
                  className="rounded-3xl border border-[#d9e2d3] bg-white/70 px-3 py-4 text-center backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
                >
                  <p className="text-base font-bold tracking-tight sm:text-lg">
                    {value}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-[#627560] dark:text-[#a6b7a5]">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="relative mt-10 hidden max-w-md overflow-hidden rounded-[2rem] border border-white/70 bg-[#dfc0a5] p-5 shadow-[0_20px_50px_rgba(69,66,41,.13)] sm:block dark:border-white/10 dark:bg-[#6e5543]">
              <div className="absolute -top-10 -right-7 size-40 rounded-full bg-[#f7e5cd]/80" />
              <div className="relative flex min-h-45 items-end justify-between rounded-[1.45rem] bg-[#baa283] p-5">
                <div>
                  <p className="text-xs font-bold tracking-[0.16em] text-[#fff8ed]/75 capitalize">
                    {copy.cardLabel}
                  </p>
                  <p className="mt-2 text-2xl font-bold tracking-[-0.05em] text-[#fffaf2]">
                    {copy.cardTitle}
                  </p>
                  <p className="mt-2 max-w-44 text-sm leading-5 text-[#fff8ed]/80">
                    {copy.cardNote}
                  </p>
                </div>
                <div aria-hidden="true" className="relative h-36 w-24 shrink-0">
                  <div className="absolute bottom-0 left-3 h-28 w-18 rounded-t-[3rem] bg-[#f6e9d8] shadow-[inset_-9px_0_0_rgba(175,135,100,.13)]" />
                  <div className="absolute bottom-0 left-0 h-19 w-24 rounded-t-[2.5rem] bg-[#7f9677]" />
                  <div className="absolute bottom-15 left-8 size-10 rounded-full bg-[#c99773]" />
                  <div className="absolute bottom-25 left-7 h-11 w-12 rounded-t-full bg-[#a96854]" />
                </div>
              </div>
            </div>
          </div>

          <div
            id="booking"
            className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-[0_28px_70px_rgba(50,72,47,.14)] backdrop-blur-xl sm:p-8 dark:border-white/10 dark:bg-[#17251c]/90"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.045em] sm:text-3xl">
                {copy.bookingTitle}
              </h2>
            </div>
            <p className="mb-7 max-w-md text-sm leading-6 text-[#61735f] dark:text-[#b0c1af]">
              {copy.bookingDescription}
            </p>

            <form className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 text-sm font-semibold">
                  <Label htmlFor="name">{copy.name}</Label>
                  <Input
                    id="name"
                    required
                    name="name"
                    autoComplete="name"
                    placeholder={
                      lang === "ru" ? "Например, Малика" : "Masalan, Malika"
                    }
                    className="h-12 rounded-2xl border-[#dbe4d7] bg-[#f9fbf7] px-4 font-normal focus-visible:border-[#6f9467] focus-visible:ring-4 focus-visible:ring-[#c7dfbd]/45 dark:border-white/10 dark:bg-white/5 dark:focus-visible:border-[#9fc38e] dark:focus-visible:ring-[#5f8652]/30"
                  />
                </div>
                <div className="grid gap-2 text-sm font-semibold">
                  <Label htmlFor="phone">{copy.phone}</Label>
                  <Input
                    id="phone"
                    required
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+998 90 123 45 67"
                    className="h-12 rounded-2xl border-[#dbe4d7] bg-[#f9fbf7] px-4 font-normal focus-visible:border-[#6f9467] focus-visible:ring-4 focus-visible:ring-[#c7dfbd]/45 dark:border-white/10 dark:bg-white/5 dark:focus-visible:border-[#9fc38e] dark:focus-visible:ring-[#5f8652]/30"
                  />
                </div>
              </div>

              <div className="grid gap-2 text-sm font-semibold">
                <Label htmlFor="style">{copy.style}</Label>
                <Select name="style" required>
                  <SelectTrigger
                    id="style"
                    className="h-12 w-full rounded-2xl border-[#dbe4d7] bg-[#f9fbf7] px-4 font-normal focus-visible:border-[#6f9467] focus-visible:ring-4 focus-visible:ring-[#c7dfbd]/45 dark:border-white/10 dark:bg-white/5 dark:focus-visible:border-[#9fc38e] dark:focus-visible:ring-[#5f8652]/30"
                  >
                    <SelectValue placeholder={copy.stylePlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {copy.styles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-[0.92fr_1.08fr]">
                <div className="grid gap-2 text-sm font-semibold">
                  <Label htmlFor="date">{copy.day}</Label>
                  <Input
                    id="date"
                    required
                    name="date"
                    type="date"
                    className="h-12 rounded-2xl border-[#dbe4d7] bg-[#f9fbf7] px-4 font-normal focus-visible:border-[#6f9467] focus-visible:ring-4 focus-visible:ring-[#c7dfbd]/45 dark:border-white/10 dark:bg-white/5 dark:focus-visible:border-[#9fc38e] dark:focus-visible:ring-[#5f8652]/30"
                  />
                </div>
                <fieldset className="grid gap-2">
                  <legend className="text-sm font-semibold">{copy.time}</legend>
                  <RadioGroup
                    name="time"
                    required
                    aria-label={copy.time}
                    className="grid grid-cols-2 gap-2"
                  >
                    {copy.times.map((time) => (
                      <Label
                        key={time}
                        htmlFor={`time-${time}`}
                        className="h-12 cursor-pointer justify-center rounded-2xl border border-[#dbe4d7] bg-[#f9fbf7] text-sm font-medium transition hover:border-[#a4bd9c] has-[[data-state=checked]]:border-[#5f8957] has-[[data-state=checked]]:bg-[#dcefd4] has-[[data-state=checked]]:text-[#31542e] dark:border-white/10 dark:bg-white/5 dark:has-[[data-state=checked]]:border-[#91bd80] dark:has-[[data-state=checked]]:bg-[#294529] dark:has-[[data-state=checked]]:text-[#e4f5d9]"
                      >
                        <RadioGroupItem
                          id={`time-${time}`}
                          value={time}
                          className="sr-only"
                        />
                        {time}
                      </Label>
                    ))}
                  </RadioGroup>
                </fieldset>
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-2 h-13 w-full rounded-2xl bg-[#426d3d] text-[15px] hover:bg-[#315a31] dark:bg-[#9fc78f] dark:text-[#193518] dark:hover:bg-[#b3dba2]"
              >
                {copy.submit}
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  className="size-5"
                  strokeWidth={2}
                />
              </Button>
              {/* <p className="flex items-center justify-center gap-1.5 text-center text-xs leading-5 text-[#758673] dark:text-[#9fb09e]">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4 shrink-0 text-[#6e9a61]"
                  strokeWidth={1.8}
                />
                {copy.privacy}
              </p> */}
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-4xl rounded-[2rem] border border-[#dce6d6] bg-white/55 p-6 sm:p-8 dark:border-white/10 dark:bg-white/5">
          <p className="text-center text-xl font-bold tracking-[-0.035em] sm:text-2xl">
            {copy.stepsTitle}
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {copy.steps.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 dark:bg-black/10"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#dcefd4] text-xs font-bold text-[#41633b] dark:bg-[#294529] dark:text-[#c6e7b7]">
                  0{index + 1}
                </span>
                <p className="pt-0.5 text-sm leading-5 text-[#526552] dark:text-[#c4d1c2]">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
