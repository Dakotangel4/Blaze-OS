import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, User, Sparkles, Zap, FileText, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Message = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

const TOOLS = [
  { id: "analyzer", name: "Trade Analyzer", icon: TrendingUp },
  { id: "bias", name: "Daily Bias Generator", icon: Zap },
  { id: "journal", name: "Journal Summary", icon: FileText },
  { id: "proposal", name: "Client Proposal", icon: Sparkles },
];

const MOCK_RESPONSES: Record<string, string> = {
  analyzer: "ANALYZING TRADE XAUUSD...\n\nPattern: Institutional Breakout\nRisk/Reward: 1:3\nConfluence factors:\n- Price above Asian session high\n- Order block hit on 15m timeframe\n- DXY showing weakness\n\nVerdict: High probability setup. Ensure stop loss is tucked tightly under the 15m order block at 2014.50.",
  bias: "GENERATING DAILY BIAS FOR NAS100...\n\nMacro context: CPI data released lower than expected, driving yield down. Tech sector showing pre-market strength.\n\nTechnicals:\n- Daily trend: Bullish\n- 4H Structure: Broke resistance at 17850\n- Liquidity pools resting above 18000\n\nBIAS: BULLISH. Look for NY open manipulation down into the 1H fair value gap (17880-17900) before buying the reversal.",
  journal: "JOURNAL SUMMARY - LAST 7 DAYS:\n\nTotal Trades: 12\nWin Rate: 66%\nNet PnL: +$1,450.00\n\nInsights:\nYour best performing setup was 'SMC' during the London session (4/4 wins). However, you took 3 impulsive trades outside your defined window leading to unnecessary drawdowns. \n\nRecommendation: Stick strictly to the London overlap. Stop trading post 11 AM NY.",
  proposal: "DRAFTING CLIENT PROPOSAL...\n\nSubject: Web Infrastructure Upgrade for Acme Corp\n\nValue Proposition: We will rebuild your frontend using a modern React stack, decreasing load times by 40% and improving conversion rates.\n\nTimeline: 4 weeks\nInvestment: $12,500\n\nKey Deliverables:\n1. Full UI/UX redesign\n2. Next.js / React implementation\n3. CMS integration\n4. Performance audit & optimization",
};

export default function AICenter() {
  const [selectedTool, setSelectedTool] = useState("analyzer");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "BlazeOS AI Command Center initialized. Select a tool and enter your query." }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsTyping(true);

    // Simulate API delay
    setTimeout(() => {
      setIsTyping(false);
      const responseText = MOCK_RESPONSES[selectedTool] || "I process data, not chit-chat. Give me a valid prompt related to the selected tool.";
      setMessages((prev) => [...prev, { role: "assistant", content: responseText }]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Command Center</h1>
          <p className="text-muted-foreground">Your institutional intelligence layer.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        <Card className="w-full md:w-64 bg-card shrink-0 flex flex-col">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-medium">Tools</CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  selectedTool === tool.id 
                    ? "bg-primary/20 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <tool.icon className="h-4 w-4" />
                {tool.name}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="flex-1 bg-black/40 border-border flex flex-col overflow-hidden relative shadow-inner">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay"></div>
          
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div 
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-card border border-border font-mono text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded bg-secondary flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm">
            <div className="relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Initialize sequence..."
                className="pr-12 bg-background border-border h-12 font-mono text-sm"
              />
              <Button 
                size="icon" 
                className="absolute right-1 top-1 h-10 w-10 bg-transparent hover:bg-primary/20 text-muted-foreground hover:text-primary"
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground font-mono flex items-center justify-between">
              <span>Model: BLAZE-V1-INSTITUTIONAL</span>
              <span>Status: {isTyping ? "COMPUTING" : "READY"}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
