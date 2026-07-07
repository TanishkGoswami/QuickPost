import re

file2 = "client/src/pages/auto-dm/AutomationEditorPage.jsx"
with open(file2, 'r', encoding='utf-8') as f:
    content2 = f.read()

pattern = re.compile(r'\{\/\* Section 3: Two-step DM flow \*\/\}.*?</div>\s*</div>\s*\{\/\* Right Canvas - Mobile Preview \*\/\}', re.DOTALL)
replacement = """<ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} step={responseStep} />
          
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
      </div>

      {/* Right Canvas - Mobile Preview */}"""

new_content = pattern.sub(replacement, content2)
with open(file2, 'w', encoding='utf-8') as f:
    f.write(new_content)
    print("Patched successfully!")
