import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import InventoryPage from './InventoryPage'
import type { MemorialAdmin, QRCode, QRCodeListResponse } from '@/lib/types'

vi.mock('@/lib/api', () => ({
  apiErrorMessage: () => 'error',
  fetchQrCodes: vi.fn(),
  fetchMemorials: vi.fn(),
  generateQrBatch: vi.fn(),
  assignQrCode: vi.fn(),
  unassignQrCode: vi.fn(),
  setQrStatus: vi.fn(),
  createMemorial: vi.fn(),
}))

import { fetchMemorials, fetchQrCodes, setQrStatus, unassignQrCode } from '@/lib/api'

const plate = (
  code: string,
  overrides: Partial<QRCode> = {},
): QRCode => ({
  id: `id-${code}`,
  code_identifier: code,
  status: 'unassigned',
  memorial_id: null,
  created_at: '2026-09-01T08:00:00Z',
  scan_url: `/q/${code}`,
  memorial_slug: null,
  deceased_name: null,
  ...overrides,
})

const memorial: MemorialAdmin = {
  id: 'mem-1',
  deceased_name: 'Nomvula Grace Dlamini',
  slug: 'nomvula-grace-dlamini-1948',
  dates: '1948 - 2026',
  biography: 'Teacher.',
  photo_url: null,
  created_at: '2026-09-01T08:00:00Z',
  qr_code_count: 0,
  active_qr_codes: 0,
  bound_codes: [],
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <InventoryPage />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function mockInventory(plates: QRCode[]) {
  const response: QRCodeListResponse = {
    items: plates,
    total: plates.length,
    limit: 500,
    offset: 0,
    counts_by_status: { unassigned: plates.length },
  }
  vi.mocked(fetchQrCodes).mockResolvedValue(response)
  vi.mocked(fetchMemorials).mockResolvedValue({
    items: [memorial],
    total: 1,
    limit: 200,
    offset: 0,
  })
}

describe('InventoryPage (assignment + damage confirmation)', () => {
  beforeEach(() => {
    for (const fn of [fetchQrCodes, fetchMemorials, unassignQrCode, setQrStatus]) {
      vi.mocked(fn).mockReset()
    }
  })

  it('confirms before marking a plate damaged', async () => {
    mockInventory([
      plate('B4M8Q2ZT', {
        status: 'active',
        memorial_id: 'mem-1',
        memorial_slug: memorial.slug,
        deceased_name: memorial.deceased_name,
      }),
    ])
    vi.mocked(setQrStatus).mockResolvedValue(plate('B4M8Q2ZT', { status: 'damaged' }))

    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderPage()

    const row = (await screen.findByTestId('qr-code-row')) as HTMLElement
    await user.click(within(row).getByTestId('mark-damaged-btn-b4m8q2zt'))

    const dialog = await screen.findByTestId('damage-confirm-dialog')
    expect(dialog).toHaveTextContent('B4M8Q2ZT')
    expect(dialog).toHaveTextContent('Nomvula Grace Dlamini')

    await user.click(screen.getByTestId('damage-confirm-btn'))

    await waitFor(() =>
      expect(setQrStatus).toHaveBeenCalledWith('B4M8Q2ZT', 'damaged'),
    )
  })

  it('can cancel the damage dialog without calling the API', async () => {
    mockInventory([plate('CCC33333')])

    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderPage()

    const row = (await screen.findByTestId('qr-code-row')) as HTMLElement
    await user.click(within(row).getByTestId('mark-damaged-btn-ccc33333'))
    await screen.findByTestId('damage-confirm-dialog')
    await user.click(screen.getByTestId('damage-cancel-btn'))

    await waitFor(() =>
      expect(screen.queryByTestId('damage-confirm-dialog')).not.toBeInTheDocument(),
    )
    expect(setQrStatus).not.toHaveBeenCalled()
  })

  it('unassigns a bound plate', async () => {
    mockInventory([
      plate('DDD44444', {
        status: 'active',
        memorial_id: 'mem-1',
        memorial_slug: memorial.slug,
        deceased_name: memorial.deceased_name,
      }),
    ])
    vi.mocked(unassignQrCode).mockResolvedValue(plate('DDD44444'))

    const user = userEvent.setup({ pointerEventsCheck: 0 })
    renderPage()

    const row = (await screen.findByTestId('qr-code-row')) as HTMLElement
    await user.click(within(row).getByTestId('unassign-btn-ddd44444'))

    await waitFor(() => expect(unassignQrCode).toHaveBeenCalledWith('DDD44444'))
  })
})
