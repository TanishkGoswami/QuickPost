import { CheckCircle, Instagram, Loader2, LogOut, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { startAutoDMInstagramOAuth } from "@/services/autodm/supabaseClient";
import { useAutoDM } from "./AutoDMContext";

export default function ConnectInstagramPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { accounts, activeAccount } = useAutoDM();
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    if (error) {
      setIsLoading(false);
      toast.error(decodeURIComponent(error));
    }
  }, [location.search]);

  const handleConnect = async () => {
    if (accounts.length > 0) {
      toast.error("Instagram already connected. Disconnect first to connect a different account.");
      return;
    }

    setIsLoading(true);
    try {
      const redirectUrl = await startAutoDMInstagramOAuth(
        `${window.location.origin}/dashboard/auto-dm`
      );
      window.location.assign(redirectUrl);
    } catch (error) {
      console.error("[AutoDM] Connect error:", error);
      toast.error(error.message || "Failed to start Instagram login");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">GAP Social Pilot / Auto DM</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Connect Instagram Account</h1>
          <p className="mt-1 text-muted-foreground">Use the original AutoDM account-connect flow inside Social Pilot.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center gap-3 font-semibold text-primary">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-blue-600">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <span>We're a Meta-verified business</span>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              This uses AutoDM’s own Meta OAuth flow and account storage, not Social Pilot’s posting connection.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Official Meta OAuth login</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Safe and secure</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-green-500" />
                <span>Business and creator accounts supported</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {accounts.length > 0 ? (
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900">Instagram already connected</p>
                  <p className="text-sm text-muted-foreground">
                    Connected as @{activeAccount?.username || accounts[0]?.username}
                  </p>
                </div>
                <Button onClick={() => navigate("/dashboard/auto-dm/automations")}>Go to Auto DM</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Button onClick={handleConnect} disabled={isLoading} className="h-14 w-full text-lg font-semibold">
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Instagram className="mr-2 h-5 w-5" />
              )}
              Connect Instagram Account
            </Button>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="mb-1 text-sm font-medium text-blue-900">
                Supports Business & Creator Accounts
              </p>
              <p className="text-xs text-blue-700">
                Log in with Meta to connect the professional Instagram account you want AutoDM to manage.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard/auto-dm/automations")}>
            Back to Auto DM
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
