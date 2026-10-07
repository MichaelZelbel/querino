// The object path of a blog image inside the blog-media bucket, read from the
// public URL that blog_media.url stores (the table has no path column).
//
// Deleting an image used to delete only its row, so the file stayed publicly
// reachable at its old address (2026-10-07). The delete now removes the file
// first, and needs its path for that.

const BUCKET = "blog-media";

export function blogMediaPath(url: string | null | undefined): string | null {
  if (!url) return null;
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }
  // /storage/v1/object/public/blog-media/<path>, the shape getPublicUrl writes.
  const marker = `/object/public/${BUCKET}/`;
  const at = pathname.indexOf(marker);
  if (at === -1) return null;
  const encoded = pathname.slice(at + marker.length);
  if (!encoded) return null;
  try {
    return encoded.split("/").map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
}
