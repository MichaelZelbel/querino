import { useEffect, useState } from "react";
import { useNavigate, Link } from "@/lib/router-compat";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AlertTriangle, KeyRound, Loader2, Mail } from "lucide-react";
import {
  newPasswordProblem,
  PASSWORD_HINT,
} from "@/components/auth/passwordRules";
import {
  resetLinkState,
  type ResetLinkState,
} from "@/components/auth/resetLinkState";
import { sendPasswordResetLink } from "@/components/auth/sendPasswordResetLink";

const resetSchema = z
  .object({
    password: z.string().superRefine((value, ctx) => {
      const problem = newPasswordProblem(value);
      if (problem)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: problem });
    }),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "The two passwords do not match",
    path: ["confirmPassword"],
  });

type ResetFormValues = z.infer<typeof resetSchema>;

const requestSchema = z.object({
  email: z.string().trim().email("Enter the email address of your account"),
});

type RequestFormValues = z.infer<typeof requestSchema>;

/** Mails a recovery link that leads back to this page. */
function RequestResetLinkForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async ({ email }: RequestFormValues) => {
    try {
      const { error } = await sendPasswordResetLink(email);
      if (error) {
        toast.error(error.message || "Could not send the reset link");
        return;
      }
      setSentTo(email);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not send the reset link",
      );
    }
  };

  if (sentTo) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground" role="status">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <Mail className="h-4 w-4 text-primary" />
          Check your inbox
        </p>
        <p>
          If an account exists for <strong>{sentTo}</strong>, a reset link is on
          its way. Open it from the mail and you come back to this page to
          choose a new password.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending
            </>
          ) : (
            "Send me a reset link"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/auth" className="text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </Form>
  );
}

/**
 * The page a password recovery mail links to.
 *
 * Opening a recovery link signs the user in, so before this page existed the flow ended
 * on the library with the old password still in place and nothing ever called
 * supabase.auth.updateUser. Here the recovery session is used for the one thing it is
 * for: setting a new password.
 */
export default function ResetPassword() {
  const navigate = useNavigate();

  // Stays "checking" until we know whether the link produced a session, so the expired
  // message never flashes while the token is still being read out of the URL.
  const [status, setStatus] = useState<"checking" | ResetLinkState>("checking");

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    let active = true;
    // Read before supabase-js clears a link it has turned into a session.
    const { search, hash } = window.location;

    // PASSWORD_RECOVERY fires once supabase has parsed the token out of the URL.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY" || session) {
          setStatus("ready");
        }
      },
    );

    // A reload after the token was already consumed has no event left to fire, so the
    // stored session counts too. A session found by the listener wins over this answer
    // because the two can resolve in either order.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setStatus((prev) =>
        resetLinkState({ search, hash }, !!data.session || prev === "ready"),
      );
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (values: ResetFormValues) => {
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error(error.message || "Could not update your password");
      return;
    }

    toast.success("Password updated. You are signed in.");
    navigate("/library", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {status === "checking" ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : status === "expired" ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h1 className="text-xl font-semibold leading-none tracking-tight">
                    This reset link has expired
                  </h1>
                </div>
                <CardDescription>
                  Password reset links can only be used once, and they stop
                  working after a while. Enter your email to get a new one, then
                  open it from the mail straight away.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestResetLinkForm />
              </CardContent>
            </Card>
          ) : status === "missing" ? (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-semibold leading-none tracking-tight">
                    Reset your password
                  </h1>
                </div>
                <CardDescription>
                  Enter the email address of your account. We mail you a link
                  that brings you back to this page, where you choose a new
                  password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RequestResetLinkForm />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-semibold leading-none tracking-tight">
                    Choose a new password
                  </h1>
                </div>
                <CardDescription>
                  {PASSWORD_HINT} It replaces the old one as soon as you save.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              placeholder="At least 8 characters"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm new password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              placeholder="Type it again"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        "Save new password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
