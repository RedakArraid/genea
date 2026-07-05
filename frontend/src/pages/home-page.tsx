import { PricingSection } from "@/components/pricing-section"
import { HeroSection } from "@/components/marketing/hero-section"
import { StatsStrip } from "@/components/marketing/stats-strip"
import { FeaturesSection } from "@/components/marketing/features-section"
import { HowItWorksSection } from "@/components/marketing/how-it-works-section"
import { FinalCtaSection } from "@/components/marketing/final-cta-section"
import { MarketingFooter } from "@/components/marketing/marketing-footer"

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FinalCtaSection />
      <MarketingFooter />
    </>
  )
}
