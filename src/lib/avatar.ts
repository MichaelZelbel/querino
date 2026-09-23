// Avatars are uploaded at full camera size (one measured at 363 KB) and shown
// at 20 to 40 pixels. Supabase Storage serves a resized copy of a public object
// under /render/image/public/ (checked on this project: 200, image/jpeg, about
// 2 KB at 64 px), so small avatars ask for that instead of the original.

const OBJECT_PATH = "/storage/v1/object/public/";
const RENDER_PATH = "/storage/v1/render/image/public/";

/** A resized copy of a Supabase-hosted avatar; any other URL is returned as is. */
export function resizedAvatarUrl(url: string, size: number): string {
  if (!url.includes(OBJECT_PATH)) return url;
  try {
    const parsed = new URL(url.replace(OBJECT_PATH, RENDER_PATH));
    parsed.searchParams.set("width", String(size));
    parsed.searchParams.set("height", String(size));
    parsed.searchParams.set("resize", "cover");
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Props for an author avatar <img> (or AvatarImage) shown at `displayPx`.
 * The alt text is empty because the author's name is always printed next to
 * the picture, so a screen reader would otherwise read it twice.
 */
export function avatarImageProps(
  url: string | null | undefined,
  displayPx: number,
) {
  if (!url) return { src: undefined, alt: "" };
  const base = Math.max(64, displayPx);
  return {
    src: resizedAvatarUrl(url, base),
    srcSet: `${resizedAvatarUrl(url, base)} 1x, ${resizedAvatarUrl(url, base * 2)} 2x`,
    alt: "",
    loading: "lazy" as const,
    decoding: "async" as const,
    width: displayPx,
    height: displayPx,
  };
}
