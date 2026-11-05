import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Pack, Text } from '../../core/pack/types';
import type { LinkedToken } from '../../core/reader/linkTokens';
import { ExplainBox } from '../../ui/ExplainBox';
import { ImageBox } from '../../ui/ImageBox';
import { SegmentText } from './SegmentText';
import { localizedContent } from './localizedContent';
import type { AssetUrlProvider, ReaderData } from './readerData';
import { useSelectedImage } from './useSelectedImage';
import { AddExplanationPanel } from './AddExplanationPanel';
import type { ReaderExplanationSave } from './useReaderData';

export interface ReaderScreenProps {
  pack: Pack;
  text: Text;
  data: ReaderData;
  assets: AssetUrlProvider;
  windowSize?: number;
  teacherMode?: boolean;
  saveExplanation?: ReaderExplanationSave;
}

export function ReaderScreen({ pack, text, data, assets, windowSize = 1, teacherMode = false, saveExplanation }: ReaderScreenProps) {
  const { t, i18n } = useTranslation();
  const size = Number.isFinite(windowSize) ? Math.max(1, Math.min(3, Math.floor(windowSize))) : 1;
  const [position, setPosition] = useState(0);
  const [selected, setSelected] = useState<{ segmentId: string; token: LinkedToken }>();
  const last = Math.max(0, text.segments.length - size);
  const start = Math.min(position, last);
  const item = data.items.find(entry => entry.id === selected?.token.itemId);
  const image = item && data.bindings.filter(binding => binding.itemId === item.id && binding.role === 'image')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  const selectionKey = selected && `${selected.segmentId}/${selected.token.start}/${selected.token.end}`;
  const imageUrl = useSelectedImage(assets, pack.id, image?.assetId, selectionKey);
  const explanation = item && localizedContent(selected?.token.override?.explain ?? item.explain,
    i18n.language, pack.lang);
  function move(next: number) { setSelected(undefined); setPosition(next); }
  return <div className="space-y-6">
    <Link to="/read" className="inline-flex min-h-[48px] items-center underline">{t('reader.back')}</Link>
    <div lang={pack.lang} dir={pack.dir} className="space-y-4 rounded-2xl border border-slate-200 p-4 text-start">
      <h3 className="text-xl font-bold"><bdi>{localizedContent(text.title, i18n.language, pack.lang)?.value}</bdi></h3>
      {text.ref && <bdi dir="ltr" className="isolate inline-block text-sm text-slate-500">{text.ref}</bdi>}
      {text.segments.slice(start, start + size).map(segment => <SegmentText key={segment.id}
        segment={segment} items={data.items} annotations={data.annotations} teacherMode={teacherMode}
        selected={selected && { segmentId: selected.segmentId, start: selected.token.start }}
        onSelect={token => setSelected({ segmentId: segment.id, token })} />)}
    </div>
    <nav className="flex justify-between gap-4">
      <button type="button" disabled={start === 0} onClick={() => move(Math.max(0, start - 1))}
        className="min-h-[48px] min-w-[48px] rounded-xl border px-4 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500">
        {t('reader.previous')}
      </button>
      <button type="button" disabled={start >= last} onClick={() => move(Math.min(last, start + 1))}
        className="min-h-[48px] min-w-[48px] rounded-xl border px-4 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-indigo-500">
        {t('reader.next')}
      </button>
    </nav>
    {teacherMode && selected && !selected.token.itemId && selected.token.kind === 'word' &&
      <AddExplanationPanel key={selectionKey} word={selected.token.text} packLanguage={pack.lang} packDirection={pack.dir}
        onSave={saveExplanation && (values => saveExplanation({ ...values,
          segmentId: selected.segmentId, token: selected.token }))}
        onCancel={() => setSelected(undefined)}
        onSaved={() => setSelected(current => current === selected ? undefined : current)} />}
    <div dir={pack.dir} data-reader-boxes className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
      <ImageBox url={imageUrl} term={item?.term} />
      <ExplainBox term={item?.term} termLanguage={pack.lang} termDirection={pack.dir}
        explanation={explanation && { ...explanation, direction: i18n.dir(explanation.language) }} />
    </div>
    <button type="button" disabled aria-label={t('reader.audio')}
      className="min-h-[48px] min-w-[48px] rounded-xl border px-4 opacity-40">{t('reader.audio')}</button>
  </div>;
}
