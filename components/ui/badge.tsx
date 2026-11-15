import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-xl border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[0_1px_3px_oklch(var(--primary)/0.3)] hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white shadow-[0_1px_3px_oklch(var(--destructive)/0.3)] hover:bg-destructive/90 focus-visible:ring-destructive/30",
        outline: "text-foreground hover:bg-accent hover:text-accent-foreground",
        glass: "glass text-card-foreground border-border/50 hover:bg-white/5 dark:hover:bg-white/2.5",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90",
        success: "bg-emerald-500 text-white shadow-[0_1px_3px_oklch(0.6_0.18_142/0.3)] hover:bg-emerald-500/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }