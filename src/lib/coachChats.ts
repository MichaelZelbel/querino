import { safeStorage } from "@/lib/safeStorage.ts";

/**
 * The AI coach panels keep each conversation in localStorage so it survives a
 * page change: `prompt_coach_messages:<session>` holds the chat, which quotes
 * the whole artifact being edited, private and team ones included, and
 * `prompt_coach_session:...` holds the session ids (ArtifactCoachPanel,
 * PromptCoachPanel, runCanvasAI). Nothing ever removed them, so on a shared
 * computer the next person found the previous account's chats on disk
 * (2026-10-07). They now go when the account signs out or another account
 * signs in.
 */
export const COACH_STORAGE_PREFIXES = [
  "prompt_coach_messages:",
  "prompt_coach_session:",
] as const;

/** The account the stored chats belong to. */
export const COACH_OWNER_KEY = "querino_coach_owner";

/**
 * Whether the stored chats must go, given who is signed in now, who was signed
 * in before in this tab (undefined: nobody known yet) and whose chats are on
 * disk. A first answer of "nobody" is left alone: it is also what a flaky
 * network at startup can produce, and the chats are only ever read by the
 * account they belong to.
 */
export function shouldForgetCoachChats(
  userId: string | null,
  previousUserId: string | null | undefined,
  owner: string | null,
): boolean {
  const signedOutHere = !userId && !!previousUserId;
  const anotherAccount = !!userId && !!owner && owner !== userId;
  return signedOutHere || anotherAccount;
}

export function forgetCoachChats(): void {
  safeStorage.removeByPrefix(COACH_STORAGE_PREFIXES);
  safeStorage.removeItem(COACH_OWNER_KEY);
}

/** Bring the stored chats in line with the account now signed in. */
export function settleCoachChats(
  userId: string | null,
  previousUserId: string | null | undefined,
): void {
  const owner = safeStorage.getItem(COACH_OWNER_KEY);
  if (shouldForgetCoachChats(userId, previousUserId, owner)) {
    forgetCoachChats();
  }
  if (userId) safeStorage.setItem(COACH_OWNER_KEY, userId);
}
