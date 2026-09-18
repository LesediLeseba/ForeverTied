import * as React from 'react'

import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
          {description}
        </p>
      </div>
      {children}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <div
      data-testid="empty-state"
      className="rounded-lg border border-dashed border-line bg-bone px-6 py-12 text-center"
    >
      <p className="font-serif text-xl text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function StatTile({
  label,
  value,
  tone = 'default',
  testId,
}: {
  label: string
  value: React.ReactNode
  tone?: 'default' | 'positive' | 'warning'
  testId: string
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        'rounded-lg border border-line bg-surface px-4 py-3',
        tone === 'positive' && 'border-primary/20 bg-primary/[0.04]',
        tone === 'warning' && 'border-[#C2543F]/20 bg-[#F7ECE8]/60',
      )}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-widest2 text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-serif text-2xl font-semibold text-ink">{value}</p>
    </div>
  )
}
