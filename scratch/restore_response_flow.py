import re
import os

print("Starting to patch...")

# 1. Update ResponseFlowBuilder.jsx to include Opening Message
file1 = "client/src/features/autodm/ResponseFlowBuilder.jsx"
with open(file1, 'r', encoding='utf-8') as f:
    content1 = f.read()

opening_message_code = """
          <div className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-black/[0.02] p-4">
            <div className="flex min-w-0 items-center gap-3">
              <Pencil className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-medium text-[var(--ink)]">Opening Message</p>
                <p className="text-sm text-[var(--slate)]">Toggle on to edit and send a welcome message before the main flow.</p>
              </div>
            </div>
            <Switch
              checked={Boolean(responseFlow?.opening_message_enabled)}
              onCheckedChange={(checked) => onChange({ ...responseFlow, opening_message_enabled: checked })}
            />
          </div>

          {responseFlow?.opening_message_enabled && (
            <div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">
              <Textarea
                rows={2}
                value={responseFlow?.opening_message || ''}
                onChange={(event) => onChange({ ...responseFlow, opening_message: event.target.value })}
                placeholder="Hey there! I'm so happy you're here..."
                className="resize-none"
              />
              <Input
                value={responseFlow?.opening_button || ''}
                onChange={(event) => onChange({ ...responseFlow, opening_button: event.target.value })}
                placeholder="Button text (e.g. Send me the link)"
              />
            </div>
          )}
"""

if "Opening Message" not in content1:
    content1 = content1.replace(
        '<CardContent className="space-y-3 p-5">\n        <div className="space-y-3">',
        '<CardContent className="space-y-3 p-5">\n' + opening_message_code + '\n        <div className="space-y-3">'
    )
    
    # Also add import for Switch if missing
    if "Switch" not in content1:
        content1 = content1.replace("import { Badge }", "import { Switch } from '@/components/ui/switch';\nimport { Badge }")
        
    with open(file1, 'w', encoding='utf-8') as f:
        f.write(content1)
    print("Patched ResponseFlowBuilder.jsx")
else:
    print("ResponseFlowBuilder.jsx already has Opening Message")

# 2. Update AutomationEditorPage.jsx to remove custom sections and use ResponseFlowBuilder
file2 = "client/src/pages/auto-dm/AutomationEditorPage.jsx"
with open(file2, 'r', encoding='utf-8') as f:
    content2 = f.read()

# Replace from "Section 3:" down to the end of Section 4 (before the save button wrapper)
pattern = re.compile(r'\{\/\* Section 3: Two-step DM flow \*\/\}.*?(?=<div className="fixed bottom-0)', re.DOTALL)
replacement = """
          <ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} step={responseStep} />
          
          {isCommentTrigger && (
            <Card className="rounded-lg border-black/10 shadow-sm mb-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[22px] font-semibold text-[var(--ink)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141413] text-sm font-semibold text-white">
                    {commentStep}
                  </span>
                  Comment reply
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-black/[0.02] p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <MessageCircle className="h-4 w-4 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <p className="font-medium text-[var(--ink)]">Public Reply</p>
                      <p className="text-sm text-[var(--slate)]">Toggle on to automatically reply to the user's comment.</p>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(responseFlow?.public_reply_enabled)}
                    onCheckedChange={(checked) => setResponseFlow({ ...responseFlow, public_reply_enabled: checked })}
                  />
                </div>
                {responseFlow?.public_reply_enabled && (
                  <Textarea
                    rows={2}
                    value={responseFlow?.public_reply || ''}
                    onChange={(event) => setResponseFlow({ ...responseFlow, public_reply: event.target.value })}
                    placeholder="Sent you a DM!"
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
        """
        
new_content2 = pattern.sub(replacement, content2)
if new_content2 != content2:
    with open(file2, 'w', encoding='utf-8') as f:
        f.write(new_content2)
    print("Patched AutomationEditorPage.jsx")
else:
    print("AutomationEditorPage.jsx already patched or pattern not found")
