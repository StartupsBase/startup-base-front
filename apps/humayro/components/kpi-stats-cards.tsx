import React from "react"
import { UserIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { NumberTicker } from "@workspace/ui/components/number-ticker"

const KpiCardsOptions = [
  {
    id: 1,
    title: "Faol talabalar",
    subtitle: "shu oy",
    value: 600,
    percentage: 8,
  },
  {
    id: 2,
    title: "Oylik daromad",
    subtitle: "o'tgan oydan",
    value: 24079876,
    percentage: 12,
    sum: "so'm",
    top: 18,
  },
  {
    id: 3,
    title: "Filiallar soni",
    value: 20,
    percentage: 15,
  },
  {
    id: 4,
    title: "Tashkilotlar soni",
    value: 10,
    percentage: 50,
    top: 18,
  },
  {
    id: 5,
    title: "Viloyatlar soni",
    value: 12,
    percentage: 75,
  },
]

const KpiStatsCards = () => {
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-5 gap-3 px-6 pt-5 pb-23 mt-5 md:px-10">
      {KpiCardsOptions.map((card) => (
        <div
          key={card.id}
          className="relative aspect-square w-full rounded-full border p-5 text-center"
          style={
            card.top
              ? { transform: `translateY(${card.top * 0.25}rem)` }
              : undefined
          }
        >
          <p className="absolute top-1/4 right-1/4 w-fit rounded-full bg-green-500 px-2.5 text-[10px]">
            {card.percentage}%
          </p>
          <div className="flex h-full flex-col items-center justify-center">
            <NumberTicker
              value={card.value}
              className="text-[22px] font-bold"
            />
            <h4 className="text-[15px] font-medium">{card.title}</h4>
            <h4 className="text-[10px] font-medium">{card.subtitle}</h4>
          </div>
        </div>
      ))}
    </div>
  )
}

export default KpiStatsCards
