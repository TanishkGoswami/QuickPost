import React, { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  Info,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAutoDM } from "../../context/AutoDMContext";
import ConnectedPlatformsPanel from "../../components/platforms/ConnectedPlatformsPanel";

const PLAN_LIMITS = {
  free: { automations: 2, dms: 50, accounts: 1, analytics: false, crm: false },
  "social pilot": { automations: 50, dms: 1000, accounts: 5, analytics: true, crm: true },
  pro: { automations: 50, dms: 1000, accounts: 5, analytics: true, crm: true },
  "gap ultimate ecosystem": { automations: "Unlimited", dms: "Unlimited", accounts: "Unlimited", analytics: true, crm: true },
  enterprise: { automations: "Unlimited", dms: "Unlimited", accounts: "Unlimited", analytics: true, crm: true },
};

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-black/10 bg-white text-[var(--ink)] shadow-sm"
          : "border-transparent bg-transparent text-[var(--slate)] hover:bg-white/70 hover:text-[var(--ink)]"
      }`}
    >
      {label}
    </button>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#f7f5f2] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--slate)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--ink)]">{value || "Not available"}</p>
    </div>
  );
}

export default function AutoDMSettingsPage() {
  const { user } = useAuth();
  const autoDM = useAutoDM();
  const [activeTab, setActiveTab] = useState("platforms");

  const planKey = (user?.plan || "free").toLowerCase();
  const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.free;

  return (
    <div className="space-y-6">
      <header className="rounded-[24px] border border-black/10 bg-[var(--canvas-lifted)] p-6 shadow-sm">
        <p className="eyebrow">GAP AutoDM</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-[var(--ink)]">Settings</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--slate)]">
              Account, connected platforms and billing access in one place. Instagram connection is shared with Social Pilot and InstaPilot.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-black/10 bg-[#f7f5f2] p-1">
            <Tab label="Connected Platforms" active={activeTab === "platforms"} onClick={() => setActiveTab("platforms")} />
            <Tab label="Account" active={activeTab === "account"} onClick={() => setActiveTab("account")} />
            <Tab label="Billing" active={activeTab === "billing"} onClick={() => setActiveTab("billing")} />
          </div>
        </div>
      </header>

      {activeTab === "platforms" ? (
        <ConnectedPlatformsPanel autoDMState={autoDM} showBillingSummary />
      ) : null}

      {activeTab === "account" ? (
        <section className="rounded-[22px] border border-black/10 bg-[var(--canvas-lifted)] p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-white">
              {user?.picture ? (
                <img src={user.picture} alt="" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-7 w-7 text-[var(--slate)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="eyebrow">Account</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {user?.name || "My Account"}
              </h2>
              <p className="mt-1 text-sm text-[var(--slate)]">{user?.email}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Active workspace
            </span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Field label="Plan" value={user?.plan || "Free"} />
            <Field label="Subscription" value={user?.subscription_status || "Active"} />
            <Field label="Workspace sync" value="Social Pilot linked" />
          </div>
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <Info className="h-4 w-4 text-blue-700" />
              Simple rule
            </div>
            Connect Instagram once in Connected Platforms. Auto Posting, AutoDM and InstaPilot will use the same official connection.
          </div>
        </section>
      ) : null}

      {activeTab === "billing" ? (
        <section className="rounded-[22px] border border-black/10 bg-[var(--canvas-lifted)] shadow-sm">
          <div className="flex flex-col gap-4 border-b border-black/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Billing Sync</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--ink)]">
                {user?.plan || "Free"} plan access
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--slate)]">
                These limits are reflected across AutoDM features and platform access.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-xs font-bold text-[var(--ink)]">
              <CreditCard className="h-4 w-4 text-[var(--arc)]" />
              {user?.subscription_status || "active"}
            </span>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <Field label="Automations" value={String(limits.automations)} />
            <Field label="DMs per day" value={String(limits.dms)} />
            <Field label="IG accounts" value={String(limits.accounts)} />
            <Field label="Analytics" value={limits.analytics ? "Included" : "Upgrade required"} />
            <Field label="CRM / leads" value={limits.crm ? "Included" : "Upgrade required"} />
          </div>
          <div className="mx-5 mb-5 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Billing state is read from your GetAiPilot/Social Pilot subscription, so users see one source of truth.
          </div>
        </section>
      ) : null}
    </div>
  );
}
