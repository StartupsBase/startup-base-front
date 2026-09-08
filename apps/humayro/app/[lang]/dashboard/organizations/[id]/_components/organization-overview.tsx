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
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@workspace/ui/components/avatar"
import { Badge } from "@workspace/ui/components/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
export function OrganizationOverview({
  organization,
}: {
  organization: OrganizationDTO
}) {
  const { t } = useTranslation()
  const [editOrganizationOpen, setEditOrganizationOpen] = useState(false)
  return (
    <header className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar className="size-14 rounded-2xl">
            <AvatarImage
              src={organization.logo?.s3Url}
              alt=""
              className="object-cover"
            />
            <AvatarFallback className="rounded-2xl text-xl">
              {(organization.name ?? "?").slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {organization.name}
              </h1>
              <Badge
                variant={
                  organization.active === false ? "secondary" : "outline"
                }
              >
                {t(
                  organization.active === false
                    ? "organization.inactive"
                    : "organization.active"
                )}
              </Badge>
            </div>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {organization.description ||
                t("advertisement.organizationWorkspace")}
            </p>
          </div>
        </div>
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
              <HugeiconsIcon icon={PencilEdit02Icon} className="size-4" />
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
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="details" className="border-b-0">
          <AccordionTrigger className="justify-start gap-2 py-2 text-xs text-muted-foreground">
            {t("advertisement.organizationDetails")}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-5 rounded-xl bg-muted/30 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {" "}
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </header>
  )
}
function OrganizationInfo({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm break-words">{value || "—"}</p>
    </div>
  )
}
