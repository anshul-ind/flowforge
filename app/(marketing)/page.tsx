import { HeroSection } from './components/hero-section'
import { FeaturesSection } from './components/features-section'
import { HowItWorksSection } from './components/how-it-works'
import { QuoteSection } from './components/quote-section'
import { CTABanner } from './components/cta-banner'

export const metadata = {
  title: 'FlowForge - Ship Projects On Schedule',
  description: 'Deliver projects your team actually finishes. Workspace isolation, RBAC, approvals, and real-time collaboration.',
  openGraph: {
    title: 'FlowForge - Ship Projects On Schedule',
    description: 'Deliver projects your team actually finishes.',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <QuoteSection />
      <CTABanner />
    </>
  )
}
