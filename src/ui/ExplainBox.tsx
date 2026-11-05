import { useTranslation } from 'react-i18next';

interface ExplainBoxProps {
  term?: string;
  termLanguage: string;
  termDirection: 'ltr' | 'rtl';
  explanation?: { language: string; direction: 'ltr' | 'rtl';
    value: { meaning: string; example?: string } };
}

function isolateTerm(text: string, term: string | undefined, language: string, direction: 'ltr' | 'rtl') {
  if (!term) return text;
  const parts = text.split(term);
  return parts.flatMap((part, index) => index === parts.length - 1 ? [part]
    : [part, <bdi key={index} lang={language} dir={direction}>{term}</bdi>]);
}

export function ExplainBox({ term, termLanguage, termDirection, explanation }: ExplainBoxProps) {
  const { t } = useTranslation();
  const embeddedTerm = explanation?.language === termLanguage ? undefined : term;
  return <div className="min-h-48 rounded-2xl border border-slate-200 bg-white p-4 space-y-3 text-start" aria-live="polite">
    {term && <h3 className="text-xl font-bold"><bdi lang={termLanguage} dir={termDirection}>{term}</bdi></h3>}
    {explanation ? <div lang={explanation.language} dir={explanation.direction} className="space-y-3 text-start">
      <p>{isolateTerm(explanation.value.meaning, embeddedTerm, termLanguage, termDirection)}</p>
      {explanation.value.example && <p>{isolateTerm(explanation.value.example, embeddedTerm, termLanguage, termDirection)}</p>}
    </div> : <p>{t(term ? 'reader.noExplanation' : 'reader.explainPlaceholder')}</p>}
  </div>;
}
