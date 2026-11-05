import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ExplanationResult } from '../../core/reader/buildExplanation';
import type { StorageResult } from '../../storage/tx';

const errorKeys = { emptyTerm: 'reader.addEmptyTerm', duplicateTerm: 'reader.addDuplicateTerm',
  overlap: 'reader.addOverlap', invalid: 'reader.addInvalid' } as const;

export interface AddExplanationPanelProps {
  word: string;
  packLanguage: string;
  packDirection: 'ltr' | 'rtl';
  onSave?: (values: { language: string; meaning: string }) => Promise<StorageResult<ExplanationResult>>;
  onCancel: () => void;
  onSaved: () => void;
}

export function AddExplanationPanel({ word, packLanguage, packDirection, onSave, onCancel, onSaved }: AddExplanationPanelProps) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const [language, setLanguage] = useState(packLanguage);
  const [meaning, setMeaning] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const languages = [...new Set([packLanguage, ...Object.keys(i18n.options.resources ?? {})])];
  const control = 'min-h-[48px] min-w-[48px] rounded-xl border p-3 text-start focus-visible:ring-2 focus-visible:ring-indigo-500';
  return <form aria-labelledby={`${id}-title`} aria-busy={busy} className="space-y-3 rounded-2xl border p-4 text-start"
    onSubmit={async event => {
      event.preventDefault();
      if (!onSave || pending.current || !meaning.trim()) return;
      pending.current = true;
      setBusy(true);
      setError('');
      try {
        const result = await onSave({ language, meaning });
        if (!result.ok) setError(result.error.code === 'StorageUnavailable' ? t('reader.addUnavailable')
          : `${t(result.error.messageKey)} ${t(result.error.nextStepKey)}`);
        else if (!result.value.ok) setError(t(errorKeys[result.value.errors[0] ?? 'invalid']));
        else onSaved();
      } catch {
        setError(`${t('storage.error.write')} ${t('storage.action.retryOrBackup')}`);
      } finally {
        pending.current = false;
        setBusy(false);
      }
    }}>
    <h4 id={`${id}-title`} className="text-lg font-bold">{t('reader.addTitle')}</h4>
    <p><span>{t('reader.addWord')}: </span><bdi lang={packLanguage} dir={packDirection}>{word}</bdi></p>
    <p>{t('reader.addAppliesToAll')}</p>
    {(!onSave || error) && <p role="alert">{!onSave ? t('reader.addUnavailable') : error}</p>}
    <label className="block space-y-1">
      <span>{t('reader.addMeaning')}</span>
      <textarea required value={meaning} onChange={event => setMeaning(event.target.value)} disabled={busy}
        lang={language} dir={i18n.dir(language)} className={`${control} block w-full`} />
    </label>
    <label className="block space-y-1">
      <span>{t('reader.addLanguage')}</span>
      <select value={language} onChange={event => setLanguage(event.target.value)} disabled={busy} className={control}>
        {languages.map(value => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
    <div className="flex flex-wrap gap-3">
      <button type="submit" disabled={!onSave || busy || !meaning.trim()} className={control}>{t('reader.addSave')}</button>
      <button type="button" disabled={busy} onClick={onCancel} className={control}>{t('reader.addCancel')}</button>
    </div>
  </form>;
}
