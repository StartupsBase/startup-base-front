"use client"

import { Add01Icon, PencilEdit02Icon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { type CategoryDTO } from "@/lib/api"
import { getGetAll7QueryKey } from "@/lib/api/generated/admin-organization/admin-organization"
import {
  getGetAll5QueryKey,
  useDelete4,
} from "@/lib/api/generated/category/category"
import { useDelete9 } from "@/lib/api/generated/attachment-controller/attachment-controller"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { CategoryForm } from "./category-form"
import { imageStorageKey, readImageAttachmentId } from "./category-helpers"
export function CategoryActions({
  category,
  categories,
}: {
  category: CategoryDTO
  categories: CategoryDTO[]
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeCategory = useDelete4()
  const removeAttachment = useDelete9()
  const [editOpen, setEditOpen] = useState(false)
  const [childOpen, setChildOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function remove() {
    if (category.id === undefined) return
    setDeleteError(null)
    const imageAttachmentId = readImageAttachmentId(category)

    if (category.imageUrl && imageAttachmentId === undefined) {
      setDeleteError(t("category.imageReferenceMissing"))
      toast.error(t("notifications.deleteFailed"))
      return
    }

    try {
      if (imageAttachmentId !== undefined) {
        await removeAttachment.mutateAsync({ id: imageAttachmentId })
      }
      await removeCategory.mutateAsync({ id: category.id })
      window.localStorage.removeItem(imageStorageKey(category.id))
      await queryClient.invalidateQueries({ queryKey: getGetAll5QueryKey() })
      await queryClient.invalidateQueries({ queryKey: getGetAll7QueryKey() })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      setDeleteError(t("category.deleteFailed"))
      toast.error(t("notifications.deleteFailed"))
    }
  }

  const pending = removeCategory.isPending || removeAttachment.isPending

  return (
    <div className="flex justify-end gap-1">
      {category.id !== undefined ? (
        <Dialog open={childOpen} onOpenChange={setChildOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 sm:size-9"
              title={t("category.addChild")}
            >
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              <span className="sr-only">{t("category.addChild")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
            <DialogHeader>
              <DialogTitle>{t("category.addChild")}</DialogTitle>
              <DialogDescription>
                {t("category.addChildDescription", { parent: category.name })}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              categories={categories}
              initialParentId={category.id}
              organizationId={category.organizationId ?? 0}
              onComplete={() => setChildOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-11 p-0 sm:size-9 lg:h-8 lg:w-auto lg:px-3"
            title={t("category.edit")}
            aria-label={t("category.edit")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("category.edit")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
          <DialogHeader>
            <DialogTitle>{t("category.edit")}</DialogTitle>
            <DialogDescription>{category.name}</DialogDescription>
          </DialogHeader>
          <CategoryForm
            category={category}
            categories={categories}
            organizationId={category.organizationId ?? 0}
            onComplete={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-11 p-0 text-destructive hover:text-destructive sm:size-9 lg:h-8 lg:w-auto lg:px-3"
            title={t("category.delete")}
            aria-label={t("category.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("category.delete")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-72 gap-3">
          <p className="text-sm">{t("category.deleteConfirm")}</p>
          {deleteError ? (
            <p className="text-xs text-destructive">{deleteError}</p>
          ) : null}
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={remove}
          >
            {t("category.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
