import {
  AnalyticsDownIcon,
  AnalyticsUpIcon,
  CalculatorIcon,
  ChampionIcon,
  Money03Icon,
  ShoppingCart02Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { Branch, Metric } from "@/lib/api"
import {
  clampScore,
  formatChartDate,
  formatCompactNumber,
  formatCurrency,
  formatLongDate,
  formatNumber,
  formatPercent,
} from "./analytics-formatters"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

type DailySalesPoint = {
  date?: string
  orders?: number
  revenue?: number
}

type ChartMetric = "orders" | "revenue"

export function AnalyticsOverview({
  averageCheck,
  branches,
  dailySales,
  language,
  orders,
  revenue,
}: {
  averageCheck?: Metric
  branches: Branch[]
  dailySales: DailySalesPoint[]
  language: string
  orders?: Metric
  revenue?: Metric
}) {
  const { t } = useTranslation()
  const topBranch = [...branches].sort(
    (left, right) => (right.score ?? 0) - (left.score ?? 0)
  )[0]

  return (
    <div className="space-y-6">
      <section
        aria-label={t("analytics.metrics.summary")}
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <MetricCard
          icon={Money03Icon}
          metric={revenue}
          title={t("analytics.metrics.revenue")}
          valueFormatter={(value) => formatCurrency(value, language)}
        />
        <MetricCard
          icon={ShoppingCart02Icon}
          metric={orders}
          title={t("analytics.metrics.orders")}
          valueFormatter={(value) => formatNumber(value, language)}
        />
        <MetricCard
          icon={CalculatorIcon}
          metric={averageCheck}
          title={t("analytics.metrics.averageCheck")}
          valueFormatter={(value) => formatCurrency(value, language)}
        />
        <TopBranchCard branch={topBranch} />
      </section>

      <SalesChart dailySales={dailySales} language={language} />
    </div>
  )
}

function MetricCard({
  icon,
  metric,
  title,
  valueFormatter,
}: {
  icon: IconSvgElement
  metric?: Metric
  title: string
  valueFormatter: (value: number) => string
}) {
  const { t } = useTranslation()
  const change = metric?.changePercent

  return (
    <Card className="relative min-h-44 border-0 shadow-sm ring-1 ring-border/70 transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-linear-to-b from-primary/7 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <CardAction>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <HugeiconsIcon icon={icon} className="size-5!" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="relative mt-auto">
        <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
          {valueFormatter(metric?.value ?? 0)}
        </p>
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2">
          <TrendBadge change={change} />
          <span className="truncate text-xs text-muted-foreground">
            {t("analytics.metrics.previous")}:{" "}
            {metric?.previousValue === undefined
              ? "—"
              : valueFormatter(metric.previousValue)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function TrendBadge({ change }: { change?: number }) {
  const { t, i18n } = useTranslation()
  const positive = typeof change === "number" && change > 0
  const negative = typeof change === "number" && change < 0

  return (
    <Badge
      variant={negative ? "destructive" : positive ? "secondary" : "outline"}
      className={cn(
        "h-6 gap-1 px-2 font-semibold tabular-nums",
        positive && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      )}
      aria-label={t("analytics.metrics.change")}
    >
      {positive || negative ? (
        <HugeiconsIcon
          icon={positive ? AnalyticsUpIcon : AnalyticsDownIcon}
          className="size-3.5!"
        />
      ) : null}
      {typeof change === "number"
        ? `${change > 0 ? "+" : ""}${formatPercent(change, i18n.language)}%`
        : "—"}
    </Badge>
  )
}

function TopBranchCard({ branch }: { branch?: Branch }) {
  const { t } = useTranslation()
  const score = clampScore(branch?.score)

  return (
    <Card className="relative min-h-44 border-0 bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/30">
      <div className="pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-white/10 blur-2xl" />
      <CardHeader className="relative">
        <CardTitle className="text-sm font-medium text-primary-foreground/75">
          {t("analytics.metrics.topBranch")}
        </CardTitle>
        <CardAction>
          <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/12 ring-1 ring-primary-foreground/15">
            <HugeiconsIcon icon={ChampionIcon} className="size-5!" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="relative mt-auto">
        <p className="truncate text-2xl font-semibold tracking-tight">
          {branch?.branchName || "—"}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <Progress
            value={score}
            className="bg-primary-foreground/20 [&_[data-slot=progress-indicator]]:bg-primary-foreground"
          />
          <span className="text-sm font-semibold tabular-nums">
            {score}/100
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SalesChart({
  dailySales,
  language,
}: {
  dailySales: DailySalesPoint[]
  language: string
}) {
  const { t } = useTranslation()
  const [metric, setMetric] = useState<ChartMetric>("revenue")
  const total = dailySales.reduce((sum, point) => sum + (point[metric] ?? 0), 0)
  const average = dailySales.length ? total / dailySales.length : 0
  const formatter = metric === "revenue" ? formatCurrency : formatNumber

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/70">
      <CardHeader className="gap-4 border-b md:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-2 flex items-center gap-2 text-primary">
            <HugeiconsIcon icon={Store01Icon} className="size-4!" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              {t("analytics.chart.eyebrow")}
            </span>
          </div>
          <CardTitle className="text-lg">
            {t("analytics.chart.title")}
          </CardTitle>
          <CardDescription className="mt-1.5 max-w-2xl">
            {t("analytics.chart.description")}
          </CardDescription>
        </div>
        <Tabs
          value={metric}
          onValueChange={(value) => setMetric(value as ChartMetric)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="revenue">
              {t("analytics.chart.revenue")}
            </TabsTrigger>
            <TabsTrigger value="orders">
              {t("analytics.chart.orders")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent className="pt-1">
        <div className="mb-4 flex flex-wrap items-end gap-x-8 gap-y-3 border-b border-border/60 pb-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("analytics.chart.periodTotal")}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatter(total, language)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              {t("analytics.chart.dailyAverage")}
            </p>
            <p className="mt-1 text-base font-medium tabular-nums">
              {formatter(average, language)}
            </p>
          </div>
        </div>

        {dailySales.length ? (
          <div
            className="h-80 w-full min-w-0 sm:h-88"
            role="img"
            aria-label={t("analytics.chart.description")}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dailySales}
                margin={{ left: 0, right: 4, top: 12, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`analytics-${metric}-fill`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.36}
                    />
                    <stop
                      offset="92%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={32}
                  tickMargin={12}
                  tickFormatter={(value) =>
                    formatChartDate(String(value), language)
                  }
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={64}
                  tickMargin={8}
                  allowDecimals={metric === "revenue"}
                  tickFormatter={(value) =>
                    formatCompactNumber(Number(value), language)
                  }
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <RechartsTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.875rem",
                    boxShadow:
                      "0 12px 30px color-mix(in oklch, black 12%, transparent)",
                    color: "var(--popover-foreground)",
                  }}
                  labelFormatter={(label) =>
                    formatLongDate(String(label), language)
                  }
                  formatter={(value) => [
                    formatter(Number(value), language),
                    metric === "revenue"
                      ? t("analytics.chart.revenue")
                      : t("analytics.chart.orders"),
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill={`url(#analytics-${metric}-fill)`}
                  activeDot={{ r: 5, strokeWidth: 3, stroke: "var(--card)" }}
                  connectNulls
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
            <div className="max-w-sm">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <HugeiconsIcon icon={Store01Icon} className="size-6!" />
              </span>
              <p className="mt-4 font-medium">{t("analytics.chart.empty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("analytics.chart.emptyHint")}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
