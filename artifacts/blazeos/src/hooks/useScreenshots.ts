import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { getAuthHeaders } from "@/utils/supabase/server";

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

async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = await getAuthHeaders();
  return fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
}

export function useTradeScreenshots(tradeId: number | null) {
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!tradeId) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`/api/trade-screenshots?tradeId=${tradeId}`);
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
      file: File,
      tradeId: number,
      imageType: "before" | "during" | "after",
    ): Promise<Screenshot | null> => {
      setIsUploading(true);
      setProgress(10);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const ext = file.name.split(".").pop() ?? "png";
        const storagePath = `${user.id}/${tradeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        setProgress(30);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(SCREENSHOTS_BUCKET)
          .upload(storagePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw new Error(uploadError.message);
        setProgress(70);

        const {
          data: { publicUrl },
        } = supabase.storage.from(SCREENSHOTS_BUCKET).getPublicUrl(uploadData.path);

        const res = await authFetch("/api/trade-screenshots", {
          method: "POST",
          body: JSON.stringify({
            tradeId,
            imageUrl: publicUrl,
            imagePath: uploadData.path,
            imageType,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error ?? "Failed to save screenshot");
        }

        setProgress(100);
        return res.json();
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
      const res = await authFetch(`/api/trade-screenshots/${screenshot.id}`, {
        method: "DELETE",
      });
      return res.ok || res.status === 204;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return { deleteScreenshot, isDeleting };
}
