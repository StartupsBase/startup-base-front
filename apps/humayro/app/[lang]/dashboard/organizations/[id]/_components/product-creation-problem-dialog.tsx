"use client"

import { Alert02Icon, Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslation } from "react-i18next"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"

export function ProductCreationProblemDialog({
  message,
  onCancelCreation,
  onOpenChange,
  onReturn,
  open,
}: {
  message: string
  onCancelCreation: () => void
  onOpenChange: (open: boolean) => void
  onReturn: () => void
  open: boolean
}) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        size="sm"
        className="gap-5 px-6 py-7 sm:max-w-lg sm:px-8 sm:py-8"
      >
        <AlertDialogCancel
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 rounded-full text-muted-foreground"
          aria-label={t("product.creationProblemClose")}
          onClick={onReturn}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-4" />
        </AlertDialogCancel>

        <AlertDialogHeader className="gap-3">
          <AlertDialogMedia className="mb-0 size-14 bg-amber-400/15 text-amber-500">
            <HugeiconsIcon icon={Alert02Icon} className="size-7" />
          </AlertDialogMedia>
          <AlertDialogTitle className="text-xl font-bold sm:text-2xl">
            {t("product.creationProblemTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-1.5 text-center">
            <span className="block">{message}</span>
            <span className="block font-semibold text-destructive">
              {t("product.creationProblemUnsaved")}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mx-auto w-full max-w-sm">
          <AlertDialogCancel variant={'secondary'} size={'lg'} onClick={onReturn}>
            {t("product.creationProblemReturn")}
          </AlertDialogCancel>
          <AlertDialogAction variant={'default'} size={'lg'} onClick={onCancelCreation}>
            {t("product.creationProblemExit")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
