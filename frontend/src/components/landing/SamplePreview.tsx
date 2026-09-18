import { Link } from 'react-router-dom'
import { ArrowUpRight, ScanLine } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { DEFAULT_PORTRAIT } from '@/lib/utils'

export default function SamplePreview() {
  return (
    <section id="sample" className="border-b border-line bg-surface">
      <div className="container py-20 md:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="eyebrow mb-4">Interactive live sample</p>
            <h2 className="text-display-md font-semibold text-ink">
              See exactly what a visitor sees
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              This is a real memorial page served from the MemorialCode database,
              not a screenshot. Open it the way a visitor would — by scanning the
              plate, or by tapping the card.
            </p>

            <ul className="mt-8 space-y-3 text-[0.95rem] leading-relaxed text-ink-muted">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
                Portrait, dates and biography laid out for reading in sunlight.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
                Loads in under a second on a cemetery-edge mobile connection.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-moss" aria-hidden />
                Your funeral home&rsquo;s name and contact details at the foot of every page.
              </li>
            </ul>

            <Link
              to="/memorials/sample"
              data-testid="sample-memorial-link"
              className="mt-9 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-bone hover:bg-primary-hover"
            >
              Open the sample memorial
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <div className="relative">
            <Link
              to="/memorials/sample"
              data-testid="sample-preview-card"
              className="group block overflow-hidden rounded-lg border border-line bg-bone"
            >
              <div className="relative">
                <img
                  src={DEFAULT_PORTRAIT}
                  alt="Sample memorial portrait placeholder"
                  className="h-56 w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 text-bone">
                  <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-widest2 text-bone/75">
                    Sample memorial
                  </p>
                  <p className="font-serif text-3xl font-semibold leading-tight">
                    A life, kept
                  </p>
                  <p className="mt-1 text-sm text-bone/80">1940 — 2026</p>
                </div>
              </div>

              <div className="flex items-center gap-5 border-t border-line bg-surface p-5">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border border-line bg-surface p-1.5">
                  <QRCodeSVG
                    value="/memorials/sample"
                    size={64}
                    fgColor="#1B2A26"
                    bgColor="#FFFFFF"
                    level="M"
                  />
                </span>
                <div>
                  <p className="flex items-center gap-2 font-serif text-lg font-semibold text-ink">
                    <ScanLine className="h-4 w-4 text-moss" aria-hidden />
                    Scan to open
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    Every plate carries a unique code bound to one memorial — and
                    the page behind it can be updated at any time.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
