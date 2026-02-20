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
  { icon: Wand2, label: 'Kickstart Template', description: 'Generate prompts from simple descriptions' },
  { icon: Search, label: 'Semantic Search', description: 'Find conceptually similar artefacts' },
  { icon: Infinity, label: 'Unlimited Artefacts', description: 'No limits on prompts, skills, workflows' },
  { icon: Github, label: 'GitHub Sync', description: 'Sync your library to any repository' },
];

const teamFeatures = [
  { icon: Users, label: 'Team Workspaces', description: 'Collaborate with your entire team' },
];

export function UpsellModal({ open, onOpenChange, feature }: UpsellModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Premium Feature
          </DialogTitle>
          <DialogDescription className="text-base">
            {feature 
              ? `${feature} is a Premium feature. Please contact support or wait until your AI credits reset.`
              : 'This feature requires Querino Premium. Please contact support for more information.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <a href="mailto:support@querino.ai" className="w-full" onClick={() => onOpenChange(false)}>
            <Button className="w-full gap-2" size="lg" variant="outline">
              Contact Support
            </Button>
          </a>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
