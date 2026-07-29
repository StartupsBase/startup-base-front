"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { PhoneInput } from "@workspace/ui/components/phone-input"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import { Separator } from "@workspace/ui/components/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

export type BookDemoStepperCopy = {
  bookingTitle: string
  bookingDescription: string
  stepTitles: [string, string, string]
  goalTitle: string
  goalDescription: string
  scheduleTitle: string
  scheduleDescription: string
  contactTitle: string
  contactDescription: string
  style: string
  styles: string[]
  day: string
  time: string
  times: string[]
  name: string
  namePlaceholder: string
  phone: string
  next: string
  previous: string
  submit: string
  privacy: string
  requiredChoice: string
  requiredDate: string
  invalidDate: string
  requiredTime: string
  requiredName: string
  invalidPhone: string
  reviewTitle: string
  reviewGoal: string
  reviewSchedule: string
  successTitle: string
  successDescription: string
  successHome: string
}

type Step = "goal" | "schedule" | "contact"
type FieldErrors = Partial<
  Record<"style" | "date" | "time" | "name" | "phone", string>
>

const steps: Step[] = ["goal", "schedule", "contact"]

export function BookDemoStepper({
  language,
  copy,
}: {
  language: "ru" | "uz"
  copy: BookDemoStepperCopy
}) {
  const [step, setStep] = useState<Step>("goal")
  const [highestStep, setHighestStep] = useState(0)
  const [style, setStyle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitted, setSubmitted] = useState(false)

  const currentStep = steps.indexOf(step)

  function validateStep(stepToValidate: Step) {
    const nextErrors: FieldErrors = {}

    if (stepToValidate === "goal" && !style) {
      nextErrors.style = copy.requiredChoice
    }
    if (stepToValidate === "schedule") {
      if (!date) nextErrors.date = copy.requiredDate
      if (date) {
        const selectedDate = new Date(`${date}T00:00:00`)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) nextErrors.date = copy.invalidDate
      }
      if (!time) nextErrors.time = copy.requiredTime
    }
    if (stepToValidate === "contact") {
      if (name.trim().length < 2) nextErrors.name = copy.requiredName
      if (phone.replace(/\D/g, "").length < 12) {
        nextErrors.phone = copy.invalidPhone
      }
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function goForward() {
    if (!validateStep(step)) return
    const nextIndex = Math.min(currentStep + 1, steps.length - 1)
    setHighestStep((value) => Math.max(value, nextIndex))
    setStep(steps[nextIndex] ?? "contact")
  }

  function goBack() {
    setErrors({})
    setStep(steps[Math.max(currentStep - 1, 0)] ?? "goal")
  }

  function selectStep(value: string) {
    const target = value as Step
    const targetIndex = steps.indexOf(target)
    if (targetIndex <= highestStep) {
      setErrors({})
      setStep(target)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStep("contact")) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="items-center py-8 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-8" />
          </div>
          <CardTitle className="text-2xl">{copy.successTitle}</CardTitle>
          <CardDescription className="max-w-md text-pretty">
            {copy.successDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card size="sm" className="bg-muted/40 shadow-none">
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.reviewGoal}
                </p>
                <p className="mt-1 font-medium">{style}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {copy.reviewSchedule}
                </p>
                <p className="mt-1 font-medium">
                  {date} · {time}
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
        <CardFooter>
          <Button asChild size="lg" className="w-full">
            <Link href={`/${language}`}>{copy.successHome}</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-2xl sm:text-3xl">
          {copy.bookingTitle}
        </CardTitle>
        <CardDescription className="max-w-xl text-pretty">
          {copy.bookingDescription}
        </CardDescription>
      </CardHeader>

      <form onSubmit={submit} noValidate>
        <Tabs value={step} onValueChange={selectStep}>
          <div className="px-6 pt-6">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl">
              {steps.map((stepValue, index) => (
                <TabsTrigger
                  key={stepValue}
                  value={stepValue}
                  disabled={index > highestStep}
                  className="h-auto min-h-11 gap-2 rounded-lg px-2 py-2 whitespace-normal"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs">
                    {index < currentStep ? (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        className="size-4"
                      />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="hidden text-left sm:inline">
                    {copy.stepTitles[index]}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <CardContent className="pt-6">
            <TabsContent value="goal" className="mt-0 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{copy.goalTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.goalDescription}
                </p>
              </div>

              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-medium">
                  {copy.style}
                </legend>
                <RadioGroup
                  value={style}
                  onValueChange={(value) => {
                    setStyle(value)
                    setErrors((current) => ({ ...current, style: undefined }))
                  }}
                  aria-invalid={Boolean(errors.style)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {copy.styles.map((option, index) => (
                    <Label
                      key={option}
                      htmlFor={`style-${index}`}
                      className={`min-h-24 cursor-pointer items-start rounded-xl border p-4 transition-colors hover:bg-muted/50 ${
                        style === option
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : ""
                      }`}
                    >
                      <RadioGroupItem
                        id={`style-${index}`}
                        value={option}
                        aria-label={option}
                      />
                      <span className="leading-5">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
                {errors.style ? (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.style}
                  </p>
                ) : null}
              </fieldset>
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{copy.scheduleTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.scheduleDescription}
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="demo-date">
                    <HugeiconsIcon icon={Calendar03Icon} className="size-4" />
                    {copy.day}
                  </Label>
                  <Input
                    id="demo-date"
                    type="date"
                    value={date}
                    aria-invalid={Boolean(errors.date)}
                    onChange={(event) => {
                      setDate(event.target.value)
                      setErrors((current) => ({ ...current, date: undefined }))
                    }}
                  />
                  {errors.date ? (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.date}
                    </p>
                  ) : null}
                </div>

                <fieldset className="space-y-2">
                  <legend className="flex items-center gap-2 text-sm font-medium">
                    <HugeiconsIcon icon={Clock01Icon} className="size-4" />
                    {copy.time}
                  </legend>
                  <RadioGroup
                    value={time}
                    onValueChange={(value) => {
                      setTime(value)
                      setErrors((current) => ({ ...current, time: undefined }))
                    }}
                    aria-invalid={Boolean(errors.time)}
                    className="grid grid-cols-2 gap-2"
                  >
                    {copy.times.map((option, index) => (
                      <Label
                        key={option}
                        htmlFor={`time-${index}`}
                        className={`h-10 cursor-pointer justify-center rounded-full border px-3 transition-colors hover:bg-muted/50 ${
                          time === option
                            ? "border-primary bg-primary text-primary-foreground"
                            : ""
                        }`}
                      >
                        <RadioGroupItem
                          id={`time-${index}`}
                          value={option}
                          className="sr-only"
                        />
                        {option}
                      </Label>
                    ))}
                  </RadioGroup>
                  {errors.time ? (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.time}
                    </p>
                  ) : null}
                </fieldset>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="mt-0 space-y-6">
              <div>
                <h2 className="text-lg font-semibold">{copy.contactTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {copy.contactDescription}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="demo-name">{copy.name}</Label>
                  <Input
                    id="demo-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    placeholder={copy.namePlaceholder}
                    aria-invalid={Boolean(errors.name)}
                    onChange={(event) => {
                      setName(event.target.value)
                      setErrors((current) => ({ ...current, name: undefined }))
                    }}
                  />
                  {errors.name ? (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.name}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demo-phone">{copy.phone}</Label>
                  <PhoneInput
                    id="demo-phone"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    aria-invalid={Boolean(errors.phone)}
                    onChange={(value) => {
                      setPhone(value)
                      setErrors((current) => ({ ...current, phone: undefined }))
                    }}
                  />
                  {errors.phone ? (
                    <p role="alert" className="text-sm text-destructive">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
              </div>

              <Card size="sm" className="bg-muted/40 shadow-none">
                <CardHeader>
                  <CardTitle>{copy.reviewTitle}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {copy.reviewGoal}
                    </p>
                    <p className="mt-1 font-medium">{style}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {copy.reviewSchedule}
                    </p>
                    <p className="mt-1 font-medium">
                      {date} · {time}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <HugeiconsIcon
                  icon={CheckmarkCircle02Icon}
                  className="size-4 shrink-0 text-primary"
                />
                {copy.privacy}
              </p>
            </TabsContent>
          </CardContent>

          <Separator />
          <CardFooter className="justify-between gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={currentStep === 0}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
              {copy.previous}
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={goForward}>
                {copy.next}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            ) : (
              <Button type="submit">
                {copy.submit}
                <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
              </Button>
            )}
          </CardFooter>
        </Tabs>
      </form>
    </Card>
  )
}
