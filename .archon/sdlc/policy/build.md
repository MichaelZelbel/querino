# Build queue policy: Querino

This adds to the SDLC pack's default build policy.

## A pull request gets at most two review rounds

From the third round on, only a finding that shows a real defect blocks: wrong behaviour a visitor
or the release would hit, a broken or weakened check, a security problem, or an unmet item of the
issue's acceptance. Everything else (more tests or coverage, wording, extra hardening, robustness
beyond the contract, style) is written into the pull request as a note and does not block. The item
is Done when the review has no such real defect and CI is green.

- The build queue does not start a third correction round for findings that are not real defects,
  and does not ask a person about them.
- A real defect found in round three or later is fixed in one round, then this rule applies again.
- Reason: the same rule the Godspeed product has carried since 8 November 2026, after reviews kept
  adding requirements round after round and nothing merged for hours.

## The live project is never touched from a lap

No lap runs the live security suite, publishes the site, deploys an edge function, applies a
migration or sets a secret (`engineering.md`). CI runs the suite; the rest is the release step.
