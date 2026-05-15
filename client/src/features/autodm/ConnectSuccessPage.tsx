import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { useAutoDM } from "./AutoDMContext";

export default function ConnectSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeAccount, refreshAccountsFromSupabase } = useAutoDM();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const completed = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadError(null);
        const accounts = await refreshAccountsFromSupabase();
        if (!accounts.length) {
          setLoadError("Instagram connected, but no active account was found. Please reconnect.");
        }
      } catch (error) {
        console.error("[AutoDM] Connect success hydrate failed:", error);
        setLoadError("Failed to finish Instagram connection. Please retry.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshAccountsFromSupabase]);

  useEffect(() => {
    if (isLoading || loadError || completed.current) return;
    completed.current = true;
    const username = activeAccount?.username || searchParams.get("username") || "your account";
    toast.success(`@${username} connected`);
    const timer = setTimeout(() => {
      navigate("/dashboard/auto-dm/automations", { replace: true });
    }, 700);
    return () => clearTimeout(timer);
  }, [isLoading, loadError, activeAccount, navigate, searchParams]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Congratulations</h1>
        <p className="mb-8 text-muted-foreground">
          @{activeAccount?.username || searchParams.get("username") || "your account"} is successfully connected.
        </p>

        <Button
          onClick={() =>
            loadError
              ? navigate("/dashboard/auto-dm/connect", { replace: true })
              : navigate("/dashboard/auto-dm/automations")
          }
          className="h-12 w-full text-base font-medium"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : loadError ? (
            "Back to Connect"
          ) : (
            "Continue"
          )}
        </Button>

        {loadError ? (
          <p className="mt-4 text-sm text-red-600">{loadError}</p>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-lg border border-green-200 bg-white p-4 shadow-sm">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">Instagram account connected</span>
          </div>
        )}
      </div>
    </div>
  );
}
