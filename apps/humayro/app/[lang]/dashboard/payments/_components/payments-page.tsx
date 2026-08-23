"use client"

import {
  CheckmarkCircle02Icon,
  CreditCardIcon,
  Download04Icon,
  EyeIcon,
  EyeOffIcon,
  MoneyReceiveCircleIcon,
  RefreshIcon,
  TestTube01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Input } from "@/components/input"
import type { Language } from "@/i18n/config"
import type { UserDTO } from "@/lib/api"
import { useGetAll7 as useOrganizations } from "@/lib/api/generated/admin-organization/admin-organization"
import {
  getPaymentSettings,
  getPaymentTransactions,
  paymentQueryKeys,
  refundPaymentTransaction,
  testPaymentProvider,
  updatePaymentSettings,
  type PaymentProvider,
  type PaymentProviderSettings,
  type PaymentSettings,
  type PaymentTransaction,
  type PaymentTransactionStatus,
} from "@/lib/payment-api"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { cn } from "@workspace/ui/lib/utils"

import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"

const transactionStatuses: PaymentTransactionStatus[] = [
  "PAID",
  "PENDING",
  "FAILED",
  "CANCELLED",
  "REFUNDED",
]

export function PaymentsPage({
  initialUser,
  language,
}: {
  initialUser: UserDTO
  language: Language
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const isSuperAdmin = initialUser.roles?.includes("ROLE_SUPER_ADMIN") ?? false
  const organizationsQuery = useOrganizations(undefined, {
    query: { enabled: isSuperAdmin, retry: false },
  })
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    number | undefined
  >(isSuperAdmin ? undefined : initialUser.organizationId)
  const organizationId = isSuperAdmin
    ? (selectedOrganizationId ?? organizationsQuery.data?.[0]?.id)
    : initialUser.organizationId
  const [settingsDraft, setSettings] = useState<PaymentSettings | null>(null)
  const [showSecrets, setShowSecrets] = useState<
    Partial<Record<PaymentProvider, boolean>>
  >({})
  const [search, setSearch] = useState("")
  const [providerFilter, setProviderFilter] = useState<
    PaymentProvider | undefined
  >()
  const [statusFilter, setStatusFilter] = useState<
    PaymentTransactionStatus | undefined
  >()
  const [page, setPage] = useState(FIRST_PAGE)
  const [refundTarget, setRefundTarget] = useState<PaymentTransaction | null>(
    null
  )

  const settingsQuery = useQuery({
    queryKey: organizationId
      ? paymentQueryKeys.settings(organizationId)
      : ["payment-settings", "disabled"],
    queryFn: () => getPaymentSettings(organizationId!),
    enabled: organizationId != null,
    retry: false,
  })

  const settings =
    organizationId == null
      ? null
      : settingsDraft?.organizationId === organizationId
        ? settingsDraft
        : settingsQuery.data
          ? normalizeSettings(settingsQuery.data)
          : createEmptySettings(organizationId)

  const transactionFilters = useMemo(
    () => ({
      page: toApiPage(page),
      provider: providerFilter,
      search: search.trim() || undefined,
      size: 20,
      status: statusFilter,
    }),
    [page, providerFilter, search, statusFilter]
  )
  const transactionsQuery = useQuery({
    queryKey: organizationId
      ? paymentQueryKeys.transactions(organizationId, transactionFilters)
      : ["payment-transactions", "disabled"],
    queryFn: () => getPaymentTransactions(organizationId!, transactionFilters),
    enabled: organizationId != null,
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: updatePaymentSettings,
    onSuccess: async (saved) => {
      setSettings(normalizeSettings(saved))
      await queryClient.invalidateQueries({
        queryKey: paymentQueryKeys.settings(saved.organizationId),
      })
      toast.success(t("payments.saved"))
    },
    onError: () => toast.error(t("payments.saveFailed")),
  })
  const testMutation = useMutation({
    mutationFn: ({
      organizationId: targetOrganizationId,
      provider,
    }: {
      organizationId: number
      provider: PaymentProviderSettings
    }) => testPaymentProvider(targetOrganizationId, provider),
    onSuccess: (result) =>
      result.success
        ? toast.success(t("payments.testSuccess"))
        : toast.error(result.message || t("payments.testFailed")),
    onError: () => toast.error(t("payments.testFailed")),
  })
  const refundMutation = useMutation({
    mutationFn: ({
      organizationId: targetOrganizationId,
      transactionId,
    }: {
      organizationId: number
      transactionId: number | string
    }) => refundPaymentTransaction(targetOrganizationId, transactionId),
    onSuccess: async () => {
      setRefundTarget(null)
      await queryClient.invalidateQueries({
        queryKey: ["payment-transactions", organizationId],
      })
      toast.success(t("payments.refundSuccess"))
    },
    onError: () => toast.error(t("payments.refundFailed")),
  })

  const transactions = transactionsQuery.data?.content ?? []
  const paidOnPage = transactions
    .filter((transaction) => transaction.status === "PAID")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
  const failedOnPage = transactions.filter(
    (transaction) => transaction.status === "FAILED"
  ).length

  function updateProvider(
    provider: PaymentProvider,
    patch: Partial<PaymentProviderSettings>
  ) {
    if (!settings) return
    setSettings({
      ...settings,
      providers: settings.providers.map((item) =>
        item.provider === provider ? { ...item, ...patch } : item
      ),
    })
  }

  function saveSettings() {
    if (!settings) return
    const invalidProvider = settings.providers.find(
      (provider) =>
        provider.enabled &&
        (!provider.merchantId.trim() ||
          !provider.checkoutUrl.trim() ||
          !provider.secretKey?.trim())
    )

    if (invalidProvider) {
      toast.error(
        t("payments.providerIncomplete", {
          provider: providerName(invalidProvider.provider),
        })
      )
      return
    }

    saveMutation.mutate(settings)
  }

  function runProviderTest(provider: PaymentProviderSettings) {
    if (organizationId == null) return
    testMutation.mutate({ organizationId, provider })
  }

  function downloadCsv() {
    if (!transactions.length) return
    const rows = transactions.map((transaction) => [
      transaction.id,
      transaction.externalId ?? "",
      transaction.type ?? "PAYMENT",
      transaction.amount,
      transaction.currency ?? "UZS",
      transaction.provider,
      transaction.status,
      transaction.description ?? "",
      transaction.createdAt,
    ])
    const csv = [
      [
        "ID",
        "External ID",
        "Type",
        "Amount",
        "Currency",
        "Provider",
        "Status",
        "Description",
        "Created",
      ],
      ...rows,
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n")
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `payments-${organizationId}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: t("payments.title") }]}
      />

      <header className="mt-6 flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            {t("payments.eyebrow")}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {t("payments.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("payments.description")}
          </p>
        </div>
        {isSuperAdmin ? (
          <div className="w-full lg:w-80">
            <Label htmlFor="payment-organization" className="mb-2 block">
              {t("payments.organization")}
            </Label>
            <Select
              value={organizationId?.toString()}
              onValueChange={(value) => {
                setSelectedOrganizationId(Number(value))
                setPage(FIRST_PAGE)
              }}
            >
              <SelectTrigger id="payment-organization" className="h-11 w-full">
                <SelectValue placeholder={t("payments.selectOrganization")} />
              </SelectTrigger>
              <SelectContent>
                {organizationsQuery.data?.map((organization) =>
                  organization.id == null ? null : (
                    <SelectItem
                      key={organization.id}
                      value={organization.id.toString()}
                    >
                      {organization.name || `#${organization.id}`}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        ) : null}
      </header>

      {!organizationId ? (
        <Card className="mt-8 border-dashed bg-muted/20 py-14 text-center">
          <CardContent>
            <h2 className="text-lg font-bold">
              {t("payments.noOrganization")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t("payments.noOrganizationDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={MoneyReceiveCircleIcon}
              label={t("payments.pageRevenue")}
              value={formatMoney(paidOnPage, language)}
              tone="success"
            />
            <SummaryCard
              icon={CreditCardIcon}
              label={t("payments.totalTransactions")}
              value={String(transactionsQuery.data?.totalElements ?? 0)}
              tone="primary"
            />
            <SummaryCard
              icon={RefreshIcon}
              label={t("payments.failedOnPage")}
              value={String(failedOnPage)}
              tone="danger"
            />
          </section>

          {settingsQuery.isError ? (
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 sm:flex-row sm:items-center sm:justify-between dark:text-amber-200">
              <p>{t("payments.settingsUnavailable")}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => settingsQuery.refetch()}
              >
                {t("payments.retry")}
              </Button>
            </div>
          ) : null}

          <section className="mt-8" aria-labelledby="payment-settings-title">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="payment-settings-title" className="text-2xl font-bold">
                  {t("payments.settingsTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("payments.settingsDescription")}
                </p>
              </div>
              <Button
                className="w-full sm:w-auto"
                disabled={!settings || saveMutation.isPending}
                onClick={saveSettings}
              >
                {saveMutation.isPending
                  ? t("payments.saving")
                  : t("payments.save")}
              </Button>
            </div>

            {settings ? (
              <div className="mt-5 space-y-5">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("payments.shopUrl")}</CardTitle>
                    <CardDescription>
                      {t("payments.shopUrlHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      type="url"
                      value={settings.shopUrl}
                      placeholder="https://humayro.uz"
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          shopUrl: event.target.value,
                        })
                      }
                    />
                  </CardContent>
                </Card>

                {settings.providers.map((provider) => (
                  <ProviderCard
                    key={provider.provider}
                    provider={provider}
                    secretVisible={showSecrets[provider.provider] ?? false}
                    testing={
                      testMutation.isPending &&
                      testMutation.variables?.provider.provider ===
                        provider.provider
                    }
                    onChange={(patch) =>
                      updateProvider(provider.provider, patch)
                    }
                    onToggleSecret={() =>
                      setShowSecrets((current) => ({
                        ...current,
                        [provider.provider]: !current[provider.provider],
                      }))
                    }
                    onTest={() => runProviderTest(provider)}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 h-96 animate-pulse rounded-2xl bg-muted" />
            )}
          </section>

          <section className="mt-12" aria-labelledby="transactions-title">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 id="transactions-title" className="text-2xl font-bold">
                  {t("payments.transactionsTitle")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("payments.transactionsDescription")}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:flex">
                <Input
                  className="sm:col-span-2 xl:w-64"
                  value={search}
                  placeholder={t("payments.search")}
                  onChange={(event) => {
                    setSearch(event.target.value)
                    setPage(FIRST_PAGE)
                  }}
                />
                <Select
                  value={providerFilter ?? "ALL"}
                  onValueChange={(value) => {
                    setProviderFilter(
                      value === "ALL" ? undefined : (value as PaymentProvider)
                    )
                    setPage(FIRST_PAGE)
                  }}
                >
                  <SelectTrigger className="h-11 w-full xl:w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {t("payments.allProviders")}
                    </SelectItem>
                    <SelectItem value="PAYME">Payme</SelectItem>
                    <SelectItem value="CLICK">Click</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={statusFilter ?? "ALL"}
                  onValueChange={(value) => {
                    setStatusFilter(
                      value === "ALL"
                        ? undefined
                        : (value as PaymentTransactionStatus)
                    )
                    setPage(FIRST_PAGE)
                  }}
                >
                  <SelectTrigger className="h-11 w-full xl:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {t("payments.allStatuses")}
                    </SelectItem>
                    {transactionStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`payments.status.${status}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="h-11"
                  disabled={!transactions.length}
                  onClick={downloadCsv}
                >
                  <HugeiconsIcon icon={Download04Icon} className="size-4" />
                  {t("payments.export")}
                </Button>
              </div>
            </div>

            <Card className="mt-5 gap-0 py-0">
              {transactionsQuery.isError ? (
                <div className="grid min-h-72 place-items-center p-8 text-center">
                  <div>
                    <p className="text-sm text-destructive">
                      {t("payments.transactionsUnavailable")}
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      onClick={() => transactionsQuery.refetch()}
                    >
                      {t("payments.retry")}
                    </Button>
                  </div>
                </div>
              ) : (
                <PaymentTransactionsTable
                  language={language}
                  loading={transactionsQuery.isPending}
                  transactions={transactions}
                  onRefund={setRefundTarget}
                />
              )}
              <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {t("payments.transactionsCount", {
                    count: transactionsQuery.data?.totalElements ?? 0,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page === FIRST_PAGE || transactionsQuery.isFetching}
                    onClick={() =>
                      setPage((current) =>
                        Math.max(current - 1, FIRST_PAGE)
                      )
                    }
                  >
                    {t("dashboard.previous")}
                  </Button>
                  <span className="self-center px-2 text-sm text-muted-foreground">
                    {t("dashboard.page", {
                      page,
                      total: transactionsQuery.data?.totalPages ?? 1,
                    })}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      page >= (transactionsQuery.data?.totalPages ?? 0) ||
                      transactionsQuery.isFetching
                    }
                    onClick={() => setPage((current) => current + 1)}
                  >
                    {t("dashboard.next")}
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        </>
      )}

      {refundTarget ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4"
          role="presentation"
        >
          <Card
            role="dialog"
            aria-modal="true"
            aria-labelledby="refund-title"
            className="w-full max-w-md shadow-2xl"
          >
            <CardHeader>
              <CardTitle id="refund-title">
                {t("payments.refundTitle")}
              </CardTitle>
              <CardDescription>
                {t("payments.refundDescription", {
                  amount: formatMoney(refundTarget.amount, language),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-3">
              <Button
                variant="outline"
                disabled={refundMutation.isPending}
                onClick={() => setRefundTarget(null)}
              >
                {t("payments.cancel")}
              </Button>
              <Button
                variant="destructive"
                disabled={refundMutation.isPending || !organizationId}
                onClick={() =>
                  organizationId &&
                  refundMutation.mutate({
                    organizationId,
                    transactionId: refundTarget.id,
                  })
                }
              >
                {refundMutation.isPending
                  ? t("payments.refunding")
                  : t("payments.refund")}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}

function ProviderCard({
  onChange,
  onTest,
  onToggleSecret,
  provider,
  secretVisible,
  testing,
}: {
  onChange: (patch: Partial<PaymentProviderSettings>) => void
  onTest: () => void
  onToggleSecret: () => void
  provider: PaymentProviderSettings
  secretVisible: boolean
  testing: boolean
}) {
  const { t } = useTranslation()
  const isPayme = provider.provider === "PAYME"

  return (
    <Card className="overflow-visible">
      <CardHeader className="border-b sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid h-11 min-w-28 place-items-center rounded-xl px-4 text-base font-black text-white shadow-sm",
              isPayme
                ? "bg-gradient-to-r from-cyan-500 to-teal-500"
                : "bg-gradient-to-r from-blue-800 to-sky-500"
            )}
          >
            {providerName(provider.provider)}
          </span>
          <div>
            <CardTitle>{t("payments.providerSettings")}</CardTitle>
            <CardDescription>
              {provider.enabled
                ? t("payments.providerEnabled")
                : t("payments.providerDisabled")}
            </CardDescription>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3 sm:mt-0">
          <Label htmlFor={`${provider.provider}-enabled`}>
            {provider.enabled ? t("payments.enabled") : t("payments.disabled")}
          </Label>
          <Switch
            id={`${provider.provider}-enabled`}
            checked={provider.enabled}
            onCheckedChange={(enabled) => onChange({ enabled })}
          />
        </div>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PaymentField
          id={`${provider.provider}-merchant`}
          label={t("payments.merchantId")}
          value={provider.merchantId}
          onChange={(value) => onChange({ merchantId: value })}
        />
        {isPayme ? (
          <PaymentField
            id={`${provider.provider}-login`}
            label={t("payments.login")}
            value={provider.login ?? ""}
            onChange={(value) => onChange({ login: value })}
          />
        ) : (
          <PaymentField
            id={`${provider.provider}-service`}
            label={t("payments.serviceId")}
            value={provider.serviceId ?? ""}
            onChange={(value) => onChange({ serviceId: value })}
          />
        )}
        {!isPayme ? (
          <PaymentField
            id={`${provider.provider}-user`}
            label={t("payments.merchantUserId")}
            value={provider.merchantUserId ?? ""}
            onChange={(value) => onChange({ merchantUserId: value })}
          />
        ) : null}
        <div>
          <Label htmlFor={`${provider.provider}-secret`} className="mb-2 block">
            {t("payments.secretKey")}
          </Label>
          <div className="relative">
            <Input
              id={`${provider.provider}-secret`}
              type={secretVisible ? "text" : "password"}
              autoComplete="new-password"
              value={provider.secretKey ?? ""}
              placeholder="••••••••••••"
              className="pr-11"
              onChange={(event) => onChange({ secretKey: event.target.value })}
            />
            <button
              type="button"
              aria-label={
                secretVisible
                  ? t("payments.hideSecret")
                  : t("payments.showSecret")
              }
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={onToggleSecret}
            >
              <HugeiconsIcon
                icon={secretVisible ? EyeOffIcon : EyeIcon}
                className="size-5"
              />
            </button>
          </div>
        </div>
        <PaymentField
          id={`${provider.provider}-url`}
          label={t("payments.checkoutUrl")}
          type="url"
          value={provider.checkoutUrl}
          className={!isPayme ? "xl:col-span-2" : undefined}
          onChange={(value) => onChange({ checkoutUrl: value })}
        />
      </CardContent>
      <div className="flex flex-col gap-3 border-t px-6 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          {t("payments.testBeforeSave")}
        </p>
        <Button variant="outline" disabled={testing} onClick={onTest}>
          <HugeiconsIcon icon={TestTube01Icon} className="size-4" />
          {testing ? t("payments.testing") : t("payments.test")}
        </Button>
      </div>
    </Card>
  )
}

function PaymentField({
  className,
  id,
  label,
  onChange,
  type = "text",
  value,
}: {
  className?: string
  id: string
  label: string
  onChange: (value: string) => void
  type?: string
  value: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  tone,
  value,
}: {
  icon: typeof CreditCardIcon
  label: string
  tone: "danger" | "primary" | "success"
  value: string
}) {
  return (
    <Card size="sm" className="gap-3">
      <CardContent className="flex items-center gap-4">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl",
            tone === "primary" && "bg-primary/10 text-primary",
            tone === "success" && "bg-emerald-500/10 text-emerald-600",
            tone === "danger" && "bg-destructive/10 text-destructive"
          )}
        >
          <HugeiconsIcon icon={icon} className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function PaymentTransactionsTable({
  language,
  loading,
  onRefund,
  transactions,
}: {
  language: Language
  loading: boolean
  onRefund: (transaction: PaymentTransaction) => void
  transactions: PaymentTransaction[]
}) {
  const { t } = useTranslation()

  if (loading) {
    return <div className="h-72 animate-pulse bg-muted/40" />
  }

  if (!transactions.length) {
    return (
      <div className="grid min-h-72 place-items-center p-8 text-center">
        <div>
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <HugeiconsIcon icon={CreditCardIcon} className="size-7" />
          </span>
          <h3 className="mt-4 font-bold">{t("payments.emptyTransactions")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("payments.emptyTransactionsDescription")}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">{t("payments.type")}</th>
            <th className="px-4 py-3 font-semibold">{t("payments.amount")}</th>
            <th className="px-4 py-3 font-semibold">
              {t("payments.descriptionLabel")}
            </th>
            <th className="px-4 py-3 font-semibold">
              {t("payments.provider")}
            </th>
            <th className="px-4 py-3 font-semibold">
              {t("payments.statusLabel")}
            </th>
            <th className="px-4 py-3 font-semibold">
              {t("payments.createdAt")}
            </th>
            <th className="px-4 py-3 text-right font-semibold">
              {t("payments.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="transition hover:bg-muted/25">
              <td className="px-4 py-4 font-semibold">
                {transaction.type === "REFUND"
                  ? t("payments.refundType")
                  : t("payments.paymentType")}
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {transaction.externalId || `#${transaction.id}`}
                </span>
              </td>
              <td className="px-4 py-4 font-bold">
                {formatMoney(
                  transaction.amount,
                  language,
                  transaction.currency
                )}
              </td>
              <td className="max-w-72 px-4 py-4 text-muted-foreground">
                <span className="line-clamp-2">
                  {transaction.description || "—"}
                </span>
              </td>
              <td className="px-4 py-4">
                {providerName(transaction.provider)}
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={transaction.status} />
              </td>
              <td className="px-4 py-4 text-muted-foreground">
                {formatDate(transaction.createdAt, language)}
              </td>
              <td className="px-4 py-4 text-right">
                {transaction.status === "PAID" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRefund(transaction)}
                  >
                    {t("payments.refund")}
                  </Button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: PaymentTransactionStatus }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold",
        status === "PAID" &&
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "PENDING" &&
          "bg-amber-500/10 text-amber-700 dark:text-amber-300",
        status === "FAILED" && "bg-destructive/10 text-destructive",
        status === "CANCELLED" && "bg-muted text-muted-foreground",
        status === "REFUNDED" &&
          "bg-blue-500/10 text-blue-700 dark:text-blue-300"
      )}
    >
      {status === "PAID" ? (
        <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
      ) : null}
      {t(`payments.status.${status}`)}
    </span>
  )
}

function createEmptySettings(organizationId: number): PaymentSettings {
  return {
    organizationId,
    shopUrl: "",
    providers: [
      {
        provider: "PAYME",
        enabled: false,
        merchantId: "",
        login: "",
        secretKey: "",
        checkoutUrl: "https://checkout.paycom.uz",
      },
      {
        provider: "CLICK",
        enabled: false,
        merchantId: "",
        serviceId: "",
        merchantUserId: "",
        secretKey: "",
        checkoutUrl: "https://my.click.uz/services/pay",
      },
    ],
  }
}

function normalizeSettings(settings: PaymentSettings): PaymentSettings {
  const empty = createEmptySettings(settings.organizationId)
  return {
    ...empty,
    ...settings,
    providers: empty.providers.map((fallback) => ({
      ...fallback,
      ...settings.providers.find((item) => item.provider === fallback.provider),
    })),
  }
}

function providerName(provider: PaymentProvider) {
  return provider === "PAYME" ? "Payme" : "Click"
}

function formatMoney(amount: number, language: Language, currency = "UZS") {
  return new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "UZS" ? 0 : 2,
  }).format(Number(amount || 0))
}

function formatDate(value: string, language: Language) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

function csvCell(value: unknown) {
  const text = String(value ?? "")
  return `"${text.replaceAll('"', '""')}"`
}
