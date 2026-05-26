import {
  BarChart3,
  Copy,
  Image as ImageIcon,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Play,
  Plus,
  Radio,
  Share2,
  Trash2,
  Tv2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { createAutomation, deleteAutomation, listAutomations, updateAutomation } from "@/services/autodm/automations";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";
import { formatRelativeTime } from "./utils";

const triggerMeta = {
  comment_on_post: { label: "Comment on post", icon: MessageCircle, color: "text-blue-500 bg-blue-50" },
  comment_on_reel: { label: "Comment on reel", icon: Play, color: "text-violet-500 bg-violet-50" },
  dm_received: { label: "DM received", icon: MessageSquare, color: "text-emerald-500 bg-emerald-50" },
  live_comment: { label: "Live comment", icon: Radio, color: "text-red-500 bg-red-50" },
  story_reply: { label: "Story reply", icon: Share2, color: "text-orange-500 bg-orange-50" },
  story_mention: { label: "Story mention", icon: Tv2, color: "text-pink-500 bg-pink-50" },
};

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
            <h2 className="text-xl font-bold text-slate-900">Automations</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Create and manage your Instagram Auto DM workflows.
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/auto-dm/automations/new")}
            className="rounded-xl gap-1.5"
          >
            <Plus className="h-4 w-4" />
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

            {loading ? (
              <div className="divide-y divide-black/5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[3rem_1fr_9rem_8rem_8rem_7rem] items-center px-4 py-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-1.5 pr-4">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-3.5 w-20" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : automations.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Zap className="h-7 w-7 text-amber-500" />
                </div>
                <p className="font-semibold text-slate-900">No automations yet</p>
                <p className="mt-1 max-w-xs mx-auto text-sm text-slate-400">
                  Create your first automation to start engaging people from comments and DMs.
                </p>
                <Button
                  className="mt-5 rounded-xl"
                  onClick={() => navigate("/dashboard/auto-dm/automations/new")}
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create Automation
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {automations.map((automation) => {
                  const trigger = triggerMeta[automation.trigger_type] || {
                    label: automation.trigger_type.replaceAll("_", " "),
                    icon: Zap,
                    color: "text-slate-500 bg-slate-50",
                  };
                  const TriggerIcon = trigger.icon;

                  return (
                    <div
                      key={automation.id}
                      className="grid grid-cols-[3rem_1fr_9rem_8rem_8rem_7rem] items-center px-4 py-3.5 transition-colors hover:bg-slate-50/70"
                    >
                      {/* Thumbnail */}
                      <div>
                        {automation.media_thumbnail ? (
                          <img
                            src={automation.media_thumbnail}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-black/5"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                            <ImageIcon className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Name + trigger type */}
                      <div className="min-w-0 pr-4">
                        <p className="truncate text-sm font-semibold text-slate-900">{automation.name}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ${trigger.color}`}>
                            <TriggerIcon className="h-3 w-3" />
                            {trigger.label}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          automation.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${automation.is_active ? "bg-green-500" : "bg-slate-400"}`} />
                          {automation.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-slate-400">{formatRelativeTime(automation.created_at)}</div>
                      <div className="text-xs text-slate-400">{formatRelativeTime(automation.updated_at)}</div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-black/10 px-2.5 text-xs"
                          onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}/leads`)}
                        >
                          <BarChart3 className="mr-1 h-3.5 w-3.5" />
                          Leads
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-500">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-xl p-1">
                            <DropdownMenuItem
                              className="rounded-lg"
                              onClick={() => navigate(`/dashboard/auto-dm/automations/${automation.id}`)}
                            >
                              <Pencil className="mr-2 h-4 w-4 text-slate-400" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onClick={async () => {
                                const updated = await updateAutomation(automation.id, socialUser.userId, {
                                  is_active: !automation.is_active,
                                });
                                setAutomations((current) =>
                                  current.map((item) => (item.id === automation.id ? updated : item))
                                );
                                toast.success(updated.is_active ? "Automation activated" : "Automation paused");
                              }}
                            >
                              {automation.is_active ? (
                                <>
                                  <span className="mr-2 h-4 w-4 text-slate-400 flex items-center justify-center text-sm">⏸</span>
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4 text-slate-400" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg"
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
                              <Copy className="mr-2 h-4 w-4 text-slate-400" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="rounded-lg text-red-500 focus:text-red-600"
                              onClick={() => setPendingDelete(automation)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(pendingDelete)} onOpenChange={() => setPendingDelete(null)}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Delete automation</DialogTitle>
              <DialogDescription>
                This will permanently remove <strong>{pendingDelete?.name}</strong>. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setPendingDelete(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl"
                onClick={async () => {
                  await deleteAutomation(pendingDelete.id, socialUser.userId);
                  setAutomations((current) => current.filter((item) => item.id !== pendingDelete.id));
                  toast.success("Automation deleted");
                  setPendingDelete(null);
                }}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AutoDMConnectionGate>
  );
}
