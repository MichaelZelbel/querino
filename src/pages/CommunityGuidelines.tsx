import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { ShieldCheck } from "lucide-react";

export default function CommunityGuidelines() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead
        title="Community Guidelines — Querino"
        description="Querino's community guidelines for publishing AI artifacts. Learn what content is allowed and how we keep the platform safe."
      />
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto max-w-3xl px-4 prose prose-neutral dark:prose-invert">
          <div className="flex items-center gap-3 mb-8 not-prose">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Community Guidelines</h1>
          </div>

          <p className="lead">
            Querino is a platform for discovering and sharing AI artifacts — prompts, skills, workflows, and claws. 
            These guidelines help keep our community safe, respectful, and useful for everyone.
          </p>

          <h2>1. Respect and Safety</h2>
          <p>
            Treat all community members with respect. Do not publish content that harasses, threatens, 
            doxxes, or defames any person or group. This includes targeted attacks against platform 
            creators, maintainers, or other users.
          </p>

          <h2>2. No Adult or Sexual Content</h2>
          <p>
            Querino is not a platform for adult content. Do not publish erotica, pornography, 
            sexually explicit material, or prompts designed to generate such content.
          </p>

          <h2>3. No Malicious Content</h2>
          <p>
            Do not publish content designed to cause harm. This includes:
          </p>
          <ul>
            <li>Malware, viruses, or exploit code embedded in skill files</li>
            <li>Phishing prompts or social engineering attack templates</li>
            <li>Prompts designed to bypass AI safety filters for harmful purposes</li>
            <li>Instructions for illegal activities</li>
          </ul>

          <h2>4. Privacy</h2>
          <p>
            Do not share Personal Identifiable Information (PII) — yours or anyone else's. This includes 
            email addresses, phone numbers, physical addresses, social security numbers, or other 
            sensitive personal data. Our system automatically detects and blocks common PII patterns.
          </p>

          <h2>5. Intellectual Property</h2>
          <p>
            Only publish content you have the right to share. Do not copy-paste copyrighted material 
            without permission. Give credit where credit is due.
          </p>

          <h2>6. No Spam</h2>
          <p>
            Do not mass-publish low-quality, duplicate, or auto-generated content designed to game 
            the platform. Each artifact should provide genuine value.
          </p>

          <h2>7. Enforcement</h2>
          <p>
            When you publish an artifact or post a comment, our moderation system automatically checks 
            the content against these guidelines. If a violation is detected:
          </p>
          <ul>
            <li>The content will be blocked from going public, but saved as a private draft</li>
            <li>You'll see a clear explanation of what was flagged</li>
            <li>Repeated violations result in automatic account suspension</li>
          </ul>

          <h2>Appeals</h2>
          <p>
            We know automated moderation isn't perfect. If you believe your content was incorrectly 
            flagged, please contact us at{" "}
            <a href="mailto:support@querino.app" className="text-primary">
              support@querino.app
            </a>
            . Our team will review the case and, if it was a false positive, reverse the decision and 
            clear any strikes from your account.
          </p>

          <hr />

          <p className="text-sm text-muted-foreground">
            These guidelines may be updated from time to time. Last updated: April 2026.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
