import { format } from "date-fns";

export function safeFormatDate(
  value: string | number | Date | null | undefined,
  pattern: string,
  fallback = "--"
) {
  if (!value) return fallback;

  const date = new Date(value);

  if (isNaN(date.getTime())) return fallback;

  return format(date, pattern);
}
