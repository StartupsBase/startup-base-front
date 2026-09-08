"use client"

import { useTranslation } from "react-i18next"
import { useGetById2 as useGetProduct } from "@/lib/api/generated/product/product"

export function ProductDetailsPreview({
  productId,
  language,
}: {
  productId: number
  language: string
}) {
  const { t } = useTranslation()
  const productQuery = useGetProduct(productId)
  const product = productQuery.data

  if (productQuery.isLoading) {
    return <div className="m-6 h-[70vh] animate-pulse rounded-3xl bg-muted" />
  }
  if (!product) {
    return <p className="p-8 text-destructive">{t("product.loadFailed")}</p>
  }

  const images = (product.images ?? [])
    .sort((a, b) => Number(b.main) - Number(a.main))
    .flatMap((image) => (image.url ? [image.url] : []))
  const name =
    language === "ru"
      ? product.nameRu || product.name || product.nameEng
      : product.name || product.nameRu || product.nameEng
  const description =
    language === "ru"
      ? product.descriptionRu || product.descriptionUz || product.descriptionEng
      : product.descriptionUz || product.descriptionRu || product.descriptionEng
  const price = product.discountedPrice ?? product.basePrice
  const formatter = new Intl.NumberFormat(language === "ru" ? "ru-RU" : "uz-UZ")

  return (
    <div className="h-[calc(94vh-82px)] overflow-y-auto bg-background p-6 lg:p-10">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,.95fr)]">
        <div className="grid gap-3 sm:grid-cols-[76px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col">
            {images.slice(0, 6).map((url) => (
              <div
                key={url}
                className="size-[68px] shrink-0 overflow-hidden rounded-xl border bg-muted"
              >
                <img src={url} alt="" className="size-full object-cover" />
              </div>
            ))}
          </div>
          <div className="order-1 aspect-square overflow-hidden rounded-3xl border bg-muted sm:order-2">
            {images[0] ? (
              <img
                src={images[0]}
                alt={name ?? ""}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-7xl font-bold text-primary/20">
                {name?.charAt(0) ?? "?"}
              </div>
            )}
          </div>
        </div>

        <section className="py-2">
          <div className="flex flex-wrap gap-2 text-sm font-medium text-primary">
            <span>{product.categoryName || "—"}</span>
            <span>·</span>
            <span>{product.branchName || "—"}</span>
          </div>
          <h2 className="mt-3 text-4xl font-bold tracking-tight">
            {name || "—"}
          </h2>
          <p className="mt-3 text-sm font-medium text-primary">
            ★ {product.ratingAvg?.toFixed(1) ?? "0.0"} ·{" "}
            {product.ratingCount ?? 0}
          </p>
          <div className="mt-7 flex items-baseline gap-3">
            <strong className="text-3xl">
              {price == null ? "—" : `${formatter.format(price)} so'm`}
            </strong>
            {(product.discountPercent ?? 0) > 0 ? (
              <span className="text-lg text-muted-foreground line-through">
                {`${formatter.format(product.basePrice ?? 0)} so'm`}
              </span>
            ) : null}
          </div>
          {description ? (
            <div
              className="prose prose-sm dark:prose-invert mt-8 max-w-none text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : null}

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold">{t("product.variants")}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(product.variants ?? []).map((variant, index) => (
                <div
                  key={variant.id ?? index}
                  className="rounded-2xl border bg-muted/30 p-4"
                >
                  <p className="font-medium">
                    {[variant.colorName, variant.sizeValue]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                    <span>
                      {t("product.stock")}: {variant.stock ?? 0}
                    </span>
                    <span>
                      {`${formatter.format(variant.effectivePrice ?? variant.price ?? product.basePrice ?? 0)} so'm`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
