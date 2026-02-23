"use client";

import { BentoGrid } from "@/components/ui/bento-grid";
import { PricingCards } from "@/components/ui/pricing-cards";
import { HeroSection } from "@/components/hero-section-1";
import ProcessFlow from "@/components/ui/process-flow";
import { FAQSection } from "@/components/faq-section";
import { SecuritySection } from "@/components/security-section";
import { GetStartedSection } from "@/components/get-started-section";
import { Contact2 } from "@/components/contact-2";
import { Footer } from "@/components/footer-section";
import { ScrollToTop } from "@/components/ui/scroll-to-top";
import { ReadingProgress } from "@/components/ui/reading-progress";
import { AnimatedSection } from "@/components/ui/animated-section";
import { LandingGuard } from "@/components/auth/landing-guard";

export function HomeContent() {
  return (
    <LandingGuard>
      <>
        <ReadingProgress />
        <HeroSection />
        <AnimatedSection animation="slideUp" delay={200}>
          <BentoGrid />
        </AnimatedSection>
        <AnimatedSection animation="fadeIn" delay={400}>
          <ProcessFlow />
        </AnimatedSection>
        <AnimatedSection animation="scaleIn" delay={300}>
          <PricingCards />
        </AnimatedSection>
        <AnimatedSection animation="slideUp" delay={200}>
          <GetStartedSection />
        </AnimatedSection>
        <AnimatedSection animation="slideLeft" delay={200}>
          <SecuritySection />
        </AnimatedSection>
        <AnimatedSection animation="slideRight" delay={200}>
          <FAQSection />
        </AnimatedSection>
        <AnimatedSection animation="fadeIn" delay={400}>
          <Contact2 />
        </AnimatedSection>
        <Footer />
        <ScrollToTop />
      </>
    </LandingGuard>
  );
}
