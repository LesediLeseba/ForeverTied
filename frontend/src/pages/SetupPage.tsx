import { Link } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, LifeBuoy, ScanLine } from 'lucide-react'

const REASON_COPY: Record<string, { title: string; body: string }> = {
  unknown_code: {
    title: 'This plate is not registered',
    body: 'The code you scanned has not been issued by MemorialCode yet. If you believe this is an error, please contact the funeral home that arranged the service.',
  },
  unassigned: {
    title: 'This memorial is being prepared',
    body: 'The plate is installed but the family has not completed their memorial page yet. It will open automatically once their details are added.',
  },
  damaged: {
    title: 'This plate has been retired',
    body: 'This plate was reported damaged and replaced. The memorial itself is still online — please scan the replacement plate, or contact the funeral home for the direct link.',
  },
}

/** Landing page for scans that cannot resolve to a memorial. */
export default function SetupPage() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const reason = searchParams.get('reason') ?? 'unknown_code'
  const copy = REASON_COPY[reason] ?? REASON_COPY.unknown_code

  return (
    <div className="stone-texture relative flex min-h-screen flex-col bg-bone">
      <header className="border-b border-line">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="font-serif text-lg font-semibold text-ink">
            MemorialCode
          </Link>
          <Link
            to="/"
            data-testid="setup-home-link"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Home
          </Link>
        </div>
      </header>

      <main className="container flex flex-1 items-center justify-center py-16">
        <div className="w-full max-w-xl rounded-lg border border-line bg-surface p-8 md:p-12">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary/60 text-primary">
            <AlertTriangle className="h-5 w-5" aria-hidden />
          </span>

          <h1 className="mt-6 font-serif text-display-md font-semibold text-ink">
            {copy.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-muted">{copy.body}</p>

          {code && (
            <dl className="mt-8 rounded-lg border border-line bg-bone p-5">
              <dt className="text-[0.68rem] font-semibold uppercase tracking-widest2 text-ink-muted">
                Plate code scanned
              </dt>
              <dd
                data-testid="setup-plate-code"
                className="mt-2 font-mono text-2xl font-semibold tracking-[0.2em] text-ink"
              >
                {code}
              </dd>
              <dd className="mt-2 text-xs uppercase tracking-wider text-ink-muted">
                Status reported: {reason.replace('_', ' ')}
              </dd>
            </dl>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:care@memorialcode.co.za?subject=MemorialCode%20plate%20lookup"
              data-testid="setup-contact-link"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-bone hover:bg-primary-hover"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden />
              Contact MemorialCode
            </a>
            <Link
              to="/memorials/sample"
              data-testid="setup-sample-link"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:bg-secondary/50"
            >
              <ScanLine className="h-4 w-4" aria-hidden />
              See a sample memorial
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
