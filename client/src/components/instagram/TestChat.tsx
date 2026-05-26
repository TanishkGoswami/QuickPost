import { useState } from "react";
import { Bot, Send, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { testInstagramBotReply } from "@/services/instagramApi";

export default function TestChat({ botId }: { botId?: string }) {
  const [messages, setMessages] = useState<any[]>([
    { role: "bot", text: "Test your Instagram DM bot before activating it." },
  ]);
  const [draft, setDraft] = useState("What are your prices?");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!botId) {
      toast.error("Save a bot before testing.");
      return;
    }
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", text }]);
    setSending(true);
    try {
      const reply = await testInstagramBotReply(botId, text);
      setMessages((current) => [
        ...current,
        { role: "bot", text: reply.text, confidence: reply.confidence, handoff: reply.handoff },
      ]);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Test failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Preview Chat</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Instagram DM simulator</h2>
      </div>
      <div className="mt-5 h-[380px] overflow-y-auto rounded-lg border border-black/10 bg-[var(--canvas)] p-4">
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div key={index} className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "bot" ? <Bot className="mt-2 h-4 w-4 shrink-0 text-[var(--slate)]" /> : null}
              <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--ink)]"}`}>
                {message.text}
                {typeof message.confidence === "number" ? (
                  <div className="mt-2 text-[11px] font-semibold opacity-70">
                    Confidence {Math.round(message.confidence * 100)}% {message.handoff ? "handoff recommended" : ""}
                  </div>
                ) : null}
              </div>
              {message.role === "user" ? <UserRound className="mt-2 h-4 w-4 shrink-0 text-[var(--slate)]" /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          className="instapilot-input"
          placeholder="Ask a customer question"
        />
        <Button type="button" onClick={send} disabled={sending || !botId} size="icon" aria-label="Send test message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
