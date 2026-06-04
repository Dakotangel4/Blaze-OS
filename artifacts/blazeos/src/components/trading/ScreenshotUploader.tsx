import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImagePlus, X, CheckCircle2, Loader2 } from "lucide-react";
import { useUploadScreenshot, type Screenshot } from "@/hooks/useScreenshots";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ImageType = "before" | "during" | "after";

const LABEL: Record<ImageType, { title: string; sub: string; color: string; glow: string }> = {
  before: {
    title: "BEFORE ENTRY",
    sub: "Drop your setup screenshot here",
    color: "border-blue-500/40 hover:border-blue-400/60",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
  },
  during: {
    title: "DURING TRADE",
    sub: "Optional: mid-trade screenshot",
    color: "border-yellow-500/30 hover:border-yellow-400/50",
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.10)]",
  },
  after: {
    title: "AFTER EXIT",
    sub: "Drop your result screenshot here",
    color: "border-green-500/40 hover:border-green-400/60",
    glow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
  },
};

const ACCEPTED = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

interface Props {
  tradeId: number;
  symbol: string;
  imageType: ImageType;
  existing?: Screenshot | null;
  onUploaded: (s: Screenshot) => void;
  onDeleted: () => void;
}

export function ScreenshotUploader({ tradeId, symbol, imageType, existing, onUploaded, onDeleted }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedScreenshot, setUploadedScreenshot] = useState<Screenshot | null>(existing ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading, progress } = useUploadScreenshot();
  const { toast } = useToast();
  const config = LABEL[imageType];

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        toast({ title: "Invalid file type. Use PNG, JPG, or WEBP.", variant: "destructive" });
        return;
      }
      if (file.size > MAX_SIZE) {
        toast({ title: "File too large. Max 10MB per image.", variant: "destructive" });
        return;
      }
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      try {
        const s = await upload(file, tradeId, imageType, symbol);
        if (s) {
          setUploadedScreenshot(s);
          onUploaded(s);
          toast({ title: `${config.title} screenshot uploaded.` });
        } else {
          setPreview(null);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        if (msg === "BUCKET_NOT_FOUND") {
          toast({
            title: "Storage not configured",
            description: "Create a 'trade-screenshots' bucket in your Supabase project with public access.",
            variant: "destructive",
          });
        } else {
          toast({ title: "Upload failed", description: msg, variant: "destructive" });
        }
        setPreview(null);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [upload, tradeId, imageType, symbol, config.title, onUploaded, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDelete = useCallback(() => {
    setUploadedScreenshot(null);
    setPreview(null);
    onDeleted();
  }, [onDeleted]);

  const displayUrl = uploadedScreenshot?.imageUrl ?? preview;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.15em] text-white/30 font-mono uppercase">
          {config.title}
        </span>
        {uploadedScreenshot && (
          <span className="flex items-center gap-1 text-[10px] text-green-400 font-mono">
            <CheckCircle2 className="h-3 w-3" />
            Uploaded
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {displayUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-black/40"
          >
            <img
              src={displayUrl}
              alt={`${imageType} screenshot`}
              className="w-full h-44 object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono hover:bg-red-500/30 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                <div className="w-32 bg-white/10 rounded-full h-1">
                  <motion.div
                    className="bg-primary h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/50">{progress}%</span>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "relative h-44 rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-3 overflow-hidden",
              "bg-black/30 backdrop-blur-sm",
              config.color,
              isDragging && [config.glow, "scale-[1.01]"],
              isUploading && "pointer-events-none"
            )}
          >
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-xl"
                />
              )}
            </AnimatePresence>

            {isUploading ? (
              <>
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <div className="w-32 bg-white/10 rounded-full h-1">
                  <motion.div
                    className="bg-primary h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/40">{progress}%</span>
              </>
            ) : (
              <>
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-transform",
                  isDragging ? "scale-110" : "scale-100",
                  imageType === "before" ? "bg-blue-500/15 text-blue-400"
                    : imageType === "after" ? "bg-green-500/15 text-green-400"
                    : "bg-yellow-500/15 text-yellow-400"
                )}>
                  {isDragging ? <Upload className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white/60">
                    {isDragging ? "Drop to upload" : "Drop TradingView screenshot here"}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5 font-mono">{config.sub}</p>
                  <p className="text-[10px] text-white/20 mt-1 font-mono">PNG · JPG · WEBP · max 10MB</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[11px] text-white/40 font-mono hover:border-white/20 hover:text-white/60 transition-colors">
                  <Upload className="h-3 w-3" />
                  Click to browse
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
        capture="environment"
      />
    </div>
  );
}
