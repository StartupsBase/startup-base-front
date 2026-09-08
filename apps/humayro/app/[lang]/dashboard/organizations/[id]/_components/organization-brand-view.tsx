"use client"

import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import type {
  OrganizationAdvertisementRequest,
  OrganizationAdvertisementResponse,
  OrganizationDTO,
} from "@/lib/api"

import { Add01Icon, Video01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

import { AdvertisementCard } from "./advertisement-card"
import { AdvertisementForm } from "./advertisement-form"
import { useOrganizationAdvertisements } from "./use-organization-advertisements"

interface OrganizationBrandViewProps {
  organizationId: number
  organization: OrganizationDTO
}

export function OrganizationBrandView({
  organizationId,
  organization,
}: OrganizationBrandViewProps) {
  const { t } = useTranslation()

  const [page, setPage] = useState(0)

  const [editor, setEditor] = useState<
    OrganizationAdvertisementResponse | "new" | null
  >(null)

  const [deleting, setDeleting] =
    useState<OrganizationAdvertisementResponse | null>(null)

  const [deleteError, setDeleteError] = useState(false)

  const [now, setNow] = useState(() => Date.now())

  const { query, create, update, remove } =
    useOrganizationAdvertisements(organizationId, page)

  const busy = create.isPending || update.isPending

  const advertisements = query.data?.content ?? []

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 60_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const save = async (data: OrganizationAdvertisementRequest) => {
    try {
      if (editor === "new") {
        await create.mutateAsync({data})

        toast.success(t("advertisement.created"))
      } else if (editor) {
        await update.mutateAsync({
          id: editor?.id as number,
          data,
        })

        toast.success(t("advertisement.updated"))
      }

      setEditor(null)
    } catch {
      toast.error(t("advertisement.saveFailed"))
    }
  }

  const deleteAdvertisement = async () => {
    if (!deleting) {
      return
    }

    setDeleteError(false)

    try {
      await remove.mutateAsync({ id: deleting?.id as number })

      toast.success(t("advertisement.deleted"))
      setDeleting(null)

      // If the last item on the current page was removed,
      // move back one page when possible.
      if (advertisements.length === 1 && page > 0) {
        setPage((currentPage) => currentPage - 1)
      }
    } catch {
      setDeleteError(true)
    }
  }

  if (editor !== null) {
    return (
      <section
        className="space-y-6"
        aria-label={t("advertisement.editor")}
      >
        <header className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {organization.name} / {t("advertisement.tab")}
          </p>

          <h2 className="text-2xl font-semibold tracking-tight">
            {t(
              editor === "new"
                ? "advertisement.create"
                : "advertisement.edit"
            )}
          </h2>

          <p className="text-sm text-muted-foreground">
            {t("advertisement.formDescription")}
          </p>
        </header>

        <AdvertisementForm
          key={editor === "new" ? "new" : editor.id}
          organizationId={organizationId}
          advertisement={editor === "new" ? undefined : editor}
          pending={busy}
          onSave={save}
          onCancel={() => setEditor(null)}
        />
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("advertisement.library")}
            </h2>

            {query.data?.totalElements !== undefined && (
              <Badge variant="secondary">
                {query.data.totalElements}
              </Badge>
            )}
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            {t("advertisement.libraryDescription")}
          </p>
        </div>

        <Button onClick={() => setEditor("new")}>
          <HugeiconsIcon icon={Add01Icon} />
          {t("advertisement.create")}
        </Button>
      </header>

      {query.isLoading ? (
        <div
          className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
          role="status"
          aria-label={t("advertisement.loading")}
        >
          {[1, 2, 3].map((item) => (
            <Card key={item}>
              <CardContent className="space-y-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : query.isError ? (
        <Alert variant="destructive">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            {t("advertisement.loadFailed")}

            <Button
              variant="outline"
              onClick={() => void query.refetch()}
            >
              {t("advertisement.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      ) : advertisements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                icon={Video01Icon}
                className="size-7 text-muted-foreground"
              />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-lg font-semibold">
                {t("advertisement.empty")}
              </h3>

              <p className="text-sm leading-6 text-muted-foreground">
                {t("advertisement.emptyHint")}
              </p>
            </div>

            <Button
              variant="outline"
              onClick={() => setEditor("new")}
            >
              <HugeiconsIcon icon={Add01Icon} />
              {t("advertisement.create")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {advertisements.map((advertisement) => (
            <AdvertisementCard
              key={advertisement.id}
              advertisement={advertisement}
              now={now}
              onEdit={() => setEditor(advertisement)}
              onDelete={() => {
                setDeleteError(false)
                setDeleting(advertisement)
              }}
            />
          ))}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
        <p className="text-xs text-muted-foreground">
          {t("advertisement.timezone")}
        </p>

        {(query.data?.totalPages ?? 0) > 1 || page > 0 ? (
          <nav
            aria-label={t("advertisement.pagination")}
            className="flex items-center gap-3"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0 || query.isFetching}
              onClick={() =>
                setPage((currentPage) => Math.max(0, currentPage - 1))
              }
            >
              {t("advertisement.previous")}
            </Button>

            <span className="text-xs tabular-nums text-muted-foreground">
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
                query.data?.last !== false
              }
              onClick={() =>
                setPage((currentPage) => currentPage + 1)
              }
            >
              {t("advertisement.next")}
            </Button>
          </nav>
        ) : null}
      </footer>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) {
            setDeleting(null)
            setDeleteError(false)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("advertisement.deleteTitle")}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {t("advertisement.deleteDescription", {
                title:
                  deleting?.title ||
                  t("advertisement.untitled"),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertDescription>
                {t("advertisement.deleteFailed")}
              </AlertDescription>
            </Alert>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t("advertisement.cancel")}
            </AlertDialogCancel>

            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={(event) => {
                event.preventDefault()
                void deleteAdvertisement()
              }}
            >
              {t(
                remove.isPending
                  ? "advertisement.deleting"
                  : "advertisement.delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}