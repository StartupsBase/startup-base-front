"use client"

import * as React from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
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
import { ImageCropInput } from "./image-crop-input"
import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"
import { Input } from "@/components/input"
import { Button } from "@workspace/ui/components/button"
import { PhoneInput } from "@workspace/ui/components/phone-input"

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
  const setUser = useAuthStore((state) => state.setUser)
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

  return (
    <div className="mx-auto w-full max-w-3xl p-6 md:p-10">
      <DashboardBreadcrumb
        language={language}
        items={[{ label: t("profile.title") }]}
      />
      <div className="mt-6 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {t("profile.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("profile.description")}
        </p>
      </div>

      <form
        className="space-y-6 rounded-3xl border border-border bg-card p-6"
        onSubmit={form.handleSubmit(submit)}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-semibold">
            {photoUrl ? (
              <img src={photoUrl} alt="" className="size-full object-cover" />
            ) : (
              (meQuery.data.firstname?.slice(0, 1) ?? "?")
            )}
          </div>
          <Field label={t("profile.photo")}>
            <ImageCropInput disabled={pending} onChange={setPhoto} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("profile.firstname")}
            error={
              form.formState.errors.firstname && t("profile.errors.required")
            }
          >
            <Input autoComplete="given-name" {...form.register("firstname")} />
          </Field>
          <Field
            label={t("profile.lastname")}
            error={
              form.formState.errors.lastname && t("profile.errors.required")
            }
          >
            <Input autoComplete="family-name" {...form.register("lastname")} />
          </Field>
        </div>

        <Field label={t("profile.email")} hint={t("profile.emailHint")}>
          <Input value={meQuery.data.email ?? ""} disabled readOnly />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("profile.phone")}
            error={form.formState.errors.phone && t("profile.errors.phone")}
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
          <Field
            label={t("profile.age")}
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
        </div>

        <Field label={t("profile.gender")}>
          <select
            className="flex h-11 w-full rounded-4xl border border-input bg-input/30 px-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            {...form.register("gender")}
          >
            <option value="">{t("profile.genderUnspecified")}</option>
            <option value="MALE">{t("profile.male")}</option>
            <option value="FEMALE">{t("profile.female")}</option>
          </select>
        </Field>

        {saved ? (
          <p className="text-sm text-emerald-600">{t("profile.saved")}</p>
        ) : null}
        {submitError ? (
          <p className="text-sm text-destructive">{t("profile.saveFailed")}</p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? t("profile.saving") : t("profile.save")}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({
  children,
  error,
  hint,
  label,
}: {
  children: React.ReactNode
  error?: string | false
  hint?: string
  label: string
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs text-muted-foreground">{hint}</span>
      ) : null}
      {error ? (
        <span className="block text-xs text-destructive">{error}</span>
      ) : null}
    </label>
  )
}
