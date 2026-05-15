import { Clock, CreditCard, FileText, GripVertical, Image, Layers, MousePointer, Plus, Trash2, Type, X } from "lucide-react";
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
  { type: "text", label: "Text Message", icon: Type, description: "Send a simple text message" },
  { type: "image", label: "Image", icon: Image, description: "Send an image with optional text" },
  { type: "card", label: "Card", icon: CreditCard, description: "Rich card with image, title, and buttons" },
  { type: "carousel", label: "Carousel", icon: Layers, description: "Multiple cards in a swipeable carousel" },
  { type: "buttons", label: "Buttons", icon: MousePointer, description: "Quick reply buttons or links" },
  { type: "form", label: "Lead Form", icon: FileText, description: "Capture lead information" },
  { type: "delay", label: "Delay", icon: Clock, description: "Wait before sending next message" },
];

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
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Response Flow</CardTitle>
        <p className="text-sm text-muted-foreground">Build the message sequence sent when this automation triggers.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <Label>Opening Message</Label>
            <p className="text-xs text-muted-foreground">Send a welcome message before the main flow</p>
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
          />
        )}

        <div className="space-y-3">
          {responseFlow.nodes.map((node) => (
            <div key={node.id} className="flex items-center gap-2 rounded-lg border bg-white p-3">
              <button className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {(() => {
                    const Icon = nodeTypes.find((item) => item.type === node.type)?.icon || Type;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium capitalize">{node.type}</p>
                  <p className="truncate text-xs text-muted-foreground">{node.content || node.card_title || `${node.buttons?.length || node.form_fields?.length || 0} items`}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
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
                  className="text-destructive"
                  onClick={() => onChange({ ...responseFlow, nodes: responseFlow.nodes.filter((item) => item.id !== node.id) })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button variant="outline" className="w-full border-dashed" onClick={() => setShowNodePicker(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Response
        </Button>
      </CardContent>

      <Dialog open={showNodePicker} onOpenChange={setShowNodePicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Response Element</DialogTitle>
            <DialogDescription>Choose what to send next in your automation flow.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-4">
            {nodeTypes.map((nodeType) => (
              <button
                key={nodeType.type}
                className="rounded-lg border p-4 text-center transition-colors hover:border-primary hover:bg-primary/5"
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
                <nodeType.icon className="mx-auto h-6 w-6 text-primary" />
                <div className="mt-2 text-sm font-medium">{nodeType.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{nodeType.description}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize">Edit {editingNode?.type} Node</DialogTitle>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4 py-4">
              {editingNode.type === "text" && (
                <div>
                  <Label>Message Content</Label>
                  <Textarea value={editingNode.content || ""} onChange={(event) => setEditingNode({ ...editingNode, content: event.target.value })} rows={4} className="mt-2" />
                </div>
              )}
              {editingNode.type === "image" && (
                <>
                  <div>
                    <Label>Image URL</Label>
                    <Input value={editingNode.image_url || ""} onChange={(event) => setEditingNode({ ...editingNode, image_url: event.target.value })} className="mt-2" />
                  </div>
                  <div>
                    <Label>Caption</Label>
                    <Textarea value={editingNode.content || ""} onChange={(event) => setEditingNode({ ...editingNode, content: event.target.value })} rows={2} className="mt-2" />
                  </div>
                </>
              )}
              {(editingNode.type === "buttons" || editingNode.type === "card") && (
                <>
                  {editingNode.type === "card" && (
                    <>
                      <Input value={editingNode.card_image_url || ""} onChange={(event) => setEditingNode({ ...editingNode, card_image_url: event.target.value })} placeholder="Card image URL" />
                      <Input value={editingNode.card_title || ""} onChange={(event) => setEditingNode({ ...editingNode, card_title: event.target.value })} placeholder="Card title" />
                    </>
                  )}
                  <Textarea value={editingNode.content || editingNode.card_subtitle || ""} onChange={(event) => setEditingNode({ ...editingNode, [editingNode.type === "card" ? "card_subtitle" : "content"]: event.target.value })} placeholder="Message or subtitle" />
                  <ButtonEditor buttons={editingNode.buttons || []} onChange={(buttons) => setEditingNode({ ...editingNode, buttons })} />
                </>
              )}
              {editingNode.type === "form" && (
                <FormFieldEditor fields={editingNode.form_fields || []} onChange={(form_fields) => setEditingNode({ ...editingNode, form_fields })} />
              )}
              {editingNode.type === "delay" && (
                <div>
                  <Label>Delay in seconds</Label>
                  <Input type="number" min={1} max={60} value={editingNode.delay_seconds || 5} onChange={(event) => setEditingNode({ ...editingNode, delay_seconds: Number(event.target.value) || 5 })} className="mt-2" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                updateNode(editingNode.id, editingNode);
                setEditDialogOpen(false);
                setEditingNode(null);
              }}
            >
              Save
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
      <Label>Buttons</Label>
      {buttons.map((button) => (
        <div key={button.id} className="flex items-start gap-2 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <Input value={button.title} onChange={(event) => onChange(buttons.map((item) => (item.id === button.id ? { ...item, title: event.target.value } : item)))} placeholder="Button text" />
            <div className="flex gap-2">
              <select
                value={button.type}
                onChange={(event) => onChange(buttons.map((item) => (item.id === button.id ? { ...item, type: event.target.value } : item)))}
                className="rounded-md border px-2 py-1 text-sm"
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
                className="flex-1"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onChange(buttons.filter((item) => item.id !== button.id))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...buttons, { id: generateId(), type: "url", title: "", url: "" }])}>
        <Plus className="mr-2 h-4 w-4" />
        Add Button
      </Button>
    </div>
  );
}

function FormFieldEditor({ fields, onChange }) {
  return (
    <div className="space-y-3">
      <Label>Lead Form Fields</Label>
      {fields.map((field) => (
        <div key={field.id} className="flex items-start gap-2 rounded-lg border p-3">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <select
                value={field.type}
                onChange={(event) => onChange(fields.map((item) => (item.id === field.id ? { ...item, type: event.target.value } : item)))}
                className="rounded-md border px-2 py-1 text-sm"
              >
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="number">Number</option>
              </select>
              <Input value={field.label} onChange={(event) => onChange(fields.map((item) => (item.id === field.id ? { ...item, label: event.target.value } : item)))} placeholder="Field label" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={field.required} onChange={(event) => onChange(fields.map((item) => (item.id === field.id ? { ...item, required: event.target.checked } : item)))} />
              Required
            </label>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onChange(fields.filter((item) => item.id !== field.id))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...fields, { id: generateId(), type: "text", label: "", required: true }])}>
        <Plus className="mr-2 h-4 w-4" />
        Add Field
      </Button>
    </div>
  );
}
