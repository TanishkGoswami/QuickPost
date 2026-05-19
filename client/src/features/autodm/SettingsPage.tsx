import { Instagram, Loader2, Unlink } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { PLAN_LIMITS } from "./types";
import { useAutoDM } from "./AutoDMContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const {
    socialUser,
    accounts,
    socialConnectedAccounts,
    hasSocialInstagramConnection,
    syncingAccount,
    syncSocialInstagram,
    disconnectAccount,
  } = useAutoDM();
  const [disconnectId, setDisconnectId] = useState(null);

  const planKey = useMemo(() => {
    const raw = String(socialUser?.plan || "Free").toLowerCase();
    if (raw.includes("ultimate") || raw.includes("enterprise")) return "enterprise";
    if (raw.includes("social pilot") || raw.includes("pro")) return "pro";
    return "free";
  }, [socialUser?.plan]);

  const limits = PLAN_LIMITS[planKey];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-muted-foreground">Manage your Auto DM profile, connected Instagram accounts, and plan access.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
          <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">General</TabsTrigger>
          <TabsTrigger value="instagram" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Instagram</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Auto DM inherits your main Social Pilot account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={socialUser?.picture || ""} />
                  <AvatarFallback>{(socialUser?.name || socialUser?.email || "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-slate-900">{socialUser?.name || "User"}</p>
                  <p className="text-sm text-muted-foreground">{socialUser?.email}</p>
                </div>
              </div>
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                No duplicate login is needed. Auto DM uses your Social Pilot session and a short-lived bridge token behind the scenes.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Instagram Accounts</CardTitle>
              <CardDescription>Import or manage the Instagram accounts available to Auto DM.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-700">
                Social Pilot connection: {socialConnectedAccounts?.instagram?.connected ? "Connected" : "Not connected"}
              </div>

              {accounts.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <Instagram className="mx-auto mb-4 h-10 w-10 text-slate-400" />
                  <p className="font-medium text-slate-900">No Auto DM account imported yet</p>
                  <p className="mt-2 text-sm text-muted-foreground">Import your existing Social Pilot Instagram connection to start building automations.</p>
                  <div className="mt-4">
                    {hasSocialInstagramConnection ? (
                      <Button onClick={syncSocialInstagram} disabled={syncingAccount}>
                        {syncingAccount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Import From Social Pilot
                      </Button>
                    ) : (
                      <Button onClick={() => navigate("/dashboard/auto-dm/connect")}>
                        Connect Instagram For Auto DM
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={account.profile_picture_url || ""} />
                        <AvatarFallback>{account.username?.slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">@{account.username}</p>
                        <p className="text-sm text-muted-foreground">{account.full_name || "Instagram account"}</p>
                        <div className="mt-1 flex gap-2">
                          <Badge variant="outline">{account.account_type}</Badge>
                          {account.page_id ? <Badge variant="success">Business Ready</Badge> : <Badge variant="warning">Needs Business Link</Badge>}
                        </div>
                      </div>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setDisconnectId(account.id)}>
                      <Unlink className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Access</CardTitle>
              <CardDescription>Auto DM follows your Social Pilot subscription tier.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="mt-2 text-xl font-semibold capitalize">{planKey}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Automations</p>
                  <p className="mt-2 text-xl font-semibold">{limits.max_automations === -1 ? "Unlimited" : limits.max_automations}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">DMs / Day</p>
                  <p className="mt-2 text-xl font-semibold">{limits.max_dms_per_day === -1 ? "Unlimited" : limits.max_dms_per_day}</p>
                </div>
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-muted-foreground">Instagram Accounts</p>
                  <p className="mt-2 text-xl font-semibold">{limits.max_instagram_accounts === -1 ? "Unlimited" : limits.max_instagram_accounts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

        <Dialog open={Boolean(disconnectId)} onOpenChange={() => setDisconnectId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Instagram account</DialogTitle>
            <DialogDescription>This pauses automations tied to this imported Auto DM account.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisconnectId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                await disconnectAccount(disconnectId);
                toast.success("Instagram account disconnected");
                setDisconnectId(null);
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
