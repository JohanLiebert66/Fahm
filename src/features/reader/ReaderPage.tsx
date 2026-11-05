import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import type { FahmDatabase } from '../../storage/db';
import { useReaderData } from './useReaderData';
import { localizedContent } from './localizedContent';
import { ReaderScreen } from './ReaderScreen';
import type { AssetUrlProvider } from './readerData';

interface ReaderPageProps { db?: FahmDatabase; windowSize?: number; assetProvider?: AssetUrlProvider }

export function ReaderPage({ db, windowSize, assetProvider }: ReaderPageProps) {
  const { packId, textId } = useParams();
  const { t, i18n } = useTranslation();
  const loaded = useReaderData(db, packId, textId);
  return <section className="w-full max-w-4xl space-y-4 text-start">
    <h2 className="text-2xl font-bold">{t('readWithMe')}</h2>
    {!loaded ? <p role="status">{t('reader.loading')}</p>
      : 'error' in loaded ? <p role="alert">{t('reader.error')}</p>
      : packId && textId && (!loaded.data.packs[0] || !loaded.data.texts[0])
        ? <p role="alert">{t('reader.missing')} <Link to="/read" className="inline-flex min-h-[48px] items-center underline">{t('reader.back')}</Link></p>
      : packId && textId && loaded.data.packs[0] && loaded.data.texts[0]
        ? <ReaderScreen key={`${packId}/${textId}`} pack={loaded.data.packs[0].meta}
          text={loaded.data.texts[0]} data={loaded.data} windowSize={windowSize}
          assets={assetProvider ?? loaded.assets} />
      : <div className="grid sm:grid-cols-2 gap-4">
        {loaded.data.texts.map(text => {
          const pack = loaded.data.packs.find(p => p.id === text.packId)!;
          const packTitle = localizedContent(pack.meta.title, i18n.language, pack.meta.lang)?.value;
          const textTitle = localizedContent(text.title, i18n.language, pack.meta.lang)?.value;
          return <Link key={`${pack.id}/${text.id}`} to={`/read/${encodeURIComponent(pack.id)}/${encodeURIComponent(text.id)}`}
            aria-label={`${packTitle} ${textTitle}`}
            className="min-h-[48px] min-w-[48px] rounded-2xl border border-indigo-200 bg-indigo-50 p-6 space-y-2 text-start focus-visible:ring-2 focus-visible:ring-indigo-500">
            <span className="block text-lg"><bdi>{localizedContent(pack.meta.title, i18n.language, pack.meta.lang)?.value}</bdi></span>
            <span className="block text-xl font-bold"><bdi>{localizedContent(text.title, i18n.language, pack.meta.lang)?.value}</bdi></span>
          </Link>;
        })}
        {!loaded.data.texts.length && <p role="status">{t('reader.empty')}</p>}
      </div>}
  </section>;
}
