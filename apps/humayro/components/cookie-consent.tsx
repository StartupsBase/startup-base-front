"use client"

import { CookieIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import * as React from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

interface CookieConsentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "small" | "mini"
  demo?: boolean
  onAcceptCallback?: () => void
  onDeclineCallback?: () => void
  heading?: string
  description?: string
  consentText?: string
  acceptLabel?: string
  declineLabel?: string
  learnMoreLabel?: string
  learnMoreHref?: string
}

const consentCookieName = "humayro_cookie_consent"
const consentMaxAge = 60 * 60 * 24 * 365

const CookieConsent = React.forwardRef<HTMLDivElement, CookieConsentProps>(
  (
    {
      variant = "default",
      demo = false,
      onAcceptCallback = () => {},
      onDeclineCallback = () => {},
      className,
      heading = "We use cookies",
      description = "We use cookies to ensure you get the best experience on our website. For more information on how we use cookies, please see our cookie policy.",
      consentText = 'By clicking "Accept", you agree to our use of cookies.',
      acceptLabel = "Accept",
      declineLabel = "Decline",
      learnMoreLabel = "Learn more",
      learnMoreHref = "#",
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [hide, setHide] = React.useState(false)

    const saveConsent = React.useCallback((value: "accepted" | "declined") => {
      const secure = window.location.protocol === "https:" ? "; Secure" : ""
      document.cookie = `${consentCookieName}=${value}; Max-Age=${consentMaxAge}; Path=/; SameSite=Lax${secure}`
    }, [])

    const handleAccept = React.useCallback(() => {
      setIsOpen(false)
      saveConsent("accepted")
      setTimeout(() => {
        setHide(true)
      }, 700)
      onAcceptCallback()
    }, [onAcceptCallback, saveConsent])

    const handleDecline = React.useCallback(() => {
      setIsOpen(false)
      saveConsent("declined")
      setTimeout(() => {
        setHide(true)
      }, 700)
      onDeclineCallback()
    }, [onDeclineCallback, saveConsent])

    React.useEffect(() => {
      try {
        const hasDecision = document.cookie
          .split("; ")
          .some((cookie) => cookie.startsWith(`${consentCookieName}=`))

        setIsOpen(!hasDecision || demo)
        if (hasDecision && !demo) {
          setTimeout(() => {
            setHide(true)
          }, 700)
        }
      } catch (error) {
        console.warn("Cookie consent error:", error)
      }
    }, [demo])

    if (hide) return null

    const containerClasses = cn(
      "fixed z-50 transition-all duration-700",
      !isOpen ? "translate-y-full opacity-0" : "translate-y-0 opacity-100",
      className
    )

    const commonWrapperProps = {
      ref,
      className: cn(
        containerClasses,
        variant === "mini"
          ? "right-0 bottom-4 left-0 w-full sm:left-4 sm:max-w-3xl"
          : "right-0 bottom-0 left-0 w-full sm:bottom-4 sm:left-4 sm:max-w-md"
      ),
      ...props,
    }

    if (variant === "default") {
      return (
        <div {...commonWrapperProps}>
          <Card className="m-3 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{heading}</CardTitle>
              <HugeiconsIcon icon={CookieIcon} className="size-5" />
            </CardHeader>
            <CardContent className="space-y-2">
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
              <p className="text-xs text-muted-foreground">{consentText}</p>
              <a
                href={learnMoreHref}
                className="text-xs text-primary underline underline-offset-4 hover:no-underline"
              >
                {learnMoreLabel}
              </a>
            </CardContent>
            <CardFooter className="flex gap-2 pt-2">
              <Button
                onClick={handleDecline}
                variant="secondary"
                className="flex-1"
              >
                {declineLabel}
              </Button>
              <Button onClick={handleAccept} className="flex-1">
                {acceptLabel}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    if (variant === "small") {
      return (
        <div {...commonWrapperProps}>
          <Card className="m-3 shadow-lg">
            <CardHeader className="flex h-0 flex-row items-center justify-between space-y-0 px-4 pb-2">
              <CardTitle className="text-base">{heading}</CardTitle>
              <HugeiconsIcon icon={CookieIcon} className="size-4" />
            </CardHeader>
            <CardContent className="px-4 pt-0 pb-2">
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </CardContent>
            <CardFooter className="flex h-0 gap-2 px-4 py-2">
              <Button
                onClick={handleDecline}
                variant="secondary"
                size="sm"
                className="flex-1 rounded-full"
              >
                {declineLabel}
              </Button>
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1 rounded-full"
              >
                {acceptLabel}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    if (variant === "mini") {
      return (
        <div {...commonWrapperProps}>
          <Card className="mx-3 p-0 py-3 shadow-lg">
            <CardContent className="grid gap-4 p-0 px-3.5 sm:flex">
              <CardDescription className="flex-1 text-xs sm:text-sm">
                {description}
              </CardDescription>
              <div className="flex items-center justify-end gap-2 sm:gap-3">
                <Button
                  onClick={handleDecline}
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                >
                  {declineLabel}
                </Button>
                <Button
                  onClick={handleAccept}
                  size="sm"
                  className="h-7 text-xs"
                >
                  {acceptLabel}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return null
  }
)

CookieConsent.displayName = "CookieConsent"
export { CookieConsent }
export default CookieConsent
