export function resolveInstagramPublishChannels(channels = [], instagramAccounts = []) {
  const requested = [...new Set((channels || []).filter((channel) =>
    channel === 'instagram' || String(channel).startsWith('instagram:')
  ))];
  const accountIds = new Set((instagramAccounts || []).map((account) => String(account.id)));
  const specific = requested
    .filter((channel) => String(channel).startsWith('instagram:'))
    .map((channel) => String(channel).split(':')[1])
    .filter(Boolean);

  if (specific.length > 0) {
    const invalid = specific.find((id) => accountIds.size > 0 && !accountIds.has(id));
    if (invalid) {
      throw Object.assign(new Error('Selected Instagram account is disconnected. Refresh and select a connected account.'), {
        code: 'UNSUPPORTED_COMBINATION',
      });
    }
    return [...new Set(specific)].map((id) => `instagram:${id}`);
  }

  if (!requested.includes('instagram')) return [];
  if (accountIds.size > 1) {
    throw Object.assign(new Error('Select one specific Instagram account before publishing.'), {
      code: 'UNSUPPORTED_COMBINATION',
    });
  }
  if (accountIds.size === 1) return [`instagram:${[...accountIds][0]}`];
  return ['instagram'];
}
