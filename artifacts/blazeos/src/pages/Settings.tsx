import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Eye, EyeOff, Copy, Trash2, Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle, Bot } from "lucide-react";
import { useSettings, useUpdateSettings, type SettingsPatch } from "@/hooks/useSettings";
import { testFinnhubConnection, FINNHUB_SYMBOLS } from "@/lib/finnhubService";
import { useToast } from "@/hooks/use-toast";

type ConnectionStatus = "not_configured" | "idle" | "testing" | "connected" | "invalid";

type AIProviderKey = "openaiApiKey" | "claudeApiKey" | "perplexityApiKey";
interface AIProviderConfig {
  key: AIProviderKey;
  label: string;
  shortLabel: string;
  placeholder: string;
  docsUrl: string;
}

const AI_PROVIDERS: AIProviderConfig[] = [
  { key: "openaiApiKey", label: "OpenAI", shortLabel: "OAI", placeholder: "sk-...", docsUrl: "https://platform.openai.com/api-keys" },
  { key: "claudeApiKey", label: "Anthropic Claude", shortLabel: "ANT", placeholder: "sk-ant-...", docsUrl: "https://console.anthropic.com/settings/keys" },
  { key: "perplexityApiKey", label: "Perplexity", shortLabel: "PPX", placeholder: "pplx-...", docsUrl: "https://www.perplexity.ai/settings/api" },
];

function maskKey(key: string | null | undefined): string | null {
  if (!key) return null;
  return `${"•".repeat(Math.max(0, key.length - 4))}${key.slice(-4)}`;
}

function AIProviderCard({ config }: { config: AIProviderConfig }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [showKey, setShowKey] = useState(false);

  const savedKey = settings?.[config.key] ?? null;
  const masked = maskKey(savedKey);

  const handleSave = async () => {
    const val = input.trim() || null;
    try {
      await updateSettings.mutateAsync({ [config.key]: val } as SettingsPatch);
      setInput("");
      toast({ title: val ? `${config.label} key saved` : `${config.label} key cleared` });
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    }
  };

  const handleClear = async () => {
    await updateSettings.mutateAsync({ [config.key]: null } as SettingsPatch);
    setInput("");
    toast({ title: `${config.label} key removed` });
  };

  const handleCopy = () => {
    if (savedKey) {
      navigator.clipboard.writeText(savedKey);
      toast({ title: "Copied to clipboard" });
    }
  };

  return (
    <div className="p-4 rounded-lg bg-background border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs font-mono">
            {config.shortLabel}
          </div>
          <div>
            <p className="text-sm font-medium">{config.label}</p>
            <a href={config.docsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              Get API key →
            </a>
          </div>
        </div>
        {savedKey ? (
          <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1.5">
            <CheckCircle2 className="h-3 w-3" /> Configured
          </Badge>
        ) : (
          <Badge className="bg-white/5 text-white/30 border-white/10 gap-1.5">
            <WifiOff className="h-3 w-3" /> Not Set
          </Badge>
        )}
      </div>

      {savedKey && (
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-sm text-white/50 bg-card border border-border rounded-md px-3 py-1.5 tracking-widest truncate">
            {masked}
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-white/70 shrink-0" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/30 hover:text-destructive shrink-0" onClick={handleClear}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            placeholder={savedKey ? "Enter new key to replace…" : config.placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="pr-10 font-mono text-sm bg-card border-border"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowKey((v) => !v)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending || !input.trim()} className="shrink-0">
          {updateSettings.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>("not_configured");
  const [statusMessage, setStatusMessage] = useState("");

  const savedKey = settings?.finnhubApiKey ?? null;
  const effectiveStatus: ConnectionStatus =
    status !== "not_configured" ? status : savedKey ? "idle" : "not_configured";

  const handleTest = async () => {
    const keyToTest = keyInput.trim() || savedKey || "";
    if (!keyToTest) { toast({ title: "No API key", variant: "destructive" }); return; }
    setStatus("testing"); setStatusMessage("Testing connection...");
    const result = await testFinnhubConnection(keyToTest);
    setStatus(result.ok ? "connected" : "invalid");
    setStatusMessage(result.message);
  };

  const handleSave = async () => {
    const keyToSave = keyInput.trim() || null;
    try {
      await updateSettings.mutateAsync({ finnhubApiKey: keyToSave });
      setKeyInput(""); setStatus(keyToSave ? "idle" : "not_configured"); setStatusMessage("");
      toast({ title: keyToSave ? "API key saved" : "API key cleared" });
    } catch { toast({ title: "Save failed", variant: "destructive" }); }
  };

  const handleClear = async () => {
    setKeyInput("");
    await updateSettings.mutateAsync({ finnhubApiKey: null });
    setStatus("not_configured"); setStatusMessage("");
    toast({ title: "API key removed" });
  };

  const maskedKey = maskKey(savedKey);

  const statusBadge = () => {
    switch (effectiveStatus) {
      case "connected": return <Badge className="bg-green-500/15 text-green-400 border-green-500/30 gap-1.5"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
      case "invalid": return <Badge className="bg-red-500/15 text-red-400 border-red-500/30 gap-1.5"><AlertCircle className="h-3 w-3" /> Invalid API Key</Badge>;
      case "testing": return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Testing...</Badge>;
      case "idle": return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 gap-1.5"><Wifi className="h-3 w-3" /> Key Saved</Badge>;
      default: return <Badge className="bg-white/5 text-white/30 border-white/10 gap-1.5"><WifiOff className="h-3 w-3" /> Not Configured</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <SettingsIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure integrations and system preferences.</p>
        </div>
      </div>

      {/* AI Providers */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> AI Providers
          </CardTitle>
          <CardDescription>
            Add API keys for the AI Command Center. Keys are stored securely in your database — never in the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {AI_PROVIDERS.map((config) => (
            <AIProviderCard key={config.key} config={config} />
          ))}
        </CardContent>
      </Card>

      {/* Market Data */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">Market Data</CardTitle>
          <CardDescription>
            Connect a Finnhub API key to replace simulated prices with live market data for XAUUSD, NAS100, and BTCUSD.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">F</div>
              <div>
                <p className="text-sm font-medium">Finnhub</p>
                <a href="https://finnhub.io/register" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Get a free API key →</a>
              </div>
            </div>
            {statusBadge()}
          </div>

          {savedKey && !isLoading && (
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-sm text-white/50 bg-background border border-border rounded-md px-3 py-2 tracking-widest">{maskedKey}</div>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/30 hover:text-white/70" onClick={() => { if (savedKey) { navigator.clipboard.writeText(savedKey); toast({ title: "Copied" }); } }}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-white/30 hover:text-destructive" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">{savedKey ? "Replace API Key" : "Finnhub API Key"}</label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder={savedKey ? "Enter new key to replace…" : "pk_xxxxxxxxxxxxxxxxxxxx"}
                value={keyInput}
                onChange={(e) => { setKeyInput(e.target.value); if (status === "connected" || status === "invalid") setStatus("not_configured"); }}
                className="pr-10 font-mono text-sm bg-background border-border"
              />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowKey((v) => !v)}>
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {statusMessage && (
            <p className={`text-xs ${status === "connected" ? "text-green-400" : status === "invalid" ? "text-red-400" : "text-muted-foreground"}`}>{statusMessage}</p>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={status === "testing" || (!keyInput.trim() && !savedKey)} className="gap-2">
              {status === "testing" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Testing...</> : <><Wifi className="h-3.5 w-3.5" /> Test Connection</>}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending || !keyInput.trim()} className="gap-2">
              {updateSettings.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : "Save Key"}
            </Button>
          </div>

          <div className="pt-2 border-t border-border space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Symbol mapping</p>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono text-white/40">
              {Object.entries(FINNHUB_SYMBOLS).map(([asset, sym]) => (
                <div key={asset} className="bg-background rounded px-2 py-1.5 border border-border">
                  <div className="text-white/60 font-semibold">{asset}</div>
                  <div className="text-white/30 text-[10px] truncate">{sym}</div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground/60">Note: Forex symbols require a Finnhub plan with Forex data access. BTC is available on the free tier.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
