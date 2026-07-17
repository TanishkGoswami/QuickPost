import re

file_path = "supabase/functions/_shared/automationEngine.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target1 = """  if (flow.opening_message_enabled && cleanText(flow.opening_message)) {
    actions.push({
      type: 'text',
      text: renderMessageTemplate(cleanText(flow.opening_message), profile),
      quickReplies: flow.opening_button ? buildQuickReplies([{ type: 'postback', title: flow.opening_button, payload: flow.opening_button } as any]) : undefined,
    });
  }"""

replacement1 = """  if (flow.opening_message_enabled && cleanText(flow.opening_message)) {
    if (flow.opening_button) {
      const msgText = renderMessageTemplate(cleanText(flow.opening_message), profile);
      const element = buildTemplateElement(
        msgText,
        null,
        null,
        [{ type: 'postback', title: flow.opening_button, payload: flow.opening_button } as any]
      );
      if (element) {
        actions.push({ type: 'template', elements: [element] });
      } else {
        actions.push({ type: 'text', text: msgText });
      }
    } else {
      actions.push({
        type: 'text',
        text: renderMessageTemplate(cleanText(flow.opening_message), profile),
      });
    }
  }"""

target2 = """  if (actions.length === 0 && cleanText(flow.opening_message)) {
    actions.push({
      type: 'text',
      text: renderMessageTemplate(cleanText(flow.opening_message), profile),
      quickReplies: flow.opening_button ? buildQuickReplies([{ type: 'postback', title: flow.opening_button, payload: flow.opening_button } as any]) : undefined,
    });
  }"""

replacement2 = """  if (actions.length === 0 && cleanText(flow.opening_message)) {
    if (flow.opening_button) {
      const msgText = renderMessageTemplate(cleanText(flow.opening_message), profile);
      const element = buildTemplateElement(
        msgText,
        null,
        null,
        [{ type: 'postback', title: flow.opening_button, payload: flow.opening_button } as any]
      );
      if (element) {
        actions.push({ type: 'template', elements: [element] });
      } else {
        actions.push({ type: 'text', text: msgText });
      }
    } else {
      actions.push({
        type: 'text',
        text: renderMessageTemplate(cleanText(flow.opening_message), profile),
      });
    }
  }"""

if target1 in content:
    content = content.replace(target1, replacement1)
    print("Replaced target1")
else:
    print("target1 not found")
    
if target2 in content:
    content = content.replace(target2, replacement2)
    print("Replaced target2")
else:
    print("target2 not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
