"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import type {
  OrganizationAdvertisementRequest,
  OrganizationAdvertisementResponse,
  OrganizationDTO,
} from "@/lib/api"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { AdvertisementCard } from "./advertisement-card"
import { AdvertisementForm } from "./advertisement-form"
import { useOrganizationAdvertisements } from "./use-organization-advertisements"

export function OrganizationBrandView({
  organizationId,
  organization,
}: {
  organizationId: number
  organization: OrganizationDTO
}) {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [editor, setEditor] = useState<
    OrganizationAdvertisementResponse | "new" | null
  >(null)
  const [deleting, setDeleting] =
    useState<OrganizationAdvertisementResponse | null>(null)
  const [deleteError, setDeleteError] = useState(false)
  const [now, setNow] = useState(Date.now)
  const { query, create, update, remove } = useOrganizationAdvertisements(
    organizationId,
    page
  )
  const busy = create.isPending || update.isPending
  const advertisements = query.data?.content ?? []

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  async function save(data: OrganizationAdvertisementRequest) {
    if (editor === "new") {
      await create.mutateAsync({ data })
      setPage(0)
    } else if (editor?.id !== undefined) {
      const { videoAttachmentId, title, redirectUrl, active, sortOrder, startsAt, endsAt } = data
      await update.mutateAsync({ id: editor.id, data: { videoAttachmentId, title, redirectUrl, active, sortOrder, startsAt, endsAt } })
    } else {
      throw new Error("Missing advertisement ID")
    }
    setEditor(null)
    toast.success(t("advertisement.saved"))
  }

  async function deleteAdvertisement() {
    if (deleting?.id === undefined || remove.isPending) return
    setDeleteError(false)
    try {
      await remove.mutateAsync({ id: deleting.id })
      if (advertisements.length === 1 && page > 0) setPage(page - 1)
      setDeleting(null)
      toast.success(t("advertisement.deleted"))
    } catch {
      setDeleteError(true)
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-5 md:p-7">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-wider text-primary uppercase">
            {organization.name}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {t("advertisement.heading")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("advertisement.description")}
          </p>
        </div>
        <Button onClick={() => setEditor("new")}>
          {t("advertisement.create")}
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">
          {t("advertisement.library")}
          {query.data?.totalElements !== undefined ? (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {query.data.totalElements}
            </span>
          ) : null}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t("advertisement.timezone")}
        </p>
      </div>
      {query.isLoading ? (
        <p
          role="status"
          className="py-12 text-center text-sm text-muted-foreground"
        >
          {t("advertisement.loading")}
        </p>
      ) : query.isError ? (
        <div
          role="alert"
          className="space-y-3 rounded-xl border border-destructive/30 p-5"
        >
          <p className="text-sm text-destructive">
            {t("advertisement.loadFailed")}
          </p>
          <Button variant="outline" onClick={() => void query.refetch()}>
            {t("advertisement.retry")}
          </Button>
        </div>
      ) : advertisements.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-16 text-center">
          <h3 className="text-lg font-semibold">{t("advertisement.empty")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {t("advertisement.emptyHint")}
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={() => setEditor("new")}
          >
            {t("advertisement.create")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {advertisements.map((ad) => (
            <AdvertisementCard
              key={ad.id}
              advertisement={ad}
              now={now}
              onEdit={() => setEditor(ad)}
              onDelete={() => {
                setDeleteError(false)
                setDeleting(ad)
              }}
            />
          ))}
        </div>
      )}
      {(query.data?.totalPages ?? 0) > 1 || page > 0 ? (
        <nav
          aria-label={t("advertisement.pagination")}
          className="flex items-center justify-end gap-3"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || query.isFetching}
            onClick={() => setPage(page - 1)}
          >
            {t("advertisement.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("advertisement.page", {
              current: page + 1,
              total: query.data?.totalPages ?? page + 1,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={
              query.isFetching ||
              query.isError ||
              (query.data?.last !== false &&
                page + 1 >= (query.data?.totalPages ?? 1))
            }
            onClick={() => setPage(page + 1)}
          >
            {t("advertisement.next")}
          </Button>
        </nav>
      ) : null}
      <Dialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEditor(null)
        }}
      >
        <DialogContent
          className="max-h-[92dvh] overflow-y-auto sm:max-w-4xl"
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            event.preventDefault()
          }}
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>
              {t(
                editor === "new" ? "advertisement.create" : "advertisement.edit"
              )}
            </DialogTitle>
            <DialogDescription>
              {t("advertisement.formDescription")}
            </DialogDescription>
          </DialogHeader>
          {editor !== null ? (
            <AdvertisementForm
              key={editor === "new" ? "new" : editor.id}
              organizationId={organizationId}
              advertisement={editor === "new" ? undefined : editor}
              pending={busy}
              onSave={save}
              onCancel={() => setEditor(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleting(null)
        }}
      >
        <DialogContent showCloseButton={!remove.isPending}>
          <DialogHeader>
            <DialogTitle>{t("advertisement.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("advertisement.deleteDescription", {
                title: deleting?.title || t("advertisement.untitled"),
              })}
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p role="alert" className="text-sm text-destructive">
              {t("advertisement.deleteFailed")}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={remove.isPending}
              onClick={() => setDeleting(null)}
            >
              {t("advertisement.cancel")}
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => void deleteAdvertisement()}
            >
              {t(
                remove.isPending
                  ? "advertisement.deleting"
                  : "advertisement.delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
