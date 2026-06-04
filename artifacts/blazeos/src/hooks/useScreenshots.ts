import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function useTradeScreenshots(tradeId: number | null) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!tradeId) return;
    setIsLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`/api/trade-screenshots?tradeId=${tradeId}`, { headers });
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
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        const timestamp = Date.now();
        const path = `${tradeId}/${imageType}-${symbol}-${timestamp}.${ext}`;

        setProgress(20);

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message?.includes("Bucket not found")) {
            throw new Error("BUCKET_NOT_FOUND");
          }
          throw new Error(uploadError.message);
        }

        setProgress(70);

        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(path);

        const imageUrl = urlData.publicUrl;

        setProgress(85);

        const headers = await getAuthHeader();
        const res = await fetch("/api/trade-screenshots", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ tradeId, imageUrl, imagePath: path, imageType }),
        });

        if (!res.ok) throw new Error("Failed to save screenshot metadata");

        const screenshot: Screenshot = await res.json();
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
        await supabase.storage.from(BUCKET).remove([screenshot.imagePath]);

        const headers = await getAuthHeader();
        const res = await fetch(`/api/trade-screenshots/${screenshot.id}`, {
          method: "DELETE",
          headers,
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
