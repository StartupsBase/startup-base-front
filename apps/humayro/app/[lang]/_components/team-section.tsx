import { ArrowUpRight01Icon, Linkedin01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import Link from "next/link"

type TeamSectionProps = {
  lang: "uz" | "ru"
}

type TeamMember = {
  name: string
  role: string
  description: string
  location: string
  image: string
  isFounder?: boolean
  linkedinUrl: string
}

const teamByLanguage: Record<TeamSectionProps["lang"], TeamMember[]> = {
  uz: [
    {
      name: "Xasanjon Abdunabiyev",
      role: "ASOSCHI VA FRONTEND DASTURCHI",
      description:
        "Humayro asoschisi. Ta'lim markazlari uchun sodda va ishonchli boshqaruv tizimini yaratadi.",
      location: "Toshkent",
      image: "/images/team/furkat-teshaev.png",
      isFounder: true,
      linkedinUrl: "https://www.linkedin.com/in/xasanjon-abdunabiyev/",
    },
    {
      name: "Mavlon Akmalov",
      role: "ASOSCHI VA BACKEND DASTURCHI",
      description:
        "Mahsulot va biznes jarayonlariga mas'ul. Har bir o'quv markazi tezroq ishlashi uchun yechimlar yaratadi.",
      location: "Toshkent",
      image: "/images/team/dilshodbek-khodjakov.png",
      isFounder: true,
      linkedinUrl: "https://www.linkedin.com/in/mavlon-akmalov-84153a34b/",
    },
    {
      name: "Rovshanbek Mirvoxitov",
      role: "FRONTEND DASTURCHI",
      description:
        "Humayro texnik yo'nalishini boshqaradi va platformaning barqaror, qulay ishlashini ta'minlaydi.",
      location: "Toshkent",
      isFounder: true,
      image: "/images/team/umid-sultonov.png",
      linkedinUrl: "https://www.linkedin.com/in/rovshanbek-mirvoxitov-96b831373/",
    },
  ],
  ru: [
    {
      name: "Хасанжон Абдунабиев",
      role: "ОСНОВАТЕЛЬ И FRONTEND-РАЗРАБОТЧИК",
      description:
        "Основатель Humayro. Создаёт простую и надёжную систему управления для учебных центров.",
      location: "Ташкент",
      image: "/images/team/furkat-teshaev.png",
      isFounder: true,
      linkedinUrl: "https://www.linkedin.com/in/xasanjon-abdunabiyev/",
    },
    {
      name: "Мавлон Акмалов",
      role: "ОСНОВАТЕЛЬ И BACKEND-РАЗРАБОТЧИК",
      description:
        "Отвечает за продукт и бизнес-процессы, создавая решения для более быстрой работы учебных центров.",
      location: "Ташкент",
      image: "/images/team/dilshodbek-khodjakov.png",
      isFounder: true,
      linkedinUrl: "https://www.linkedin.com/in/mavlon-akmalov-84153a34b/",
    },
    {
      name: "Ровшанбек Мирвохитов",
      role: "FRONTEND-РАЗРАБОТЧИК",
      description:
        "Развивает техническое направление Humayro и отвечает за стабильность и удобство платформы.",
      location: "Ташкент",
      isFounder: true,
      image: "/images/team/umid-sultonov.png",
      linkedinUrl: "https://www.linkedin.com/in/rovshanbek-mirvoxitov-96b831373/",
    },
  ],
}

export default function TeamSection({ lang }: TeamSectionProps) {
  const members = teamByLanguage[lang]
  const copy =
    lang === "ru"
      ? {
          eyebrow: "Команда",
          title: "Познакомьтесь с командой, которая создаёт Humayro",
          description:
            "Одна цель, одна небольшая команда: помогать учебным центрам работать лучше уже сегодня, а студентам учиться быстрее завтра.",
          linkedIn: "Профиль LinkedIn",
        }
      : {
          eyebrow: "Jamoa",
          title: "Humayro'ni yaratayotgan jamoa bilan tanishing",
          description:
            "Bitta maqsadli kichik jamoa: bugun o'quv markazlari yaxshiroq ishlashiga, ertaga esa har bir talaba tezroq o'rganishiga yordam berish.",
          linkedIn: "LinkedIn profil",
        }

  return (
    <section className="px-6 py-20 text-[#f6f4ef] sm:py-24 md:px-10 lg:py-18">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary/70 dark:text-white uppercase">
            <span className="h-4 w-px" aria-hidden="true" />
            {copy.eyebrow}
          </p>
          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] text-[#123e33] sm:text-5xl lg:text-6xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#9cadc5] sm:text-lg">
            {copy.description}
          </p>
        </header>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {members.map((member) => (
            <article key={member.name} className="group">
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-[#17263d]">
                {member.isFounder && (
                  <span className="absolute top-3 left-3 z-10 rounded-full bg-primary/60 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-white uppercase shadow-lg">
                    {lang === "ru" ? "Основатель" : "Asoschi"}
                  </span>
                )}
                <Image
                  src={member.image}
                  alt={`${member.name} portreti`}
                  fill
                  sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 100vw"
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                />
              </div>

              <div className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#17263d] dark:text-[#edf8f4]">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-[11px] font-semibold tracking-[0.12em] text-primary/80 uppercase">
                      {member.role}
                    </p>
                  </div>
                  <Link
                    href={member.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${member.name}: ${copy.linkedIn}`}
                    className="grid size-10 shrink-0 place-items-center rounded-full border  dark:border-white/10 text-black dark:text-[#9cadc5] transition-colors hover:border-primary hover:text-primary"
                  >
                    <HugeiconsIcon
                      icon={Linkedin01Icon}
                      className="size-4"
                      strokeWidth={1.8}
                    />
                  </Link>
                </div>
                <p className="mt-4 min-h-18 text-sm leading-6 text-[#a8b7cb]">
                  {member.description}
                </p>
                <p className="mt-3 text-sm text-[#17263d] dark:text-[#7e91ad]">{member.location}</p>
                <Link
                  href={member.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold dark:text-[#edf8f4] text-[#17263d] transition-colors hover:text-primary"
                >
                  {copy.linkedIn}
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    className="size-4"
                    strokeWidth={1.8}
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
