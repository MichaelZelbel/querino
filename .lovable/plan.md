

## Replace Homepage Stats: Total Artifacts + Open Source Badge

### Problem
"1 Active Creator" looks empty and "5.0 Average Rating" looks fake. Replace both with more compelling, honest metrics.

### Changes

**File: `src/components/landing/HomeStats.tsx`**

Replace the three-stat grid with:

1. **Public Prompts** (keep as-is) — real number, already looks good at 47
2. **Total Artifacts** — count across all four public artifact tables (prompts + skills + workflows + claws). Shows breadth of content even if individual counts are small. Query: parallel `select count` with `head: true` on each table's public rows, sum them.
3. **Open Source** — not a number, but a trust signal. Display "AGPL-3.0" with a code/git icon and label "Open Source". Links to the GitHub repo or `/docs`. No DB query needed.

### Layout
Same 3-column grid. Stats remain visually consistent:

```text
📋 47              📦 52              🔓 AGPL-3.0
Public Prompts     Total Artifacts    Open Source
```

### Technical Details

- Remove `active_creators_last_7_days` RPC call and `averageRating` query
- Add three new count queries: `skills` (published=true), `workflows` (published=true), `claws` (published=true)
- Sum all four counts for "Total Artifacts"
- Open Source stat is static — no query, just renders icon + text with a link to GitHub
- Remove `AnimatedNumber` for the Open Source cell; keep it for the two numeric cells
- Icon choices: `Package` or `Layers` for Total Artifacts, `Github` or `Code` for Open Source

### Files
- **Modify**: `src/components/landing/HomeStats.tsx` — rewrite stats data fetching and rendering

