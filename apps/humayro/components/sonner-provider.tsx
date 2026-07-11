"use client"

import { Toaster } from "@workspace/ui/components/sonner"

import { useTheme } from "@/components/theme-provider"

export function SonnerProvider() {
  const { theme } = useTheme()

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
    />
  )
}
