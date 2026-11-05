import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ImageBox({ url, term }: { url?: string; term?: string }) {
  const { t } = useTranslation();
  const [failedUrl, setFailedUrl] = useState<string>();
  return <div className="min-h-48 rounded-2xl border border-slate-200 bg-slate-50 p-4 grid place-items-center">
    {url && failedUrl !== url
      ? <img src={url} alt={term ?? ''} className="max-h-64 max-w-full w-auto h-auto object-contain"
        onError={() => setFailedUrl(url)} />
      : <p className="text-slate-500">{t('reader.imagePlaceholder')}</p>}
  </div>;
}
