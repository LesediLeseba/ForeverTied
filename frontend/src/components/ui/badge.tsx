import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider',
  {
    variants: {
      variant: {
        default: 'border-line bg-secondary/50 text-ink',
        active: 'border-[#1B2A26]/20 bg-[#1B2A26]/10 text-primary',
        unassigned: 'border-line bg-surface text-ink-muted',
        damaged: 'border-[#C2543F]/25 bg-[#F7ECE8] text-[#8C3B2A]',
        outline: 'border-line bg-transparent text-ink-muted',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
