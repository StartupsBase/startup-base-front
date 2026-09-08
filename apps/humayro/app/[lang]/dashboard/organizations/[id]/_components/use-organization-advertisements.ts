"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  getGetAll8QueryKey,
  useCreate8,
  useDelete7,
  useGetAll8,
  useUpdate8,
} from "@/lib/api/generated/admin-organization-advertisement-controller/admin-organization-advertisement-controller"
import { getGetPublicQueryKey } from "@/lib/api/generated/organization-advertisement-controller/organization-advertisement-controller"
import { ADVERTISEMENT_PAGE_SIZE } from "./advertisement-helpers"

export function useOrganizationAdvertisements(
  organizationId: number,
  page: number
) {
  const queryClient = useQueryClient()
  const query = useGetAll8(
    { organizationId, page, size: ADVERTISEMENT_PAGE_SIZE },
    { query: { retry: false } }
  )
  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetAll8QueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetPublicQueryKey() }),
    ])
  }
  const create = useCreate8({ mutation: { onSuccess: refresh } })
  const update = useUpdate8({ mutation: { onSuccess: refresh } })
  const remove = useDelete7({ mutation: { onSuccess: refresh } })
  return { query, create, update, remove }
}
