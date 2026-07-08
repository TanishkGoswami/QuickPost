import re
file2 = "client/src/pages/auto-dm/AutomationEditorPage.jsx"
with open(file2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = re.sub(r'\s*const firstResponseNode = .*?\n', '\n', content2)
content2 = re.sub(r'\s*const updateFirstResponseNode = .*?\}\s*;\s*\n', '\n', content2, flags=re.DOTALL)

with open(file2, 'w', encoding='utf-8') as f:
    f.write(content2)
    print("Cleaned!")
