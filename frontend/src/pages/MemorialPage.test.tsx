import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MemorialPage from './MemorialPage'
import type { Memorial } from '@/lib/types'

const memorial: Memorial = {
  id: 'b7f0f6a4-1111-4b0a-9b1a-6b0f2c2d4e5f',
  deceased_name: 'Nomvula Grace Dlamini',
  slug: 'nomvula-grace-dlamini-1948',
  dates: '1948 - 2026',
  biography:
    'Teacher for forty-one years.\n\nShe kept a garden that refused to obey the seasons.',
  photo_url: null,
  created_at: '2026-09-01T08:00:00Z',
}

vi.mock('@/lib/api', () => ({
  fetchMemorialBySlug: vi.fn(),
}))

import { fetchMemorialBySlug } from '@/lib/api'

function renderPage(slug = 'nomvula-grace-dlamini-1948') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/memorials/${slug}`]}>
        <Routes>
          <Route path="/memorials/:slug" element={<MemorialPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('MemorialPage', () => {
  beforeEach(() => {
    vi.mocked(fetchMemorialBySlug).mockReset()
  })

  it('renders the memorial fetched by slug', async () => {
    vi.mocked(fetchMemorialBySlug).mockResolvedValue(memorial)
    renderPage()

    await waitFor(() =>
      expect(screen.getByTestId('memorial-name')).toHaveTextContent(
        'Nomvula Grace Dlamini',
      ),
    )
    expect(fetchMemorialBySlug).toHaveBeenCalledWith('nomvula-grace-dlamini-1948')
    expect(screen.getByTestId('memorial-dates')).toHaveTextContent('1948 - 2026')

    // Both biography paragraphs render.
    const biography = screen.getByTestId('memorial-biography')
    expect(biography).toHaveTextContent('Teacher for forty-one years.')
    expect(biography).toHaveTextContent('refused to obey the seasons')
  })

  it('falls back to the default portrait when no photo URL is set', async () => {
    vi.mocked(fetchMemorialBySlug).mockResolvedValue(memorial)
    renderPage()

    const portrait = await screen.findByTestId('memorial-portrait')
    expect(portrait).toHaveAttribute('src', expect.stringContaining('unsplash.com'))
    expect(portrait).toHaveAttribute(
      'alt',
      'Portrait of Nomvula Grace Dlamini',
    )
  })

  it('shows a helpful message when the memorial does not exist', async () => {
    vi.mocked(fetchMemorialBySlug).mockRejectedValue(new Error('404 not found'))
    renderPage('missing-slug')

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /memorial is not available/i }),
      ).toBeInTheDocument(),
    )
    expect(screen.getByTestId('memorial-home-link')).toBeInTheDocument()
  })
})
