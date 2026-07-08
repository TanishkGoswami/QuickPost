import re

file_path = "supabase/functions/_shared/automationEngine.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add opening_button to ResponseFlow interface
content = content.replace(
    "  opening_message?: string;\n}",
    "  opening_message?: string;\n  opening_button?: string;\n}"
)

# 2. Modify the first if block for opening_message_enabled
target = """  if (flow.opening_message_enabled && cleanText(flow.opening_message)) {
    actions.push({
      type: 'text',
      text: renderMessageTemplate(cleanText(flow.opening_message), profile),
    });
  }"""
replacement = """  if (flow.opening_message_enabled && cleanText(flow.opening_message)) {
    actions.push({
      type: 'text',
      text: renderMessageTemplate(cleanText(flow.opening_message), profile),
      quickReplies: flow.opening_button ? buildQuickReplies([{ type: 'postback', title: flow.opening_button, payload: flow.opening_button } as any]) : undefined,
    });
  }"""

if target in content:
    content = content.replace(target, replacement)
else:
    print("Could not find the target block for the first opening_message check.")

# 3. Modify the second if block at the bottom
target2 = """  if (actions.length === 0 && cleanText(flow.opening_message)) {
    actions.push({
      type: 'text',
      text: renderMessageTemplate(cleanText(flow.opening_message), profile),
    });
  }"""
replacement2 = """  if (actions.length === 0 && cleanText(flow.opening_message)) {
    actions.push({
      type: 'text',
      text: renderMessageTemplate(cleanText(flow.opening_message), profile),
      quickReplies: flow.opening_button ? buildQuickReplies([{ type: 'postback', title: flow.opening_button, payload: flow.opening_button } as any]) : undefined,
    });
  }"""

if target2 in content:
    content = content.replace(target2, replacement2)
else:
    print("Could not find the target block for the second opening_message check.")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modified automationEngine.ts")
