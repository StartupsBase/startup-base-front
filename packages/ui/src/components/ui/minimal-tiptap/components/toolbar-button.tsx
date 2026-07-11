import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { Toggle } from "@workspace/ui/components/toggle"
import { cn } from "@workspace/ui/lib/utils"

interface ToolbarButtonProps extends React.ComponentProps<typeof Toggle> {
  isActive?: boolean
  tooltip?: string
  tooltipOptions?: Omit<React.ComponentProps<typeof TooltipContent>, "children">
}

export const ToolbarButton = ({
  isActive,
  children,
  tooltip,
  className,
  tooltipOptions,
  ...props
}: ToolbarButtonProps) => {
  const toggleButton = (
    <Toggle className={cn({ "bg-accent": isActive }, className)} {...props}>
      {children}
    </Toggle>
  )

  if (!tooltip) {
    return toggleButton
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{toggleButton}</TooltipTrigger>
      <TooltipContent {...tooltipOptions}>
        <div className="flex flex-col items-center text-center">{tooltip}</div>
      </TooltipContent>
    </Tooltip>
  )
}

ToolbarButton.displayName = "ToolbarButton"

export default ToolbarButton
