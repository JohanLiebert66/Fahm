import { useEffect, useMemo, useState } from 'react';
import type { AssetUrlProvider } from './readerData';

export function useSelectedImage(provider: AssetUrlProvider, packId: string,
  assetId?: string, selectionKey?: string) {
  const request = useMemo(() => ({ provider, packId, assetId, selectionKey }),
    [provider, packId, assetId, selectionKey]);
  const [loaded, setLoaded] = useState<{ request: typeof request; url: string }>();
  useEffect(() => {
    if (!request.assetId) return;
    let active = true;
    let ownedUrl: string | undefined;
    void request.provider.getUrl(request.packId, request.assetId).then(url => {
      if (!url) return;
      if (!active) { request.provider.revokeUrl(url); return; }
      ownedUrl = url;
      setLoaded({ request, url });
    }).catch(() => { /* Missing/unavailable images keep the placeholder. */ });
    return () => {
      active = false;
      if (ownedUrl) request.provider.revokeUrl(ownedUrl);
    };
  }, [request]);
  return loaded?.request === request ? loaded.url : undefined;
}
