import { Instagram, Loader2, MessageCircle, RefreshCw, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getAutoDMStatus, importInstagramAccountFromSocial } from "@/services/autodm/accounts";
import { KeywordInput } from "./KeywordInput";
import { ResponseFlowBuilder } from "./ResponseFlowBuilder";

const triggerOptions = [
  { value: "comment_on_post", label: "Comments on this post" },
  { value: "comment_on_reel", label: "Comments on this reel" },
];

export const defaultComposerAutoDMConfig = {
  enabled: false,
  name: "Auto DM for new Instagram post",
  triggerType: "comment_on_post",
  keywords: [],
  isCaseSensitive: false,
  commentReplyEnabled: true,
  commentReplyText: "Sent you the details in DM.",
  responseFlow: {
    opening_message_enabled: false,
    opening_message: "",
    nodes: [
      {
        id: "composer_text_1",
        type: "text",
        content: "Hey! Thanks for commenting. Here are the details.",
      },
    ],
  },
};

export function AutoDMComposerPanel({ config, onChange, postType }) {
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null);
  const instagramReady = Boolean(status?.autodmAccounts?.length);
  const canImport = Boolean(status?.hasSocialInstagramConnection);

  const update = (updates) => onChange({ ...config, ...updates });

  useEffect(() => {
    let cancelled = false;
    if (!config.enabled) return;

    setChecking(true);
    getAutoDMStatus()
      .then((nextStatus) => {
        if (!cancelled) setStatus(nextStatus);
      })
      .catch((error) => {
        if (!cancelled) toast.error(error.message || "Failed to check Auto DM account");
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [config.enabled]);

  useEffect(() => {
    if (postType === "reel" && config.triggerType !== "comment_on_reel") {
      update({ triggerType: "comment_on_reel" });
    }
  }, [postType]);

  return (
    <div className="space-y-4 overflow-hidden rounded-[18px] border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--arc)]/10 text-[var(--arc)]">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">Auto DM for this Instagram post</p>
              <p className="mt-1 text-xs leading-5 text-[var(--slate)]">
                Turn comments on this post into DM replies, leads, and follow-up flows.
              </p>
            </div>
          </div>
          <Switch checked={config.enabled} onCheckedChange={(checked) => update({ enabled: checked })} />
        </div>

        {config.enabled ? (
          <div className="space-y-4">
            <div className="rounded-[14px] border border-black/10 bg-[var(--canvas-lifted)] p-3">
              {checking ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--slate)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking Auto DM account...
                </div>
              ) : instagramReady ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                  <Instagram className="h-4 w-4" />
                  Auto DM account ready
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink)]">Auto DM account not imported</p>
                    <p className="mt-1 text-xs text-[var(--slate)]">
                      Import your Social Pilot Instagram connection once, then this post can auto-bind after publishing.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canImport || syncing}
                    onClick={async () => {
                      setSyncing(true);
                      try {
                        await importInstagramAccountFromSocial();
                        const nextStatus = await getAutoDMStatus();
                        setStatus(nextStatus);
                        toast.success("Instagram imported into Auto DM");
                      } catch (error) {
                        toast.error(error.message || "Failed to import Instagram");
                      } finally {
                        setSyncing(false);
                      }
                    }}
                  >
                    {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Import
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Select value={config.triggerType} onValueChange={(value) => update({ triggerType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-[var(--arc)]" />
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <KeywordInput
                  keywords={config.keywords}
                  onChange={(keywords) => update({ keywords })}
                  caseSensitive={config.isCaseSensitive}
                  onCaseSensitiveChange={(isCaseSensitive) => update({ isCaseSensitive })}
                />

                <div className="rounded-[14px] border border-black/10 bg-[var(--canvas-lifted)] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label>Public comment reply</Label>
                    <Switch checked={config.commentReplyEnabled} onCheckedChange={(commentReplyEnabled) => update({ commentReplyEnabled })} />
                  </div>
                  {config.commentReplyEnabled ? (
                    <Textarea
                      className="mt-3"
                      rows={3}
                      value={config.commentReplyText}
                      onChange={(event) => update({ commentReplyText: event.target.value })}
                      placeholder="Sent you the details in DM."
                    />
                  ) : null}
                </div>
              </div>

              <ResponseFlowBuilder
                responseFlow={config.responseFlow}
                onChange={(responseFlow) => update({ responseFlow })}
                compact={true}
              />
            </div>
          </div>
        ) : null}
    </div>
  );
}
