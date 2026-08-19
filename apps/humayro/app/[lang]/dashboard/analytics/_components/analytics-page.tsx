"use client"

import {
  AnalyticsDownIcon,
  AnalyticsUpIcon,
  CalculatorIcon,
  Money03Icon,
  RefreshIcon,
  ShoppingCart02Icon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { useMemo, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { Branch, Metric, UserDTO } from "@/lib/api"
import {
  useBranches,
  useSales,
} from "@/lib/api/generated/admin-analytics/admin-analytics"
import { useGetAll7 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"

const ALL_ORGANIZATIONS = "__all_organizations__"

type AnalyticsFilters = {
  from: string
  organizationId: string
  to: string
}

export function AnalyticsPage({
  defaultFrom,
  defaultTo,
  initialUser,
  language,
}: {
  defaultFrom: string
  defaultTo: string
  initialUser: UserDTO
  language: string
}) {
  const { t } = useTranslation()
  const isSuperAdmin = initialUser.roles?.includes("ROLE_SUPER_ADMIN") ?? false
  const initialFilters: AnalyticsFilters = {
    from: defaultFrom,
    organizationId: "",
    to: defaultTo,
  }
  const [filters, setFilters] = useState(initialFilters)
  const [appliedFilters, setAppliedFilters] = useState(initialFilters)
  const [validationError, setValidationError] = useState("")
  const params = useMemo(
    () => ({
      from: appliedFilters.from || undefined,
      organizationId:
        isSuperAdmin && appliedFilters.organizationId
          ? Number(appliedFilters.organizationId)
          : undefined,
      to: appliedFilters.to || undefined,
    }),
    [appliedFilters, isSuperAdmin]
  )
  const organizationsQuery = useOrganizations(undefined, {
    query: { enabled: isSuperAdmin, retry: false },
  })
  const salesQuery = useSales(params, {
    query: {
      placeholderData: (previous) => previous,
      retry: false,
    },
  })
  const branchesQuery = useBranches(params, {
    query: {
      placeholderData: (previous) => previous,
      retry: false,
    },
  })
  const hasError = salesQuery.isError || branchesQuery.isError
  const isLoading = salesQuery.isLoading || branchesQuery.isLoading
  const isRefreshing = salesQuery.isFetching || branchesQuery.isFetching

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (filters.from && filters.to && filters.from > filters.to) {
      setValidationError(t("analytics.invalidPeriod"))
      return
    }

    setValidationError("")
    setAppliedFilters(filters)
  }

  function resetFilters() {
    const next = {
      from: defaultFrom,
      organizationId: "",
      to: defaultTo,
    }
    setValidationError("")
    setFilters(next)
    setAppliedFilters(next)
  }

  function retry() {
    void Promise.all([salesQuery.refetch(), branchesQuery.refetch()])
  }

  const responseFrom = salesQuery.data?.from || branchesQuery.data?.from
  const responseTo = salesQuery.data?.to || branchesQuery.data?.to

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: t("analytics.title") }]}
      />

      <header className="mt-6 flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-primary">
            {t("analytics.eyebrow")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {t("analytics.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("analytics.description")}
          </p>
        </div>
        {isRefreshing && !isLoading ? (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <HugeiconsIcon
              icon={RefreshIcon}
              className="size-4! animate-spin"
            />
            {t("analytics.updating")}
          </span>
        ) : null}
      </header>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("analytics.filters.title")}</CardTitle>
          <CardDescription>
            {t("analytics.filters.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={applyFilters}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1.3fr_auto] xl:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="analytics-from">
                {t("analytics.filters.from")}
              </Label>
              <Input
                id="analytics-from"
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="analytics-to">{t("analytics.filters.to")}</Label>
              <Input
                id="analytics-to"
                type="date"
                value={filters.to}
                min={filters.from || undefined}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    to: event.target.value,
                  }))
                }
              />
            </div>
            {isSuperAdmin ? (
              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <Label>{t("analytics.filters.organization")}</Label>
                <Select
                  value={filters.organizationId || ALL_ORGANIZATIONS}
                  onValueChange={(value) =>
                    setFilters((current) => ({
                      ...current,
                      organizationId: value === ALL_ORGANIZATIONS ? "" : value,
                    }))
                  }
                  disabled={organizationsQuery.isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_ORGANIZATIONS}>
                      {t("analytics.filters.allOrganizations")}
                    </SelectItem>
                    {organizationsQuery.data?.map((organization) =>
                      organization.id === undefined ? null : (
                        <SelectItem
                          key={organization.id}
                          value={String(organization.id)}
                        >
                          {organization.name || `#${organization.id}`}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
              <Button type="submit">{t("analytics.filters.apply")}</Button>
              <Button type="button" variant="outline" onClick={resetFilters}>
                {t("analytics.filters.reset")}
              </Button>
            </div>
          </form>
          {validationError ? (
            <p className="mt-3 text-sm text-destructive">{validationError}</p>
          ) : null}
          <p className="mt-4 text-xs text-muted-foreground">
            {t("analytics.deliveredOnly")}
          </p>
        </CardContent>
      </Card>

      {hasError ? (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          <p>{t("analytics.loadFailed")}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={retry}>
            {t("analytics.retry")}
          </Button>
        </div>
      ) : isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics.period", {
                period: formatDateRange(
                  responseFrom || appliedFilters.from,
                  responseTo || appliedFilters.to,
                  language
                ),
              })}
            </p>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={Money03Icon}
              metric={salesQuery.data?.revenue}
              title={t("analytics.metrics.revenue")}
              valueFormatter={(value) => formatCurrency(value, language)}
            />
            <MetricCard
              icon={ShoppingCart02Icon}
              metric={salesQuery.data?.orders}
              title={t("analytics.metrics.orders")}
              valueFormatter={(value) => formatNumber(value, language)}
            />
            <MetricCard
              icon={CalculatorIcon}
              metric={salesQuery.data?.averageCheck}
              title={t("analytics.metrics.averageCheck")}
              valueFormatter={(value) => formatCurrency(value, language)}
            />
          </section>

          <SalesChart
            dailySales={salesQuery.data?.dailySales ?? []}
            language={language}
          />

          <BranchesTable
            branches={branchesQuery.data?.branches ?? []}
            language={language}
          />
        </div>
      )}
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
  const change = metric?.changePercent as number | null | undefined
  const positive = typeof change === "number" && change > 0
  const negative = typeof change === "number" && change < 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
        <CardAction>
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={icon} className="size-5!" />
          </span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight sm:text-3xl">
          {valueFormatter(metric?.value ?? 0)}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-1 font-semibold text-muted-foreground",
              positive && "text-emerald-600 dark:text-emerald-400",
              negative && "text-destructive"
            )}
          >
            {positive || negative ? (
              <HugeiconsIcon
                icon={positive ? AnalyticsUpIcon : AnalyticsDownIcon}
                className="size-4!"
              />
            ) : null}
            {typeof change === "number"
              ? `${change > 0 ? "+" : ""}${formatPercent(change)}%`
              : "—"}
          </span>
          <span className="text-muted-foreground">
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

function SalesChart({
  dailySales,
  language,
}: {
  dailySales: Array<{ date?: string; orders?: number; revenue?: number }>
  language: string
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analytics.chart.title")}</CardTitle>
        <CardDescription>{t("analytics.chart.description")}</CardDescription>
        <CardAction>
          <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
            <ChartLegend
              color="var(--chart-1)"
              label={t("analytics.chart.revenue")}
            />
            <ChartLegend
              color="var(--chart-2)"
              label={t("analytics.chart.orders")}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {dailySales.length ? (
          <div className="h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dailySales}
                margin={{ left: 0, right: 0, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="analyticsRevenue"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={28}
                  tickFormatter={(value) =>
                    formatChartDate(String(value), language)
                  }
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="revenue"
                  axisLine={false}
                  tickLine={false}
                  width={72}
                  tickFormatter={(value) =>
                    formatCompactNumber(Number(value), language)
                  }
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={32}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.75rem",
                    color: "var(--popover-foreground)",
                  }}
                  labelFormatter={(label) =>
                    formatLongDate(String(label), language)
                  }
                  formatter={(value, name) => [
                    name === "revenue"
                      ? formatCurrency(Number(value), language)
                      : formatNumber(Number(value), language),
                    name === "revenue"
                      ? t("analytics.chart.revenue")
                      : t("analytics.chart.orders"),
                  ]}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#analyticsRevenue)"
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="grid h-48 place-items-center text-sm text-muted-foreground">
            {t("analytics.chart.empty")}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ChartLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="size-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  )
}

function BranchesTable({
  branches,
  language,
}: {
  branches: Branch[]
  language: string
}) {
  const { t } = useTranslation()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("analytics.branches.title")}</CardTitle>
        <CardDescription>{t("analytics.branches.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[68rem] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.branches.branch")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.branches.score")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.metrics.revenue")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.metrics.orders")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.metrics.averageCheck")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.branches.rating")}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {t("analytics.branches.breakdown")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {branches.length ? (
                  branches.map((branch, index) => (
                    <BranchRow
                      key={branch.branchId ?? `${branch.branchName}-${index}`}
                      branch={branch}
                      language={language}
                      rank={index + 1}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="h-28 px-4 text-center text-muted-foreground"
                    >
                      {t("analytics.branches.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BranchRow({
  branch,
  language,
  rank,
}: {
  branch: Branch
  language: string
  rank: number
}) {
  const { t } = useTranslation()
  const score = clampScore(branch.score)
  const breakdown = [
    [
      t("analytics.branches.revenuePoints"),
      branch.scoreBreakdown?.revenuePoints,
    ],
    [
      t("analytics.branches.averageCheckPoints"),
      branch.scoreBreakdown?.averageCheckPoints,
    ],
    [t("analytics.branches.ordersPoints"), branch.scoreBreakdown?.ordersPoints],
    [t("analytics.branches.ratingPoints"), branch.scoreBreakdown?.ratingPoints],
  ] as const

  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-4 py-4 font-semibold text-muted-foreground">{rank}</td>
      <td className="px-4 py-4 font-semibold">
        {branch.branchName || `#${branch.branchId ?? "—"}`}
      </td>
      <td className="px-4 py-4">
        <div className="flex min-w-36 items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="w-8 text-right font-bold tabular-nums">{score}</span>
        </div>
      </td>
      <td className="px-4 py-4 font-medium tabular-nums">
        {formatCurrency(branch.revenue ?? 0, language)}
      </td>
      <td className="px-4 py-4 tabular-nums">
        {formatNumber(branch.orders ?? 0, language)}
      </td>
      <td className="px-4 py-4 tabular-nums">
        {formatCurrency(branch.averageCheck ?? 0, language)}
      </td>
      <td className="px-4 py-4">
        <span className="inline-flex items-center gap-1 font-medium tabular-nums">
          <HugeiconsIcon icon={StarIcon} className="size-4! text-amber-500" />
          {formatDecimal(branch.averageRating ?? 0, language)}
        </span>
      </td>
      <td className="px-4 py-4">
        <div className="grid min-w-60 grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          {breakdown.map(([label, value]) => (
            <span
              key={label}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-muted-foreground">{label}</span>
              <strong className="tabular-nums">{value ?? 0}</strong>
            </span>
          ))}
        </div>
      </td>
    </tr>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="mt-6 space-y-6" aria-hidden="true">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-40 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  )
}

function formatCurrency(value: number, language: string) {
  return `${formatNumber(value, language)} ${language === "uz" ? "so'm" : "сум"}`
}

function formatNumber(value: number, language: string) {
  return new Intl.NumberFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDecimal(value: number, language: string) {
  return new Intl.NumberFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(
    value
  )
}

function formatCompactNumber(value: number, language: string) {
  return new Intl.NumberFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatChartDate(value: string, language: string) {
  const date = parseDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(date)
}

function formatLongDate(value: string, language: string) {
  const date = parseDate(value)
  if (!date) return value

  return new Intl.DateTimeFormat(language === "uz" ? "uz-UZ" : "ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatDateRange(from: string, to: string, language: string) {
  if (!from || !to) return "—"
  return `${formatLongDate(from, language)} — ${formatLongDate(to, language)}`
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function clampScore(value?: number) {
  return Math.min(100, Math.max(0, Math.round(value ?? 0)))
}
