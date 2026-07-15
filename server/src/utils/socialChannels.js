export const MULTI_ACCOUNT_PROVIDERS = [
  'facebook',
  'youtube',
  'pinterest',
  'bluesky',
  'linkedin',
  'mastodon',
  'threads',
  'x',
  'reddit',
  'googleBusiness',
];

export function accountArrayKey(provider) {
  return `${provider}Accounts`;
}

export function makeAccountChannel(provider, accountId) {
  return `${provider}:${accountId}`;
}

export function resolveSocialPublishChannels(provider, channels = [], accounts = []) {
  const requested = (channels || []).map(String).filter(
    (channel) => channel === provider || channel.startsWith(`${provider}:`)
  );
  if (requested.length === 0) return [];

  const connected = accounts || [];
  if (connected.length === 0) {
    throw new Error(`No connected ${provider} account found. Reconnect/select the target account and try again.`);
  }

  const specificIds = requested
    .filter((channel) => channel.startsWith(`${provider}:`))
    .map((channel) => channel.slice(provider.length + 1))
    .filter(Boolean);

  const ids = specificIds.length > 0 ? specificIds : (() => {
    if (!requested.includes(provider)) return [];
    if (connected.length > 1) {
      throw new Error(`Multiple ${provider} accounts are connected. Select a specific ${provider} account.`);
    }
    return [String(connected[0].id)];
  })();

  const byId = new Map(connected.map((account) => [String(account.id), account]));
  const seenAccountIds = new Set();
  const resolved = [];

  for (const id of ids) {
    const account = byId.get(String(id));
    if (!account) throw new Error(`Selected ${provider} account is not connected.`);

    const identity = String(account.accountId || account.account_id || account.id);
    if (seenAccountIds.has(identity)) continue;
    seenAccountIds.add(identity);
    resolved.push({ ...account, channel: makeAccountChannel(provider, account.id) });
  }

  return resolved;
}

export function setAggregateResult(results, provider) {
  const entries = Object.entries(results)
    .filter(([platform]) => platform === provider || platform.startsWith(`${provider}:`))
    .map(([, result]) => result);
  if (!entries.length) return;
  results[provider] = entries.find((result) => result?.success) || entries[0];
  results[accountArrayKey(provider)] = entries;
}
