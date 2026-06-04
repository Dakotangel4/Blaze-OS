import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AppSettings {
  id: number;
  finnhubApiKey: string | null;
  openaiApiKey: string | null;
  claudeApiKey: string | null;
  perplexityApiKey: string | null;
  updatedAt: string;
}

export type SettingsPatch = Partial<Omit<AppSettings, "id" | "updatedAt">>;

const SETTINGS_KEY = ["settings"];

async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

async function saveSettings(data: SettingsPatch): Promise<AppSettings> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return res.json();
}

export function useSettings() {
  return useQuery<AppSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_KEY, data);
    },
  });
}

export function getSettingsQueryKey() {
  return SETTINGS_KEY;
}
