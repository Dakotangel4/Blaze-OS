const TZ = "Etc/GMT-1"; // POSIX sign convention: Etc/GMT-1 = UTC+1 (fixed, no DST)

export function formatTimeGMT1(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso));
  } catch { return "--:--"; }
}

export function getDateKeyGMT1(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    }).format(new Date(iso));
  } catch { return ""; }
}

export function formatDateLabelGMT1(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric",
    }).format(new Date(iso));
  } catch { return "Invalid date"; }
}

export function getTodayKeyGMT1(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/** Convert a stored UTC ISO string to a GMT+1 value for a datetime-local input */
export function isoToGMT1Input(iso: string): string {
  try {
    // sv-SE gives "YYYY-MM-DD HH:mm" — swap space for T
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: TZ,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso)).replace(" ", "T");
  } catch { return ""; }
}

/** Convert a datetime-local input value (entered as GMT+1) back to a UTC ISO string */
export function gmt1InputToISO(value: string): string {
  return new Date(`${value}:00+01:00`).toISOString();
}
