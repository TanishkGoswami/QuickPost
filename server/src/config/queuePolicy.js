export function findFullScheduledChannel(requestedChannels, broadcasts, perChannelLimit) {
  const counts = Object.fromEntries(requestedChannels.map((channel) => [channel, 0]));
  for (const broadcast of broadcasts) {
    for (const channel of broadcast.selected_channels || []) {
      if (Object.prototype.hasOwnProperty.call(counts, channel)) counts[channel] += 1;
    }
  }
  return requestedChannels.find((channel) => counts[channel] >= perChannelLimit);
}
