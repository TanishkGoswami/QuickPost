import re
file1 = "client/src/features/autodm/ResponseFlowBuilder.jsx"
with open(file1, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the Opening Message block
pattern = re.compile(r'<div className="flex items-center justify-between gap-4 rounded-lg border border-black/10 bg-black/\[0\.02\] p-4">.*?</div>\s*\{responseFlow\?\.opening_message_enabled && \(\s*<div className="flex flex-col gap-3 rounded-lg border border-black/10 p-4">.*?</div>\s*\)\}\s*', re.DOTALL)
content = pattern.sub('', content)

# Restore the import
content = content.replace("import { Switch } from '@/components/ui/switch';\n", "")

with open(file1, 'w', encoding='utf-8') as f:
    f.write(content)
print("Undo complete")
