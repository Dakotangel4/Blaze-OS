import {
  fetchXAUUSDFinnhub,
  fetchNAS100Finnhub,
  fetchBTCFinnhub,
  getLastCached,
} from "./finnhubService";

export interface AssetQuote {
  symbol: string;
  price: number;
  change: number;
  percent: number;
  source: "finnhub" | "simulated" | "cached";
  fetchedAt: number;
}

// ─── Simulated seeds ────────────────────────────────────────────────────────
let _xauSeed = 2334.12;
let _nasSeed = 18452.3;

function jitter(base: number, bps = 0.0008): number {
  const delta = base * bps * (Math.random() * 2 - 1);
  return parseFloat((base + delta).toFixed(2));
}

// ─── Public fetch functions ──────────────────────────────────────────────────

export async function fetchBTCUSD(apiKey?: string | null): Promise<AssetQuote> {
  if (apiKey) {
    try {
      const q = await fetchBTCFinnhub(apiKey);
      return {
        symbol: "BTCUSD",
        price: q.price,
        change: q.change,
        percent: q.percent,
        source: "finnhub",
        fetchedAt: q.fetchedAt,
      };
    } catch {
      const cached = getLastCached("BTCUSD");
      if (cached) {
        return { symbol: "BTCUSD", ...cached, source: "cached" };
      }
    }
  }

  // CoinGecko free fallback
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const json = await res.json();
      const price: number = json.bitcoin.usd;
      const percent: number = json.bitcoin.usd_24h_change ?? 0;
      const change = parseFloat(((percent / 100) * price).toFixed(2));
      return { symbol: "BTCUSD", price, change, percent: parseFloat(percent.toFixed(2)), source: "simulated", fetchedAt: Date.now() };
    }
  } catch { /* fall through */ }

  // Mock fallback
  const price = parseFloat((67210 + (Math.random() - 0.5) * 500).toFixed(0));
  return { symbol: "BTCUSD", price, change: 0, percent: 0, source: "simulated", fetchedAt: Date.now() };
}

export async function fetchXAUUSD(apiKey?: string | null): Promise<AssetQuote> {
  if (apiKey) {
    try {
      const q = await fetchXAUUSDFinnhub(apiKey);
      return {
        symbol: "XAUUSD",
        price: q.price,
        change: q.change,
        percent: q.percent,
        source: "finnhub",
        fetchedAt: q.fetchedAt,
      };
    } catch {
      const cached = getLastCached("XAUUSD");
      if (cached) {
        return { symbol: "XAUUSD", ...cached, source: "cached" };
      }
    }
  }

  // Simulated fallback
  _xauSeed = jitter(_xauSeed, 0.0006);
  const change = parseFloat((_xauSeed - 2334.12).toFixed(2));
  const percent = parseFloat(((change / 2334.12) * 100).toFixed(2));
  return { symbol: "XAUUSD", price: _xauSeed, change, percent, source: "simulated", fetchedAt: Date.now() };
}

export async function fetchNAS100(apiKey?: string | null): Promise<AssetQuote> {
  if (apiKey) {
    try {
      const q = await fetchNAS100Finnhub(apiKey);
      return {
        symbol: "NAS100",
        price: q.price,
        change: q.change,
        percent: q.percent,
        source: "finnhub",
        fetchedAt: q.fetchedAt,
      };
    } catch {
      const cached = getLastCached("NAS100");
      if (cached) {
        return { symbol: "NAS100", ...cached, source: "cached" };
      }
    }
  }

  // Simulated fallback
  _nasSeed = jitter(_nasSeed, 0.0005);
  const change = parseFloat((_nasSeed - 18452.3).toFixed(2));
  const percent = parseFloat(((change / 18452.3) * 100).toFixed(2));
  return { symbol: "NAS100", price: _nasSeed, change, percent, source: "simulated", fetchedAt: Date.now() };
}
