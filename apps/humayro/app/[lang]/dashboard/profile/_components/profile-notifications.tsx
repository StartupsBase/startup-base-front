"use client"

import {
  BubbleChatNotificationIcon,
  CheckmarkCircle02Icon,
  Notification02Icon,
  Package01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useTranslation } from "react-i18next"

import type { Language } from "@/i18n/config"
import {
  getMyNotificationsQueryKey,
  getUnreadCountQueryKey,
  useMarkAllAsRead,
  useMarkAsRead,
  useMyNotifications,
  useUnreadCount,
} from "@/lib/api/generated/notification/notification"
import type { NotificationDTO } from "@/lib/api/model/notificationDTO"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

const notificationsParams = {
  page: toApiPage(FIRST_PAGE),
  size: 20,
} as const

export function ProfileNotifications({ language }: { language: Language }) {
  const { t } = useTranslation()
  const hasToken = useHasAuthToken()
  const queryClient = useQueryClient()
  const notificationsQuery = useMyNotifications(notificationsParams, {
    query: {
      enabled: hasToken,
      retry: false,
      refetchInterval: 30_000,
    },
  })
  const unreadQuery = useUnreadCount({
    query: {
      enabled: hasToken,
      retry: false,
      refetchInterval: 30_000,
    },
  })

  const refreshNotifications = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getMyNotificationsQueryKey(),
      }),
      queryClient.invalidateQueries({ queryKey: getUnreadCountQueryKey() }),
    ])

  const markAsReadMutation = useMarkAsRead({
    mutation: { onSuccess: refreshNotifications },
  })
  const markAllAsReadMutation = useMarkAllAsRead({
    mutation: { onSuccess: refreshNotifications },
  })
  const notifications = notificationsQuery.data?.content ?? []
  const unreadCount = unreadQuery.data ?? 0

  function markAsRead(notification: NotificationDTO) {
    if (notification.readStatus || notification.id == null) return
    markAsReadMutation.mutate({ id: notification.id })
  }

  return (
    <section className="box-border w-full max-w-full min-w-0 py-7 lg:pl-8">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {t("notificationCenter.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {unreadCount > 0
              ? t("notificationCenter.unread", { count: unreadCount })
              : t("notificationCenter.allRead")}
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            disabled={markAllAsReadMutation.isPending}
            onClick={() => markAllAsReadMutation.mutate()}
          >
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
            {t("notificationCenter.markAllRead")}
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-background">
        {notificationsQuery.isPending ? (
          <NotificationsSkeleton />
        ) : notificationsQuery.isError ? (
          <div className="px-5 py-14 text-center">
            <p className="text-sm text-muted-foreground">
              {t("notificationCenter.loadFailed")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => notificationsQuery.refetch()}
            >
              {t("notificationCenter.retry")}
            </Button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Notification02Icon} className="size-6" />
            </span>
            <p className="mt-3 font-semibold">
              {t("notificationCenter.emptyTitle")}
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-5 text-muted-foreground">
              {t("notificationCenter.emptyDescription")}
            </p>
          </div>
        ) : (
          notifications.map((notification, index) => (
            <NotificationRow
              key={notification.id ?? `${notification.createdAt}-${index}`}
              notification={notification}
              language={language}
              onRead={() => markAsRead(notification)}
            />
          ))
        )}
      </div>
    </section>
  )
}

function NotificationRow({
  language,
  notification,
  onRead,
}: {
  language: Language
  notification: NotificationDTO
  onRead: () => void
}) {
  const { t } = useTranslation()
  const isOrder = notification.type === "ORDER_STATUS"
  const content = (
    <>
      <span
        className={cn(
          "mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl",
          isOrder
            ? "bg-primary/10 text-primary"
            : notification.type === "CHAT_MESSAGE"
              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
              : "bg-muted text-muted-foreground"
        )}
      >
        <HugeiconsIcon
          icon={
            isOrder
              ? Package01Icon
              : notification.type === "CHAT_MESSAGE"
                ? BubbleChatNotificationIcon
                : Notification02Icon
          }
          className="size-5"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-3">
          <span className="text-sm font-semibold">
            {notification.title ||
              (isOrder
                ? t("notificationCenter.orderFallback")
                : t("notificationCenter.systemFallback"))}
          </span>
          {!notification.readStatus ? (
            <span
              aria-label={t("notificationCenter.unreadOne")}
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
            />
          ) : null}
        </span>
        {notification.body ? (
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            {notification.body}
          </span>
        ) : null}
        {notification.createdAt ? (
          <time
            dateTime={notification.createdAt}
            className="mt-1.5 block text-[11px] text-muted-foreground/80"
          >
            {formatNotificationDate(notification.createdAt, language)}
          </time>
        ) : null}
      </span>
    </>
  )
  const className = cn(
    "flex w-full gap-3 border-b px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-muted/60 sm:px-5",
    !notification.readStatus && "bg-primary/4"
  )

  if (isOrder) {
    return (
      <Link
        href={`/${language}/dashboard/orders`}
        className={className}
        onClick={onRead}
      >
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onRead}>
      {content}
    </button>
  )
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex gap-3 rounded-xl p-2">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

function formatNotificationDate(value: string, language: Language) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}
