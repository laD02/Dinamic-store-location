// app/utils/embedStore.ts
export async function hasStoreLocatorEmbedEnabled(
  session: any,
  embedBlockHandle: string
): Promise<boolean> {
  try {
    const shopDomain = session.shop;
    const accessToken = session.accessToken;

    // Step 1: Get main theme
    const themesResponse = await fetch(
      `https://${shopDomain}/admin/api/2025-01/themes.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!themesResponse.ok) {
      return false;
    }

    const themesData = await themesResponse.json();
    const mainTheme = themesData.themes?.find((t: any) => t.role === 'main');

    if (!mainTheme) {
      return false;
    }

    // Step 2: Get settings_data.json
    const assetResponse = await fetch(
      `https://${shopDomain}/admin/api/2025-01/themes/${mainTheme.id}/assets.json?asset[key]=config/settings_data.json`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!assetResponse.ok) {
      return false;
    }

    const assetData = await assetResponse.json();

    if (!assetData.asset?.value) {
      return false;
    }

    const settings = JSON.parse(assetData.asset.value);
    
    // Check app_embeds
    const appEmbeds: Record<string, { enabled?: boolean }> = 
      settings?.current?.app_embeds || {};
    
    // Also check blocks (some themes store app embeds here)
    const blocks: Record<string, any> = settings?.current?.blocks || {};

    // Search in app_embeds
    for (const [key, value] of Object.entries(appEmbeds)) {
      if (
        key.includes(embedBlockHandle) ||
        key.includes(`/blocks/${embedBlockHandle}`) ||
        key.includes(`-${embedBlockHandle}-`) ||
        key.endsWith(`-${embedBlockHandle}`)
      ) {
        const isEnabled = value?.enabled === true;
        return isEnabled;
      }
    }

    // Search in blocks (fallback)
    for (const [key, value] of Object.entries(blocks)) {
      const blockType = value?.type || '';
      if (
        key.includes(embedBlockHandle) ||
        blockType.includes(embedBlockHandle) ||
        blockType.includes(`/blocks/${embedBlockHandle}`)
      ) {
        const isEnabled = value?.disabled !== true;
        return isEnabled;
      }
    }
    return false;

  } catch (err) {
    return false;
  }
}