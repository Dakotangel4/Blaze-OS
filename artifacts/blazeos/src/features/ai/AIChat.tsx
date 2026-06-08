import { useState, useRef, useEffect } from "react";
import { Send, Loader2, RotateCcw, User, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { runAIChat, type AIProvider, type AIChatTool, type ChatMessage } from "./aiService";

interface Props {
  tool: AIChatTool;
  provider: AIProvider;
  placeholder?: string;
}

interface Message extends ChatMessage {
  id: string;
  isError?: boolean;
}

export default function AIChat({ tool, provider, placeholder = "Ask anything..." }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history: ChatMessage[] = messages
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await runAIChat({ tool, provider, message: text, history });
      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: res.reply };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const e = err as Error & { code?: string };
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: e.code === "NO_API_KEY"
          ? `No ${provider} API key configured. Go to **Settings → AI Providers** to add your key.`
          : (e.message ?? "Something went wrong. Please try again."),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  };

  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1 rounded text-xs font-mono">$1</code>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground font-mono text-xs">
              <Bot className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="opacity-60">Start a conversation</p>
              <p className="opacity-40 mt-1">Press Enter to send · Shift+Enter for new line</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                msg.role === "user"
                  ? "bg-primary/20 text-primary"
                  : msg.isError
                  ? "bg-red-500/20 text-red-400"
                  : "bg-white/5 text-muted-foreground"
              }`}>
                {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/10 border border-primary/20 text-foreground"
                  : msg.isError
                  ? "bg-red-500/10 border border-red-500/20 text-red-300"
                  : "bg-white/[0.04] border border-white/[0.08] text-foreground"
              }`}>
                <div
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 h-7 w-7 rounded-full bg-white/5 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-4 py-3">
                <div className="flex gap-1 items-center">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        <div className="flex gap-2 items-end">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              title="Clear conversation"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-white/[0.04] border-white/[0.1] text-sm font-mono placeholder:text-muted-foreground/50 focus-visible:ring-primary/30"
            disabled={loading}
            rows={1}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0 bg-primary hover:bg-primary/90"
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
