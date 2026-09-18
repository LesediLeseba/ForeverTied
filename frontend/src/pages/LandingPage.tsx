import SiteHeader from '@/components/landing/SiteHeader'
import Hero from '@/components/landing/Hero'
import ProblemSolution from '@/components/landing/ProblemSolution'
import HowItWorks from '@/components/landing/HowItWorks'
import SamplePreview from '@/components/landing/SamplePreview'
import PartnerPackages from '@/components/landing/PartnerPackages'
import SiteFooter from '@/components/landing/SiteFooter'

/** View 1 — B2B conversion landing page for funeral homes. */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bone">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <SamplePreview />
        <PartnerPackages />
      </main>
      <SiteFooter />
    </div>
  )
}
