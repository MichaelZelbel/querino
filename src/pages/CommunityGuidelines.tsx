import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";

export default function CommunityGuidelines() {
  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="Community Guidelines — Querino"
        description="Querino's community guidelines for publishing AI artifacts. Learn what content is allowed and how we keep the platform safe."
      />

      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/20 rounded-full blur-3xl" />
      </div>

      <Header />

      <main className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Table of Contents Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="lg:sticky lg:top-32">
                <h2 className="text-lg font-semibold text-foreground mb-4">Table of Contents</h2>
                <nav className="space-y-2 text-sm">
                  <button onClick={() => scrollToSection("respect")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    Respect and Safety
                  </button>
                  <button onClick={() => scrollToSection("adult")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    No Adult or Sexual Content
                  </button>
                  <button onClick={() => scrollToSection("malicious")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    No Malicious Content
                  </button>
                  <button onClick={() => scrollToSection("privacy")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    Privacy
                  </button>
                  <button onClick={() => scrollToSection("ip")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    Intellectual Property
                  </button>
                  <button onClick={() => scrollToSection("spam")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    No Spam
                  </button>
                  <button onClick={() => scrollToSection("enforcement")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    Enforcement
                  </button>
                  <button onClick={() => scrollToSection("appeals")} className="block text-muted-foreground hover:text-foreground transition-colors text-left">
                    Appeals
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 max-w-3xl">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">Community Guidelines</h1>
                  <p className="text-muted-foreground">
                    <strong>Last updated:</strong> April 2026
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2 print:hidden"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </Button>
              </div>

              <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
                <p>
                  Querino is a platform for discovering and sharing AI artifacts — prompts, skills, workflows, and claws.
                  These guidelines help keep our community safe, respectful, and useful for everyone.
                </p>

                <section id="respect">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">1. Respect and Safety</h2>
                  <p>
                    Treat all community members with respect. Do not publish content that harasses, threatens,
                    doxxes, or defames any person or group. This includes targeted attacks against platform
                    creators, maintainers, or other users.
                  </p>
                </section>

                <section id="adult">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">2. No Adult or Sexual Content</h2>
                  <p>
                    Querino is not a platform for adult content. Do not publish erotica, pornography,
                    sexually explicit material, or prompts designed to generate such content.
                  </p>
                </section>

                <section id="malicious">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">3. No Malicious Content</h2>
                  <p>
                    Do not publish content designed to cause harm. This includes:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>Malware, viruses, or exploit code embedded in skill files</li>
                    <li>Phishing prompts or social engineering attack templates</li>
                    <li>Prompts designed to bypass AI safety filters for harmful purposes</li>
                    <li>Instructions for illegal activities</li>
                  </ul>
                </section>

                <section id="privacy">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">4. Privacy</h2>
                  <p>
                    Do not share Personal Identifiable Information (PII) — yours or anyone else's. This includes
                    email addresses, phone numbers, physical addresses, social security numbers, or other
                    sensitive personal data. Our system automatically detects and blocks common PII patterns.
                  </p>
                </section>

                <section id="ip">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">5. Intellectual Property</h2>
                  <p>
                    Only publish content you have the right to share. Do not copy-paste copyrighted material
                    without permission. Give credit where credit is due.
                  </p>
                </section>

                <section id="spam">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">6. No Spam</h2>
                  <p>
                    Do not mass-publish low-quality, duplicate, or auto-generated content designed to game
                    the platform. Each artifact should provide genuine value.
                  </p>
                </section>

                <section id="enforcement">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">7. Enforcement</h2>
                  <p>
                    When you publish an artifact or post a comment, our moderation system automatically checks
                    the content against these guidelines. If a violation is detected:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mt-4">
                    <li>The content will be blocked from going public, but saved as a private draft</li>
                    <li>You'll see a clear explanation of what was flagged</li>
                    <li>Repeated violations result in automatic account suspension</li>
                  </ul>
                </section>

                <section id="appeals">
                  <h2 className="text-2xl font-semibold text-foreground mt-10 mb-4">Appeals</h2>
                  <p>
                    We know automated moderation isn't perfect. If you believe your content was incorrectly
                    flagged, please contact us at{" "}
                    <a href="mailto:support@querino.ai" className="text-primary hover:text-primary/80 underline">
                      support@querino.ai
                    </a>
                    . Our team will review the case and, if it was a false positive, reverse the decision and
                    clear any strikes from your account.
                  </p>
                </section>

                <hr className="border-border my-8" />

                <p className="text-sm text-muted-foreground">
                  These guidelines may be updated from time to time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
