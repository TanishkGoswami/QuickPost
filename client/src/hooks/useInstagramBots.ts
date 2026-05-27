import { useCallback, useEffect, useState } from "react";
import { fetchInstagramBots } from "@/services/instagramApi";

export function useInstagramBots() {
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBots(await fetchInstagramBots());
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to load bots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { bots, loading, error, refresh };
}
