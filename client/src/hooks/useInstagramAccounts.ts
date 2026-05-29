import { useCallback, useEffect, useState } from "react";
import { fetchInstagramAccounts, importSocialInstagramAccount } from "@/services/instagramApi";

export function useInstagramAccounts({ autoSync = false } = {}) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let nextAccounts = await fetchInstagramAccounts();
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
      setAccounts(await fetchInstagramAccounts());
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Instagram sync failed");
      throw err;
    } finally {
      setSyncing(false);
    }
  }, []);

  return { accounts, loading, syncing, error, refresh, syncFromSocialPilot };
}
