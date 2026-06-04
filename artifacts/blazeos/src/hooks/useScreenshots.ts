import { useState, useEffect, useCallback } from "react";

const BUCKET = "trade-screenshots";

export type Screenshot = {
  id: number;
  tradeId: number;
  userId: string;
  imageUrl: string;
  imagePath: string;
  imageType: "before" | "during" | "after";
  createdAt: string;
};

export function useTradeScreenshots(tradeId: number | null) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!tradeId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trade-screenshots?tradeId=${tradeId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setScreenshots(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { screenshots, isLoading, refetch };
}

export function useUploadScreenshot() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const upload = useCallback(
    async (
      file: File,
      tradeId: number,
      imageType: "before" | "during" | "after",
      symbol: string
    ): Promise<Screenshot | null> => {
      setIsUploading(true);
      setProgress(0);
      try {
        setProgress(20);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("tradeId", String(tradeId));
        formData.append("imageType", imageType);
        formData.append("symbol", symbol);

        setProgress(50);

        const uploadRes = await fetch("/api/trade-screenshots/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "Upload failed");
        }

        const screenshot: Screenshot = await uploadRes.json();
        setProgress(100);
        return screenshot;
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    []
  );

  return { upload, isUploading, progress };
}

export function useDeleteScreenshot() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteScreenshot = useCallback(
    async (screenshot: Screenshot): Promise<boolean> => {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/trade-screenshots/${screenshot.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        return res.ok || res.status === 204;
      } finally {
        setIsDeleting(false);
      }
    },
    []
  );

  return { deleteScreenshot, isDeleting };
}
