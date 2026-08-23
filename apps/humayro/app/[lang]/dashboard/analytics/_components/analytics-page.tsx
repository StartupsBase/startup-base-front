"use client"

import {
  ChartAnalysisIcon,
  InformationCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import type { UserDTO } from "@/lib/api"
import {
  useBranches,
  useSales,
} from "@/lib/api/generated/admin-analytics/admin-analytics"
import { useGetAll7 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import { AnalyticsFiltersCard } from "./analytics-filters"
import { formatDateRange } from "./analytics-formatters"
import { AnalyticsOverview } from "./analytics-overview"
import { BranchPerformance } from "./branch-performance"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"

export type AnalyticsFilters = {
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
  const defaultFilters = useMemo<AnalyticsFilters>(
    () => ({ from: defaultFrom, organizationId: "", to: defaultTo }),
    [defaultFrom, defaultTo]
  )
  const [filters, setFilters] = useState(defaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters)
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
    query: { placeholderData: (previous) => previous, retry: false },
  })
  const branchesQuery = useBranches(params, {
    query: { placeholderData: (previous) => previous, retry: false },
  })
  const hasError = salesQuery.isError || branchesQuery.isError
  const isLoading = salesQuery.isLoading || branchesQuery.isLoading
  const isRefreshing = salesQuery.isFetching || branchesQuery.isFetching
  const responseFrom = salesQuery.data?.from || branchesQuery.data?.from
  const responseTo = salesQuery.data?.to || branchesQuery.data?.to
  const displayedPeriod = formatDateRange(
    responseFrom || appliedFilters.from,
    responseTo || appliedFilters.to,
    language
  )

  function applyFilters() {
    if (filters.from && filters.to && filters.from > filters.to) {
      setValidationError(t("analytics.invalidPeriod"))
      return
    }

    setValidationError("")
    setAppliedFilters(filters)
  }

  function resetFilters() {
    setValidationError("")
    setFilters(defaultFilters)
    setAppliedFilters(defaultFilters)
  }

  function retry() {
    void Promise.all([salesQuery.refetch(), branchesQuery.refetch()])
  }

  return (
    <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: t("analytics.title") }]}
      />

      <header className="relative mt-6 overflow-hidden rounded-3xl border bg-card px-5 py-6 shadow-sm sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_42%)]" />
        <div className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full border border-primary/10" />
        <div className="pointer-events-none absolute -top-5 -right-28 size-52 rounded-full border border-primary/10" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-4 gap-1.5 text-primary">
              <HugeiconsIcon icon={ChartAnalysisIcon} className="size-3.5!" />
              {t("analytics.eyebrow")}
            </Badge>
            <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("analytics.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {t("analytics.description")}
            </p>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-2xl border bg-background/75 p-3.5 shadow-xs backdrop-blur-sm lg:max-w-md">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={ChartAnalysisIcon} className="size-5!" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                {t("analytics.currentPeriod")}
              </p>
              <p className="mt-0.5 truncate text-sm font-semibold">
                {displayedPeriod}
              </p>
            </div>
            {isRefreshing && !isLoading ? (
              <HugeiconsIcon
                icon={RefreshIcon}
                className="ml-auto size-4! shrink-0 animate-spin text-muted-foreground"
                aria-label={t("analytics.updating")}
              />
            ) : null}
          </div>
        </div>
      </header>

      <AnalyticsFiltersCard
        appliedFilters={appliedFilters}
        filters={filters}
        isOrganizationLoading={organizationsQuery.isLoading}
        isRefreshing={isRefreshing && !isLoading}
        isSuperAdmin={isSuperAdmin}
        language={language}
        organizations={organizationsQuery.data ?? []}
        validationError={validationError}
        onApply={applyFilters}
        onChange={(nextFilters) => {
          setValidationError("")
          setFilters(nextFilters)
        }}
        onReset={resetFilters}
      />

      {hasError ? (
        <Alert variant="destructive" className="mt-6">
          <HugeiconsIcon icon={InformationCircleIcon} />
          <AlertTitle>{t("analytics.loadFailedTitle")}</AlertTitle>
          <AlertDescription>
            <p>{t("analytics.loadFailed")}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={retry}
            >
              <HugeiconsIcon icon={RefreshIcon} className="size-4!" />
              {t("analytics.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : isLoading ? (
        <AnalyticsSkeleton />
      ) : (
        <div className="mt-6 space-y-6" aria-live="polite">
          <AnalyticsOverview
            averageCheck={salesQuery.data?.averageCheck}
            branches={branchesQuery.data?.branches ?? []}
            dailySales={salesQuery.data?.dailySales ?? []}
            language={language}
            orders={salesQuery.data?.orders}
            revenue={salesQuery.data?.revenue}
          />
          <BranchPerformance
            branches={branchesQuery.data?.branches ?? []}
            language={language}
          />
        </div>
      )}
    </main>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="mt-6 space-y-6" aria-label="Loading" aria-busy="true">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="space-y-5 rounded-2xl border bg-card p-6">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="size-10" />
            </div>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ))}
      </div>
      <div className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-48" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  )
}
