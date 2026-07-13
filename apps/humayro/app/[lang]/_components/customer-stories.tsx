import Image from "next/image"

import { Marquee } from "@workspace/ui/components/marquee"

type CustomerStoriesProps = {
  lang: "uz" | "ru"
}

type CustomerStory = {
  initials: string
  name: string
  role: string
  quote: string
  image: string
}

const storiesByLanguage: Record<CustomerStoriesProps["lang"], CustomerStory[]> =
  {
    uz: [
      {
        initials: "OQ",
        name: "Otabek Qodirov",
        role: "Toshkent · Humayro mijozi",
        quote:
          "Ishga mos libosni tez topdim. Kategoriya va ranglar bo‘yicha saralash juda qulay ekan.",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "DK",
        name: "Dilnoza Karimova",
        role: "Toshkent · Humayro mijozasi",
        quote:
          "Kuzgi garderob uchun variantlarni bir joyda saraladim. Har bir kiyimning rangi va o‘lchami aniq ko‘rsatilgan.",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "AS",
        name: "Akmal Saidov",
        role: "Samarqand · Humayro mijozi",
        quote:
          "Tadbir uchun obraz izlashga ko‘p vaqt ketmadi. Reyting va narxlarni ko‘rib, mos variantni tanladim.",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "NS",
        name: "Nodira Sodiqova",
        role: "Buxoro · Humayro mijozasi",
        quote:
          "Savatga qo‘shib, buyurtmani bir necha qadamda rasmiylashtirdim. Yetkazib berish manzilini kiritish ham oson.",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "SA",
        name: "Sardor Abduqodirov",
        role: "Farg‘ona · Humayro mijozi",
        quote:
          "Narx va chegirmalar bir qarashda ko‘rinadi. Shuning uchun byudjetimga mos kiyimni tez topdim.",
        image:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "MG",
        name: "Madina G‘ofurova",
        role: "Toshkent · Humayro mijozasi",
        quote:
          "Mavsum va uslubimga mos kolleksiyalar tanlangan. Qidiruvga kamroq vaqt ketadigan bo‘ldi.",
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      },
    ],
    ru: [
      {
        initials: "OQ",
        name: "Отабек Кодиров",
        role: "Ташкент · клиент Humayro",
        quote:
          "Быстро нашёл одежду для работы. Очень удобно фильтровать вещи по категории и цвету.",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "DK",
        name: "Дилноза Каримова",
        role: "Ташкент · клиентка Humayro",
        quote:
          "Собрала варианты для осеннего гардероба в одном месте. Цвет и размер каждой вещи указаны понятно.",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "AS",
        name: "Акмал Саидов",
        role: "Самарканд · клиент Humayro",
        quote:
          "На поиск образа для мероприятия ушло немного времени. Посмотрел рейтинг и цены, затем выбрал подходящий вариант.",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "NS",
        name: "Нодира Содикова",
        role: "Бухара · клиентка Humayro",
        quote:
          "Добавила вещи в корзину и оформила заказ за несколько шагов. Указать адрес доставки тоже оказалось просто.",
        image:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "SA",
        name: "Сардор Абдукодиров",
        role: "Фергана · клиент Humayro",
        quote:
          "Цены и скидки видны сразу. Поэтому я быстро нашёл одежду, которая подходит моему бюджету.",
        image:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=160&q=80",
      },
      {
        initials: "MG",
        name: "Мадина Гафурова",
        role: "Ташкент · клиентка Humayro",
        quote:
          "Коллекции подобраны по сезону и стилю. Теперь на поиск подходящей одежды уходит гораздо меньше времени.",
        image:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=160&q=80",
      },
    ],
  }

function StoryCard({ story }: { story: CustomerStory }) {
  return (
    <article className="mx-2 flex h-48 w-[19rem] shrink-0 flex-col rounded-3xl border border-[#b6d9cd] bg-white/85 p-5 text-left whitespace-normal backdrop-blur-sm sm:mx-3 sm:w-[22rem] dark:border-white/10 dark:bg-[#102b25]/80 dark:shadow-none">
      <div className="flex items-center gap-3">
        <Image
          src={story.image}
          alt={`${story.name} portreti`}
          width={44}
          height={44}
          className="size-11 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[#16483b] dark:text-[#e2f3ed]">
            {story.name}
          </h3>
          <p className="truncate text-xs text-[#63877b] dark:text-[#9bb9af]">
            {story.role}
          </p>
        </div>
      </div>
      <p className="wrap-break-words mt-4 line-clamp-3 text-sm leading-6 text-[#40675a] dark:text-[#c0d9d1]">
        {story.quote}
      </p>
    </article>
  )
}

export default function CustomerStories({ lang }: CustomerStoriesProps) {
  const stories = storiesByLanguage[lang]
  const copy =
    lang === "ru"
      ? {
          eyebrow: "Отзывы клиентов",
          title: "Они находят одежду в своём стиле вместе с Humayro.",
        }
      : {
          eyebrow: "Mijozlar fikri",
          title: "Ular uslubiga mos liboslarni Humayro bilan topadi.",
        }

  return (
    <section className="overflow-hidden py-20 sm:py-24">
      <div className="mx-auto px-6 text-center md:px-10">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#16836b] uppercase dark:text-[#71c9b4]">
          {copy.eyebrow}
        </p>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.05em] text-balance text-[#123e33] sm:text-5xl dark:text-[#edf8f4]">
          {copy.title}
        </h2>
      </div>

      <div className="relative mt-11 space-y-5 sm:mt-14 sm:space-y-6">
        <Marquee duration={22} pauseOnHover>
          {stories.slice(0, 3).map((story) => (
            <StoryCard key={story.name} story={story} />
          ))}
        </Marquee>
        <Marquee duration={26} reverse pauseOnHover>
          {stories.slice(3).map((story) => (
            <StoryCard key={story.name} story={story} />
          ))}
        </Marquee>

      </div>
    </section>
  )
}
