"use client"

import { PencilEdit02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import { OrganizationForm } from "../../_components/organization-form"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import type { OrganizationDTO } from "@/lib/api"
export function OrganizationOverview({
  organization,
}: {
  organization: OrganizationDTO
}) {
  const { t } = useTranslation()
  const [editOrganizationOpen, setEditOrganizationOpen] = useState(false)
  return (
    <>
      {" "}
      <header className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-3xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted text-2xl font-semibold text-muted-foreground md:size-24">
            {organization?.logo?.s3Url ? (
              <img
                src={organization.logo.s3Url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              (organization?.name ?? "?").slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-primary">
                {t("dashboard.organizations")}
              </p>
              {organization ? (
                <>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      organization.active === false
                        ? "bg-muted text-muted-foreground"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    {organization.active === false
                      ? t("organization.inactive")
                      : t("organization.active")}
                  </span>
                  <Dialog
                    open={editOrganizationOpen}
                    onOpenChange={setEditOrganizationOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full px-3"
                      >
                        <HugeiconsIcon
                          icon={PencilEdit02Icon}
                          className="size-4"
                        />
                        {t("organization.edit")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
                      <DialogHeader>
                        <DialogTitle>{t("organization.edit")}</DialogTitle>
                        <DialogDescription>
                          {t("organization.editDescription")}
                        </DialogDescription>
                      </DialogHeader>
                      <OrganizationForm
                        organization={organization}
                        onComplete={() => setEditOrganizationOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </>
              ) : null}
            </div>
            <h1 className="mt-1 truncate text-3xl font-semibold tracking-tight">
              {organization?.name ?? t("organization.loadingDetails")}
            </h1>
            {organization?.description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {organization.description}
              </p>
            ) : null}
          </div>
        </div>
      </header>
      {organization ? (
        <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <OrganizationInfo
            label={t("organization.contactPerson")}
            value={organization.contactPerson}
          />
          <OrganizationInfo
            label={t("organization.contact")}
            value={
              [
                organization.contactEmail,
                organization.contactPhone
                  ? formatPhoneNumberInternal(organization.contactPhone)
                  : undefined,
              ]
                .filter(Boolean)
                .join(" · ") || undefined
            }
          />
          <OrganizationInfo label="INN" value={organization.inn} />
          <OrganizationInfo
            label={t("organization.address")}
            value={organization.address}
          />
          <OrganizationInfo
            label={t("organization.latitude")}
            value={
              typeof organization.latitude === "number"
                ? organization.latitude.toFixed(6)
                : undefined
            }
          />
          <OrganizationInfo
            label={t("organization.longitude")}
            value={
              typeof organization.longitude === "number"
                ? organization.longitude.toFixed(6)
                : undefined
            }
          />
        </section>
      ) : null}
    </>
  )
}
function OrganizationInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium break-words">{value || "—"}</p>
    </div>
  )
}
