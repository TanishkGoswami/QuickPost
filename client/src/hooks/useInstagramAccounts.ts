import { useCallback, useEffect, useState } from "react";
import { fetchInstagramAccounts } from "@/services/instagramApi";

export function useInstagramAccounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await fetchInstagramAccounts());
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load Instagram accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { accounts, loading, error, refresh };
}
