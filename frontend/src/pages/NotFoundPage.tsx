import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bone px-8 text-center">
      <p className="font-serif text-6xl font-semibold text-secondary">404</p>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
        The page you were looking for does not exist. If you scanned a plate, the
        memorial may not be published yet.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          to="/"
          data-testid="notfound-home-link"
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-bone hover:bg-primary-hover"
        >
          Back to home
        </Link>
        <Link
          to="/setup"
          className="rounded-lg border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink hover:bg-secondary/50"
        >
          Plate lookup
        </Link>
      </div>
    </div>
  )
}
