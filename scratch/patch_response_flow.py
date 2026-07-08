import re

# 1. Update ResponseFlowBuilder.jsx to accept hideHeader
file1 = "client/src/features/autodm/ResponseFlowBuilder.jsx"
with open(file1, 'r', encoding='utf-8') as f:
    content1 = f.read()

# Add hideHeader prop
content1 = content1.replace("function ResponseFlowBuilder({ responseFlow, onChange, step }) {", "function ResponseFlowBuilder({ responseFlow, onChange, step, hideHeader }) {")

# Conditionally render CardHeader
content1 = content1.replace(
    '<CardHeader className="border-b border-black/10 bg-white">',
    '{!hideHeader && (\n        <CardHeader className="border-b border-black/10 bg-white">'
)
content1 = content1.replace(
    '</CardHeader>',
    '</CardHeader>\n      )}'
)
# Make Card borderless if hideHeader is true
content1 = content1.replace(
    '<Card className="overflow-hidden rounded-lg border-black/10 shadow-sm">',
    '<Card className={`overflow-hidden ${hideHeader ? "border-0 shadow-none bg-transparent" : "rounded-lg border-black/10 shadow-sm"}`}>'
)

with open(file1, 'w', encoding='utf-8') as f:
    f.write(content1)
print("Patched ResponseFlowBuilder.jsx")

# 2. Update AutomationEditorPage.jsx
file2 = "client/src/pages/auto-dm/AutomationEditorPage.jsx"
with open(file2, 'r', encoding='utf-8') as f:
    content2 = f.read()

# Make sure ResponseFlowBuilder is imported
if "import ResponseFlowBuilder from" not in content2:
    content2 = content2.replace(
        "import { KeywordInput } from '../../features/autodm/KeywordInput';",
        "import { KeywordInput } from '../../features/autodm/KeywordInput';\nimport ResponseFlowBuilder from '../../features/autodm/ResponseFlowBuilder';"
    )

# Replace the static textarea block with ResponseFlowBuilder
pattern = re.compile(r'<div className="space-y-4 p-5">\s*<Textarea.*?</div>\s*</div>\s*</div>\s*</div>', re.DOTALL)

replacement = """<div className="p-0">
                  <ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} step={2} hideHeader={true} />
                </div>
              </div>
            </div>
          </div>"""
          
content2 = pattern.sub(replacement, content2)

with open(file2, 'w', encoding='utf-8') as f:
    f.write(content2)
print("Patched AutomationEditorPage.jsx")
