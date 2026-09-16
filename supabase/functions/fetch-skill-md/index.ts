import { getCallerUserId } from "../_shared/llm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Allowed domains for fetching
const ALLOWED_DOMAINS = ["github.com", "raw.githubusercontent.com"];

// A SKILL.md is a few kilobytes. The path under raw.githubusercontent.com is
// chosen by the caller, so without a cap this function would read whatever
// file they pointed it at into memory, however large, and however long the
// server took to send it.
const MAX_BODY_BYTES = 1_000_000;
const FETCH_TIMEOUT_MS = 15_000;

/**
 * The body as text, or null when it is larger than MAX_BODY_BYTES. The
 * Content-Length header is checked first when there is one; the stream is
 * counted anyway, because the header is optional and not always honest.
 */
async function readCapped(response: Response): Promise<string | null> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return null;

  const reader = response.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Prevent SSRF attacks
    if (
      hostname === "localhost" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      !url.protocol.startsWith("https")
    ) {
      return false;
    }

    return ALLOWED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain),
    );
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // A signed-in session is required. Every caller is the skill editor in
    // the browser, which invokes this through supabase.functions.invoke and
    // so always carries the session token; the gateway itself does not check
    // it (verify_jwt = false in config.toml), so this does. Without it the
    // relay was an anonymous fetch-anything-from-GitHub endpoint.
    try {
      await getCallerUserId(req);
    } catch {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return new Response(
        JSON.stringify({ error: "Request body must be a JSON object" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const { sourceType, sourceRef, sourcePath, sourceVersion, originalUrl } =
      body as Record<string, unknown>;

    // sourcePath is pasted into the raw.githubusercontent.com path. A '?' or a
    // '#' in it ends the path early, so "README.md#" fetched README.md rather
    // than the SKILL.md this endpoint exists to read, and '..' walked out of
    // the repository's own folder. The host allowlist below cannot see any of
    // that, because the host is still raw.githubusercontent.com.
    if (sourcePath !== undefined && sourcePath !== null) {
      const badChars = ["?", "#", "\\"];
      if (
        typeof sourcePath !== "string" ||
        badChars.some((c) => sourcePath.includes(c)) ||
        sourcePath.split("/").includes("..") ||
        sourcePath.startsWith("/")
      ) {
        return new Response(
          JSON.stringify({
            error:
              "sourcePath must be a relative path with no '?', '#', '..' or backslash",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    console.log("Fetch request:", {
      sourceType,
      sourceRef,
      sourcePath,
      sourceVersion,
      originalUrl,
    });

    let fetchUrl: string;
    let content: string = "";

    if (sourceType === "clawhub") {
      // ClawHub doesn't expose raw markdown content via public URLs
      return new Response(
        JSON.stringify({
          error:
            'ClawHub skills cannot be auto-fetched. Please visit the ClawHub page, copy the skill content, and paste it using "Write SKILL.md manually" mode.',
          isClawHubLimitation: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else if (sourceType === "github") {
      // For GitHub, construct raw.githubusercontent.com URL
      if (!sourceRef) {
        return new Response(
          JSON.stringify({ error: "Invalid GitHub repository URL" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Extract owner/repo from sourceRef
      const repoMatch =
        typeof sourceRef === "string"
          ? sourceRef.match(/github\.com\/([^/]+)\/([^/]+)/)
          : null;
      if (!repoMatch) {
        return new Response(
          JSON.stringify({ error: "Could not parse GitHub repository URL" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const [, owner, repo] = repoMatch;
      const branch =
        sourceVersion === "latest" ? "main" : sourceVersion || "main";
      const path = sourcePath ? `${sourcePath}/SKILL.md` : "SKILL.md";

      // Try main branch first, then master
      const branchesToTry = branch === "main" ? ["main", "master"] : [branch];

      for (const tryBranch of branchesToTry) {
        fetchUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${tryBranch}/${path}`;

        if (!isAllowedUrl(fetchUrl)) {
          console.log(`URL not allowed: ${fetchUrl}`);
          continue;
        }

        console.log(`Trying GitHub URL: ${fetchUrl}`);

        try {
          const response = await fetch(fetchUrl, {
            headers: {
              Accept: "text/plain",
              "User-Agent": "Querino/1.0",
            },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          });

          if (response.ok) {
            const text = await readCapped(response);
            if (text === null) {
              console.log(
                `Refused ${fetchUrl}: larger than ${MAX_BODY_BYTES} bytes`,
              );
              return new Response(
                JSON.stringify({
                  error:
                    "SKILL.md is larger than 1 MB, which is not a skill file",
                }),
                {
                  status: 413,
                  headers: {
                    ...corsHeaders,
                    "Content-Type": "application/json",
                  },
                },
              );
            }
            content = text;
            console.log(`Successfully fetched from ${fetchUrl}`);
            break;
          } else {
            console.log(`Failed to fetch ${fetchUrl}: ${response.status}`);
          }
        } catch (e) {
          console.log(`Failed to fetch ${fetchUrl}: ${e}`);
        }
      }

      if (!content) {
        return new Response(
          JSON.stringify({
            error: `SKILL.md not found in repository. Tried: ${path} on branches: ${branchesToTry.join(", ")}`,
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          error: "Unsupported source type. Use GitHub URLs for auto-fetch.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-skill-md:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || "Failed to fetch SKILL.md",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
