"use client"

import { useTranslation } from "react-i18next"
import {
  DateTimePicker,
  datePickerRuLocale,
  datePickerUzLocale,
} from "@workspace/ui/components/date-picker"
import { Label } from "@workspace/ui/components/label"
import {
  toAdvertisementDateInput,
  fromAdvertisementDateInput,
} from "./advertisement-helpers"

// The shared picker works in device-local time. Use wall-clock dates so that
// its calendar and time input consistently represent Tashkent time.
function toPickerDate(value?: string) {
  const local = toAdvertisementDateInput(value)
  return local ? new Date(local) : undefined
}
function fromPickerDate(value?: Date) {
  if (!value) return undefined
  const pad = (n: number) => String(n).padStart(2, "0")
  return fromAdvertisementDateInput(
    `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`
  )
}
export function AdvertisementSchedule({
  startsAt,
  endsAt,
  disabled,
  onStartChange,
  onEndChange,
}: {
  startsAt?: string
  endsAt?: string
  disabled: boolean
  onStartChange: (value?: string) => void
  onEndChange: (value?: string) => void
}) {
  const { t, i18n } = useTranslation()
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {(
        [
          {
            name: "startsAt",
            value: startsAt,
            change: onStartChange,
            placeholder: "immediately",
          },
          {
            name: "endsAt",
            value: endsAt,
            change: onEndChange,
            placeholder: "noEnd",
          },
        ] as const
      ).map((field) => (
        <div className="min-w-0 space-y-2" key={field.name}>
          <Label htmlFor={`advertisement-${field.name}`}>
            {t(`advertisement.${field.name}`)}
          </Label>
          <DateTimePicker
            id={`advertisement-${field.name}`}
            aria-label={t(`advertisement.${field.name}`)}
            value={toPickerDate(field.value)}
            onValueChange={(date) => field.change(fromPickerDate(date))}
            placeholder={t(`advertisement.${field.placeholder}`)}
            disabled={disabled}
            locale={
              i18n.language.startsWith("ru")
                ? datePickerRuLocale
                : datePickerUzLocale
            }
            showNowAction={false}
            doneLabel={t("advertisement.done")}
            timeLabel={t("advertisement.time")}
            clearLabel={t("advertisement.clearDate")}
            className="w-full"
          />
        </div>
      ))}
    </div>
  )
}
