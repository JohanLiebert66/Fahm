import { useEffect, useMemo, useState } from 'react';
import type { FahmDatabase } from '../../storage/db';
import { createDatabase, createAssetUrlProvider, loadReaderData,
  type AssetUrlProvider, type ReaderData } from './readerData';

type LoadState = { data: ReaderData; assets: AssetUrlProvider } | { error: true };

export function useReaderData(db?: FahmDatabase, packId?: string, textId?: string) {
  const request = useMemo(() => ({ db, packId, textId }), [db, packId, textId]);
  const [loaded, setLoaded] = useState<{ request: typeof request; value: LoadState }>();
  useEffect(() => {
    const connection = request.db ?? createDatabase();
    let active = true;
    void loadReaderData(connection, request.packId, request.textId).then(data => {
      if (active) setLoaded({ request,
        value: { data, assets: createAssetUrlProvider(connection) } });
    }).catch(() => {
      if (active) setLoaded({ request, value: { error: true } });
    });
    return () => { active = false; if (!request.db) connection.close(); };
  }, [request]);
  return loaded?.request === request ? loaded.value : undefined;
}
