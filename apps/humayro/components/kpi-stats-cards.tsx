"use client"

import { useGetStats } from "@/lib/api"
import { NumberTicker } from "@workspace/ui/components/number-ticker"
import { Skeleton } from "@workspace/ui/components/skeleton"
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

const KpiStatsSkeleton = () => {
  return (
    <div className="mx-auto mt-5 grid w-full max-w-7xl grid-cols-2 gap-3 px-4 pt-5 pb-23 sm:px-6 md:grid-cols-3 md:px-10 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "relative aspect-square w-full min-w-0 rounded-full border bg-background/45 p-3 backdrop-blur-sm",
            "last:col-span-2 last:mx-auto last:w-[calc(50%-0.375rem)]",
            "md:last:col-span-1 md:last:w-full",
            "sm:p-4 lg:p-5",
            (index === 1 || index === 3) && "lg:translate-y-18"
          )}
        >
          <Skeleton className="absolute top-[12%] right-[14%] h-5 w-10 rounded-full" />

          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-4 w-[70%] rounded-md" />
            <Skeleton className="h-3 w-[50%] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

const KpiStatsCards = () => {
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useGetStats()

  if (isLoading) {
    return <KpiStatsSkeleton />
  }

  const monthStart = data?.monthStart
    ? new Intl.DateTimeFormat(i18n.language, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${data.monthStart}T00:00:00Z`))
    : null

  const kpiCardsOptions: KpiCardOption[] = [
    {
      id: 1,
      titleKey: "home.kpi.activeCustomers",
      subtitleKey: "home.kpi.thisMonth",
      value: data?.activeClients ?? 0,
      percentage: 8,
    },
    {
      id: 2,
      titleKey: "home.kpi.monthlyRevenue",
      subtitleKey: "home.kpi.fromLastMonth",
      value: data?.monthlyRevenue ?? 0,
      percentage: 12,
      top: 18,
    },
    {
      id: 3,
      titleKey: "home.kpi.branchesCount",
      value: data?.branches ?? 0,
      percentage: 15,
    },
    {
      id: 4,
      titleKey: "home.kpi.organizationsCount",
      value: data?.organizations ?? 0,
      percentage: 50,
      top: 18,
    },
    {
      id: 5,
      titleKey: "home.kpi.regionsCount",
      value: data?.regions ?? 0,
      percentage: 75,
    },
  ]

  return (
    <div>
      <div className="mx-auto mt-5 grid w-full max-w-7xl grid-cols-2 gap-3 px-4 pt-5 pb-8 sm:px-6 md:grid-cols-3 md:px-10 lg:grid-cols-5">
        {kpiCardsOptions.map((card) => (
          <div
            key={card.id}
            className={cn(
              "relative aspect-square w-full min-w-0 rounded-full border bg-background/45 p-3 text-center backdrop-blur-sm",
              "last:col-span-2 last:mx-auto last:w-[calc(50%-0.375rem)]",
              "sm:p-4 md:last:col-span-1 md:last:w-full lg:p-5",
              card.top && "lg:translate-y-18"
            )}
          >
            <p className="absolute top-[12%] right-[14%] w-fit rounded-full bg-green-500 px-2 py-0.5 text-[9px] font-semibold text-white sm:px-2.5 sm:text-[10px]">
              {card.percentage}%
            </p>

            <div className="flex h-full min-w-0 flex-col items-center justify-center px-1">
              <NumberTicker
                value={card.value}
                className="max-w-[90%] text-[clamp(2rem,8vw,3.375rem)] font-bold sm:text-[22px]"
              />

              <h4 className="2xs:text-sm mt-1 max-w-[90%] text-xs leading-tight font-medium sm:text-base lg:text-sm xl:text-base">
                {t(card.titleKey)}
              </h4>

              {card.subtitleKey && (
                <p className="mt-1 max-w-[85%] text-[10px] leading-tight font-medium text-muted-foreground sm:text-xs lg:text-[11px]">
                  {t(card.subtitleKey)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {monthStart && (
        <p className="pb-10 text-center text-xs text-muted-foreground sm:text-sm">
          {t("home.kpi.projectStarted", {
            date: monthStart,
          })}
        </p>
      )}
    </div>
  )
}

export default KpiStatsCards