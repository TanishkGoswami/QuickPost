import { BarChart3, Copy, Image as ImageIcon, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { createAutomation, deleteAutomation, listAutomations, updateAutomation } from "@/services/autodm/automations";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";
import { formatRelativeTime } from "./utils";

export default function AutomationsPage() {
  const navigate = useNavigate();
  const { socialUser, activeAccount } = useAutoDM();
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadData = async () => {
    if (!socialUser?.userId || !activeAccount?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setAutomations(await listAutomations({ instagramAccountId: activeAccount.id, userId: socialUser.userId }));
    } catch (error) {
      toast.error(error.message || "Failed to load automations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [socialUser?.userId, activeAccount?.id]);

  return (
    <AutoDMConnectionGate>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Automations</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create and manage your Instagram Auto DM workflows.</p>
          </div>
          <Button onClick={() => navigate("/dashboard/auto-dm/automations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>

        {!loading && automations.length > 0 ? (
          <div className="grid gap-3 md:hidden">
            {automations.map((automation) => (
              <div key={automation.id} className="rounded-[20px] border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex gap-3">
                  {automation.media_thumbnail ? (
                    <img src={automation.media_thumbnail} alt="" className="h-16 w-16 rounded-[14px] object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-[14px] bg-black/[0.04]">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--ink)]">{automation.name}</p>
                        <p className="mt-1 text-xs capitalize text-[var(--slate)]">{automation.trigger_type.replaceAll("_", " ")}</p>
                      </div>
                      <Badge variant={automation.is_active ? "success" : "secondary"}>{automation.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-[var(--slate)]">Updated {formatRelativeTime(automation.updated_at)}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}`)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}/leads`)}>
                        <BarChart3 className="mr-1 h-4 w-4" />
                        Leads
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <Card className="overflow-hidden rounded-[22px] border-black/10 shadow-sm">
          <CardContent className="p-0">
            <div className={`overflow-x-auto ${!loading && automations.length > 0 ? "hidden md:block" : ""}`}>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Updated</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-6 py-4"><Skeleton className="h-12 w-12 rounded" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-36" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-8 w-24" /></td>
                      </tr>
                    ))
                  ) : automations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <ImageIcon className="h-7 w-7 text-slate-400" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">No automations yet</p>
                            <p className="text-sm text-muted-foreground">Create your first automation to start engaging people from comments and DMs.</p>
                          </div>
                          <Button onClick={() => navigate("/dashboard/auto-dm/automations/new")}>Create Automation</Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    automations.map((automation) => (
                      <tr key={automation.id} className="border-b hover:bg-slate-50/80">
                        <td className="px-6 py-4">
                          {automation.media_thumbnail ? (
                            <img src={automation.media_thumbnail} alt="" className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100">
                              <ImageIcon className="h-5 w-5 text-slate-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{automation.name}</p>
                            <p className="text-sm text-muted-foreground">{automation.trigger_type.replaceAll("_", " ")}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={automation.is_active ? "success" : "secondary"}>{automation.is_active ? "Active" : "Inactive"}</Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatRelativeTime(automation.created_at)}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatRelativeTime(automation.updated_at)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}/leads`)}>
                              <BarChart3 className="mr-1 h-4 w-4" />
                              Leads Data
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}`)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const updated = await updateAutomation(automation.id, socialUser.userId, { is_active: !automation.is_active });
                                    setAutomations((current) => current.map((item) => (item.id === automation.id ? updated : item)));
                                    toast.success(updated.is_active ? "Automation activated" : "Automation paused");
                                  }}
                                >
                                  {automation.is_active ? "Pause" : "Activate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}`)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const duplicated = await createAutomation({
                                      ...automation,
                                      id: undefined,
                                      name: `${automation.name} (Copy)`,
                                      user_id: socialUser.userId,
                                      instagram_account_id: activeAccount.id,
                                      is_active: false,
                                    });
                                    setAutomations((current) => [duplicated, ...current]);
                                    toast.success("Automation duplicated");
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => setPendingDelete(automation)}>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={Boolean(pendingDelete)} onOpenChange={() => setPendingDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete automation</DialogTitle>
              <DialogDescription>This will permanently remove {pendingDelete?.name}.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await deleteAutomation(pendingDelete.id, socialUser.userId);
                  setAutomations((current) => current.filter((item) => item.id !== pendingDelete.id));
                  toast.success("Automation deleted");
                  setPendingDelete(null);
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AutoDMConnectionGate>
  );
}
