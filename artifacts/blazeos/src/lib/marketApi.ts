export interface AssetQuote {
  symbol: string;
  price: number;
  change: number;
  percent: number;
}

let _xauSeed = 2334.12;
let _nasSeed = 18452.3;

function jitter(base: number, bps = 0.0008): number {
  const delta = base * bps * (Math.random() * 2 - 1);
  return parseFloat((base + delta).toFixed(2));
}

export async function fetchBTCUSD(): Promise<AssetQuote> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true",
    { signal: AbortSignal.timeout(8000) }
  );
  if (!res.ok) throw new Error("CoinGecko error");
  const json = await res.json();
  const price: number = json.bitcoin.usd;
  const percent: number = json.bitcoin.usd_24h_change ?? 0;
  const change = parseFloat(((percent / 100) * price).toFixed(2));
  return { symbol: "BTCUSD", price, change, percent: parseFloat(percent.toFixed(2)) };
}

export async function fetchXAUUSD(): Promise<AssetQuote> {
  _xauSeed = jitter(_xauSeed, 0.0006);
  const change = parseFloat((_xauSeed - 2334.12).toFixed(2));
  const percent = parseFloat(((change / 2334.12) * 100).toFixed(2));
  return { symbol: "XAUUSD", price: _xauSeed, change, percent };
}

export async function fetchNAS100(): Promise<AssetQuote> {
  _nasSeed = jitter(_nasSeed, 0.0005);
  const change = parseFloat((_nasSeed - 18452.3).toFixed(2));
  const percent = parseFloat(((change / 18452.3) * 100).toFixed(2));
  return { symbol: "NAS100", price: _nasSeed, change, percent };
}
