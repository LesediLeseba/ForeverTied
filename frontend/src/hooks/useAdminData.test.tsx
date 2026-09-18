import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { queryKeys, useAssignQrCode, useCreateMemorial } from './useAdminData'
import type { QRCode } from '@/lib/types'

vi.mock('@/lib/api', () => ({
  apiErrorMessage: () => 'boom',
  assignQrCode: vi.fn(),
  createMemorial: vi.fn(),
  fetchQrCodes: vi.fn(),
  fetchMemorials: vi.fn(),
  generateQrBatch: vi.fn(),
  unassignQrCode: vi.fn(),
  setQrStatus: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { assignQrCode, createMemorial } from '@/lib/api'
import { toast } from 'sonner'

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { wrapper, invalidate }
}

const assigned: QRCode = {
  id: 'plate-1',
  code_identifier: 'K9X2P7A1',
  status: 'active',
  memorial_id: 'mem-1',
  created_at: '2026-09-01T08:00:00Z',
  scan_url: '/q/K9X2P7A1',
  memorial_slug: 'nomvula-grace-dlamini-1948',
  deceased_name: 'Nomvula Grace Dlamini',
}

describe('useAssignQrCode', () => {
  beforeEach(() => {
    vi.mocked(assignQrCode).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  it('binds the plate and invalidates both admin caches', async () => {
    vi.mocked(assignQrCode).mockResolvedValue(assigned)
    const { wrapper, invalidate } = makeWrapper()
    const { result } = renderHook(() => useAssignQrCode(), { wrapper })

    result.current.mutate({ codeIdentifier: 'K9X2P7A1', memorialId: 'mem-1' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(assignQrCode).toHaveBeenCalledWith('K9X2P7A1', 'mem-1', undefined)
    expect(toast.success).toHaveBeenCalledWith(
      'Plate K9X2P7A1 bound to Nomvula Grace Dlamini',
    )

    const keys = invalidate.mock.calls.map(([options]) => options?.queryKey)
    expect(keys).toContainEqual(['admin', 'memorials'])
    expect(keys).toContainEqual(['admin', 'qr-codes'])
  })

  it('passes the force flag through for re-binding', async () => {
    vi.mocked(assignQrCode).mockResolvedValue(assigned)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignQrCode(), { wrapper })

    result.current.mutate({
      codeIdentifier: 'K9X2P7A1',
      memorialId: 'mem-2',
      force: true,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(assignQrCode).toHaveBeenCalledWith('K9X2P7A1', 'mem-2', true)
  })

  it('surfaces an API error as a toast', async () => {
    vi.mocked(assignQrCode).mockRejectedValue(new Error('conflict'))
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useAssignQrCode(), { wrapper })

    result.current.mutate({ codeIdentifier: 'K9X2P7A1', memorialId: 'mem-1' })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(toast.error).toHaveBeenCalled()
  })
})

describe('useCreateMemorial', () => {
  beforeEach(() => {
    vi.mocked(createMemorial).mockReset()
  })

  it('creates a memorial and toasts the resulting slug', async () => {
    vi.mocked(createMemorial).mockResolvedValue({
      ...assigned,
      deceased_name: 'John Doe',
      slug: 'john-doe-1980',
      qr_code_count: 0,
      active_qr_codes: 0,
      bound_codes: [],
    } as never)
    const { wrapper } = makeWrapper()
    const { result } = renderHook(() => useCreateMemorial(), { wrapper })

    result.current.mutate({
      deceased_name: 'John Doe',
      dates: '1980 - 2026',
      biography: 'A life well lived.',
      photo_url: null,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(createMemorial).toHaveBeenCalledWith({
      deceased_name: 'John Doe',
      dates: '1980 - 2026',
      biography: 'A life well lived.',
      photo_url: null,
    })
    expect(toast.success).toHaveBeenCalledWith(
      'Memorial created → /memorials/john-doe-1980',
    )
  })
})

describe('queryKeys', () => {
  it('namespaces admin caches', () => {
    expect(queryKeys.memorials()).toEqual(['admin', 'memorials', ''])
    expect(queryKeys.qrCodes({ status: 'active' })).toEqual([
      'admin',
      'qr-codes',
      'active',
    ])
  })
})
