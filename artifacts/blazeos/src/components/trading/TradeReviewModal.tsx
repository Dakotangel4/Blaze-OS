import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ZoomIn, Download, ChevronLeft, ChevronRight, Camera,
  TrendingUp, TrendingDown, DollarSign, Target, Calendar, Clock,
  Maximize2, CheckCircle2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenshotUploader } from "./ScreenshotUploader";
import { useTradeScreenshots, useDeleteScreenshot, type Screenshot } from "@/hooks/useScreenshots";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ImageType = "before" | "during" | "after";

type Trade = {
  id: number;
  symbol: string;
  direction: string;
  entryPrice: number;
  exitPrice: number;
  riskPercent: number;
  lotSize: number;
  setupType: string;
  session: string;
  result: string;
  notes?: string | null;
  pnl?: number | null;
  createdAt: string;
};

interface LightboxProps {
  url: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  label?: string;
}

function Lightbox({ url, onClose, onPrev, onNext, hasPrev, hasNext, label }: LightboxProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.();
      if (e.key === "ArrowRight" && hasNext) onNext?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext, hasPrev, hasNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        {label && (
          <span className="text-[10px] font-bold tracking-[0.15em] text-white/40 font-mono uppercase bg-black/60 px-3 py-1.5 rounded-md">
            {label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <a
            href={url}
            download
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <motion.img
        key={url}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.2 }}
        src={url}
        alt="Trade screenshot"
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext?.(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </motion.div>
  );
}

function ScreenshotSlot({
  type, screenshot, isLoading, onExpand, isHighlight,
}: {
  type: ImageType;
  screenshot?: Screenshot;
  isLoading: boolean;
  onExpand: () => void;
  isHighlight?: boolean;
}) {
  const colors = {
    before: "text-blue-400 border-blue-500/20",
    during: "text-yellow-400 border-yellow-500/20",
    after: "text-green-400 border-green-500/20",
  };

  return (
    <div className={cn("rounded-xl overflow-hidden border", colors[type], isHighlight && "ring-1 ring-primary/30")}>
      <div className={cn(
        "px-3 py-2 flex items-center justify-between border-b",
        type === "before" ? "border-blue-500/20 bg-blue-500/5"
          : type === "after" ? "border-green-500/20 bg-green-500/5"
          : "border-yellow-500/20 bg-yellow-500/5"
      )}>
        <span className={cn("text-[10px] font-bold tracking-[0.15em] font-mono uppercase", colors[type].split(" ")[0])}>
          {type === "before" ? "BEFORE ENTRY" : type === "after" ? "AFTER EXIT" : "DURING TRADE"}
        </span>
        {screenshot && (
          <button onClick={onExpand} className="text-white/30 hover:text-white/70 transition-colors">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="relative bg-black/40" style={{ minHeight: 180 }}>
        {isLoading ? (
          <Skeleton className="w-full h-44" />
        ) : screenshot ? (
          <motion.div
            className="group cursor-zoom-in"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.15 }}
            onClick={onExpand}
          >
            <img
              src={screenshot.imageUrl}
              alt={`${type} screenshot`}
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-70 transition-opacity" />
            </div>
          </motion.div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center gap-2">
            <Camera className="h-8 w-8 text-white/10" />
            <span className="text-[10px] text-white/20 font-mono">No screenshot yet</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  trade: Trade | null;
  open: boolean;
  onClose: () => void;
}

export function TradeReviewModal({ trade, open, onClose }: Props) {
  const { screenshots, isLoading, refetch } = useTradeScreenshots(trade?.id ?? null);
  const { deleteScreenshot } = useDeleteScreenshot();
  const [lightbox, setLightbox] = useState<{ url: string; label: string; index: number } | null>(null);
  const [activeTab, setActiveTab] = useState<"review" | "upload">("review");

  const before = screenshots.find((s) => s.imageType === "before");
  const during = screenshots.find((s) => s.imageType === "during");
  const after = screenshots.find((s) => s.imageType === "after");

  const allScreenshots = [before, during, after].filter(Boolean) as Screenshot[];
  const lightboxList = allScreenshots.map((s) => ({
    url: s.imageUrl,
    label: s.imageType.toUpperCase(),
  }));

  const openLightbox = (index: number) => {
    if (lightboxList[index]) {
      setLightbox({ ...lightboxList[index], index });
    }
  };

  if (!trade) return null;

  const rr = trade.entryPrice && trade.exitPrice
    ? Math.abs((trade.exitPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2)
    : "—";

  const TABS = [
    { id: "review" as const, label: "Trade Review" },
    { id: "upload" as const, label: "Upload Screenshots" },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-full bg-[#09090f] border-white/[0.08] p-0 gap-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Camera className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <span className="font-mono">{trade.symbol}</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px] uppercase border",
                    trade.direction === "Buy" ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"
                  )}>
                    {trade.direction}
                  </Badge>
                  <Badge className={cn(
                    "text-[10px]",
                    trade.result === "Win" ? "bg-green-500/15 text-green-400 border-green-500/20"
                      : trade.result === "Loss" ? "bg-red-500/15 text-red-400 border-red-500/20"
                      : "bg-white/5 text-white/40 border-white/10"
                  )}>
                    {trade.result}
                  </Badge>
                </DialogTitle>
                <p className="text-[10px] text-white/30 font-mono mt-0.5">
                  {format(new Date(trade.createdAt), "MMM d, yyyy HH:mm")} · {trade.session}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] bg-black/20 px-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative py-3 px-1 mr-6 text-xs font-medium transition-colors",
                  activeTab === tab.id ? "text-white" : "text-white/30 hover:text-white/60"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto max-h-[72vh]">
            <AnimatePresence mode="wait">
              {activeTab === "review" ? (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 space-y-5"
                >
                  {/* Screenshot grid */}
                  {screenshots.length === 0 && !isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                        <Camera className="h-7 w-7 text-white/15" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white/30">No screenshots yet</p>
                        <p className="text-xs text-white/20 mt-1 font-mono">Capture your analysis and build a visual trading journal.</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-white/40 hover:text-white/70 gap-2"
                        onClick={() => setActiveTab("upload")}
                      >
                        <Camera className="h-4 w-4" />
                        Upload Screenshot
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ScreenshotSlot
                        type="before"
                        screenshot={before}
                        isLoading={isLoading}
                        onExpand={() => openLightbox(allScreenshots.indexOf(before!))}
                        isHighlight
                      />
                      <ScreenshotSlot
                        type="after"
                        screenshot={after}
                        isLoading={isLoading}
                        onExpand={() => openLightbox(allScreenshots.indexOf(after!))}
                      />
                    </div>
                  )}

                  {/* Trade stats */}
                  <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                    <div className="text-[10px] font-bold tracking-[0.15em] text-white/25 font-mono uppercase mb-3">
                      Trade Statistics
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { label: "Symbol", value: trade.symbol, icon: TrendingUp, color: "text-primary" },
                        { label: "Direction", value: trade.direction, icon: trade.direction === "Buy" ? TrendingUp : TrendingDown, color: trade.direction === "Buy" ? "text-green-400" : "text-red-400" },
                        { label: "Entry", value: `$${trade.entryPrice.toFixed(2)}`, icon: Target, color: "text-white/60" },
                        { label: "Exit", value: `$${trade.exitPrice.toFixed(2)}`, icon: Target, color: "text-white/60" },
                        { label: "P&L", value: trade.pnl != null ? `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}` : "—", icon: DollarSign, color: trade.pnl && trade.pnl >= 0 ? "text-green-400" : "text-red-400" },
                        { label: "Setup", value: trade.setupType, icon: Calendar, color: "text-blue-400" },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                          <stat.icon className={cn("h-3 w-3 mx-auto mb-1", stat.color)} />
                          <div className={cn("text-sm font-bold font-mono", stat.color)}>{stat.value}</div>
                          <div className="text-[9px] text-white/25 font-mono mt-0.5 uppercase tracking-wider">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {trade.notes && (
                    <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4">
                      <div className="text-[10px] font-bold tracking-[0.15em] text-white/25 font-mono uppercase mb-2">
                        Trader Notes
                      </div>
                      <p className="text-xs text-white/50 font-mono leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 space-y-4"
                >
                  <p className="text-xs text-white/30 font-mono flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    Drag-and-drop or click to upload. PNG, JPG, WEBP — max 10MB per image.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(["before", "during", "after"] as ImageType[]).map((t) => {
                      const existing = screenshots.find((s) => s.imageType === t);
                      return (
                        <ScreenshotUploader
                          key={t}
                          tradeId={trade.id}
                          symbol={trade.symbol}
                          imageType={t}
                          existing={existing}
                          onUploaded={(s) => refetch()}
                          onDeleted={() => refetch()}
                        />
                      );
                    })}
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-[11px] text-white/40 font-mono leading-relaxed">
                      <span className="text-primary font-bold">Note:</span> Screenshots are stored in Supabase Storage. Make sure you have created a public <code className="text-primary/80">trade-screenshots</code> bucket in your Supabase project. See Settings → Storage for instructions.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {lightbox && (
          <Lightbox
            url={lightbox.url}
            label={lightbox.label}
            onClose={() => setLightbox(null)}
            hasPrev={lightbox.index > 0}
            hasNext={lightbox.index < lightboxList.length - 1}
            onPrev={() => {
              const idx = lightbox.index - 1;
              setLightbox({ ...lightboxList[idx], index: idx });
            }}
            onNext={() => {
              const idx = lightbox.index + 1;
              setLightbox({ ...lightboxList[idx], index: idx });
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
