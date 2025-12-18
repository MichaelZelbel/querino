import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Sparkles, 
  Wand2, 
  Search, 
  Infinity, 
  Github, 
  Users,
  Check
} from 'lucide-react';

interface UpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  redirectPath?: string;
}

const premiumFeatures = [
  { icon: Sparkles, label: 'AI Insights', description: 'Get AI-powered summaries & recommendations' },
  { icon: Wand2, label: 'Prompt Wizard', description: 'Generate prompts from simple descriptions' },
  { icon: Search, label: 'Semantic Search', description: 'Find conceptually similar artefacts' },
  { icon: Infinity, label: 'Unlimited Artefacts', description: 'No limits on prompts, skills, workflows' },
  { icon: Github, label: 'GitHub Sync', description: 'Sync your library to any repository' },
];

const teamFeatures = [
  { icon: Users, label: 'Team Workspaces', description: 'Collaborate with your entire team' },
];

export function UpsellModal({ open, onOpenChange, feature, redirectPath }: UpsellModalProps) {
  const pricingUrl = redirectPath 
    ? `/pricing?from=${encodeURIComponent(redirectPath)}`
    : '/pricing';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Unlock Premium Features
          </DialogTitle>
          <DialogDescription className="text-base">
            {feature 
              ? `${feature} is a Premium feature. Upgrade to unlock it and many more powerful capabilities.`
              : 'Get access to powerful AI tools and unlimited capabilities with Querino Premium.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Premium Features */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
              <span className="text-lg font-semibold">€15/month</span>
            </div>
            <ul className="space-y-3">
              {premiumFeatures.map(({ icon: Icon, label, description }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{label}</span>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Team Features */}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="gap-1">
                <Users className="h-3 w-3" />
                Team
              </Badge>
              <span className="text-lg font-semibold">€30 + €5/seat</span>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-medium text-foreground">Everything in Premium</span>
                </div>
              </li>
              {teamFeatures.map(({ icon: Icon, label, description }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-success" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{label}</span>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link to={pricingUrl} className="w-full" onClick={() => onOpenChange(false)}>
            <Button className="w-full gap-2" size="lg">
              <Crown className="h-4 w-4" />
              Upgrade to Premium
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
