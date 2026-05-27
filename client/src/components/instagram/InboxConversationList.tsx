import { AlertCircle, Bot, Circle, UserRound } from "lucide-react";

export default function InboxConversationList({
  conversations,
  selectedId,
  onSelect,
}: {
  conversations: any[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Inbox</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--ink)]">Conversations</h2>
      </div>
      <div className="max-h-[720px] overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-5 text-sm text-[var(--slate)]">No Instagram DMs have arrived yet.</div>
        ) : null}
        {conversations.map((conversation) => {
          const latest = [...(conversation.instagram_messages || [])].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0];
          return (
            <button
              type="button"
              key={conversation.id}
              onClick={() => onSelect(conversation.id)}
              className={`block w-full border-b border-black/5 p-4 text-left transition ${
                selectedId === conversation.id ? "bg-[var(--canvas)]" : "hover:bg-black/[0.03]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-white">
                    <UserRound className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">
                      {conversation.instagram_username || conversation.instagram_user_id}
                    </p>
                    <p className="truncate text-xs text-[var(--slate)]">{conversation.instagram_bots?.bot_name || "InstaPilot"}</p>
                  </div>
                </div>
                {conversation.status === "human_needed" ? (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                ) : conversation.bot_paused ? (
                  <Circle className="h-4 w-4 text-slate-400" />
                ) : (
                  <Bot className="h-4 w-4 text-emerald-600" />
                )}
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-[var(--slate)]">{latest?.message_text || "No messages yet"}</p>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
