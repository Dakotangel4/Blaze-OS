import { useMarketData } from "@/hooks/useMarketData";
import type { AssetQuote } from "@/lib/marketApi";

function TickerCard({
  quote,
  flashDir,
}: {
  quote: AssetQuote | null;
  flashDir: "up" | "down" | null;
}) {
  if (!quote) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex flex-col gap-1 animate-pulse">
          <div className="h-3 w-16 bg-white/10 rounded" />
          <div className="h-4 w-24 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  const isUp = quote.change >= 0;
  const color = isUp ? "#22c55e" : "#ef4444";
  const arrow = isUp ? "▲" : "▼";

  let flashBg = "transparent";
  if (flashDir === "up") flashBg = "rgba(34,197,94,0.12)";
  if (flashDir === "down") flashBg = "rgba(239,68,68,0.12)";

  const priceDecimals = quote.symbol === "BTCUSD" ? 0 : quote.symbol === "NAS100" ? 1 : 2;

  return (
    <div
      className="flex items-center gap-3 px-5 py-2.5 transition-colors duration-500"
      style={{ backgroundColor: flashBg }}
    >
      <span className="text-xs font-bold tracking-widest text-white/50 uppercase">
        {quote.symbol}
      </span>
      <span className="font-mono text-sm font-semibold text-white">
        {quote.price.toLocaleString("en-US", {
          minimumFractionDigits: priceDecimals,
          maximumFractionDigits: priceDecimals,
        })}
      </span>
      <span
        className="font-mono text-xs font-medium flex items-center gap-1"
        style={{ color }}
      >
        <span>{arrow}</span>
        <span>
          {isUp ? "+" : ""}
          {quote.change.toFixed(priceDecimals)}
        </span>
        <span>
          ({isUp ? "+" : ""}
          {quote.percent.toFixed(2)}%)
        </span>
      </span>
    </div>
  );
}

export default function PriceTicker() {
  const { data, loading, flash } = useMarketData();

  const assets: { key: keyof typeof data; label: string }[] = [
    { key: "xauusd", label: "XAUUSD" },
    { key: "nas100", label: "NAS100" },
    { key: "btcusd", label: "BTCUSD" },
  ];

  return (
    <div
      className="w-full flex items-center border-b border-white/[0.06] overflow-x-auto"
      style={{ backgroundColor: "#0B0F17", minHeight: 44 }}
    >
      <div className="flex items-center divide-x divide-white/[0.06]">
        {loading && !data.xauusd ? (
          <div className="px-5 py-2.5 text-xs text-white/30 font-mono tracking-wider animate-pulse">
            Loading market data...
          </div>
        ) : (
          assets.map(({ key }) => (
            <TickerCard
              key={key}
              quote={data[key]}
              flashDir={flash[data[key]?.symbol ?? ""] ?? null}
            />
          ))
        )}
      </div>

      <div className="ml-auto px-4 text-[10px] text-white/20 font-mono whitespace-nowrap shrink-0">
        LIVE · 8s
      </div>
    </div>
  );
}
