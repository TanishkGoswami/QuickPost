import { ArrowLeft, Image as ImageIcon, Instagram, Loader2, Play, Save, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createAutomation, getAutomationById, updateAutomation } from "@/services/autodm/automations";
import { useAutoDM } from "./AutoDMContext";
import { AutoDMConnectionGate } from "./AutoDMConnectionGate";
import { KeywordInput } from "./KeywordInput";
import { MediaSelector } from "./MediaSelector";
import { ResponseFlowBuilder } from "./ResponseFlowBuilder";

const triggerTypes = [
  { value: "comment_on_post", label: "User comments on your post", available: true },
  { value: "comment_on_reel", label: "User comments on your reel", available: true },
  { value: "dm_received", label: "User sends you a DM", available: true },
  { value: "live_comment", label: "User comments on your live", available: true },
  { value: "story_reply", label: "User replies to your story", available: true },
  { value: "story_mention", label: "User mentions you in story", available: false },
];

export default function AutomationEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { socialUser, activeAccount } = useAutoDM();
  const isNew = !id || id === "new";

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [name, setName] = useState("Untitled");
  const [triggerType, setTriggerType] = useState("comment_on_post");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [applyToAllMedia, setApplyToAllMedia] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(false);
  const [commentReplyText, setCommentReplyText] = useState("");
  const [responseFlow, setResponseFlow] = useState({ nodes: [], opening_message_enabled: false, opening_message: "" });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isNew || !socialUser?.userId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const automation = await getAutomationById(id, socialUser.userId);
        if (!automation) {
          toast.error("Automation not found");
          navigate("/dashboard/auto-dm/automations");
          return;
        }
        setName(automation.name || "Untitled");
        setTriggerType(automation.trigger_type);
        setSelectedMedia(
          automation.media_id
            ? {
                id: automation.media_id,
                media_url: automation.media_url,
                thumbnail_url: automation.media_thumbnail,
              }
            : null
        );
        setApplyToAllMedia(!automation.media_id);
        setKeywords(automation.keywords || []);
        setIsCaseSensitive(Boolean(automation.is_case_sensitive));
        setCommentReplyEnabled(Boolean(automation.comment_reply_enabled));
        setCommentReplyText(automation.comment_reply_text || "");
        setResponseFlow(automation.response_flow || { nodes: [], opening_message_enabled: false, opening_message: "" });
        setIsActive(Boolean(automation.is_active));
      } catch (error) {
        toast.error(error.message || "Failed to load automation");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew, socialUser?.userId]);

  return (
    <AutoDMConnectionGate>
      {!activeAccount ? (
        <div className="rounded-3xl border border-black/10 bg-white p-12 text-center shadow-sm">
          <Instagram className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-4 font-medium text-slate-900">Connect an Instagram account first</p>
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/auto-dm/automations")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="border-0 bg-transparent px-0 text-lg font-semibold focus-visible:ring-0" />
            </div>
            <div className="flex items-center gap-3">
              {!isNew && (
                <Button variant="outline" onClick={() => toast.success("Re-trigger flow wired for existing automations")}>
                  <Play className="mr-2 h-4 w-4" />
                  Re-Trigger
                </Button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status</span>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <Button
                onClick={async () => {
                  if (!keywords.length) {
                    toast.error("Add at least one keyword");
                    return;
                  }
                  if (!responseFlow.nodes.length) {
                    toast.error("Add at least one response");
                    return;
                  }
                  setSaving(true);
                  try {
                    const payload = {
                      user_id: socialUser.userId,
                      instagram_account_id: activeAccount.id,
                      name,
                      trigger_type: triggerType,
                      media_id: applyToAllMedia ? null : selectedMedia?.id || null,
                      media_url: applyToAllMedia ? null : selectedMedia?.media_url || null,
                      media_thumbnail: applyToAllMedia ? null : selectedMedia?.thumbnail_url || selectedMedia?.media_url || null,
                      keywords,
                      is_case_sensitive: isCaseSensitive,
                      comment_reply_enabled: commentReplyEnabled,
                      comment_reply_text: commentReplyEnabled ? commentReplyText : null,
                      response_flow: responseFlow,
                      is_active: isActive,
                    };
                    if (isNew) {
                      await createAutomation(payload);
                      toast.success("Automation created");
                    } else {
                      await updateAutomation(id, socialUser.userId, payload);
                      toast.success("Automation updated");
                    }
                    navigate("/dashboard/auto-dm/automations");
                  } catch (error) {
                    toast.error(error.message || "Failed to save automation");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Select a Trigger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger className="h-auto py-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {triggerTypes.map((trigger) => (
                        <SelectItem key={trigger.value} value={trigger.value} disabled={!trigger.available}>
                          <div className="flex items-center gap-3 py-1">
                            <span>{trigger.label}</span>
                            {!trigger.available ? <Badge variant="secondary">Coming soon</Badge> : null}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {["comment_on_post", "comment_on_reel"].includes(triggerType) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Which post or reel should trigger this?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <p className="font-medium">All posts and reels</p>
                        <p className="text-sm text-muted-foreground">Use this automation on every post and reel.</p>
                      </div>
                      <Switch checked={applyToAllMedia} onCheckedChange={(checked) => { setApplyToAllMedia(checked); if (checked) setSelectedMedia(null); }} />
                    </div>
                    {!applyToAllMedia && (
                      selectedMedia ? (
                        <div className="space-y-3">
                          <img src={selectedMedia.thumbnail_url || selectedMedia.media_url} alt="" className="h-56 w-full rounded-lg object-cover" />
                          <Button variant="outline" onClick={() => setSelectedMedia(null)}>Change selection</Button>
                        </div>
                      ) : (
                        <button className="w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary" onClick={() => setMediaDialogOpen(true)}>
                          <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                          <p className="font-medium">Select Instagram media</p>
                        </button>
                      )
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <KeywordInput keywords={keywords} onChange={setKeywords} caseSensitive={isCaseSensitive} onCaseSensitiveChange={setIsCaseSensitive} />
                </CardContent>
              </Card>

              {["comment_on_post", "comment_on_reel", "live_comment"].includes(triggerType) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Comment reply</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Enable comment reply</Label>
                      <Switch checked={commentReplyEnabled} onCheckedChange={setCommentReplyEnabled} />
                    </div>
                    {commentReplyEnabled && (
                      <Textarea value={commentReplyText} onChange={(event) => setCommentReplyText(event.target.value)} rows={3} placeholder="Check your DM" />
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            <ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} />
          </div>

          <MediaSelector
            open={mediaDialogOpen}
            onOpenChange={setMediaDialogOpen}
            onSelect={(media) => {
              setSelectedMedia(media);
              setMediaDialogOpen(false);
            }}
          />
        </div>
      )}
    </AutoDMConnectionGate>
  );
}
