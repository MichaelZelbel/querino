// Tests for .factory/hooks/holdout_fence.py, run by `npm run test:scripts`.
// The hook is run the way Claude Code runs it (and the way factory/consumer.py
// fence_report proves it): a JSON event on stdin, exit 2 refuses, exit 0 lets
// the call through. The hidden scenarios live outside every checkout, at the
// path the launchers pass; on 2026-11-19 a review found that `cat` of that
// folder with a glob, and a recursive grep from above it, both passed the fence.

import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const HOOK = join(ROOT, ".factory", "hooks", "holdout_fence.py");
// The factory's account, so `~` and `$HOME` mean what they mean for a builder there.
const HOME = "/home/godspeed-forge";
const HOLDOUTS = `${HOME}/holdouts`;
const MACHINE = `${HOLDOUTS}/querino/HOLDOUT.md`;

function findPython() {
  for (const candidate of [process.env.PYTHON, "python3", "python"]) {
    if (!candidate) continue;
    const probe = spawnSync(
      candidate,
      ["-c", "import sys; print(sys.version_info[0])"],
      { encoding: "utf8" },
    );
    if (probe.status === 0 && probe.stdout.trim() === "3") return candidate;
  }
  throw new Error("No Python 3 to run the holdout fence (set PYTHON)");
}
const PYTHON = findPython();

function fence(event, { project = ROOT, mode = "pre" } = {}) {
  const result = spawnSync(PYTHON, [HOOK, mode], {
    input: JSON.stringify({ cwd: project, ...event }),
    cwd: project,
    encoding: "utf8",
    env: {
      ...process.env,
      CLAUDE_PROJECT_DIR: project,
      HOME,
      USERPROFILE: HOME,
    },
  });
  return { code: result.status, stderr: result.stderr };
}

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });
const as = (event, agent) => (agent ? { ...event, agent_type: agent } : event);

// Every route to the machine folder the review named, and its neighbours.
const BYPASSES = [
  ["a glob over the folder", bash(`cat ${HOLDOUTS}/querino/*`)],
  ["a recursive grep of the holdouts folder", bash(`grep -r H-19 ${HOLDOUTS}`)],
  [
    "the file by absolute path",
    { tool_name: "Read", tool_input: { file_path: MACHINE } },
  ],
  [
    "a sibling file by absolute path",
    bash(`cat ${HOLDOUTS}/querino/notes.txt`),
  ],
  ["~", bash("cat ~/holdouts/querino/notes.txt")],
  ["$HOME", bash("cat $HOME/holdouts/querino/notes.txt")],
  ["${HOME}", bash("cat ${HOME}/holdouts/querino/notes.txt")],
  [
    "a relative path climbing out",
    bash("cat ../../../../holdouts/querino/notes.txt"),
  ],
  ["cd home, then a bare name", bash("cd ~ && ls holdouts")],
  ["a quoted-apart name", bash('cat ~/hold""outs/querino/notes.txt')],
  ["a glob on the folder name", bash("ls ~/hold*")],
  ["a ? glob", bash(`cat ${HOME}/hold?uts/querino/notes.txt`)],
  ["globs on every level", bash("cat /home/*/hold*/q*/*")],
  ["a brace list", bash(`cat ${HOME}/{holdouts,tmp}/querino/notes.txt`)],
  ["a glob listing home's folders", bash("ls ~/*")],
  ["grep -r from home", bash(`grep -r H-19 ${HOME}`)],
  ["grep -r from /home", bash("grep -rn H-19 /home")],
  ["grep -r from /", bash("grep -r H-19 /")],
  ["cd home, then grep -r .", bash("cd ~ && grep -r H-19 .")],
  ["cd /, then grep -r of a relative name", bash("cd / && grep -r H-19 home")],
  ["rg from home", bash("rg H-19 ~")],
  ["rg from /home", bash("rg H-19 /home")],
  ["rg with no path after cd home", bash("cd ~ && rg H-19")],
  ["find from /", bash("find / -name '*.md'")],
  ["find from home", bash("find ~ -type f")],
  ["ls of the folder", bash(`ls ${HOLDOUTS}`)],
  ["ls -R of home", bash("ls -R ~")],
  ["tree of /home", bash("tree /home")],
  ["du of home", bash("du -a ~")],
  ["tar of home", bash("tar czf /tmp/x.tgz -C ~ .")],
  ["cp -r of home", bash("cp -r ~ /tmp/copy")],
  ["a search behind sudo", bash("sudo -u godspeed-forge grep -r H-19 ~")],
  ["a search inside bash -c", bash("bash -c 'cd ~ && grep -r H-19 .'")],
  ["the verifier's tools by glob", bash("cat ~/.archon/hold*/x")],
  [
    "Read with ~",
    {
      tool_name: "Read",
      tool_input: { file_path: "~/holdouts/querino/notes.md" },
    },
  ],
  [
    "the Grep tool from home",
    { tool_name: "Grep", tool_input: { pattern: "H-19", path: HOME } },
  ],
  [
    "the Grep tool from /",
    { tool_name: "Grep", tool_input: { pattern: "H-19", path: "/" } },
  ],
  [
    "the Glob tool from home",
    { tool_name: "Glob", tool_input: { pattern: "**/*.md", path: HOME } },
  ],
  [
    "the Glob tool with an absolute glob",
    { tool_name: "Glob", tool_input: { pattern: "/home/*/hold*/*/*" } },
  ],
  [
    "Write into the folder",
    {
      tool_name: "Write",
      tool_input: { file_path: `${HOLDOUTS}/querino/x.md`, content: "x" },
    },
  ],
  [
    "an agent told to read the folder",
    {
      tool_name: "Agent",
      tool_input: {
        subagent_type: "general-purpose",
        prompt: `Summarise ${HOLDOUTS}/querino`,
      },
    },
  ],
  [
    "PowerShell recursing from home",
    {
      tool_name: "PowerShell",
      tool_input: { command: "Get-ChildItem -Recurse ~" },
    },
  ],
];

// What the fence refused before this change must stay refused.
const STILL_REFUSED = [
  [
    "the in-repository template",
    {
      tool_name: "Read",
      tool_input: {
        file_path: join(ROOT, ".factory", "holdout", "HOLDOUT.md"),
      },
    },
  ],
  ["a glob into .factory", bash("cat .factory/*")],
  ["grep -r over the checkout", bash("grep -r useState .")],
  ["rg --no-ignore over the checkout", bash("rg --no-ignore useState")],
  ["the file by name", bash(`cat ${MACHINE}`)],
  ["the verifier's tools by name", bash("ls ~/.archon/holdout-tools")],
];

// Ordinary builder work in the checkout.
const ORDINARY = [
  bash("git status"),
  bash("git diff"),
  bash("git log --oneline -5"),
  bash("rg useState src"),
  bash("rg -g '*.ts' useState src"),
  bash("grep -rn useState src"),
  bash("grep -rn '/home/' src"),
  bash("find src -name '*.ts'"),
  bash("bun test"),
  bash("bun run test:web"),
  bash("npm run check"),
  bash('npx prettier --check "**/*.ts"'),
  bash("ls -la"),
  bash("ls ~"),
  bash("ls -ltr ~"),
  bash("ls ~/.archon"),
  bash("cat ~/.bashrc"),
  bash("cat README.md | head -5"),
  { tool_name: "Read", tool_input: { file_path: join(ROOT, "README.md") } },
  { tool_name: "Grep", tool_input: { pattern: "useState", path: "src" } },
  { tool_name: "Grep", tool_input: { pattern: "useState" } },
  { tool_name: "Glob", tool_input: { pattern: "**/*.ts" } },
  { tool_name: "Glob", tool_input: { pattern: "src/**/*.tsx" } },
  {
    tool_name: "Edit",
    tool_input: {
      file_path: join(ROOT, "src", "router.tsx"),
      old_string: "a",
      new_string: "b",
    },
  },
];

for (const [name, event] of BYPASSES) {
  test(`a builder is refused: ${name}`, () => {
    const { code, stderr } = fence(event);
    assert.equal(code, 2, stderr);
    assert.match(stderr, /holdout fence/);
  });
  test(`the holdout-verifier is let through: ${name}`, () => {
    const { code, stderr } = fence(as(event, "holdout-verifier"));
    assert.equal(code, 0, stderr);
  });
}

for (const [name, event] of STILL_REFUSED) {
  test(`still refused for a builder: ${name}`, () => {
    assert.equal(fence(event).code, 2);
  });
}

test("the holdout-writer reads and writes the real file", () => {
  for (const event of [
    { tool_name: "Read", tool_input: { file_path: MACHINE } },
    {
      tool_name: "Write",
      tool_input: { file_path: MACHINE, content: "## H-99\n" },
    },
    {
      tool_name: "Edit",
      tool_input: { file_path: MACHINE, old_string: "a", new_string: "b" },
    },
  ])
    assert.equal(fence(as(event, "holdout-writer")).code, 0);
});

test("a builder may launch the holdout-verifier", () => {
  const event = {
    tool_name: "Agent",
    tool_input: {
      subagent_type: "holdout-verifier",
      prompt: `Verify against ${MACHINE}`,
    },
  };
  assert.equal(fence(event).code, 0);
});

for (const event of ORDINARY) {
  test(`ordinary work passes: ${event.tool_name} ${JSON.stringify(event.tool_input).slice(0, 60)}`, () => {
    const { code, stderr } = fence(event);
    assert.equal(code, 0, stderr);
  });
}

test("the hook's machine path is the default factory/pack.json names", () => {
  const script =
    "import runpy, sys; print(runpy.run_path(sys.argv[1])['MACHINE_HOLDOUT'])";
  const printed = spawnSync(PYTHON, ["-c", script, HOOK], { encoding: "utf8" });
  assert.equal(printed.status, 0, printed.stderr);
  const pack = JSON.parse(
    readFileSync(join(ROOT, "factory", "pack.json"), "utf8"),
  );
  for (const inputs of Object.values(pack.default_inputs))
    assert.equal(inputs.holdout, printed.stdout.trim());
});

// A project whose launcher files pass their own scenario file, a worktree of it,
// and the leak logger, all in a temp directory.
let base, project, worktree, hidden, hiddenFolder;

function git(cwd, ...args) {
  const result = spawnSync(
    "git",
    [
      "-c",
      "user.name=fence-test",
      "-c",
      "user.email=fence@test.invalid",
      ...args,
    ],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
}

before(() => {
  base = mkdtempSync(join(tmpdir(), "holdout-fence-"));
  project = join(base, "project");
  worktree = join(base, "worktree");
  hiddenFolder = join(base, "hidden", "proj").replaceAll("\\", "/");
  hidden = `${hiddenFolder}/HOLDOUT.md`;
  mkdirSync(join(project, ".factory", "holdout"), { recursive: true });
  mkdirSync(hiddenFolder, { recursive: true });
  writeFileSync(
    hidden,
    "# Hidden checks\n\n## H-99 The list\n\nA visitor who opens the list sees every public prompt, newest first, and nothing private.\n",
  );
  writeFileSync(
    join(project, ".factory", "holdout", "HOLDOUT.md"),
    "# Holdout scenarios\n\nThis template line is longer than forty characters and is public text.\n",
  );
  writeFileSync(join(project, "README.md"), "test project\n");
  git(project, "init", "-q");
  git(project, "add", "README.md", ".factory/holdout/HOLDOUT.md");
  git(project, "commit", "-q", "-m", "init");
  git(project, "worktree", "add", "-q", "-b", "lap", worktree);
  // Launcher files are not committed: they exist in the main checkout only.
  writeFileSync(
    join(project, ".factory", "schedule.json"),
    JSON.stringify({ workflow: "archon-loop", inputs: { holdout: hidden } }),
  );
});

after(() => {
  if (base && existsSync(base)) rmSync(base, { recursive: true, force: true });
});

test("the folder the launcher passes is fenced, in the checkout and in its worktrees", () => {
  for (const where of [project, worktree]) {
    const run = (event) => fence(event, { project: where });
    assert.equal(run(bash(`cat ${hiddenFolder}/notes.txt`)).code, 2, where);
    assert.equal(
      run(bash(`grep -r H-99 ${dirname(hiddenFolder)}`)).code,
      2,
      where,
    );
    assert.equal(
      run({ tool_name: "Read", tool_input: { file_path: hidden } }).code,
      2,
      where,
    );
    assert.equal(
      run(as(bash(`cat ${hiddenFolder}/notes.txt`), "holdout-verifier")).code,
      0,
      where,
    );
    assert.equal(
      run(bash(`cat ${dirname(hiddenFolder)}/other.txt`)).code,
      0,
      where,
    );
  }
});

function exposures() {
  const log = join(project, ".git", "holdout-exposures.jsonl");
  if (!existsSync(log)) return [];
  return readFileSync(log, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

test("the leak logger compares output with the real scenarios, not the template", () => {
  const leaked = {
    tool_name: "Bash",
    tool_input: { command: "python3 some-script.py" },
    tool_response: {
      stdout:
        "x\nA visitor who opens the list sees every public prompt, newest first, and nothing private.\ny",
    },
  };
  const template = {
    tool_name: "Read",
    tool_input: { file_path: "FACTORY.md" },
    tool_response: {
      content:
        "This template line is longer than forty characters and is public text.",
    },
  };
  assert.equal(fence(template, { project, mode: "post" }).code, 0);
  assert.equal(exposures().length, 0, "the template is not the scenarios");
  assert.equal(
    fence(as(leaked, "holdout-verifier"), { project, mode: "post" }).code,
    0,
  );
  assert.equal(exposures().length, 0, "the verifier may see them");
  assert.equal(fence(leaked, { project, mode: "post" }).code, 0);
  const logged = exposures();
  assert.equal(logged.length, 1);
  assert.deepEqual(logged[0].scenarios, ["H-99"]);
  assert.equal(logged[0].tool, "Bash");
});
