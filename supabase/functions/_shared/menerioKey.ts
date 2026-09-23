// The Menerio connection key, read from Vault.
//
// Since 2026-09-16 menerio_integration.menerio_api_key is blanked by a trigger
// that moves the value into Vault (migration 20260916150000, section H), and
// only the service role may call read_menerio_api_key. Every function that
// sends a user's key to Menerio reads it through here, so a missing key is a
// loud error rather than an "x-api-key: null" header.

/**
 * The account has no key stored. Kept apart from a failed read so a caller can
 * answer "not connected" for this one and "something broke" for the rest.
 */
export class MissingMenerioKeyError extends Error {
  constructor() {
    super("This account has no Menerio key stored");
    this.name = "MissingMenerioKeyError";
  }
}

interface RpcClient {
  rpc(
    fn: string,
    args: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string } | null }>;
}

/**
 * `serviceClient` is any supabase-js client holding the service-role key. It is
 * typed loosely because the callers pin different supabase-js versions, whose
 * generic rpc signatures TypeScript will not unify.
 */
export async function readMenerioApiKey(
  serviceClient: unknown,
  userId: string,
): Promise<string> {
  const { data, error } = await (serviceClient as RpcClient).rpc(
    "read_menerio_api_key",
    {
      p_user_id: userId,
    },
  );
  if (error) {
    throw new Error(`reading the Menerio key: ${error.message}`);
  }
  if (typeof data !== "string" || data.length === 0) {
    throw new MissingMenerioKeyError();
  }
  return data;
}
