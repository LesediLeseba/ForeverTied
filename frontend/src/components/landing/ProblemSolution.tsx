import { Minus, Plus } from 'lucide-react'

const TRADITIONAL = [
  'A name, two dates and a verse — carved once, never revised.',
  'Grandchildren who never hear the stories because nobody is left to tell them.',
  'A grave in a distant town that the younger generation never visits.',
  'Corrections impossible: one misspelt surname is permanent.',
  'Service programmes and photographs lost in a drawer within a year.',
]

const MEMORIALCODE = [
  'The full life: biography, photographs, audio, service details and tributes.',
  'Families add memories themselves — the page keeps growing after the funeral.',
  'Anyone, anywhere, scans once and stands inside the story.',
  'Staff update the page in seconds; the plate never needs replacing.',
  'One durable plate, linked to a memorial your funeral home hosts and controls.',
]

export default function ProblemSolution() {
  return (
    <section id="problem" className="border-b border-line bg-surface">
      <div className="container py-20 md:py-24">
        <div className="max-w-2xl">
          <p className="eyebrow mb-4">The problem</p>
          <h2 className="text-display-md font-semibold text-ink">
            A headstone holds a name. It cannot hold a life.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-muted">
            Stone is the right material for permanence and the wrong medium for a
            story. MemorialCode keeps the permanence and gives families somewhere
            to put everything that does not fit on a plaque.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <article
            data-testid="problem-traditional"
            className="rounded-lg border border-line bg-bone p-8 md:p-10"
          >
            <p className="eyebrow mb-5">Traditional tombstone</p>
            <h3 className="font-serif text-2xl font-semibold text-ink">
              Fixed, silent, finite
            </h3>
            <ul className="mt-6 space-y-4">
              {TRADITIONAL.map((point) => (
                <li key={point} className="flex gap-3 text-[0.975rem] leading-relaxed text-ink-muted">
                  <Minus className="mt-1.5 h-4 w-4 shrink-0 text-[#8C3B2A]" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>

          <article
            data-testid="problem-memorialcode"
            className="rounded-lg border border-primary/20 bg-primary p-8 text-bone md:p-10"
          >
            <p className="mb-5 font-sans text-[0.7rem] font-semibold uppercase tracking-widest2 text-bone/70">
              With a MemorialCode plate
            </p>
            <h3 className="font-serif text-2xl font-semibold">
              Dynamic storykeeping
            </h3>
            <ul className="mt-6 space-y-4">
              {MEMORIALCODE.map((point) => (
                <li key={point} className="flex gap-3 text-[0.975rem] leading-relaxed text-bone/85">
                  <Plus className="mt-1.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}
