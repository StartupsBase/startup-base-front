import { formatPhoneNumberIntl } from "react-phone-number-input"

export function formatPhoneNumberInternal(phoneNumber: string) {
  const value = phoneNumber.trim()

  return value ? formatPhoneNumberIntl(value) || value : ""
}
