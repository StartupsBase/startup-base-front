"use client"

import { useSyncExternalStore } from "react"

import { hasAuthToken } from "@/lib/auth-client"

const subscribe = () => () => undefined

export function useHasAuthToken() {
  return useSyncExternalStore(subscribe, hasAuthToken, () => false)
}
