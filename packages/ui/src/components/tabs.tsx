"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@workspace/ui/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full items-center justify-center text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
  {
    variants: {
      variant: {
        default:
          "rounded-xl border border-border/70 bg-muted/50 p-1 shadow-xs group-data-horizontal/tabs:h-10 group-data-vertical/tabs:rounded-xl",
        line: "gap-1 rounded-none border-b border-border bg-transparent p-0",
        stepper:
          "grid h-auto w-full auto-cols-fr grid-flow-col gap-1 rounded-2xl border border-border/70 bg-muted/40 p-1.5 shadow-xs",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
  VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-[color,background-color,border-color,box-shadow,transform] duration-300 ease-out group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:bg-background/60 hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 motion-reduce:transition-none motion-reduce:active:scale-100 dark:text-muted-foreground dark:hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=default]/tabs-list:data-[state=active]:border-border/60 group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm dark:group-data-[variant=default]/tabs-list:data-[state=active]:border-input dark:group-data-[variant=default]/tabs-list:data-[state=active]:bg-input/30",
        "group-data-[variant=stepper]/tabs-list:min-h-14 group-data-[variant=stepper]/tabs-list:gap-2 group-data-[variant=stepper]/tabs-list:rounded-xl group-data-[variant=stepper]/tabs-list:px-2 group-data-[variant=stepper]/tabs-list:py-2 group-data-[variant=stepper]/tabs-list:whitespace-normal group-data-[variant=stepper]/tabs-list:hover:bg-background/70 sm:group-data-[variant=stepper]/tabs-list:justify-start sm:group-data-[variant=stepper]/tabs-list:gap-3 sm:group-data-[variant=stepper]/tabs-list:px-3",
        "group-data-[variant=stepper]/tabs-list:data-[complete=true]:text-foreground group-data-[variant=stepper]/tabs-list:data-[state=active]:border-border/70 group-data-[variant=stepper]/tabs-list:data-[state=active]:bg-background group-data-[variant=stepper]/tabs-list:data-[state=active]:text-foreground group-data-[variant=stepper]/tabs-list:data-[state=active]:shadow-sm dark:group-data-[variant=stepper]/tabs-list:data-[state=active]:border-input dark:group-data-[variant=stepper]/tabs-list:data-[state=active]:bg-input/30",
        "group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]]:border-border group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]]:bg-background group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]]:transition-[color,background-color,border-color,transform] group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]]:duration-300 group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]]:ease-out group-data-[variant=stepper]/tabs-list:data-[complete=true]:[&_[data-slot=step-indicator]]:border-primary/20 group-data-[variant=stepper]/tabs-list:data-[complete=true]:[&_[data-slot=step-indicator]]:bg-primary/10 group-data-[variant=stepper]/tabs-list:data-[complete=true]:[&_[data-slot=step-indicator]]:text-primary group-data-[variant=stepper]/tabs-list:data-[state=active]:[&_[data-slot=step-indicator]]:scale-105 group-data-[variant=stepper]/tabs-list:data-[state=active]:[&_[data-slot=step-indicator]]:border-primary group-data-[variant=stepper]/tabs-list:data-[state=active]:[&_[data-slot=step-indicator]]:bg-primary group-data-[variant=stepper]/tabs-list:data-[state=active]:[&_[data-slot=step-indicator]]:text-primary-foreground group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]>svg]:animate-in group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]>svg]:duration-300 group-data-[variant=stepper]/tabs-list:[&_[data-slot=step-indicator]>svg]:zoom-in-75",
        "group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:px-3 group-data-[variant=line]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-[variant=line]/tabs-list:after:-bottom-px group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:after:scale-x-0 group-data-[variant=line]/tabs-list:after:rounded-full group-data-[variant=line]/tabs-list:after:bg-foreground group-data-[variant=line]/tabs-list:after:transition-transform group-data-[variant=line]/tabs-list:data-[state=active]:text-foreground group-data-[variant=line]/tabs-list:data-[state=active]:after:scale-x-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 text-sm outline-none data-[state=active]:animate-in data-[state=active]:duration-300 data-[state=active]:ease-out data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-1 motion-reduce:data-[state=active]:animate-none",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
