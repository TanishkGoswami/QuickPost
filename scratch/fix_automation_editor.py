file2 = "client/src/pages/auto-dm/AutomationEditorPage.jsx"
with open(file2, "r", encoding="utf-8") as f:
    content = f.read()

replacement = """                <div className="ml-7 space-y-2">
                    <KeywordInput 
                        keywords={keywords}
                        onChange={setKeywords}
                        caseSensitive={isCaseSensitive}
                        onCaseSensitiveChange={setIsCaseSensitive}
                    />
                </div>
                
                {/* Public comment reply */}
                <div className="ml-7 mt-6 border-t border-black/5 pt-5">
                   <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label className="text-sm font-semibold text-gray-800">Public Comment Reply</Label>
                        <p className="text-xs text-gray-500 mt-1">Reply to the triggering comment publicly.</p>
                      </div>
                      <Switch 
                          checked={commentReplyEnabled} 
                          onCheckedChange={setCommentReplyEnabled} 
                      />
                   </div>
                   {commentReplyEnabled && (
                      <div className="mt-3">
                          <Textarea 
                              value={commentReplyText}
                              onChange={(e) => setCommentReplyText(e.target.value)}
                              placeholder="Sent it to your DM. Tap SETUP to continue."
                              className="w-full text-sm resize-none rounded-lg border-black/10 min-h-[60px]"
                          />
                      </div>
                   )}
                </div>"""

content = content.replace(
    """                <div className="ml-7 space-y-2">
                    <KeywordInput 
                        keywords={keywords}
                        onChange={setKeywords}
                        caseSensitive={isCaseSensitive}
                        onCaseSensitiveChange={setIsCaseSensitive}
                    />
                </div>""",
    replacement
)

with open(file2, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed AutomationEditorPage")
