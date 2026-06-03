import { useState, useEffect, useRef } from "react";
import { fetchBTCUSD, fetchXAUUSD, fetchNAS100 } from "@/lib/marketApi";
import type { AssetQuote } from "@/lib/marketApi";

export interface MarketData {
  xauusd: AssetQuote | null;
  nas100: AssetQuote | null;
  btcusd: AssetQuote | null;
}

const POLL_INTERVAL_MS = 8000;

export function useMarketData() {
  const [data, setData] = useState<MarketData>({ xauusd: null, nas100: null, btcusd: null });
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Record<string, "up" | "down" | null>>({});
  const prevPrices = useRef<Record<string, number>>({});

  const triggerFlash = (symbol: string, newPrice: number) => {
    const prev = prevPrices.current[symbol];
    if (prev === undefined) return;
    if (newPrice === prev) return;
    const dir = newPrice > prev ? "up" : "down";
    setFlash((f) => ({ ...f, [symbol]: dir }));
    setTimeout(() => setFlash((f) => ({ ...f, [symbol]: null })), 600);
  };

  const fetchAll = async () => {
    const [xau, nas, btc] = await Promise.allSettled([
      fetchXAUUSD(),
      fetchNAS100(),
      fetchBTCUSD(),
    ]);

    setData((prev) => {
      const next: MarketData = {
        xauusd: xau.status === "fulfilled" ? xau.value : prev.xauusd,
        nas100: nas.status === "fulfilled" ? nas.value : prev.nas100,
        btcusd: btc.status === "fulfilled" ? btc.value : prev.btcusd,
      };

      if (next.xauusd) triggerFlash("XAUUSD", next.xauusd.price);
      if (next.nas100) triggerFlash("NAS100", next.nas100.price);
      if (next.btcusd) triggerFlash("BTCUSD", next.btcusd.price);

      if (next.xauusd) prevPrices.current["XAUUSD"] = next.xauusd.price;
      if (next.nas100) prevPrices.current["NAS100"] = next.nas100.price;
      if (next.btcusd) prevPrices.current["BTCUSD"] = next.btcusd.price;

      return next;
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return { data, loading, flash };
}
