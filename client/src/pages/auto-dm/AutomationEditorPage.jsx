import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  AtSign,
  Clock,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Info,
  Instagram,
  Layers,
  Loader2,
  MessageCircle,
  MousePointer,
  Pencil,
  Play,
  Plus,
  Radio,
  Save,
  Trash2,
  Type,
  Video,
  X,
  Zap,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAutoDM } from '../../context/AutoDMContext';
import { KeywordInput } from '../../features/autodm/KeywordInput';

const triggerTypes = [
  {
    value: 'comment_on_post',
    label: 'User comments on your post',
    icon: Instagram,
    description: 'Trigger when someone comments on one of your Instagram posts',
    available: true,
  },
  {
    value: 'comment_on_reel',
    label: 'User comments on your reel',
    icon: Instagram,
    description: 'Trigger when someone comments on one of your Instagram reels',
    available: true,
  },
  {
    value: 'dm_received',
    label: 'User DMs to you',
    icon: MessageCircle,
    description: 'Trigger when you receive a direct message',
    available: true,
  },
  {
    value: 'live_comment',
    label: 'User Comments on your LIVE',
    icon: Video,
    description: 'Trigger when someone comments during your live stream',
    available: true,
  },
  {
    value: 'story_reply',
    label: 'User replies to your stories',
    icon: Radio,
    description: 'Trigger when someone replies to your story',
    available: true,
  },
  {
    value: 'story_mention',
    label: 'User mentions you in story',
    icon: AtSign,
    description: 'Trigger when someone mentions you in their story',
    available: false,
  },
];

const responseTypes = [
  { type: 'text', label: 'Text Message', shortLabel: 'Text', icon: Type, description: 'Send a simple text message' },
  { type: 'image', label: 'Image', shortLabel: 'Image', icon: ImageIcon, description: 'Send an image with optional text' },
  { type: 'card', label: 'Card', shortLabel: 'Card', icon: FileText, description: 'Rich card with image, title, and buttons' },
  { type: 'carousel', label: 'Carousel', shortLabel: 'Carousel', icon: Layers, description: 'Multiple cards in a swipeable carousel' },
  { type: 'buttons', label: 'Buttons', shortLabel: 'Buttons', icon: MousePointer, description: 'Quick reply buttons or links' },
  { type: 'lead_form', label: 'Lead Form', shortLabel: 'Lead Form', icon: FileText, description: 'Capture lead information' },
  { type: 'delay', label: 'Delay', shortLabel: 'Delay', icon: Clock, description: 'Wait before sending next message' },
];

const defaultResponseFlow = {
  nodes: [
    {
      id: 'starter-card',
      type: 'card',
      card_title: 'Get your free guide',
      card_subtitle: 'Tap SETUP below and I will send everything in DM.',
      buttons: [{ id: 'starter-setup', type: 'postback', title: 'SETUP', payload: 'setup' }],
    },
    {
      id: 'starter-text',
      type: 'text',
      content: 'Hey {{first_name}}, here is the guide you asked for:\nhttps://your-link.com',
    },
  ],
  opening_message_enabled: false,
  opening_message: '',
};

function generateId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDateTimeLocalValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatScheduleDate(value) {
  if (!value) return 'now';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StepBadge({ step }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
      {step}
    </span>
  );
}

function EditorInfo({ text }) {
  return (
    <span className="group relative inline-flex align-middle">
      <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-black/30 bg-white text-[var(--slate)] transition-colors hover:border-primary hover:text-primary">
        <Info className="h-3 w-3" />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-30 hidden w-72 -translate-x-1/2 rounded-md bg-[#1a1a1a] px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg group-hover:block">
        <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#1a1a1a]" />
        {text}
      </span>
    </span>
  );
}

function triggerIcon(value) {
  return triggerTypes.find((trigger) => trigger.value === value)?.icon || Zap;
}

function createResponseNode(type) {
  const id = generateId('node');
  if (type === 'text') return { id, type, content: '' };
  if (type === 'image') return { id, type, image_url: '', content: '' };
  if (type === 'card') {
    return {
      id,
      type,
      card_image_url: '',
      card_title: '',
      card_subtitle: '',
      buttons: [{ id: generateId('button'), type: 'postback', title: 'SETUP', payload: 'setup' }],
    };
  }
  if (type === 'buttons') {
    return {
      id,
      type,
      content: 'Choose an option below.',
      buttons: [{ id: generateId('button'), type: 'url', title: 'Open link', url: '' }],
    };
  }
  if (type === 'carousel') return { id, type, items: [] };
  if (type === 'lead_form') return { id, type, form_title: 'Lead form', form_fields: [] };
  return { id, type: 'delay', delay_seconds: 5 };
}

function responseSummary(node) {
  if (node.type === 'text') return node.content || 'No text added yet';
  if (node.type === 'image') return node.content || node.image_url || 'Image response';
  if (node.type === 'card') return node.card_title || 'Card response';
  if (node.type === 'buttons') return node.content || `${node.buttons?.length || 0} button(s)`;
  if (node.type === 'carousel') return `${node.items?.length || 0} item(s)`;
  if (node.type === 'lead_form') return node.form_title || 'Lead form';
  if (node.type === 'delay') return `${node.delay_seconds || 5} second delay`;
  return 'Response';
}

function ResponseFlowBuilder({ responseFlow, onChange, step }) {
  const nodes = responseFlow?.nodes || [];
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  const updateNode = (draft) => {
    onChange({
      ...responseFlow,
      nodes: nodes.map((node) => (node.id === draft.id ? draft : node)),
    });
    setEditingNode(null);
  };

  const removeNode = (nodeId) => {
    onChange({ ...responseFlow, nodes: nodes.filter((node) => node.id !== nodeId) });
  };

  const addNode = (type) => {
    const node = createResponseNode(type);
    onChange({ ...responseFlow, nodes: [...nodes, node] });
    setPickerOpen(false);
    setEditingNode(node);
  };

  return (
    <Card className="overflow-hidden rounded-lg border-black/10 shadow-sm">
      <CardHeader className="border-b border-black/10 bg-white">
        <CardTitle className="flex flex-wrap items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
          <StepBadge step={step} />
          Response Flow
          <Badge variant="secondary" className="rounded-md bg-primary/10 text-primary">
            Editable
          </Badge>
          <EditorInfo text="Build the automated DM sequence sent after the trigger. Add text, image, card, buttons, carousel, lead form, or delay steps." />
        </CardTitle>
        <p className="text-sm text-[var(--slate)]">Click any response row to edit its text, image, buttons, or fields.</p>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-black/[0.02] p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Pencil className="h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium text-[var(--ink)]">Opening Message</p>
              <p className="text-sm text-[var(--slate)]">Toggle on to edit and send a welcome message before the main flow.</p>
            </div>
          </div>
          <Switch
            checked={Boolean(responseFlow.opening_message_enabled)}
            onCheckedChange={(checked) => onChange({ ...responseFlow, opening_message_enabled: checked })}
          />
        </div>

        {responseFlow.opening_message_enabled && (
          <Textarea
            rows={2}
            value={responseFlow.opening_message || ''}
            onChange={(event) => onChange({ ...responseFlow, opening_message: event.target.value })}
            placeholder="Hey {{first_name}}! Thanks for reaching out..."
            className="resize-none rounded-lg"
          />
        )}

        <div className="space-y-3">
          {nodes.map((node, index) => {
            const config = responseTypes.find((item) => item.type === node.type) || responseTypes[0];
            const Icon = config.icon;
            return (
              <div key={node.id} className="flex items-center gap-3 rounded-lg border border-black/10 bg-white p-3">
                <GripVertical className="h-4 w-4 shrink-0 text-[var(--slate)]/60" />
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[var(--ink)]">{config.shortLabel}</p>
                    <span className="text-xs font-medium text-primary">Editable</span>
                  </div>
                  <p className="truncate text-sm text-[var(--slate)]">{responseSummary(node)}</p>
                </div>
                <Button type="button" variant="outline" className="h-9 rounded-md" onClick={() => setEditingNode({ ...node })}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit response
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-md text-red-600" onClick={() => removeNode(node.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <Button type="button" variant="outline" className="h-11 w-full rounded-md border-dashed" onClick={() => setPickerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Response
        </Button>
      </CardContent>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md rounded-lg bg-white">
          <DialogHeader>
            <DialogTitle>Add Response Element</DialogTitle>
            <DialogDescription>Choose what to send next: text, image, buttons, delay, etc.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-2">
            {responseTypes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.type}
                  type="button"
                  className="rounded-lg border border-black/10 bg-white p-4 text-center transition-colors hover:border-primary hover:bg-primary/5"
                  onClick={() => addNode(item.type)}
                >
                  <Icon className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-2 font-medium text-[var(--ink)]">{item.label}</p>
                  <p className="mt-1 text-xs text-[var(--slate)]">{item.description}</p>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <ResponseEditorDialog node={editingNode} open={Boolean(editingNode)} onOpenChange={(open) => !open && setEditingNode(null)} onSave={updateNode} />
    </Card>
  );
}

function ResponseEditorDialog({ node, open, onOpenChange, onSave }) {
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    setDraft(node ? { ...node } : null);
  }, [node]);

  if (!draft) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent />
      </Dialog>
    );
  }

  const addButton = () => {
    setDraft({
      ...draft,
      buttons: [...(draft.buttons || []), { id: generateId('button'), type: 'url', title: '', url: '' }],
    });
  };

  const updateButton = (buttonId, updates) => {
    setDraft({
      ...draft,
      buttons: (draft.buttons || []).map((button) => (button.id === buttonId ? { ...button, ...updates } : button)),
    });
  };

  const removeButton = (buttonId) => {
    setDraft({ ...draft, buttons: (draft.buttons || []).filter((button) => button.id !== buttonId) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-lg bg-white">
        <DialogHeader>
          <DialogTitle>Edit {responseTypes.find((item) => item.type === draft.type)?.shortLabel || 'Response'}</DialogTitle>
          <DialogDescription>Update the content used in this response step.</DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {draft.type === 'text' && (
            <div>
              <Label className="mb-2 block">Message text</Label>
              <Textarea value={draft.content || ''} onChange={(event) => setDraft({ ...draft, content: event.target.value })} rows={5} />
            </div>
          )}

          {draft.type === 'image' && (
            <>
              <div>
                <Label className="mb-2 block">Image URL</Label>
                <Input value={draft.image_url || ''} onChange={(event) => setDraft({ ...draft, image_url: event.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label className="mb-2 block">Caption</Label>
                <Textarea value={draft.content || ''} onChange={(event) => setDraft({ ...draft, content: event.target.value })} rows={3} />
              </div>
            </>
          )}

          {draft.type === 'card' && (
            <>
              <div>
                <Label className="mb-2 block">Card image URL</Label>
                <Input value={draft.card_image_url || ''} onChange={(event) => setDraft({ ...draft, card_image_url: event.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label className="mb-2 block">Card title</Label>
                <Input value={draft.card_title || ''} onChange={(event) => setDraft({ ...draft, card_title: event.target.value })} />
              </div>
              <div>
                <Label className="mb-2 block">Card subtitle</Label>
                <Textarea value={draft.card_subtitle || ''} onChange={(event) => setDraft({ ...draft, card_subtitle: event.target.value })} rows={3} />
              </div>
            </>
          )}

          {draft.type === 'buttons' && (
            <div>
              <Label className="mb-2 block">Message text</Label>
              <Textarea value={draft.content || ''} onChange={(event) => setDraft({ ...draft, content: event.target.value })} rows={3} />
            </div>
          )}

          {['card', 'buttons'].includes(draft.type) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Buttons</Label>
                <Button type="button" variant="outline" size="sm" className="rounded-md" onClick={addButton}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Button
                </Button>
              </div>
              {(draft.buttons || []).map((button) => (
                <div key={button.id} className="space-y-2 rounded-lg border border-black/10 bg-black/[0.02] p-3">
                  <Input value={button.title || ''} onChange={(event) => updateButton(button.id, { title: event.target.value })} placeholder="Button text" />
                  <div className="grid gap-2 sm:grid-cols-[140px_1fr_36px]">
                    <select
                      className="h-10 rounded-md border border-black/10 bg-white px-3 text-sm"
                      value={button.type || 'url'}
                      onChange={(event) => updateButton(button.id, { type: event.target.value })}
                    >
                      <option value="url">URL</option>
                      <option value="postback">Postback</option>
                    </select>
                    <Input
                      value={button.type === 'postback' ? button.payload || '' : button.url || ''}
                      onChange={(event) =>
                        updateButton(button.id, button.type === 'postback' ? { payload: event.target.value } : { url: event.target.value })
                      }
                      placeholder={button.type === 'postback' ? 'Payload' : 'https://...'}
                    />
                    <Button type="button" variant="ghost" size="icon" className="rounded-md text-red-600" onClick={() => removeButton(button.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {draft.type === 'carousel' && <p className="rounded-lg border border-black/10 bg-black/[0.02] p-4 text-sm text-[var(--slate)]">Carousel shell added. Item-level editor can be expanded from here.</p>}

          {draft.type === 'lead_form' && (
            <div>
              <Label className="mb-2 block">Form title</Label>
              <Input value={draft.form_title || ''} onChange={(event) => setDraft({ ...draft, form_title: event.target.value })} />
            </div>
          )}

          {draft.type === 'delay' && (
            <div>
              <Label className="mb-2 block">Delay in seconds</Label>
              <Input type="number" min={1} max={60} value={draft.delay_seconds || 5} onChange={(event) => setDraft({ ...draft, delay_seconds: Number(event.target.value) || 5 })} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" className="rounded-md" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" className="rounded-md" onClick={() => onSave(draft)}>
            Save response
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MediaSelector({ open, onOpenChange, onSelect, fetchMedia }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setLoading(true);
    fetchMedia(30)
      .then((items) => {
        if (mounted) setMedia(items || []);
      })
      .catch((error) => {
        console.error('[AutoDM] Failed to load media:', error);
        toast.error(error.response?.data?.error || error.message || 'Failed to load Instagram media');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [fetchMedia, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] max-w-3xl flex-col overflow-hidden rounded-lg bg-white">
        <DialogHeader>
          <DialogTitle>Select Post or Reel</DialogTitle>
          <DialogDescription>Choose one Instagram post/reel for this automation.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <Skeleton key={index} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--slate)]">No media found yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-black/10"
                  onClick={() => {
                    onSelect(item);
                    onOpenChange(false);
                  }}
                >
                  <img src={item.thumbnail_url || item.media_url} alt={item.caption || 'Instagram media'} className="h-full w-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 px-2 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AutomationEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { loading: accountLoading, activeAccount, getAutomation, createAutomation, updateAutomation, fetchInstagramMedia } = useAutoDM();
  const isNew = !id || id === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [name, setName] = useState('Untitled');
  const [triggerType, setTriggerType] = useState(searchParams.get('trigger') || 'comment_on_post');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [applyToAllMedia, setApplyToAllMedia] = useState(true);
  const [keywords, setKeywords] = useState([]);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [commentReplyEnabled, setCommentReplyEnabled] = useState(true);
  const [commentReplyText, setCommentReplyText] = useState('Sent it to your DM. Tap SETUP to continue.');
  const [scheduleType, setScheduleType] = useState('duration');
  const [durationDays, setDurationDays] = useState('7');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [responseFlow, setResponseFlow] = useState(defaultResponseFlow);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isNew || !id) {
      setIsLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const data = await getAutomation(id);
        if (!mounted) return;
        if (!data) throw new Error('Automation not found');
        setName(data.name || 'Untitled');
        setTriggerType(data.trigger_type || 'comment_on_post');
        setSelectedMedia(
          data.media_id
            ? {
                id: data.media_id,
                media_url: data.media_url || '',
                thumbnail_url: data.media_thumbnail || '',
                caption: data.media_caption || '',
                permalink: data.media_permalink || '',
              }
            : null
        );
        setApplyToAllMedia(!data.media_id);
        setKeywords(data.keywords || []);
        setIsCaseSensitive(Boolean(data.is_case_sensitive));
        setCommentReplyEnabled(data.comment_reply_enabled !== false);
        setCommentReplyText(data.comment_reply_text || 'Sent it to your DM. Tap SETUP to continue.');
        setScheduleType(data.schedule_type || 'manual');
        setStartsAt(toDateTimeLocalValue(data.starts_at));
        setEndsAt(toDateTimeLocalValue(data.ends_at));
        setResponseFlow(data.response_flow || defaultResponseFlow);
        setIsActive(Boolean(data.is_active));
      } catch (error) {
        toast.error(error.message || 'Failed to load automation');
        navigate('/dashboard/auto-dm/automations');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [getAutomation, id, isNew, navigate]);

  useEffect(() => {
    if (!['comment_on_post', 'comment_on_reel'].includes(triggerType)) {
      setSelectedMedia(null);
      setApplyToAllMedia(true);
    }
    if (['comment_on_post', 'comment_on_reel', 'live_comment'].includes(triggerType)) {
      setCommentReplyEnabled(true);
      setCommentReplyText((value) => value || 'Sent it to your DM. Tap SETUP to continue.');
    }
  }, [triggerType]);

  const buildSchedulePayload = () => {
    if (scheduleType === 'manual') {
      return { ok: true, value: { schedule_type: 'manual', starts_at: null, ends_at: null } };
    }

    const start = startsAt ? new Date(startsAt) : new Date();
    if (Number.isNaN(start.getTime())) return { ok: false, error: 'Please select a valid start date.' };

    let end;
    if (scheduleType === 'duration') {
      const days = Number(durationDays);
      if (!Number.isFinite(days) || days <= 0) return { ok: false, error: 'Please select a valid duration.' };
      end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      if (!endsAt) return { ok: false, error: 'Please select when this automation should stop.' };
      end = new Date(endsAt);
    }

    if (Number.isNaN(end.getTime()) || end <= start) return { ok: false, error: 'End time must be after the start time.' };
    return { ok: true, value: { schedule_type: scheduleType, starts_at: start.toISOString(), ends_at: end.toISOString() } };
  };

  const getSchedulePreview = () => {
    const schedule = buildSchedulePayload();
    if (!schedule.ok) return schedule.error;
    if (!schedule.value.ends_at) return 'Runs until you manually pause or delete it.';
    return `Runs from ${formatScheduleDate(schedule.value.starts_at)} to ${formatScheduleDate(schedule.value.ends_at)}.`;
  };

  const handleSave = async () => {
    if (!activeAccount) {
      toast.error('Please connect an Instagram account first');
      return;
    }
    if (['comment_on_post', 'comment_on_reel'].includes(triggerType) && !applyToAllMedia && !selectedMedia) {
      toast.error('Please select a post/reel or choose all posts.');
      return;
    }
    if (!keywords.length) {
      toast.error('Please add at least one keyword');
      return;
    }
    if (!(responseFlow.nodes || []).length) {
      toast.error('Please add at least one response in the flow');
      return;
    }

    const schedule = buildSchedulePayload();
    if (!schedule.ok) {
      toast.error(schedule.error);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        instagram_account_id: activeAccount.id,
        name,
        trigger_type: triggerType,
        media_id: applyToAllMedia ? null : selectedMedia?.id || null,
        media_url: applyToAllMedia ? null : selectedMedia?.media_url || null,
        media_thumbnail: applyToAllMedia ? null : selectedMedia?.thumbnail_url || selectedMedia?.media_url || null,
        media_like_count: applyToAllMedia ? null : selectedMedia?.like_count ?? null,
        media_comments_count: applyToAllMedia ? null : selectedMedia?.comments_count ?? null,
        media_caption: applyToAllMedia ? null : selectedMedia?.caption ?? null,
        media_permalink: applyToAllMedia ? null : selectedMedia?.permalink ?? null,
        keywords,
        is_case_sensitive: isCaseSensitive,
        comment_reply_enabled: commentReplyEnabled,
        comment_reply_text: commentReplyEnabled ? commentReplyText : null,
        response_flow: responseFlow,
        is_active: isActive,
        ...schedule.value,
        expired_at: null,
      };

      if (isNew) {
        await createAutomation({ ...payload, follower_count_at_create: activeAccount.followers_count || null });
        toast.success('Automation created!');
      } else {
        await updateAutomation(id, payload);
        toast.success('Automation saved!');
      }
      navigate('/dashboard/auto-dm/automations');
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Failed to save automation');
    } finally {
      setIsSaving(false);
    }
  };

  if (accountLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeAccount) {
    return (
      <div className="rounded-lg border border-black/10 bg-white p-12 text-center shadow-sm">
        <Instagram className="mx-auto h-10 w-10 text-[var(--slate)]" />
        <p className="mt-4 font-medium text-[var(--ink)]">Connect an Instagram account first</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedTrigger = triggerTypes.find((trigger) => trigger.value === triggerType) || triggerTypes[0];
  const SelectedTriggerIcon = triggerIcon(triggerType);
  const needsMediaSelection = ['comment_on_post', 'comment_on_reel'].includes(triggerType);
  const isCommentTrigger = ['comment_on_post', 'comment_on_reel', 'live_comment'].includes(triggerType);
  const keywordStep = needsMediaSelection ? 3 : 2;
  const responseStep = keywordStep + 1;
  const commentStep = responseStep + 1;
  const durationStep = isCommentTrigger ? commentStep + 1 : responseStep + 1;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Button variant="ghost" size="icon" className="rounded-md" onClick={() => navigate('/dashboard/auto-dm/automations')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <Label htmlFor="automation-name" className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--slate)]">
                <Pencil className="h-3.5 w-3.5" />
                Automation name - editable
              </Label>
              <Input
                id="automation-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 max-w-xl rounded-md bg-black/[0.035] px-4 text-lg font-semibold text-[var(--ink)]"
                placeholder="Name this automation"
              />
              <p className="mt-1 text-xs text-[var(--slate)]">Click here to rename it. This name appears in your automations list.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            {!isNew && (
              <Button variant="outline" className="rounded-md" onClick={() => toast.success('Re-trigger initiated for past commenters')}>
                <Play className="mr-2 h-4 w-4" />
                Re-Trigger
              </Button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--slate)]">Status</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <Button className="rounded-md" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
        <div className="space-y-6">
          <Card className="overflow-visible rounded-lg border-black/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
                <StepBadge step={1} />
                Select a Trigger
                <Zap className="h-5 w-5 text-primary" />
                <EditorInfo text="Choose the Instagram event that starts this automation. Example: a comment on a post, a reel comment, or a direct message." />
                <span className="text-sm font-normal text-[var(--slate)]">When to run automation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-[var(--slate)]">Select trigger type</p>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger className="h-auto w-full rounded-md py-3">
                  <SelectValue>
                    <div className="flex items-center gap-3">
                      <SelectedTriggerIcon className="h-5 w-5 text-primary" />
                      <span className="font-medium">{selectedTrigger.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {triggerTypes.map((trigger) => {
                    const Icon = trigger.icon;
                    return (
                      <SelectItem key={trigger.value} value={trigger.value} disabled={!trigger.available}>
                        <div className="flex w-full items-center gap-3 py-1">
                          <Icon className="h-5 w-5 text-primary" />
                          <div className="flex flex-col items-start leading-tight">
                            <span className="font-medium text-sm">{trigger.label}</span>
                            <span className="text-xs text-[var(--slate)]">{trigger.description}</span>
                          </div>
                          {!trigger.available && <Badge variant="secondary" className="ml-2 whitespace-nowrap rounded-md">Coming Soon</Badge>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {needsMediaSelection && (
            <Card className="rounded-lg border-black/10 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
                  <StepBadge step={2} />
                  Pick post or reel
                  <EditorInfo text="Use All posts & reels for a broad automation, or turn it off to attach this automation to one exact post/reel." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between rounded-lg border border-black/10 p-4">
                  <div>
                    <p className="font-medium text-[var(--ink)]">All posts & reels</p>
                    <p className="text-sm text-[var(--slate)]">If enabled, this automation can trigger on any post/reel.</p>
                  </div>
                  <Switch
                    checked={applyToAllMedia}
                    onCheckedChange={(checked) => {
                      setApplyToAllMedia(checked);
                      if (checked) setSelectedMedia(null);
                    }}
                  />
                </div>

                {!applyToAllMedia &&
                  (selectedMedia ? (
                    <div className="relative overflow-hidden rounded-lg border border-black/10">
                      <img src={selectedMedia.thumbnail_url || selectedMedia.media_url} alt={selectedMedia.caption || 'Selected media'} className="h-56 w-full object-cover" />
                      <Button variant="destructive" size="icon" className="absolute right-3 top-3 rounded-md" onClick={() => setSelectedMedia(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full rounded-lg border-2 border-dashed border-black/15 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
                      onClick={() => setShowMediaSelector(true)}
                    >
                      <ImageIcon className="mx-auto h-8 w-8 text-primary" />
                      <p className="mt-2 font-medium text-[var(--ink)]">Select Post or Reel</p>
                      <p className="text-sm text-[var(--slate)]">Click to choose from your Instagram posts</p>
                    </button>
                  ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg border-black/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
                <StepBadge step={keywordStep} />
                Add trigger keywords
                <EditorInfo text="Keywords tell the automation when to respond. If a comment or DM contains any of these words, this automation can run." />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeywordInput keywords={keywords} onChange={setKeywords} caseSensitive={isCaseSensitive} onCaseSensitiveChange={setIsCaseSensitive} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:sticky lg:top-5">
          {isCommentTrigger && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Instagram allows one private reply from a comment. Put the main CTA or button first, then continue the full sequence from a DM keyword trigger like SETUP.
            </div>
          )}

          <ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} step={responseStep} />

          {isCommentTrigger && (
            <Card className="rounded-lg border-black/10 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
                  <StepBadge step={commentStep} />
                  Comment reply
                  <EditorInfo text="This is the public reply posted under the user's comment. Keep it short, usually telling them to check DM or tap the CTA." />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable comment reply</Label>
                  <Switch checked={commentReplyEnabled} onCheckedChange={setCommentReplyEnabled} />
                </div>
                {commentReplyEnabled && (
                  <div>
                    <Label className="mb-2 block">Reply text</Label>
                    <Textarea value={commentReplyText} onChange={(event) => setCommentReplyText(event.target.value)} placeholder="Check your DM!" rows={3} className="resize-none rounded-md" />
                    <p className="mt-2 text-xs text-[var(--slate)]">Posted as a reply to the comment, once per user per post.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-lg border-black/10 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
                <StepBadge step={durationStep} />
                Automation duration
                <Clock className="h-5 w-5 text-primary" />
                <EditorInfo text="Set when the automation should stop. This prevents old campaigns from running forever." />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block">How long should this automation run?</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger className="rounded-md">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="duration">Run for a fixed duration</SelectItem>
                    <SelectItem value="custom">Custom start and end time</SelectItem>
                    <SelectItem value="manual">Run until manually turned off</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {scheduleType === 'duration' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block">Duration</Label>
                    <Select value={durationDays} onValueChange={setDurationDays}>
                      <SelectTrigger className="rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="1">24 hours</SelectItem>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block">Start time</Label>
                    <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-md" />
                    <p className="mt-1 text-xs text-[var(--slate)]">Leave blank to start now.</p>
                  </div>
                </div>
              )}

              {scheduleType === 'custom' && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block">Start time</Label>
                    <Input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="rounded-md" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Stop time</Label>
                    <Input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="rounded-md" />
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-[var(--ink)]">{getSchedulePreview()}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaSelector open={showMediaSelector} onOpenChange={setShowMediaSelector} onSelect={setSelectedMedia} fetchMedia={fetchInstagramMedia} />
    </div>
  );
}
