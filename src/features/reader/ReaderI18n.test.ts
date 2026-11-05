/// <reference types="vite/client" />
import { expect, it } from 'vitest';
import i18n from '../../i18n';

it('provides nonempty en/ar translations for every emitted reader key', () => {
  const sources = import.meta.glob<string>(['./*.ts', './*.tsx', '../../ui/ImageBox.tsx',
    '../../ui/ExplainBox.tsx', '!./*.test.ts', '!./*.test.tsx', '!./readerTest*'],
  { eager: true, query: '?raw', import: 'default' });
  const keys = new Set(Object.values(sources).flatMap(source =>
    Array.from(source.matchAll(/['"](reader\.[a-zA-Z]+)['"]/g), match => match[1]!)));
  expect(keys.size).toBeGreaterThan(8);
  for (const key of keys) for (const lng of ['en', 'ar']) {
    expect(i18n.exists(key, { lng }), `${lng}: ${key}`).toBe(true);
    expect(i18n.t(key, { lng }).trim()).not.toBe('');
    expect(i18n.t(key, { lng })).not.toBe(key);
  }
});
