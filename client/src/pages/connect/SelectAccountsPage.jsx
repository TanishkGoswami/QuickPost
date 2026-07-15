import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import apiClient from "../../utils/apiClient";
import { useAuth } from "../../context/AuthContext";

export default function SelectAccountsPage() {
  const { connectedAccounts, user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const provider = params.get("provider") || "platform";
  const pending = params.get("pending");
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!pending) {
      setError("Missing selection token.");
      setLoading(false);
      return;
    }
    apiClient
      .get(`/api/auth/pending-selection/${pending}`)
      .then((res) => {
        const rows = res.data.accounts || [];
        setAccounts(rows);
        setSelected(new Set(rows.map((account) => String(account.id))));
      })
      .catch((err) => setError(err.response?.data?.error || err.message || "Selection expired."))
      .finally(() => setLoading(false));
  }, [pending]);

  const allSelected = useMemo(
    () => accounts.length > 0 && selected.size === accounts.length,
    [accounts.length, selected.size],
  );
  const connectedCount = useMemo(() => {
    const keys = Object.keys(connectedAccounts || {}).filter((key) => key.endsWith("Accounts"));
    const arrayCount = keys.reduce((sum, key) => sum + ((connectedAccounts?.[key] || []).length), 0);
    const singleCount = Object.entries(connectedAccounts || {})
      .filter(([key, value]) => !key.endsWith("Accounts") && key !== "instagram" && value?.connected)
      .length;
    return arrayCount + singleCount;
  }, [connectedAccounts]);
  const accountLimit = user?.entitlements?.limits?.social_accounts || Infinity;
  const exceedsLimit = connectedCount + selected.size > accountLimit;

  const toggle = (id) => {
    const next = new Set(selected);
    const key = String(id);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      await apiClient.post(`/api/auth/pending-selection/${pending}`, {
        selectedIds: [...selected],
      });
      navigate(`/dashboard?success=${provider}_connected`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to save accounts.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--canvas)] px-4 py-10 text-[var(--ink)]">
      <section className="mx-auto max-w-3xl">
        <p className="eyebrow">Connect accounts</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em]">
          Choose {provider} accounts
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--slate)]">
          Selected accounts will be available as separate publish targets.
        </p>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-[var(--slate)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading accounts...
          </div>
        ) : error ? (
          <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(accounts.map((a) => String(a.id))))}
                className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              {accounts.map((account) => {
                const checked = selected.has(String(account.id));
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => toggle(account.id)}
                    className={`flex items-center gap-3 rounded-lg border p-4 text-left transition ${
                      checked ? "border-black bg-white shadow-sm" : "border-black/10 bg-white/70"
                    }`}
                  >
                    {account.picture ? (
                      <img src={account.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-black/10" />
                    )}
                    <span className="min-w-0 flex-1 truncate font-semibold">{account.name || account.id}</span>
                    {checked ? <Check className="h-5 w-5" /> : null}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={saving || selected.size === 0 || exceedsLimit}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-black px-5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save selected accounts
            </button>
            {exceedsLimit ? (
              <p className="mt-3 text-sm text-red-700">
                Your plan allows {accountLimit} connected account{accountLimit === 1 ? "" : "s"}. Deselect accounts or upgrade.
              </p>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
