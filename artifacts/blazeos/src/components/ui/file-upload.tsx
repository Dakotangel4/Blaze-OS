import { useRef, useState, useCallback } from "react";
import { Upload, X, ImageIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  value?: string | null;
  isUploading?: boolean;
  progress?: number;
  error?: string | null;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect?: (file: File) => void;
  onRemove?: () => void;
  className?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export function FileUpload({
  value,
  isUploading = false,
  progress = 0,
  error,
  accept = "image/*",
  maxSizeMb = 10,
  onFileSelect,
  onRemove,
  className,
  label = "Upload image",
  hint,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const displayError = error ?? localError;

  const validateAndSelect = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setLocalError(null);
      if (!file.type.startsWith("image/")) {
        setLocalError("Only image files are allowed");
        return;
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setLocalError(`File must be under ${maxSizeMb} MB`);
        return;
      }
      onFileSelect?.(file);
    },
    [maxSizeMb, onFileSelect],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      validateAndSelect(e.dataTransfer.files[0]);
    },
    [disabled, validateAndSelect],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSelect(e.target.files?.[0]);
    e.target.value = "";
  };

  const openPicker = () => {
    if (!disabled && !isUploading) inputRef.current?.click();
  };

  if (isUploading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <Upload className="h-5 w-5 shrink-0 animate-pulse text-primary" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-sm font-medium text-foreground">Uploading…</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${Math.max(4, progress)}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">{progress}%</span>
        </div>
      </div>
    );
  }

  if (value) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="group relative overflow-hidden rounded-lg border border-border">
          <img
            src={value}
            alt="Uploaded preview"
            className="max-h-56 w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={openPicker}
              disabled={disabled}
              className="flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-black hover:bg-white disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={disabled}
              className="flex items-center gap-1.5 rounded-md bg-destructive/90 px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>
        <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={handleInputChange} />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openPicker}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onKeyDown={(e) => e.key === "Enter" && openPicker()}
        aria-label={label}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/60 hover:bg-muted/40",
          disabled && "pointer-events-none opacity-50",
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {hint ?? `Drag & drop or click to browse — up to ${maxSizeMb} MB`}
          </p>
        </div>
      </div>

      {displayError && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <X className="h-3.5 w-3.5 shrink-0" />
          {displayError}
        </p>
      )}

      <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={handleInputChange} />
    </div>
  );
}
