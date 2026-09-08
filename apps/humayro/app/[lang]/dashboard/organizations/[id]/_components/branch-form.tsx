"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { type BranchDTO } from "@/lib/api"
import {
  getGetAll6QueryKey as getBranchesQueryKey,
  useCreate6 as useCreateBranch,
  useUpdate6 as useUpdateBranch,
} from "@/lib/api/generated/branch/branch"
import { LocationPickerDialog } from "../../_components/maps/location-picker-dialog"
import { Button } from "@workspace/ui/components/button"
import { DialogFooter } from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import { CategoryField } from "./category-field"
const branchSchema = z.object({
  name: z.string().trim().min(1, "Branch name is required."),
  phone: z.string().trim(),
  address: z.string().trim(),
  active: z.boolean(),
})

type BranchFormValues = z.infer<typeof branchSchema>
const emptyBranch: BranchFormValues = {
  name: "",
  phone: "",
  address: "",
  active: true,
}

function getBranchValues(branch?: BranchDTO): BranchFormValues {
  return {
    name: branch?.name ?? "",
    phone: branch?.phone ?? "",
    address: branch?.address ?? "",
    active: branch?.active ?? true,
  }
}

export function BranchForm({
  branch,
  organizationId,
  onComplete,
}: {
  branch?: BranchDTO
  organizationId: number
  onComplete: () => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const create = useCreateBranch()
  const update = useUpdateBranch()
  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: branch ? getBranchValues(branch) : emptyBranch,
  })
  const editing = branch?.id !== undefined

  async function submit(values: BranchFormValues) {
    const data = {
      name: values.name,
      organizationId,
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.address ? { address: values.address } : {}),
    }

    try {
      if (editing && branch.id !== undefined) {
        await update.mutateAsync({
          id: branch.id,
          data: { ...data, active: values.active },
        })
      } else {
        await create.mutateAsync({ data })
      }
      await queryClient.invalidateQueries({
        queryKey: getBranchesQueryKey({ organizationId }),
      })
      toast.success(
        t(
          editing
            ? "notifications.updateSuccess"
            : "notifications.createSuccess"
        )
      )
      onComplete()
    } catch {
      toast.error(
        t(editing ? "notifications.updateFailed" : "notifications.createFailed")
      )
    }
  }

  return (
    <form
      className="grid gap-7"
      onSubmit={form.handleSubmit(submit)}
      noValidate
    >
      <CategoryField
        label={t("branch.name")}
        error={form.formState.errors.name?.message}
      >
        <Input placeholder={t("branch.name")} {...form.register("name")} />
      </CategoryField>
      <CategoryField
        label={t("branch.phone")}
        error={form.formState.errors.phone?.message}
      >
        <Controller
          control={form.control}
          name="phone"
          render={({ field }) => (
            <PhoneInput value={field.value} onChange={field.onChange} />
          )}
        />
      </CategoryField>
      <CategoryField
        label={t("branch.address")}
        error={form.formState.errors.address?.message}
      >
        <div className="flex gap-2">
          <Input
            placeholder={t("branch.address")}
            {...form.register("address")}
          />
          <LocationPickerDialog
            onSelect={(address) =>
              form.setValue("address", address, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </CategoryField>
      {editing ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="size-4"
            {...form.register("active")}
          />
          {t("branch.active")}
        </label>
      ) : null}
      <DialogFooter>
        <Button type="submit" disabled={create.isPending || update.isPending}>
          {editing ? t("branch.save") : t("branch.create")}
        </Button>
      </DialogFooter>
    </form>
  )
}
