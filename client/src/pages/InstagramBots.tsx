import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Link2, Plus, ShieldCheck } from "lucide-react";
import BotBuilderForm from "@/components/instagram/BotBuilderForm";
import BotSettingsPanel from "@/components/instagram/BotSettingsPanel";
import KnowledgeBaseUploader from "@/components/instagram/KnowledgeBaseUploader";
import TestChat from "@/components/instagram/TestChat";
import { Button } from "@/components/ui/button";
import { useInstagramAccounts } from "@/hooks/useInstagramAccounts";
import { useInstagramBots } from "@/hooks/useInstagramBots";
import { fetchInstagramAnalytics } from "@/services/instagramApi";

export default function InstagramBots() {
  const { accounts, refresh: refreshAccounts } = useInstagramAccounts();
  const { bots, loading, error, refresh: refreshBots } = useInstagramBots();
  const [selectedBotId, setSelectedBotId] = useState<string | undefined>();
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchInstagramAnalytics().then(setAnalytics).catch(() => null);
  }, []);

  useEffect(() => {
    if (!selectedBotId && bots[0]?.id) setSelectedBotId(bots[0].id);
  }, [bots, selectedBotId]);

  const selectedBot = useMemo(() => bots.find((bot) => bot.id === selectedBotId), [bots, selectedBotId]);

  return (
    <div className="min-h-full bg-[var(--canvas)] px-4 py-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--arc)]">Instagram AI Bot Builder</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]">GAP InstaPilot</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--slate)]">
              Build an AI assistant that answers Instagram DMs from your knowledge base, captures leads, and hands off
              to humans when confidence, policy, or customer intent requires it.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild className="gap-2">
              <Link to="/dashboard/instapilot/connect">
                <Link2 className="h-4 w-4" />
                Connect
              </Link>
            </Button>
            <Button variant="outline" asChild className="gap-2">
              <Link to="/dashboard/instapilot/inbox">
                <Inbox className="h-4 w-4" />
                Inbox
              </Link>
            </Button>
          </div>
        </header>

        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0" />
            <p>
              Official Meta APIs only: Meta Login/OAuth, Graph API, Instagram Messaging API, and webhooks. No password
              login, scraping, browser automation, private APIs, cold DM automation, or spam messaging.
            </p>
          </div>
        </section>

        {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

        <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-3">
            <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--arc)]">Bots</p>
                <Button type="button" variant="outline" size="icon" aria-label="Create bot" onClick={() => setSelectedBotId(undefined)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 space-y-2">
                {loading ? <p className="text-sm text-[var(--slate)]">Loading bots...</p> : null}
                {bots.map((bot) => (
                  <button
                    type="button"
                    key={bot.id}
                    onClick={() => setSelectedBotId(bot.id)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedBotId === bot.id ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-black/10 bg-[var(--canvas)] text-[var(--ink)]"
                    }`}
                  >
                    <div className="font-semibold">{bot.bot_name}</div>
                    <div className="mt-1 text-xs opacity-75">{bot.business_name} / {bot.bot_goal}</div>
                    <div className="mt-2 text-xs font-semibold">{bot.is_active ? "Active" : "Inactive"}</div>
                  </button>
                ))}
                {!loading && bots.length === 0 ? <p className="text-sm text-[var(--slate)]">Create your first Instagram AI bot.</p> : null}
              </div>
            </div>
            <BotSettingsPanel analytics={analytics} />
          </aside>

          <div className="space-y-5">
            <BotBuilderForm
              key={selectedBot?.id || "new"}
              accounts={accounts}
              selectedBot={selectedBot}
              onSaved={() => {
                refreshAccounts();
                refreshBots();
              }}
            />
            <div className="grid gap-5 xl:grid-cols-2">
              <KnowledgeBaseUploader botId={selectedBot?.id} />
              <TestChat botId={selectedBot?.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
