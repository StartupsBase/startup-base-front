"use client"

import { PencilEdit02Icon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { type BranchDTO } from "@/lib/api"
import {
  getGetAll6QueryKey as getBranchesQueryKey,
  useDelete5 as useDeleteBranch,
} from "@/lib/api/generated/branch/branch"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { BranchForm } from "./branch-form"
export function BranchActions({
  branch,
  organizationId,
}: {
  branch: BranchDTO
  organizationId: number
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const removeBranch = useDeleteBranch()
  const [editOpen, setEditOpen] = useState(false)

  async function remove() {
    if (branch.id === undefined) return
    try {
      await removeBranch.mutateAsync({ id: branch.id })
      await queryClient.invalidateQueries({
        queryKey: getBranchesQueryKey({ organizationId }),
      })
      toast.success(t("notifications.deleteSuccess"))
    } catch {
      toast.error(t("notifications.deleteFailed"))
    }
  }

  return (
    <div className="flex justify-end gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("branch.edit")}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              className="size-5 lg:hidden"
            />
            <span className="hidden lg:inline">{t("branch.edit")}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[94vh] overflow-y-auto sm:max-w-[min(94vw,1000px)]">
          <DialogHeader>
            <DialogTitle>{t("branch.edit")}</DialogTitle>
            <DialogDescription>{branch.name}</DialogDescription>
          </DialogHeader>
          <BranchForm
            branch={branch}
            organizationId={organizationId}
            onComplete={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="destructive"
            size="sm"
            className="size-10 p-0 lg:h-8 lg:w-auto lg:px-3"
            aria-label={t("branch.delete")}
          >
            <HugeiconsIcon icon={Trash} className="size-5 lg:hidden" />
            <span className="hidden lg:inline">{t("branch.delete")}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="grid w-64 gap-3">
          <p className="text-sm">{t("branch.deleteConfirm")}</p>
          <Button
            variant="destructive"
            size="sm"
            disabled={removeBranch.isPending}
            onClick={remove}
          >
            {t("branch.delete")}
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
