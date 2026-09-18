import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import LandingPage from './LandingPage'

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage', () => {
  it('leads with the B2B headline and partner CTA', () => {
    renderLanding()

    expect(
      screen.getByRole('heading', { level: 1, name: /Preserving Lives\./i }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('hero-partner-cta')).toHaveTextContent(
      'Partner With Us',
    )
  })

  it('links the live sample card to /memorials/sample', () => {
    renderLanding()

    expect(screen.getByTestId('sample-memorial-link')).toHaveAttribute(
      'href',
      '/memorials/sample',
    )
    expect(screen.getByTestId('sample-preview-card')).toHaveAttribute(
      'href',
      '/memorials/sample',
    )
  })

  it('shows the three how-it-works steps', () => {
    renderLanding()

    expect(screen.getByTestId('how-it-works-step-01')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works-step-02')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works-step-03')).toBeInTheDocument()
  })

  it('offers the three partner tiers', () => {
    renderLanding()

    for (const tier of ['standard', 'growth', 'enterprise']) {
      expect(screen.getByTestId(`package-${tier}`)).toBeInTheDocument()
      expect(screen.getByTestId(`package-${tier}-cta`)).toBeInTheDocument()
    }
  })
})
