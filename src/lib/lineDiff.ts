// A line diff for the suggestion review window (2026-10-07).
//
// The window used to compare line N of one text with line N of the other, so
// a single inserted line marked every line below it as changed and hid the
// lines that accepting would really delete. This is a longest-common-
// subsequence diff: a line counts as unchanged only when it is in both texts
// in the same order. No dependency: the texts are prompts and skills, a few
// hundred lines at most, and the common start and end are cut off first.

export type DiffOp =
  | { type: "unchanged"; content: string; oldLine: number; newLine: number }
  | { type: "removed"; content: string; oldLine: number }
  | { type: "added"; content: string; newLine: number };

export interface DiffCell {
  type: "unchanged" | "removed" | "added";
  content: string;
  line: number;
}

/** One row of a side-by-side view; a missing side is a gap. */
export interface DiffRow {
  left: DiffCell | null;
  right: DiffCell | null;
}

// Above this many table cells the middle part is shown as removed, then
// added, instead of being aligned line by line: still true about what goes
// and what comes, just less precise, and it cannot freeze the page.
const MAX_CELLS = 4_000_000;

function splitLines(text: string): string[] {
  return (text ?? "").replace(/\r\n?/g, "\n").split("\n");
}

export function diffLines(oldText: string, newText: string): DiffOp[] {
  const a = splitLines(oldText);
  const b = splitLines(newText);

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start++;
  }
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const ops: DiffOp[] = [];
  for (let i = 0; i < start; i++) {
    ops.push({
      type: "unchanged",
      content: a[i],
      oldLine: i + 1,
      newLine: i + 1,
    });
  }

  const n = endA - start;
  const m = endB - start;
  if ((n + 1) * (m + 1) > MAX_CELLS) {
    for (let i = start; i < endA; i++) {
      ops.push({ type: "removed", content: a[i], oldLine: i + 1 });
    }
    for (let j = start; j < endB; j++) {
      ops.push({ type: "added", content: b[j], newLine: j + 1 });
    }
  } else if (n > 0 || m > 0) {
    // lcs[i][j]: the common subsequence length of a[start+i..] and b[start+j..].
    const width = m + 1;
    const lcs = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        lcs[i * width + j] =
          a[start + i] === b[start + j]
            ? lcs[(i + 1) * width + j + 1] + 1
            : Math.max(lcs[(i + 1) * width + j], lcs[i * width + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && a[start + i] === b[start + j]) {
        ops.push({
          type: "unchanged",
          content: a[start + i],
          oldLine: start + i + 1,
          newLine: start + j + 1,
        });
        i++;
        j++;
      } else if (
        j < m &&
        (i >= n || lcs[i * width + j + 1] >= lcs[(i + 1) * width + j])
      ) {
        ops.push({
          type: "added",
          content: b[start + j],
          newLine: start + j + 1,
        });
        j++;
      } else {
        ops.push({
          type: "removed",
          content: a[start + i],
          oldLine: start + i + 1,
        });
        i++;
      }
    }
  }

  const shift = endB - endA;
  for (let i = endA; i < a.length; i++) {
    ops.push({
      type: "unchanged",
      content: a[i],
      oldLine: i + 1,
      newLine: i + shift + 1,
    });
  }
  return ops;
}

/**
 * Lay a diff out in two columns. Unchanged lines share a row; a run of removed
 * lines and the run of added lines next to it are paired row by row, so a
 * rewritten line sits beside its replacement and nothing is shown twice.
 */
export function sideBySide(ops: DiffOp[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op.type === "unchanged") {
      rows.push({
        left: { type: "unchanged", content: op.content, line: op.oldLine },
        right: { type: "unchanged", content: op.content, line: op.newLine },
      });
      k++;
      continue;
    }
    const removed: DiffCell[] = [];
    const added: DiffCell[] = [];
    while (k < ops.length && ops[k].type !== "unchanged") {
      const o = ops[k];
      if (o.type === "removed") {
        removed.push({ type: "removed", content: o.content, line: o.oldLine });
      } else if (o.type === "added") {
        added.push({ type: "added", content: o.content, line: o.newLine });
      }
      k++;
    }
    for (let r = 0; r < Math.max(removed.length, added.length); r++) {
      rows.push({ left: removed[r] ?? null, right: added[r] ?? null });
    }
  }
  return rows;
}

/** How many lines a diff removes and adds. */
export function diffCounts(ops: DiffOp[]): { removed: number; added: number } {
  let removed = 0;
  let added = 0;
  for (const op of ops) {
    if (op.type === "removed") removed++;
    else if (op.type === "added") added++;
  }
  return { removed, added };
}
