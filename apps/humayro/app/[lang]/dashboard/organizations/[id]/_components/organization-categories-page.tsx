"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useMe1 } from "@/lib/api"
import { useGetById6 } from "@/lib/api/generated/admin-organization/admin-organization"
import { clearAuthToken } from "@/lib/auth-client"
import { useAuthStore } from "@/lib/stores/use-auth-store"
import { DashboardBreadcrumb } from "../../../_components/dashboard-breadcrumb"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { OrganizationOverview } from "./organization-overview"
import { OrganizationUsersView } from "./organization-users-view"
import { OrganizationCategoriesView } from "./organization-categories-view"
import { OrganizationBranchesView } from "./organization-branches-view"
import { OrganizationProductsView } from "./organization-products-view"
import { OrganizationBrandView } from "./organization-brand-view"
export function OrganizationCategoriesPage({
  language,
  organizationId,
}: {
  language: string
  organizationId: number
}) {
  const { t } = useTranslation()
  const router = useRouter()
  const clearUser = useAuthStore((state) => state.clear)
  const meQuery = useMe1({ query: { retry: false } })
  const organizationQuery = useGetById6(organizationId, {
    query: { retry: false },
  })
  const canManageOrganization =
    meQuery.data?.roles?.some(
      (role) => role === "ROLE_SUPER_ADMIN" || role === "ROLE_ADMIN"
    ) ?? false
  useEffect(() => {
    if (!meQuery.isError) return
    clearAuthToken()
    clearUser()
    router.replace(`/${language}/login`)
  }, [clearUser, language, meQuery.isError, router])

  useEffect(() => {
    if (meQuery.isSuccess && !canManageOrganization) {
      router.replace(`/${language}/dashboard`)
    }
  }, [canManageOrganization, language, meQuery.isSuccess, router])

  if (meQuery.isLoading || !canManageOrganization) {
    return (
      <p className="p-8 text-sm text-muted-foreground">
        {t("dashboard.loadingAccount")}
      </p>
    )
  }

  return (
    <main className="container mx-auto p-4 md:p-6">
      <DashboardBreadcrumb
        language={language}
        items={[
          {
            href: `/${language}/dashboard/organizations`,
            label: t("dashboard.organizations"),
          },
          {
            label:
              organizationQuery.data?.name ?? t("organization.loadingDetails"),
          },
        ]}
      />
      {organizationQuery.isLoading ? (
        <p className="py-8 text-muted-foreground">
          {t("organization.loadingDetails")}
        </p>
      ) : organizationQuery.isError || !organizationQuery.data ? (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-destructive/30 p-5 text-destructive"
        >
          {t("dashboard.loadFailed")}
        </div>
      ) : (
        <>
          <OrganizationOverview organization={organizationQuery.data} />
          <Tabs defaultValue="brand" className="mt-4">
            <div className="overflow-x-auto">
              <TabsList variant="line" className="w-max justify-start">
                <TabsTrigger value="brand">
                  {t("advertisement.tab")}
                </TabsTrigger>
                {(["users", "categories", "branches", "products"] as const).map(
                  (tab) => (
                    <TabsTrigger key={tab} value={tab}>
                      {t(`organization.${tab}`)}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
            </div>
            <TabsContent value="users" className="py-6">
              <OrganizationUsersView organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="categories" className="py-6">
              <OrganizationCategoriesView organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="branches" className="py-6">
              <OrganizationBranchesView organizationId={organizationId} />
            </TabsContent>
            <TabsContent value="products" className="py-6">
              <OrganizationProductsView
                organizationId={organizationId}
                language={language}
              />
            </TabsContent>
            <TabsContent value="brand" className="py-6">
              <OrganizationBrandView
                organization={organizationQuery.data}
                organizationId={organizationId}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  )
}
