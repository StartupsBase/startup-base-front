"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect } from "react"

import {
  getAll6,
  getGetAll6QueryKey,
} from "@/lib/api/generated/branch/branch"
import {
  getAll10,
  getGetAll10QueryKey,
} from "@/lib/api/generated/district/district"
import {
  getAll9,
  getGetAll9QueryKey,
} from "@/lib/api/generated/region/region"
import type {
  BranchDTO,
  DistrictDTO,
  GetAll10Params,
  GetAll6Params,
  GetAll9Params,
  PageResponseBranchDTO,
  PageResponseDistrictDTO,
  PageResponseRegionDTO,
  RegionDTO,
} from "@/lib/api/model"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"

type InfiniteDirectoryQueryOptions = {
  query?: {
    enabled?: boolean
    retry?: boolean | number
    staleTime?: number
  }
}

type ApiPage<TItem> = {
  content?: TItem[]
  page?: number
  totalPages?: number
  last?: boolean
}

function withoutPage<TParams extends { page?: number }>(params?: TParams) {
  if (!params) return undefined
  const queryParams = { ...params }
  delete queryParams.page
  return queryParams
}

function useInfiniteDirectoryQuery<
  TItem,
  TParams extends { page?: number; size?: number },
  TPage extends ApiPage<TItem>,
>({
  params,
  options,
  queryKey,
  queryFn,
}: {
  params?: TParams
  options?: InfiniteDirectoryQueryOptions
  queryKey: readonly unknown[]
  queryFn: (params: TParams, signal: AbortSignal) => Promise<TPage>
}) {
  const query = useInfiniteQuery({
    queryKey,
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam, signal }) =>
      queryFn(
        {
          ...params,
          page: toApiPage(pageParam),
          size: params?.size ?? 100,
        } as TParams,
        signal
      ),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.last) return undefined

      const nextPage = allPages.length + FIRST_PAGE
      if (
        lastPage.totalPages !== undefined &&
        nextPage > lastPage.totalPages
      ) {
        return undefined
      }

      return lastPage.last === false || lastPage.totalPages !== undefined
        ? nextPage
        : undefined
    },
    enabled: options?.query?.enabled,
    retry: options?.query?.retry,
    staleTime: options?.query?.staleTime,
  })

  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const data = query.data
    ? ({
        ...query.data.pages.at(-1),
        content: query.data.pages.flatMap((page) => page.content ?? []),
      } as TPage)
    : undefined

  return { ...query, data }
}

export function useInfiniteBranches(
  params?: GetAll6Params,
  options?: InfiniteDirectoryQueryOptions
) {
  const queryParams = withoutPage(params)

  return useInfiniteDirectoryQuery<
    BranchDTO,
    GetAll6Params,
    PageResponseBranchDTO
  >({
    params,
    options,
    queryKey: [...getGetAll6QueryKey(queryParams), "infinite"],
    queryFn: (nextParams, signal) => getAll6(nextParams, undefined, signal),
  })
}

export function useInfiniteRegions(
  params?: GetAll9Params,
  options?: InfiniteDirectoryQueryOptions
) {
  const queryParams = withoutPage(params)

  return useInfiniteDirectoryQuery<
    RegionDTO,
    GetAll9Params,
    PageResponseRegionDTO
  >({
    params,
    options,
    queryKey: [...getGetAll9QueryKey(queryParams), "infinite"],
    queryFn: (nextParams, signal) => getAll9(nextParams, undefined, signal),
  })
}

export function useInfiniteDistricts(
  params?: GetAll10Params,
  options?: InfiniteDirectoryQueryOptions
) {
  const queryParams = withoutPage(params)

  return useInfiniteDirectoryQuery<
    DistrictDTO,
    GetAll10Params,
    PageResponseDistrictDTO
  >({
    params,
    options,
    queryKey: [...getGetAll10QueryKey(queryParams), "infinite"],
    queryFn: (nextParams, signal) => getAll10(nextParams, undefined, signal),
  })
}
