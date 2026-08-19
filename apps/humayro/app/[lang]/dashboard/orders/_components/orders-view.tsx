"use client"

import { ShoppingCart02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { toast } from "sonner"

import type { Language } from "@/i18n/config"
import {
  getMyOrdersQueryKey,
  useCancel1,
  useMyOrders,
} from "@/lib/api/generated/order/order"
import type { OrderDTO } from "@/lib/api/model/orderDTO"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { formatStorefrontPrice } from "@/lib/storefront"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"

export function OrdersView({ language }: { language: Language }) {
  const text = useStorefrontCopy()
  const queryClient = useQueryClient()
  const ordersQuery = useMyOrders({ query: { retry: false } })
  const cancelMutation = useCancel1({
    mutation: {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() })
        toast.success(text.orderCancelled)
      },
      onError: () => toast.error(text.actionError),
    },
  })

  if (ordersQuery.isPending) {
    return <OrdersSkeleton />
  }

  if (ordersQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-destructive">{text.actionError}</p>
        <Button className="mt-4" onClick={() => ordersQuery.refetch()}>
          {text.retry}
        </Button>
      </div>
    )
  }

  const orders = ordersQuery.data ?? []

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: text.myOrders }]}
      />

      <header className="mt-6 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{text.order}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {text.myOrders}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {text.ordersDescription}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={`/${language}/#catalog`}>{text.popularProducts}</Link>
        </Button>
      </header>

      {orders.length === 0 ? (
        <Card className="mt-8 items-center py-14 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <HugeiconsIcon icon={ShoppingCart02Icon} className="size-7" />
          </div>
          <CardContent className="max-w-lg">
            <h2 className="text-xl font-bold">{text.ordersEmptyTitle}</h2>
            <p className="mt-2 text-muted-foreground">
              {text.ordersEmptyDescription}
            </p>
            <Button asChild className="mt-6">
              <Link href={`/${language}/#catalog`}>{text.popularProducts}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section
          aria-label={text.myOrders}
          className="mt-8 grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
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
        </section>
      )}
    </div>
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
  const statusLabels: Record<NonNullable<OrderDTO["status"]>, string> = {
    NEW: text.statusNew,
    CONFIRMED: text.statusConfirmed,
    SHIPPED: text.statusShipped,
    DELIVERED: text.statusDelivered,
    CANCELLED: text.statusCancelled,
  }
  const statusLabel = status
    ? statusLabels[status]
    : order.statusLabel || "—"
  const canCancel = status === "NEW" || status === "CONFIRMED"
  const date = order.createdAt
    ? new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(order.createdAt))
    : "—"
  const recipient = [
    order.recipientFirstName,
    order.recipientLastName,
  ]
    .filter(Boolean)
    .join(" ") || order.recipientName
  const address = getOrderAddress(order)
  const visibleItems = order.items?.slice(0, 3) ?? []
  const hiddenItems = Math.max((order.items?.length ?? 0) - visibleItems.length, 0)

  return (
    <Card className="h-full gap-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-4 border-b px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {text.order}
            </p>
            <h2 className="mt-1 truncate text-lg font-bold">
              {order.orderNumber || `#${order.id ?? "—"}`}
            </h2>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
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
        <p className="text-xs text-muted-foreground">
          {text.orderedAt}: {date}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-5 py-5">
        {(recipient || order.recipientPhone || address) && (
          <div className="rounded-xl bg-muted/45 p-3 text-sm">
            {recipient ? <p className="font-semibold">{recipient}</p> : null}
            {order.recipientPhone ? (
              <p className="mt-0.5 text-muted-foreground">
                {formatPhoneNumberInternal(order.recipientPhone)}
              </p>
            ) : null}
            {address ? (
              <p className="mt-2 line-clamp-2 text-muted-foreground">
                {address}
              </p>
            ) : null}
          </div>
        )}

        <div className="mt-5 space-y-3">
          {visibleItems.map((item, index) => (
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
          {hiddenItems > 0 ? (
            <p className="text-xs font-medium text-primary">
              {text.moreOrderItems.replace("{count}", String(hiddenItems))}
            </p>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap justify-between gap-3 border-t bg-muted/25 px-5 py-4">
        <div>
          <span className="text-xs text-muted-foreground">{text.total}</span>
          <p className="text-lg font-bold">
            {formatStorefrontPrice(order.totalAmount, language)}
          </p>
        </div>
        {canCancel ? (
          <Button
            size="sm"
            variant="destructive"
            disabled={isCancelling}
            onClick={onCancel}
          >
            {text.cancelOrder}
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}

function getOrderAddress(order: OrderDTO) {
  if (order.deliveryAddress?.trim()) return order.deliveryAddress.trim()

  const streetAndHouse = [order.street, order.houseNumber]
    .filter(Boolean)
    .join(" ")
  const apartmentDetails = [
    order.apartmentNumber,
    order.entrance,
    order.floor,
  ]
    .filter(Boolean)
    .join(", ")

  return [
    order.deliveryCity,
    order.deliveryDistrict,
    streetAndHouse,
    apartmentDetails,
  ]
    .filter(Boolean)
    .join(", ")
}

function OrdersSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-5 w-44 animate-pulse rounded-lg bg-muted" />
      <div className="mt-7 h-10 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
