import { Link } from "react-router-dom";
import { CheckCircle2, ExternalLink, Instagram, Link2, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  disconnectInstagramAccount,
  importSocialInstagramAccount,
} from "@/services/instagramApi";

export default function ConnectCard({ accounts, onChanged }: { accounts: any[]; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const connected = accounts.find((account) => account.is_connected);

  const startMetaOAuth = () => {
    const token = localStorage.getItem("quickpost_token");
    if (!token) {
      toast.error("Please log in again before connecting Instagram.");
      return;
    }
    window.location.href = `/api/auth/instagram?token=${encodeURIComponent(token)}`;
  };

  const importAccount = async () => {
    setBusy(true);
    try {
      await importSocialInstagramAccount();
      toast.success("Instagram account imported into InstaPilot");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!connected) return;
    setBusy(true);
    try {
      await disconnectInstagramAccount(connected.id);
      toast.success("InstaPilot disconnected");
      onChanged();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Disconnect failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#111111] text-white">
              <Instagram className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--arc)]">Instagram Connect Hub</p>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink)]">GAP InstaPilot</h2>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--slate)]">
            Connect a Facebook Page with a linked Instagram Professional account through Meta OAuth. InstaPilot only
            replies to user-initiated conversations through official Meta webhooks and send-message endpoints.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={startMetaOAuth} className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Connect Instagram
          </Button>
          <Button type="button" variant="outline" onClick={importAccount} disabled={busy} className="gap-2">
            <Link2 className="h-4 w-4" />
            Import Connected Account
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatusTile label="Connection" value={connected ? "Connected" : "Not connected"} good={Boolean(connected)} />
        <StatusTile label="Token status" value={connected?.token_status || "Missing"} good={connected?.token_status === "active"} />
        <StatusTile label="Webhook status" value={connected?.webhook_status || "Not configured"} good={connected?.webhook_status === "active"} />
        <StatusTile label="Messaging policy" value="User initiated only" good />
      </div>

      {connected ? (
        <div className="mt-5 rounded-lg border border-black/10 bg-[var(--canvas)] p-4">
          <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
            <MetaField label="Account" value={connected.instagram_username ? `@${connected.instagram_username}` : "Instagram account"} />
            <MetaField label="Page ID" value={connected.page_id} />
            <MetaField label="IG Business ID" value={connected.instagram_business_account_id} />
            <MetaField label="Expires" value={connected.token_expires_at ? new Date(connected.token_expires_at).toLocaleDateString() : "Unknown"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={startMetaOAuth} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reconnect
            </Button>
            <Button type="button" variant="outline" onClick={disconnect} disabled={busy} className="gap-2 text-red-700">
              <Trash2 className="h-4 w-4" />
              Disconnect
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/dashboard/instapilot/inbox">Open Inbox</Link>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatusTile({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg border border-black/10 bg-[var(--canvas)] p-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--slate)]">
        {good ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <ShieldCheck className="h-4 w-4 text-amber-600" />}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[var(--ink)]">{value}</div>
    </div>
  );
}

function MetaField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--slate)]">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-[var(--ink)]">{value || "Not available"}</div>
    </div>
  );
}
