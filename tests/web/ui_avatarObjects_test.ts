import { assertEquals } from "@std/assert";
import { avatarObjectPath, staleAvatarPaths } from "@/lib/avatar.ts";

const ID = "0a000000-0000-4000-a000-000000000001";

Deno.test(
  "a picture is stored in its owner's folder under its extension",
  () => {
    assertEquals(avatarObjectPath(ID, "me.png"), `${ID}/avatar.png`);
    assertEquals(avatarObjectPath(ID, "Holiday.Photo.JPG"), `${ID}/avatar.jpg`);
  },
);

Deno.test("a file name without an extension still gets one", () => {
  assertEquals(avatarObjectPath(ID, "photo"), `${ID}/avatar.png`);
  assertEquals(avatarObjectPath(ID, "photo."), `${ID}/avatar.png`);
  assertEquals(avatarObjectPath(ID, ".webp"), `${ID}/avatar.png`);
});

Deno.test("after an upload, only the other extensions are stale", () => {
  assertEquals(
    staleAvatarPaths(
      ID,
      ["avatar.png", "avatar.jpg", "avatar.webp"],
      `${ID}/avatar.jpg`,
    ),
    [`${ID}/avatar.png`, `${ID}/avatar.webp`],
  );
});

Deno.test("after a removal, every stored picture is stale", () => {
  assertEquals(staleAvatarPaths(ID, ["avatar.png", "avatar.gif"], null), [
    `${ID}/avatar.png`,
    `${ID}/avatar.gif`,
  ]);
});

Deno.test("other files in the folder are never touched", () => {
  assertEquals(
    staleAvatarPaths(
      ID,
      ["notes.txt", "avatarx.png", ".emptyFolderPlaceholder"],
      null,
    ),
    [],
  );
});
