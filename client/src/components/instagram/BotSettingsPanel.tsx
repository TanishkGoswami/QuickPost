import { AlertCircle, AlertTriangle, BarChart3, Clock } from "lucide-react";

export default function BotSettingsPanel({ analytics }: { analytics?: any }) {
  const stats = [
    ["Conversations", analytics?.totalConversations || 0],
    ["Bot replies", analytics?.botReplies || 0],
    ["Handoffs", analytics?.humanHandoffs || 0],
    ["Leads", analytics?.leadsCaptured || 0],
    ["Unanswered", analytics?.unansweredQuestions || 0],
    ["Conversion", `${analytics?.conversionRate || 0}%`],
  ];

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--canvas)]">
          <BarChart3 className="h-5 w-5 text-[var(--ink)]" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Analytics & Limits</p>
          <h2 className="text-xl font-semibold text-[var(--ink)]">Last 30 days</h2>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-black/10 bg-[var(--canvas)] p-4">
            <div className="text-2xl font-semibold text-[var(--ink)]">{value}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--slate)]">{label}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" />
            Update message guardrails
          </div>
          Send updates only to eligible recent or opted-in conversations when Meta policy allows it. No cold DMs,
          scraping, password login, browser automation, or mass spam.
        </div>
        <div className="rounded-lg border border-black/10 bg-[var(--canvas)] p-4 text-sm leading-6 text-[var(--slate)]">
          <div className="mb-2 flex items-center gap-2 font-semibold text-[var(--ink)]">
            <Clock className="h-4 w-4" />
            Messaging window aware
          </div>
          Automated replies are designed around inbound webhooks and `RESPONSE` sends. Manual review is required for
          sensitive, low-confidence, complaint, legal, refund, or payment conversations.
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--slate)]">
        <AlertCircle className="h-4 w-4" />
        Update-message scheduling UI is intentionally policy-gated and should be enabled only after eligibility checks.
      </div>
    </section>
  );
}
