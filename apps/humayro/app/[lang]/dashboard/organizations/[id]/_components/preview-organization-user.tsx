"use client"

import { type UserDTO } from "@/lib/api"
import { formatPhoneNumberInternal } from "@/lib/format-phone-number"
import {
  ArrowUpRight01Icon,
  Building03Icon,
  Call02Icon,
  Cancel01Icon,
  EyeIcon,
  Location01Icon,
  Mail01Icon,
  TelegramIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useState,
} from "react"
import { useTranslation } from "react-i18next"

interface Props {
  user: UserDTO
  modal: { open: boolean; setOpen: Dispatch<SetStateAction<boolean>> }
  trigger?: ReactNode
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium wrap-anywhere">{children}</dd>
    </div>
  )
}

export function OrganizationUserPreviewAction({ user }: { user: UserDTO }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <PreviewOrganizationUserModal
      user={user}
      modal={{ open, setOpen }}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("dashboard.userPreview.view")}
          title={t("dashboard.userPreview.view")}
        >
          <HugeiconsIcon icon={EyeIcon} aria-hidden="true" />
        </Button>
      }
    />
  )
}

export default function PreviewOrganizationUserModal({
  user,
  modal: { open, setOpen },
  trigger,
}: Props) {
  const { t, i18n } = useTranslation()
  const missing = (
    <span className="font-normal text-muted-foreground">
      {t("dashboard.userPreview.notProvided")}
    </span>
  )
  const name = [user.firstname?.trim(), user.lastname?.trim()]
    .filter(Boolean)
    .join(" ")
  const initials = [user.firstname, user.lastname]
    .map((part) => Array.from(part?.trim() ?? "")[0] ?? "")
    .join("")
    .toLocaleUpperCase()
  const email = user.email?.trim()
  const phone = user.phone?.trim()
  const telegram = user.telegramUsername?.trim().replace(/^@+/, "")
  const roles = [
    ...new Set(user.roles?.map((role) => role.trim()).filter(Boolean)),
  ]
  const locale = i18n.resolvedLanguage?.startsWith("ru") ? "ru-RU" : "uz-UZ"
  const birthDate = user.dateOfBirth ? new Date(user.dateOfBirth) : null
  const formattedBirthDate =
    birthDate && !Number.isNaN(birthDate.getTime())
      ? new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        }).format(birthDate)
      : null
  const latitude =
    typeof user.latitude === "number" &&
    Number.isFinite(user.latitude) &&
    Math.abs(user.latitude) <= 90
      ? user.latitude
      : null
  const longitude =
    typeof user.longitude === "number" &&
    Number.isFinite(user.longitude) &&
    Math.abs(user.longitude) <= 180
      ? user.longitude
      : null
  const contacts = [
    {
      label: t("dashboard.email"),
      value: email,
      href: email ? `mailto:${email}` : undefined,
      icon: Mail01Icon,
    },
    {
      label: t("dashboard.phone"),
      value: phone ? formatPhoneNumberInternal(phone) : undefined,
      href: phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : undefined,
      icon: Call02Icon,
    },
    {
      label: t("dashboard.userPreview.telegram"),
      value: telegram ? `@${telegram}` : undefined,
      href:
        telegram && /^[a-zA-Z0-9_]+$/.test(telegram)
          ? `https://t.me/${telegram}`
          : undefined,
      icon: TelegramIcon,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <div className="relative shrink-0 overflow-hidden border-b bg-primary/5 px-6 pt-6 pb-7 sm:px-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full border-[36px] border-primary/5"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-12 -bottom-24 size-48 rounded-full border border-primary/10"
          />
          <div className="relative mb-6 flex min-h-8 items-center justify-between gap-3 pr-10">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              {t("dashboard.userPreview.title")}
            </p>
            {user.id != null && (
              <span className="rounded-full border border-primary/10 bg-background/60 px-2.5 py-1 font-mono text-xs text-muted-foreground">
                ID {user.id}
              </span>
            )}
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-6 right-5 rounded-full bg-background/60 sm:right-7"
              aria-label={t("dashboard.userPreview.close")}
            >
              <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
            </Button>
          </DialogClose>
          <div className="relative flex items-center gap-4 sm:gap-5">
            <Avatar className="size-20 shadow-sm ring-4 ring-background sm:size-24">
              <AvatarImage
                src={user.photo?.s3Url}
                alt={name || t("dashboard.profilePhoto")}
              />
              <AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary sm:text-3xl">
                {initials || (
                  <HugeiconsIcon
                    icon={UserCircleIcon}
                    className="size-9"
                    aria-hidden="true"
                  />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2.5">
              <DialogTitle className="text-2xl leading-tight font-semibold tracking-tight wrap-anywhere sm:text-3xl">
                {name || t("dashboard.userPreview.unnamed")}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {t("dashboard.userPreview.description")}
              </DialogDescription>
              <div
                className="flex flex-wrap gap-1.5"
                aria-label={t("dashboard.roles")}
              >
                {roles.length ? (
                  roles.map((role) => (
                    <span
                      key={role}
                      className="max-w-full rounded-full border border-primary/15 bg-background/70 px-2.5 py-1 text-[11px] font-medium wrap-anywhere text-primary"
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("dashboard.userPreview.noRoles")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
          <section
            className="space-y-3"
            aria-label={t("dashboard.userPreview.contact")}
          >
            <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">
              {t("dashboard.userPreview.contact")}
            </h3>
            <div className="grid gap-2 sm:grid-cols-3">
              {contacts.map(({ label, value, href, icon }) => {
                const content = (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex size-9 items-center justify-center rounded-xl border bg-background text-primary">
                        <HugeiconsIcon
                          icon={icon}
                          className="size-4"
                          aria-hidden="true"
                        />
                      </span>
                      {href && (
                        <HugeiconsIcon
                          icon={ArrowUpRight01Icon}
                          className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      {label}
                    </p>
                    <p className="text-sm font-medium wrap-anywhere">
                      {value || missing}
                    </p>
                  </>
                )
                return href ? (
                  <a
                    key={label}
                    href={href}
                    {...(href.startsWith("https:")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group min-w-0 rounded-2xl border bg-muted/20 p-3.5 transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    {content}
                  </a>
                ) : (
                  <div
                    key={label}
                    className="min-w-0 rounded-2xl border bg-muted/20 p-3.5"
                  >
                    {content}
                  </div>
                )
              })}
            </div>
          </section>

          <section
            className="rounded-2xl border p-4 sm:p-5"
            aria-label={t("profile.personalData")}
          >
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <HugeiconsIcon
                icon={UserCircleIcon}
                className="size-4 text-primary"
                aria-hidden="true"
              />
              {t("profile.personalData")}
            </h3>
            <dl className="grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-3">
              <Detail label={t("profile.firstname")}>
                {user.firstname?.trim() || missing}
              </Detail>
              <Detail label={t("profile.lastname")}>
                {user.lastname?.trim() || missing}
              </Detail>
              <Detail label={t("profile.gender")}>
                {user.gender === "MALE"
                  ? t("profile.male")
                  : user.gender === "FEMALE"
                    ? t("profile.female")
                    : missing}
              </Detail>
              <Detail label={t("dashboard.userPreview.dateOfBirth")}>
                {formattedBirthDate || missing}
              </Detail>
              <Detail label={t("profile.age")}>
                {user.age != null && Number.isFinite(user.age) && user.age >= 0
                  ? user.age
                  : missing}
              </Detail>
            </dl>
          </section>

          <section
            className="rounded-2xl border p-4 sm:p-5"
            aria-label={t("dashboard.userPreview.organization")}
          >
            <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold">
              <HugeiconsIcon
                icon={Building03Icon}
                className="size-4 text-primary"
                aria-hidden="true"
              />
              {t("dashboard.userPreview.organization")}
            </h3>
            <dl className="grid grid-cols-2 gap-5">
              <Detail label={t("dashboard.userPreview.organization")}>
                {user.organizationName?.trim() || missing}
                {user.organizationId != null && (
                  <span className="mt-1 block font-mono text-xs font-normal text-muted-foreground">
                    ID {user.organizationId}
                  </span>
                )}
              </Detail>
              <Detail label={t("dashboard.userPreview.branch")}>
                {user.branchName?.trim() || missing}
                {user.branchId != null && (
                  <span className="mt-1 block font-mono text-xs font-normal text-muted-foreground">
                    ID {user.branchId}
                  </span>
                )}
              </Detail>
            </dl>
          </section>

          <section
            className="rounded-2xl border bg-muted/20 p-4 sm:p-5"
            aria-label={t("dashboard.userPreview.location")}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <HugeiconsIcon
                  icon={Location01Icon}
                  className="size-4 text-primary"
                  aria-hidden="true"
                />
                {t("dashboard.userPreview.location")}
              </h3>
              {latitude != null && longitude != null && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("dashboard.userPreview.openMap")}
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      aria-hidden="true"
                    />
                  </a>
                </Button>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-5">
              <Detail label={t("dashboard.userPreview.latitude")}>
                {latitude != null ? (
                  <span className="font-mono text-xs">{latitude}</span>
                ) : (
                  missing
                )}
              </Detail>
              <Detail label={t("dashboard.userPreview.longitude")}>
                {longitude != null ? (
                  <span className="font-mono text-xs">{longitude}</span>
                ) : (
                  missing
                )}
              </Detail>
            </dl>
          </section>
        </div>

        <div className="flex shrink-0 justify-end border-t bg-muted/20 px-6 py-4 sm:px-8">
          <DialogClose asChild>
            <Button variant="outline" className="min-w-24">
              {t("dashboard.userPreview.close")}
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
