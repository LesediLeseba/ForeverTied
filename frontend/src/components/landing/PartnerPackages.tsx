import { useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

const PACKAGES = [
  {
    id: 'standard',
    name: 'Standard',
    price: 'R 495',
    cadence: 'per plate, once-off',
    summary: 'For independent funeral homes establishing the offering.',
    features: [
      'Minimum order of 10 stainless steel plates',
      'Standard memorial page (portrait, dates, biography)',
      'MemorialCode branding in the page footer',
      'Staff dashboard access for your arrangers',
      'Email support within one business day',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 'R 395',
    cadence: 'per plate, once-off',
    summary: 'Our most chosen tier for multi-branch parlours.',
    popular: true,
    features: [
      'Everything in Standard, at volume pricing',
      'Minimum order of 50 plates',
      'Gallery, tributes and service programme sections',
      'Your funeral home name and number on every page',
      'Family self-service memory uploads',
      'Quarterly usage reporting',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual agreement',
    summary: 'For groups, insurers and cemetery operators.',
    features: [
      'Unlimited branches and staff seats',
      'White-label memorial pages on your domain',
      'Bulk plate provisioning and inventory API access',
      'POPIA data-processing agreement and hosting in ZA',
      'Named account manager and staff training',
      'SLA with same-day plate replacement',
    ],
  },
]

export default function PartnerPackages() {
  const [interest, setInterest] = useState<string | null>(null)

  return (
    <section id="packages" className="border-b border-line bg-bone">
      <div className="container py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">B2B funeral partner packages</p>
          <h2 className="text-display-md font-semibold text-ink">
            Choose how your parlour offers it
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Plates are supplied once-off; the memorial hosting is included for the
            life of the page. All pricing in South African Rand, VAT exclusive.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PACKAGES.map((pkg) => (
            <article
              key={pkg.id}
              data-testid={`package-${pkg.id}`}
              className={
                pkg.popular
                  ? 'relative flex flex-col rounded-lg border-2 border-primary bg-surface p-8'
                  : 'relative flex flex-col rounded-lg border border-line bg-surface p-8'
              }
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-8 rounded-md bg-primary px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-widest2 text-bone">
                  Most chosen
                </span>
              )}

              <h3 className="font-serif text-2xl font-semibold text-ink">{pkg.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{pkg.summary}</p>

              <p className="mt-6 flex items-baseline gap-2">
                <span className="font-serif text-4xl font-semibold text-ink">{pkg.price}</span>
                <span className="text-xs uppercase tracking-wider text-ink-muted">
                  {pkg.cadence}
                </span>
              </p>

              <div className="rule my-6" />

              <ul className="flex-1 space-y-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-relaxed text-ink/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                data-testid={`package-${pkg.id}-cta`}
                onClick={() => {
                  setInterest(pkg.id)
                  toast.success(
                    `${pkg.name} partnership request noted — our team will contact your parlour.`,
                  )
                }}
                className={
                  pkg.popular
                    ? 'mt-8 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-bone hover:bg-primary-hover'
                    : 'mt-8 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink hover:bg-secondary/50'
                }
              >
                {interest === pkg.id ? 'Request received' : 'Partner With Us'}
              </button>
            </article>
          ))}
        </div>

        <p className="mt-10 text-sm text-ink-muted">
          Plates are laser-etched 316-grade stainless steel, 80 × 50 mm, with a
          20-year weathering guarantee. Replacement plates are re-issued free of
          charge if a code is ever damaged.
        </p>
      </div>
    </section>
  )
}
