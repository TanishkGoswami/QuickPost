import { Download, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listLeadsByAutomation } from "@/services/autodm/leads";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";
import { formatDate } from "./utils";

export default function LeadsDataPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { socialUser, activeAccount } = useAutoDM();
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    if (!socialUser?.userId || !activeAccount?.id || !id) return;
    listLeadsByAutomation({ automationId: id, userId: socialUser.userId, instagramAccountId: activeAccount.id })
      .then(setLeads)
      .catch((error) => toast.error(error.message || "Failed to load leads"));
  }, [id, socialUser?.userId, activeAccount?.id]);

  const formKeys = useMemo(() => {
    const keys = new Set();
    leads.forEach((lead) => Object.keys(lead.form_data || {}).forEach((key) => keys.add(key)));
    return Array.from(keys);
  }, [leads]);

  return (
    <AutoDMConnectionGate>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Leads Data</h2>
            <p className="mt-1 text-sm text-muted-foreground">Captured form submissions and contact context for this automation.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/dashboard/auto-dm/automations")}>Back To Automations</Button>
            <Button
              onClick={() => {
                const headers = ["Captured At", "Username", ...formKeys];
                const rows = leads.map((lead) => [lead.created_at, lead.contacts?.username || "", ...formKeys.map((key) => lead.form_data?.[key] || "")]);
                const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `autodm-leads-${id}.csv`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {leads.length === 0 ? (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <p className="font-medium text-slate-900">No leads captured yet</p>
                <p className="mt-2 text-sm text-muted-foreground">Lead form responses will appear here when users complete them in Instagram.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50/70">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Captured</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</th>
                      {formKeys.map((key) => (
                        <th key={key} className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b">
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(lead.created_at)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">@{lead.contacts?.username || "unknown"}</td>
                        {formKeys.map((key) => (
                          <td key={key} className="px-6 py-4 text-sm text-slate-700">{lead.form_data?.[key] || "-"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AutoDMConnectionGate>
  );
}
