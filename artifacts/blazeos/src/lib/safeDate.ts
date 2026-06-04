import { format } from "date-fns";

/**
 * Safe wrapper around date-fns format().
 *
 * Never throws: returns `fallback` if the input is null, undefined, empty,
 * or produces an invalid Date (e.g. "Invalid Date").
 *
 * Usage:
 *   safeFormat(trade.createdAt, "MMM d, HH:mm")
 *   safeFormat(note.updatedAt, "MMM d, yyyy", "—")
 */
export function safeFormat(
  input: Date | string | number | null | undefined,
  fmt: string,
  fallback = "—"
): string {
  try {
    if (input === null || input === undefined || input === "") return fallback;
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return fallback;
    return format(d, fmt);
  } catch {
    return fallback;
  }
}
