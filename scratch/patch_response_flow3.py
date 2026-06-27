import re

file2 = "client/src/pages/auto-dm/AutomationEditorPage.jsx"
with open(file2, 'r', encoding='utf-8') as f:
    content2 = f.read()

# Make sure ResponseFlowBuilder is imported
if "import ResponseFlowBuilder from" not in content2:
    content2 = content2.replace(
        "import { KeywordInput } from '../../features/autodm/KeywordInput';",
        "import { KeywordInput } from '../../features/autodm/KeywordInput';\nimport ResponseFlowBuilder from '../../features/autodm/ResponseFlowBuilder';"
    )

# Replace the specific Textarea block inside "After they tap the button"
# I will match specifically the div with className="space-y-4 p-5" under "After they tap the button"
# and replace it with ResponseFlowBuilder

pattern = re.compile(
    r'(<p className="font-semibold text-gray-900">After they tap the button</p>\s*'
    r'<p className="text-xs font-medium text-gray-500">Shown after the user sends .*?</p>\s*'
    r'</div>\s*</div>\s*</div>\s*)'
    r'<div className="space-y-4 p-5">.*?</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>', 
    re.DOTALL
)

replacement = r"""\1<div className="p-0">
                  <ResponseFlowBuilder responseFlow={responseFlow} onChange={setResponseFlow} step={2} hideHeader={true} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>"""

new_content2 = pattern.sub(replacement, content2)

with open(file2, 'w', encoding='utf-8') as f:
    f.write(new_content2)
    print("Patched successfully!")
