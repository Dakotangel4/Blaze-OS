import { useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/**
 * Generic Supabase Storage upload hook.
 * Handles progress tracking, error state, and storage cleanup.
 */
export function useFileUpload(bucket: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, pathPrefix: string): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const filePath = pathPrefix ? `${pathPrefix}/${filename}` : filename;

        setProgress(20);

        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          setError(uploadError.message);
          return null;
        }

        setProgress(90);

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(data.path);

        setProgress(100);
        return { path: data.path, publicUrl };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        return null;
      } finally {
        setIsUploading(false);
        setTimeout(() => setProgress(0), 1200);
      }
    },
    [bucket],
  );

  const remove = useCallback(
    async (path: string): Promise<boolean> => {
      const { error: removeError } = await supabase.storage.from(bucket).remove([path]);
      return !removeError;
    },
    [bucket],
  );

  return { upload, remove, isUploading, progress, error };
}
