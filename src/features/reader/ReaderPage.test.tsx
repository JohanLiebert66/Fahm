import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { changeLanguage } from '../../i18n';
import type { FahmDatabase } from '../../storage/db';
import { ReaderPage } from './ReaderPage';
import { readerDatabase, enPack, enItems, enText, arPack, arText } from './readerTestFixtures';
import { snapshot } from '../../../tests/storageFixtures';

let db: FahmDatabase;
function openText(packId = enPack.id, textId = enText.id) {
  return render(<MemoryRouter initialEntries={[`/read/${packId}/${textId}`]}>
    <Routes><Route path="/read/:packId/:textId" element={<ReaderPage db={db} />} /></Routes>
  </MemoryRouter>);
}
beforeEach(async () => { db = await readerDatabase(); await changeLanguage('en'); });
afterEach(async () => { cleanup(); await db.delete(); });

it('lists both imported fixture texts with pack and text titles and shows the pack id', async () => {
  render(<MemoryRouter><ReaderPage db={db} /></MemoryRouter>);
  const enLink = await screen.findByRole('link', { name: `${enPack.title.en} ${enText.title.en}` });
  expect(enLink).toHaveAttribute('href', `/read/${enPack.id}/${enText.id}`);
  expect(enLink).toHaveTextContent(enPack.id);
  const arLink = screen.getByRole('link', { name: `${arPack.title.ar} ${arText.title.en}` });
  expect(arLink).toBeInTheDocument();
  expect(arLink).toHaveTextContent(arPack.id);
});

it('selects a linked core, preserves exact source and leaves unlinked words as plain text', async () => {
  const { container } = openText();
  const token = await screen.findByRole('button', { name: enItems[0]!.term });
  expect(container.querySelector('[data-segment-text]')?.textContent).toBe(enText.segments[0]!.text);
  expect(screen.queryByRole('button', { name: 'and' })).not.toBeInTheDocument();
  expect(token).toHaveClass('min-h-[48px]', 'min-w-[48px]');
  token.focus(); expect(token).toHaveFocus();
  fireEvent.click(token);
  expect(screen.getByText(enItems[0]!.explain.en.meaning)).toBeInTheDocument();
  expect(screen.getByText(enItems[0]!.explain.en.example)).toBeInTheDocument();
  expect(token).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'Audio (not available yet)' })).toBeDisabled();
});

it.each(['pack', 'text'])('shows a friendly localized error for a missing %s', async missing => {
  await changeLanguage('ar');
  if (missing === 'pack') await db.packs.delete(enPack.id);
  else await db.texts.delete([enPack.id, enText.id]);
  openText();
  expect(await screen.findByRole('alert')).toHaveTextContent('لم تعد هذه القراءة موجودة. اختر قراءة أخرى.');
});

it('shows a localized empty picker without child import controls', async () => {
  await db.texts.clear();
  render(<MemoryRouter><ReaderPage db={db} /></MemoryRouter>);
  expect(await screen.findByText('No reading here yet. Ask a grown-up to add a pack.')).toBeInTheDocument();
  expect(screen.queryByLabelText('Choose ZIP file')).not.toBeInTheDocument();
});

it('shows loading before the data arrives and localizes storage read failures', async () => {
  db.close();
  render(<MemoryRouter><ReaderPage db={db} /></MemoryRouter>);
  expect(screen.getByRole('status')).toHaveTextContent('Getting your reading ready…');
  expect(await screen.findByRole('alert')).toHaveTextContent('We could not open your reading. Please try again.');
});

it('is read-only: choosing a word never mutates any persisted table', async () => {
  const before = await snapshot(db);
  openText();
  fireEvent.click(await screen.findByRole('button', { name: enItems[0]!.term }));
  fireEvent.click(screen.getByRole('button', { name: enItems[1]!.term }));
  expect(await snapshot(db)).toEqual(before);
});

it('handles a nonexistent deep link without crashing', async () => {
  openText('not-a-pack', 'not-a-text');
  expect(await screen.findByRole('alert')).toHaveTextContent('This reading is no longer here. Choose another one.');
  expect(screen.getByRole('link', { name: 'Choose a reading' })).toHaveAttribute('href', '/read');
});
