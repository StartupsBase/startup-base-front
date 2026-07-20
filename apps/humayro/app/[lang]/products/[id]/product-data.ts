import { cache } from "react"

import { getApiBaseUrl } from "@/lib/api-url"
import type { PageResponseProductListDTO } from "@/lib/api/model/pageResponseProductListDTO"
import type { ProductDTO } from "@/lib/api/model/productDTO"
import type { ReviewDTO } from "@/lib/api/model/reviewDTO"

async function apiFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`API request failed with ${response.status}`)
  return response.json() as Promise<T>
}

export const getProductDetails = cache((productId: number) =>
  apiFetch<ProductDTO>(`/api/products/${productId}`)
)

export const getProductReviews = cache(async (productId: number) =>
  (await apiFetch<ReviewDTO[]>(`/api/products/${productId}/reviews`)) ?? []
)

export const getSimilarProducts = cache(
  async (categoryId: number, productId: number) => {
    const params = new URLSearchParams({
      active: "true",
      categoryId: String(categoryId),
      page: "0",
      size: "10",
      sort: "ratingAvg,desc",
    })
    const page = await apiFetch<PageResponseProductListDTO>(
      `/api/products?${params}`
    )

    return (page?.content ?? [])
      .filter((product) => product.id !== productId)
      .slice(0, 5)
  }
)
