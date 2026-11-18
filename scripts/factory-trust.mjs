// The trust guard of the software factory. The factory builds every open issue or pull request that
// is not labelled `needs-owner`, whoever wrote it, so on a public repository a stranger's text could
// steer an AI that writes code. This script runs from .github/workflows/factory-trust.yml and:
//   - labels an issue or pull request opened by anyone else `needs-owner`
//   - replaces a comment headed like a decision (owner decision, contract, Loop review: ...) by anyone
//     else with a neutral text
//   - answers a review headed like a decision by anyone else, once
// The rules are copied from Mission Control's trust pass for the product repository
// (release-driver-owner-steps.mjs). Node built-ins only.
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const TRUSTED = [
  "MichaelZelbel",
  "godspeed-dev-builder[bot]",
  "godspeed-dev-release[bot]",
];
export const NEEDS_OWNER = "needs-owner";
export const NEUTRAL_PREFIX = "Neutralised by the factory trust guard";

// A line the loop and the manager take as authority, as the product's trust pass reads it.
export const HEADED_LINE =
  /^[\s#>*_`~]*(owner\s+decision\b|owner\s+question\b|manager\s+decision\b|loop\s+review\s*:|contract\s*(?:[:*_`#~]|$))/i;

// A login as REST gives it ("godspeed-dev-builder[bot]"), or an account object: the bare name counts
// as the App only when GitHub says it is a bot.
export const loginOf = (a) =>
  a && typeof a === "object"
    ? a.type === "Bot" && !String(a.login || "").endsWith("[bot]")
      ? `${a.login}[bot]`
      : String(a.login || "")
    : String(a || "");
export const isTrusted = (who, trusted = TRUSTED) =>
  trusted.includes(loginOf(who));

// True when any line of the body is headed like a decision.
export const isHeaded = (body) =>
  String(body || "")
    .split("\n")
    .some((line) => HEADED_LINE.test(line.trim()));

export const neutralBody = (login, at = new Date()) =>
  `${NEUTRAL_PREFIX} on ${new Date(at).toISOString().slice(0, 10)}: this comment came from an account that may not decide for this repository (${String(login || "a deleted account").replace(/@/g, "")}), so it is not an owner decision, contract or review, and the factory does not act on it. Its original text stays in GitHub's edit history.`;

export const reviewMarker = (reviewId) =>
  `<!-- factory-trust-review:${reviewId} -->`;
export const reviewReply = (review) =>
  `The review ${review.html_url} came from an account that may not decide for this repository (${String(review.user?.login || "a deleted account").replace(/@/g, "")}). It is not an owner decision, contract or review, and the factory does not act on it.\n${reviewMarker(review.id)}`;

// Decide what to do about one event. Pure: returns a list of actions, no network.
// event: { name, payload }; existingComments: the conversation comments of the item (reviews only).
export function plan(event, existingComments = [], now = new Date()) {
  const { name, payload } = event;
  const action = payload.action;
  const actions = [];
  if (name === "issues" || name === "pull_request_target") {
    if (!["opened", "reopened"].includes(action)) return actions;
    const item = payload.issue || payload.pull_request;
    if (!item) return actions;
    const labels = (item.labels || []).map((l) => l.name || l);
    if (!isTrusted(item.user) && !labels.includes(NEEDS_OWNER))
      actions.push({ type: "label", number: item.number });
    return actions;
  }
  if (name === "issue_comment" || name === "pull_request_review_comment") {
    if (!["created", "edited"].includes(action)) return actions;
    const c = payload.comment;
    if (!c || isTrusted(c.user)) return actions;
    if (!isHeaded(c.body) || String(c.body).startsWith(NEUTRAL_PREFIX))
      return actions;
    actions.push({
      type: "neutralise",
      kind: name === "issue_comment" ? "issues" : "pulls",
      id: c.id,
      body: neutralBody(c.user?.login, now),
    });
    return actions;
  }
  if (name === "pull_request_review") {
    if (!["submitted", "edited"].includes(action)) return actions;
    const r = payload.review;
    if (!r || isTrusted(r.user) || !isHeaded(r.body)) return actions;
    const number = payload.pull_request?.number;
    if (!number) return actions;
    const marker = reviewMarker(r.id);
    actions.push({ type: "label", number });
    if (!existingComments.some((c) => String(c.body || "").includes(marker))) {
      actions.push({ type: "reply", number, body: reviewReply(r) });
    }
    return actions;
  }
  return actions;
}

// ---------------------------------------------------------------- thin main
async function api(method, path, body) {
  const res = await fetch(`https://api.github.com/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "querino-factory-trust",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok)
    throw new Error(
      `${method} ${path} failed: ${res.status} ${(await res.text()).slice(0, 300)}`,
    );
  return res.status === 204 ? null : res.json();
}

export async function main(env = process.env) {
  const repo = env.GITHUB_REPOSITORY;
  const event = {
    name: env.GITHUB_EVENT_NAME,
    payload: JSON.parse(fs.readFileSync(env.GITHUB_EVENT_PATH, "utf8")),
  };
  const comments = [];
  if (event.name === "pull_request_review" && event.payload.pull_request) {
    const n = event.payload.pull_request.number;
    for (let p = 1; p <= 10; p++) {
      const rows = await api(
        "GET",
        `repos/${repo}/issues/${n}/comments?per_page=100&page=${p}`,
      );
      comments.push(...rows);
      if (rows.length < 100) break;
    }
  }
  for (const a of plan(event, comments)) {
    if (a.type === "label")
      await api("POST", `repos/${repo}/issues/${a.number}/labels`, {
        labels: [NEEDS_OWNER],
      });
    else if (a.type === "neutralise")
      await api("PATCH", `repos/${repo}/${a.kind}/comments/${a.id}`, {
        body: a.body,
      });
    else if (a.type === "reply")
      await api("POST", `repos/${repo}/issues/${a.number}/comments`, {
        body: a.body,
      });
    console.log(`factory-trust: ${a.type} ${a.number ?? a.id}`);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
