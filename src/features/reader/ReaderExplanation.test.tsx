import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { changeLanguage } from '../../i18n';
import type { FahmDatabase } from '../../storage/db';
import { readerDatabase, enPack, enItems, enText, arPack, arItems, arText } from './readerTestFixtures';
import { renderReader } from './readerTestRender';
import type { Item } from '../../core/pack/types';

let db: FahmDatabase;
beforeEach(async () => { db = await readerDatabase(); await changeLanguage('en'); });
afterEach(async () => { cleanup(); await db.delete(); });

const languageCases: { ui: 'en' | 'ar'; explain: Item['explain']; lang: string; meaning: string }[] = [
  { ui: 'en', explain: { en: { meaning: 'UI explanation' }, ar: { meaning: 'شرح تجريبي' } }, lang: 'en', meaning: 'UI explanation' },
  { ui: 'en', explain: { ar: { meaning: 'شرح تجريبي' } }, lang: 'ar', meaning: 'شرح تجريبي' },
  { ui: 'ar', explain: { fr: { meaning: 'Synthetic first explanation' } }, lang: 'fr', meaning: 'Synthetic first explanation' },
];
it.each(languageCases)('uses UI, pack, then first available explanation ($lang)', async ({ ui, explain, lang, meaning }) => {
  await changeLanguage(ui);
  await db.items.update([arPack.id, arItems[0]!.id], { explain });
  const { container } = renderReader(db, { packId: arPack.id, textId: arText.id });
  const token = await screen.findByRole('button', { name: arItems[0]!.term });
  fireEvent.click(token);
  const block = screen.getByText(meaning).closest('[lang]');
  expect(block).toHaveAttribute('lang', lang);
  expect(block).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  expect(screen.getByRole('heading', { name: arItems[0]!.term }).querySelector('bdi')).toHaveAttribute('lang', 'ar');
  expect(container.querySelector('[data-segment-text]')?.closest('[lang]')).toHaveAttribute('lang', 'ar');
  expect(container.querySelector('[data-segment-text]')?.closest('[dir]')).toHaveAttribute('dir', 'rtl');
  expect(container.querySelector('[data-reader-boxes]')).toHaveAttribute('dir', 'rtl');
  expect(container.querySelector('[data-reader-boxes]')).toHaveClass('grid', 'sm:grid-cols-2', 'text-start');
  expect(container.querySelector('[data-segment-text]')?.textContent).toBe(arText.segments[0]!.text);
  expect(screen.getByText(arText.segments[0]!.ref)).toHaveAttribute('dir', 'ltr');
  expect(screen.getByText(arText.segments[0]!.ref)).toHaveClass('isolate');
});

it('replaces the entire item explanation with the occurrence override, including language and example', async () => {
  await db.annotations.clear();
  const source = enText.segments[0]!;
  const start = source.text.indexOf(enItems[0]!.term);
  await db.annotations.add({ packId: enPack.id, textId: enText.id, segment: source.id,
    start, end: start + enItems[0]!.term.length, item: enItems[0]!.id,
    override: { explain: { ar: { meaning: 'شرح خاص تجريبي' } } } });
  renderReader(db);
  fireEvent.click(await screen.findByRole('button', { name: enItems[0]!.term }));
  expect(screen.getByText('شرح خاص تجريبي').closest('[lang]')).toHaveAttribute('lang', 'ar');
  expect(screen.queryByText(enItems[0]!.explain.en.meaning)).not.toBeInTheDocument();
  expect(screen.queryByText(enItems[0]!.explain.en.example)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: enItems[1]!.term }));
  expect(screen.getByText(enItems[1]!.explain.en.meaning)).toBeInTheDocument();
});

it('changes explanation language with UI language without changing the source', async () => {
  await db.items.update([enPack.id, enItems[0]!.id], { explain: {
    en: enItems[0]!.explain.en, ar: { meaning: 'شرح تجريبي' },
  } });
  const { container } = renderReader(db);
  fireEvent.click(await screen.findByRole('button', { name: enItems[0]!.term }));
  await act(async () => { await changeLanguage('ar'); });
  expect(screen.getByText('شرح تجريبي').closest('[lang]')).toHaveAttribute('dir', 'rtl');
  expect(container.querySelector('[data-reader-boxes]')).toHaveAttribute('dir', 'ltr');
  expect(container.querySelector('[data-segment-text]')?.textContent).toBe(enText.segments[0]!.text);
});

it('selects a whole phrase as one button without changing punctuation or whitespace', async () => {
  await db.annotations.clear();
  const source = enText.segments[0]!;
  const start = source.text.indexOf(enItems[0]!.term), end = source.text.lastIndexOf('.');
  const phrase = source.text.slice(start, end);
  await db.annotations.add({ packId: enPack.id, textId: enText.id, segment: source.id,
    start, end, item: enItems[0]!.id });
  const { container } = renderReader(db);
  const button = await screen.findByRole('button', { name: phrase });
  expect(screen.queryByRole('button', { name: enItems[1]!.term })).not.toBeInTheDocument();
  fireEvent.click(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText(enItems[0]!.explain.en.meaning)).toBeInTheDocument();
  expect(container.querySelector('[data-segment-text]')?.textContent).toBe(source.text);
});

it('isolates an embedded pack term inside an explanation in another language', async () => {
  await db.items.update([arPack.id, arItems[0]!.id], { explain: { en: {
    meaning: `Synthetic meaning of ${arItems[0]!.term}.`,
  } } });
  renderReader(db, { packId: arPack.id, textId: arText.id });
  fireEvent.click(await screen.findByRole('button', { name: arItems[0]!.term }));
  const paragraph = screen.getByText((_, element) => element?.tagName === 'P'
    && element.textContent === `Synthetic meaning of ${arItems[0]!.term}.`);
  expect(paragraph?.querySelector('bdi[lang="ar"][dir="rtl"]')).toHaveTextContent(arItems[0]!.term);
});
