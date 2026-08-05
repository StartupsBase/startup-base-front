"use client"

import { NumberTicker } from "@workspace/ui/components/number-ticker"
import { cn } from "@workspace/ui/lib/utils"
import { useTranslation } from "react-i18next"

type KpiCardOption = {
  id: number
  titleKey: string
  subtitleKey?: string
  value: number
  percentage: number
  top?: number
}

const kpiCardsOptions: KpiCardOption[] = [
  {
    id: 1,
    titleKey: "home.kpi.activeCustomers",
    subtitleKey: "home.kpi.thisMonth",
    value: 600,
    percentage: 8,
  },
  {
    id: 2,
    titleKey: "home.kpi.monthlyRevenue",
    subtitleKey: "home.kpi.fromLastMonth",
    value: 24079876,
    percentage: 12,
    top: 18,
  },
  {
    id: 3,
    titleKey: "home.kpi.branchesCount",
    value: 20,
    percentage: 15,
  },
  {
    id: 4,
    titleKey: "home.kpi.organizationsCount",
    value: 10,
    percentage: 50,
    top: 18,
  },
  {
    id: 5,
    titleKey: "home.kpi.regionsCount",
    value: 12,
    percentage: 75,
  },
]

const KpiStatsCards = () => {
  const { t } = useTranslation()

  return (
    <div className="mx-auto mt-5 grid w-full max-w-6xl grid-cols-2 gap-3 px-4 pt-5 pb-23 sm:px-6 md:grid-cols-3 md:px-10 lg:grid-cols-5">
      {kpiCardsOptions.map((card) => (
        <div
          key={card.id}
          className={cn(
            "relative aspect-square w-full min-w-0 rounded-full border bg-background/45 p-3 text-center backdrop-blur-sm last:col-span-2 last:mx-auto last:w-[calc(50%-0.375rem)] sm:p-4 md:last:col-span-1 md:last:w-full lg:p-5",
            card.top && "lg:translate-y-18"
          )}
        >
          <p className="absolute top-[12%] right-[14%] w-fit rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-semibold text-white sm:px-2.5 sm:text-[10px]">
            {card.percentage}%
          </p>
          <div className="flex h-full min-w-0 flex-col items-center justify-center px-1">
            <NumberTicker
              value={card.value}
              className="max-w-[90%] text-[clamp(1rem,5vw,1.375rem)] font-bold sm:text-[22px]"
            />
            <h4 className="2xs:text-sm mt-1 max-w-[90%] text-xs leading-tight font-medium sm:text-base lg:text-sm xl:text-base">
              {t(card.titleKey)}
            </h4>
            {card.subtitleKey ? (
              <p className="mt-1 max-w-[85%] text-[10px] leading-tight font-medium text-muted-foreground sm:text-xs lg:text-[11px]">
                {t(card.subtitleKey)}
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

export default KpiStatsCards
