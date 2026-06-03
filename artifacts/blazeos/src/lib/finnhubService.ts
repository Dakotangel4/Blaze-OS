const FINNHUB_BASE = "https://finnhub.io/api/v1";

// Symbol mappings — adjust per your Finnhub plan
// Free tier: crypto (BINANCE:BTCUSDT) works; forex/commodity may need premium
export const FINNHUB_SYMBOLS = {
  XAUUSD: "OANDA:XAU_USD",    // Gold — requires Forex data access
  NAS100: "OANDA:NAS100_USD",  // NAS100 — requires Forex data access
  BTCUSD: "BINANCE:BTCUSDT",   // Bitcoin — available on free tier
} as const;

interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // high
  l: number;   // low
  o: number;   // open price of the day
  pc: number;  // previous close
}

interface CachedQuote {
  price: number;
  change: number;
  percent: number;
  fetchedAt: number;
}

const CACHE_TTL_MS = 60_000;
const _cache: Record<string, CachedQuote> = {};

function getCached(symbol: string): CachedQuote | null {
  const entry = _cache[symbol];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;
  return entry;
}

function setCache(symbol: string, data: CachedQuote) {
  _cache[symbol] = { ...data, fetchedAt: Date.now() };
}

async function fetchQuote(symbol: string, apiKey: string): Promise<CachedQuote> {
  const url = `${FINNHUB_BASE}/quote?symbol=${encodeURIComponent(symbol)}&token=${apiKey}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

  if (res.status === 401 || res.status === 403) {
    throw new Error("INVALID_KEY");
  }
  if (res.status === 429) {
    throw new Error("RATE_LIMIT");
  }
  if (!res.ok) {
    throw new Error(`HTTP_${res.status}`);
  }

  const data: FinnhubQuote = await res.json();

  if (!data.c || data.c === 0) {
    throw new Error("NO_DATA");
  }

  return { price: data.c, change: data.d ?? 0, percent: data.dp ?? 0, fetchedAt: Date.now() };
}

export async function testFinnhubConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
  try {
    const url = `${FINNHUB_BASE}/quote?symbol=BINANCE:BTCUSDT&token=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (res.status === 401 || res.status === 403) {
      return { ok: false, message: "Invalid API key — authentication failed." };
    }
    if (res.status === 429) {
      return { ok: false, message: "Rate limit reached. Try again in a moment." };
    }
    if (!res.ok) {
      return { ok: false, message: `Finnhub returned HTTP ${res.status}.` };
    }

    const data: FinnhubQuote = await res.json();
    if (!data.c || data.c === 0) {
      return { ok: false, message: "Connected but received no price data." };
    }

    return { ok: true, message: `Connected successfully. BTC: $${data.c.toLocaleString()}` };
  } catch (err: any) {
    if (err?.name === "TimeoutError") {
      return { ok: false, message: "Connection timed out. Check your network." };
    }
    return { ok: false, message: "Unable to reach Finnhub. Check your network." };
  }
}

export async function fetchXAUUSDFinnhub(apiKey: string): Promise<CachedQuote> {
  const cached = getCached("XAUUSD");
  if (cached) return cached;

  const result = await fetchQuote(FINNHUB_SYMBOLS.XAUUSD, apiKey);
  setCache("XAUUSD", result);
  return result;
}

export async function fetchNAS100Finnhub(apiKey: string): Promise<CachedQuote> {
  const cached = getCached("NAS100");
  if (cached) return cached;

  const result = await fetchQuote(FINNHUB_SYMBOLS.NAS100, apiKey);
  setCache("NAS100", result);
  return result;
}

export async function fetchBTCFinnhub(apiKey: string): Promise<CachedQuote> {
  const cached = getCached("BTCUSD");
  if (cached) return cached;

  const result = await fetchQuote(FINNHUB_SYMBOLS.BTCUSD, apiKey);
  setCache("BTCUSD", result);
  return result;
}

export function getLastCached(symbol: string): CachedQuote | null {
  return _cache[symbol] ?? null;
}
