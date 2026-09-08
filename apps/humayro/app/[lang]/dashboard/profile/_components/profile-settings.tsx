"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { useTheme } from "@/components/theme-provider"
import { getCurrentDevice } from "@/lib/current-device"
import {
  FONT_SIZE_OPTIONS,
  setInterfacePreferences,
  useInterfacePreferences,
} from "@/lib/interface-preferences"
import { Button } from "@workspace/ui/components/button"
import { Switch } from "@workspace/ui/components/switch"

const colors = [
  { name: "teal", value: "#008872" },
  { name: "blue", value: "#2563eb" },
  { name: "violet", value: "#7c3aed" },
  { name: "rose", value: "#e11d48" },
  { name: "orange", value: "#ea580c" },
]
const subscribeToDevice = () => () => {}
const getServerDevice = () => null

export function ProfileSettings() {
  const { t } = useTranslation()
  const { themePreference, setTheme } = useTheme()
  const { sidebarAutoHide, primaryColor, fontSize } = useInterfacePreferences()
  const device = useSyncExternalStore(
    subscribeToDevice,
    getCurrentDevice,
    getServerDevice
  )

  return (
    <section
      className="min-w-0 py-7 lg:pl-8"
      aria-labelledby="profile-settings-title"
    >
      <h2 id="profile-settings-title" className="text-lg font-semibold">
        {t("profile.settings")}
      </h2>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        {t("profilePreferences.description")}
      </p>

      <div className="divide-y border-y">
        <SettingsRow
          title={t("profilePreferences.theme")}
          description={t("profilePreferences.themeHint")}
        >
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="sr-only">{t("profilePreferences.theme")}</legend>
            {(["light", "dark", "system"] as const).map((mode) => (
              <label key={mode} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="platform-theme"
                  value={mode}
                  checked={themePreference === mode}
                  onChange={() => setTheme(mode)}
                  className="peer sr-only"
                />
                <span className="flex min-h-12 items-center justify-center rounded-xl border px-2 py-3 text-center text-sm font-medium transition peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {t(`profilePreferences.${mode}`)}
                </span>
              </label>
            ))}
          </fieldset>
        </SettingsRow>

        <SettingsRow
          title={t("profilePreferences.fontSize")}
          description={t("profilePreferences.fontSizeHint")}
        >
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="sr-only">
              {t("profilePreferences.fontSize")}
            </legend>
            {FONT_SIZE_OPTIONS.map((size) => (
              <label key={size} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="platform-font-size"
                  value={size}
                  checked={fontSize === size}
                  onChange={() => setInterfacePreferences({ fontSize: size })}
                  className="peer sr-only"
                />
                <span className="flex min-h-12 items-center justify-center rounded-xl border px-2 py-3 text-center text-sm font-medium transition peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                  {t(`profilePreferences.fontSizes.${size}`)}
                </span>
              </label>
            ))}
          </fieldset>
        </SettingsRow>

        <SettingsRow
          title={t("profilePreferences.sidebar")}
          description={t("profilePreferences.sidebarHint")}
        >
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4">
            <span className="text-sm font-medium">
              {t("profilePreferences.autoHide")}
            </span>
            <Switch
              checked={sidebarAutoHide}
              onCheckedChange={(checked) =>
                setInterfacePreferences({ sidebarAutoHide: checked })
              }
              aria-label={t("profilePreferences.autoHide")}
            />
          </label>
        </SettingsRow>

        <SettingsRow
          title={
            <span className="flex flex-wrap items-center gap-2">
              {t("profilePreferences.primaryColor")}
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
                BETA
              </span>
            </span>
          }
          description={t("profilePreferences.colorHint")}
        >
          <div className="grid gap-4">
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label={t("profilePreferences.primaryColor")}
            >
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  aria-label={t(`profilePreferences.colors.${color.name}`)}
                  title={t(`profilePreferences.colors.${color.name}`)}
                  aria-pressed={primaryColor?.toLowerCase() === color.value}
                  onClick={() =>
                    setInterfacePreferences({ primaryColor: color.value })
                  }
                  className="flex size-11 items-center justify-center rounded-full border-2 border-transparent transition outline-none hover:border-border focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-foreground"
                >
                  <span
                    className="size-8 rounded-full border border-black/10"
                    style={{ backgroundColor: color.value }}
                  />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-3 text-sm">
                <input
                  type="color"
                  value={primaryColor ?? "#008872"}
                  onChange={(event) =>
                    setInterfacePreferences({
                      primaryColor: event.target.value,
                    })
                  }
                  className="size-11 cursor-pointer rounded-lg border bg-background p-1"
                  aria-label={t("profilePreferences.customColor")}
                />
                {t("profilePreferences.customColor")}
              </label>
              <output className="text-xs text-muted-foreground">
                {primaryColor?.toUpperCase() ??
                  t("profilePreferences.defaultColor")}
              </output>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={primaryColor === null}
                onClick={() => setInterfacePreferences({ primaryColor: null })}
              >
                {t("profilePreferences.resetColor")}
              </Button>
            </div>
          </div>
        </SettingsRow>
      </div>

      <div className="mt-8">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-semibold">
            {t("profilePreferences.device")}
          </h3>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {t("profilePreferences.currentDevice")}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("profilePreferences.deviceHint")}
        </p>
        <dl className="mt-5 divide-y rounded-xl border px-4">
          {[
            [
              "deviceType",
              device ? t(`profilePreferences.${device.type}`) : null,
            ],
            ["browser", device?.browser],
            ["operatingSystem", device?.operatingSystem],
            ["language", device?.language],
            ["timezone", device?.timezone],
          ].map(([key, value]) => (
            <div
              key={key}
              className="grid gap-1 py-3 text-sm sm:grid-cols-2 sm:gap-4"
            >
              <dt className="text-muted-foreground">
                {t(`profilePreferences.${key}`)}
              </dt>
              <dd className="min-w-0 font-medium break-words">
                {value || t("profilePreferences.unavailable")}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

function SettingsRow({
  title,
  description,
  children,
}: {
  title: ReactNode
  description: string
  children: ReactNode
}) {
  return (
    <div className="grid min-w-0 gap-4 py-6 xl:grid-cols-[minmax(150px,230px)_minmax(0,1fr)] xl:items-center">
      <div className="min-w-0">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs leading-5 text-muted-foreground xl:max-w-52">
          {description}
        </p>
      </div>
      <div className="min-w-0 xl:max-w-xl">{children}</div>
    </div>
  )
}
