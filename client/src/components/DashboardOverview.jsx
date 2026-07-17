import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Layers,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/apiClient";
import ComposerModal from "./ComposerModal";

const ranges = [7, 30, 90];

const emptyOverview = {
  operations: {
    totalPosts: 0,
    sent: 0,
    scheduled: 0,
    failed: 0,
    processing: 0,
    successRate: null,
    queueCount: 0,
    totalPostsDelta: 0,
    nextScheduled: null,
    recentActivity: [],
  },
  publishingTrend: [],
  accounts: { totalConnected: 0, needsReconnect: [], accounts: [] },
  instagramGrowth: { accounts: [], summary: {} },
  automation: { instapilot: null, autodm: {} },
};

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Unavailable";
  return new Intl.NumberFormat(undefined, { notation: Math.abs(value) >= 10000 ? "compact" : "standard" }).format(value);
}

function formatDelta(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "Baseline collecting";
  if (value === 0) return "No change yet";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}`;
}

function formatDateTime(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortCaption(value) {
  const text = String(value || "Untitled post").trim();
  return text.length > 86 ? `${text.slice(0, 83)}...` : text;
}

function cleanInsightReason(value) {
  const text = String(value || "").trim();
  if (!text) return "Meta did not return this insight for the selected account.";
  if (text.length > 150 || text.toLowerCase().includes("must be one of the following values")) {
    return "Meta did not return this insight for the selected account.";
  }
  return text;
}

function channelLabel(channels = []) {
  if (!channels.length) return "No channel data";
  const base = [...new Set(channels.map((channel) => String(channel).split(":")[0]))];
  return base.slice(0, 3).join(", ") + (base.length > 3 ? ` +${base.length - 3}` : "");
}

function statusTone(status) {
  if (status === "failed") return "danger";
  if (["scheduled", "queued", "processing"].includes(status)) return "warning";
  if (["sent", "partially_sent"].includes(status)) return "success";
  return "neutral";
}

function getNextAction(data) {
  const ops = data.operations || emptyOverview.operations;
  if (data.accounts?.totalConnected === 0) {
    return {
      title: "Connect a publishing channel",
      detail: "Link Instagram or another platform before your next broadcast.",
      action: "Connect channels",
      href: "/connect",
      icon: Layers,
      tone: "warning",
    };
  }
  if (ops.failed > 0) {
    return {
      title: `${ops.failed} post${ops.failed === 1 ? "" : "s"} need attention`,
      detail: "Review failed broadcasts before adding more queue pressure.",
      action: "Open history",
      href: "/dashboard/history",
      icon: AlertTriangle,
      tone: "danger",
    };
  }
  if (ops.nextScheduled) {
    return {
      title: shortCaption(ops.nextScheduled.caption),
      detail: `Next scheduled for ${formatDateTime(ops.nextScheduled.scheduledFor)}`,
      action: "Open queue",
      href: "/dashboard/queue",
      icon: CalendarClock,
      tone: "success",
    };
  }
  return {
    title: "Your queue is clear",
    detail: "Create or schedule the next post when you are ready.",
    action: "New post",
    href: null,
    icon: Send,
    tone: "neutral",
  };
}

function MetricCard({ icon: Icon, label, value, detail, tone = "neutral" }) {
  return (
    <article className={`dash-card dash-metric is-${tone}`}>
      <div className="dash-card-head">
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}

function SkeletonDashboard() {
  return (
    <div className="dash-shell" aria-busy="true" aria-label="Loading dashboard">
      <div className="dash-loading-row">
        <div className="dash-skeleton title" />
        <div className="dash-skeleton controls" />
      </div>
      <div className="dash-grid">
        {Array.from({ length: 8 }).map((_, index) => (
          <div className={`dash-card dash-skeleton-card ${index === 0 ? "wide" : ""}`} key={index}>
            <div className="dash-skeleton line" />
            <div className="dash-skeleton number" />
            <div className="dash-skeleton line short" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState(30);
  const [instagramAccountId, setInstagramAccountId] = useState("all");
  const [composerOpen, setComposerOpen] = useState(false);
  const [data, setData] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiClient.get("/api/dashboard/overview", {
        params: { range, instagramAccountId },
      });
      setData({ ...emptyOverview, ...(response.data || {}) });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [range, instagramAccountId]);

  const firstName = user?.name?.split(" ")?.[0] || "there";
  const ops = data.operations || emptyOverview.operations;
  const growth = data.instagramGrowth || emptyOverview.instagramGrowth;
  const automation = data.automation || emptyOverview.automation;
  const nextAction = getNextAction(data);
  const NextActionIcon = nextAction.icon;
  const maxTrend = Math.max(1, ...((data.publishingTrend || []).map((day) => day.sent + day.scheduled + day.failed)));
  const selectedGrowthAccount = useMemo(() => {
    if (instagramAccountId === "all") return null;
    return (growth.accounts || []).find((account) => account.id === instagramAccountId) || null;
  }, [growth.accounts, instagramAccountId]);
  const topMedia = useMemo(() => {
    const media = selectedGrowthAccount?.topMedia || (growth.accounts || []).flatMap((account) => account.topMedia || []);
    return [...media].sort((a, b) => (b.engagement || 0) - (a.engagement || 0)).slice(0, 3);
  }, [growth.accounts, selectedGrowthAccount]);
  const growthSummary = selectedGrowthAccount || growth.summary || {};
  const issues = [
    ...(data.accounts?.needsReconnect || []).map((account) => ({
      title: `${account.provider} needs reconnect`,
      detail: account.username ? `@${account.username}` : "Token is expired or unavailable.",
      href: "/connect",
    })),
    ...((growth.accounts || [])
      .filter((account) => account.unavailableReason)
      .map((account) => ({
        title: account.username ? `@${account.username} insights unavailable` : "Instagram insights unavailable",
        detail: cleanInsightReason(account.unavailableReason),
        href: "/dashboard/auto-dm/instagram-profile",
      }))),
  ].slice(0, 5);

  if (loading && !data.generatedAt) {
    return (
      <>
        <DashboardStyles />
        <SkeletonDashboard />
      </>
    );
  }

  return (
    <div className="dash-shell">
      <DashboardStyles />

      <header className="dash-top">
        <div>
          <p className="dash-kicker">Workspace overview</p>
          <h1>Good to see you, {firstName}</h1>
          <span>Publishing, growth, queue health, and account risk in one place.</span>
        </div>
        <div className="dash-actions">
          <div className="dash-range" aria-label="Dashboard range">
            {ranges.map((option) => (
              <button
                type="button"
                key={option}
                className={range === option ? "active" : ""}
                onClick={() => setRange(option)}
              >
                {option}d
              </button>
            ))}
          </div>
          <button type="button" className="dash-btn secondary" onClick={() => navigate("/connect")}>
            <Layers size={16} />
            Channels
          </button>
          <button type="button" className="dash-btn primary" onClick={() => setComposerOpen(true)}>
            <Plus size={16} />
            New Post
          </button>
        </div>
      </header>

      {error ? (
        <section className="dash-error">
          <AlertTriangle size={18} />
          <div>
            <strong>Dashboard could not refresh</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="dash-btn secondary" onClick={fetchOverview}>
            <RefreshCw size={15} />
            Retry
          </button>
        </section>
      ) : null}

      <section className="dash-grid primary-grid">
        <article className={`dash-card dash-next is-${nextAction.tone}`}>
          <div className="dash-card-head">
            <span>Next action</span>
            <NextActionIcon size={18} />
          </div>
          <h2>{nextAction.title}</h2>
          <p>{nextAction.detail}</p>
          <button
            type="button"
            className="dash-link-btn"
            onClick={() => (nextAction.href ? navigate(nextAction.href) : setComposerOpen(true))}
          >
            {nextAction.action}
            <ArrowRight size={15} />
          </button>
        </article>

        <MetricCard
          icon={CheckCircle2}
          label="Publish success"
          value={ops.successRate === null ? "No baseline" : `${ops.successRate}%`}
          detail={`${formatNumber(ops.sent)} sent, ${formatNumber(ops.failed)} failed in ${range} days`}
          tone={ops.failed > 0 ? "danger" : "success"}
        />
        <MetricCard
          icon={Clock3}
          label="Queue health"
          value={formatNumber(ops.queueCount)}
          detail={`${formatNumber(ops.processing)} processing, ${formatNumber(ops.scheduled)} waiting`}
          tone={ops.queueCount > 0 ? "warning" : "neutral"}
        />
        <MetricCard
          icon={Users}
          label="Connected accounts"
          value={formatNumber(data.accounts?.totalConnected || 0)}
          detail={(data.accounts?.needsReconnect || []).length ? "Reconnect needed" : "All visible accounts healthy"}
          tone={(data.accounts?.needsReconnect || []).length ? "danger" : "neutral"}
        />
      </section>

      <section className="dash-grid growth-grid">
        <article className="dash-card dash-growth">
          <div className="dash-section-title">
            <div>
              <span>Instagram growth</span>
              <h2>Account momentum</h2>
            </div>
            <select
              value={instagramAccountId}
              onChange={(event) => setInstagramAccountId(event.target.value)}
              aria-label="Instagram account"
            >
              <option value="all">All Instagram accounts</option>
              {(growth.accounts || []).map((account) => (
                <option value={account.id} key={account.id}>
                  @{account.username || account.instagramBusinessId || "instagram"}
                </option>
              ))}
            </select>
          </div>

          <div className="dash-growth-stats">
            <MetricInline label="Followers" value={formatNumber(growthSummary.followers)} detail={formatDelta(growthSummary.followerDelta)} />
            <MetricInline label="Reach" value={formatNumber(growthSummary.reach)} detail={`Last ${range} days`} />
            <MetricInline label="Profile views" value={formatNumber(growthSummary.profileViews)} detail="From Meta insights" />
          </div>

          {growthSummary.unavailableReason ? (
            <div className="dash-note">
              <AlertTriangle size={15} />
              <span>{cleanInsightReason(growthSummary.unavailableReason)}</span>
            </div>
          ) : null}
        </article>

        <article className="dash-card dash-automation">
          <div className="dash-card-head">
            <span>Automation lift</span>
            <ShieldCheck size={17} />
          </div>
          <div className="dash-mini-grid">
            <MetricInline label="DMs sent" value={formatNumber(automation.autodm?.messagesSent || 0)} detail="AutoDM" />
            <MetricInline label="Leads" value={formatNumber(automation.instapilot?.leadsCaptured || 0)} detail="InstaPilot" />
            <MetricInline label="Followers gained" value={formatNumber(automation.autodm?.followersGained || 0)} detail="AutoDM tracked" />
          </div>
        </article>
      </section>

      <section className="dash-grid ops-grid">
        <article className="dash-card dash-trend">
          <div className="dash-section-title">
            <div>
              <span>Publishing cadence</span>
              <h2>{formatNumber(ops.totalPosts)} posts in {range} days</h2>
            </div>
            <p>{formatDelta(ops.totalPostsDelta)} vs previous period</p>
          </div>
          <div className="dash-chart" aria-label="Publishing trend">
            {(data.publishingTrend || []).map((day) => {
              const total = day.sent + day.scheduled + day.failed;
              return (
                <div className="dash-bar-wrap" key={day.date} title={`${day.date}: ${total} posts`}>
                  <span style={{ height: `${Math.max(8, (total / maxTrend) * 100)}%` }} className={day.failed ? "has-failed" : ""} />
                </div>
              );
            })}
          </div>
        </article>

        <article className="dash-card dash-feed">
          <div className="dash-section-title">
            <div>
              <span>Recent broadcasts</span>
              <h2>What shipped lately</h2>
            </div>
            <button type="button" className="dash-small-link" onClick={() => navigate("/dashboard/history")}>
              History
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="dash-list">
            {(ops.recentActivity || []).length ? (
              ops.recentActivity.map((post) => (
                <button type="button" className="dash-row" key={post.id} onClick={() => navigate("/dashboard/history")}>
                  <span className={`dash-status ${statusTone(post.status)}`} />
                  <div>
                    <strong>{shortCaption(post.caption)}</strong>
                    <p>{channelLabel(post.channels)} / {formatDateTime(post.postedAt || post.scheduledFor || post.createdAt)}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="dash-empty">
                <Send size={18} />
                <p>No broadcast history in this range.</p>
              </div>
            )}
          </div>
        </article>

        <article className="dash-card dash-issues">
          <div className="dash-section-title">
            <div>
              <span>Account risk</span>
              <h2>{issues.length ? `${issues.length} item${issues.length === 1 ? "" : "s"} to review` : "No visible blockers"}</h2>
            </div>
            <AlertTriangle size={17} />
          </div>
          <div className="dash-list compact">
            {issues.length ? (
              issues.map((issue, index) => (
                <button type="button" className="dash-row" key={`${issue.title}-${index}`} onClick={() => navigate(issue.href)}>
                  <span className="dash-status danger" />
                  <div>
                    <strong>{issue.title}</strong>
                    <p>{issue.detail}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="dash-empty">
                <ShieldCheck size={18} />
                <p>Connected accounts look ready from the data available.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="dash-grid media-grid">
        <article className="dash-card dash-top-content">
          <div className="dash-section-title">
            <div>
              <span>Top Instagram content</span>
              <h2>Best recent engagement</h2>
            </div>
            <BarChart3 size={17} />
          </div>
          <div className="dash-media-list">
            {topMedia.length ? (
              topMedia.map((item) => (
                <a className="dash-media-row" href={item.permalink || "#"} target="_blank" rel="noreferrer" key={item.id}>
                  <div className="dash-thumb">
                    {item.mediaUrl ? <img src={item.mediaUrl} alt={item.caption || "Instagram media"} /> : <TrendingUp size={18} />}
                  </div>
                  <div>
                    <strong>{shortCaption(item.caption)}</strong>
                    <p>{formatNumber(item.likes)} likes / {formatNumber(item.comments)} comments</p>
                  </div>
                </a>
              ))
            ) : (
              <div className="dash-empty">
                <BarChart3 size={18} />
                <p>Top content will appear when Meta returns media engagement.</p>
              </div>
            )}
          </div>
        </article>
      </section>

      <ComposerModal
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPostCreated={fetchOverview}
      />
    </div>
  );
}

function MetricInline({ label, value, detail }) {
  return (
    <div className="dash-inline-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function DashboardStyles() {
  return (
    <style>{`
      .dash-shell {
        min-height: 100%;
        padding: 28px;
        background: var(--canvas, #f5f1ec);
        color: var(--ink, #111111);
        font-family: var(--font-body, ui-sans-serif, system-ui);
      }

      .dash-top {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 20px;
        max-width: 1380px;
        margin: 0 auto 22px;
      }

      .dash-kicker,
      .dash-section-title span,
      .dash-card-head span {
        display: block;
        margin: 0 0 7px;
        color: var(--slate, #626260);
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0;
        text-transform: none;
      }

      .dash-top h1 {
        margin: 0;
        color: var(--ink, #111);
        font-size: 34px;
        font-weight: 600;
        line-height: 1.08;
        letter-spacing: -0.02em;
        text-wrap: balance;
      }

      .dash-top span,
      .dash-card p,
      .dash-section-title p,
      .dash-row p,
      .dash-inline-metric p {
        color: var(--slate, #626260);
      }

      .dash-top > div:first-child > span {
        display: block;
        margin-top: 8px;
        font-size: 14px;
      }

      .dash-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .dash-range {
        display: inline-flex;
        gap: 3px;
        padding: 4px;
        border: 1px solid var(--dust, #d3cec6);
        border-radius: 8px;
        background: #ebe7e1;
      }

      .dash-range button,
      .dash-btn,
      .dash-link-btn,
      .dash-small-link {
        min-height: 38px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
      }

      .dash-range button {
        min-width: 48px;
        border: 0;
        background: transparent;
        color: var(--slate, #626260);
      }

      .dash-range button.active {
        background: #fff;
        color: var(--ink, #111);
      }

      .dash-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px solid var(--dust, #d3cec6);
        padding: 0 14px;
        background: #fff;
        color: var(--ink, #111);
      }

      .dash-btn.primary {
        border-color: var(--ink, #111);
        background: var(--ink, #111);
        color: #fff;
      }

      .dash-btn:hover,
      .dash-range button:hover,
      .dash-link-btn:hover,
      .dash-small-link:hover {
        transform: translateY(-1px);
      }

      .dash-grid {
        max-width: 1380px;
        margin: 0 auto 16px;
        display: grid;
        gap: 12px;
      }

      .primary-grid {
        grid-template-columns: minmax(320px, 1.45fr) repeat(3, minmax(190px, 1fr));
      }

      .growth-grid {
        grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.8fr);
      }

      .ops-grid {
        grid-template-columns: minmax(360px, 1fr) minmax(340px, 1fr) minmax(300px, 0.85fr);
      }

      .media-grid {
        grid-template-columns: 1fr;
      }

      .dash-card,
      .dash-error {
        border: 1px solid var(--dust, #d3cec6);
        border-radius: 8px;
        background: #fff;
        box-shadow: none;
      }

      .dash-card {
        padding: 20px;
        min-width: 0;
      }

      .dash-card-head,
      .dash-section-title {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
      }

      .dash-card-head svg,
      .dash-section-title svg {
        color: var(--slate, #626260);
        flex-shrink: 0;
      }

      .dash-next h2,
      .dash-section-title h2 {
        margin: 0;
        color: var(--ink, #111);
        font-size: 20px;
        font-weight: 650;
        line-height: 1.18;
        letter-spacing: -0.01em;
      }

      .dash-next p {
        margin: 12px 0 18px;
        max-width: 58ch;
        font-size: 14px;
        line-height: 1.5;
      }

      .dash-link-btn,
      .dash-small-link {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        border: 0;
        background: transparent;
        color: var(--arc, #ff5600);
        padding: 0;
      }

      .dash-metric {
        min-height: 154px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .dash-metric strong {
        display: block;
        margin-top: 18px;
        color: var(--ink, #111);
        font-size: 38px;
        font-weight: 650;
        line-height: 1;
        letter-spacing: -0.02em;
      }

      .dash-metric p {
        margin: 8px 0 0;
        font-size: 13px;
        line-height: 1.4;
      }

      .dash-card.is-danger,
      .dash-metric.is-danger {
        border-color: #e4b2aa;
        background: #fff8f6;
      }

      .dash-card.is-warning,
      .dash-metric.is-warning {
        border-color: #e3c08d;
        background: #fffaf1;
      }

      .dash-card.is-success,
      .dash-metric.is-success {
        border-color: #bddac6;
        background: #f7fff9;
      }

      .dash-growth-stats,
      .dash-mini-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 18px;
      }

      .dash-inline-metric {
        min-width: 0;
        border: 1px solid rgba(20,20,19,0.08);
        border-radius: 8px;
        background: #faf8f5;
        padding: 14px;
      }

      .dash-inline-metric span {
        display: block;
        color: var(--slate, #626260);
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;
      }

      .dash-inline-metric strong {
        display: block;
        overflow-wrap: anywhere;
        color: var(--ink, #111);
        font-size: 22px;
        font-weight: 650;
        line-height: 1.1;
      }

      .dash-inline-metric p {
        margin: 7px 0 0;
        font-size: 12px;
        line-height: 1.35;
      }

      .dash-section-title select {
        min-height: 38px;
        max-width: 260px;
        border: 1px solid var(--dust, #d3cec6);
        border-radius: 8px;
        background: #fff;
        color: var(--ink, #111);
        padding: 0 10px;
        font-size: 13px;
        font-weight: 600;
      }

      .dash-note {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 14px;
        padding: 10px 12px;
        border: 1px solid #e3c08d;
        border-radius: 8px;
        background: #fffaf1;
        color: #6f4b13;
        font-size: 13px;
        line-height: 1.4;
      }

      .dash-chart {
        display: flex;
        align-items: flex-end;
        gap: 5px;
        height: 174px;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid rgba(20,20,19,0.08);
      }

      .dash-bar-wrap {
        flex: 1;
        min-width: 4px;
        height: 100%;
        display: flex;
        align-items: flex-end;
        border-radius: 6px;
        background: #f0ebe4;
        overflow: hidden;
      }

      .dash-bar-wrap span {
        width: 100%;
        display: block;
        border-radius: 6px 6px 0 0;
        background: var(--ink, #111);
      }

      .dash-bar-wrap span.has-failed {
        background: var(--arc, #ff5600);
      }

      .dash-list,
      .dash-media-list {
        display: grid;
        gap: 8px;
        margin-top: 16px;
      }

      .dash-list.compact {
        gap: 6px;
      }

      .dash-row,
      .dash-media-row {
        width: 100%;
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        border: 1px solid rgba(20,20,19,0.08);
        border-radius: 8px;
        background: #fff;
        color: var(--ink, #111);
        padding: 11px;
        text-align: left;
        text-decoration: none;
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .dash-row:hover,
      .dash-media-row:hover {
        border-color: #bdb6ad;
        background: #faf8f5;
      }

      .dash-row strong,
      .dash-media-row strong {
        display: block;
        overflow: hidden;
        color: var(--ink, #111);
        font-size: 13px;
        font-weight: 650;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dash-row p,
      .dash-media-row p {
        margin: 4px 0 0;
        overflow: hidden;
        font-size: 12px;
        line-height: 1.35;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .dash-status {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #9c9fa5;
      }

      .dash-status.success { background: #1b8f43; }
      .dash-status.warning { background: #c4871d; }
      .dash-status.danger { background: var(--arc, #ff5600); }

      .dash-thumb {
        width: 56px;
        height: 56px;
        border: 1px solid var(--dust, #d3cec6);
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ebe7e1;
        color: var(--slate, #626260);
      }

      .dash-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }

      .dash-empty {
        min-height: 94px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border: 1px dashed var(--dust, #d3cec6);
        border-radius: 8px;
        background: #faf8f5;
        color: var(--slate, #626260);
        text-align: center;
        padding: 16px;
      }

      .dash-empty p {
        margin: 0;
        font-size: 13px;
      }

      .dash-error {
        max-width: 1380px;
        margin: 0 auto 16px;
        padding: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        border-color: #e4b2aa;
        background: #fff8f6;
      }

      .dash-error strong {
        display: block;
        color: var(--ink, #111);
        font-size: 14px;
      }

      .dash-error p {
        margin: 3px 0 0;
        color: var(--slate, #626260);
        font-size: 13px;
      }

      .dash-loading-row {
        max-width: 1380px;
        margin: 0 auto 22px;
        display: flex;
        justify-content: space-between;
        gap: 16px;
      }

      .dash-skeleton,
      .dash-skeleton-card {
        background: linear-gradient(90deg, rgba(17,17,17,0.035) 25%, rgba(17,17,17,0.07) 37%, rgba(17,17,17,0.035) 63%);
        background-size: 400% 100%;
        animation: dash-shimmer 1.4s ease-in-out infinite;
      }

      .dash-skeleton.title { width: 360px; height: 66px; border-radius: 8px; }
      .dash-skeleton.controls { width: 320px; height: 44px; border-radius: 8px; }
      .dash-skeleton-card { min-height: 180px; }
      .dash-skeleton-card.wide { min-height: 240px; }
      .dash-skeleton.line { width: 72%; height: 14px; border-radius: 6px; margin-bottom: 26px; }
      .dash-skeleton.line.short { width: 48%; margin-top: 18px; margin-bottom: 0; }
      .dash-skeleton.number { width: 42%; height: 42px; border-radius: 8px; }

      @keyframes dash-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .dash-btn,
        .dash-range button,
        .dash-link-btn,
        .dash-small-link,
        .dash-row,
        .dash-media-row {
          transition: none;
        }

        .dash-skeleton,
        .dash-skeleton-card {
          animation: none;
        }
      }

      @media (max-width: 1180px) {
        .primary-grid,
        .growth-grid,
        .ops-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dash-next,
        .dash-growth,
        .dash-trend {
          grid-column: span 2;
        }
      }

      @media (max-width: 768px) {
        .dash-shell {
          padding: 18px 14px 34px;
        }

        .dash-top,
        .dash-loading-row {
          align-items: stretch;
          flex-direction: column;
        }

        .dash-actions,
        .dash-range,
        .dash-btn {
          width: 100%;
        }

        .dash-range button,
        .dash-btn {
          flex: 1;
        }

        .dash-top h1 {
          font-size: 28px;
        }

        .primary-grid,
        .growth-grid,
        .ops-grid,
        .media-grid {
          grid-template-columns: 1fr;
        }

        .dash-next,
        .dash-growth,
        .dash-trend {
          grid-column: span 1;
        }

        .dash-growth-stats,
        .dash-mini-grid {
          grid-template-columns: 1fr;
        }

        .dash-section-title {
          flex-direction: column;
          align-items: stretch;
        }

        .dash-section-title select {
          max-width: none;
          width: 100%;
        }

        .dash-error {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `}</style>
  );
}
