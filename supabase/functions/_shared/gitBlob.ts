// The SHA git gives a file's contents, computed here instead of asked for.
//
// The manual GitHub sync (github-sync) used to create one blob per artifact
// with its own POST, all of them at once. For the one account that syncs
// today that is 167 simultaneous requests, and GitHub's documented secondary
// limits are 100 concurrent requests and 900 points a minute, a POST costing
// five. Since 2026-09-30 the file contents go inside the one "create a tree"
// request (GitHub writes the blobs itself), and the SHA each blob gets, which
// the queue worker needs in github_sync_state, is computed here.
//
// A git blob's id is SHA-1 over "blob <byte length>\0" followed by the bytes.
// GitHub stores the UTF-8 bytes of the content it is sent, so this is the same
// value it reports; gitBlob_test.ts checks it against `git hash-object`.

export async function gitBlobSha(content: string): Promise<string> {
  const body = new TextEncoder().encode(content);
  const header = new TextEncoder().encode(`blob ${body.length}\0`);
  const bytes = new Uint8Array(header.length + body.length);
  bytes.set(header, 0);
  bytes.set(body, header.length);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-1", bytes));
  let hex = "";
  for (const b of digest) hex += b.toString(16).padStart(2, "0");
  return hex;
}
