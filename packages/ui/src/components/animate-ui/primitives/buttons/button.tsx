'use client';

import { motion, type HTMLMotionProps } from 'motion/react';
import { type VariantProps } from 'class-variance-authority';

import { Slot, type WithAsChild } from '@workspace/ui/components/animate-ui/primitives/animate/slot';
import { buttonVariants } from '@workspace/ui/components/button';
import { cn } from '@workspace/ui/lib/utils';

type ButtonProps = WithAsChild<
  HTMLMotionProps<'button'> &
    VariantProps<typeof buttonVariants> & {
      hoverScale?: number;
      tapScale?: number;
    }
>;

function Button({
  className,
  variant = 'default',
  size = 'default',
  hoverScale = 1.05,
  tapScale = 0.95,
  asChild = false,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : motion.button;

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      whileTap={{ scale: tapScale }}
      whileHover={{ scale: hoverScale }}
      {...props}
    />
  );
}

export { Button, type ButtonProps };
