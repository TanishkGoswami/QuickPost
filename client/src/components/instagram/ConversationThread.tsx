import { useEffect, useState } from "react";
import { Bot, Pause, Play, Send, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  fetchConversationThread,
  sendManualInstagramReply,
  updateConversation,
} from "@/services/instagramApi";

export default function ConversationThread({ conversationId, onChanged }: { conversationId?: string; onChanged: () => void }) {
  const [thread, setThread] = useState<any>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      setThread(await fetchConversationThread(conversationId));
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [conversationId]);

  const send = async () => {
    if (!conversationId || !draft.trim()) return;
    try {
      await sendManualInstagramReply(conversationId, draft.trim());
      setDraft("");
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Reply failed");
    }
  };

  const togglePause = async () => {
    if (!conversationId || !thread?.conversation) return;
    await updateConversation(conversationId, {
      bot_paused: !thread.conversation.bot_paused,
      status: thread.conversation.bot_paused ? "bot_active" : "human_active",
    });
    await load();
    onChanged();
  };

  if (!conversationId) {
    return (
      <section className="flex min-h-[560px] items-center justify-center rounded-lg border border-black/10 bg-white p-8 text-sm text-[var(--slate)] shadow-sm">
        Select a conversation.
      </section>
    );
  }

  const conversation = thread?.conversation;

  return (
    <section className="rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Conversation</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">
            {conversation?.instagram_username || conversation?.instagram_user_id || "Instagram user"}
          </h2>
          <p className="mt-1 text-xs font-semibold text-[var(--slate)]">{conversation?.status || "Loading"}</p>
        </div>
        <Button type="button" variant="outline" onClick={togglePause} className="gap-2" disabled={!conversation}>
          {conversation?.bot_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {conversation?.bot_paused ? "Resume Bot" : "Pause Bot"}
        </Button>
      </div>

      <div className="h-[560px] overflow-y-auto bg-[var(--canvas)] p-5">
        {loading ? <p className="text-sm text-[var(--slate)]">Loading thread...</p> : null}
        <div className="space-y-3">
          {(thread?.messages || []).map((message: any) => (
            <div key={message.id} className={`flex gap-2 ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}>
              {message.direction === "inbound" ? <UserRound className="mt-2 h-4 w-4 text-[var(--slate)]" /> : null}
              <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-6 ${
                message.direction === "outbound" ? "bg-[var(--ink)] text-white" : "bg-white text-[var(--ink)]"
              }`}>
                {message.message_text}
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold opacity-70">
                  {message.ai_generated ? <Bot className="h-3 w-3" /> : null}
                  {new Date(message.created_at).toLocaleString()}
                </div>
              </div>
              {message.direction === "outbound" ? <Bot className="mt-2 h-4 w-4 text-[var(--slate)]" /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 border-t border-black/10 p-4">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") send();
          }}
          className="instapilot-input"
          placeholder="Reply manually through official Meta send API"
        />
        <Button type="button" onClick={send} size="icon" aria-label="Send reply">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
