import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PlatesPage from './PlatesPage'
import type { QRCode, QRCodeListResponse } from '@/lib/types'

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

import { fetchQrCodes, generateQrBatch } from '@/lib/api'

const plate = (code: string, status: QRCode['status'] = 'unassigned'): QRCode => ({
  id: `id-${code}`,
  code_identifier: code,
  status,
  memorial_id: null,
  created_at: '2026-09-01T08:00:00Z',
  scan_url: `/q/${code}`,
  memorial_slug: null,
  deceased_name: null,
})

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlatesPage />
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('PlatesPage (batch generator)', () => {
  beforeEach(() => {
    vi.mocked(fetchQrCodes).mockReset()
    vi.mocked(generateQrBatch).mockReset()
  })

  it('lists existing plates with download controls and data-testids', async () => {
    const response: QRCodeListResponse = {
      items: [plate('K9X2P7A1'), plate('B4M8Q2ZT', 'active')],
      total: 2,
      limit: 500,
      offset: 0,
      counts_by_status: { unassigned: 1, active: 1 },
    }
    vi.mocked(fetchQrCodes).mockResolvedValue(response)

    renderPage()

    const grid = await screen.findByTestId('qr-code-grid')
    const cards = within(grid).getAllByTestId('qr-code-card')
    expect(cards).toHaveLength(2)
    expect(screen.getByTestId('qr-download-btn-k9x2p7a1')).toBeInTheDocument()

    const firstCard = cards[0]
    expect(within(firstCard).getByTestId('qr-code-identifier')).toHaveTextContent(
      'K9X2P7A1',
    )
    expect(within(firstCard).getByTestId('qr-code-status')).toHaveTextContent(
      'unassigned',
    )
    expect(screen.getByTestId('stat-active-plates')).toHaveTextContent('1')
  })

  it('generates a batch from the quantity input', async () => {
    vi.mocked(fetchQrCodes).mockResolvedValue({
      items: [],
      total: 0,
      limit: 500,
      offset: 0,
      counts_by_status: {},
    })
    vi.mocked(generateQrBatch).mockResolvedValue({
      generated: 3,
      quantity_requested: 3,
      qr_codes: [plate('AAA11111'), plate('BBB22222'), plate('CCC33333')],
    })

    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByTestId('batch-quantity-input')
    await user.clear(input)
    await user.type(input, '3')
    await user.click(screen.getByTestId('generate-batch-btn'))

    await waitFor(() => expect(generateQrBatch).toHaveBeenCalledWith(3))
  })

  it('rejects an out-of-range quantity without calling the API', async () => {
    vi.mocked(fetchQrCodes).mockResolvedValue({
      items: [],
      total: 0,
      limit: 500,
      offset: 0,
      counts_by_status: {},
    })

    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByTestId('batch-quantity-input')
    await user.clear(input)
    await user.type(input, '0')
    await user.click(screen.getByTestId('generate-batch-btn'))

    expect(await screen.findByTestId('batch-form-error')).toBeInTheDocument()
    expect(generateQrBatch).not.toHaveBeenCalled()
  })

  it('filters plates by status', async () => {
    vi.mocked(fetchQrCodes).mockResolvedValue({
      items: [plate('K9X2P7A1')],
      total: 1,
      limit: 500,
      offset: 0,
      counts_by_status: { unassigned: 1 },
    })

    const user = userEvent.setup()
    renderPage()

    await screen.findByTestId('qr-code-grid')
    await user.click(screen.getByTestId('plate-filter-active'))

    await waitFor(() =>
      expect(fetchQrCodes).toHaveBeenLastCalledWith({ status: 'active', limit: 500 }),
    )
  })
})
