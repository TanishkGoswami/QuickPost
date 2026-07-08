import { useCallback, useEffect, useState } from "react";
import { fetchInstagramAccounts, importSocialInstagramAccount } from "@/services/instagramApi";

let cachedAccounts: any[] | null = null;
let inFlightRefresh: Promise<any[]> | null = null;

export function useInstagramAccounts({ autoSync = false } = {}) {
  const [accounts, setAccounts] = useState<any[]>(() => cachedAccounts || []);
  const [loading, setLoading] = useState(!cachedAccounts);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    if (!cachedAccounts) setLoading(true);
    setError(null);
    try {
      if (!inFlightRefresh) {
        inFlightRefresh = fetchInstagramAccounts().finally(() => {
          inFlightRefresh = null;
        });
      }
      let nextAccounts = await inFlightRefresh;
      if (autoSync) {
        setSyncing(true);
        try {
          const imported = await importSocialInstagramAccount();
          if (imported) {
            nextAccounts = [imported, ...nextAccounts.filter((account) => account.id !== imported.id)];
          } else {
            nextAccounts = await fetchInstagramAccounts();
          }
        } catch (syncError: any) {
          const message = syncError.response?.data?.error || syncError.message || "";
          if (!message.toLowerCase().includes("connect an instagram")) {
            setError(message || "Instagram sync failed");
          }
        } finally {
          setSyncing(false);
        }
      }
      cachedAccounts = nextAccounts;
      setAccounts(nextAccounts);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load Instagram accounts");
    } finally {
      setLoading(false);
    }
  }, [autoSync]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const syncFromSocialPilot = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      await importSocialInstagramAccount();
      const nextAccounts = await fetchInstagramAccounts();
      cachedAccounts = nextAccounts;
      setAccounts(nextAccounts);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Instagram sync failed");
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { accounts, loading, syncing, error, refresh, syncFromSocialPilot };
}
