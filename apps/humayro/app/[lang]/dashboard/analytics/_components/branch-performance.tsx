import {
  ChampionIcon,
  Search01Icon,
  StarIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { Branch } from "@/lib/api"
import {
  clampScore,
  formatCurrency,
  formatDecimal,
  formatNumber,
} from "./analytics-formatters"
import { Badge } from "@workspace/ui/components/badge"
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
import { Progress } from "@workspace/ui/components/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"

type BranchSort = "orders" | "rating" | "revenue" | "score"

export function BranchPerformance({
  branches,
  language,
}: {
  branches: Branch[]
  language: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<BranchSort>("score")
  const visibleBranches = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return branches
      .filter((branch) =>
        (branch.branchName ?? `#${branch.branchId ?? ""}`)
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      )
      .sort(
        (left, right) => getSortValue(right, sort) - getSortValue(left, sort)
      )
  }, [branches, query, sort])

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border/70">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2 text-primary">
          <HugeiconsIcon icon={ChampionIcon} className="size-4!" />
          <span className="text-xs font-semibold tracking-wide uppercase">
            {t("analytics.branches.eyebrow")}
          </span>
        </div>
        <CardTitle className="text-lg">
          {t("analytics.branches.title")}
        </CardTitle>
        <CardDescription className="max-w-3xl">
          {t("analytics.branches.description")}
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">
            {t("analytics.branches.count", { count: branches.length })}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        {branches.length ? (
          <>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-sm">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="absolute top-1/2 left-3.5 size-4! -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("analytics.branches.search")}
                  aria-label={t("analytics.branches.search")}
                  className="h-10 rounded-xl bg-muted/30 pl-10"
                />
              </div>
              <Select
                value={sort}
                onValueChange={(value) => setSort(value as BranchSort)}
              >
                <SelectTrigger
                  aria-label={t("analytics.branches.sortBy")}
                  className="h-10 w-full rounded-xl sm:w-56"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="score">
                    {t("analytics.branches.sortScore")}
                  </SelectItem>
                  <SelectItem value="revenue">
                    {t("analytics.branches.sortRevenue")}
                  </SelectItem>
                  <SelectItem value="orders">
                    {t("analytics.branches.sortOrders")}
                  </SelectItem>
                  <SelectItem value="rating">
                    {t("analytics.branches.sortRating")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {visibleBranches.length ? (
              <>
                <div className="hidden overflow-hidden rounded-2xl border md:block">
                  <Table className="min-w-[70rem]">
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-16 text-center">#</TableHead>
                        <TableHead>{t("analytics.branches.branch")}</TableHead>
                        <TableHead className="min-w-44">
                          {t("analytics.branches.score")}
                        </TableHead>
                        <TableHead>{t("analytics.metrics.revenue")}</TableHead>
                        <TableHead>{t("analytics.metrics.orders")}</TableHead>
                        <TableHead>
                          {t("analytics.metrics.averageCheck")}
                        </TableHead>
                        <TableHead>{t("analytics.branches.rating")}</TableHead>
                        <TableHead className="min-w-64">
                          {t("analytics.branches.breakdown")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleBranches.map((branch, index) => (
                        <BranchTableRow
                          key={getBranchKey(branch, index)}
                          branch={branch}
                          language={language}
                          rank={index + 1}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="grid gap-3 md:hidden">
                  {visibleBranches.map((branch, index) => (
                    <BranchMobileCard
                      key={getBranchKey(branch, index)}
                      branch={branch}
                      language={language}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </>
            ) : (
              <EmptyBranches
                title={t("analytics.branches.noResults")}
                description={t("analytics.branches.noResultsHint")}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuery("")}
                  >
                    {t("analytics.branches.clearSearch")}
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <EmptyBranches
            title={t("analytics.branches.empty")}
            description={t("analytics.branches.emptyHint")}
          />
        )}
      </CardContent>
    </Card>
  )
}

function BranchTableRow({
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

  return (
    <TableRow>
      <TableCell className="text-center">
        <RankBadge rank={rank} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Store01Icon} className="size-4!" />
          </span>
          <span className="font-medium">
            {branch.branchName || `#${branch.branchId ?? "—"}`}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Score value={score} />
      </TableCell>
      <TableCell className="font-medium tabular-nums">
        {formatCurrency(branch.revenue ?? 0, language)}
      </TableCell>
      <TableCell className="tabular-nums">
        {formatNumber(branch.orders ?? 0, language)}
      </TableCell>
      <TableCell className="tabular-nums">
        {formatCurrency(branch.averageCheck ?? 0, language)}
      </TableCell>
      <TableCell>
        <Rating value={branch.averageRating} language={language} />
      </TableCell>
      <TableCell>
        <ScoreBreakdown
          branch={branch}
          labels={{
            revenue: t("analytics.branches.revenuePoints"),
            averageCheck: t("analytics.branches.averageCheckPoints"),
            orders: t("analytics.branches.ordersPoints"),
            rating: t("analytics.branches.ratingPoints"),
          }}
        />
      </TableCell>
    </TableRow>
  )
}

function BranchMobileCard({
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

  return (
    <article className="rounded-2xl border bg-muted/15 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={Store01Icon} className="size-5!" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {branch.branchName || `#${branch.branchId ?? "—"}`}
            </p>
            <div className="mt-1">
              <Rating value={branch.averageRating} language={language} />
            </div>
          </div>
        </div>
        <RankBadge rank={rank} />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t("analytics.branches.score")}
          </span>
          <span className="font-semibold tabular-nums">{score}/100</span>
        </div>
        <Progress value={score} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-y py-4 text-sm">
        <MobileMetric
          label={t("analytics.metrics.revenue")}
          value={formatCurrency(branch.revenue ?? 0, language)}
        />
        <MobileMetric
          label={t("analytics.metrics.orders")}
          value={formatNumber(branch.orders ?? 0, language)}
        />
        <MobileMetric
          label={t("analytics.metrics.averageCheck")}
          value={formatCurrency(branch.averageCheck ?? 0, language)}
        />
        <MobileMetric
          label={t("analytics.branches.rating")}
          value={formatDecimal(branch.averageRating ?? 0, language)}
        />
      </dl>

      <div className="mt-4">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {t("analytics.branches.breakdown")}
        </p>
        <ScoreBreakdown
          branch={branch}
          labels={{
            revenue: t("analytics.branches.revenuePoints"),
            averageCheck: t("analytics.branches.averageCheckPoints"),
            orders: t("analytics.branches.ordersPoints"),
            rating: t("analytics.branches.ratingPoints"),
          }}
        />
      </div>
    </article>
  )
}

function Score({ value }: { value: number }) {
  return (
    <div className="flex min-w-40 items-center gap-3">
      <Progress value={value} />
      <span className="w-8 text-right font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function Rating({ value, language }: { value?: number; language: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-medium tabular-nums">
      <HugeiconsIcon icon={StarIcon} className="size-4! text-amber-500" />
      {formatDecimal(value ?? 0, language)}
    </span>
  )
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <Badge
      variant={rank <= 3 ? "secondary" : "outline"}
      className={cn(
        "min-w-7 justify-center px-2 tabular-nums",
        rank === 1 && "bg-amber-500/12 text-amber-700 dark:text-amber-400"
      )}
    >
      {rank}
    </Badge>
  )
}

function ScoreBreakdown({
  branch,
  labels,
}: {
  branch: Branch
  labels: {
    averageCheck: string
    orders: string
    rating: string
    revenue: string
  }
}) {
  const values = [
    [labels.revenue, branch.scoreBreakdown?.revenuePoints],
    [labels.averageCheck, branch.scoreBreakdown?.averageCheckPoints],
    [labels.orders, branch.scoreBreakdown?.ordersPoints],
    [labels.rating, branch.scoreBreakdown?.ratingPoints],
  ] as const

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
      {values.map(([label, value]) => (
        <span key={label} className="flex items-center justify-between gap-2">
          <span className="truncate text-muted-foreground">{label}</span>
          <strong className="tabular-nums">{value ?? 0}</strong>
        </span>
      ))}
    </div>
  )
}

function MobileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 truncate font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function EmptyBranches({
  action,
  description,
  title,
}: {
  action?: React.ReactNode
  description: string
  title: string
}) {
  return (
    <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <HugeiconsIcon icon={Store01Icon} className="size-6!" />
        </span>
        <p className="mt-4 font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  )
}

function getSortValue(branch: Branch, sort: BranchSort) {
  if (sort === "orders") return branch.orders ?? 0
  if (sort === "rating") return branch.averageRating ?? 0
  if (sort === "revenue") return branch.revenue ?? 0
  return branch.score ?? 0
}

function getBranchKey(branch: Branch, index: number) {
  return branch.branchId ?? `${branch.branchName}-${index}`
}
