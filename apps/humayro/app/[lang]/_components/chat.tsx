"use client"

import {
  ArrowLeft01Icon,
  ArrowUp01Icon,
  Attachment01Icon,
  BubbleChatIcon,
  Cancel01Icon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  SmileIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { RichTextEditor } from "@/components/rich-text-editor"
import type { Language } from "@/i18n/config"
import { useUploadImage } from "@/lib/api/generated/attachment-controller/attachment-controller"
import { useMe1 } from "@/lib/api/generated/auth/auth"
import {
  getGetMessagesQueryKey,
  getGetRoomsQueryKey,
  useCloseRoom,
  useCreateRoom,
  useGetMessages,
  useGetRooms,
  useSendMessage,
} from "@/lib/api/generated/chat/chat"
import type { ChatMessageDTO } from "@/lib/api/model/chatMessageDTO"
import type { ChatRoomDTO } from "@/lib/api/model/chatRoomDTO"
import { useHasAuthToken } from "@/lib/use-auth-token"
import { FIRST_PAGE, toApiPage } from "@/lib/pagination"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

type ChatProps = {
  language: Language
  organizationId: number
  organizationName?: string
  branchId?: number
  branchName?: string
}

const chatCopy = {
  ru: {
    chats: "Чаты",
    greeting: "Здравствуйте! Напишите свой вопрос об этом товаре.",
    placeholder: "Сообщение...",
    signInTitle: "Войдите, чтобы написать продавцу",
    signInAction: "Войти",
    noChats: "У вас пока нет чатов",
    noMessages: "Начните разговор с продавцом",
    loading: "Загружаем...",
    loadError: "Не удалось загрузить чат",
    sendError: "Не удалось отправить сообщение",
    closeChat: "Завершить чат",
    closeConfirm: "Завершить этот чат?",
    closed: "Чат завершён",
    backToChats: "Все чаты",
    openChat: "Открыть чат",
    closeWidget: "Закрыть",
    expandWindow: "Развернуть окно",
    collapseWindow: "Свернуть окно",
    emoji: "Эмодзи",
    image: "Отправить изображение",
    imageError: "Не удалось отправить изображение",
    imageTooLarge: "Размер изображения не должен превышать 10 МБ",
    imageTypeError: "Выберите изображение в формате JPG, PNG, WEBP или GIF",
  },
  uz: {
    chats: "Suhbatlar",
    greeting: "Assalomu alaykum! Bu mahsulot haqidagi savolingizni yozing.",
    placeholder: "Xabar...",
    signInTitle: "Sotuvchiga yozish uchun tizimga kiring",
    signInAction: "Kirish",
    noChats: "Sizda hozircha suhbatlar yo‘q",
    noMessages: "Sotuvchi bilan suhbatni boshlang",
    loading: "Yuklanmoqda...",
    expandWindow: "Развернуть окно",
    collapseWindow: "Свернуть окно",
    loadError: "Suhbatni yuklab bo‘lmadi",
    sendError: "Xabarni yuborib bo‘lmadi",
    closeChat: "Suhbatni yakunlash",
    closeConfirm: "Bu suhbatni yakunlaysizmi?",
    closed: "Suhbat yakunlangan",
    backToChats: "Barcha suhbatlar",
    openChat: "Suhbatni ochish",
    closeWidget: "Yopish",
    emoji: "Emoji",
    image: "Rasm yuborish",
    imageError: "Rasmni yuborib bo‘lmadi",
    imageTooLarge: "Rasm hajmi 10 MB dan oshmasligi kerak",
    imageTypeError: "JPG, PNG, WEBP yoki GIF formatdagi rasmni tanlang",
  },
} satisfies Record<Language, Record<string, string>>

const CHAT_QUICK_MESSAGES: Record<Language, readonly string[]> = {
  ru: [
    "Хочу купить",
    "Ещё продаёте?",
    "Торг уместен?",
    "Когда можно посмотреть?",
    "Почему продаёте?",
  ],
  uz: [
    "Sotib olmoqchiman",
    "Hali sotuvdami?",
    "Narxini kelishamizmi?",
    "Qachon ko‘rish mumkin?",
    "Nega sotyapsiz?",
  ],
}

const CHAT_EMOJIS = [
  "😀",
  "😊",
  "😂",
  "😍",
  "👍",
  "❤️",
  "🔥",
  "👏",
  "🙏",
  "🎉",
  "🤝",
  "😢",
]

const CHAT_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
])
const MAX_CHAT_IMAGE_SIZE = 10 * 1024 * 1024

export function Chat({
  language,
  organizationId,
  organizationName,
  branchId,
  branchName,
}: ChatProps) {
  const text = chatCopy[language]
  const hasToken = useHasAuthToken()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<"conversation" | "rooms">("conversation")
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [expandWindow, setExpandWindow] = useState(false)
  const [editorVersion, setEditorVersion] = useState(0)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const imagePreviewUrlRef = useRef<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const roomsParams = { page: toApiPage(FIRST_PAGE), size: 100 }
  const roomsQuery = useGetRooms(roomsParams, {
    query: {
      enabled: isOpen && hasToken,
      retry: false,
      refetchInterval: isOpen && view === "rooms" ? 10_000 : false,
    },
  })
  const meQuery = useMe1({
    query: {
      enabled: isOpen && hasToken,
      staleTime: 5 * 60_000,
      retry: false,
    },
  })
  const rooms = roomsQuery.data?.content ?? []
  const productRoom = rooms.find(
    (room) =>
      room.organizationId === organizationId &&
      (branchId == null || room.branchId === branchId)
  )
  const activeRoomId =
    selectedRoomId ??
    (view === "conversation" ? (productRoom?.id ?? null) : null)
  const activeRoom =
    rooms.find((room) => room.id === activeRoomId) ??
    (productRoom?.id === activeRoomId ? productRoom : undefined)
  const messagesParams = { page: toApiPage(FIRST_PAGE), size: 100 }
  const messagesQuery = useGetMessages(activeRoomId ?? 0, messagesParams, {
    query: {
      enabled:
        isOpen && hasToken && view === "conversation" && activeRoomId != null,
      retry: false,
      refetchInterval: isOpen && view === "conversation" ? 3_000 : false,
    },
  })
  const createRoomMutation = useCreateRoom()
  const sendMessageMutation = useSendMessage()
  const closeRoomMutation = useCloseRoom()
  const uploadImageMutation = useUploadImage()
  const messages = useMemo(
    () =>
      [...(messagesQuery.data?.content ?? [])].sort(
        (first, second) =>
          new Date(first.createdAt ?? 0).getTime() -
            new Date(second.createdAt ?? 0).getTime() ||
          (first.id ?? 0) - (second.id ?? 0)
      ),
    [messagesQuery.data?.content]
  )
  const currentUserId = meQuery.data?.id
  const isBusy =
    roomsQuery.isPending ||
    createRoomMutation.isPending ||
    sendMessageMutation.isPending ||
    uploadImageMutation.isPending
  const isSendingMessage =
    createRoomMutation.isPending ||
    sendMessageMutation.isPending ||
    uploadImageMutation.isPending

  useEffect(() => {
    if (!isOpen || view !== "conversation") return
    const container = messagesContainerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [isOpen, messages.length, view])

  useEffect(
    () => () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current)
      }
    },
    []
  )

  function clearSelectedImage() {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current)
      imagePreviewUrlRef.current = null
    }
    setSelectedImage(null)
    setImagePreviewUrl(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  async function ensureRoom() {
    if (activeRoomId != null) return activeRoomId

    const room = await createRoomMutation.mutateAsync({
      data: {
        organizationId,
        branchId,
      },
    })

    if (room.id == null) {
      throw new Error("Created chat room has no id")
    }

    setSelectedRoomId(room.id)
    await queryClient.invalidateQueries({
      queryKey: getGetRoomsQueryKey(),
    })
    return room.id
  }

  async function refreshChat(roomId: number) {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetMessagesQueryKey(roomId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetRoomsQueryKey(),
      }),
    ])
  }

  async function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanMessage = message.trim()
    if ((!cleanMessage && !selectedImage) || !hasToken || isBusy) return

    try {
      const roomId = await ensureRoom()

      if (selectedImage) {
        const attachment = await uploadImageMutation.mutateAsync({
          data: { file: selectedImage },
        })

        if (attachment.id == null) {
          throw new Error("Uploaded attachment has no id")
        }

        await sendMessageMutation.mutateAsync({
          roomId,
          data: {
            type: "IMAGE",
            attachmentId: attachment.id,
          },
        })
        clearSelectedImage()
      }

      if (cleanMessage) {
        await sendMessageMutation.mutateAsync({
          roomId,
          data: {
            type: "TEXT",
            text: cleanMessage,
          },
        })
        setMessage("")
        setEditorVersion((current) => current + 1)
      }

      setShowEmojiPicker(false)
      await refreshChat(roomId)
    } catch {
      toast.error(selectedImage ? text.imageError : text.sendError)
    }
  }

  function selectImage(file: File) {
    if (!CHAT_IMAGE_TYPES.has(file.type)) {
      toast.error(text.imageTypeError)
      return
    }

    if (file.size > MAX_CHAT_IMAGE_SIZE) {
      toast.error(text.imageTooLarge)
      return
    }

    clearSelectedImage()
    const previewUrl = URL.createObjectURL(file)
    imagePreviewUrlRef.current = previewUrl
    setSelectedImage(file)
    setImagePreviewUrl(previewUrl)
    setShowEmojiPicker(false)
  }

  function appendEmoji(emoji: string) {
    setMessage((current) => `${current}${emoji}`)
    setEditorVersion((current) => current + 1)
    setShowEmojiPicker(false)
  }

  function applyQuickMessage(quickMessage: string) {
    setMessage(quickMessage)
    setEditorVersion((current) => current + 1)
  }

  async function closeActiveRoom() {
    if (activeRoomId == null || !window.confirm(text.closeConfirm)) return

    try {
      await closeRoomMutation.mutateAsync({ roomId: activeRoomId })
      await queryClient.invalidateQueries({
        queryKey: getGetRoomsQueryKey(),
      })
      setShowActions(false)
      setSelectedRoomId(null)
      setView("rooms")
    } catch {
      toast.error(text.loadError)
    }
  }

  function openProductConversation() {
    setSelectedRoomId(null)
    setView("conversation")
    setIsOpen(true)
  }

  const handleCollapse = () => {
    setExpandWindow((prev) => !prev)
  }

  return (
    <div
      className={cn(
        "fixed inset-x-2 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-60 flex flex-col items-start sm:inset-x-auto sm:right-auto sm:left-5 sm:max-w-[calc(100vw-2.5rem)] sm:transition-[width] lg:bottom-5",
        expandWindow ? "sm:w-180" : "sm:w-100"
      )}
    >
      {isOpen ? (
        <section
          aria-label={text.chats}
          className={cn(
            "mb-3 flex h-[calc(100dvh-11rem)] w-full flex-col overflow-hidden rounded-[1.5rem] border border-border/70 bg-background text-foreground shadow-[0_28px_90px_-24px_rgba(0,0,0,.65)] transition-[height] sm:rounded-[1.75rem] lg:h-[calc(100dvh-7rem)]",
            !expandWindow && "max-h-168"
          )}
        >
          {view === "rooms" ? (
            <RoomsView
              language={language}
              rooms={rooms}
              currentOrganizationId={meQuery.data?.organizationId}
              isPending={roomsQuery.isPending}
              isError={roomsQuery.isError}
              onSelect={(roomId) => {
                setSelectedRoomId(roomId)
                setView("conversation")
              }}
              onClose={() => setIsOpen(false)}
            />
          ) : (
            <>
              <header className="relative flex h-16 shrink-0 items-center gap-2 border-b border-border/70 px-3">
                <button
                  type="button"
                  aria-label={text.backToChats}
                  className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setShowActions(false)
                    setView("rooms")
                  }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
                </button>

                <ChatAvatar
                  name={
                    getRoomTitle(
                      activeRoom,
                      meQuery.data?.organizationId,
                      organizationName
                    ) || organizationName
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {getRoomTitle(
                      activeRoom,
                      meQuery.data?.organizationId,
                      organizationName
                    ) || organizationName}
                  </p>
                  {activeRoom?.branchName || branchName ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {activeRoom?.branchName || branchName}
                    </p>
                  ) : null}
                </div>

                {activeRoomId != null ? (
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={text.closeChat}
                      className="grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      onClick={() => setShowActions((current) => !current)}
                    >
                      <HugeiconsIcon
                        icon={MoreHorizontalIcon}
                        className="size-5"
                      />
                    </button>
                    {showActions ? (
                      <div className="absolute top-full right-0 z-10 mt-1 w-44 rounded-xl border bg-popover p-1 shadow-xl">
                        {/* <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 cursor-pointer text-left text-sm text-destructive hover:bg-destructive/10"
                          onClick={closeActiveRoom}
                        >
                          {text.closeChat}
                        </button> */}
                        <button
                          type="button"
                          className="w-full cursor-pointer rounded-lg px-3 py-2 text-left text-sm hover:bg-destructive/10"
                          onClick={handleCollapse}
                        >
                          {expandWindow
                            ? text.collapseWindow
                            : text.expandWindow}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  aria-label={text.closeWidget}
                  className="grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
                </button>
              </header>

              {!hasToken ? (
                <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                  <div className="grid size-14 place-items-center rounded-full bg-primary/12 text-primary">
                    <HugeiconsIcon icon={BubbleChatIcon} className="size-7" />
                  </div>
                  <p className="mt-4 font-semibold">{text.signInTitle}</p>
                  <Button asChild className="mt-5 rounded-xl">
                    <Link href={`/${language}/login`}>{text.signInAction}</Link>
                  </Button>
                </div>
              ) : (
                <>
                  <div
                    ref={messagesContainerRef}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 sm:py-5"
                  >
                    {messagesQuery.isPending && activeRoomId != null ? (
                      <p className="text-center text-sm text-muted-foreground">
                        {text.loading}
                      </p>
                    ) : messagesQuery.isError ? (
                      <p className="text-center text-sm text-destructive">
                        {text.loadError}
                      </p>
                    ) : messages.length ? (
                      <div className="space-y-3">
                        {messages.map((chatMessage, index) => (
                          <MessageBubble
                            key={chatMessage.id ?? index}
                            message={chatMessage}
                            isOwn={
                              currentUserId != null &&
                              chatMessage.senderId === currentUserId
                            }
                            language={language}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="flex h-full min-h-48 flex-col items-center justify-center text-center">
                        <p className="max-w-64 text-sm leading-6 text-muted-foreground">
                          {text.greeting}
                        </p>
                      </div>
                    )}
                  </div>

                  <form
                    className="m-2 mt-0 sm:m-3 sm:mt-0"
                    onSubmit={submitMessage}
                  >
                    {activeRoom?.status !== "CLOSED" ? (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {CHAT_QUICK_MESSAGES[language].map((quickMessage) => (
                          <button
                            key={quickMessage}
                            type="button"
                            disabled={isBusy}
                            className={cn(
                              "cursor-pointer rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50",
                              message.trim() === quickMessage &&
                                "bg-foreground text-background"
                            )}
                            onClick={() => applyQuickMessage(quickMessage)}
                          >
                            {quickMessage}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="rounded-2xl border-2 border-primary bg-background p-2">
                      {selectedImage && imagePreviewUrl ? (
                        <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted/60 p-2">
                          <div className="relative size-18 shrink-0">
                            <img
                              src={imagePreviewUrl}
                              alt={selectedImage.name}
                              className="size-full rounded-xl border object-cover shadow-sm"
                            />
                            <button
                              type="button"
                              aria-label={
                                language === "uz"
                                  ? "Rasmni olib tashlash"
                                  : "Удалить изображение"
                              }
                              className="absolute -top-1.5 -right-1.5 grid size-6 cursor-pointer place-items-center rounded-full border bg-background text-foreground shadow-md transition hover:bg-muted"
                              onClick={clearSelectedImage}
                            >
                              <HugeiconsIcon
                                icon={Cancel01Icon}
                                className="size-3.5"
                              />
                            </button>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">
                              {selectedImage.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {(selectedImage.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                        </div>
                      ) : null}

                      <RichTextEditor
                        key={editorVersion}
                        value={message}
                        output="text"
                        placeholder={text.placeholder}
                        editable={activeRoom?.status !== "CLOSED"}
                        autofocus="end"
                        showToolbar={false}
                        className="rounded-none border-0 shadow-none focus-within:border-transparent focus-within:ring-0"
                        editorClassName="max-h-28 min-h-12 overflow-y-auto px-2 py-1 text-sm"
                        onChange={(content) =>
                          setMessage(typeof content === "string" ? content : "")
                        }
                        editorProps={{
                          handleKeyDown: (view, event) => {
                            if (
                              event.key === "Enter" &&
                              !event.shiftKey &&
                              !event.isComposing
                            ) {
                              event.preventDefault()
                              view.dom.closest("form")?.requestSubmit()
                              return true
                            }
                            return false
                          },
                        }}
                      />

                      <div className="flex items-center justify-between">
                        {activeRoom?.status === "CLOSED" ? (
                          <span className="px-2 text-xs text-muted-foreground">
                            {text.closed}
                          </span>
                        ) : (
                          <div className="relative flex items-center gap-1">
                            <button
                              type="button"
                              aria-label={text.emoji}
                              aria-expanded={showEmojiPicker}
                              disabled={isBusy}
                              className="grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() =>
                                setShowEmojiPicker((current) => !current)
                              }
                            >
                              <HugeiconsIcon
                                icon={SmileIcon}
                                className="size-5"
                              />
                            </button>

                            {showEmojiPicker ? (
                              <div className="absolute bottom-11 left-0 z-20 grid w-52 grid-cols-6 gap-1 rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl">
                                {CHAT_EMOJIS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    aria-label={emoji}
                                    className="grid size-8 cursor-pointer place-items-center rounded-lg text-lg transition hover:bg-muted"
                                    onClick={() => appendEmoji(emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            ) : null}

                            <input
                              ref={imageInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                if (file) selectImage(file)
                                event.currentTarget.value = ""
                              }}
                            />
                            <button
                              type="button"
                              aria-label={text.image}
                              disabled={isBusy}
                              className="grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => imageInputRef.current?.click()}
                            >
                              <HugeiconsIcon
                                icon={Attachment01Icon}
                                className={cn(
                                  "size-5",
                                  uploadImageMutation.isPending &&
                                    "animate-pulse"
                                )}
                              />
                            </button>
                          </div>
                        )}
                        <button
                          type="submit"
                          aria-label={
                            isSendingMessage ? text.loading : text.placeholder
                          }
                          aria-busy={isSendingMessage}
                          disabled={
                            (!message.trim() && !selectedImage) ||
                            isBusy ||
                            activeRoom?.status === "CLOSED"
                          }
                          className="grid size-9 cursor-pointer place-items-center rounded-full bg-primary text-primary-foreground transition hover:brightness-105 disabled:bg-muted disabled:text-muted-foreground"
                        >
                          {isSendingMessage ? (
                            <span
                              aria-hidden="true"
                              className="size-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={ArrowUp01Icon}
                              className="size-5"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </section>
      ) : null}

      <button
        type="button"
        aria-label={text.openChat}
        className="mr-auto grid size-14 animate-bounce cursor-pointer place-items-center rounded-full bg-primary text-white transition hover:bg-primary"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false)
          } else {
            openProductConversation()
          }
        }}
      >
        {isOpen ? (
          <HugeiconsIcon icon={ChevronDownIcon} className="size-8" />
        ) : (
          <HugeiconsIcon icon={BubbleChatIcon} className="size-8" />
        )}
      </button>
    </div>
  )
}

function RoomsView({
  language,
  rooms,
  currentOrganizationId,
  isPending,
  isError,
  onSelect,
  onClose,
}: {
  language: Language
  rooms: ChatRoomDTO[]
  currentOrganizationId?: number
  isPending: boolean
  isError: boolean
  onSelect: (roomId: number) => void
  onClose: () => void
}) {
  const text = chatCopy[language]

  return (
    <div className="w-100">
      <header className="flex h-16 shrink-0 items-center border-b border-border/70 px-5">
        <h2 className="flex-1 text-lg font-bold">{text.chats}</h2>
        <button
          type="button"
          aria-label={text.closeWidget}
          className="grid size-9 cursor-pointer place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={onClose}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-5" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isPending ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {text.loading}
          </p>
        ) : isError ? (
          <p className="p-6 text-center text-sm text-destructive">
            {text.loadError}
          </p>
        ) : rooms.length ? (
          <div className="space-y-1">
            {rooms.map((room) =>
              room.id == null ? null : (
                <button
                  key={room.id}
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-muted"
                  onClick={() => onSelect(room.id!)}
                >
                  <ChatAvatar
                    name={getRoomTitle(room, currentOrganizationId)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">
                      {getRoomTitle(room, currentOrganizationId)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {room.branchName ||
                        (room.status === "CLOSED"
                          ? text.closed
                          : text.openChat)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatChatTime(room.updatedAt, language)}
                  </span>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
            <HugeiconsIcon
              icon={BubbleChatIcon}
              className="size-9 opacity-50"
            />
            <p className="mt-3 text-sm">{text.noChats}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageBubble({
  message,
  isOwn,
  language,
}: {
  message: ChatMessageDTO
  isOwn: boolean
  language: Language
}) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm",
          isOwn
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-muted text-foreground"
        )}
      >
        {message.attachment?.s3Url ? (
          message.type === "IMAGE" ? (
            <img
              src={message.attachment.s3Url}
              alt={message.attachment.fileName || ""}
              className="mb-2 max-h-56 rounded-xl object-cover"
            />
          ) : (
            <a
              href={message.attachment.s3Url}
              target="_blank"
              rel="noreferrer"
              className="mb-1 block truncate underline"
            >
              {message.attachment.fileName || message.attachment.s3Url}
            </a>
          )
        ) : null}
        {message.text ? (
          <p className="wrap-break-word whitespace-pre-wrap">{message.text}</p>
        ) : null}
        <time
          dateTime={message.createdAt}
          className={cn(
            "mt-1 block text-right text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {formatChatTime(message.createdAt, language)}
        </time>
      </div>
    </div>
  )
}

function ChatAvatar({ name }: { name?: string }) {
  const label = name?.trim() || "Humayro"

  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-primary/40 text-sm font-bold text-white shadow-sm">
      {label.charAt(0).toLocaleUpperCase()}
    </span>
  )
}

function getRoomTitle(
  room?: ChatRoomDTO,
  currentOrganizationId?: number,
  fallback?: string
) {
  if (!room) return fallback || "Humayro"
  return currentOrganizationId === room.organizationId
    ? room.customerName || fallback || "Humayro"
    : room.organizationName || fallback || "Humayro"
}

function formatChatTime(value: string | undefined, language: Language) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat(language === "ru" ? "ru-RU" : "uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
