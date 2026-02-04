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

export default function Home() {
  return (
    <LandingGuard>
    <>
      <ReadingProgress />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <AnimatedSection animation="slideUp" delay={200}>
        <BentoGrid />
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection animation="fadeIn" delay={400}>
        <ProcessFlow />
      </AnimatedSection>

      {/* Pricing Section */}
      <AnimatedSection animation="scaleIn" delay={300}>
        <PricingCards />
      </AnimatedSection>

      {/* Get Started / Registration Section */}
      <AnimatedSection animation="slideUp" delay={200}>
        <GetStartedSection />
      </AnimatedSection>

      {/* Security Section */}
      <AnimatedSection animation="slideLeft" delay={200}>
        <SecuritySection />
      </AnimatedSection>

      {/* FAQ Section */}
      <AnimatedSection animation="slideRight" delay={200}>
        <FAQSection />
      </AnimatedSection>

      {/* Contact Section */}
      <AnimatedSection animation="fadeIn" delay={400}>
        <Contact2 />
      </AnimatedSection>

      {/* Footer */}
      <Footer />

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </>
    </LandingGuard>
  );
}

