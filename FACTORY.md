# Factory operations

This application runs on a pinned Archon SDLC source. See
[factory/MIGRATION.md](factory/MIGRATION.md) for installing and upgrading it.

Shared workflow gates own every decision. Inspect a run's identity and status
before responding to a declared gate.

Project runtime scenarios: `harness/END-TO-END.md`.
Holdout scenarios: `/home/godspeed-forge/holdouts/querino/HOLDOUT.md` on the factory's machine,
outside every checkout. The launchers pass that path (`.factory/schedule.json` and
`.factory/trigger.json` for the loop, the manager's service for the manager), and it is the default
in `factory/pack.json`. H-01 to H-18 are visitor checks against the live project; H-19 onward run
against the factory's test copy (`harness/RUNTIME.md`). `.factory/holdout/HOLDOUT.md` in the
repository is only the empty template. `.factory/hooks/holdout_fence.py` lets only the
holdout-writer and holdout-verifier subagents read either file: it refuses every other agent a tool
call that names either file or its folder, also through `~`, `$HOME`, `..` or a glob, and any
recursive search or listing from above the machine folder (`~`, `/home`, `/`). Scenario text that
still reaches a tool's output, for example from a script that opens the file itself, is logged to
`holdout-exposures.jsonl` in the git directory.
Ordinary checks: `python harness/ci.py`.

Record this application's tested source SHA, candidate, run IDs, coverage,
fresh-environment evidence and open integration limits here after testing.
