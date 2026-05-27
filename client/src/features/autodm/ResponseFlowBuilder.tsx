import {
  Clock,
  CreditCard,
  FileText,
  GripVertical,
  Image,
  Layers,
  MessageSquare,
  MousePointer,
  Plus,
  Trash2,
  Type,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { generateId } from "./utils";

const nodeTypes = [
  { type: "text", label: "Text Message", icon: Type, description: "Send a simple text message", color: "bg-blue-500", lightBg: "bg-blue-50", border: "border-l-blue-400" },
  { type: "image", label: "Image", icon: Image, description: "Send an image with optional text", color: "bg-emerald-500", lightBg: "bg-emerald-50", border: "border-l-emerald-400" },
  { type: "card", label: "Card", icon: CreditCard, description: "Rich card with image, title, and buttons", color: "bg-violet-500", lightBg: "bg-violet-50", border: "border-l-violet-400" },
  { type: "carousel", label: "Carousel", icon: Layers, description: "Multiple cards in a swipeable carousel", color: "bg-orange-500", lightBg: "bg-orange-50", border: "border-l-orange-400" },
  { type: "buttons", label: "Buttons", icon: MousePointer, description: "Quick reply buttons or links", color: "bg-amber-500", lightBg: "bg-amber-50", border: "border-l-amber-400" },
  { type: "form", label: "Lead Form", icon: FileText, description: "Capture lead information", color: "bg-pink-500", lightBg: "bg-pink-50", border: "border-l-pink-400" },
  { type: "delay", label: "Delay", icon: Clock, description: "Wait before sending next message", color: "bg-slate-500", lightBg: "bg-slate-50", border: "border-l-slate-400" },
];

function getNodeConfig(type) {
  return nodeTypes.find((n) => n.type === type) || nodeTypes[0];
}

export function ResponseFlowBuilder({ responseFlow, onChange }) {
  const [showNodePicker, setShowNodePicker] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const updateNode = (nodeId, updates) => {
    onChange({
      ...responseFlow,
      nodes: responseFlow.nodes.map((node) => (node.id === nodeId ? { ...node, ...updates } : node)),
    });
  };

  return (
    <Card className="h-full min-h-[420px]">
      <CardHeader>
        <CardTitle>Response Flow</CardTitle>
        <p className="text-sm text-[var(--slate)]">Build the message sequence sent when this automation triggers.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-[14px] bg-black/[0.035] p-4">
          <div>
            <Label>Opening Message</Label>
            <p className="text-xs text-[var(--slate)]">Send a welcome message before the main flow</p>
          </div>
          <Switch
            checked={responseFlow.opening_message_enabled}
            onCheckedChange={(checked) => onChange({ ...responseFlow, opening_message_enabled: checked })}
          />
        </div>

        {responseFlow.opening_message_enabled && (
          <Textarea
            value={responseFlow.opening_message || ""}
            onChange={(event) => onChange({ ...responseFlow, opening_message: event.target.value })}
            placeholder="Hey! Thanks for reaching out."
            rows={2}
            className="resize-none rounded-xl border-black/10 bg-white text-sm shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        )}

        <div className="space-y-3">
          {responseFlow.nodes.length === 0 && (
            <div className="rounded-[14px] border border-dashed border-black/10 bg-white p-4 text-center">
              <p className="text-sm font-medium text-slate-700">No messages yet</p>
              <p className="mt-1 text-xs text-slate-400">Add your first response below</p>
            </div>
          )}

          {responseFlow.nodes.map((node, index) => {
            const config = getNodeConfig(node.type);
            const NodeIcon = config.icon;
            return (
              <div
                key={node.id}
                className={`flex items-center gap-3 rounded-xl border border-l-4 bg-white px-3.5 py-3 shadow-sm transition-shadow hover:shadow-md ${config.border}`}
              >
                <button className="cursor-grab text-slate-300 hover:text-slate-500">
                  <GripVertical className="h-4 w-4" />
                </button>
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                    <NodeIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800 capitalize">{config.label}</p>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="truncate text-xs text-slate-400">
                      {node.content || node.card_title || `${node.buttons?.length || node.form_fields?.length || 0} items`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-lg px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => {
                      setEditingNode({ ...node });
                      setEditDialogOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500"
                    onClick={() =>
                      onChange({ ...responseFlow, nodes: responseFlow.nodes.filter((item) => item.id !== node.id) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => setShowNodePicker(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Response
        </Button>
      </CardContent>

      {/* Node type picker */}
      <Dialog open={showNodePicker} onOpenChange={setShowNodePicker}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Add Response Element</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Choose what to send next in your automation flow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-2">
            {nodeTypes.map((nodeType) => (
              <button
                type="button"
                key={nodeType.type}
                className="rounded-[14px] border border-black/10 bg-white p-4 text-center transition-colors hover:border-[var(--arc)] hover:bg-[var(--arc)]/5"
                onClick={() => {
                  const newNode = {
                    id: generateId(),
                    type: nodeType.type,
                    content: nodeType.type === "text" ? "" : undefined,
                    buttons: nodeType.type === "buttons" || nodeType.type === "card" ? [] : undefined,
                    form_fields: nodeType.type === "form" ? [] : undefined,
                    delay_seconds: nodeType.type === "delay" ? 5 : undefined,
                  };
                  onChange({ ...responseFlow, nodes: [...responseFlow.nodes, newNode] });
                  setShowNodePicker(false);
                  setEditingNode(newNode);
                  setEditDialogOpen(true);
                }}
              >
                <nodeType.icon className="mx-auto h-6 w-6 text-[var(--ink)]" />
                <div className="mt-2 text-sm font-medium">{nodeType.label}</div>
                <div className="mt-1 text-xs text-[var(--slate)]">{nodeType.description}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Node editor */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 capitalize">
              {editingNode && (() => {
                const config = getNodeConfig(editingNode.type);
                const Icon = config.icon;
                return (
                  <>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${config.color}`}>
                      <Icon className="h-3.5 w-3.5 text-white" />
                    </div>
                    Edit {config.label}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4 py-4">
              {editingNode.type === "text" && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">Message Content</Label>
                  <Textarea
                    value={editingNode.content || ""}
                    onChange={(event) => setEditingNode({ ...editingNode, content: event.target.value })}
                    rows={4}
                    className="mt-1.5 resize-none rounded-xl border-black/10 text-sm"
                    placeholder="Type your message..."
                  />
                </div>
              )}
              {editingNode.type === "image" && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Image URL</Label>
                    <Input
                      value={editingNode.image_url || ""}
                      onChange={(event) => setEditingNode({ ...editingNode, image_url: event.target.value })}
                      className="mt-1.5 rounded-xl border-black/10 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Caption</Label>
                    <Textarea
                      value={editingNode.content || ""}
                      onChange={(event) => setEditingNode({ ...editingNode, content: event.target.value })}
                      rows={2}
                      className="mt-1.5 resize-none rounded-xl border-black/10 text-sm"
                    />
                  </div>
                </>
              )}
              {(editingNode.type === "buttons" || editingNode.type === "card") && (
                <>
                  {editingNode.type === "card" && (
                    <>
                      <Input
                        value={editingNode.card_image_url || ""}
                        onChange={(event) => setEditingNode({ ...editingNode, card_image_url: event.target.value })}
                        placeholder="Card image URL"
                        className="rounded-xl border-black/10 text-sm"
                      />
                      <Input
                        value={editingNode.card_title || ""}
                        onChange={(event) => setEditingNode({ ...editingNode, card_title: event.target.value })}
                        placeholder="Card title"
                        className="rounded-xl border-black/10 text-sm"
                      />
                    </>
                  )}
                  <Textarea
                    value={editingNode.content || editingNode.card_subtitle || ""}
                    onChange={(event) =>
                      setEditingNode({
                        ...editingNode,
                        [editingNode.type === "card" ? "card_subtitle" : "content"]: event.target.value,
                      })
                    }
                    placeholder="Message or subtitle"
                    className="resize-none rounded-xl border-black/10 text-sm"
                  />
                  <ButtonEditor
                    buttons={editingNode.buttons || []}
                    onChange={(buttons) => setEditingNode({ ...editingNode, buttons })}
                  />
                </>
              )}
              {editingNode.type === "form" && (
                <FormFieldEditor
                  fields={editingNode.form_fields || []}
                  onChange={(form_fields) => setEditingNode({ ...editingNode, form_fields })}
                />
              )}
              {editingNode.type === "delay" && (
                <div>
                  <Label className="text-sm font-medium text-slate-700">Delay in seconds</Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={editingNode.delay_seconds || 5}
                    onChange={(event) =>
                      setEditingNode({ ...editingNode, delay_seconds: Number(event.target.value) || 5 })
                    }
                    className="mt-1.5 rounded-xl border-black/10 text-sm"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-xl"
              onClick={() => {
                updateNode(editingNode.id, editingNode);
                setEditDialogOpen(false);
                setEditingNode(null);
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function ButtonEditor({ buttons, onChange }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-slate-700">Buttons</Label>
      {buttons.map((button) => (
        <div key={button.id} className="flex items-start gap-2 rounded-xl border border-black/8 bg-slate-50 p-3">
          <div className="flex-1 space-y-2">
            <Input
              value={button.title}
              onChange={(event) =>
                onChange(buttons.map((item) => (item.id === button.id ? { ...item, title: event.target.value } : item)))
              }
              placeholder="Button text"
              className="rounded-lg border-black/10 bg-white text-sm"
            />
            <div className="flex gap-2">
              <select
                value={button.type}
                onChange={(event) =>
                  onChange(buttons.map((item) => (item.id === button.id ? { ...item, type: event.target.value } : item)))
                }
                className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                <option value="url">URL Link</option>
                <option value="postback">Quick Reply</option>
              </select>
              <Input
                value={button.type === "url" ? button.url || "" : button.payload || ""}
                onChange={(event) =>
                  onChange(
                    buttons.map((item) =>
                      item.id === button.id
                        ? button.type === "url"
                          ? { ...item, url: event.target.value }
                          : { ...item, payload: event.target.value }
                        : item
                    )
                  )
                }
                placeholder={button.type === "url" ? "https://..." : "Payload"}
                className="flex-1 rounded-lg border-black/10 bg-white text-sm"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => onChange(buttons.filter((item) => item.id !== button.id))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg border-dashed"
        onClick={() => onChange([...buttons, { id: generateId(), type: "url", title: "", url: "" }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Button
      </Button>
    </div>
  );
}

function FormFieldEditor({ fields, onChange }) {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-slate-700">Lead Form Fields</Label>
      {fields.map((field) => (
        <div key={field.id} className="flex items-start gap-2 rounded-xl border border-black/8 bg-slate-50 p-3">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(event) =>
                  onChange(fields.map((item) => (item.id === field.id ? { ...item, type: event.target.value } : item)))
                }
                className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm text-slate-700"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="number">Number</option>
              </select>
              <Input
                value={field.label}
                onChange={(event) =>
                  onChange(fields.map((item) => (item.id === field.id ? { ...item, label: event.target.value } : item)))
                }
                placeholder="Field label"
                className="rounded-lg border-black/10 bg-white text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={field.required}
                onChange={(event) =>
                  onChange(
                    fields.map((item) => (item.id === field.id ? { ...item, required: event.target.checked } : item))
                  )
                }
                className="rounded"
              />
              Required field
            </label>
          </div>
          <Button variant="ghost" size="icon" className="text-red-600" onClick={() => onChange(fields.filter((item) => item.id !== field.id))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg border-dashed"
        onClick={() => onChange([...fields, { id: generateId(), type: "text", label: "", required: true }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}
