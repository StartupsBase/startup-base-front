"use client"

import {
  Delete02Icon,
  PencilEdit02Icon,
  Trash,
  ViewIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { type ProductListDTO } from "@/lib/api"
import {
  getGetAll2QueryKey as getProductsQueryKey,
  useDelete2 as useDeleteProduct,
} from "@/lib/api/generated/product/product"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { ProductDetailsPreview } from "./product-details-preview"
export function ProductActions({
  product,
  organizationId,
  language,
}: {
  product: ProductListDTO
  organizationId: number
  language: string
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeProduct = useDeleteProduct()

  async function remove() {
    if (product.id === undefined) return
    try {
      await removeProduct.mutateAsync({ id: product.id })
      await queryClient.invalidateQueries({
        queryKey: getProductsQueryKey({ organizationId }),
      })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-end sm:gap-1">
      {product.id !== undefined ? (
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              title={t("product.previewProduct")}
            >
              <HugeiconsIcon icon={ViewIcon} className="size-4" />
              <span className="sr-only">{t("product.previewProduct")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[94vh] overflow-hidden p-0 sm:max-w-[96vw]">
            <DialogHeader className="border-b px-6 py-4 text-left">
              <DialogTitle>{t("product.previewProduct")}</DialogTitle>
              <DialogDescription>{product.name}</DialogDescription>
            </DialogHeader>
            <ProductDetailsPreview productId={product.id} language={language} />
          </DialogContent>
        </Dialog>
      ) : null}
      {product.id !== undefined ? (
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
          title={t("product.edit")}
          aria-label={t("product.edit")}
        >
          <Link
            href={`/${language}/dashboard/organizations/${organizationId}/products/${product.id}/edit`}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("product.edit")}</span>
          </Link>
        </Button>
      ) : null}
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-10 p-0 text-destructive hover:text-destructive lg:h-8 lg:w-auto lg:px-3"
            title={t("product.delete")}
            aria-label={t("product.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("product.delete")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("product.delete")}</DialogTitle>
            <DialogDescription>{t("product.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              disabled={removeProduct.isPending}
              onClick={remove}
            >
              <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              {t("product.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
