import {
  AnalyticsDownIcon,
  AnalyticsUpIcon,
  CalculatorIcon,
  Calendar03Icon,
  ChampionIcon,
  Money03Icon,
  ShoppingCart02Icon,
  Store01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
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
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components/progress"
import { cn } from "@workspace/ui/lib/utils"

type DailySalesPoint = {
  date?: string
  orders?: number
  revenue?: number
}

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
  const chartData = useMemo(
    () =>
      dailySales.map((point, index) => ({
        date: point.date || String(index + 1),
        orders: point.orders ?? 0,
        revenue: point.revenue ?? 0,
      })),
    [dailySales]
  )
  const [selectedDate, setSelectedDate] = useState<string>()
  const totalRevenue = chartData.reduce((sum, point) => sum + point.revenue, 0)
  const totalOrders = chartData.reduce((sum, point) => sum + point.orders, 0)
  const averageRevenue = chartData.length ? totalRevenue / chartData.length : 0
  const bestDay = chartData.reduce<(typeof chartData)[number] | undefined>(
    (best, point) => (!best || point.revenue > best.revenue ? point : best),
    undefined
  )
  const selectedPoint =
    chartData.find((point) => point.date === selectedDate) ?? chartData.at(-1)
  const chartConfig = {
    revenue: {
      label: t("analytics.chart.revenue"),
      color: "var(--chart-1)",
    },
    orders: {
      label: t("analytics.chart.orders"),
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/70">
      <CardHeader className="gap-4 border-b">
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
      </CardHeader>

      <CardContent className="pt-1">
        <div className="mb-5 grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 xl:grid-cols-4">
          <ChartSummary
            label={t("analytics.chart.totalRevenue")}
            value={formatCurrency(totalRevenue, language)}
          />
          <ChartSummary
            label={t("analytics.chart.totalOrders")}
            value={formatNumber(totalOrders, language)}
          />
          <ChartSummary
            label={t("analytics.chart.dailyRevenueAverage")}
            value={formatCurrency(averageRevenue, language)}
          />
          <ChartSummary
            label={t("analytics.chart.bestDay")}
            value={bestDay ? formatLongDate(bestDay.date, language) : "—"}
            hint={
              bestDay ? formatCurrency(bestDay.revenue, language) : undefined
            }
          />
        </div>

        {chartData.length ? (
          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 rounded-2xl border bg-muted/10 px-2 pt-5 pr-3 sm:px-4 sm:pr-5">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-3 px-2">
                <p className="text-xs text-muted-foreground">
                  {t("analytics.chart.axisHint")}
                </p>
                <Badge variant="outline" className="font-normal">
                  {t("analytics.chart.hoverHint")}
                </Badge>
              </div>
              <ChartContainer
                config={chartConfig}
                className="aspect-auto h-80 w-full min-w-0 sm:h-96"
                aria-label={t("analytics.chart.description")}
              >
                <ComposedChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ left: 0, right: 0, top: 12, bottom: 4 }}
                >
                  <defs>
                    <linearGradient
                      id="analytics-revenue-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0.38}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-revenue)"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="4 4" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={32}
                    tickMargin={12}
                    tickFormatter={(value) =>
                      formatChartDate(String(value), language)
                    }
                  />
                  <YAxis
                    yAxisId="revenue"
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickMargin={8}
                    tickFormatter={(value) =>
                      formatCompactNumber(Number(value), language)
                    }
                  />
                  <YAxis
                    yAxisId="orders"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    width={34}
                    tickMargin={8}
                    allowDecimals={false}
                    tickFormatter={(value) =>
                      formatCompactNumber(Number(value), language)
                    }
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    content={
                      <ChartTooltipContent
                        className="min-w-56"
                        indicator="line"
                        labelFormatter={(label) =>
                          formatLongDate(String(label), language)
                        }
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-6">
                            <span className="text-muted-foreground">
                              {name === "revenue"
                                ? chartConfig.revenue.label
                                : name === "orders"
                                  ? chartConfig.orders.label
                                  : name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {name === "revenue"
                                ? formatCurrency(Number(value), language)
                                : formatNumber(Number(value), language)}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  {selectedPoint ? (
                    <ReferenceLine
                      x={selectedPoint.date}
                      stroke="var(--foreground)"
                      strokeDasharray="3 4"
                      strokeOpacity={0.35}
                    />
                  ) : null}
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    strokeWidth={2.5}
                    fill="url(#analytics-revenue-fill)"
                    activeDot={{
                      r: 5,
                      strokeWidth: 3,
                      stroke: "var(--card)",
                    }}
                  />
                  <Line
                    yAxisId="orders"
                    type="monotone"
                    dataKey="orders"
                    stroke="var(--color-orders)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{
                      r: 5,
                      strokeWidth: 3,
                      stroke: "var(--card)",
                    }}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>

            <SalesFullView
              chartData={chartData}
              language={language}
              selectedDate={selectedPoint?.date}
              totalRevenue={totalRevenue}
              onSelectDate={setSelectedDate}
            />
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

function ChartSummary({
  hint,
  label,
  value,
}: {
  hint?: string
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 bg-card px-4 py-3.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-base font-semibold tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function SalesFullView({
  chartData,
  language,
  onSelectDate,
  selectedDate,
  totalRevenue,
}: {
  chartData: Array<{ date: string; orders: number; revenue: number }>
  language: string
  onSelectDate: (date: string) => void
  selectedDate?: string
  totalRevenue: number
}) {
  const { t } = useTranslation()
  const selectedPoint =
    chartData.find((point) => point.date === selectedDate) ?? chartData.at(-1)
  const averageCheck = selectedPoint?.orders
    ? selectedPoint.revenue / selectedPoint.orders
    : 0
  const periodShare =
    selectedPoint && totalRevenue
      ? (selectedPoint.revenue / totalRevenue) * 100
      : 0

  return (
    <aside className="overflow-hidden rounded-2xl border bg-muted/15">
      <div className="border-b bg-card px-4 py-4">
        <div className="flex items-center gap-2 text-primary">
          <HugeiconsIcon icon={Calendar03Icon} className="size-4!" />
          <p className="text-xs font-semibold tracking-wide uppercase">
            {t("analytics.chart.fullView")}
          </p>
        </div>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          {t("analytics.chart.fullViewHint")}
        </p>
      </div>

      {selectedPoint ? (
        <div className="border-b bg-card px-4 py-4">
          <p className="font-medium">
            {formatLongDate(selectedPoint.date, language)}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <FullViewMetric
              label={t("analytics.chart.revenue")}
              value={formatCurrency(selectedPoint.revenue, language)}
            />
            <FullViewMetric
              label={t("analytics.chart.orders")}
              value={formatNumber(selectedPoint.orders, language)}
            />
            <FullViewMetric
              label={t("analytics.metrics.averageCheck")}
              value={formatCurrency(averageCheck, language)}
            />
            <FullViewMetric
              label={t("analytics.chart.periodShare")}
              value={`${formatPercent(periodShare, language)}%`}
            />
          </dl>
        </div>
      ) : null}

      <div className="max-h-64 overflow-y-auto p-2 xl:max-h-72">
        {chartData
          .slice()
          .reverse()
          .map((point) => {
            const selected = point.date === selectedPoint?.date

            return (
              <button
                key={point.date}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  selected && "bg-card shadow-xs ring-1 ring-border"
                )}
                aria-pressed={selected}
                onClick={() => onSelectDate(point.date)}
              >
                <span className="min-w-0">
                  <span className="block text-xs font-medium">
                    {formatChartDate(point.date, language)}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground tabular-nums">
                    {formatNumber(point.orders, language)}{" "}
                    {t("analytics.chart.ordersShort")}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold tabular-nums">
                  {formatCurrency(point.revenue, language)}
                </span>
              </button>
            )
          })}
      </div>
    </aside>
  )
}

function FullViewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-muted/50 p-2.5">
      <dt className="truncate text-[0.6875rem] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-xs font-semibold tabular-nums">
        {value}
      </dd>
    </div>
  )
}
