"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { isValidPhoneNumber } from "react-phone-number-input"
import { z } from "zod"

import { useMe1 } from "@/lib/api"
import { getMe1QueryKey } from "@/lib/api/generated/auth/auth"
import {
  getMeQueryKey,
  useUpdate2,
  useUploadPhoto1,
} from "@/lib/api/generated/profile/profile"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { clearAuthToken } from "@/lib/auth-client"
import { ImageCropInput } from "./image-crop-input"
import { Input } from "@/components/input"
import { Button } from "@workspace/ui/components/button"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

const GENDER_UNSPECIFIED = "__gender_unspecified__"

const profileSchema = z.object({
  firstname: z.string().trim().min(1),
  lastname: z.string().trim().min(1),
  phone: z.string().refine(isValidPhoneNumber),
  age: z.number().int().min(0).max(150).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
})

type ProfileValues = z.infer<typeof profileSchema>

export function ProfileForm({ language }: { language: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const updateProfile = useUpdate2()
  const uploadPhoto = useUploadPhoto1()
  const [photo, setPhoto] = React.useState<File | null>(null)
  const [submitError, setSubmitError] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const previewUrl = React.useMemo(
    () => (photo ? URL.createObjectURL(photo) : null),
    [photo]
  )
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstname: "",
      lastname: "",
      phone: "",
      age: undefined,
      gender: undefined,
    },
  })

  React.useEffect(() => {
    const user = meQuery.data

    if (!user) return

    form.reset({
      firstname: user.firstname ?? "",
      lastname: user.lastname ?? "",
      phone: user.phone ?? "",
      age: user.age,
      gender: user.gender,
    })
  }, [form, meQuery.data])

  React.useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    },
    [previewUrl]
  )

  async function submit(values: ProfileValues) {
    setSubmitError(false)
    setSaved(false)

    try {
      let user = await updateProfile.mutateAsync({ data: values })

      if (photo) {
        user = await uploadPhoto.mutateAsync({ data: { file: photo } })
        setPhoto(null)
      }

      setUser(user)
      queryClient.setQueryData(getMe1QueryKey(), user)
      queryClient.setQueryData(getMeQueryKey(), user)
      form.reset({
        firstname: user.firstname ?? "",
        lastname: user.lastname ?? "",
        phone: user.phone ?? "",
        age: user.age,
        gender: user.gender,
      })
      setSaved(true)
      toast.success(t("notifications.updateSuccess"))
    } catch {
      setSubmitError(true)
      toast.error(t("notifications.updateFailed"))
    }
  }

  function signOut() {
    clearAuthToken()
    clearUser()
    queryClient.clear()
    router.replace(`/${language}/login`)
  }

  if (meQuery.isLoading) {
    return (
      <p className="p-6 text-sm text-muted-foreground md:p-10">
        {t("profile.loading")}
      </p>
    )
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <p className="p-6 text-sm text-destructive md:p-10">
        {t("profile.loadFailed")}
      </p>
    )
  }

  const pending = updateProfile.isPending || uploadPhoto.isPending
  const photoUrl = previewUrl ?? meQuery.data.photo?.s3Url

  const navItems = [
    { label: t("profile.myData"), active: true },
    { label: t("profile.myAddress") },
    { label: t("profile.orders"), href: `/${language}/orders` },
    { label: t("profile.subscriptions") },
    { label: t("profile.notifications") },
    { label: t("profile.settings") },
    { label: t("profile.bonusSystem") },
  ]

  return (
    <div className="mx-auto box-border w-full max-w-full min-w-0 overflow-x-hidden px-4 pb-12 sm:px-6 lg:max-w-7xl lg:px-8">
      <div className="flex flex-col gap-5 border-b py-7 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("profile.title")}
        </h1>
        <label className="flex h-11 w-full max-w-full min-w-0 items-center gap-3 rounded-xl border bg-background px-4 text-muted-foreground lg:max-w-72">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-4 fill-none stroke-current"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
          <input
            type="search"
            placeholder={t("profile.search")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <div className="grid min-w-0 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="border-b py-5 lg:border-r lg:border-b-0 lg:pr-6">
          <nav className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0 [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => {
              const classes = `relative shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                item.active
                  ? "bg-primary/8 text-primary before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary"
                  : item.href
                    ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "cursor-not-allowed text-muted-foreground/60"
              }`

              return item.href ? (
                <Link key={item.label} href={item.href} className={classes}>
                  {item.label}
                </Link>
              ) : (
                <span key={item.label} className={classes}>
                  {item.label}
                </span>
              )
            })}
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 rounded-lg px-3 py-2 text-left text-sm font-medium text-destructive transition hover:bg-destructive/8 lg:mt-2"
            >
              {t("profile.signOut")}
            </button>
          </nav>
        </aside>

        <form
          className="box-border w-full max-w-full min-w-0 overflow-x-hidden py-7 lg:pl-8"
          onSubmit={form.handleSubmit(submit)}
        >
          <SectionHeading
            title={t("profile.personalData")}
            description={t("profile.description")}
          />

          <div className="divide-y border-y">
            <AccountRow label={t("profile.photo")} hint={t("profile.photo")}>
              <div className="flex min-w-0 flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-semibold">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    (meQuery.data.firstname?.slice(0, 1) ?? "?")
                  )}
                </div>
                <ImageCropInput disabled={pending} onChange={setPhoto} />
              </div>
            </AccountRow>

            <AccountRow
              label={t("profile.email")}
              hint={t("profile.emailHint")}
            >
              <Input value={meQuery.data.email ?? ""} disabled readOnly />
            </AccountRow>

            <AccountRow
              label={t("profile.firstname")}
              hint={t("profile.nameHint")}
            >
              <div className="grid w-full max-w-full min-w-0 gap-3 xl:grid-cols-2">
                <Field
                  error={
                    form.formState.errors.firstname &&
                    t("profile.errors.required")
                  }
                >
                  <Input
                    aria-label={t("profile.firstname")}
                    autoComplete="given-name"
                    {...form.register("firstname")}
                  />
                </Field>
                <Field
                  error={
                    form.formState.errors.lastname &&
                    t("profile.errors.required")
                  }
                >
                  <Input
                    aria-label={t("profile.lastname")}
                    autoComplete="family-name"
                    {...form.register("lastname")}
                  />
                </Field>
              </div>
            </AccountRow>

            <AccountRow label={t("profile.age")} hint={t("profile.ageHint")}>
              <Field
                error={form.formState.errors.age && t("profile.errors.age")}
              >
                <Controller
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <Input
                      ref={field.ref}
                      type="number"
                      min={0}
                      max={150}
                      inputMode="numeric"
                      name={field.name}
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? undefined
                            : event.target.valueAsNumber
                        )
                      }
                    />
                  )}
                />
              </Field>
            </AccountRow>

            <AccountRow
              label={t("profile.gender")}
              hint={t("profile.genderHint")}
            >
              <Controller
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <Select
                    value={field.value ?? GENDER_UNSPECIFIED}
                    onValueChange={(nextValue) =>
                      field.onChange(
                        nextValue === GENDER_UNSPECIFIED ? undefined : nextValue
                      )
                    }
                  >
                    <SelectTrigger
                      ref={field.ref}
                      aria-label={t("profile.gender")}
                      className="h-11 w-full rounded-xl bg-background px-4"
                      onBlur={field.onBlur}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GENDER_UNSPECIFIED}>
                        {t("profile.genderUnspecified")}
                      </SelectItem>
                      <SelectItem value="MALE">{t("profile.male")}</SelectItem>
                      <SelectItem value="FEMALE">
                        {t("profile.female")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </AccountRow>
          </div>

          <div className="mt-8">
            <SectionHeading
              title={t("profile.loginData")}
              description={t("profile.loginDataDescription")}
            />
            <div className="divide-y border-y">
              <AccountRow
                label={t("profile.phone")}
                hint={t("profile.phoneHint")}
              >
                <Field
                  error={
                    form.formState.errors.phone && t("profile.errors.phone")
                  }
                >
                  <Controller
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    )}
                  />
                </Field>
              </AccountRow>
              <AccountRow
                label={t("profile.password")}
                hint={t("profile.passwordHint")}
              >
                <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
                  <Input value="••••••••••" disabled readOnly />
                  <Link
                    href={`/${language}/forgot-password`}
                    className="text-sm font-medium break-words text-primary hover:underline xl:shrink-0"
                  >
                    {t("profile.changePassword")}
                  </Link>
                </div>
              </AccountRow>
            </div>
          </div>

          <div className="mt-5 flex flex-col items-end gap-3">
            {saved ? (
              <p className="text-sm text-emerald-600">{t("profile.saved")}</p>
            ) : null}
            {submitError ? (
              <p className="text-sm text-destructive">
                {t("profile.saveFailed")}
              </p>
            ) : null}
            <Button type="submit" disabled={pending} className="min-w-44">
              {pending ? t("profile.saving") : t("profile.save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({
  children,
  error,
}: {
  children: React.ReactNode
  error?: string | false
}) {
  return (
    <div className="block min-w-0 space-y-2">
      {children}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : null}
    </div>
  )
}

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mb-5 min-w-0">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-full text-sm break-words text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function AccountRow({
  children,
  hint,
  label,
}: {
  children: React.ReactNode
  hint: string
  label: string
}) {
  return (
    <div className="grid w-full max-w-full min-w-0 gap-4 py-5 xl:grid-cols-[minmax(150px,230px)_minmax(0,1fr)] xl:items-center">
      <div className="min-w-0">
        <p className="text-sm font-semibold break-words">{label}</p>
        <p className="mt-1 max-w-full text-xs leading-5 break-words text-muted-foreground xl:max-w-52">
          {hint}
        </p>
      </div>
      <div className="w-full max-w-full min-w-0 xl:max-w-xl">{children}</div>
    </div>
  )
}
