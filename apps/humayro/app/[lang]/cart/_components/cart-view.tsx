"use client"

import {
  Coupon02Icon,
  Delete02Icon,
  DeliveryTruck01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useMemo, useState, type FormEvent, type ReactNode } from "react"
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
import { useGetAll2 } from "@/lib/api/generated/product/product"
import type { CartItemDTO } from "@/lib/api/model/cartItemDTO"
import type { CheckoutDTO } from "@/lib/api/model/checkoutDTO"
import type { OrderDTO } from "@/lib/api/model/orderDTO"
import type { ProductListDTO } from "@/lib/api/model/productListDTO"
import { useGuestStorefront } from "@/lib/guest-storefront"
import {
  formatStorefrontPrice,
  getLoginHref,
  getProductName,
  getProductPrice,
} from "@/lib/storefront"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"
import { Button } from "@workspace/ui/components/button"
import { Label } from "@workspace/ui/components/label"

import { EmptyState } from "../../_components/storefront/empty-state"
import { ProductCard } from "../../_components/storefront/product-card"
import { useStorefrontActions } from "../../_components/storefront/use-storefront-actions"

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
  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutData, setCheckoutData] = useState<CheckoutDTO>(initialCheckout)
  const [completedOrder, setCompletedOrder] = useState<OrderDTO | null>(null)
  const cartQuery = useGetCart({
    query: { enabled: hasToken, retry: false },
  })
  const productsQuery = useGetAll2(
    { active: true, page: 0, size: 20 },
    { query: { staleTime: 60_000 } }
  )

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
      <GuestCartView
        language={language}
        products={productsQuery.data?.content ?? []}
        productsLoading={productsQuery.isPending}
      />
    )
  }

  if (cartQuery.isPending) return <CartSkeleton />

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

  const cartProductIds = new Set(items.map((item) => item.productId))
  const recommendations = (productsQuery.data?.content ?? [])
    .filter((product) => product.id != null && !cartProductIds.has(product.id))
    .slice(0, 5)

  return (
    <CartPageShell
      language={language}
      itemCount={cart.totalItems ?? items.length}
      total={cart.totalAmount ?? 0}
      recommendations={recommendations}
      productsLoading={productsQuery.isPending}
      showCheckout={showCheckout}
      onCheckout={() => setShowCheckout(true)}
      onClear={() => clearMutation.mutate()}
      clearPending={clearMutation.isPending}
      checkout={
        <CheckoutForm
          data={checkoutData}
          pending={checkoutMutation.isPending}
          onBack={() => setShowCheckout(false)}
          onChange={updateCheckout}
          onSubmit={submitCheckout}
        />
      }
    >
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
            updateMutation.mutate({ itemId: item.id, params: { quantity } })
          }
          onRemove={() =>
            item.id != null && removeMutation.mutate({ itemId: item.id })
          }
        />
      ))}
    </CartPageShell>
  )
}

function GuestCartView({
  language,
  products,
  productsLoading,
}: {
  language: Language
  products: ProductListDTO[]
  productsLoading: boolean
}) {
  const text = useStorefrontCopy()
  const guest = useGuestStorefront()
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  )
  const rows = guest.cart.map((item) => ({
    ...item,
    product: productById.get(item.productId),
  }))
  const total = rows.reduce(
    (sum, row) =>
      sum + (getProductPrice(row.product ?? {}) ?? 0) * row.quantity,
    0
  )
  const cartIds = new Set(guest.cart.map((item) => item.productId))
  const recommendations = products
    .filter((product) => product.id != null && !cartIds.has(product.id))
    .slice(0, 5)

  if (productsLoading) return <CartSkeleton />
  if (!guest.cart.length) {
    return (
      <EmptyState
        title={text.cartEmptyTitle}
        description={text.cartEmptyDescription}
        actionLabel={text.popularProducts}
        actionHref={`/${language}/#catalog`}
      />
    )
  }

  return (
    <CartPageShell
      language={language}
      itemCount={guest.cart.reduce((sum, item) => sum + item.quantity, 0)}
      total={total}
      recommendations={recommendations}
      productsLoading={productsLoading}
      onClear={guest.clearCart}
      clearPending={false}
      guest
    >
      {rows.map(({ product, ...item }) => {
        const price = getProductPrice(product ?? {}) ?? 0
        return (
          <CartItem
            key={item.variantId}
            item={{
              productName: product ? getProductName(product, language) : "—",
              imageUrl: product?.mainImageUrl,
              unitPrice: price,
              subtotal: price * item.quantity,
              quantity: item.quantity,
            }}
            language={language}
            isUpdating={false}
            isRemoving={false}
            onQuantity={(quantity) =>
              guest.updateCartQuantity(item.variantId, quantity)
            }
            onRemove={() => guest.removeFromCart(item.variantId)}
          />
        )
      })}
    </CartPageShell>
  )
}

function CartPageShell({
  children,
  language,
  itemCount,
  total,
  recommendations,
  productsLoading,
  showCheckout = false,
  guest = false,
  checkout,
  clearPending,
  onCheckout,
  onClear,
}: {
  children: ReactNode
  language: Language
  itemCount: number
  total: number
  recommendations: ProductListDTO[]
  productsLoading: boolean
  showCheckout?: boolean
  guest?: boolean
  checkout?: ReactNode
  clearPending: boolean
  onCheckout?: () => void
  onClear: () => void
}) {
  const text = useStorefrontCopy()
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {text.cartTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {itemCount} {text.pieces}
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={clearPending}
            onClick={onClear}
          >
            {text.clearCart}
          </Button>
        </div>

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section>
            <div className="mb-3 flex items-center gap-3 rounded-xl border border-dashed border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-950 dark:border-orange-900 dark:bg-orange-950/30 dark:text-orange-100">
              <HugeiconsIcon
                icon={DeliveryTruck01Icon}
                className="size-5 shrink-0 text-orange-500"
              />
              <span className="flex-1">{text.cartDelivery}</span>
              <span aria-hidden>×</span>
            </div>
            <div className="space-y-3">{children}</div>
          </section>

          <aside className="space-y-3 lg:sticky lg:top-24">
            {showCheckout ? (
              checkout
            ) : (
              <>
                <OrderSummary
                  language={language}
                  total={total}
                  guest={guest}
                  onCheckout={onCheckout}
                />
                <PromoPanel />
              </>
            )}
          </aside>
        </div>

        <Recommendations
          language={language}
          products={recommendations}
          loading={productsLoading}
        />
      </div>
    </main>
  )
}

function OrderSummary({
  language,
  total,
  guest,
  onCheckout,
}: {
  language: Language
  total: number
  guest: boolean
  onCheckout?: () => void
}) {
  const text = useStorefrontCopy()
  return (
    <div className="rounded-2xl border bg-muted/30 p-5">
      <h2 className="text-lg font-bold">{text.orderSummary}</h2>
      <div className="mt-5 space-y-3 text-sm">
        <SummaryRow
          label={text.subtotal}
          value={formatStorefrontPrice(total, language)}
        />
        <SummaryRow label={text.shippingCost} value={text.freeShipping} />
        <SummaryRow
          label={text.productDiscount}
          value={formatStorefrontPrice(0, language)}
        />
      </div>
      <div className="mt-5 flex items-center justify-between border-t pt-5">
        <span className="font-semibold">{text.orderSummary}</span>
        <strong className="text-lg">
          {formatStorefrontPrice(total, language)}
        </strong>
      </div>
      {guest ? (
        <Button asChild className="mt-5 h-11 w-full rounded-xl font-semibold">
          <Link href={getLoginHref(language, `/${language}/cart`)}>
            {text.signInCheckout}
          </Link>
        </Button>
      ) : (
        <Button
          className="mt-5 h-11 w-full rounded-xl font-semibold"
          onClick={onCheckout}
        >
          {text.proceedToCheckout}
        </Button>
      )}
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function PromoPanel() {
  const text = useStorefrontCopy()
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-2xl border bg-muted/30 p-5">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold"
        onClick={() => setOpen((value) => !value)}
      >
        <HugeiconsIcon icon={Coupon02Icon} className="size-4" />
        <span className="flex-1">{text.promoCodes}</span>
        <span className="text-muted-foreground">{open ? "⌃" : "⌄"}</span>
      </button>
      {open ? (
        <Input
          className="mt-4 h-10 bg-background"
          placeholder={text.promoCodePlaceholder}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              toast.info(text.promoCodesUnavailable)
            }
          }}
        />
      ) : null}
    </div>
  )
}

function CheckoutForm({
  data,
  pending,
  onBack,
  onChange,
  onSubmit,
}: {
  data: CheckoutDTO
  pending: boolean
  onBack: () => void
  onChange: <K extends keyof CheckoutDTO>(key: K, value: CheckoutDTO[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const text = useStorefrontCopy()
  return (
    <form
      className="rounded-2xl border bg-card p-5 shadow-sm"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{text.checkout}</h2>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          {text.backToCart}
        </button>
      </div>
      <div className="mt-5 space-y-4">
        <Field label={text.recipientName}>
          <Input
            required
            value={data.recipientName}
            onChange={(event) => onChange("recipientName", event.target.value)}
          />
        </Field>
        <Field label={text.recipientPhone}>
          <Input
            required
            type="tel"
            inputMode="tel"
            placeholder="+998901234567"
            pattern="\+998[0-9]{9}"
            value={data.recipientPhone}
            onChange={(event) => onChange("recipientPhone", event.target.value)}
          />
        </Field>
        <Field label={text.deliveryAddress}>
          <Input
            required
            value={data.deliveryAddress}
            onChange={(event) =>
              onChange("deliveryAddress", event.target.value)
            }
          />
        </Field>
        <Field label={text.note}>
          <textarea
            rows={3}
            value={data.note}
            className="flex w-full resize-none rounded-xl border border-input bg-input/30 px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onChange={(event) => onChange("note", event.target.value)}
          />
        </Field>
        <Button
          type="submit"
          className="h-11 w-full rounded-xl font-semibold"
          disabled={pending}
        >
          {pending ? text.placingOrder : text.placeOrder}
        </Button>
      </div>
    </form>
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
    <article className="grid grid-cols-[92px_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border bg-card p-3 sm:grid-cols-[108px_minmax(0,1fr)_auto] sm:p-4">
      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productName || ""}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-linear-to-br from-primary/5 to-primary/15" />
        )}
      </div>
      <div className="min-w-0 self-stretch py-1">
        <p className="text-xs text-muted-foreground">
          {[item.colorName, item.sizeValue].filter(Boolean).join(" · ")}
        </p>
        <h2 className="mt-1 line-clamp-2 text-sm font-semibold sm:text-base">
          {item.productName || "—"}
        </h2>
        <p className="mt-2 text-sm font-bold">
          {formatStorefrontPrice(item.unitPrice, language)}
        </p>
        <div className="mt-3 inline-flex h-9 items-center rounded-lg border bg-background">
          <button
            type="button"
            aria-label="Decrease"
            disabled={quantity <= 1 || isUpdating}
            className="size-8 hover:text-primary disabled:opacity-35"
            onClick={() => onQuantity(quantity - 1)}
          >
            −
          </button>
          <span className="min-w-7 text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            aria-label="Increase"
            disabled={quantity >= (item.stock ?? Infinity) || isUpdating}
            className="size-8 hover:text-primary disabled:opacity-35"
            onClick={() => onQuantity(quantity + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className="flex h-full flex-col items-end justify-between py-1">
        <button
          type="button"
          aria-label={text.remove}
          title={text.remove}
          disabled={isRemoving}
          className="grid size-8 place-items-center rounded-full border text-muted-foreground transition hover:border-destructive/30 hover:text-destructive disabled:opacity-40"
          onClick={onRemove}
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
        </button>
        <strong className="text-right text-sm sm:text-base">
          {formatStorefrontPrice(item.subtotal, language)}
        </strong>
      </div>
    </article>
  )
}

function Recommendations({
  language,
  products,
  loading,
}: {
  language: Language
  products: ProductListDTO[]
  loading: boolean
}) {
  const text = useStorefrontCopy()
  const actions = useStorefrontActions(language)
  if (!loading && !products.length) return null

  return (
    <section className="mt-14 border-t pt-9">
      <h2 className="text-xl font-bold">{text.recommendations}</h2>
      {loading ? (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[.72] animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product, index) => (
            <ProductCard
              key={product.id ?? index}
              product={product}
              language={language}
              isFavorite={
                product.id != null &&
                actions.guestFavoriteIds.includes(product.id)
              }
              isAdding={actions.pendingCartId === product.id}
              isTogglingFavorite={actions.pendingFavoriteId === product.id}
              onAddToCart={actions.addProductToCart}
              onToggleFavorite={actions.toggleFavorite}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function OrderSuccess({
  order,
  language,
}: {
  order: OrderDTO
  language: Language
}) {
  const text = useStorefrontCopy()
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary/10 text-3xl text-primary">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold">{text.orderSuccess}</h1>
      <p className="mt-3 text-muted-foreground">
        {text.orderSuccessDescription}
      </p>
      <div className="mt-8 rounded-2xl bg-muted/60 p-5 text-left">
        <SummaryRow
          label={text.orderNumber}
          value={order.orderNumber || `#${order.id ?? "—"}`}
        />
        <div className="mt-3">
          <SummaryRow
            label={text.total}
            value={formatStorefrontPrice(order.totalAmount, language)}
          />
        </div>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg" className="rounded-xl">
          <Link href={`/${language}/orders`}>{text.myOrders}</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="rounded-xl">
          <Link href={`/${language}/#catalog`}>{text.popularProducts}</Link>
        </Button>
      </div>
    </section>
  )
}

function CartSkeleton() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6">
      <div className="h-10 w-52 animate-pulse rounded-lg bg-muted" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-muted" />
      </div>
    </main>
  )
}
