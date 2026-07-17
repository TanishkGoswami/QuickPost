import re
import sys

def main():
    file_path = "supabase/functions/_shared/automationEngine.ts"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    target = """      if (action.type === 'template') {
        if (usePrivateReply && payload.eventId) {
          return await sendInstagramPrivateReplyGenericTemplate(
            webhookIgIdForSend,
            payload.eventId,
            action.elements,
            tokens.pageAccessToken,
            payload.requestId
          );
        }

        return await sendInstagramGenericTemplate("""

    replacement = """      if (action.type === 'template') {
        if (usePrivateReply && payload.eventId) {
          const result = await sendInstagramPrivateReplyGenericTemplate(
            webhookIgIdForSend,
            payload.eventId,
            action.elements,
            tokens.pageAccessToken,
            payload.requestId
          );

          // Meta API rejects generic templates/buttons for Private Replies to comments.
          // Fall back to sending plain text with the button text appended as an instruction.
          if (!result.ok) {
            logInfo('Template failed for Private Reply, falling back to text with instruction', {
              requestId: payload.requestId,
              error: result.error,
            });

            const fallbackText = action.elements
              .map(
                (el) =>
                  `${el.title}${el.subtitle ? `\\n${el.subtitle}` : ''}${
                    el.buttons?.length
                      ? `\\n\\n👉 Reply with: "${el.buttons[0].payload || el.buttons[0].title}"`
                      : ''
                  }`
              )
              .join('\\n\\n---\\n\\n');

            return await sendInstagramPrivateReplyPayload(
              webhookIgIdForSend,
              payload.eventId,
              fallbackText,
              tokens.pageAccessToken,
              payload.requestId
            );
          }

          return result;
        }

        return await sendInstagramGenericTemplate("""

    if target not in content:
        print("Error: Target not found.")
        sys.exit(1)

    content = content.replace(target, replacement)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("Successfully patched automationEngine.ts!")

if __name__ == "__main__":
    main()
