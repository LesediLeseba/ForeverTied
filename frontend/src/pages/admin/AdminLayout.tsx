import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Boxes, ExternalLink, Layers, QrCode } from 'lucide-react'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { value: 'plates', label: 'QR Plates', to: '/admin/plates', icon: QrCode },
  { value: 'memorials', label: 'Memorials', to: '/admin/memorials', icon: Layers },
  { value: 'inventory', label: 'Inventory', to: '/admin/inventory', icon: Boxes },
]

/** View 3 — staff admin shell (Shadcn primitives, flat surfaces, 8px radii). */
export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const active =
    TABS.find((tab) => location.pathname.startsWith(tab.to))?.value ?? 'plates'

  return (
    <div className="min-h-screen bg-bone">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-bone">
              <QrCode className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="font-serif text-lg font-semibold text-ink">
                MemorialCode
              </p>
              <p className="text-[0.62rem] font-semibold uppercase tracking-widest2 text-ink-muted">
                Staff console
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              data-testid="admin-public-site-link"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-secondary/50"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Public site
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <Tabs
          value={active}
          onValueChange={(value) => {
            const target = TABS.find((tab) => tab.value === value)
            if (target) navigate(target.to)
          }}
        >
          <TabsList data-testid="admin-tabs" role="tablist">
            {TABS.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                data-testid={`admin-tab-${tab.value}`}
              >
                <tab.icon className="h-4 w-4" aria-hidden />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6">
          <Outlet />
        </div>

        <footer className="mt-12 border-t border-line pt-6 text-xs text-ink-muted">
          <p>
            V1 runs without authentication for fast MVP validation — the console is
            intended for internal staff networks only.
          </p>
        </footer>
      </div>

      {/* Accessible secondary navigation for keyboard/screen-reader users */}
      <nav className="sr-only" aria-label="Admin sections">
        {TABS.map((tab) => (
          <NavLink key={tab.value} to={tab.to}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
