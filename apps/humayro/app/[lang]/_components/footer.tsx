"use client"

import {
  ArrowUp01Icon,
  InstagramIcon,
  TelegramIcon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Logo, LogoBrand } from "@/components/logo"
import type { Language } from "@/i18n/config"

const footerCopy = {
  uz: {
    description:
      "Uslubingizni kashf qiling va garderobingizni oson boshqaring.",
    navigation: "Asosiy bo‘limlar",
    information: "Ma’lumot",
    home: "Bosh sahifa",
    demo: "Demo bron qilish",
    blog: "Blog",
    privacy: "Maxfiylik siyosati",
    signIn: "Kirish",
    follow: "Bizni kuzating",
    backToTop: "Yuqoriga qaytish",
  },
  ru: {
    description: "Открывайте свой стиль и легко управляйте гардеробом.",
    navigation: "Основные разделы",
    information: "Информация",
    home: "Главная",
    demo: "Записаться на демо",
    blog: "Блог",
    privacy: "Политика конфиденциальности",
    signIn: "Войти",
    follow: "Мы в соцсетях",
    backToTop: "Наверх",
  },
} as const

const Footer = ({ language }: { language: Language }) => {
  const pathname = usePathname()
  const copy = footerCopy[language]
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 50)

    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (
    pathname.startsWith(`/${language}/dashboard`) ||
    pathname.startsWith(`/${language}/login`)
  ) {
    return null
  }

  return (
    <footer className="relative mt-15 overflow-hidden rounded-t-[45px] border-t border-border/70 bg-background px-4 pt-14 sm:px-6 lg:px-10">
      <div className="mx-auto grid w-full max-w-7xl gap-12 pb-16 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr] lg:gap-16">
        <div className="max-w-xs">
          <LogoBrand />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {copy.description}
          </p>
          <div className="mt-6">
            <p className="mb-3 text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              {copy.follow}
            </p>
            <div className="flex items-center gap-3 text-muted-foreground">
              <HugeiconsIcon icon={TelegramIcon} className="size-5" />
              <HugeiconsIcon icon={InstagramIcon} className="size-5" />
              <HugeiconsIcon icon={WhatsappIcon} className="size-5" />
            </div>
          </div>
        </div>

        <nav aria-label={copy.navigation}>
          <h2 className="mb-4 font-semibold">{copy.navigation}</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link
                className="transition-colors hover:text-primary"
                href={`/${language}`}
              >
                {copy.home}
              </Link>
            </li>
            <li>
              <Link
                className="transition-colors hover:text-primary"
                href={`/${language}/book-demo`}
              >
                {copy.demo}
              </Link>
            </li>
            <li>
              <Link
                className="transition-colors hover:text-primary"
                href={`/${language}/blogs`}
              >
                {copy.blog}
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label={copy.information}>
          <h2 className="mb-4 font-semibold">{copy.information}</h2>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>
              <Link
                className="transition-colors hover:text-primary"
                href={`/${language}/privacy-policy`}
              >
                {copy.privacy}
              </Link>
            </li>
            <li>
              <Link
                className="transition-colors hover:text-primary"
                href={`/${language}/login`}
              >
                {copy.signIn}
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none text-center text-[clamp(4.3rem,17.8vw,17rem)] leading-none font-black tracking-[-0.035em] text-foreground/5 select-none"
      >
        HUMAYRO
      </p>

      {showBackToTop && (
        <button
          type="button"
          aria-label={copy.backToTop}
          title={copy.backToTop}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed right-5 bottom-5 z-50 grid size-11 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none [&_svg]:h-6! [&_svg]:w-6!"
        >
          <HugeiconsIcon
            icon={ArrowUp01Icon}
          />
        </button>
      )}
    </footer>
  )
}

export default Footer
