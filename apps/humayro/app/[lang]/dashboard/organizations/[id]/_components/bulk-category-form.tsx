"use client"

import { Add01Icon, Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type { CategoryDTO } from "@/lib/api"
import {
  getGetAll4QueryKey,
  useCreateBulk1,
} from "@/lib/api/generated/category/category"
import { Button } from "@workspace/ui/components/button"
import { DialogFooter } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

const rootCategory = "__root_category__"
const maxBulkCategories = 25

type CategoryDraft = {
  id: string
  name: string
  nameEng: string
  nameRu: string
  parentId: string
  sizeType: "LETTER" | "NUMBER"
  sortOrder: number
}

function createDraft(
  sortOrder: number,
  id = crypto.randomUUID()
): CategoryDraft {
  return {
    id,
    name: "",
    nameEng: "",
    nameRu: "",
    parentId: "",
    sizeType: "LETTER",
    sortOrder,
  }
}

export function BulkCategoryForm({
  categories,
  onComplete,
  organizationId,
}: {
  categories: CategoryDTO[]
  onComplete: () => void
  organizationId: number
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const createBulk = useCreateBulk1()
  const [drafts, setDrafts] = useState<CategoryDraft[]>(() => [
    createDraft(0, "initial"),
  ])
  const [submitted, setSubmitted] = useState(false)
  const normalizedNames = drafts.map((draft) =>
    draft.name.trim().toLocaleLowerCase()
  )

  function updateDraft(id: string, patch: Partial<CategoryDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft))
    )
  }

  function addDraft() {
    if (drafts.length >= maxBulkCategories) {
      toast.error(t("category.bulkLimit", { count: maxBulkCategories }))
      return
    }

    const nextSortOrder =
      Math.max(-1, ...drafts.map((draft) => draft.sortOrder)) + 1
    setDrafts((current) => [...current, createDraft(nextSortOrder)])
  }

  function removeDraft(id: string) {
    setDrafts((current) => current.filter((draft) => draft.id !== id))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)

    const hasEmptyName = normalizedNames.some((name) => !name)
    const hasDuplicateName = normalizedNames.some(
      (name, index) => name && normalizedNames.indexOf(name) !== index
    )

    if (hasEmptyName) {
      toast.error(t("category.bulkNameRequired"))
      return
    }
    if (hasDuplicateName) {
      toast.error(t("category.bulkDuplicate"))
      return
    }

    try {
      await createBulk.mutateAsync({
        data: drafts.map((draft) => ({
          name: draft.name.trim(),
          ...(draft.nameRu.trim() ? { nameRu: draft.nameRu.trim() } : {}),
          ...(draft.nameEng.trim() ? { nameEng: draft.nameEng.trim() } : {}),
          organizationId,
          ...(draft.parentId ? { parentId: Number(draft.parentId) } : {}),
          sizeType: draft.sizeType,
          sortOrder: draft.sortOrder,
        })),
      })
      await queryClient.invalidateQueries({ queryKey: getGetAll4QueryKey() })
      toast.success(t("category.bulkCreated", { count: drafts.length }))
      onComplete()
    } catch {
      toast.error(t("category.bulkFailed"))
    }
  }

  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="grid gap-3">
        {drafts.map((draft, index) => {
          const normalizedName = normalizedNames[index]
          const duplicate =
            normalizedName &&
            normalizedNames.filter((name) => name === normalizedName).length > 1

          return (
            <fieldset
              key={draft.id}
              className="grid gap-3 rounded-2xl border bg-muted/20 p-4"
            >
              <legend className="sr-only">
                {t("category.bulkItem", { number: index + 1 })}
              </legend>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">
                  {t("category.bulkItem", { number: index + 1 })}
                </p>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t("category.bulkRemoveRow")}
                  disabled={drafts.length === 1 || createBulk.isPending}
                  onClick={() => removeDraft(draft.id)}
                >
                  <HugeiconsIcon icon={Delete02Icon} />
                </Button>
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  {t("category.name")}
                  <Input
                    value={draft.name}
                    aria-invalid={Boolean(
                      submitted && (!normalizedName || duplicate)
                    )}
                    onChange={(event) =>
                      updateDraft(draft.id, { name: event.target.value })
                    }
                  />
                  {submitted && !normalizedName ? (
                    <span className="text-xs text-destructive">
                      {t("category.bulkNameRequired")}
                    </span>
                  ) : submitted && duplicate ? (
                    <span className="text-xs text-destructive">
                      {t("category.bulkDuplicate")}
                    </span>
                  ) : null}
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t("category.nameRu")}
                  <Input
                    value={draft.nameRu}
                    onChange={(event) =>
                      updateDraft(draft.id, { nameRu: event.target.value })
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t("category.nameEng")}
                  <Input
                    value={draft.nameEng}
                    onChange={(event) =>
                      updateDraft(draft.id, { nameEng: event.target.value })
                    }
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1.5 text-sm font-medium">
                  {t("category.sizeType")}
                  <Select
                    value={draft.sizeType}
                    onValueChange={(value) =>
                      updateDraft(draft.id, {
                        sizeType: value as CategoryDraft["sizeType"],
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LETTER">
                        {t("category.letter")}
                      </SelectItem>
                      <SelectItem value="NUMBER">
                        {t("category.number")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t("category.parent")}
                  <Select
                    value={draft.parentId || rootCategory}
                    onValueChange={(value) =>
                      updateDraft(draft.id, {
                        parentId: value === rootCategory ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={rootCategory}>
                        {t("category.root")}
                      </SelectItem>
                      {categories
                        .filter((category) => category.id !== undefined)
                        .map((category) => (
                          <SelectItem
                            key={category.id}
                            value={String(category.id)}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  {t("category.sortOrder")}
                  <Input
                    type="number"
                    min={0}
                    value={draft.sortOrder}
                    onChange={(event) =>
                      updateDraft(draft.id, {
                        sortOrder: Math.max(0, Number(event.target.value) || 0),
                      })
                    }
                  />
                </label>
              </div>
            </fieldset>
          )
        })}
      </div>

      {drafts.length < maxBulkCategories ? (
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          disabled={createBulk.isPending}
          onClick={addDraft}
        >
          <HugeiconsIcon icon={Add01Icon} />
          {t("category.bulkAddRow")}
        </Button>
      ) : null}

      <DialogFooter>
        <Button type="submit" disabled={createBulk.isPending}>
          {createBulk.isPending
            ? t("category.bulkSubmitting")
            : t("category.bulkSubmit", { count: drafts.length })}
        </Button>
      </DialogFooter>
    </form>
  )
}
