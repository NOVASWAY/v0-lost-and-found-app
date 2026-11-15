import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_2px_8px_-2px_oklch(var(--primary)/0.35)] hover:bg-primary/90 hover:shadow-[0_4px_16px_-2px_oklch(var(--primary)/0.45)] active:scale-[0.98]",
        destructive:
          "bg-destructive text-white shadow-[0_2px_8px_-2px_oklch(var(--destructive)/0.35)] hover:bg-destructive/90 hover:shadow-[0_4px_16px_-2px_oklch(var(--destructive)/0.45)] focus-visible:ring-destructive/30 active:scale-[0.98]",
        outline:
          "border bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground hover:border-transparent dark:bg-input/30 dark:border-input dark:hover:bg-input/50 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "glass text-card-foreground shadow-[0_4px_24px_-4px_oklch(var(--foreground)/0.1)] hover:bg-white/10 dark:hover:bg-white/5 active:scale-[0.98]",
        gradient:
          "gradient-ring bg-gradient-to-r from-primary via-primary/80 to-accent text-primary-foreground shadow-[0_4px_20px_-4px_oklch(var(--primary)/0.4)] hover:from-primary hover:via-primary/90 hover:to-accent hover:shadow-[0_8px_32px_-4px_oklch(var(--primary)/0.5)] active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3.5",
        lg: "h-12 rounded-xl px-7 has-[>svg]:px-5",
        xl: "h-14 rounded-2xl px-9 text-base has-[>svg]:px-6",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }