const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when a `:slug` route param is actually a legacy UUID id.
 *
 * Legacy /<route>/<uuid> URLs are still indexed by Google from before slugs
 * existed. Since 2026-10-07 the detail routes' loaders answer them with a 301
 * to the current slug on the server (route-loaders.ts); the pages used to do it
 * in the browser after hydration, which a crawler never saw.
 */
export function isUuid(value: string | undefined): boolean {
  return !!value && UUID_RE.test(value);
}
