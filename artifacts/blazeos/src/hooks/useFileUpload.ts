import { useState, useCallback } from "react";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

export function useFileUpload(_bucket: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (_file: File, _pathPrefix: string): Promise<UploadResult | null> => {
      setIsUploading(true);
      setProgress(0);
      setError("File upload via cloud storage is not available in this environment.");
      setIsUploading(false);
      return null;
    },
    [],
  );

  const remove = useCallback(
    async (_path: string): Promise<boolean> => {
      return false;
    },
    [],
  );

  return { upload, remove, isUploading, progress, error };
}
