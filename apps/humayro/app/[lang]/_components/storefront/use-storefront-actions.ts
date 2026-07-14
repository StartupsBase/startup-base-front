"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import type { Language } from "@/i18n/config"
import { hasAuthToken } from "@/lib/auth-client"
import {
  addItem,
  getGetCartQueryKey,
} from "@/lib/api/generated/cart/cart"
import {
  add as addFavorite,
  getGetFavoriteIdsQueryKey,
  getGetFavoritesQueryKey,
  remove as removeFavorite,
} from "@/lib/api/generated/favorite/favorite"
import { getById2 } from "@/lib/api/generated/product/product"
import { getLoginHref } from "@/lib/storefront"
import { useStorefrontCopy } from "@/lib/use-storefront-copy"

function getStatus(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "status" in error.response
  ) {
    return error.response.status
  }

  return undefined
}

export function useStorefrontActions(language: Language) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [pendingCartId, setPendingCartId] = useState<number | null>(null)
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null)
  const text = useStorefrontCopy()

  function requireAuthentication() {
    if (hasAuthToken()) return true

    toast.info(text.signInRequired)
    const returnPath = `${window.location.pathname}${window.location.search}`
    router.push(getLoginHref(language, returnPath))
    return false
  }

  function handleError(error: unknown) {
    if (getStatus(error) === 401) {
      toast.info(text.signInRequired)
      router.push(getLoginHref(language, window.location.pathname))
      return
    }

    toast.error(text.actionError)
  }

  async function addProductToCart(productId: number) {
    if (!requireAuthentication()) return

    setPendingCartId(productId)
    try {
      const product = await getById2(productId)
      const variant = product.variants?.find(
        (item) => item.id != null && item.active !== false && (item.stock ?? 0) > 0
      )

      if (variant?.id == null) {
        toast.info(text.outOfStock)
        return
      }

      await addItem({ variantId: variant.id, quantity: 1 })
      await queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() })
      toast.success(text.addedToCart)
    } catch (error) {
      handleError(error)
    } finally {
      setPendingCartId(null)
    }
  }

  async function toggleFavorite(productId: number, isFavorite: boolean) {
    if (!requireAuthentication()) return

    setPendingFavoriteId(productId)
    try {
      if (isFavorite) {
        await removeFavorite(productId)
      } else {
        await addFavorite(productId)
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetFavoriteIdsQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() }),
      ])
      toast.success(
        isFavorite ? text.removedFromFavorites : text.addedToFavorites
      )
    } catch (error) {
      handleError(error)
    } finally {
      setPendingFavoriteId(null)
    }
  }

  return {
    addProductToCart,
    toggleFavorite,
    pendingCartId,
    pendingFavoriteId,
  }
}
