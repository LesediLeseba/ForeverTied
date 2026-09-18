import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck } from 'lucide-react'

import { LANDSCAPE_BANNER } from '@/lib/utils'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${LANDSCAPE_BANNER})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bone/85 via-bone/92 to-bone" aria-hidden />

      <div className="container relative py-20 md:py-28">
        <p className="eyebrow mb-6">
          For funeral homes &amp; families across South Africa
        </p>

        <h1 className="max-w-4xl text-display-xl font-semibold text-ink">
          Preserving Lives.
          <br />
          <span className="italic text-primary">Connecting Generations.</span>
        </h1>

        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-muted">
          A weatherproof stainless steel QR plate, fixed to the headstone, opens a
          living memorial page — photographs, the family&rsquo;s own words, service
          details and a place for visitors to leave memories. No app to install.
          No login. It simply works, in full sunlight, twenty years from now.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href="#packages"
            data-testid="hero-partner-cta"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-base font-semibold text-bone hover:bg-primary-hover"
          >
            Partner With Us
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
          <Link
            to="/memorials/sample"
            data-testid="hero-sample-link"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface/80 px-7 py-3.5 text-base font-semibold text-ink hover:bg-surface"
          >
            View a live sample memorial
          </Link>
        </div>

        <dl className="mt-14 grid max-w-3xl grid-cols-1 gap-6 border-t border-line pt-8 sm:grid-cols-3">
          {[
            {
              term: '316-grade steel',
              detail: 'Plates survive coastal salt air, Highveld hail and pressure washing.',
            },
            {
              term: 'No app required',
              detail: 'Any phone camera opens the page. Zero downloads for grieving families.',
            },
            {
              term: 'Static codes, live pages',
              detail: 'The plate never changes; the story behind it can be updated forever.',
            },
          ].map((item) => (
            <div key={item.term}>
              <dt className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-moss" aria-hidden />
                {item.term}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
