import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Mail, Github, Sparkles, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { storeRedirectPath, getAndClearRedirectPath, getRedirectFromParams } from "@/lib/authRedirect";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const hasRedirected = useRef(false);
  
  const { user, loading: authLoading, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithGithub } = useAuthContext();
  
  // Initialize tab from URL param
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "signin";
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupsClosed, setSignupsClosed] = useState(false);

  // Check signup availability on mount
  useEffect(() => {
    const checkCap = async () => {
      try {
        const { data } = await (await import("@/integrations/supabase/client")).supabase.rpc("check_signup_allowed");
        const result = data as unknown as { allowed: boolean; current_count: number; max_count: number };
        if (result && !result.allowed) {
          setSignupsClosed(true);
        }
      } catch { /* ignore */ }
    };
    checkCap();
  }, []);
  // Redirect if already logged in (handles OAuth return)
  useEffect(() => {
    if (!authLoading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      // Check localStorage first (for OAuth return), then URL params
      const storedPath = getAndClearRedirectPath();
      const urlRedirect = getRedirectFromParams(searchParams);
      // Prefer stored path if it exists and isn't the default, otherwise use URL param
      const redirectTo = storedPath !== "/library" ? storedPath : urlRedirect;
      navigate(redirectTo, { replace: true });
    }
  }, [user, authLoading, navigate, searchParams]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (activeTab === "signin") {
        const { error } = await signInWithEmail(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Welcome back!");
          const redirectTo = getRedirectFromParams(searchParams);
          navigate(redirectTo, { replace: true });
        }
      } else {
        const { error } = await signUpWithEmail(email, password);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast.error("An account with this email already exists. Please sign in instead.");
            setActiveTab("signin");
          } else {
            toast.error(error.message);
          }
        } else {
          setSignupEmail(email);
          setSignupSuccess(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    // Store redirect path before OAuth redirect
    const redirectTo = getRedirectFromParams(searchParams);
    storeRedirectPath(redirectTo);
    
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handleGithubAuth = async () => {
    // Store redirect path before OAuth redirect
    const redirectTo = getRedirectFromParams(searchParams);
    storeRedirectPath(redirectTo);
    
    setLoading(true);
    const { error } = await signInWithGithub();
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to Querino</CardTitle>
            <CardDescription>
              Sign in to access your prompt library and create amazing AI prompts
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "signin" | "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="mt-6 space-y-4">
                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGithubAuth}
                    disabled={loading}
                  >
                    <Github className="h-4 w-4" />
                    Continue with GitHub
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                
                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>
                  
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    Sign In with Email
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-6 space-y-4">
                {signupsClosed ? (
                  <div className="flex flex-col items-center text-center py-6 space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Mail className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Early access limit reached</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        We've reached our early access limit. Join the waitlist to be notified when new spots open up.
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <a href="mailto:support@querino.ai">Join the Waitlist</a>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => setActiveTab("signin")}
                    >
                      Already have an account? Sign in
                    </Button>
                  </div>
                ) : signupSuccess ? (
                  <div className="flex flex-col items-center text-center py-6 space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <CheckCircle2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Check your email</h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        We've sent a confirmation link to{" "}
                        <span className="font-medium text-foreground">{signupEmail}</span>.
                        Click the link in that email to activate your account.
                      </p>
                    </div>
                    <div className="pt-4 space-y-2 w-full">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSignupSuccess(false);
                          setEmail("");
                          setPassword("");
                          setActiveTab("signin");
                        }}
                      >
                        Back to Sign In
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Didn't receive the email? Check your spam folder.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* OAuth Buttons */}
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleGoogleAuth}
                        disabled={loading}
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                      </Button>
                      
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleGithubAuth}
                        disabled={loading}
                      >
                        <Github className="h-4 w-4" />
                        Continue with GitHub
                      </Button>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>
                    
                    {/* Email Form */}
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                        />
                        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                      </div>
                      
                      <Button type="submit" className="w-full gap-2" disabled={loading}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                        Create Account
                      </Button>
                    </form>
                    
                    <p className="text-center text-xs text-muted-foreground">
                      By signing up, you agree to our{" "}
                      <a href="/terms" className="underline hover:text-foreground">Terms</a> and{" "}
                      <a href="/privacy" className="underline hover:text-foreground">Privacy Policy</a>.
                    </p>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
