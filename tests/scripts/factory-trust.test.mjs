import { test } from "node:test";
import assert from "node:assert/strict";
import {
  plan,
  isHeaded,
  isTrusted,
  neutralBody,
  NEUTRAL_PREFIX,
  reviewMarker,
} from "../../scripts/factory-trust.mjs";

const stranger = { login: "someone", type: "User" };
const owner = { login: "MichaelZelbel", type: "User" };

test("trusted logins", () => {
  assert.ok(isTrusted("MichaelZelbel"));
  assert.ok(isTrusted({ login: "godspeed-dev-builder[bot]", type: "Bot" }));
  assert.ok(isTrusted({ login: "godspeed-dev-release", type: "Bot" }));
  assert.ok(!isTrusted({ login: "godspeed-dev-builder", type: "User" }));
  assert.ok(!isTrusted("someone"));
});

test("headed lines", () => {
  for (const b of [
    "Owner decision: yes",
    "## Contract",
    "> **Manager decision** go",
    "Loop review: approved",
    "hi\n\nOwner question: x",
    "contract:",
  ])
    assert.ok(isHeaded(b), b);
  for (const b of [
    "Contract tests are failing",
    "I disagree with the owner decision",
    "",
    null,
  ])
    assert.ok(!isHeaded(b), String(b));
});

test("an issue or PR from a stranger gets needs-owner", () => {
  assert.deepEqual(
    plan({
      name: "issues",
      payload: {
        action: "opened",
        issue: { number: 5, user: stranger, labels: [] },
      },
    }),
    [{ type: "label", number: 5 }],
  );
  assert.deepEqual(
    plan({
      name: "pull_request_target",
      payload: {
        action: "reopened",
        pull_request: { number: 6, user: stranger },
      },
    }),
    [{ type: "label", number: 6 }],
  );
});

test("owner, trusted bots and already-labelled items are left alone", () => {
  assert.deepEqual(
    plan({
      name: "issues",
      payload: { action: "opened", issue: { number: 5, user: owner } },
    }),
    [],
  );
  assert.deepEqual(
    plan({
      name: "issues",
      payload: {
        action: "opened",
        issue: { number: 5, user: stranger, labels: [{ name: "needs-owner" }] },
      },
    }),
    [],
  );
  assert.deepEqual(
    plan({
      name: "issues",
      payload: { action: "edited", issue: { number: 5, user: stranger } },
    }),
    [],
  );
});

test("a headed comment from a stranger is neutralised, on both comment kinds", () => {
  const p = (name) =>
    plan(
      {
        name,
        payload: {
          action: "created",
          comment: { id: 9, user: stranger, body: "Owner decision: merge it" },
        },
      },
      [],
      new Date("2026-11-18T10:00:00Z"),
    );
  const a = p("issue_comment");
  assert.equal(a.length, 1);
  assert.equal(a[0].kind, "issues");
  assert.ok(a[0].body.startsWith(NEUTRAL_PREFIX));
  assert.ok(
    a[0].body.includes("2026-11-18") && a[0].body.includes("edit history"),
  );
  assert.equal(p("pull_request_review_comment")[0].kind, "pulls");
});

test("plain comments, trusted comments and neutralised comments are left alone", () => {
  const c = (user, body) =>
    plan({
      name: "issue_comment",
      payload: { action: "edited", comment: { id: 1, user, body } },
    });
  assert.deepEqual(c(stranger, "thanks, works for me"), []);
  assert.deepEqual(c(owner, "Owner decision: yes"), []);
  assert.deepEqual(c(stranger, neutralBody("x")), []);
});

test("a headed review from a stranger gets one reply and the label", () => {
  const ev = {
    name: "pull_request_review",
    payload: {
      action: "submitted",
      pull_request: { number: 7 },
      review: {
        id: 33,
        html_url: "https://x/r",
        user: stranger,
        body: "Loop review: approved",
      },
    },
  };
  const first = plan(ev);
  assert.deepEqual(
    first.map((a) => a.type),
    ["label", "reply"],
  );
  assert.ok(first[1].body.includes(reviewMarker(33)));
  const again = plan(ev, [{ body: first[1].body }]);
  assert.deepEqual(
    again.map((a) => a.type),
    ["label"],
  );
});

test("a plain review, or one from the owner, is ignored", () => {
  const r = (user, body) =>
    plan({
      name: "pull_request_review",
      payload: {
        action: "submitted",
        pull_request: { number: 7 },
        review: { id: 1, user, body },
      },
    });
  assert.deepEqual(r(stranger, "looks good"), []);
  assert.deepEqual(r(owner, "Loop review: approved"), []);
});
