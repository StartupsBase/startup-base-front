import Image from "next/image"

import authImage from "@/assets/auth/dd01b95e8c02bc4973082d74abd82a110519b9be.jpg"
import { LoginForm } from "@/components/login-form"
import { LogoBrand } from "@/components/logo"
import { isLanguage } from "@/i18n/config"
import { getTranslation } from "@/i18n/server"
import { notFound } from "next/navigation"

export default async function LoginPage({
  params,
}: {
  params: Promise<unknown>
}) {
  const { lang } = (await params) as { lang?: string }

  if (!isLanguage(lang)) {
    notFound()
  }

  const { t } = await getTranslation(lang)

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-6 p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <LogoBrand />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-medium tracking-tight">
                {t("login.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("login.subtitle")}
              </p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-muted lg:block">
        <Image
          src={authImage}
          alt={t("login.imageAlt")}
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  )
}
