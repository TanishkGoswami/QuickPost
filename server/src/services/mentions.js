/**
 * Resolves platform-aware mentions like {{MENTION_SELF}}
 * @param {string} content - The post content with tokens
 * @param {string} platform - The target platform (instagram, threads, x, etc.)
 * @param {Object} tokens - The user's platform tokens containing the username
 * @returns {string} - The processed content
 */
export function resolveMentions(content, platform, tokens) {
  if (!content) return content;

  let resolved = content;

  // 1. Resolve {{MENTION_SELF}}
  const username = tokens?.username || tokens?.handle || tokens?.screen_name || tokens?.bluesky_handle;
  
  if (username) {
    const prefix = (platform === 'facebook' || platform === 'linkedin' || platform === 'youtube') ? '' : '@';
    resolved = resolved.replace(/{{MENTION_SELF}}/gi, `${prefix}${username}`);
  } else {
    resolved = resolved.replace(/{{MENTION_SELF}}/gi, '');
  }

  // 2. Resolve {{MENTION_TEAM}} (Future proofing)
  resolved = resolved.replace(/{{MENTION_TEAM}}/gi, '');

  // 3. Resolve {{MENTION_CLIENT}} (Future proofing)
  resolved = resolved.replace(/{{MENTION_CLIENT}}/gi, '');

  // Trim extra spaces caused by multiple replacements or empty tokens
  return resolved.replace(/\s+/g, ' ').trim();
}
