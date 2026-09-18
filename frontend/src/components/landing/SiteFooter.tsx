import { Link } from 'react-router-dom'
import { QrCode } from 'lucide-react'

export default function SiteFooter() {
  return (
    <footer className="bg-primary text-bone">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-bone text-primary">
                <QrCode className="h-4.5 w-4.5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="font-serif text-lg font-semibold">MemorialCode</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-bone/70">
              MemorialCode (Pty) Ltd — a South African DeathTech company bridging
              physical tombstone plaques with living digital memorials.
            </p>
          </div>

          <div>
            <p className="eyebrow mb-4 text-bone/60">Product</p>
            <ul className="space-y-2.5 text-sm text-bone/80">
              <li>
                <a href="#how-it-works" className="hover:text-bone">How it works</a>
              </li>
              <li>
                <Link to="/memorials/sample" className="hover:text-bone">
                  Sample memorial
                </Link>
              </li>
              <li>
                <a href="#packages" className="hover:text-bone">Partner packages</a>
              </li>
              <li>
                <Link to="/setup" className="hover:text-bone">
                  Plate lookup
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4 text-bone/60">Contact</p>
            <ul className="space-y-2.5 text-sm text-bone/80">
              <li>partners@memorialcode.co.za</li>
              <li>+27 10 000 0000</li>
              <li>Johannesburg, Gauteng</li>
              <li>
                <Link to="/admin/plates" className="hover:text-bone">
                  Staff dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-bone/15 pt-6 text-xs text-bone/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MemorialCode (Pty) Ltd. All rights reserved.</p>
          <p>POPIA-compliant. Memorial data hosted in South Africa.</p>
        </div>
      </div>
    </footer>
  )
}
