"use client"

import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Input } from "@/components/input"
import type { Language } from "@/i18n/config"
import {
  getGetCartQueryKey,
  useClear,
  useGetCart,
  useRemoveItem,
  useUpdateQuantity,
} from "@/lib/api/generated/cart/cart"
import {
  getMyOrdersQueryKey,
  useCheckout,
} from "@/lib/api/generated/order/order"
import type { CartItemDTO } from "@/lib/api/model/cartItemDTO"
import type { CheckoutDTO } from "@/lib/api/model/checkoutDTO"
import type { OrderDTO } from "@/lib/api/model/orderDTO"
import {
  formatStorefrontPrice,
  getLoginHref,
} from "@/lib/storefront"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"

import { EmptyState } from "../../_components/storefront/empty-state"

const initialCheckout: CheckoutDTO = {
  recipientName: "",
  recipientPhone: "+998",
  deliveryAddress: "",
  note: "",
}

export function CartView({ language }: { language: Language }) {
  const text = useStorefrontCopy()
  const hasToken = useHasAuthToken()
  const queryClient = useQueryClient()
  const [checkoutData, setCheckoutData] = useState<CheckoutDTO>(initialCheckout)
  const [completedOrder, setCompletedOrder] = useState<OrderDTO | null>(null)
  const cartQuery = useGetCart({
    query: { enabled: hasToken, retry: false },
  })

  const refreshCart = () =>
    queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })

  const updateMutation = useUpdateQuantity({
    mutation: {
      onSuccess: refreshCart,
      onError: () => toast.error(text.actionError),
    },
  })
  const removeMutation = useRemoveItem({
    mutation: {
      onSuccess: refreshCart,
      onError: () => toast.error(text.actionError),
    },
  })
  const clearMutation = useClear({
    mutation: {
      onSuccess: refreshCart,
      onError: () => toast.error(text.actionError),
    },
  })
  const checkoutMutation = useCheckout({
    mutation: {
      onSuccess: async (order) => {
        setCompletedOrder(order)
        setCheckoutData(initialCheckout)
        await Promise.all([
          refreshCart(),
          queryClient.invalidateQueries({ queryKey: getMyOrdersQueryKey() }),
        ])
      },
      onError: () => toast.error(text.checkoutError),
    },
  })

  function updateCheckout<K extends keyof CheckoutDTO>(
    key: K,
    value: CheckoutDTO[K]
  ) {
    setCheckoutData((current) => ({ ...current, [key]: value }))
  }

  function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (
      !checkoutData.recipientName.trim() ||
      !/^\+998\d{9}$/.test(checkoutData.recipientPhone) ||
      !checkoutData.deliveryAddress.trim()
    ) {
      toast.error(text.checkoutError)
      return
    }

    checkoutMutation.mutate({
      data: {
        ...checkoutData,
        recipientName: checkoutData.recipientName.trim(),
        deliveryAddress: checkoutData.deliveryAddress.trim(),
        note: checkoutData.note?.trim() || undefined,
      },
    })
  }

  if (!hasToken) {
    return (
      <EmptyState
        title={text.cartTitle}
        description={text.signInRequired}
        actionLabel={text.signIn}
        actionHref={getLoginHref(language, `/${language}/cart`)}
      />
    )
  }

  if (cartQuery.isPending) {
    return <CartSkeleton />
  }

  if (cartQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[520px] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-lg text-destructive">{text.actionError}</p>
        <Button className="mt-4" onClick={() => cartQuery.refetch()}>
          {text.retry}
        </Button>
      </div>
    )
  }

  const cart = cartQuery.data
  const items = cart?.items ?? []

  if (items.length === 0 && !completedOrder) {
    return (
      <EmptyState
        title={text.cartEmptyTitle}
        description={text.cartEmptyDescription}
        actionLabel={text.popularProducts}
        actionHref={`/${language}/#catalog`}
      />
    )
  }

  if (completedOrder) {
    return (
      <main className="min-h-[70vh] px-4 py-20 sm:px-6">
        <OrderSuccess order={completedOrder} language={language} />
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {text.cartTitle}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              {text.cartDescription}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link href={`/${language}/orders`}>{text.myOrders}</Link>
            </Button>
            <Button
              variant="ghost"
              className="rounded-2xl text-destructive hover:text-destructive"
              disabled={clearMutation.isPending}
              onClick={() => clearMutation.mutate()}
            >
              {text.clearCart}
            </Button>
          </div>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="space-y-4">
            {items.map((item, index) => (
              <CartItem
                key={item.id ?? index}
                item={item}
                language={language}
                isUpdating={
                  updateMutation.isPending &&
                  updateMutation.variables?.itemId === item.id
                }
                isRemoving={
                  removeMutation.isPending &&
                  removeMutation.variables?.itemId === item.id
                }
                onQuantity={(quantity) =>
                  item.id != null &&
                  updateMutation.mutate({
                    itemId: item.id,
                    params: { quantity },
                  })
                }
                onRemove={() =>
                  item.id != null && removeMutation.mutate({ itemId: item.id })
                }
              />
            ))}
          </section>

          <aside className="sticky top-24 rounded-[2rem] border bg-card p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between border-b pb-5">
              <span className="text-lg font-semibold">{text.total}</span>
              <span className="text-2xl font-bold">
                {formatStorefrontPrice(cart?.totalAmount, language)}
              </span>
            </div>

            <form className="mt-6 space-y-5" onSubmit={submitCheckout}>
              <h2 className="text-2xl font-bold">{text.checkout}</h2>
              <Field label={text.recipientName}>
                <Input
                  required
                  value={checkoutData.recipientName}
                  onChange={(event) =>
                    updateCheckout("recipientName", event.target.value)
                  }
                />
              </Field>
              <Field label={text.recipientPhone}>
                <Input
                  required
                  type="tel"
                  inputMode="tel"
                  placeholder="+998901234567"
                  pattern="\+998[0-9]{9}"
                  value={checkoutData.recipientPhone}
                  onChange={(event) =>
                    updateCheckout("recipientPhone", event.target.value)
                  }
                />
              </Field>
              <Field label={text.deliveryAddress}>
                <Input
                  required
                  value={checkoutData.deliveryAddress}
                  onChange={(event) =>
                    updateCheckout("deliveryAddress", event.target.value)
                  }
                />
              </Field>
              <Field label={text.note}>
                <textarea
                  rows={3}
                  value={checkoutData.note}
                  className="flex w-full resize-none rounded-2xl border border-input bg-input/30 px-4 py-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onChange={(event) => updateCheckout("note", event.target.value)}
                />
              </Field>
              <Button
                type="submit"
                size="lg"
                className="h-13 w-full rounded-2xl text-base font-bold"
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending
                  ? text.placingOrder
                  : text.placeOrder}
              </Button>
            </form>
          </aside>
        </div>
      </div>
    </main>
  )
}

function CartItem({
  item,
  language,
  isUpdating,
  isRemoving,
  onQuantity,
  onRemove,
}: {
  item: CartItemDTO
  language: Language
  isUpdating: boolean
  isRemoving: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
}) {
  const text = useStorefrontCopy()
  const quantity = item.quantity ?? 1

  return (
    <article className="grid gap-4 rounded-[1.75rem] border bg-card p-4 sm:grid-cols-[130px_minmax(0,1fr)_auto] sm:items-center">
      <div
        role="img"
        aria-label={item.productName || ""}
        className="aspect-square rounded-2xl bg-[linear-gradient(145deg,#f7d8dc,#efb6bf)] bg-cover bg-center"
        style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
      />
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold">{item.productName || "—"}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {[item.colorName, item.sizeValue].filter(Boolean).join(" · ")}
        </p>
        <p className="mt-3 font-semibold">
          {formatStorefrontPrice(item.unitPrice, language)}
        </p>
        <button
          type="button"
          disabled={isRemoving}
          className="mt-2 text-sm font-medium text-destructive hover:underline disabled:opacity-50"
          onClick={onRemove}
        >
          {text.remove}
        </button>
      </div>
      <div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end">
        <div className="flex items-center rounded-full border bg-background p-1">
          <button
            type="button"
            aria-label="Decrease"
            disabled={quantity <= 1 || isUpdating}
            className="grid size-8 place-items-center rounded-full text-lg hover:bg-muted disabled:opacity-35"
            onClick={() => onQuantity(quantity - 1)}
          >
            −
          </button>
          <span className="min-w-9 text-center font-semibold">{quantity}</span>
          <button
            type="button"
            aria-label="Increase"
            disabled={quantity >= (item.stock ?? Infinity) || isUpdating}
            className="grid size-8 place-items-center rounded-full text-lg hover:bg-muted disabled:opacity-35"
            onClick={() => onQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
        <div className="text-right">
          <span className="block text-xs text-muted-foreground">{text.itemTotal}</span>
          <strong className="text-lg">
            {formatStorefrontPrice(item.subtotal, language)}
          </strong>
        </div>
      </div>
    </article>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function OrderSuccess({ order, language }: { order: OrderDTO; language: Language }) {
  const text = useStorefrontCopy()

  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border bg-card p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto grid size-24 place-items-center rounded-full bg-primary/10 text-4xl text-primary">
        ✓
      </div>
      <h1 className="mt-7 text-3xl font-bold">{text.orderSuccess}</h1>
      <p className="mt-3 text-muted-foreground">{text.orderSuccessDescription}</p>
      <div className="mt-8 rounded-2xl bg-muted/60 p-5 text-left">
        <div className="flex justify-between gap-4">
          <span>{text.orderNumber}</span>
          <strong>{order.orderNumber || `#${order.id ?? "—"}`}</strong>
        </div>
        <div className="mt-3 flex justify-between gap-4">
          <span>{text.total}</span>
          <strong>{formatStorefrontPrice(order.totalAmount, language)}</strong>
        </div>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="rounded-2xl">
          <Link href={`/${language}/orders`}>{text.myOrders}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-2xl">
          <Link href={`/${language}/#catalog`}>{text.popularProducts}</Link>
        </Button>
      </div>
    </section>
  )
}

function CartSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-20 sm:px-6">
      <div className="h-12 w-64 animate-pulse rounded-xl bg-muted" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-[1.75rem] bg-muted" />
          ))}
        </div>
        <div className="h-[520px] animate-pulse rounded-[2rem] bg-muted" />
      </div>
    </main>
  )
}
