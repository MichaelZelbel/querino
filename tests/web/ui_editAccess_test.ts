import { assertEquals } from "@std/assert";
import { decideEditAccess, type EditPageRow } from "@/lib/editAccess.ts";
import {
  ARTIFACT_PUBLIC_COLUMN,
  type ArtifactListTable,
} from "@/lib/artifactListColumns.ts";

const AUTHOR = "author-1";
const OTHER = "other-1";
const TEAM = "team-1";
const TABLES: ArtifactListTable[] = [
  "prompts",
  "skills",
  "workflows",
  "prompt_kits",
];

function row(
  table: ArtifactListTable,
  fields: Partial<EditPageRow> & { public?: boolean },
): EditPageRow {
  const { public: isPublic = false, ...rest } = fields;
  const visibility = { [ARTIFACT_PUBLIC_COLUMN[table]]: isPublic };
  return {
    slug: "my-item",
    author_id: AUTHOR,
    team_id: null,
    ...visibility,
    ...rest,
  };
}

Deno.test("the author edits their own item of every type", () => {
  for (const table of TABLES) {
    assertEquals(decideEditAccess(table, row(table, {}), AUTHOR, [], false), {
      kind: "edit",
    });
  }
});

Deno.test("a premium member of the item's team edits it", () => {
  for (const table of TABLES) {
    const teamRow = row(table, { team_id: TEAM });
    assertEquals(decideEditAccess(table, teamRow, OTHER, [TEAM], true), {
      kind: "edit",
    });
    // Not premium, or premium in another team: the database refuses the
    // update, so the page does too.
    assertEquals(decideEditAccess(table, teamRow, OTHER, [TEAM], false), {
      kind: "denied",
      backTo: "/library",
    });
    assertEquals(decideEditAccess(table, teamRow, OTHER, ["team-2"], true), {
      kind: "denied",
      backTo: "/library",
    });
  }
});

Deno.test(
  "another signed-in person is sent to the public page of a public item",
  () => {
    const publicPaths: Record<ArtifactListTable, string> = {
      prompts: "/prompts/my-item",
      skills: "/skills/my-item",
      workflows: "/workflows/my-item",
      prompt_kits: "/prompt-kits/my-item",
    };
    for (const table of TABLES) {
      assertEquals(
        decideEditAccess(table, row(table, { public: true }), OTHER, [], false),
        { kind: "denied", backTo: publicPaths[table] },
      );
    }
  },
);

Deno.test(
  "another signed-in person gets the Library link for a private item they can see",
  () => {
    for (const table of TABLES) {
      assertEquals(
        decideEditAccess(
          table,
          row(table, { team_id: TEAM }),
          OTHER,
          [TEAM],
          false,
        ),
        { kind: "denied", backTo: "/library" },
      );
    }
  },
);

Deno.test("a missing item looks exactly like a hidden one", () => {
  // A private or team item the person may not read arrives as no row, so
  // these two are the same case by construction; the answer names nothing.
  for (const table of TABLES) {
    const missing = decideEditAccess(table, null, OTHER, [], false);
    assertEquals(missing, { kind: "denied", backTo: "/library" });
    assertEquals(
      decideEditAccess(table, undefined, OTHER, [TEAM], true),
      missing,
    );
  }
});

Deno.test("a signed-out visitor is sent to sign in, whatever the item", () => {
  for (const table of TABLES) {
    assertEquals(
      decideEditAccess(table, row(table, { public: true }), null, [], false),
      { kind: "signIn" },
    );
    assertEquals(decideEditAccess(table, null, undefined, [], false), {
      kind: "signIn",
    });
  }
});
