import { FilterIcon, RefreshIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslation } from "react-i18next"

import type { AnalyticsFilters } from "./analytics-page"
import {
  formatPickerRange,
  parseInputDate,
  toInputDate,
} from "./analytics-formatters"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  datePickerRuLocale,
  datePickerUzLocale,
  DateRangePicker,
  type DateRange,
} from "@workspace/ui/components/date-picker"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"

const ALL_ORGANIZATIONS = "__all_organizations__"

type OrganizationOption = {
  id?: number
  name?: string
}

export function AnalyticsFiltersCard({
  appliedFilters,
  filters,
  isOrganizationLoading,
  isRefreshing,
  isSuperAdmin,
  language,
  organizations,
  validationError,
  onApply,
  onChange,
  onReset,
}: {
  appliedFilters: AnalyticsFilters
  filters: AnalyticsFilters
  isOrganizationLoading: boolean
  isRefreshing: boolean
  isSuperAdmin: boolean
  language: string
  organizations: OrganizationOption[]
  validationError: string
  onApply: () => void
  onChange: (filters: AnalyticsFilters) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const dateRange = {
    from: parseInputDate(filters.from),
    to: parseInputDate(filters.to),
  }
  const hasChanges =
    filters.from !== appliedFilters.from ||
    filters.to !== appliedFilters.to ||
    filters.organizationId !== appliedFilters.organizationId

  function updateRange(range?: DateRange) {
    onChange({
      ...filters,
      from: toInputDate(range?.from),
      to: toInputDate(range?.to),
    })
  }

  function selectPreset(days: number) {
    const to = parseInputDate(filters.to) ?? new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - (days - 1))
    updateRange({ from, to })
  }

  return (
    <Card className="mt-6 border-0 bg-card/85 shadow-sm ring-1 ring-border/70 backdrop-blur-sm">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>{t("analytics.filters.title")}</CardTitle>
            <CardDescription>
              {t("analytics.filters.description")}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            {t("analytics.deliveredOnlyShort")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form
          className="grid gap-5 lg:grid-cols-[minmax(16rem,1.35fr)_minmax(14rem,1fr)_auto] lg:items-start"
          onSubmit={(event) => {
            event.preventDefault()
            onApply()
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="analytics-period">
              {t("analytics.filters.period")}
            </Label>
            <DateRangePicker
              id="analytics-period"
              value={dateRange}
              onValueChange={updateRange}
              formatValue={(range) => formatPickerRange(range, language)}
              locale={
                language === "uz" ? datePickerUzLocale : datePickerRuLocale
              }
              placeholder={t("analytics.filters.selectPeriod")}
              todayLabel={t("analytics.filters.today")}
              clearable={false}
              required
              className="h-11 w-full justify-start rounded-xl bg-background px-3.5"
              aria-invalid={Boolean(validationError)}
              aria-describedby={
                validationError ? "analytics-period-error" : undefined
              }
              calendarProps={{
                captionLayout: "dropdown-years",
                disabled: { after: new Date() },
              }}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  type="button"
                  size="xs"
                  variant="ghost"
                  className="h-7 rounded-lg px-2.5 text-xs text-muted-foreground"
                  onClick={() => selectPreset(days)}
                >
                  {t("analytics.filters.lastDays", { count: days })}
                </Button>
              ))}
            </div>
          </div>

          {isSuperAdmin ? (
            <div className="space-y-2">
              <Label htmlFor="analytics-organization">
                {t("analytics.filters.organization")}
              </Label>
              <Select
                empty={
                  !organizations.some(
                    (organization) => organization.id !== undefined
                  )
                }
                noOptions={t("select.noOrganizations")}
                value={filters.organizationId || ALL_ORGANIZATIONS}
                onValueChange={(value) =>
                  onChange({
                    ...filters,
                    organizationId: value === ALL_ORGANIZATIONS ? "" : value,
                  })
                }
                disabled={isOrganizationLoading}
              >
                <SelectTrigger
                  id="analytics-organization"
                  className="h-11 w-full rounded-xl bg-background"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ORGANIZATIONS}>
                    {t("analytics.filters.allOrganizations")}
                  </SelectItem>
                  {organizations.map((organization) =>
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
              <p className="text-xs text-muted-foreground">
                {t("analytics.filters.organizationHint")}
              </p>
            </div>
          ) : (
            <div className="hidden lg:block" />
          )}

          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end lg:pt-6">
            <Button
              type="submit"
              size="lg"
              className="rounded-xl"
              disabled={!filters.from || !filters.to || !hasChanges}
            >
              <HugeiconsIcon icon={FilterIcon} className="size-4!" />
              {t("analytics.filters.apply")}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="rounded-xl"
              onClick={onReset}
            >
              {t("analytics.filters.reset")}
            </Button>
          </div>
        </form>

        {validationError ? (
          <p
            id="analytics-period-error"
            className="mt-3 text-sm font-medium text-destructive"
          >
            {validationError}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="justify-between gap-3 border-t bg-muted/20 text-xs text-muted-foreground">
        <p>{t("analytics.deliveredOnly")}</p>
        <span
          aria-live="polite"
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity",
            isRefreshing && "opacity-100"
          )}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-3.5!", isRefreshing && "animate-spin")}
          />
          {t("analytics.updating")}
        </span>
      </CardFooter>
    </Card>
  )
}
