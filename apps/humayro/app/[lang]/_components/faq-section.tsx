import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"

type FaqSectionProps = {
  lang: "uz" | "ru"
}

type FaqItem = {
  question: string
  answer: string
}

const faqByLanguage: Record<FaqSectionProps["lang"], FaqItem[]> = {
  uz: [
    {
      question: "Humayro nima?",
      answer:
        "Humayro — uslubingiz, mavsum va vaziyatingizga mos kiyimlarni topish hamda tanlashni osonlashtiradigan platforma.",
    },
    {
      question: "Kerakli kiyimni qanday tez topaman?",
      answer:
        "Katalogda kategoriyalar va ranglar bo‘yicha saralashingiz, mahsulotning narxi, reytingi va mavjudligini ko‘rishingiz mumkin.",
    },
    {
      question: "O‘lcham va rangni tanlash mumkinmi?",
      answer:
        "Ha. Mahsulot kartasida mavjud rang va o‘lcham variantlari ko‘rsatiladi — o‘zingizga mosini tanlab savatga qo‘shasiz.",
    },
    {
      question: "Chegirmalar qayerda ko‘rinadi?",
      answer:
        "Agar mahsulotda chegirma bo‘lsa, asosiy va chegirmadagi narx mahsulot sahifasida ko‘rsatiladi.",
    },
    {
      question: "Buyurtmani qanday rasmiylashtiraman?",
      answer:
        "Tanlangan mahsulotlarni savatga qo‘shing, qabul qiluvchi ism-sharifi, telefon raqami va yetkazib berish manzilini kiriting.",
    },
  ],
  ru: [
    {
      question: "Что такое Humayro?",
      answer:
        "Humayro — платформа, которая помогает находить и выбирать одежду под ваш стиль, сезон и конкретный случай.",
    },
    {
      question: "Как быстро найти нужную одежду?",
      answer:
        "В каталоге можно фильтровать товары по категории и цвету, а также видеть цену, рейтинг и наличие товара.",
    },
    {
      question: "Можно выбрать размер и цвет?",
      answer:
        "Да. На странице товара указаны доступные варианты цвета и размера — выберите подходящий и добавьте его в корзину.",
    },
    {
      question: "Где отображаются скидки?",
      answer:
        "Если на товар действует скидка, исходная и сниженная цены отображаются на странице товара.",
    },
    {
      question: "Как оформить заказ?",
      answer:
        "Добавьте выбранные товары в корзину, затем укажите имя получателя, номер телефона и адрес доставки.",
    },
  ],
}

export default function FaqSection({ lang }: FaqSectionProps) {
  const items = faqByLanguage[lang]
  const copy =
    lang === "ru"
      ? {
          eyebrow: "Ответы на вопросы",
          title: "Всё, что нужно знать о Humayro",
          description: "Коротко о выборе одежды, ценах и оформлении заказа.",
        }
      : {
          eyebrow: "Savollarga javoblar",
          title: "Humayro haqida bilishingiz kerak bo‘lganlar",
          description:
            "Kiyim tanlash, narxlar va buyurtmani rasmiylashtirish haqida qisqacha.",
        }

  return (
    <section className="px-6 py-20 sm:py-24 md:px-10 ">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <header className="max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#16836b] uppercase dark:text-[#79cfba]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-balance text-[#123e33] sm:text-5xl dark:text-[#edf8f4]">
            {copy.title}
          </h2>
          <p className="mt-5 text-base leading-7 text-[#5d7c71] dark:text-[#a8c8bd]">
            {copy.description}
          </p>
        </header>

        <Accordion
          type="single"
          collapsible
          className="h-fit"
        >
          {items.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="px-5 py-5 text-base text-[#17463a] hover:no-underline dark:text-[#e5f4ee]">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="px-5 text-sm leading-6 text-[#5d7c71] dark:text-[#b7d0c7]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
