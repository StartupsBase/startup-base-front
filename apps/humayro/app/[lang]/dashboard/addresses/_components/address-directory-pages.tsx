"use client"

import { Add01Icon, Trash } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  useRef,
  useState,
  type FormEvent,
  type Key,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Input } from "@/components/input"
import { useInfiniteRegions } from "@/hooks/use-infinite-directory-query"
import { useLocalizedName } from "@/hooks/use-localized-name"
import type { DistrictCreateDTO, RegionCreateDTO, RegionDTO } from "@/lib/api"
import {
  getGetAll10QueryKey,
  useCreateBulk1 as useCreateDistricts,
  useGetAll10 as useDistricts,
} from "@/lib/api/generated/district/district"
import {
  getGetAll9QueryKey,
  useCreateBulk as useCreateRegions,
  useGetAll9 as useRegions,
} from "@/lib/api/generated/region/region"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { cn } from "@workspace/ui/lib/utils"
import { DashboardBreadcrumb } from "../../_components/dashboard-breadcrumb"

const PAGE_SIZE = 20
const REGION_OPTIONS_SIZE = 100

type RegionDraft = {
  fakturaRegionCode: string
  fakturaRegionId: string
  fakturaRegionName: string
  key: number
  name: string
  nameUz: string
}

type DistrictDraft = {
  fakturaDistrictCode: string
  fakturaDistrictName: string
  key: number
  name: string
  nameUz: string
  regionId: string
  soato: string
}

export function RegionsDirectoryPage({ language }: { language: string }) {
  const { t } = useTranslation()
  const { getLocalizedName } = useLocalizedName({
    defaultNameLanguage: "ru",
    language,
  })
  const queryClient = useQueryClient()
  const [page, setPage] = useState(FIRST_PAGE)
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const nextKey = useRef(2)
  const [drafts, setDrafts] = useState<RegionDraft[]>([createRegionDraft(1)])
  const regionsQuery = useRegions(
    {
      name: search || undefined,
      page: toApiPage(page),
      size: PAGE_SIZE,
    },
    {
      query: {
        placeholderData: (previous) => previous,
        retry: false,
      },
    }
  )
  const createRegions = useCreateRegions()

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(FIRST_PAGE)
    setSearch(searchDraft.trim())
  }

  async function submitRegions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: RegionCreateDTO[] = drafts.map((draft) => ({
      name: draft.name.trim(),
      nameUz: emptyToUndefined(draft.nameUz),
      fakturaRegionId: optionalNumber(draft.fakturaRegionId),
      fakturaRegionCode: optionalNumber(draft.fakturaRegionCode),
      fakturaRegionName: emptyToUndefined(draft.fakturaRegionName),
    }))

    if (payload.some((region) => !region.name)) {
      toast.error(t("addresses.validation.nameRequired"))
      return
    }

    try {
      const created = await createRegions.mutateAsync({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetAll9QueryKey() })
      toast.success(t("addresses.saved", { count: created.length }))
      setDrafts([createRegionDraft(nextKey.current++)])
      setDialogOpen(false)
    } catch {
      toast.error(t("addresses.saveFailed"))
    }
  }

  return (
    <AddressDirectoryLayout
      language={language}
      current="regions"
      description={t("addresses.regions.description")}
      title={t("addresses.regions.title")}
      action={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <HugeiconsIcon icon={Add01Icon} className="size-4!" />
              {t("addresses.regions.create")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <form onSubmit={submitRegions} className="space-y-5">
              <DialogHeader>
                <DialogTitle>{t("addresses.regions.create")}</DialogTitle>
                <DialogDescription>
                  {t("addresses.regions.createDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <RegionDraftFields
                    key={draft.key}
                    draft={draft}
                    index={index}
                    removable={drafts.length > 1}
                    onChange={(next) =>
                      setDrafts((current) =>
                        current.map((item) =>
                          item.key === draft.key ? next : item
                        )
                      )
                    }
                    onRemove={() =>
                      setDrafts((current) =>
                        current.filter((item) => item.key !== draft.key)
                      )
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDrafts((current) => [
                    ...current,
                    createRegionDraft(nextKey.current++),
                  ])
                }
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4!" />
                {t("addresses.addAnother")}
              </Button>
              <DialogFooter>
                <Button type="submit" disabled={createRegions.isPending}>
                  {createRegions.isPending
                    ? t("addresses.saving")
                    : t("addresses.saveAll", { count: drafts.length })}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      <DirectorySearch
        value={searchDraft}
        onChange={setSearchDraft}
        onSubmit={submitSearch}
        placeholder={t("addresses.regions.search")}
      />
      {regionsQuery.isLoading ? (
        <DirectoryMessage>{t("addresses.loading")}</DirectoryMessage>
      ) : regionsQuery.isError ? (
        <DirectoryError>{t("addresses.loadFailed")}</DirectoryError>
      ) : (
        <>
          <DirectoryTable
            headers={[
              t("addresses.fields.id"),
              t("addresses.fields.name"),
              t("addresses.districts.title"),
            ]}
            rows={(regionsQuery.data?.content ?? []).map((region) => ({
              cells: [
                region.id ?? "—",
                getLocalizedName(region),
                region.id === undefined ? null : (
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/${language}/dashboard/addresses/districts?regionId=${region.id}`}
                    >
                      {t("addresses.regions.viewDistricts")}
                    </Link>
                  </Button>
                ),
              ],
              key: region.id ?? `${region.name}-${region.nameUz}`,
            }))}
            emptyMessage={t("addresses.regions.empty")}
          />
          <DirectoryPagination
            page={page}
            totalElements={regionsQuery.data?.totalElements ?? 0}
            totalPages={regionsQuery.data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </AddressDirectoryLayout>
  )
}

export function DistrictsDirectoryPage({
  initialRegionId,
  language,
}: {
  initialRegionId?: number
  language: string
}) {
  const { t } = useTranslation()
  const { getLocalizedName } = useLocalizedName({
    defaultNameLanguage: "ru",
    language,
  })
  const queryClient = useQueryClient()
  const [page, setPage] = useState(FIRST_PAGE)
  const [searchDraft, setSearchDraft] = useState("")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const nextKey = useRef(2)
  const [drafts, setDrafts] = useState<DistrictDraft[]>([
    createDistrictDraft(1, initialRegionId),
  ])
  const districtsQuery = useDistricts(
    {
      name: search || undefined,
      page: toApiPage(page),
      regionId: initialRegionId,
      size: PAGE_SIZE,
    },
    {
      query: {
        placeholderData: (previous) => previous,
        retry: false,
      },
    }
  )
  const regionsQuery = useInfiniteRegions(
    { size: REGION_OPTIONS_SIZE },
    { query: { retry: false } }
  )
  const createDistricts = useCreateDistricts()
  const regions = regionsQuery.data?.content ?? []
  const selectedRegion = regions.find((region) => region.id === initialRegionId)

  function getRegionName(regionId?: number, fallback = "—") {
    return getLocalizedName(
      regions.find((region) => region.id === regionId),
      fallback
    )
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(FIRST_PAGE)
    setSearch(searchDraft.trim())
  }

  async function submitDistricts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: DistrictCreateDTO[] = drafts.map((draft) => ({
      name: draft.name.trim(),
      nameUz: emptyToUndefined(draft.nameUz),
      regionId: Number(draft.regionId),
      fakturaDistrictCode: optionalNumber(draft.fakturaDistrictCode),
      fakturaDistrictName: emptyToUndefined(draft.fakturaDistrictName),
      soato: optionalNumber(draft.soato),
    }))

    if (payload.some((district) => !district.name)) {
      toast.error(t("addresses.validation.nameRequired"))
      return
    }
    if (
      payload.some(
        (district) =>
          !Number.isInteger(district.regionId) || district.regionId <= 0
      )
    ) {
      toast.error(t("addresses.validation.regionRequired"))
      return
    }

    try {
      const created = await createDistricts.mutateAsync({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetAll10QueryKey() })
      toast.success(t("addresses.saved", { count: created.length }))
      setDrafts([createDistrictDraft(nextKey.current++, initialRegionId)])
      setDialogOpen(false)
    } catch {
      toast.error(t("addresses.saveFailed"))
    }
  }

  return (
    <AddressDirectoryLayout
      language={language}
      current="districts"
      description={t("addresses.districts.description")}
      title={t("addresses.districts.title")}
      action={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <HugeiconsIcon icon={Add01Icon} className="size-4!" />
              {t("addresses.districts.create")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <form onSubmit={submitDistricts} className="space-y-5">
              <DialogHeader>
                <DialogTitle>{t("addresses.districts.create")}</DialogTitle>
                <DialogDescription>
                  {t("addresses.districts.createDescription")}
                </DialogDescription>
              </DialogHeader>
              {regionsQuery.isError ? (
                <DirectoryError>
                  {t("addresses.regions.loadFailed")}
                </DirectoryError>
              ) : null}
              <div className="space-y-4">
                {drafts.map((draft, index) => (
                  <DistrictDraftFields
                    key={draft.key}
                    draft={draft}
                    index={index}
                    getRegionName={(region) =>
                      getLocalizedName(region, `#${region.id}`)
                    }
                    regions={regions}
                    regionsLoading={regionsQuery.isLoading}
                    removable={drafts.length > 1}
                    onChange={(next) =>
                      setDrafts((current) =>
                        current.map((item) =>
                          item.key === draft.key ? next : item
                        )
                      )
                    }
                    onRemove={() =>
                      setDrafts((current) =>
                        current.filter((item) => item.key !== draft.key)
                      )
                    }
                  />
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setDrafts((current) => [
                    ...current,
                    createDistrictDraft(nextKey.current++, initialRegionId),
                  ])
                }
              >
                <HugeiconsIcon icon={Add01Icon} className="size-4!" />
                {t("addresses.addAnother")}
              </Button>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createDistricts.isPending || !regions.length}
                >
                  {createDistricts.isPending
                    ? t("addresses.saving")
                    : t("addresses.saveAll", { count: drafts.length })}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      }
    >
      {initialRegionId ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("addresses.districts.filteredByRegion", {
              region: getLocalizedName(selectedRegion, `#${initialRegionId}`),
            })}
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href={`/${language}/dashboard/addresses/districts`}>
              {t("addresses.districts.showAll")}
            </Link>
          </Button>
        </div>
      ) : null}
      <DirectorySearch
        value={searchDraft}
        onChange={setSearchDraft}
        onSubmit={submitSearch}
        placeholder={t("addresses.districts.search")}
      />
      {districtsQuery.isLoading ? (
        <DirectoryMessage>{t("addresses.loading")}</DirectoryMessage>
      ) : districtsQuery.isError ? (
        <DirectoryError>{t("addresses.loadFailed")}</DirectoryError>
      ) : (
        <>
          <DirectoryTable
            headers={[
              t("addresses.fields.id"),
              t("addresses.fields.name"),
              t("addresses.fields.region"),
            ]}
            rows={(districtsQuery.data?.content ?? []).map((district) => ({
              cells: [
                district.id ?? "—",
                getLocalizedName(district),
                getRegionName(district.regionId, district.regionName),
              ],
              key: district.id ?? `${district.regionId}-${district.name}`,
            }))}
            emptyMessage={t("addresses.districts.empty")}
          />
          <DirectoryPagination
            page={page}
            totalElements={districtsQuery.data?.totalElements ?? 0}
            totalPages={districtsQuery.data?.totalPages ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </AddressDirectoryLayout>
  )
}

function AddressDirectoryLayout({
  action,
  children,
  current,
  description,
  language,
  title,
}: {
  action: ReactNode
  children: ReactNode
  current: "districts" | "regions"
  description: string
  language: string
  title: string
}) {
  const { t } = useTranslation()
  const baseHref = `/${language}/dashboard/addresses`

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 md:py-10">
      <DashboardBreadcrumb
        language={language}
        items={[
          { label: t("addresses.title"), href: `${baseHref}/regions` },
          { label: title },
        ]}
      />
      <header className="mt-6 flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-primary">
            {t("addresses.title")}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </header>
      <nav
        aria-label={t("addresses.navigation")}
        className="mt-6 flex w-full gap-2 rounded-2xl bg-muted/60 p-1 sm:w-fit"
      >
        {(["regions", "districts"] as const).map((item) => (
          <Link
            key={item}
            href={`${baseHref}/${item}`}
            aria-current={current === item ? "page" : undefined}
            className={cn(
              "flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-muted-foreground transition-colors sm:flex-none",
              current === item &&
                "bg-background text-foreground shadow-sm ring-1 ring-border"
            )}
          >
            {t(`addresses.${item}.title`)}
          </Link>
        ))}
      </nav>
      <section className="space-y-5 py-6">{children}</section>
    </div>
  )
}

function DirectorySearch({
  onChange,
  onSubmit,
  placeholder,
  value,
}: {
  onChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  placeholder: string
  value: string
}) {
  const { t } = useTranslation()

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="sm:max-w-sm"
      />
      <Button type="submit" variant="outline">
        {t("addresses.searchAction")}
      </Button>
    </form>
  )
}

function DirectoryTable({
  emptyMessage,
  headers,
  rows,
}: {
  emptyMessage: string
  headers: string[]
  rows: Array<{ cells: ReactNode[]; key: Key }>
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-5 py-3 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.key} className="border-t hover:bg-muted/30">
                  {row.cells.map((cell, index) => (
                    <td key={index} className="px-5 py-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="h-28 px-5 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function DirectoryPagination({
  onPageChange,
  page,
  totalElements,
  totalPages,
}: {
  onPageChange: (page: number) => void
  page: number
  totalElements: number
  totalPages: number
}) {
  const { t } = useTranslation()
  const safeTotalPages = Math.max(totalPages, 1)

  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>{t("addresses.total", { count: totalElements })}</p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= FIRST_PAGE}
          onClick={() => onPageChange(Math.max(FIRST_PAGE, page - 1))}
        >
          {t("dashboard.previous")}
        </Button>
        <span>{t("dashboard.page", { page, total: safeTotalPages })}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("dashboard.next")}
        </Button>
      </div>
    </div>
  )
}

function RegionDraftFields({
  draft,
  index,
  onChange,
  onRemove,
  removable,
}: {
  draft: RegionDraft
  index: number
  onChange: (draft: RegionDraft) => void
  onRemove: () => void
  removable: boolean
}) {
  const { t } = useTranslation()

  return (
    <DraftCard index={index} onRemove={onRemove} removable={removable}>
      <DraftInput
        required
        label={t("addresses.fields.nameRu")}
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <DraftInput
        label={t("addresses.fields.nameUz")}
        value={draft.nameUz}
        onChange={(nameUz) => onChange({ ...draft, nameUz })}
      />
      <DraftInput
        type="number"
        label={t("addresses.fields.fakturaRegionId")}
        value={draft.fakturaRegionId}
        onChange={(fakturaRegionId) => onChange({ ...draft, fakturaRegionId })}
      />
      <DraftInput
        type="number"
        label={t("addresses.fields.fakturaRegionCode")}
        value={draft.fakturaRegionCode}
        onChange={(fakturaRegionCode) =>
          onChange({ ...draft, fakturaRegionCode })
        }
      />
      <DraftInput
        label={t("addresses.fields.fakturaRegionName")}
        value={draft.fakturaRegionName}
        onChange={(fakturaRegionName) =>
          onChange({ ...draft, fakturaRegionName })
        }
        className="sm:col-span-2"
      />
    </DraftCard>
  )
}

function DistrictDraftFields({
  draft,
  getRegionName,
  index,
  onChange,
  onRemove,
  regions,
  regionsLoading,
  removable,
}: {
  draft: DistrictDraft
  getRegionName: (region: RegionDTO) => string
  index: number
  onChange: (draft: DistrictDraft) => void
  onRemove: () => void
  regions: RegionDTO[]
  regionsLoading: boolean
  removable: boolean
}) {
  const { t } = useTranslation()

  return (
    <DraftCard index={index} onRemove={onRemove} removable={removable}>
      <div className="space-y-2 sm:col-span-2">
        <Label>{t("addresses.fields.region")}</Label>
        <Select
          value={draft.regionId}
          onValueChange={(regionId) => onChange({ ...draft, regionId })}
          disabled={regionsLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                regionsLoading
                  ? t("addresses.loading")
                  : t("addresses.fields.selectRegion")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {regions.map((region) =>
              region.id === undefined ? null : (
                <SelectItem key={region.id} value={String(region.id)}>
                  {getRegionName(region)}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>
      <DraftInput
        required
        label={t("addresses.fields.nameRu")}
        value={draft.name}
        onChange={(name) => onChange({ ...draft, name })}
      />
      <DraftInput
        label={t("addresses.fields.nameUz")}
        value={draft.nameUz}
        onChange={(nameUz) => onChange({ ...draft, nameUz })}
      />
      <DraftInput
        type="number"
        label={t("addresses.fields.fakturaDistrictCode")}
        value={draft.fakturaDistrictCode}
        onChange={(fakturaDistrictCode) =>
          onChange({ ...draft, fakturaDistrictCode })
        }
      />
      <DraftInput
        label={t("addresses.fields.fakturaDistrictName")}
        value={draft.fakturaDistrictName}
        onChange={(fakturaDistrictName) =>
          onChange({ ...draft, fakturaDistrictName })
        }
      />
      <DraftInput
        type="number"
        label={t("addresses.fields.soato")}
        value={draft.soato}
        onChange={(soato) => onChange({ ...draft, soato })}
      />
    </DraftCard>
  )
}

function DraftCard({
  children,
  index,
  onRemove,
  removable,
}: {
  children: ReactNode
  index: number
  onRemove: () => void
  removable: boolean
}) {
  const { t } = useTranslation()

  return (
    <fieldset className="grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2">
      <legend className="sr-only">
        {t("addresses.item", { number: index + 1 })}
      </legend>
      <div className="flex items-center justify-between sm:col-span-2">
        <p className="text-sm font-semibold">
          {t("addresses.item", { number: index + 1 })}
        </p>
        {removable ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("addresses.remove")}
            onClick={onRemove}
          >
            <HugeiconsIcon icon={Trash} className="size-4!" />
          </Button>
        ) : null}
      </div>
      {children}
    </fieldset>
  )
}

function DraftInput({
  className,
  label,
  onChange,
  required,
  type = "text",
  value,
}: {
  className?: string
  label: string
  onChange: (value: string) => void
  required?: boolean
  type?: "number" | "text"
  value: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required ? " *" : null}
      </Label>
      <Input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function DirectoryMessage({ children }: { children: ReactNode }) {
  return <p className="py-8 text-sm text-muted-foreground">{children}</p>
}

function DirectoryError({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
      {children}
    </div>
  )
}

function createRegionDraft(key: number): RegionDraft {
  return {
    fakturaRegionCode: "",
    fakturaRegionId: "",
    fakturaRegionName: "",
    key,
    name: "",
    nameUz: "",
  }
}

function createDistrictDraft(key: number, regionId?: number): DistrictDraft {
  return {
    fakturaDistrictCode: "",
    fakturaDistrictName: "",
    key,
    name: "",
    nameUz: "",
    regionId: regionId ? String(regionId) : "",
    soato: "",
  }
}

function emptyToUndefined(value: string) {
  return value.trim() || undefined
}

function optionalNumber(value: string) {
  if (!value.trim()) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}
