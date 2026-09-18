import { describe, expect, it } from 'vitest'

import { birthYear, cn, formatDate, initials } from './utils'

describe('birthYear', () => {
  it('extracts the birth year from a dates range', () => {
    expect(birthYear('1980 - 2026')).toBe('1980')
    expect(birthYear('1948-2026')).toBe('1948')
  })

  it('returns null when no year is present', () => {
    expect(birthYear('dates unknown')).toBeNull()
    expect(birthYear(null)).toBeNull()
  })
})

describe('initials', () => {
  it('takes up to two initials', () => {
    expect(initials('Nomvula Grace Dlamini')).toBe('NG')
    expect(initials('Pieter')).toBe('P')
  })
})

describe('cn', () => {
  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('formatDate', () => {
  it('formats an ISO timestamp and tolerates junk', () => {
    expect(formatDate('2026-01-15T10:00:00Z')).toMatch(/2026/)
    expect(formatDate('not-a-date')).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })
})
