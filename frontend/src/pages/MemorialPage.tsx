import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Flower2, MapPin, QrCode } from 'lucide-react'

import { useMemorial } from '@/hooks/useMemorial'
import { DEFAULT_PORTRAIT, LANDSCAPE_BANNER, birthYear, cn } from '@/lib/utils'

/**
 * View 2 — the public memorial page a visitor lands on after scanning a plate.
 * Custom markup only: no Shadcn Cards, generous spacing, stone-grain overlay.
 */
export default function MemorialPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: memorial, isLoading, isError, error } = useMemorial(slug)

  if (isLoading) {
    return (
      <div className="stone-texture relative min-h-screen bg-bone">
        <div className="h-56 w-full animate-pulse bg-secondary/70 sm:h-72" />
        <div className="container max-w-3xl px-8 py-12 md:px-12">
          <div className="mx-auto -mt-24 h-44 w-36 animate-pulse rounded-t-[50%] bg-secondary" />
          <div className="mx-auto mt-8 h-8 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="mx-auto mt-4 h-4 w-32 animate-pulse rounded bg-secondary/70" />
          <div className="mt-10 space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-4 animate-pulse rounded bg-secondary/60"
                style={{ width: `${95 - index * 7}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError || !memorial) {
    return (
      <div className="stone-texture relative flex min-h-screen flex-col items-center justify-center bg-bone px-8 py-12 text-center">
        <Flower2 className="h-8 w-8 text-moss" aria-hidden />
        <h1 className="mt-6 font-serif text-4xl font-semibold text-ink">
          This memorial is not available
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-muted">
          {error instanceof Error && error.message.includes('404')
            ? 'The page you scanned is not linked to a memorial yet. Please contact the funeral home that arranged the service.'
            : 'We could not reach the memorial service. Check your connection and try scanning again.'}
        </p>
        <Link
          to="/"
          data-testid="memorial-home-link"
          className="mt-8 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-bone hover:bg-primary-hover"
        >
          Return to MemorialCode
        </Link>
      </div>
    )
  }

  const paragraphs = memorial.biography
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
  const year = birthYear(memorial.dates)

  return (
    <div className="stone-texture relative min-h-screen bg-bone">
      {/* Serene landscape banner */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <img
          src={LANDSCAPE_BANNER}
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/25 via-transparent to-bone" />
      </div>

      <article className="relative mx-auto max-w-3xl px-8 pb-16 pt-10 md:px-12 md:pb-24">
        {/* Arch portrait */}
        <div className="flex justify-center">
          <div className="relative -mt-28">
            <div className="overflow-hidden rounded-t-[50%] rounded-b-md border-4 border-surface bg-secondary">
              <img
                src={memorial.photo_url ?? DEFAULT_PORTRAIT}
                alt={`Portrait of ${memorial.deceased_name}`}
                data-testid="memorial-portrait"
                className={cn(
                  'h-56 w-44 object-cover object-top sm:h-64 sm:w-52',
                  !memorial.photo_url && 'opacity-80 grayscale-[35%]',
                )}
              />
            </div>
            <span className="absolute -bottom-3 left-1/2 h-px w-24 -translate-x-1/2 bg-line" aria-hidden />
          </div>
        </div>

        <header className="mt-12 text-center">
          <p className="eyebrow">In loving memory</p>
          <h1
            data-testid="memorial-name"
            className="mt-4 font-serif text-display-lg font-semibold text-ink"
          >
            {memorial.deceased_name}
          </h1>
          <p
            data-testid="memorial-dates"
            className="mt-3 font-serif text-2xl italic text-ink-muted"
          >
            {memorial.dates}
          </p>
        </header>

        <div className="mx-auto mt-10 flex max-w-xs items-center gap-4">
          <span className="rule" aria-hidden />
          <Flower2 className="h-4 w-4 shrink-0 text-moss" aria-hidden />
          <span className="rule" aria-hidden />
        </div>

        <div
          data-testid="memorial-biography"
          className="prose-memorial mt-10 text-center"
        >
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 48)}>{paragraph}</p>
          ))}
        </div>

        <dl className="mt-14 grid gap-6 border-t border-line pt-8 text-center sm:grid-cols-3">
          <div>
            <dt className="flex items-center justify-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest2 text-ink-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              {year ? `Born ${year}` : 'Life span'}
            </dt>
            <dd className="mt-1.5 font-serif text-lg text-ink">{memorial.dates}</dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest2 text-ink-muted">
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Remembered
            </dt>
            <dd className="mt-1.5 font-serif text-lg text-ink">South Africa</dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-2 text-[0.68rem] font-semibold uppercase tracking-widest2 text-ink-muted">
              <QrCode className="h-3.5 w-3.5" aria-hidden />
              Memorial
            </dt>
            <dd className="mt-1.5 font-serif text-lg text-ink">
              {memorial.slug}
            </dd>
          </div>
        </dl>

        <footer className="mt-14 rounded-lg border border-line bg-surface/70 px-8 py-8 text-center">
          <p className="font-serif text-xl text-ink">
            &ldquo;Those we love do not go away; they walk beside us every day.&rdquo;
          </p>
          <p className="mt-6 text-xs uppercase tracking-widest2 text-ink-muted">
            Memorial hosted by MemorialCode (Pty) Ltd
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Families can add photographs and memories at any time —{' '}
            <a
              href="mailto:care@memorialcode.co.za"
              className="text-primary underline underline-offset-4"
            >
              care@memorialcode.co.za
            </a>
          </p>
        </footer>
      </article>
    </div>
  )
}
