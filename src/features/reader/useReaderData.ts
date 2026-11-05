import { useEffect, useMemo, useState } from 'react';
import type { FahmDatabase } from '../../storage/db';
import { addExplanation, type AddExplanationRequest } from '../../storage/addExplanation';
import { storageFailure } from '../../storage/tx';
import { createDatabase, createAssetUrlProvider, loadReaderData,
  type AssetUrlProvider, type ReaderData } from './readerData';

export type ReaderExplanationSave = (values: Omit<AddExplanationRequest, 'packId' | 'textId'>)
  => ReturnType<typeof addExplanation>;
type LoadState = { data: ReaderData; assets: AssetUrlProvider; saveExplanation: ReaderExplanationSave } | { error: true };

export function useReaderData(db?: FahmDatabase, packId?: string, textId?: string) {
  const request = useMemo(() => ({ db, packId, textId }), [db, packId, textId]);
  const [loaded, setLoaded] = useState<{ request: typeof request; value: LoadState }>();
  useEffect(() => {
    const connection = request.db ?? createDatabase();
    let active = true;
    const saveExplanation: ReaderExplanationSave = async values => {
      if (!request.packId || !request.textId) return storageFailure('InvalidData');
      const { packId, textId } = request;
      const result = await addExplanation(connection, { ...values, packId, textId });
      if (active && result.ok && result.value.ok) {
        const { item, annotation } = result.value.value;
        setLoaded(previous => previous?.request === request && 'data' in previous.value
          ? { request, value: { ...previous.value, data: { ...previous.value.data,
            items: [...previous.value.data.items, { ...item, packId }],
            annotations: [...previous.value.data.annotations, { ...annotation, packId, textId }],
          } } } : previous);
      }
      return result;
    };
    void loadReaderData(connection, request.packId, request.textId).then(data => {
      if (active) setLoaded({ request,
        value: { data, assets: createAssetUrlProvider(connection), saveExplanation } });
    }).catch(() => {
      if (active) setLoaded({ request, value: { error: true } });
    });
    return () => { active = false; if (!request.db) connection.close(); };
  }, [request]);
  return loaded?.request === request ? loaded.value : undefined;
}
