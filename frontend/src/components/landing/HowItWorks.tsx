import { Package, PenLine, ScanLine } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    icon: Package,
    title: 'Your funeral home provides the MemorialCode kit',
    body: 'Each kit contains weatherproof stainless steel plates with pre-generated unique QR codes, fixings and a family instruction card. Plates ship ready — your staff never touch a printer or a spreadsheet.',
  },
  {
    number: '02',
    icon: PenLine,
    title: 'The family uploads photos, bio and memories',
    body: 'You capture the details once, during the arrangement meeting, and our staff build the page. Afterwards the family can send photographs and tributes directly, and the memorial keeps growing long after the service.',
  },
  {
    number: '03',
    icon: ScanLine,
    title: 'Visitors scan the plate at the grave site',
    body: 'One scan, in full sunlight, opens the memorial instantly in the browser. No app, no account, no waiting — exactly the moment a grandchild asks who is buried here.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-line bg-bone">
      <div className="container py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">How it works</p>
          <h2 className="text-display-md font-semibold text-ink">
            Three steps, from arrangement meeting to the grave site
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 lg:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              data-testid={`how-it-works-step-${step.number}`}
              className="relative rounded-lg border border-line bg-surface p-8"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-4xl font-semibold text-secondary">
                  {step.number}
                </span>
                <step.icon className="h-6 w-6 text-moss" aria-hidden />
              </div>
              <h3 className="mt-6 font-serif text-xl font-semibold leading-snug text-ink">
                {step.title}
              </h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
