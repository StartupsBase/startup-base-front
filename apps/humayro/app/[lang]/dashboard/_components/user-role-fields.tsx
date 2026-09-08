"use client"

import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Checkbox } from "@workspace/ui/components/checkbox"

export const ORGANIZATION_USER_ROLES = ["ROLE_EMPLOYER", "ROLE_ADMIN"] as const

export function UserRoleFields({
  value,
  onChange,
  disabled,
}: {
  value: string[]
  onChange: (roles: string[]) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <fieldset className="grid gap-3" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">
        {t("dashboard.roles")}
      </legend>
      <div className="flex flex-wrap gap-4">
        {ORGANIZATION_USER_ROLES.map((role) => (
          <label
            key={role}
            htmlFor={`${id}-${role}`}
            className="flex items-center gap-2 text-sm"
          >
            <Checkbox
              id={`${id}-${role}`}
              checked={value.includes(role)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange(
                  checked === true
                    ? [...value, role]
                    : value.filter((item) => item !== role)
                )
              }
            />
            {role}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
