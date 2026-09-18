import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Tailwind-aware className combiner (shadcn convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Human-friendly date for admin tables. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Pull the birth year out of a dates string such as "1980 - 2026". */
export function birthYear(dates: string | null | undefined): string | null {
  if (!dates) return null
  const match = dates.match(/(1[6-9]\d{2}|20\d{2}|21\d{2})/)
  return match ? match[1] : null
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export const DEFAULT_PORTRAIT =
  'https://images.unsplash.com/photo-1498757581981-8ddb3c0b9b07?auto=format&fit=crop&q=85'

export const LANDSCAPE_BANNER =
  'https://images.unsplash.com/photo-1506669318200-6790d9b4c014?auto=format&fit=crop&q=85'
