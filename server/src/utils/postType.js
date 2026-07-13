const VALID_POST_TYPES = new Set(['post', 'story', 'reel']);

export function normalizePostType(value) {
  const type = String(value || '').toLowerCase();
  return VALID_POST_TYPES.has(type) ? type : '';
}

function typeFromPreset(platformData = {}) {
  const preset = String(
    platformData.selectedPostSizePreset ||
    platformData.selected_post_size_preset ||
    platformData.parsedPresets?.instagram ||
    ''
  ).toLowerCase();
  if (preset.includes('story')) return 'story';
  if (preset.includes('reel')) return 'reel';
  return '';
}

export function resolvePublishPostType({ hasInstagramChannel, postType, platformData }) {
  const bodyType = normalizePostType(postType);
  const instagramType = normalizePostType(platformData?.instagram?.type);
  const presetType = typeFromPreset(platformData);
  
  let resolvedType = bodyType || 'post';
  
  // If the global postType is explicitly story or reel, use it
  if (bodyType === 'story' || bodyType === 'reel') {
    resolvedType = bodyType;
  } else if (hasInstagramChannel && (instagramType === 'story' || instagramType === 'reel')) {
    // If Instagram explicit type exists, it takes precedence
    resolvedType = instagramType;
  } else if (presetType === 'story' || presetType === 'reel') {
    // Otherwise, fallback to the visual preset
    resolvedType = presetType;
  }

  // Temporary diagnostic logging
  try {
    const fs = require('fs');
    fs.appendFileSync(
      'postType_debug.log',
      `\n[${new Date().toISOString()}] resolvePublishPostType:\nINPUT: bodyType=${bodyType}, instagramType=${instagramType}, presetType=${presetType}, hasInstagram=${hasInstagramChannel}\nPLATFORMDATA: ${JSON.stringify(platformData)}\nOUTPUT: ${resolvedType}\n`
    );
  } catch(e) {}
  
  return resolvedType;
}

