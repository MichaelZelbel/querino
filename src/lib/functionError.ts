import { FunctionsHttpError } from "@supabase/supabase-js";

/**
 * Supabase's `functions.invoke` surfaces non-2xx responses as a generic
 * transport error ("Edge Function returned a non-2xx status code"), hiding the
 * server's own message. This reads the response body and returns the real
 * `error` message when there is one.
 */
export async function getFunctionErrorMessage(
  error: unknown,
  fallback = "AI request failed",
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      const message = body?.error ?? body?.message;
      if (typeof message === "string" && message.trim()) return message;
    } catch {
      try {
        const text = await error.context.text?.();
        if (typeof text === "string" && text.trim()) return text;
      } catch {
        // ignore
      }
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
