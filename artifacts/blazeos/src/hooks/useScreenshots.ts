import { useState, useEffect, useCallback } from "react";

export const SCREENSHOTS_BUCKET = "trade-screenshots";

export type Screenshot = {
  id: number;
  tradeId: number;
  userId: string;
  imageUrl: string;
  imagePath: string;
  imageType: "before" | "during" | "after";
  createdAt: string;
};

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers as Record<string, string> | undefined) },
  });
}

export function useTradeScreenshots(tradeId: number | null) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!tradeId) return;
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/trade-screenshots?tradeId=${tradeId}`);
      if (res.ok) setScreenshots(await res.json());
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
      _file: File,
      _tradeId: number,
      _imageType: "before" | "during" | "after",
    ): Promise<Screenshot | null> => {
      setIsUploading(true);
      setProgress(10);
      try {
        throw new Error("Screenshot upload requires cloud storage configuration.");
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 1000);
      }
    },
    [],
  );

  return { upload, isUploading, progress };
}

export function useDeleteScreenshot() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteScreenshot = useCallback(async (screenshot: Screenshot): Promise<boolean> => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/trade-screenshots/${screenshot.id}`, {
        method: "DELETE",
      });
      return res.ok || res.status === 204;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteScreenshot, isDeleting };
}
