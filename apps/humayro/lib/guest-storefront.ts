"use client"

import { useSyncExternalStore } from "react"

type GuestCartItem = {
  productId: number
  quantity: number
  variantId: number
}

type GuestStorefrontState = {
  cart: GuestCartItem[]
  favoriteIds: number[]
}

const storageKey = "humayro:guest-storefront"
const changeEvent = "humayro:guest-storefront-change"
const emptyState: GuestStorefrontState = { cart: [], favoriteIds: [] }
let cachedRaw: string | null | undefined
let cachedState = emptyState

function readState() {
  const raw = window.localStorage.getItem(storageKey)
  if (raw === cachedRaw) return cachedState

  cachedRaw = raw
  try {
    const parsed = JSON.parse(raw ?? "") as Partial<GuestStorefrontState>
    cachedState = {
      cart: Array.isArray(parsed.cart) ? parsed.cart : [],
      favoriteIds: Array.isArray(parsed.favoriteIds) ? parsed.favoriteIds : [],
    }
  } catch {
    cachedState = emptyState
  }

  return cachedState
}

function writeState(state: GuestStorefrontState) {
  const raw = JSON.stringify(state)
  window.localStorage.setItem(storageKey, raw)
  cachedRaw = raw
  cachedState = state
  window.dispatchEvent(new Event(changeEvent))
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === storageKey) callback()
  }
  window.addEventListener(changeEvent, callback)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(changeEvent, callback)
    window.removeEventListener("storage", handleStorage)
  }
}

export function useGuestStorefront() {
  const state = useSyncExternalStore(subscribe, readState, () => emptyState)

  return {
    ...state,
    clearCart() {
      writeState({ ...readState(), cart: [] })
    },
    removeFromCart(variantId: number) {
      const current = readState()
      writeState({
        ...current,
        cart: current.cart.filter((item) => item.variantId !== variantId),
      })
    },
    updateCartQuantity(
      variantId: number,
      quantity: number,
      maxVariantQuantity = Infinity,
      maxProductQuantity = Infinity
    ) {
      const current = readState()
      const target = current.cart.find((item) => item.variantId === variantId)
      const otherProductQuantity = target
        ? current.cart
            .filter(
              (item) =>
                item.productId === target.productId &&
                item.variantId !== variantId
            )
            .reduce((total, item) => total + item.quantity, 0)
        : 0
      const allowedQuantity = Math.max(
        0,
        Math.min(maxVariantQuantity, maxProductQuantity - otherProductQuantity)
      )
      const nextQuantity = Math.min(quantity, allowedQuantity)
      writeState({
        ...current,
        cart:
          nextQuantity <= 0
            ? current.cart.filter((item) => item.variantId !== variantId)
            : current.cart.map((item) =>
                item.variantId === variantId
                  ? { ...item, quantity: nextQuantity }
                  : item
              ),
      })
    },
    addToCart(
      productId: number,
      variantId: number,
      quantity = 1,
      maxVariantQuantity = Infinity,
      maxProductQuantity = Infinity
    ) {
      const current = readState()
      const existing = current.cart.find((item) => item.variantId === variantId)
      const currentQuantity = existing?.quantity ?? 0
      const otherProductQuantity = current.cart
        .filter(
          (item) => item.productId === productId && item.variantId !== variantId
        )
        .reduce((total, item) => total + item.quantity, 0)
      const allowedQuantity = Math.max(
        0,
        Math.min(maxVariantQuantity, maxProductQuantity - otherProductQuantity)
      )
      const nextQuantity = Math.min(
        currentQuantity + Math.max(0, quantity),
        allowedQuantity
      )

      if (nextQuantity <= currentQuantity) return false

      writeState({
        ...current,
        cart: existing
          ? current.cart.map((item) =>
              item.variantId === variantId
                ? { ...item, quantity: nextQuantity }
                : item
            )
          : [...current.cart, { productId, quantity: nextQuantity, variantId }],
      })
      return true
    },
    toggleFavorite(productId: number) {
      const current = readState()
      const isFavorite = current.favoriteIds.includes(productId)
      writeState({
        ...current,
        favoriteIds: isFavorite
          ? current.favoriteIds.filter((id) => id !== productId)
          : [...current.favoriteIds, productId],
      })
      return !isFavorite
    },
  }
}
