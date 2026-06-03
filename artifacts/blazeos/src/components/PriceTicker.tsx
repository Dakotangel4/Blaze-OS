import { useMarketData } from "@/hooks/useMarketData";
import type { AssetQuote } from "@/lib/marketApi";
import { format } from "date-fns";
import { useLocation } from "wouter";

function SourceBadge({ source }: { source: AssetQuote["source"] }) {
  if (source === "finnhub") {
    return (
      <span className="text-[8px] font-bold tracking-widest text-green-500/60 bg-green-500/10 border border-green-500/20 rounded px-1 py-0.5">
        LIVE
      </span>
    );
  }
  if (source === "cached") {
    return (
      <span className="text-[8px] font-bold tracking-widest text-yellow-500/60 bg-yellow-500/10 border border-yellow-500/20 rounded px-1 py-0.5">
        CACHED
      </span>
    );
  }
  return (
    <span className="text-[8px] font-bold tracking-widest text-white/20 bg-white/5 border border-white/10 rounded px-1 py-0.5">
      SIM
    </span>
  );
}

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
  const updatedAt = quote.fetchedAt ? format(new Date(quote.fetchedAt), "HH:mm:ss") : null;

  return (
    <div
      className="flex items-center gap-3 px-5 py-2 transition-colors duration-500"
      style={{ backgroundColor: flashBg }}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-widest text-white/50 uppercase">
            {quote.symbol}
          </span>
          <SourceBadge source={quote.source} />
        </div>
        {updatedAt && (
          <span className="text-[9px] text-white/20 font-mono">{updatedAt}</span>
        )}
      </div>
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
  const { data, loading, flash, hasLiveKey } = useMarketData();
  const [, navigate] = useLocation();

  const assets: { key: keyof typeof data; label: string }[] = [
    { key: "xauusd", label: "XAUUSD" },
    { key: "nas100", label: "NAS100" },
    { key: "btcusd", label: "BTCUSD" },
  ];

  return (
    <div
      className="w-full flex items-center border-b border-white/[0.06] overflow-x-auto"
      style={{ backgroundColor: "#0B0F17", minHeight: 48 }}
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

      <div className="ml-auto flex items-center gap-3 px-4 shrink-0">
        {!hasLiveKey && (
          <button
            onClick={() => navigate("/settings")}
            className="text-[10px] text-yellow-500/60 hover:text-yellow-400 font-mono border border-yellow-500/20 hover:border-yellow-500/40 rounded px-2 py-0.5 transition-colors"
          >
            + Connect Finnhub
          </button>
        )}
        <span className="text-[10px] text-white/20 font-mono whitespace-nowrap">
          {hasLiveKey ? "LIVE · 8s" : "SIM · 8s"}
        </span>
      </div>
    </div>
  );
}
