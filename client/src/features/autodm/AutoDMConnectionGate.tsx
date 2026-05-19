import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAutoDM } from "./AutoDMContext";

export function AutoDMConnectionGate({ children, requireBusinessConnection = true }) {
  const { activeAccount, hasSocialInstagramConnection, syncingAccount, syncSocialInstagram } = useAutoDM();
  const navigate = useNavigate();

  if (activeAccount && (!requireBusinessConnection || activeAccount.page_id)) {
    return children;
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Instagram connection required</h2>
          <p className="mt-2 text-sm text-slate-700">
            Auto DM runs on your Instagram Business connection. Import your existing Social Pilot
            Instagram account or connect Instagram in the main Channels area first.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {hasSocialInstagramConnection ? (
            <Button onClick={syncSocialInstagram} disabled={syncingAccount}>
              {syncingAccount ? "Syncing..." : "Import From Social Pilot"}
            </Button>
          ) : (
            <Button onClick={() => navigate("/dashboard/auto-dm/connect")}>
              Connect Instagram
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link to="/dashboard">Back to Social Pilot</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
