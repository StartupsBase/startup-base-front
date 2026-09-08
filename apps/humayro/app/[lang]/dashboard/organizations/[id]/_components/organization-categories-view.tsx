"use client"

import { Add01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { BulkCategoryForm } from "./bulk-category-form"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { useOrganizationCategories } from "./use-organization-categories"
import { CategoryForm } from "./category-form"
import { CategoryHierarchyList } from "./category-hierarchy-list"
export function OrganizationCategoriesView({
  organizationId,
}: {
  organizationId: number
}) {
  const { t } = useTranslation()
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkCreateOpen, setBulkCreateOpen] = useState(false)
  const {
    categoriesQuery,
    categories,
    orderedCategories,
    moveCategory,
    reorderCategorySiblings,
    moveCategoryToParent,
  } = useOrganizationCategories(organizationId)
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        {" "}
        <div className="flex flex-wrap gap-2">
          <Dialog open={bulkCreateOpen} onOpenChange={setBulkCreateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <HugeiconsIcon icon={Add01Icon} />
                {t("category.bulkNew")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
              <DialogHeader>
                <DialogTitle>{t("category.bulkTitle")}</DialogTitle>
                <DialogDescription>
                  {t("category.bulkDescription")}
                </DialogDescription>
              </DialogHeader>
              <BulkCategoryForm
                organizationId={organizationId}
                categories={categories}
                onComplete={() => setBulkCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>{t("category.new")}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
              <DialogHeader>
                <DialogTitle>{t("category.new")}</DialogTitle>
                <DialogDescription>
                  {t("category.createDescription")}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm
                organizationId={organizationId}
                categories={categories}
                onComplete={() => setCreateOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>{" "}
      {categoriesQuery.isLoading ? (
        <p className="text-muted-foreground">{t("category.loading")}</p>
      ) : categoriesQuery.isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
          {t("category.loadFailed")}
        </div>
      ) : (
        <CategoryHierarchyList
          categories={orderedCategories}
          disabled={moveCategory.isPending}
          onReorder={reorderCategorySiblings}
          onMoveToParent={moveCategoryToParent}
        />
      )}
    </div>
  )
}
