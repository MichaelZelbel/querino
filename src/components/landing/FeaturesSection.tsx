import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Library, 
  Wand2, 
  Share2, 
  Shield, 
  Zap, 
  Users 
} from "lucide-react";

const features = [
  {
    icon: Library,
    title: "Organized Library",
    description: "Keep all your prompts in one place with smart tagging, categories, and powerful search.",
  },
  {
    icon: Wand2,
    title: "AI Refinement",
    description: "Use intelligent tools to improve, expand, and debug your prompts for better results.",
  },
  {
    icon: Share2,
    title: "Community Sharing",
    description: "Publish your best prompts and discover high-quality prompts from other creators.",
  },
  {
    icon: Shield,
    title: "Version Control",
    description: "Track changes, compare versions, and optionally sync with GitHub for backup.",
  },
  {
    icon: Zap,
    title: "Instant Copy",
    description: "One-click copy for any prompt. Start using it immediately in your AI workflow.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Share prompt libraries with your team and maintain consistent AI outputs.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-display-md font-bold text-foreground md:text-display-lg">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground">
            From prompt discovery to advanced refinement, Querino has you covered.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              variant="elevated"
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
