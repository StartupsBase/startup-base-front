"use client"

import Link from "next/link"

import type { Language } from "@/i18n/config"
import { useGetById10 } from "@/lib/api/generated/admin-order/admin-order"
import { useGetMyOrder } from "@/lib/api/generated/order/order"
import type { OrderDTO } from "@/lib/api/model/orderDTO"
import { formatStorefrontPrice } from "@/lib/storefront"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

type OrderQuery = {
  data?: OrderDTO
  isPending: boolean
  isError: boolean
  refetch: () => unknown
}

export function AccountOrderDetailsView({
  language,
  orderId,
}: {
  language: Language
  orderId: number
}) {
  const query = useGetMyOrder(orderId, { query: { retry: false } })

  return (
    <OrderDetailsView
      language={language}
      orderId={orderId}
      query={query}
      backHref={`/${language}/account`}
    />
  )
}

export function AdminOrderDetailsView({
  language,
  orderId,
}: {
  language: Language
  orderId: number
}) {
  const query = useGetById10(orderId, { query: { retry: false } })

  return (
    <OrderDetailsView
      language={language}
      orderId={orderId}
      query={query}
      backHref={`/${language}/dashboard/orders`}
    />
  )
}

function OrderDetailsView({
  backHref,
  language,
  orderId,
  query,
}: {
  backHref: string
  language: Language
  orderId: number
  query: OrderQuery
}) {
  const copy =
    language === "ru"
      ? {
          address: "Адрес доставки",
          back: "Назад к заказам",
          error: "Не удалось загрузить заказ.",
          items: "Состав заказа",
          order: "Заказ",
          payment: "Оплата",
          recipient: "Получатель",
          retry: "Повторить",
          total: "Итого",
        }
      : {
          address: "Yetkazib berish manzili",
          back: "Buyurtmalarga qaytish",
          error: "Buyurtmani yuklab bo'lmadi.",
          items: "Buyurtma tarkibi",
          order: "Buyurtma",
          payment: "To'lov",
          recipient: "Qabul qiluvchi",
          retry: "Qayta urinish",
          total: "Jami",
        }

  if (query.isPending) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-16 sm:px-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="mt-8 h-96 animate-pulse rounded-3xl bg-muted" />
      </main>
    )
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-destructive">{copy.error}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" asChild>
            <Link href={backHref}>{copy.back}</Link>
          </Button>
          <Button onClick={() => query.refetch()}>{copy.retry}</Button>
        </div>
      </main>
    )
  }

  const order = query.data
  const recipient =
    order.recipientName ||
    [order.recipientFirstName, order.recipientLastName].filter(Boolean).join(" ")
  const address =
    order.deliveryAddress ||
    [
      order.regionName,
      order.districtName,
      order.street,
      order.houseNumber,
      order.apartmentNumber,
    ]
      .filter(Boolean)
      .join(", ")

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
      <Button variant="ghost" asChild className="-ml-4">
        <Link href={backHref}>{copy.back}</Link>
      </Button>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">{copy.order}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">
            {order.orderNumber || `#${order.id ?? orderId}`}
          </h1>
        </div>
        <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
          {order.statusLabel || order.status || "—"}
        </span>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="font-bold">{copy.recipient}</CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{recipient || "—"}</p>
            <p>{order.recipientPhone || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="font-bold">{copy.address}</CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {address || "—"}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader className="font-bold">{copy.items}</CardHeader>
        <CardContent className="space-y-4">
          {order.items?.map((item, index) => (
            <div
              key={item.id ?? index}
              className="flex items-start justify-between gap-4 border-b pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{item.productName || "—"}</p>
                <p className="text-sm text-muted-foreground">
                  {[item.colorName, item.sizeValue].filter(Boolean).join(" · ")}
                  {` · ${item.quantity ?? 0}`}
                </p>
              </div>
              <strong>{formatStorefrontPrice(item.subtotal, language)}</strong>
            </div>
          ))}
          <div className="flex justify-between border-t pt-4 text-lg">
            <strong>{copy.total}</strong>
            <strong>{formatStorefrontPrice(order.totalAmount, language)}</strong>
          </div>
          <p className="text-sm text-muted-foreground">
            {copy.payment}: {order.paymentMethod || "—"} / {order.paymentStatus || "—"}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
