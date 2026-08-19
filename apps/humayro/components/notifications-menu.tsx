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
import { useState } from "react"
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
import { useHasAuthToken } from "@/lib/use-auth-token"
import { Button } from "@workspace/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"

const notificationsParams = { page: 0, size: 20 } as const

export function NotificationsMenu({
  language,
  ordersHref = `/${language}/orders`,
  className,
}: {
  language: Language
  ordersHref?: string
  className?: string
}) {
  const { t } = useTranslation()
  const hasToken = useHasAuthToken()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
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

  if (!hasToken) return null

  const notifications = notificationsQuery.data?.content ?? []
  const unreadCount = unreadQuery.data ?? 0

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      void Promise.all([notificationsQuery.refetch(), unreadQuery.refetch()])
    }
  }

  function markAsRead(notification: NotificationDTO) {
    if (notification.readStatus || notification.id == null) return
    markAsReadMutation.mutate({ id: notification.id })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("notificationCenter.title")}
          className={cn("relative size-10 rounded-full", className)}
        >
          <HugeiconsIcon icon={Notification02Icon} className="size-5" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] leading-4 font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={10}
        className="w-[min(24rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3.5">
          <div className="min-w-0">
            <h2 className="font-bold">{t("notificationCenter.title")}</h2>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0
                ? t("notificationCenter.unread", { count: unreadCount })
                : t("notificationCenter.allRead")}
            </p>
          </div>
          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={markAllAsReadMutation.isPending}
              onClick={() => markAllAsReadMutation.mutate()}
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
              {t("notificationCenter.markAllRead")}
            </Button>
          ) : null}
        </div>

        <div className="max-h-[min(28rem,65svh)] overflow-y-auto">
          {notificationsQuery.isPending ? (
            <NotificationsSkeleton />
          ) : notificationsQuery.isError ? (
            <div className="px-5 py-10 text-center">
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
            <div className="px-6 py-12 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={Notification02Icon} className="size-6" />
              </span>
              <p className="mt-3 font-semibold">
                {t("notificationCenter.emptyTitle")}
              </p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                {t("notificationCenter.emptyDescription")}
              </p>
            </div>
          ) : (
            notifications.map((notification, index) => (
              <NotificationItem
                key={notification.id ?? `${notification.createdAt}-${index}`}
                notification={notification}
                language={language}
                ordersHref={ordersHref}
                onRead={() => markAsRead(notification)}
                onNavigate={() => setOpen(false)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  language,
  ordersHref,
  onRead,
  onNavigate,
}: {
  notification: NotificationDTO
  language: Language
  ordersHref: string
  onRead: () => void
  onNavigate: () => void
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
          <span className="line-clamp-2 text-sm font-semibold">
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
          <span className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
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
    "flex w-full gap-3 border-b px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-muted/60",
    !notification.readStatus && "bg-primary/4"
  )

  if (isOrder) {
    return (
      <Link
        href={ordersHref}
        className={className}
        onClick={() => {
          onRead()
          onNavigate()
        }}
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
      {[0, 1, 2].map((item) => (
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
