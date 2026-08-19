import { customInstance } from "@/lib/api/mutator"

export type PaymentProvider = "CLICK" | "PAYME"
export type PaymentTransactionStatus =
  | "CANCELLED"
  | "FAILED"
  | "PAID"
  | "PENDING"
  | "REFUNDED"

export type PaymentProviderSettings = {
  checkoutUrl: string
  enabled: boolean
  login?: string
  merchantId: string
  merchantUserId?: string
  provider: PaymentProvider
  secretKey?: string
  serviceId?: string
}

export type PaymentSettings = {
  organizationId: number
  providers: PaymentProviderSettings[]
  shopUrl: string
}

export type PaymentTransaction = {
  amount: number
  balanceAfter?: number
  createdAt: string
  currency?: string
  description?: string
  externalId?: string
  id: number | string
  provider: PaymentProvider
  status: PaymentTransactionStatus
  type?: "PAYMENT" | "REFUND"
}

export type PaymentTransactionsPage = {
  content: PaymentTransaction[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export const paymentQueryKeys = {
  settings: (organizationId: number) =>
    ["payment-settings", organizationId] as const,
  transactions: (organizationId: number, filters: PaymentTransactionFilters) =>
    ["payment-transactions", organizationId, filters] as const,
}

export type PaymentTransactionFilters = {
  page: number
  provider?: PaymentProvider
  search?: string
  size: number
  status?: PaymentTransactionStatus
}

export function getPaymentSettings(organizationId: number) {
  return customInstance<PaymentSettings>({
    method: "GET",
    url: "/api/payments/settings",
    params: { organizationId },
  })
}

export function updatePaymentSettings(settings: PaymentSettings) {
  return customInstance<PaymentSettings>({
    method: "PUT",
    url: "/api/payments/settings",
    params: { organizationId: settings.organizationId },
    data: settings,
  })
}

export function testPaymentProvider(
  organizationId: number,
  settings: PaymentProviderSettings
) {
  return customInstance<{ message?: string; success: boolean }>({
    method: "POST",
    url: `/api/payments/providers/${settings.provider.toLowerCase()}/test`,
    params: { organizationId },
    data: settings,
  })
}

export function getPaymentTransactions(
  organizationId: number,
  filters: PaymentTransactionFilters
) {
  return customInstance<PaymentTransactionsPage>({
    method: "GET",
    url: "/api/payments/transactions",
    params: { organizationId, ...filters },
  })
}

export function refundPaymentTransaction(
  organizationId: number,
  transactionId: number | string
) {
  return customInstance<PaymentTransaction>({
    method: "POST",
    url: `/api/payments/transactions/${transactionId}/refund`,
    params: { organizationId },
  })
}
