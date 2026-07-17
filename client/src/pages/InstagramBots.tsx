import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { BookOpen, Bot, CheckCircle2, Inbox, Info, Link2, MessageCircle, Plus, ShieldCheck, Sparkles, TestTube2, Trash2, X, Zap } from "lucide-react";
import BotBuilderForm from "@/components/instagram/BotBuilderForm";
import KnowledgeBaseUploader from "@/components/instagram/KnowledgeBaseUploader";
import TestChat from "@/components/instagram/TestChat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useDialog } from "@/context/DialogContext";
import { useInstagramAccounts } from "@/hooks/useInstagramAccounts";
import { useInstagramBots } from "@/hooks/useInstagramBots";
import { deleteInstagramBot, fetchInstagramAnalytics } from "@/services/instagramApi";

export default function InstagramBots() {
  const { connectedAccounts } = useAuth();
  const { confirm } = useDialog();
  const hasPostingInstagram = Boolean(connectedAccounts.instagram?.connected);
  const { accounts, loading: accountsLoading, syncing, refresh: refreshAccounts, syncFromSocialPilot } = useInstagramAccounts({
    autoSync: hasPostingInstagram,
  });
  const { bots, loading, error, refresh: refreshBots } = useInstagramBots();
  const [selectedBotId, setSelectedBotId] = useState<string | undefined>();
  const [analytics, setAnalytics] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchInstagramAnalytics().then(setAnalytics).catch(() => null);
  }, []);

  useEffect(() => {
    if (!selectedBotId && bots[0]?.id) setSelectedBotId(bots[0].id);
  }, [bots, selectedBotId]);

  const selectedBot = useMemo(() => bots.find((bot) => bot.id === selectedBotId), [bots, selectedBotId]);
  const connectedAccount = accounts.find((account) => account.is_connected);
  const accountsBusy = accountsLoading || syncing;
  const activeBots = bots.filter((bot) => bot.is_active).length;
  const currentStep = !connectedAccount ? 0 : !selectedBot?.id ? 1 : 2;
  const hasBot = bots.length > 0;

  const removeBot = async (bot: any) => {
    const ok = await confirm(
      "Delete bot?",
      `Delete "${bot.bot_name}"? This removes its knowledge base and stops automation for this bot.`,
      {
        intent: "danger",
        confirmText: "Delete bot",
        cancelText: "Keep bot",
      },
    );
    if (!ok) return;
    try {
      await deleteInstagramBot(bot.id);
      toast.success("Bot deleted");
      if (selectedBotId === bot.id) setSelectedBotId(undefined);
      await refreshBots();
      fetchInstagramAnalytics().then(setAnalytics).catch(() => null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to delete bot");
    }
  };

  return (
    <div className="min-h-full bg-[#f7f5f2] px-4 py-5 lg:px-8">
      <div className="mx-auto max-w-[1320px] space-y-5">
        <header className="relative z-20 overflow-visible rounded-xl border border-black/10 bg-white shadow-sm">
          <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--arc)]">
                <Sparkles className="h-3.5 w-3.5" />
                Instagram AI Bot Builder
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[var(--ink)] sm:text-4xl">Build your Instagram DM bot</h1>
                <div className="group relative">
                  <button
                    type="button"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    aria-label="What does this bot do?"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  <div className="pointer-events-none absolute left-1/2 top-[calc(100%+10px)] z-50 hidden w-[340px] -translate-x-1/2 rounded-xl border border-blue-200 bg-white p-4 text-sm leading-6 text-blue-950 shadow-[0_18px_50px_rgba(15,23,42,0.18)] group-hover:block group-focus-within:block sm:left-full sm:top-1/2 sm:ml-3 sm:-translate-y-1/2 sm:translate-x-0">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-blue-950">
                      <Info className="h-4 w-4 text-blue-700" />
                      Yeh bot kya karta hai?
                    </div>
                    <p className="text-blue-900">
                      Instagram DMs me customer questions ka answer deta hai using your business knowledge. Agar answer clear na ho, payment/refund issue ho, ya user human mange, bot chat ko human reply ke liye mark karta hai.
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--slate)]">
                Follow the steps below. Connect once, add business answers, test replies, then activate when everything feels right. One workspace can have one InstaPilot bot, so edits happen inside the existing bot.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button variant="outline" asChild className="gap-2 bg-white">
                <Link to="/dashboard/instapilot/connect">
                  <Link2 className="h-4 w-4" />
                  Connect
                </Link>
              </Button>
              <Button variant="outline" type="button" onClick={() => setPreviewOpen(true)} className="gap-2 bg-white">
                <TestTube2 className="h-4 w-4" />
                Test preview
              </Button>
              <Button variant="outline" asChild className="gap-2 bg-white">
                <Link to="/dashboard/instapilot/inbox">
                  <Inbox className="h-4 w-4" />
                  Inbox
                </Link>
              </Button>
            </div>
          </div>
        </header>

        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-4">
            <StepCard
              number="1"
              title="Connect"
              text={connectedAccount ? `@${connectedAccount.instagram_username || "instagram"} connected` : "Connect Instagram once"}
              done={Boolean(connectedAccount)}
              active={currentStep === 0}
            />
            <StepCard
              number="2"
              title="Bot details"
              text={selectedBot?.id ? `${selectedBot.bot_name} saved` : "Name, language, tone"}
              done={Boolean(selectedBot?.id)}
              active={currentStep === 1}
            />
            <StepCard number="3" title="Knowledge" text="FAQs, pricing, policies" done={false} active={currentStep === 2} />
            <StepCard number="4" title="Test & activate" text="Preview before going live" done={activeBots > 0} active={false} />
          </div>
        </section>

        <section className="rounded-xl border border-emerald-200 bg-[#eefdf5] p-4 text-sm leading-6 text-emerald-950">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="max-w-5xl">
              Official Meta APIs only. InstaPilot uses Meta Login/OAuth, Graph API, Instagram Messaging API, and webhooks.
              It does not use password login, scraping, browser automation, private APIs, cold DM automation, or spam messaging.
            </p>
          </div>
        </section>

        {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}
        {!connectedAccount && hasPostingInstagram && accountsBusy ? (
          <SyncSkeleton />
        ) : !connectedAccount ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-amber-950">
                  {hasPostingInstagram ? "Instagram posting account found. InstaPilot will sync it automatically." : "Connect Instagram once to use both posting and InstaPilot."}
                </p>
                <p className="mt-1 text-amber-800">
                  {hasPostingInstagram
                    ? "If it does not appear in a few seconds, use Sync now. No separate Instagram login is needed."
                    : "Use the same official Meta connection used for autoposting. After connecting, this builder will pick it up automatically."}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {hasPostingInstagram ? (
                  <Button type="button" variant="outline" onClick={() => syncFromSocialPilot()} disabled={syncing}>
                    {syncing ? "Syncing..." : "Sync now"}
                  </Button>
                ) : null}
                <Button asChild>
                  <Link to="/dashboard/instapilot/connect">Connect Instagram</Link>
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--arc)]">
                    Workspace
                    <Info className="h-3.5 w-3.5 normal-case tracking-normal text-[var(--slate)]" title="Only one InstaPilot bot is allowed. Use Edit Existing Bot to update it." />
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--ink)]">Bots</h2>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={hasBot ? "Edit existing bot" : "Create bot"}
                  title={hasBot ? "Edit Existing Bot" : "Create bot"}
                  onClick={() => {
                    if (bots[0]?.id) {
                      setSelectedBotId(bots[0].id);
                      toast("Only one InstaPilot bot is allowed. Edit the existing bot.", { icon: "i" });
                      return;
                    }
                    setSelectedBotId(undefined);
                  }}
                >
                  {hasBot ? <Bot className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {loading ? <p className="text-sm text-[var(--slate)]">Loading bots...</p> : null}
                {bots.map((bot) => (
                  <div
                    role="button"
                    tabIndex={0}
                    key={bot.id}
                    onClick={() => setSelectedBotId(bot.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedBotId(bot.id);
                      }
                    }}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      selectedBotId === bot.id ? "border-orange-300 bg-orange-50 text-[var(--ink)] shadow-sm" : "border-black/10 bg-[#f8f6f3] text-[var(--ink)] hover:border-black/20 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{bot.bot_name}</div>
                        <div className="mt-1 truncate text-xs opacity-75">{bot.business_name || "Business not set"}</div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${
                          bot.is_active ? "bg-emerald-100 text-emerald-700" : "bg-black/5 text-[var(--slate)]"
                        }`}>
                          {bot.is_active ? "Live" : "Draft"}
                        </span>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeBot(bot);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-white text-red-600 opacity-80 transition hover:bg-red-50 hover:opacity-100"
                          aria-label={`Delete ${bot.bot_name}`}
                          title="Delete bot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      <span className="rounded bg-white px-2 py-1 text-[var(--slate)]">{bot.bot_goal}</span>
                      <span className="rounded bg-white px-2 py-1 text-[var(--slate)]">{bot.language}</span>
                    </div>
                  </div>
                ))}
                {!loading && bots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-black/20 bg-[#f8f6f3] p-5 text-sm leading-6 text-[var(--slate)]">
                    You can create one InstaPilot bot for this workspace. After saving, use the same bot card to edit settings, knowledge, and activation.
                  </div>
                ) : null}
              </div>
            </div>
            <QuickStats analytics={analytics} activeBots={activeBots} />
          </aside>

          <div className="space-y-5">
            <BotBuilderForm
              key={selectedBot?.id || "new"}
              accounts={accounts}
              accountsBusy={accountsBusy}
              selectedBot={selectedBot}
              onSaved={(savedBot) => {
                if (savedBot?.id) setSelectedBotId(savedBot.id);
                refreshAccounts();
                refreshBots();
              }}
            />
            <KnowledgeBaseUploader botId={selectedBot?.id} />
          </div>

        </div>
      </div>
      <PreviewDrawer open={previewOpen} onClose={() => setPreviewOpen(false)} botId={selectedBot?.id} />
    </div>
  );
}

function SyncSkeleton() {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <div className="h-4 w-72 max-w-full animate-pulse rounded bg-black/[0.08]" />
          <div className="h-3 w-[520px] max-w-full animate-pulse rounded bg-black/[0.06]" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 animate-pulse rounded-lg bg-black/[0.06]" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-black/[0.08]" />
        </div>
      </div>
    </section>
  );
}

function StepCard({ number, title, text, done, active }: { number: string; title: string; text: string; done: boolean; active: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${active ? "border-[var(--arc)] bg-[#fff7f2]" : done ? "border-emerald-200 bg-emerald-50" : "border-black/10 bg-[#f8f6f3]"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-emerald-600 text-white" : active ? "bg-[var(--arc)] text-white" : "bg-white text-[var(--slate)]"}`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : number}
        </span>
        <div className="min-w-0">
          <div className="font-semibold text-[var(--ink)]">{title}</div>
          <div className="truncate text-xs text-[var(--slate)]">{text}</div>
        </div>
      </div>
    </div>
  );
}

function PreviewDrawer({ open, onClose, botId }: { open: boolean; onClose: () => void; botId?: string }) {
  return (
    <div className={`fixed inset-0 z-[90] ${open ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className={`absolute inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute right-0 top-0 h-full w-full max-w-[430px] overflow-y-auto bg-[#f7f5f2] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/10 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--arc)]">Preview</p>
            <h2 className="text-lg font-semibold text-[var(--ink)]">Test bot replies</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[var(--slate)] transition hover:text-[var(--ink)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-3">
          <TestChat botId={botId} compact showHeader={false} />
        </div>
      </aside>
    </div>
  );
}

function QuickStats({ analytics, activeBots }: { analytics?: any; activeBots: number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--arc)]">Today at a glance</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniStat icon={<Bot className="h-4 w-4" />} label="Live bots" value={activeBots} />
        <MiniStat icon={<MessageCircle className="h-4 w-4" />} label="Chats" value={analytics?.totalConversations || 0} />
        <MiniStat icon={<BookOpen className="h-4 w-4" />} label="Handoffs" value={analytics?.humanHandoffs || 0} />
        <MiniStat icon={<Zap className="h-4 w-4" />} label="Leads" value={analytics?.leadsCaptured || 0} />
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#f8f6f3] p-3">
      <div className="flex items-center gap-2 text-[var(--slate)]">{icon}<span className="text-[11px] font-semibold">{label}</span></div>
      <div className="mt-2 text-xl font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}
