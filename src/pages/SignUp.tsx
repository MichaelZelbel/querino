import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Mail, Lock, User, ArrowRight, Check } from "lucide-react";

const features = [
  "Access to 1000+ curated prompts",
  "Pin favorite prompts",
  "Create your personal library",
  "Weekly prompt digest",
];

export default function SignUp() {
  const [step, setStep] = useState<"signup" | "explore">("signup");

  if (step === "explore") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <Card className="border-border shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <Check className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="font-display text-display-sm">Welcome to Querino!</CardTitle>
              <CardDescription className="text-base">
                Your account has been created. Let's get you started.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <h3 className="font-display font-semibold text-foreground">What would you like to do first?</h3>
                <div className="grid gap-3">
                  <Link to="/public-prompt-discovery-copy">
                    <Button variant="outline" className="w-full justify-between h-auto py-4">
                      <span className="text-left">
                        <span className="block font-medium">Browse Prompts</span>
                        <span className="block text-sm text-muted-foreground">Discover curated AI prompts</span>
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/prompt-creation-publishing-premium-free-">
                    <Button variant="outline" className="w-full justify-between h-auto py-4">
                      <span className="text-left">
                        <span className="block font-medium">Create a Prompt</span>
                        <span className="block text-sm text-muted-foreground">Start building your library</span>
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button variant="default" className="w-full justify-between h-auto py-4">
                      <span className="text-left">
                        <span className="block font-medium">Go to Dashboard</span>
                        <span className="block text-sm text-primary-foreground/80">Your personal command center</span>
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Querino</span>
            </Link>
            <h1 className="font-display text-display-md text-foreground mb-2">Create your account</h1>
            <p className="text-muted-foreground">Start building your AI prompt library today.</p>
          </div>

          <Card className="border-border">
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-4">
                <Button variant="outline" className="w-full gap-2">
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setStep("explore"); }}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="John Doe" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="john@example.com" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <label htmlFor="terms" className="text-sm text-muted-foreground">
                    I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and{" "}
                    <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                  </label>
                </div>
                <Button type="submit" className="w-full">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <a href="#" className="text-primary hover:underline font-medium">Sign in</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex flex-1 bg-primary/5 items-center justify-center p-8">
        <div className="max-w-md">
          <h2 className="font-display text-display-sm text-foreground mb-6">
            Join thousands of AI creators
          </h2>
          <div className="space-y-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
