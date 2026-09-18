import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'

const NAV_LINKS = [
  { href: '#problem', label: 'The Problem' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#sample', label: 'Live Sample' },
  { href: '#packages', label: 'Partner Packages' },
]

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bone/90 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Link
          to="/"
          data-testid="site-logo"
          className="flex items-center gap-2.5 text-ink"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-bone">
            <QrCode className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-serif text-lg font-semibold tracking-tight">
              MemorialCode
            </span>
            <span className="text-[0.62rem] font-medium uppercase tracking-widest2 text-ink-muted">
              South Africa
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-muted hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#packages"
            data-testid="nav-partner-cta"
            className="hidden rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-bone hover:bg-primary-hover sm:inline-flex"
          >
            Partner With Us
          </a>
          <Link
            to="/admin/plates"
            data-testid="nav-admin-link"
            className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-secondary/50"
          >
            Staff Login
          </Link>
        </div>
      </div>
    </header>
  )
}
