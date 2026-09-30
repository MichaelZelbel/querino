import { useEffect, useState } from "react";
import { formatDateIn } from "./formatDate";

/**
 * A calendar date in the visitor's own time zone.
 *
 * The server knows no visitor's zone, so it renders UTC, and the browser's
 * first render must say the same or React discards the page (see
 * formatDate.ts). After that first render the browser switches to its own
 * zone: an item created at 23:00 UTC reads "Sep 24" in Berlin, as it should.
 * This is what GitHub and most sites do; none ask people to set a zone just
 * to read a date.
 */
export function LocalDate({
  value,
  style = "short",
}: {
  value: string | number | Date | null | undefined;
  style?: "short" | "long";
}) {
  const [timeZone, setTimeZone] = useState("UTC");
  useEffect(() => {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (zone) setTimeZone(zone);
    } catch {
      // No zone information: UTC stays.
    }
  }, []);

  const text = formatDateIn(value, style, timeZone);
  if (!text) return null;
  const iso = new Date(value as string | number | Date).toISOString();
  return <time dateTime={iso}>{text}</time>;
}
