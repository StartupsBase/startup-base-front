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
    <div className="mx-auto mt-5 grid w-full max-w-6xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-10 sm:grid-cols-3 sm:gap-6 sm:px-6 md:px-10 lg:grid-cols-5 lg:gap-4 lg:pb-24">
      {KpiCardsOptions.map((card) => (
        <div
          key={card.id}
          className={`relative mx-auto aspect-square w-full max-w-[190px] rounded-full border border-border/70 p-3 text-center sm:p-4 lg:p-3 xl:p-5 ${
            card.id === 5 ? "col-span-2 sm:col-span-1" : ""
          } ${card.top ? "lg:translate-y-12" : ""}`}
        >
          <p className="absolute top-[9%] right-[10%] w-fit rounded-full bg-green-500 px-2 py-0.5 text-[10px] leading-4 font-semibold text-white sm:px-2.5 sm:text-xs">
            {card.percentage}%
          </p>
          <div className="flex h-full flex-col items-center justify-center">
            <NumberTicker
              value={card.value}
              className="whitespace-nowrap text-lg font-bold xs:text-xl 2xs:text-[22px] sm:text-2xl lg:text-xl xl:text-2xl"
            />
            <h4 className="mt-1 max-w-[90%] text-xs leading-tight font-medium 2xs:text-sm sm:text-base lg:text-sm xl:text-base">
              {card.title}
            </h4>
            {card.subtitle ? (
              <p className="mt-1 max-w-[85%] text-[10px] leading-tight font-medium text-muted-foreground sm:text-xs lg:text-[11px]">
                {card.subtitle}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default KpiStatsCards
