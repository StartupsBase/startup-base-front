"use client"

import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"

import type { Language } from "@/i18n/config"
import {
  getMyOrdersQueryKey,
  useCancel1,
  useMyOrders,
} from "@/lib/api/generated/order/order"
import type { OrderDTO } from "@/lib/api/model/orderDTO"
import { formatStorefrontPrice, getLoginHref } from "@/lib/storefront"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { EmptyState } from "../../_components/storefront/empty-state"

const ORDERS_PAGE_SIZE = 10

export function OrdersView({ language }: { language: Language }) {
  const text = useStorefrontCopy()
  const hasToken = useHasAuthToken()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(FIRST_PAGE)
  const ordersQuery = useMyOrders(
    { page: toApiPage(page), size: ORDERS_PAGE_SIZE },
    { query: { enabled: hasToken, retry: false } }
  )
  const cancelMutation = useCancel1({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() })
        toast.success(text.orderCancelled)
      },
      onError: () => toast.error(text.actionError),
    },
  })

  if (!hasToken) {
    return (
      <EmptyState
        icon="order"
        title={text.myOrders}
        description={text.signInRequired}
        actionLabel={text.signIn}
        actionHref={getLoginHref(language, `/${language}/orders`)}
      />
    )
  }

  if (ordersQuery.isPending) {
    return <OrdersSkeleton />
  }

  if (ordersQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-destructive">{text.actionError}</p>
        <Button className="mt-4" onClick={() => ordersQuery.refetch()}>
          {text.retry}
        </Button>
      </div>
    )
  }

  const orders = ordersQuery.data?.content ?? []

  if (orders.length === 0) {
    return (
      <EmptyState
        icon="order"
        title={text.ordersEmptyTitle}
        description={text.ordersEmptyDescription}
        actionLabel={text.popularProducts}
        actionHref={`/${language}/#catalog`}
      />
    )
  }

  return (
    <main className="min-h-screen px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {text.myOrders}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {text.ordersDescription}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href={`/${language}/#catalog`}>{text.popularProducts}</Link>
          </Button>
        </div>

        <div className="mt-10 space-y-5">
          {orders.map((order, index) => (
            <OrderCard
              key={order.id ?? index}
              order={order}
              language={language}
              isCancelling={
                cancelMutation.isPending &&
                cancelMutation.variables?.id === order.id
              }
              onCancel={() =>
                order.id != null && cancelMutation.mutate({ id: order.id })
              }
            />
          ))}
        </div>

        {(ordersQuery.data?.totalPages ?? 0) > 1 ? (
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              disabled={page === FIRST_PAGE || ordersQuery.isFetching}
              onClick={() =>
                setPage((current) => Math.max(FIRST_PAGE, current - 1))
              }
            >
              {text.previousStep}
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {ordersQuery.data?.totalPages ?? 1}
            </span>
            <Button
              variant="outline"
              disabled={
                ordersQuery.data?.last !== false || ordersQuery.isFetching
              }
              onClick={() => setPage((current) => current + 1)}
            >
              {text.nextStep}
            </Button>
          </div>
        ) : null}
      </div>
    </main>
  )
}

function OrderCard({
  order,
  language,
  isCancelling,
  onCancel,
}: {
  order: OrderDTO
  language: Language
  isCancelling: boolean
  onCancel: () => void
}) {
  const text = useStorefrontCopy()
  const status = order.status
  const statusLabels = {
    NEW: text.statusNew,
    CONFIRMED: text.statusConfirmed,
    SHIPPED: text.statusShipped,
    DELIVERED: text.statusDelivered,
    CANCELLED: text.statusCancelled,
  }
  const statusLabel = status ? statusLabels[status] : order.statusLabel || "—"
  const canCancel = status === "NEW" || status === "CONFIRMED"
  const date = order.createdAt
    ? new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(order.createdAt))
    : "—"

  return (
    <article className="overflow-hidden rounded-[1.75rem] border bg-card shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b p-5 sm:p-6">
        <div>
          <p className="text-sm text-muted-foreground">{text.order}</p>
          <h2 className="mt-1 text-xl font-bold">
            {order.orderNumber || `#${order.id ?? "—"}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {text.orderedAt}: {date}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold",
            status === "DELIVERED" &&
              "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            status === "CANCELLED" && "bg-destructive/10 text-destructive",
            status === "SHIPPED" &&
              "bg-blue-500/10 text-blue-700 dark:text-blue-300",
            (status === "NEW" || status === "CONFIRMED") &&
              "bg-amber-500/10 text-amber-700 dark:text-amber-300"
          )}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-3 p-5 sm:p-6">
        {order.items?.map((item, index) => (
          <div
            key={item.id ?? index}
            className="flex justify-between gap-4 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{item.productName || "—"}</p>
              <p className="text-xs text-muted-foreground">
                {[item.colorName, item.sizeValue].filter(Boolean).join(" · ")}
                {` · ${item.quantity ?? 0} ${text.pieces}`}
              </p>
            </div>
            <strong className="shrink-0">
              {formatStorefrontPrice(item.subtotal, language)}
            </strong>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/35 px-5 py-4 sm:px-6">
        <div>
          <span className="text-sm text-muted-foreground">{text.total}: </span>
          <strong className="text-xl">
            {formatStorefrontPrice(order.totalAmount, language)}
          </strong>
        </div>
        {canCancel && (
          <Button
            variant="destructive"
            className="rounded-2xl"
            disabled={isCancelling}
            onClick={onCancel}
          >
            {text.cancelOrder}
          </Button>
        )}
      </div>
    </article>
  )
}

function OrdersSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-20 sm:px-6">
      <div className="h-12 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 space-y-5">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-[1.75rem] bg-muted"
          />
        ))}
      </div>
    </main>
  )
}
