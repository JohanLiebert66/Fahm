export function localizedContent<T>(values: Record<string, T>, uiLanguage: string, packLanguage: string) {
  const language = [uiLanguage, uiLanguage.split('-')[0]!, packLanguage,
    Object.keys(values)[0]].find(key => key !== undefined && values[key] !== undefined);
  return language ? { language, value: values[language]! } : undefined;
}
